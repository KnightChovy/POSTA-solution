const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Một phiên đăng nhập = 1 refresh token còn hiệu lực (hỗ trợ nhiều thiết bị).
const SessionSchema = new Schema(
  {
    token: { type: String, required: true }, // refresh token hiện hành của phiên
    device: { type: String, default: '' }, // user-agent
    ip: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const User = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // hash bcrypt
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' }, // base64 data URL
  jobTitle: { type: String, default: '' },
  company: { type: String, default: '' },
  website: { type: String, default: '' },
  address: { type: String, default: '' },
  bio: { type: String, default: '' },

  // Xác thực email
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },

  // Đặt lại mật khẩu
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },

  // Phân quyền & trạng thái
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }, // admin có thể khoá tài khoản
  provider: { type: String, enum: ['local', 'google'], default: 'local' },

  // Gói dịch vụ (phục vụ doanh thu). Là `key` của một Plan động — không ràng buộc enum
  // để có thể thêm/clone gói tuỳ ý; giá trị cũ (none/basic/pro/enterprise) vẫn đọc được.
  plan: { type: String, default: 'freemium' },

  // Đếm mức dùng AI theo kỳ (count & display, chưa chặn cứng). Reset khi qua kỳ.
  usage: {
    aiCount: { type: Number, default: 0 },
    periodStart: { type: Date, default: Date.now },
  },

  // Phiên đăng nhập + lịch sử
  sessions: { type: [SessionSchema], default: [] },
  loginHistory: {
    type: [
      {
        ip: String,
        device: String,
        at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  lastLogin: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('user', User);
