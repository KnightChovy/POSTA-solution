const bcrypt = require('bcrypt');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Post = require('../models/Post');
const Satellite = require('../models/Satellite');
const Plan = require('../models/Plan');
const { getPlanMap } = require('../../utils/plans');
const { activatePlanByTransaction, computeUsage } = require('../../utils/subscription');

const SALT_ROUNDS = 10;

// Chỉ trả các trường an toàn (không lộ password/sessions/token).
function safeUser(u) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    isAdmin: !!u.isAdmin,
    isActive: u.isActive !== false,
    isVerified: !!u.isVerified,
    plan: u.plan || 'none',
    provider: u.provider || 'local',
    lastLogin: u.lastLogin || null,
    createdAt: u.createdAt,
  };
}

// Ghi nhận doanh thu khi admin gán/đổi sang gói trả phí (coi như đã thanh toán).
async function recordPlanTransaction(userId, plan) {
  const map = await getPlanMap();
  const info = map[plan];
  const amount = info?.price || 0;
  if (amount > 0) {
    await Transaction.create({
      user: userId,
      plan,
      planName: info?.name || plan,
      amount,
      status: 'paid',
      provider: 'mock', // admin cấp trực tiếp, không qua cổng thanh toán
      paidAt: new Date(),
    });
  }
}

// GET /api/admin/stats — số liệu tổng quan + doanh thu.
const getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, verifiedUsers, adminUsers, newUsersThisMonth, totalPosts, activeSatellites] =
      await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ isActive: { $ne: false } }),
        User.countDocuments({ isVerified: true }),
        User.countDocuments({ isAdmin: true }),
        User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Post.countDocuments({}),
        Satellite.countDocuments({ status: 'ACTIVE' }),
      ]);

    // Bảng giá/nhãn gói động (từ collection plans)
    const planMap = await getPlanMap();
    const planLabels = {};
    Object.keys(planMap).forEach((key) => { planLabels[key] = planMap[key].name; });

    // Số người dùng theo gói (KHÔNG tính admin — admin không dùng gói)
    const planAgg = await User.aggregate([
      { $match: { isAdmin: { $ne: true } } },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);
    const usersByPlan = {};
    Object.keys(planMap).forEach((key) => { usersByPlan[key] = 0; });
    planAgg.forEach((p) => { usersByPlan[p._id || 'none'] = (usersByPlan[p._id || 'none'] || 0) + p.count; });

    // Doanh thu định kỳ hàng tháng (MRR) = tổng giá gói của user thường đang hoạt động
    const paidUsers = await User.find({ isActive: { $ne: false }, isAdmin: { $ne: true } }).select('plan');
    const mrr = paidUsers.reduce((sum, u) => sum + (planMap[u.plan]?.price || 0), 0);

    // Tổng doanh thu + doanh thu 6 tháng gần nhất — chỉ tính giao dịch đã thanh toán
    const totalRevenueAgg = await Transaction.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const monthsBack = 6;
    const since = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
    const revAgg = await Transaction.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' } } },
    ]);
    const revMap = {};
    revAgg.forEach((r) => { revMap[r._id] = r.total; });
    const revenueByMonth = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth.push({ month: key, total: revMap[key] || 0 });
    }

    const recentTx = await Transaction.find({ status: 'paid' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    return res.json({
      error: false,
      stats: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        adminUsers,
        newUsersThisMonth,
        totalPosts,
        activeSatellites,
        usersByPlan,
        planLabels,
        mrr,
        totalRevenue,
        revenueByMonth,
        recentTransactions: recentTx.map((t) => ({
          user: t.user ? { name: t.user.name, email: t.user.email } : null,
          plan: t.plan,
          amount: t.amount,
          createdAt: t.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('[admin] getStats error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// GET /api/admin/users?search=
const listUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.json({ error: false, users: users.map(safeUser) });
  } catch (error) {
    console.error('[admin] listUsers error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// POST /api/admin/users — cấp tài khoản mới (đã xác thực sẵn).
const createUser = async (req, res) => {
  try {
    const { name, email, password, plan = 'none', isAdmin = false } = req.body;
    if (!name || !email || !password) {
      return res.json({ error: true, message: 'Vui lòng nhập đầy đủ tên, email, mật khẩu' });
    }
    if (password.length < 6) {
      return res.json({ error: true, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.json({ error: true, message: 'Email đã tồn tại' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    // Admin không dùng gói → luôn để 'freemium' và không ghi doanh thu.
    const assignedPlan = isAdmin ? 'freemium' : plan;
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      plan: assignedPlan,
      isAdmin: !!isAdmin,
      isVerified: true, // admin cấp -> coi như đã xác thực
      isActive: true,
    });
    if (!isAdmin) await recordPlanTransaction(user._id, assignedPlan);

    return res.json({ error: false, message: 'Đã cấp tài khoản thành công', user: safeUser(user) });
  } catch (error) {
    console.error('[admin] createUser error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// PATCH /api/admin/users/:id — đổi tên/gói/quyền/khoá.
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: true, message: 'Không tìm thấy người dùng' });

    const isSelf = req.user.id === id;
    // Đổi gói KHÔNG qua đây nữa — dùng changeUserPlan (quy trình có kiểm soát).
    const { name, isAdmin, isActive } = req.body;

    if (typeof name === 'string' && name.trim()) user.name = name.trim();

    // Không cho tự bỏ quyền admin / tự khoá chính mình (tránh tự khoá lockout).
    if (typeof isAdmin === 'boolean' && !isSelf) user.isAdmin = isAdmin;
    if (typeof isActive === 'boolean' && !isSelf) user.isActive = isActive;

    await user.save();
    return res.json({ error: false, message: 'Cập nhật người dùng thành công', user: safeUser(user) });
  } catch (error) {
    console.error('[admin] updateUser error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// GET /api/admin/transactions?status=&search= — danh sách giao dịch (quản lý tiền).
const listTransactions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && ['pending', 'paid', 'failed'].includes(status)) filter.status = status;
    if (search) {
      const matched = await User.find({
        $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }],
      }).select('_id');
      filter.user = { $in: matched.map((u) => u._id) };
    }
    const txs = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('user', 'name email');

    return res.json({
      error: false,
      transactions: txs.map((t) => ({
        id: t._id.toString(),
        user: t.user ? { name: t.user.name, email: t.user.email } : null,
        plan: t.plan,
        planName: t.planName || t.plan,
        amount: t.amount,
        status: t.status,
        provider: t.provider,
        reference: t.reference || '',
        createdAt: t.createdAt,
        paidAt: t.paidAt || null,
      })),
    });
  } catch (error) {
    console.error('[admin] listTransactions error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// DELETE /api/admin/users/:id — "Xoá" = TẠM KHOÁ tài khoản (soft-lock), không xoá hẳn.
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id) {
      return res.json({ error: true, message: 'Không thể khoá chính tài khoản đang đăng nhập' });
    }
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ error: true, message: 'Không tìm thấy người dùng' });
    return res.json({ error: false, message: 'Đã tạm khoá tài khoản', user: safeUser(user) });
  } catch (error) {
    console.error('[admin] deleteUser error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// Định dạng 1 giao dịch trả về client.
function txToClient(t) {
  return {
    id: t._id.toString(),
    plan: t.plan,
    planName: t.planName || t.plan,
    amount: t.amount,
    status: t.status,
    provider: t.provider,
    reference: t.reference || '',
    note: t.note || '',
    createdAt: t.createdAt,
    paidAt: t.paidAt || null,
  };
}

// GET /api/admin/users/:id — chi tiết 1 user: thông tin + gói + usage + giao dịch.
const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: true, message: 'Không tìm thấy người dùng' });

    const [txs, postCount, websiteCount, planMap] = await Promise.all([
      Transaction.find({ user: id }).sort({ createdAt: -1 }),
      Post.countDocuments({ owner: id }),
      Satellite.countDocuments({ owner: id, status: 'ACTIVE' }),
      getPlanMap(),
    ]);

    const planInfo = planMap[user.plan];
    const plan = await Plan.findOne({ key: user.plan });
    const usage = await computeUsage(user);

    // Gói đã mua = các gói trong giao dịch đã thanh toán (không trùng).
    const purchasedPlans = [...new Set(txs.filter((t) => t.status === 'paid').map((t) => t.planName || t.plan))];

    return res.json({
      error: false,
      detail: {
        user: {
          ...safeUser(user),
          phone: user.phone || '',
          company: user.company || '',
          jobTitle: user.jobTitle || '',
          website: user.website || '',
          address: user.address || '',
          avatar: user.avatar || '',
        },
        plan: {
          key: user.plan,
          name: planInfo?.name || user.plan,
          price: planInfo?.price || 0,
          limits: plan?.limits || {},
        },
        usage,
        postCount,
        websiteCount,
        purchasedPlans,
        transactions: txs.map(txToClient),
      },
    });
  } catch (error) {
    console.error('[admin] getUserDetail error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// POST /api/admin/users/:id/plan — đổi gói cho user theo quy trình có kiểm soát.
// body: { plan, method: 'paid' | 'gift', note }
const changeUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan: planKey, method = 'paid', note } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: true, message: 'Không tìm thấy người dùng' });
    if (user.isAdmin) {
      return res.status(400).json({ error: true, message: 'Tài khoản admin không sử dụng gói dịch vụ' });
    }
    if (!note || !note.trim()) {
      return res.json({ error: true, message: 'Vui lòng nhập lý do đổi gói' });
    }
    const plan = await Plan.findOne({ key: planKey });
    if (!plan) return res.json({ error: true, message: 'Gói không tồn tại' });

    // 'paid' = đã thu tiền (ghi doanh thu theo giá gói); 'gift' = tặng/khuyến mãi (0đ).
    const amount = method === 'gift' ? 0 : plan.price;

    const tx = await Transaction.create({
      user: user._id,
      plan: plan.key,
      planName: plan.name,
      amount,
      status: 'paid',
      provider: 'manual',
      note: note.trim(),
      createdBy: req.user.id,
      paidAt: new Date(),
    });

    user.plan = plan.key;
    user.usage = { aiCount: 0, periodStart: new Date() };
    await user.save();

    return res.json({ error: false, message: `Đã đổi sang gói ${plan.name}`, transaction: txToClient(tx) });
  } catch (error) {
    console.error('[admin] changeUserPlan error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// POST /api/admin/transactions/:id/confirm — xác nhận đã nhận tiền cho giao dịch pending.
const confirmTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: true, message: 'Không tìm thấy giao dịch' });
    if (tx.status !== 'pending') {
      return res.json({ error: true, message: 'Giao dịch không ở trạng thái chờ' });
    }
    await activatePlanByTransaction(tx);
    return res.json({ error: false, message: 'Đã xác nhận thanh toán', transaction: txToClient(tx) });
  } catch (error) {
    console.error('[admin] confirmTransaction error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// POST /api/admin/transactions/:id/cancel — huỷ giao dịch pending.
const cancelTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: true, message: 'Không tìm thấy giao dịch' });
    if (tx.status !== 'pending') {
      return res.json({ error: true, message: 'Chỉ huỷ được giao dịch đang chờ' });
    }
    tx.status = 'failed';
    await tx.save();
    return res.json({ error: false, message: 'Đã huỷ giao dịch', transaction: txToClient(tx) });
  } catch (error) {
    console.error('[admin] cancelTransaction error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

module.exports = {
  getStats,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listTransactions,
  getUserDetail,
  changeUserPlan,
  confirmTransaction,
  cancelTransaction,
};
