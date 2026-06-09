const Plan = require('../models/Plan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { invalidatePlanCache } = require('../../utils/plans');
const {
  genReference,
  activatePlanByTransaction,
  computeUsage,
} = require('../../utils/subscription');

// Chuyển tên gói -> slug key (a-z 0-9 và dấu gạch ngang).
function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu tiếng Việt
    .toLowerCase()
    .replace(/đ/g, 'd')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Đảm bảo key duy nhất (thêm hậu tố -2, -3... nếu trùng).
async function uniqueKey(base) {
  let key = base || 'plan';
  let i = 1;
  while (await Plan.exists({ key })) {
    i += 1;
    key = `${base}-${i}`;
  }
  return key;
}

// Một gói có bị khóa sửa không = đã từng phát sinh giao dịch.
async function isPlanLocked(key) {
  return !!(await Transaction.exists({ plan: key }));
}

// Dựng link QR thanh toán (VietQR qua SePay) từ env. Thiếu cấu hình -> null.
function buildPaymentInfo(amount, reference) {
  const acc = process.env.SEPAY_ACCOUNT_NUMBER;
  const bank = process.env.SEPAY_BANK_CODE;
  const qrUrl = acc && bank
    ? `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${amount}&des=${encodeURIComponent(reference)}`
    : null;
  return { amount, reference, accountNumber: acc || '', bankCode: bank || '', qrUrl };
}

// ---------- Public ----------

// GET /api/plans — danh sách gói đang bán (cho landing & trang mua).
const listPublicPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isPublished: true, isArchived: false }).sort({ sortOrder: 1, price: 1 });
    return res.json({ error: false, plans });
  } catch (error) {
    console.error('[plan] listPublicPlans error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// ---------- User (cần đăng nhập) ----------

// POST /api/plans/:key/purchase — tạo giao dịch chờ thanh toán (hoặc kích hoạt ngay nếu miễn phí).
const purchasePlan = async (req, res) => {
  try {
    const { key } = req.params;
    const plan = await Plan.findOne({ key, isPublished: true, isArchived: false });
    if (!plan) return res.status(404).json({ error: true, message: 'Gói không tồn tại hoặc ngừng bán' });

    const tx = await Transaction.create({
      user: req.user.id,
      plan: plan.key,
      planName: plan.name,
      amount: plan.price,
      status: 'pending',
      provider: 'sepay',
      reference: genReference(req.user.id),
    });

    // Gói miễn phí: kích hoạt luôn, không cần thanh toán.
    if (plan.price <= 0) {
      await activatePlanByTransaction(tx);
      return res.json({ error: false, free: true, message: `Đã kích hoạt gói ${plan.name}`, plan: plan.key });
    }

    return res.json({
      error: false,
      message: 'Vui lòng chuyển khoản để hoàn tất',
      payment: buildPaymentInfo(plan.price, tx.reference),
    });
  } catch (error) {
    console.error('[plan] purchasePlan error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// GET /api/plans/me/subscription — gói hiện tại + giới hạn + mức dùng + giao dịch chờ.
const getMySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: true, message: 'Không tìm thấy người dùng' });

    const plan = await Plan.findOne({ key: user.plan });
    const usage = await computeUsage(user);
    const pending = await Transaction.findOne({ user: user._id, status: 'pending' }).sort({ createdAt: -1 });

    return res.json({
      error: false,
      subscription: {
        plan: plan ? { key: plan.key, name: plan.name, price: plan.price, limits: plan.limits } : { key: user.plan, name: user.plan, limits: {} },
        usage,
        pending: pending
          ? { reference: pending.reference, amount: pending.amount, planName: pending.planName, payment: buildPaymentInfo(pending.amount, pending.reference) }
          : null,
      },
    });
  } catch (error) {
    console.error('[plan] getMySubscription error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// ---------- Admin ----------

// GET /api/admin/plans — tất cả gói + cờ khóa + số lượt mua.
const listAdminPlans = async (req, res) => {
  try {
    const plans = await Plan.find({}).sort({ sortOrder: 1, price: 1 });
    const result = await Promise.all(
      plans.map(async (p) => {
        const purchaseCount = await Transaction.countDocuments({ plan: p.key, status: 'paid' });
        const isLocked = await isPlanLocked(p.key);
        return { ...p.toObject(), isLocked, purchaseCount };
      })
    );
    return res.json({ error: false, plans: result });
  } catch (error) {
    console.error('[plan] listAdminPlans error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// Lấy các trường gói hợp lệ từ body.
function planFieldsFromBody(body) {
  const { name, description, price, limits, sortOrder, isPublished } = body;
  const fields = {};
  if (typeof name === 'string') fields.name = name.trim();
  if (typeof description === 'string') fields.description = description;
  if (price !== undefined) fields.price = Number(price) || 0;
  if (typeof sortOrder === 'number') fields.sortOrder = sortOrder;
  if (typeof isPublished === 'boolean') fields.isPublished = isPublished;
  if (limits && typeof limits === 'object') {
    fields.limits = {
      websites: Number(limits.websites ?? 1),
      ai: Number(limits.ai ?? 0),
      aiPeriod: ['week', 'month', 'none'].includes(limits.aiPeriod) ? limits.aiPeriod : 'month',
      posts: Number(limits.posts ?? -1),
      postsPeriod: ['week', 'month', 'none'].includes(limits.postsPeriod) ? limits.postsPeriod : 'month',
    };
  }
  return fields;
}

// POST /api/admin/plans — tạo gói mới.
const createPlan = async (req, res) => {
  try {
    const fields = planFieldsFromBody(req.body);
    if (!fields.name) return res.json({ error: true, message: 'Vui lòng nhập tên gói' });

    const key = await uniqueKey(slugify(fields.name));
    const plan = await Plan.create({ ...fields, key });
    invalidatePlanCache();
    return res.json({ error: false, message: 'Đã tạo gói mới', plan });
  } catch (error) {
    console.error('[plan] createPlan error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// PATCH /api/admin/plans/:id — sửa gói; chặn nếu gói đã có giao dịch.
const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: true, message: 'Không tìm thấy gói' });

    if (await isPlanLocked(plan.key)) {
      return res.status(409).json({
        error: true,
        message: 'Gói đã phát sinh giao dịch nên không thể sửa. Hãy Clone để tạo gói mới.',
      });
    }

    Object.assign(plan, planFieldsFromBody(req.body));
    await plan.save();
    invalidatePlanCache();
    return res.json({ error: false, message: 'Đã cập nhật gói', plan });
  } catch (error) {
    console.error('[plan] updatePlan error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// POST /api/admin/plans/:id/clone — nhân bản gói thành gói mới (ẩn, sửa được).
const clonePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: true, message: 'Không tìm thấy gói' });

    const key = await uniqueKey(slugify(`${plan.name}-copy`));
    const clone = await Plan.create({
      key,
      name: `${plan.name} (bản sao)`,
      description: plan.description,
      price: plan.price,
      limits: plan.limits,
      sortOrder: plan.sortOrder,
      isPublished: false, // bản sao bắt đầu ở trạng thái ẩn để admin chỉnh trước
      isArchived: false,
    });
    invalidatePlanCache();
    return res.json({ error: false, message: 'Đã clone gói', plan: clone });
  } catch (error) {
    console.error('[plan] clonePlan error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// PATCH /api/admin/plans/:id/visibility — bật/tắt hiển thị hoặc lưu trữ (cho phép cả khi khóa).
const setPlanVisibility = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: true, message: 'Không tìm thấy gói' });

    const { isPublished, isArchived } = req.body;
    if (typeof isPublished === 'boolean') plan.isPublished = isPublished;
    if (typeof isArchived === 'boolean') {
      plan.isArchived = isArchived;
      if (isArchived) plan.isPublished = false; // archive thì luôn ẩn khỏi trang bán
    }
    await plan.save();
    invalidatePlanCache();
    return res.json({ error: false, message: 'Đã cập nhật trạng thái gói', plan });
  } catch (error) {
    console.error('[plan] setPlanVisibility error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

module.exports = {
  listPublicPlans,
  purchasePlan,
  getMySubscription,
  listAdminPlans,
  createPlan,
  updatePlan,
  clonePlan,
  setPlanVisibility,
  buildPaymentInfo,
};
