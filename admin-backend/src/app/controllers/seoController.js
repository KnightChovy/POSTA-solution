const {
  validateSeoEvaluate,
  validateSeoOptimize,
  validateSeoEvaluation,
  formatZodError,
} = require("../../utils/validationUtils");
const { evaluateSeo, optimizeSeo } = require("../../utils/seoUtils");

/**
 * SEO controller cho trình soạn bài:
 *   POST /api/seo/evaluate  -> AI chấm điểm SEO theo từ khóa (điểm + checklist)
 *   POST /api/seo/optimize  -> AI viết lại nội dung cho chuẩn SEO (giữ HTML)
 *
 * Lỗi AI gắn `code` được map sang HTTP status giống socialController:
 *   AI_CONFIG_MISSING -> 500 (cấu hình server thiếu), còn lại -> 502 (lỗi upstream).
 */

const aiHttpStatus = (code) => (code === "AI_CONFIG_MISSING" ? 500 : 502);

const evaluate = async (req, res) => {
  const parsed = validateSeoEvaluate(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      status: "failed",
      error: "Dữ liệu không hợp lệ",
      details: formatZodError(parsed.error),
    });
  }

  try {
    const { metrics, evaluation } = await evaluateSeo(parsed.data);

    // Chống output AI lệch shape trước khi trả cho client.
    const checked = validateSeoEvaluation(evaluation);
    if (!checked.success) {
      return res.status(502).json({
        status: "failed",
        error: "AI trả về kết quả không đúng định dạng",
        details: formatZodError(checked.error),
      });
    }

    return res.status(200).json({
      status: "success",
      metrics,
      evaluation: checked.data,
    });
  } catch (err) {
    return res.status(aiHttpStatus(err.code)).json({
      status: "failed",
      error: err.message,
      errorCode: err.code || "AI_ERROR",
    });
  }
};

const optimize = async (req, res) => {
  const parsed = validateSeoOptimize(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      status: "failed",
      error: "Dữ liệu không hợp lệ",
      details: formatZodError(parsed.error),
    });
  }

  try {
    const result = await optimizeSeo(parsed.data);
    return res.status(200).json({ status: "success", ...result });
  } catch (err) {
    return res.status(aiHttpStatus(err.code)).json({
      status: "failed",
      error: err.message,
      errorCode: err.code || "AI_ERROR",
    });
  }
};

module.exports = { evaluate, optimize };
