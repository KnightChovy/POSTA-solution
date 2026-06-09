const Transaction = require('../models/Transaction');
const { activatePlanByTransaction } = require('../../utils/subscription');

// POST /api/payment/sepay/webhook
// SePay gọi endpoint này khi có tiền vào tài khoản. Payload mẫu:
//   { id, gateway, transferType: 'in', transferAmount, content, code, ... }
// Ta dò mã tham chiếu (reference) trong `content` để khớp giao dịch đang chờ.
const sepayWebhook = async (req, res) => {
  try {
    // Xác thực: SePay gửi header "Authorization: Apikey <KEY>".
    const expected = process.env.SEPAY_WEBHOOK_API_KEY;
    if (expected) {
      const header = req.headers.authorization || '';
      const key = header.replace(/^Apikey\s+/i, '').trim();
      if (key !== expected) {
        return res.status(401).json({ success: false, message: 'Sai API key' });
      }
    }

    const { content = '', transferAmount, transferType } = req.body || {};
    // Chỉ xử lý tiền vào.
    if (transferType && transferType !== 'in') {
      return res.json({ success: true, skipped: 'không phải giao dịch tiền vào' });
    }

    // Tìm reference trong nội dung chuyển khoản (dạng POSTA...).
    const match = String(content).toUpperCase().match(/POSTA[A-Z0-9]+/);
    if (!match) {
      return res.json({ success: true, skipped: 'không tìm thấy mã tham chiếu' });
    }
    const reference = match[0];

    const tx = await Transaction.findOne({ reference, status: 'pending' });
    if (!tx) {
      return res.json({ success: true, skipped: 'không khớp giao dịch chờ' });
    }
    // TODO SePay: bật kiểm tra số tiền nghiêm ngặt khi lên production.
    if (transferAmount != null && Number(transferAmount) < tx.amount) {
      return res.json({ success: true, skipped: 'số tiền chưa đủ' });
    }

    // Lưu vết giao dịch SePay để đối soát (id + số tiền thực nhận).
    tx.providerTxId = String(req.body.id || '');
    tx.paidAmount = transferAmount != null ? Number(transferAmount) : tx.amount;

    await activatePlanByTransaction(tx); // hàm này tự set status='paid' + save tx
    return res.json({ success: true, message: 'Đã kích hoạt gói' });
  } catch (error) {
    console.error('[payment] sepayWebhook error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// POST /api/payment/dev-confirm/:reference
// Chỉ dùng ở môi trường dev để giả lập webhook (test luồng mua gói không cần CK thật).
const devConfirm = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: true, message: 'Không khả dụng ở production' });
    }
    const tx = await Transaction.findOne({ reference: req.params.reference, status: 'pending' });
    if (!tx) return res.status(404).json({ error: true, message: 'Không tìm thấy giao dịch chờ' });

    await activatePlanByTransaction(tx);
    return res.json({ error: false, message: 'Đã xác nhận thanh toán (giả lập)', plan: tx.plan });
  } catch (error) {
    console.error('[payment] devConfirm error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// GET /api/payment/history — lịch sử giao dịch của chính user đang đăng nhập.
const getMyTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json({
      error: false,
      transactions: txs.map((t) => ({
        id: t._id,
        plan: t.plan,
        planName: t.planName || t.plan,
        amount: t.amount,
        paidAmount: t.paidAmount ?? null,
        status: t.status,
        provider: t.provider,
        reference: t.reference,
        paidAt: t.paidAt || null,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('[payment] getMyTransactions error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

module.exports = { sepayWebhook, devConfirm, getMyTransactions };
