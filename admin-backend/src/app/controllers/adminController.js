const bcrypt = require('bcrypt');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Post = require('../models/Post');
const Satellite = require('../models/Satellite');
const { planPrice, PLAN_LABELS } = require('../../utils/plans');

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

// Ghi nhận doanh thu khi gán/đổi sang gói trả phí.
async function recordPlanTransaction(userId, plan) {
  const amount = planPrice(plan);
  if (amount > 0) {
    await Transaction.create({ user: userId, plan, amount });
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

    // Số người dùng theo gói
    const planAgg = await User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]);
    const usersByPlan = { none: 0, basic: 0, pro: 0, enterprise: 0 };
    planAgg.forEach((p) => { if (p._id in usersByPlan) usersByPlan[p._id] = p.count; });

    // Doanh thu định kỳ hàng tháng (MRR) = tổng giá gói của user đang hoạt động
    const paidUsers = await User.find({ isActive: { $ne: false }, plan: { $ne: 'none' } }).select('plan');
    const mrr = paidUsers.reduce((sum, u) => sum + planPrice(u.plan), 0);

    // Tổng doanh thu + doanh thu 6 tháng gần nhất (từ Transaction)
    const totalRevenueAgg = await Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const monthsBack = 6;
    const since = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
    const revAgg = await Transaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
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

    const recentTx = await Transaction.find({})
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
        planLabels: PLAN_LABELS,
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
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      plan,
      isAdmin: !!isAdmin,
      isVerified: true, // admin cấp -> coi như đã xác thực
      isActive: true,
    });
    await recordPlanTransaction(user._id, plan);

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
    const { name, plan, isAdmin, isActive } = req.body;

    if (typeof name === 'string' && name.trim()) user.name = name.trim();

    if (typeof plan === 'string' && plan !== user.plan) {
      user.plan = plan;
      await recordPlanTransaction(user._id, plan); // ghi doanh thu nếu là gói trả phí
    }

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

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id) {
      return res.json({ error: true, message: 'Không thể xoá chính tài khoản đang đăng nhập' });
    }
    await User.findByIdAndDelete(id);
    return res.json({ error: false, message: 'Đã xoá người dùng' });
  } catch (error) {
    console.error('[admin] deleteUser error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

module.exports = { getStats, listUsers, createUser, updateUser, deleteUser };
