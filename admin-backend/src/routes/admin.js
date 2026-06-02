const express = require('express');
const router = express.Router();
const {
  getStats,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../app/controllers/adminController');
const authenticateJWT = require('../middleware/AuthenticateJWT');
const { requireAdmin } = authenticateJWT;

// Tất cả route admin yêu cầu đăng nhập + quyền admin.
router.use(authenticateJWT, requireAdmin);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
