const Plan = require('../../app/models/Plan');

// 4 gói mặc định. Chỉ seed khi collection rỗng (idempotent) — sau đó admin tự quản lý.
// Quy ước limits: -1 = không giới hạn.
const DEFAULT_PLANS = [
  {
    key: 'freemium',
    name: 'Freemium',
    description: 'Dùng thử miễn phí 3 lần đăng và 3 lần dùng AI mỗi tháng.',
    price: 0,
    limits: { websites: 1, ai: 3, aiPeriod: 'month', posts: 3, postsPeriod: 'month' },
    isPublished: true,
    sortOrder: 1,
  },
  {
    key: 'starter',
    name: 'Starter',
    description: 'Liên kết tối đa 5 website, 5 lần dùng AI mỗi tuần.',
    price: 299000,
    limits: { websites: 5, ai: 5, aiPeriod: 'week', posts: -1, postsPeriod: 'week' },
    isPublished: true,
    sortOrder: 2,
  },
  {
    key: 'professional',
    name: 'Professional',
    description: 'Liên kết tối đa 15 website, 15 lần dùng AI mỗi tuần.',
    price: 699000,
    limits: { websites: 15, ai: 15, aiPeriod: 'week', posts: -1, postsPeriod: 'week' },
    isPublished: true,
    sortOrder: 3,
  },
  {
    key: 'professional-premium',
    name: 'Professional Premium',
    description: 'Không giới hạn website và số lần dùng AI.',
    price: 999000,
    limits: { websites: -1, ai: -1, aiPeriod: 'none', posts: -1, postsPeriod: 'none' },
    isPublished: true,
    sortOrder: 4,
  },
];

async function seedPlans() {
  try {
    const count = await Plan.countDocuments({});
    if (count > 0) return; // đã có gói, không seed lại
    await Plan.insertMany(DEFAULT_PLANS);
    console.log('Đã seed 4 gói dịch vụ mặc định');
  } catch (error) {
    console.error('Seed gói dịch vụ thất bại:', error.message);
  }
}

module.exports = { seedPlans, DEFAULT_PLANS };
