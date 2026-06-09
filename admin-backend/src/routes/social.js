const express = require("express");
const router = express.Router();
const { paraphrase } = require("../app/controllers/socialController");

// AI paraphrase for social posting (consumed by the n8n workflow).
// POST /api/social/paraphrase  { content, platform, language?, tone? }
router.post("/paraphrase", paraphrase);

module.exports = router;
