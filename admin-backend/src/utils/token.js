const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

// Secret cho refresh tách riêng access để lộ 1 cái không kéo theo cái kia.
function refreshSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
}

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret(), { expiresIn: REFRESH_TTL });
}

// Trả về cặp token mới cho một user.
// Refresh token thêm "jti" ngẫu nhiên để luôn duy nhất (kể cả khi cấp trong cùng 1 giây),
// đảm bảo rotation: refresh cũ chắc chắn khác refresh mới.
function generateTokens(user) {
  const base = { id: user._id.toString(), email: user.email };
  return {
    accessToken: generateAccessToken({ ...base, isAdmin: !!user.isAdmin }),
    refreshToken: generateRefreshToken({
      ...base,
      jti: crypto.randomBytes(16).toString('hex'),
    }),
  };
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret());
}

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
};
