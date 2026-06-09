const User = require('../app/models/User');
const Plan = require('../app/models/Plan');
const Satellite = require('../app/models/Satellite');
const Post = require('../app/models/Post');
const Transaction = require('../app/models/Transaction');
const { sendPlanActivatedEmail } = require('./mailer');

// Mốc bắt đầu kỳ hiện tại theo loại kỳ (để đếm/đặt lại quota).
function startOfPeriod(period, now = new Date()) {
  if (period === 'week') {
    const d = new Date(now);
    const day = (d.getDay() + 6) % 7; // thứ 2 = 0
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day);
    return d;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(0); // 'none' → không reset
}

// Sinh mã đối soát duy nhất ghi vào nội dung chuyển khoản (chữ + số, dễ khớp).
function genReference(userId) {
  const short = String(userId).slice(-6).toUpperCase();
  return `POSTA${short}${Date.now().toString(36).toUpperCase()}`;
}

// Kích hoạt gói cho 1 giao dịch đã thanh toán. Idempotent (bỏ qua nếu đã paid).
async function activatePlanByTransaction(tx) {
  if (!tx || tx.status === 'paid') return tx;
  tx.status = 'paid';
  tx.paidAt = new Date();
  await tx.save();

  const user = await User.findById(tx.user);
  if (user) {
    user.plan = tx.plan;
    user.usage = { aiCount: 0, periodStart: new Date() }; // bắt đầu kỳ mới
    await user.save();

    // Gửi email thông báo đăng ký gói thành công (best-effort, không chặn kích hoạt).
    try {
      await sendPlanActivatedEmail(user.email, user.name, tx.planName || tx.plan, tx.amount);
    } catch (e) {
      console.error('[subscription] sendPlanActivatedEmail:', e.message);
    }
  }
  return tx;
}

// Tính mức sử dụng hiện tại của user so với giới hạn gói (count & display).
async function computeUsage(user) {
  const plan = await Plan.findOne({ key: user.plan });
  const limits = plan?.limits || {};

  const websites = await Satellite.countDocuments({ owner: user._id, status: 'ACTIVE' });

  const postsPeriodStart = startOfPeriod(limits.postsPeriod || 'month');
  const posts = await Post.countDocuments({ owner: user._id, createdAt: { $gte: postsPeriodStart } });

  // AI: nếu kỳ ghi trong usage đã cũ hơn mốc kỳ hiện tại thì coi như 0.
  const aiBoundary = startOfPeriod(limits.aiPeriod || 'month');
  const aiUsed = user.usage?.periodStart && user.usage.periodStart >= aiBoundary ? user.usage.aiCount || 0 : 0;

  return {
    websites: { used: websites, limit: limits.websites ?? -1 },
    ai: { used: aiUsed, limit: limits.ai ?? -1, period: limits.aiPeriod || 'month' },
    posts: { used: posts, limit: limits.posts ?? -1, period: limits.postsPeriod || 'month' },
  };
}

// Tăng đếm AI cho user (gọi khi tạo bài có dùng AI). Tự reset khi qua kỳ.
async function incrementAiUsage(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  const plan = await Plan.findOne({ key: user.plan });
  const boundary = startOfPeriod(plan?.limits?.aiPeriod || 'month');
  if (!user.usage?.periodStart || user.usage.periodStart < boundary) {
    user.usage = { aiCount: 1, periodStart: new Date() };
  } else {
    user.usage.aiCount = (user.usage.aiCount || 0) + 1;
  }
  await user.save();
}

module.exports = {
  startOfPeriod,
  genReference,
  activatePlanByTransaction,
  computeUsage,
  incrementAiUsage,
};
