const express = require('express');
const router = express.Router();
const { saveImageToServer } = require('../app/controllers/imageController');

router.post('/upload', saveImageToServer);

module.exports = router;