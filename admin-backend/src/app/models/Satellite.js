const mongoose = require('mongoose');
const Category = require('./Category');
const Schema = mongoose.Schema;

const Satellite = new Schema({
  url: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  category: { type: [Schema.Types.ObjectId], ref: 'category', required: false },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  owner: { type: Schema.Types.ObjectId, ref: 'user' }, // chủ sở hữu (đếm quota website theo user)
});

module.exports = mongoose.model('satellite', Satellite);