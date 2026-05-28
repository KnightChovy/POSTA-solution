const express = require('express');
const router = express.Router();
const { getAllCategories, addNewCategory } = require('../app/controllers/categoryController');

router.get('/', getAllCategories);
router.post('/', addNewCategory);


module.exports = router;