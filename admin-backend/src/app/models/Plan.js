const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Giới hạn của một gói. Quy ước: -1 = không giới hạn.
const LimitsSchema = new Schema(
  {
    websites: { type: Number, default: 1 }, // số website vệ tinh tối đa
    ai: { type: Number, default: 0 }, // số lần dùng AI mỗi kỳ
    aiPeriod: { type: String, enum: ['week', 'month', 'none'], default: 'month' },
    posts: { type: Number, default: -1 }, // số bài đăng mỗi kỳ
    postsPeriod: { type: String, enum: ['week', 'month', 'none'], default: 'month' },
  },
  { _id: false }
);

// Gói dịch vụ động — admin tạo/sửa/clone. `key` là định danh ổn định để liên kết
// với User.plan và Transaction.plan (thay vì ObjectId, giữ tương thích dữ liệu cũ).
const Plan = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 }, // VND / kỳ
    billingPeriod: { type: String, enum: ['month'], default: 'month' },
    limits: { type: LimitsSchema, default: () => ({}) },
    isPublished: { type: Boolean, default: false }, // hiển thị trên landing + cho mua
    isArchived: { type: Boolean, default: false }, // ẩn khỏi danh sách bán (gói cũ sau khi clone)
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('plan', Plan);
