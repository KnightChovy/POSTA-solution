const express = require('express');
const router = express.Router();
const {
  uploadImageReturnUrl,
} = require('../app/controllers/imageController');
const upload = require('../config/file/upload');

// Upload 1 ảnh -> trả về { url, path }. Editor chèn url này thẳng vào <img>.
router.post('/upload', upload.single('image'), uploadImageReturnUrl);

module.exports = router;
