const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Giao dịch doanh thu — tạo khi user mua gói (chờ thanh toán) hoặc admin gán gói.
// `plan` lưu key của gói; `planName` là snapshot tên gói lúc mua (giữ lịch sử khi gói
// bị clone/đổi tên). Doanh thu chỉ tính các giao dịch status = 'paid'.
const Transaction = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  plan: { type: String, required: true }, // key của Plan
  planName: { type: String, default: '' },
  amount: { type: Number, required: true }, // VND
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  provider: { type: String, enum: ['sepay', 'mock', 'manual'], default: 'sepay' },
  reference: { type: String, index: true }, // mã đối soát ghi trong nội dung chuyển khoản
  note: { type: String, default: '' }, // lý do khi admin cấp/đổi gói thủ công (audit)
  createdBy: { type: Schema.Types.ObjectId, ref: 'user' }, // admin thực hiện (nếu là thao tác thủ công)
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('transaction', Transaction);
