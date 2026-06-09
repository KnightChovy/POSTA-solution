const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  googleLogin,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  getSessions,
  revokeSession,
} = require('../app/controllers/authController');
const { getProfile, updateProfile } = require('../app/controllers/profileController');
const authenticateJWT = require('../middleware/AuthenticateJWT');

// Public
router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Cần đăng nhập
router.get('/me', authenticateJWT, getProfile);
router.patch('/profile', authenticateJWT, updateProfile);
router.post('/change-password', authenticateJWT, changePassword);
router.get('/sessions', authenticateJWT, getSessions);
router.delete('/sessions/:id', authenticateJWT, revokeSession);

module.exports = router;
