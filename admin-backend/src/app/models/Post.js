const mongoose = require('mongoose')

const ErrorSatellite = new mongoose.Schema({
  satelliteId: { type: mongoose.Schema.Types.ObjectId, ref: 'satellite' },
  errorCode: { type: Number, required: true },
})

const Post = new mongoose.Schema({
  title: { type: String, required: false },
  content: { type: String, required: false },
  totalSatellite: {
    type: Number,
    required: false
  },
  postedSatellite: {
    type: [String],
    required: false
  },
  errorSatellite: {
    type: [ErrorSatellite],
    required: false
  },
  successfulRate: {
    type: Number,
    required: false,
  },
  imagePath: {
    type: [String],
    required: false,
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('post', Post)