const { z } = require("zod");

/**
 * Validation schemas for the generate-and-publish pipeline.
 * - campaignSchema: validates the incoming marketing request body.
 * - aiOutputSchema: validates the JSON returned by the AI model.
 *
 * Using safeParse keeps validation non-throwing so the controller can return
 * structured 400/502 responses instead of crashing.
 */

const mediaSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional().default(""),
});

const targetSchema = z.object({
  platform: z.string().min(1),
  wordpressSite: z.string().min(1),
  wordpressCategoryId: z.number().int().positive().optional(),
  status: z
    .enum(["publish", "draft", "pending", "future", "private"])
    .default("draft"),
});

const propertySchema = z.object({
  title: z.string().min(1),
  type: z.string().optional(),
  location: z.string().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  area: z.union([z.string(), z.number()]).optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  description: z.string().optional().default(""),
});

const campaignSchema = z.object({
  campaignName: z.string().min(1),
  language: z.string().default("vi"),
  property: propertySchema,
  media: z.array(mediaSchema).default([]),
  targets: z.array(targetSchema).min(1, "At least one target is required"),
  tone: z.string().optional().default("professional"),
  cta: z.string().optional().default(""),
});

/**
 * Validates the social paraphrase request body (n8n -> Express).
 * One source article -> one platform-native paraphrased post.
 */
const socialParaphraseSchema = z.object({
  content: z.string().min(1, "content is required"),
  platform: z.string().min(1).default("twitter"),
  language: z.string().default("vi"),
  tone: z.string().optional().default("professional"),
});

const variationSchema = z.object({
  platform: z.string(),
  title: z.string(),
  body: z.string(),
  hashtags: z.array(z.string()).default([]),
  cta: z.string().default(""),
  imageUrls: z.array(z.string()).default([]),
});

const aiOutputSchema = z.object({
  masterContent: z.object({
    title: z.string(),
    summary: z.string().default(""),
    body: z.string(),
    hashtags: z.array(z.string()).default([]),
    cta: z.string().default(""),
  }),
  variations: z.array(variationSchema).min(1),
});

/**
 * Validates the SEO evaluate/optimize request bodies (editor -> Express).
 * Cả hai đều cần `content` (HTML) và `keyword` (từ khóa chính).
 */
const seoEvaluateSchema = z.object({
  title: z.string().optional().default(""),
  content: z.string().min(1, "content is required"),
  // Để trống thì AI tự nhận diện từ khóa chính từ tiêu đề + nội dung.
  keyword: z.string().optional().default(""),
  language: z.string().default("vi"),
});

const seoOptimizeSchema = seoEvaluateSchema.extend({
  // Danh sách lỗi từ lần chấm trước để AI tối ưu trúng đích (tùy chọn).
  issues: z.array(z.string()).optional().default([]),
});

/** Validate object đánh giá SEO do AI trả về (chống output lệch shape). */
const seoEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  grade: z.string().default(""),
  // Từ khóa AI đã dùng để chấm (do người dùng nhập hoặc AI tự nhận diện).
  keyword: z.string().default(""),
  summary: z.string().default(""),
  checks: z
    .array(
      z.object({
        label: z.string(),
        status: z.enum(["pass", "warn", "fail"]),
        detail: z.string().default(""),
      })
    )
    .min(1),
  suggestions: z.array(z.string()).default([]),
});

/**
 * Flatten a ZodError into a compact, version-agnostic list of issues.
 * Avoids relying on .flatten()/.treeify() which differ between zod v3 and v4.
 */
const formatZodError = (error) =>
  (error.issues || []).map((issue) => ({
    path: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path),
    message: issue.message,
  }));

const validateCampaignInput = (data) => campaignSchema.safeParse(data);
const validateAiOutput = (data) => aiOutputSchema.safeParse(data);
const validateSocialParaphrase = (data) => socialParaphraseSchema.safeParse(data);
const validateSeoEvaluate = (data) => seoEvaluateSchema.safeParse(data);
const validateSeoOptimize = (data) => seoOptimizeSchema.safeParse(data);
const validateSeoEvaluation = (data) => seoEvaluationSchema.safeParse(data);

module.exports = {
  campaignSchema,
  aiOutputSchema,
  socialParaphraseSchema,
  seoEvaluateSchema,
  seoOptimizeSchema,
  seoEvaluationSchema,
  validateCampaignInput,
  validateAiOutput,
  validateSocialParaphrase,
  validateSeoEvaluate,
  validateSeoOptimize,
  validateSeoEvaluation,
  formatZodError,
};
