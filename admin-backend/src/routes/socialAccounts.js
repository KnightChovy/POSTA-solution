const express = require("express");
const router = express.Router();
const authenticateJWT = require("../middleware/AuthenticateJWT");
const {
  getFacebookAuthUrl,
  facebookCallback,
} = require("../app/controllers/socialAccountController");

// Lấy URL dialog OAuth — yêu cầu đăng nhập (để biết owner gắn vào state).
router.get("/facebook/auth-url", authenticateJWT, getFacebookAuthUrl);

// Facebook redirect về đây sau khi user cấp quyền — PUBLIC (không có Bearer),
// danh tính user lấy từ state đã ký.
router.get("/facebook/callback", facebookCallback);

module.exports = router;
