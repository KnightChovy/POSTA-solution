const crypto = require('crypto');
const bcrypt = require('bcrypt');
const axios = require('axios');
const User = require('../models/User');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
} = require('../../utils/mailer');
const { generateTokens, verifyRefreshToken } = require('../../utils/token');

const SALT_ROUNDS = 10;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h
const MAX_LOGIN_HISTORY = 10;

const randomToken = () => crypto.randomBytes(32).toString('hex');

function clientInfo(req) {
  const device = req.headers['user-agent'] || '';
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '';
  return { device, ip };
}

// Lấy/tạo bản ghi cho tài khoản admin cấu hình trong .env.
async function getOrCreateAdminUser() {
  const email = process.env.APP_USERNAME;
  let admin = await User.findOne({ email });
  if (!admin) {
    const hashed = await bcrypt.hash(process.env.APP_PASSWORD || 'admin', SALT_ROUNDS);
    admin = await User.create({
      name: 'Quản trị viên',
      email,
      password: hashed,
      isVerified: true,
      isAdmin: true,
    });
  }
  return admin;
}

// Cấp cặp token + mở 1 phiên mới (lưu refresh token theo từng thiết bị).
async function issueTokens(user, req) {
  const tokens = generateTokens(user);
  const { device, ip } = clientInfo(req);
  user.sessions.push({ token: tokens.refreshToken, device, ip });
  await user.save();
  return tokens;
}

// ---------- Đăng ký / xác thực email ----------
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({ error: true, message: 'Vui lòng nhập đầy đủ thông tin' });
    }
    if (password.length < 6) {
      return res.json({ error: true, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.json({ error: true, message: 'Email đã được đăng ký' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const token = randomToken();
    await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      verificationToken: token,
      verificationTokenExpires: new Date(Date.now() + VERIFY_TTL_MS),
    });

    try {
      await sendVerificationEmail(normalizedEmail, name, token);
    } catch (e) {
      console.error('[auth] send verify mail:', e.message);
    }
    return res.json({
      error: false,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
    });
  } catch (error) {
    console.error('[auth] Register error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.json({ error: true, message: 'Thiếu mã xác thực' });

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.json({ error: true, message: 'Liên kết xác thực không hợp lệ' });
    if (user.isVerified) return res.json({ error: false, message: 'Tài khoản đã được xác thực trước đó' });
    if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
      return res.json({ error: true, expired: true, message: 'Liên kết xác thực đã hết hạn. Vui lòng gửi lại email xác thực.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    try { await sendWelcomeEmail(user.email, user.name); } catch (e) { console.error('[auth] welcome mail:', e.message); }
    return res.json({ error: false, message: 'Xác thực email thành công!' });
  } catch (error) {
    console.error('[auth] Verify email error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ error: true, message: 'Vui lòng nhập email' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.json({ error: true, message: 'Không tìm thấy tài khoản với email này' });
    if (user.isVerified) return res.json({ error: false, message: 'Tài khoản đã được xác thực, bạn có thể đăng nhập.' });

    user.verificationToken = randomToken();
    user.verificationTokenExpires = new Date(Date.now() + VERIFY_TTL_MS);
    await user.save();
    try { await sendVerificationEmail(user.email, user.name, user.verificationToken); } catch (e) { console.error('[auth] resend mail:', e.message); }
    return res.json({ error: false, message: 'Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.' });
  } catch (error) {
    console.error('[auth] Resend verification error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// ---------- Đăng nhập / token ----------
function publicUser(user) {
  return { name: user.name, email: user.email, isAdmin: !!user.isAdmin, plan: user.plan, avatar: user.avatar };
}

async function finishLogin(user, req, res) {
  if (!user.isActive) {
    return res.json({ error: true, message: 'Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.' });
  }
  user.lastLogin = new Date();
  const { device, ip } = clientInfo(req);
  user.loginHistory.unshift({ device, ip, at: new Date() });
  if (user.loginHistory.length > MAX_LOGIN_HISTORY) user.loginHistory = user.loginHistory.slice(0, MAX_LOGIN_HISTORY);
  const tokens = await issueTokens(user, req); // cũng save user
  return res.json({ error: false, message: 'Đăng nhập thành công', ...tokens, user: publicUser(user) });
}

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ error: true, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Tài khoản admin trong .env
    if (username === process.env.APP_USERNAME && password === process.env.APP_PASSWORD) {
      const admin = await getOrCreateAdminUser();
      return finishLogin(admin, req, res);
    }

    const user = await User.findOne({ email: username.toLowerCase().trim() });
    if (!user) return res.json({ error: true, message: 'Thông tin đăng nhập không chính xác' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ error: true, message: 'Sai mật khẩu' });
    if (!user.isVerified) {
      return res.json({ error: true, needVerify: true, message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email hoặc gửi lại liên kết xác thực.' });
    }
    return finishLogin(user, req, res);
  } catch (error) {
    console.error('[auth] Login error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// POST /api/auth/google — đăng nhập bằng Google (verify id_token credential).
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.json({ error: true, message: 'Đăng nhập Google chưa được cấu hình trên máy chủ.' });
    }
    if (!credential) return res.json({ error: true, message: 'Thiếu thông tin đăng nhập Google' });

    // Xác minh id_token với Google (không cần thư viện ngoài).
    const { data } = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: credential },
    });
    if (data.aud !== clientId) {
      return res.json({ error: true, message: 'Token Google không hợp lệ' });
    }

    const email = (data.email || '').toLowerCase();
    if (!email) return res.json({ error: true, message: 'Không lấy được email từ Google' });

    let user = await User.findOne({ email });
    if (!user) {
      const hashed = await bcrypt.hash(randomToken(), SALT_ROUNDS); // mật khẩu ngẫu nhiên
      user = await User.create({
        name: data.name || email,
        email,
        password: hashed,
        avatar: data.picture || '',
        isVerified: true,
        provider: 'google',
      });
    }
    return finishLogin(user, req, res);
  } catch (error) {
    console.error('[auth] Google login error:', error?.response?.data || error.message);
    return res.status(401).json({ error: true, message: 'Đăng nhập Google thất bại' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ error: true, message: 'Thiếu refresh token' });

    let decoded;
    try { decoded = verifyRefreshToken(token); }
    catch { return res.status(401).json({ error: true, message: 'Refresh token không hợp lệ hoặc đã hết hạn' }); }

    const user = await User.findById(decoded.id);
    const session = user?.sessions.find((s) => s.token === token);
    if (!user || !session) {
      return res.status(401).json({ error: true, message: 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: true, message: 'Tài khoản đã bị khoá' });
    }

    // Rotation: cấp cặp mới, thay token của đúng phiên đó.
    const tokens = generateTokens(user);
    session.token = tokens.refreshToken;
    session.lastUsedAt = new Date();
    await user.save();
    return res.json({ error: false, ...tokens, user: publicUser(user) });
  } catch (error) {
    console.error('[auth] Refresh token error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await User.updateOne({ _id: decoded.id }, { $pull: { sessions: { token } } });
      } catch { /* token hỏng -> coi như đã đăng xuất */ }
    }
    return res.json({ error: false, message: 'Đã đăng xuất' });
  } catch (error) {
    return res.json({ error: false, message: 'Đã đăng xuất' });
  }
};

// ---------- Mật khẩu ----------
// POST /api/auth/change-password (cần đăng nhập)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.json({ error: true, message: 'Vui lòng nhập đầy đủ mật khẩu' });
    }
    if (newPassword.length < 6) {
      return res.json({ error: true, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: true, message: 'Không tìm thấy người dùng' });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.json({ error: true, message: 'Mật khẩu hiện tại không đúng' });

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
    return res.json({ error: false, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('[auth] Change password error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// POST /api/auth/forgot-password — gửi email link đặt lại mật khẩu.
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ error: true, message: 'Vui lòng nhập email' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Luôn trả thành công để không lộ email nào tồn tại.
    if (user) {
      user.passwordResetToken = randomToken();
      user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
      await user.save();
      try { await sendResetPasswordEmail(user.email, user.name, user.passwordResetToken); }
      catch (e) { console.error('[auth] reset mail:', e.message); }
    }
    return res.json({ error: false, message: 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.' });
  } catch (error) {
    console.error('[auth] Forgot password error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// POST /api/auth/reset-password — đặt lại mật khẩu bằng token.
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.json({ error: true, message: 'Thiếu thông tin' });
    if (newPassword.length < 6) return res.json({ error: true, message: 'Mật khẩu phải có ít nhất 6 ký tự' });

    const user = await User.findOne({ passwordResetToken: token });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.json({ error: true, message: 'Liên kết đặt lại đã hết hạn hoặc không hợp lệ' });
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.sessions = []; // đăng xuất mọi phiên cũ cho an toàn
    await user.save();
    return res.json({ error: false, message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.' });
  } catch (error) {
    console.error('[auth] Reset password error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// ---------- Phiên đăng nhập ----------
// GET /api/auth/sessions
const getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: true, message: 'Không tìm thấy người dùng' });
    const sessions = user.sessions.map((s) => ({
      id: s._id.toString(),
      device: s.device,
      ip: s.ip,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
    }));
    return res.json({
      error: false,
      sessions,
      loginHistory: user.loginHistory,
    });
  } catch (error) {
    console.error('[auth] Get sessions error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

// DELETE /api/auth/sessions/:id — thu hồi 1 phiên.
const revokeSession = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $pull: { sessions: { _id: req.params.id } } });
    return res.json({ error: false, message: 'Đã thu hồi phiên đăng nhập' });
  } catch (error) {
    console.error('[auth] Revoke session error:', error);
    return res.status(500).json({ error: true, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
};

module.exports = {
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
};
