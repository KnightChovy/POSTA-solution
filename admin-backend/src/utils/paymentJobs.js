const Transaction = require('../app/models/Transaction');

// Giao dịch chờ thanh toán quá ngưỡng này (phút) mà chưa 'paid' thì tự hủy.
// Đổi qua env PAYMENT_PENDING_TTL_MINUTES nếu muốn (mặc định 1 phút).
const TTL_MINUTES = Number(process.env.PAYMENT_PENDING_TTL_MINUTES) || 1;
// Chu kỳ quét (ms). Quét mỗi 30s để hủy kịp thời quanh mốc TTL.
const CHECK_INTERVAL_MS = 30 * 1000;

// Hủy mọi giao dịch 'pending' đã tạo lâu hơn TTL_MINUTES.
async function cancelStalePendingTransactions() {
  const threshold = new Date(Date.now() - TTL_MINUTES * 60 * 1000);
  const result = await Transaction.updateMany(
    { status: 'pending', createdAt: { $lte: threshold } },
    { $set: { status: 'cancelled' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[cron] Đã hủy ${result.modifiedCount} giao dịch chờ quá ${TTL_MINUTES} phút.`);
  }
  return result.modifiedCount;
}

// Bật job: chạy ngay 1 lần rồi lặp theo CHECK_INTERVAL_MS.
function startCancelStalePaymentsJob() {
  const run = () =>
    cancelStalePendingTransactions().catch((e) =>
      console.error('[cron] cancelStalePending:', e.message)
    );
  run();
  setInterval(run, CHECK_INTERVAL_MS);
  console.log(
    `[cron] Bật job hủy giao dịch chờ > ${TTL_MINUTES} phút (quét mỗi ${CHECK_INTERVAL_MS / 1000}s).`
  );
}

module.exports = { startCancelStalePaymentsJob, cancelStalePendingTransactions };
