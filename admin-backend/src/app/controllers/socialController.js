const {
  validateSocialParaphrase,
  formatZodError,
} = require("../../utils/validationUtils");
const { paraphraseForSocial } = require("../../utils/createVariations");

/**
 * Social paraphrase controller (called by the n8n workflow).
 *
 * Flow: n8n Webhook -> POST /api/social/paraphrase -> AI rewrites the source
 * article into one platform-native post -> n8n posts the returned `text` to the
 * social platform (Twitter/X first).
 *
 * Returns the post fields at the top level so the n8n HTTP node can map them
 * directly (e.g. {{ $json.text }}) without digging into a nested object.
 */
const paraphrase = async (req, res) => {
  // 1. Validate request body
  const parsed = validateSocialParaphrase(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      status: "failed",
      error: "Invalid request body",
      details: formatZodError(parsed.error),
    });
  }

  // 2. Generate the paraphrased, platform-native post
  try {
    const result = await paraphraseForSocial(parsed.data);
    return res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (err) {
    const httpStatus = err.code === "AI_CONFIG_MISSING" ? 500 : 502;
    return res.status(httpStatus).json({
      status: "failed",
      error: err.message,
      errorCode: err.code || "AI_ERROR",
    });
  }
};

module.exports = { paraphrase };
