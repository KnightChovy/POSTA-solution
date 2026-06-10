const mongoose = require('mongoose');
const Category = require('./Category');
const Schema = mongoose.Schema;

const Satellite = new Schema({
  // Nền tảng đăng bài của vệ tinh. Mặc định WORDPRESS để tương thích dữ liệu cũ.
  platform: { type: String, enum: ['WORDPRESS', 'TWITTER', 'FACEBOOK'], default: 'WORDPRESS' },
  // WordPress: cần url + username + Application Password.
  // Để optional ở schema, việc bắt buộc theo từng platform do controller kiểm tra.
  url: { type: String },
  username: { type: String },
  password: { type: String },
  // Twitter/Facebook: lưu credential dạng key-value
  //   TWITTER  → apiKey, apiSecret, accessToken, accessSecret
  //   FACEBOOK → pageId, pageAccessToken
  credentials: { type: Map, of: String, default: {} },
  category: { type: [Schema.Types.ObjectId], ref: 'category', required: false },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  owner: { type: Schema.Types.ObjectId, ref: 'user' }, // chủ sở hữu (đếm quota website theo user)
});

module.exports = mongoose.model('satellite', Satellite);