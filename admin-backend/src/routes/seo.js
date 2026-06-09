const express = require("express");
const router = express.Router();
const { evaluate, optimize } = require("../app/controllers/seoController");

// Đánh giá & tối ưu SEO cho nội dung trong trình soạn bài.
// POST /api/seo/evaluate  { title?, content, keyword, language? }
// POST /api/seo/optimize  { title?, content, keyword, language?, issues? }
router.post("/evaluate", evaluate);
router.post("/optimize", optimize);

module.exports = router;
