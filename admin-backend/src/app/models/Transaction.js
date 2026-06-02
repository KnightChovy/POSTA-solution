const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Giao dịch doanh thu — tạo khi gán/đổi gói cho người dùng.
const Transaction = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  plan: { type: String, enum: ['basic', 'pro', 'enterprise'], required: true },
  amount: { type: Number, required: true }, // VND
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('transaction', Transaction);
