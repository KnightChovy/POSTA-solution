const mongoose = require('mongoose')
const schema = mongoose.Schema
const Category = new schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
})
module.exports = mongoose.model('category', Category)