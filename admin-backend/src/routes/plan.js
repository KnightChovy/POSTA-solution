const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/AuthenticateJWT');
const {
  listPublicPlans,
  purchasePlan,
  getMySubscription,
} = require('../app/controllers/planController');

// Công khai: danh sách gói đang bán (landing).
router.get('/', listPublicPlans);

// Cần đăng nhập: mua gói + xem gói hiện tại.
router.get('/me/subscription', authenticateJWT, getMySubscription);
router.post('/:key/purchase', authenticateJWT, purchasePlan);

module.exports = router;
