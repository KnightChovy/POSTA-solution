const OpenAI = require('openai');
require("dotenv").config();

// --- AI config for the campaign generation pipeline (provider-agnostic) ---
// DeepSeek, OpenAI and most providers expose an OpenAI-compatible chat API,
// so we reuse the already-installed `openai` SDK and just swap the base URL.
const AI_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com';
const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat';
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 60000);

let _aiClient;
const getAiClient = () => {
  if (!AI_API_KEY) {
    const err = new Error(
      'Missing AI API key (set DEEPSEEK_API_KEY or OPENAI_API_KEY)'
    );
    err.code = 'AI_CONFIG_MISSING';
    throw err;
  }
  if (!_aiClient) {
    _aiClient = new OpenAI({
      apiKey: AI_API_KEY,
      baseURL: AI_BASE_URL,
      timeout: AI_TIMEOUT_MS,
    });
  }
  return _aiClient;
};


const createVariations = async (inputContent) => {
  try {
    const prompt = `
    Bạn là chuyên gia biên tập nội dung marketing bất động sản.
    Nhiệm vụ của bạn: viết lại toàn bộ phần nội dung VĂN BẢN trong bài viết tôi cung cấp, tạo ra một phiên bản mới hoàn toàn, câu chữ khác nhưng giữ nguyên thông điệp và thông tin.

    YÊU CẦU QUAN TRỌNG:
    1. Tuyệt đối GIỮ NGUYÊN và KHÔNG THAY ĐỔI:
      - Bất kỳ thẻ HTML nào: <img>, <figure>, <a>, <iframe>, <picture>, <strong>, <em>, <h2>, <h3>, <p>, <ul>, <li>, ...
      - Vị trí xuất hiện của các thẻ HTML.
      - Nội dung trong thuộc tính HTML (src, alt, href, width, height…).

    2. Chỉ được phép viết lại phần text bên ngoài HTML tags:
      - Viết lại câu văn khác hoàn toàn bản gốc.
      - Thay đổi cấu trúc câu, từ ngữ, thể hiện sáng tạo.
      - Giữ nguyên ý nghĩa, không thêm thông tin không có trong bài.
      - Không được làm mất định dạng HTML.

    3. Văn phong:
      - Chuyên nghiệp, trau chuốt, phù hợp lĩnh vực bất động sản.
      - Dễ đọc, mạch lạc, có tính marketing nhẹ nhàng.

    4. Định dạng trả về:
      - Xuất ra toàn bộ bài viết hoàn chỉnh dưới dạng HTML (giống cấu trúc bài gốc).
      - Tuyệt đối không giải thích gì thêm.
      - Không được wrap nội dung trong <code> hoặc Markdown.

    ---

    ĐÂY LÀ NỘI DUNG BÀI GỐC:
    ${inputContent}
  `;
    // Dùng chung client AI (DeepSeek/OpenAI-compatible) như các pipeline khác —
    // trước đây hàm này gọi thẳng OpenAI + OPENAI_API_KEY (không có trong .env)
    // nên đăng lên site thứ 2 trở đi luôn lỗi 401.
    const client = getAiClient();
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const content = completion?.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI trả về nội dung rỗng");
    return content;
  } catch (error) {
    console.error("Lỗi khi tạo biến thể nội dung:", error.message);
    throw error;
  }
};

/**
 * Strip Markdown code fences (```json ... ```) the model may wrap JSON in,
 * and trim to the outermost {...} block to make JSON.parse robust.
 */
const extractJson = (raw) => {
  let text = String(raw).trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }
  return text;
};

/**
 * Build a strict prompt instructing the model to return JSON-only content,
 * with one variation per requested platform.
 */
const buildCampaignPrompt = (input) => {
  const { campaignName, language, property, media = [], targets = [], tone, cta } = input;

  const platforms = [...new Set(targets.map((t) => t.platform))];
  const mediaUrls = media.map((m) => m.url);

  const system = [
    "You are an expert real-estate marketing copywriter.",
    "You ALWAYS reply with a single valid JSON object and nothing else.",
    "Do not include Markdown, code fences, or explanations.",
  ].join(" ");

  const user = `
Write marketing content for the following real-estate campaign and return it as JSON ONLY.

Language: ${language}
Tone: ${tone}
Campaign name: ${campaignName}
Call to action (use/refine this): ${cta || "(none provided)"}

Property:
${JSON.stringify(property, null, 2)}

Available image URLs (use them in imageUrls, do not invent new ones):
${JSON.stringify(mediaUrls, null, 2)}

Create one tailored variation for EACH of these platforms: ${JSON.stringify(platforms)}.
Adapt length, style and hashtags to each platform while keeping the same core facts.

Return JSON that EXACTLY matches this shape:
{
  "masterContent": {
    "title": "string",
    "summary": "string",
    "body": "string",
    "hashtags": ["string"],
    "cta": "string"
  },
  "variations": [
    {
      "platform": "string (one of: ${platforms.join(", ")})",
      "title": "string",
      "body": "string",
      "hashtags": ["string"],
      "cta": "string",
      "imageUrls": ["string"]
    }
  ]
}

Rules:
- Output JSON only. No prose, no code fences.
- "variations" must contain exactly one item per requested platform.
- Use only the provided image URLs in "imageUrls".
- Write all human-readable text in language "${language}".
`.trim();

  return { system, user };
};

/**
 * Generate master marketing content + per-platform variations from a validated
 * campaign input. Returns the parsed (but not yet schema-validated) AI object;
 * the caller is expected to validate it with validateAiOutput().
 *
 * Throws errors tagged with a `code` so the controller can map them to the
 * right HTTP status:
 *   AI_CONFIG_MISSING | AI_REQUEST_FAILED | AI_EMPTY | AI_INVALID_JSON
 */
const generateCampaignContent = async (input) => {
  const client = getAiClient();
  const { system, user } = buildCampaignPrompt(input);

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });
  } catch (error) {
    // Covers network errors, timeouts (APIConnectionTimeoutError) and API errors.
    const err = new Error(`AI request failed: ${error.message}`);
    err.code = "AI_REQUEST_FAILED";
    throw err;
  }

  const raw = completion?.choices?.[0]?.message?.content;
  if (!raw) {
    const err = new Error("AI returned an empty response");
    err.code = "AI_EMPTY";
    throw err;
  }

  try {
    return JSON.parse(extractJson(raw));
  } catch (error) {
    const err = new Error("AI returned invalid JSON");
    err.code = "AI_INVALID_JSON";
    throw err;
  }
};

// --- Social paraphrase pipeline (n8n -> Express -> AI) ---------------------
// n8n calls this to turn one source article into a fresh, platform-native post.
// Each platform gets a DIFFERENT rewrite so the same content is not duplicated
// verbatim across channels (avoids duplicate-content / SEO penalties).

const SOCIAL_PLATFORMS = {
  twitter: { label: "Twitter/X", maxChars: 280, hashtagCount: 3 },
  x: { label: "Twitter/X", maxChars: 280, hashtagCount: 3 },
  threads: { label: "Threads", maxChars: 500, hashtagCount: 5 },
  facebook: { label: "Facebook", maxChars: 2000, hashtagCount: 5 },
  linkedin: { label: "LinkedIn", maxChars: 2000, hashtagCount: 5 },
};

const DEFAULT_PLATFORM = { label: "social media", maxChars: 1000, hashtagCount: 5 };

// Bảng named entity Latin-1 thường gặp trong nội dung tiếng Việt do
// TinyMCE/WordPress sinh ra (á = &aacute;, ô = &ocirc;, ...). Trước đây stripHtml
// thay MỌI entity bằng dấu cách nên "Sài Gòn" thành "S i G n" — khiến text gửi AI
// bị mất dấu và AI tưởng là lỗi chính tả. Giờ ta DECODE đúng thay vì xóa.
const NAMED_ENTITIES = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  agrave: "à", aacute: "á", acirc: "â", atilde: "ã", auml: "ä",
  egrave: "è", eacute: "é", ecirc: "ê", euml: "ë",
  igrave: "ì", iacute: "í", icirc: "î", iuml: "ï",
  ograve: "ò", oacute: "ó", ocirc: "ô", otilde: "õ", ouml: "ö",
  ugrave: "ù", uacute: "ú", ucirc: "û", uuml: "ü",
  yacute: "ý", yuml: "ÿ", ntilde: "ñ", ccedil: "ç",
  Agrave: "À", Aacute: "Á", Acirc: "Â", Atilde: "Ã", Auml: "Ä",
  Egrave: "È", Eacute: "É", Ecirc: "Ê", Euml: "Ë",
  Igrave: "Ì", Iacute: "Í", Icirc: "Î", Iuml: "Ï",
  Ograve: "Ò", Oacute: "Ó", Ocirc: "Ô", Otilde: "Õ", Ouml: "Ö",
  Ugrave: "Ù", Uacute: "Ú", Ucirc: "Û", Uuml: "Ü",
  Yacute: "Ý", Ntilde: "Ñ", Ccedil: "Ç",
  ndash: "–", mdash: "—", hellip: "…", deg: "°", sup2: "²", sup3: "³",
  times: "×", divide: "÷", laquo: "«", raquo: "»", bull: "•",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

/** Giải mã entity dạng số (&#7921; / &#x1EF1;) và dạng tên (&agrave;). */
const decodeEntities = (str) =>
  String(str)
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => {
      try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return m; }
    })
    .replace(/&#(\d+);/g, (m, d) => {
      try { return String.fromCodePoint(parseInt(d, 10)); } catch (e) { return m; }
    })
    .replace(/&([A-Za-z][A-Za-z0-9]*);/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name)
        ? NAMED_ENTITIES[name]
        : m
    );

/** Bỏ thẻ HTML + GIẢI MÃ entity để model nhận được prose tiếng Việt đúng dấu. */
const stripHtml = (html = "") =>
  decodeEntities(
    String(html)
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();

/** Hard cap the final post so it can never exceed the platform limit. */
const truncate = (text, max) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

/**
 * Paraphrase a source article into one platform-native social post.
 * Returns { platform, text, hashtags, charCount } where `text` is ready to post
 * (paraphrased body + hashtags appended, already within the char limit).
 *
 * Throws errors tagged with `code` so the controller maps them to HTTP status:
 *   AI_CONFIG_MISSING | AI_REQUEST_FAILED | AI_EMPTY | AI_INVALID_JSON
 */
const paraphraseForSocial = async ({
  content,
  platform = "twitter",
  language = "vi",
  tone = "professional",
}) => {
  const client = getAiClient();
  const key = String(platform).toLowerCase();
  const cfg = SOCIAL_PLATFORMS[key] || DEFAULT_PLATFORM;
  const source = stripHtml(content);

  const system = [
    `You are an expert social-media copywriter for ${cfg.label}.`,
    "You ALWAYS reply with a single valid JSON object and nothing else.",
    "No Markdown, no code fences, no explanations.",
  ].join(" ");

  const user = `
Rewrite (paraphrase) the source article below into ONE fresh ${cfg.label} post.

HARD RULES:
- Write in language "${language}" with a ${tone} tone.
- Completely rephrase — different wording and sentence structure from the source,
  but keep the same core facts and message. Do NOT copy sentences verbatim
  (this post must not duplicate the original for SEO reasons).
- The "text" field MUST be at most ${cfg.maxChars} characters INCLUDING hashtags.
- Add up to ${cfg.hashtagCount} relevant hashtags at the end of "text".
- Native style for ${cfg.label}: hook first, concise, engaging.
- Do not invent prices, links or facts that are not in the source.

SOURCE ARTICLE:
"""
${source}
"""

Return JSON EXACTLY in this shape:
{ "text": "the full post including hashtags", "hashtags": ["#tag1", "#tag2"] }
`.trim();

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    });
  } catch (error) {
    const err = new Error(`AI request failed: ${error.message}`);
    err.code = "AI_REQUEST_FAILED";
    throw err;
  }

  const raw = completion?.choices?.[0]?.message?.content;
  if (!raw) {
    const err = new Error("AI returned an empty response");
    err.code = "AI_EMPTY";
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch (error) {
    const err = new Error("AI returned invalid JSON");
    err.code = "AI_INVALID_JSON";
    throw err;
  }

  const text = truncate(String(parsed.text || "").trim(), cfg.maxChars);
  const hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];

  return {
    platform: key,
    text,
    hashtags,
    charCount: text.length,
    maxChars: cfg.maxChars,
  };
};

module.exports = {
  createVariations,
  generateCampaignContent,
  paraphraseForSocial,
  // Tái dùng cho seoUtils.js: client AI (DeepSeek/OpenAI-compatible), model
  // mặc định và helper bỏ thẻ HTML — giữ một nguồn cấu hình duy nhất.
  getAiClient,
  AI_MODEL,
  stripHtml,
};
