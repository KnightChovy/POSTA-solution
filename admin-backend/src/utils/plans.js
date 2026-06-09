const Plan = require('../app/models/Plan');

// Bảng giá/nhãn gói lấy động từ collection `plans`. Cache nhẹ trong RAM để
// các thống kê (adminController) không phải query lặp; làm mới sau TTL ngắn.
let _cache = null;
let _cachedAt = 0;
const TTL_MS = 30 * 1000;

// Trả về map { key: { name, price } } cho mọi gói (kể cả đã archive) để tra cứu lịch sử.
async function getPlanMap() {
  const now = Date.now();
  if (_cache && now - _cachedAt < TTL_MS) return _cache;
  const plans = await Plan.find({}).select('key name price');
  const map = {};
  plans.forEach((p) => {
    map[p.key] = { name: p.name, price: p.price };
  });
  _cache = map;
  _cachedAt = now;
  return map;
}

// Xoá cache khi admin tạo/sửa/clone gói (gọi sau khi ghi DB).
function invalidatePlanCache() {
  _cache = null;
  _cachedAt = 0;
}

async function planPrice(key) {
  const map = await getPlanMap();
  return map[key]?.price || 0;
}

async function planLabel(key) {
  const map = await getPlanMap();
  return map[key]?.name || key || 'Chưa có gói';
}

module.exports = { getPlanMap, invalidatePlanCache, planPrice, planLabel };
