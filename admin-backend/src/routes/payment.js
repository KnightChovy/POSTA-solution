const express = require('express');
const router = express.Router();
const { sepayWebhook, devConfirm } = require('../app/controllers/paymentController');

// Webhook SePay gọi từ server SePay (không qua JWT). Tự xác thực bằng API key.
router.post('/sepay/webhook', sepayWebhook);

// Giả lập webhook ở môi trường dev (controller tự chặn khi production).
router.post('/dev-confirm/:reference', devConfirm);

module.exports = router;
