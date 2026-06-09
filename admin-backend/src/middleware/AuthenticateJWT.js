const { verifyAccessToken } = require('../utils/token');

// Bảo vệ route: yêu cầu access token hợp lệ ở header "Authorization: Bearer <token>".
const authenticateJWT = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: true, message: 'Chưa đăng nhập' });
    }
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, email: decoded.email, isAdmin: !!decoded.isAdmin };
    next();
  } catch (error) {
    return res.status(401).json({ error: true, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Chỉ cho phép quản trị viên.
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: true, message: 'Bạn không có quyền truy cập' });
  }
  next();
};

module.exports = authenticateJWT;
module.exports.requireAdmin = requireAdmin;
