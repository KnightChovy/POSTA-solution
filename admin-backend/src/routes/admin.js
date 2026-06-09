const express = require('express');
const router = express.Router();
const {
  getStats,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listTransactions,
  getUserDetail,
  changeUserPlan,
  confirmTransaction,
  cancelTransaction,
} = require('../app/controllers/adminController');
const {
  listAdminPlans,
  createPlan,
  updatePlan,
  clonePlan,
  setPlanVisibility,
} = require('../app/controllers/planController');
const authenticateJWT = require('../middleware/AuthenticateJWT');
const { requireAdmin } = authenticateJWT;

// Tất cả route admin yêu cầu đăng nhập + quyền admin.
router.use(authenticateJWT, requireAdmin);

router.get('/stats', getStats);
router.get('/transactions', listTransactions);
router.post('/transactions/:id/confirm', confirmTransaction);
router.post('/transactions/:id/cancel', cancelTransaction);
router.get('/users', listUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id', updateUser);
router.post('/users/:id/plan', changeUserPlan);
router.delete('/users/:id', deleteUser);

// Quản lý gói dịch vụ
router.get('/plans', listAdminPlans);
router.post('/plans', createPlan);
router.patch('/plans/:id', updatePlan);
router.post('/plans/:id/clone', clonePlan);
router.patch('/plans/:id/visibility', setPlanVisibility);

module.exports = router;
