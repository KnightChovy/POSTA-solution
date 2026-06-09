const {
  validateCampaignInput,
  validateAiOutput,
  formatZodError,
} = require("../../utils/validationUtils");
const { generateCampaignContent } = require("../../utils/createVariations");
const { getWordPressSite } = require("../../config/wpSites");
const { postToSatellite } = require("../../apis/post");

/**
 * Campaign pipeline controller:
 *   validate -> generate AI content -> validate AI output ->
 *   publish each target to WordPress (continue on failure) -> structured result.
 */

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const formatHashtags = (hashtags = []) =>
  hashtags
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h.replace(/\s+/g, "")}`))
    .join(" ");

/**
 * Build the HTML body sent to WordPress from a single variation.
 * Falls back to the campaign media list when the AI omits image URLs.
 */
const buildHtmlContent = (variation, media = []) => {
  const parts = [];

  if (variation.body) {
    const paragraphs = variation.body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    paragraphs.forEach((p) => parts.push(`<p>${escapeHtml(p)}</p>`));
  }

  const imageUrls =
    variation.imageUrls && variation.imageUrls.length
      ? variation.imageUrls
      : media.map((m) => m.url);

  imageUrls.forEach((url, i) => {
    const alt = escapeHtml(media[i]?.alt || variation.title || "");
    parts.push(`<figure><img src="${url}" alt="${alt}" /></figure>`);
  });

  const tags = formatHashtags(variation.hashtags);
  if (tags) parts.push(`<p>${escapeHtml(tags)}</p>`);

  if (variation.cta) parts.push(`<p><strong>${escapeHtml(variation.cta)}</strong></p>`);

  return parts.join("\n");
};

/** Turn a publishing error into a clear, secret-free message. */
const normalizeWpError = (err) => {
  if (err.response) {
    const status = err.response.status;
    if (status === 401 || status === 403) {
      return "WordPress API authentication failed";
    }
    const wpMessage = err.response.data && err.response.data.message;
    return wpMessage
      ? `WordPress API error (${status}): ${wpMessage}`
      : `WordPress API error (status ${status})`;
  }
  if (err.code === "ECONNABORTED" || /timeout/i.test(err.message || "")) {
    return "WordPress request timed out";
  }
  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    return "Could not reach WordPress site";
  }
  // Config errors from getWordPressSite() land here with a descriptive message.
  return err.message || "Unknown WordPress publishing error";
};

const generateAndPublish = async (req, res) => {
  // 1. Validate request body
  const parsed = validateCampaignInput(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      status: "failed",
      error: "Invalid request body",
      details: formatZodError(parsed.error),
    });
  }
  const input = parsed.data;

  // 2. Generate AI content
  let aiContent;
  try {
    aiContent = await generateCampaignContent(input);
  } catch (err) {
    const httpStatus = err.code === "AI_CONFIG_MISSING" ? 500 : 502;
    return res.status(httpStatus).json({
      campaignName: input.campaignName,
      status: "failed",
      error: err.message,
      errorCode: err.code || "AI_ERROR",
    });
  }

  // 3. Validate AI output schema
  const aiParsed = validateAiOutput(aiContent);
  if (!aiParsed.success) {
    return res.status(502).json({
      campaignName: input.campaignName,
      status: "failed",
      error: "AI output schema mismatch",
      details: formatZodError(aiParsed.error),
    });
  }
  const { masterContent, variations } = aiParsed.data;

  // 4. Publish to each target — one failure must not stop the others.
  const results = [];
  for (const target of input.targets) {
    const base = {
      platform: target.platform,
      wordpressSite: target.wordpressSite,
    };

    try {
      const variation =
        variations.find(
          (v) => v.platform.toLowerCase() === target.platform.toLowerCase()
        ) || { ...masterContent, platform: target.platform, imageUrls: [] };

      const site = getWordPressSite(target.wordpressSite); // throws if not configured

      const wpPost = {
        title: variation.title || masterContent.title,
        content: buildHtmlContent(variation, input.media),
        status: target.status,
      };
      if (target.wordpressCategoryId) {
        wpPost.categories = [target.wordpressCategoryId];
      }

      const response = await postToSatellite(site, wpPost);

      results.push({
        ...base,
        success: true,
        postId: response.data?.id,
        url: response.data?.link,
        status: response.data?.status,
      });
    } catch (err) {
      results.push({
        ...base,
        success: false,
        error: normalizeWpError(err),
      });
    }
  }

  // 5. Aggregate result
  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.length - successCount;
  const status =
    failedCount === 0
      ? "success"
      : successCount === 0
      ? "failed"
      : "partial_success";

  return res.status(status === "failed" ? 502 : 200).json({
    campaignName: input.campaignName,
    status,
    summary: {
      total: results.length,
      success: successCount,
      failed: failedCount,
    },
    results,
  });
};

module.exports = { generateAndPublish };
