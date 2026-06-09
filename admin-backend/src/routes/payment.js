const express = require('express');
const router = express.Router();
const { sepayWebhook, devConfirm, getMyTransactions } = require('../app/controllers/paymentController');
const authenticateJWT = require('../middleware/AuthenticateJWT');

// Webhook SePay gọi từ server SePay (không qua JWT). Tự xác thực bằng API key.
router.post('/sepay/webhook', sepayWebhook);

// Giả lập webhook ở môi trường dev (controller tự chặn khi production).
router.post('/dev-confirm/:reference', devConfirm);

// Lịch sử thanh toán của user đang đăng nhập.
router.get('/history', authenticateJWT, getMyTransactions);

module.exports = router;
