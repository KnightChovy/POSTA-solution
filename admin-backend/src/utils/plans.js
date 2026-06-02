// Bảng giá gói dịch vụ (đồng/tháng) — khớp với trang Landing.
const PLAN_PRICES = {
  none: 0,
  basic: 199000,
  pro: 499000,
  enterprise: 999000,
};

const PLAN_LABELS = {
  none: 'Chưa có gói',
  basic: 'Cơ bản',
  pro: 'Trung bình',
  enterprise: 'Nâng cao',
};

function planPrice(plan) {
  return PLAN_PRICES[plan] || 0;
}

module.exports = { PLAN_PRICES, PLAN_LABELS, planPrice };
