const { getAiClient, AI_MODEL, stripHtml } = require("./createVariations");

// --- Đánh giá & tối ưu SEO theo từ khóa chính -----------------------------
// evaluateSeo: các tiêu chí KHÁCH QUAN (từ khóa trong tiêu đề, mật độ, số từ,
//   heading, ảnh alt, liên kết) và ĐIỂM do code tính trực tiếp từ metric — luôn
//   nhất quán với số liệu hiển thị, không để AI "tự phán số". AI chỉ lo phần cần
//   hiểu ngôn ngữ: nhận diện từ khóa (khi để trống), nhận xét, gợi ý, độ dễ đọc.
// optimizeSeo: nhờ AI viết lại nội dung cho chuẩn SEO, GIỮ NGUYÊN mọi thẻ HTML.

/** Đếm số lần cụm từ khóa xuất hiện trong text (không phân biệt hoa/thường). */
const countOccurrences = (text, keyword) => {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return 0;
  const haystack = text.toLowerCase();
  let count = 0;
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) break;
    count += 1;
    from = idx + needle.length;
  }
  return count;
};

/**
 * Đo các chỉ số SEO khách quan từ HTML + từ khóa. Trả về số liệu thô để vừa dựng
 * checklist khách quan, vừa trả về client cho minh bạch.
 */
const analyzeContent = ({ title = "", content = "", keyword = "" }) => {
  const text = stripHtml(content);
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const occurrences = countOccurrences(text, keyword);
  // Mật độ ~ số lần xuất hiện / tổng số từ. Làm tròn 2 chữ số (%).
  const density = wordCount
    ? Number(((occurrences / wordCount) * 100).toFixed(2))
    : 0;

  const kw = keyword.trim().toLowerCase();
  const firstParagraph = stripHtml(
    (content.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [, ""])[1]
  );

  return {
    wordCount,
    keyword,
    keywordOccurrences: occurrences,
    keywordDensity: density, // %
    keywordInTitle: kw ? title.toLowerCase().includes(kw) : false,
    keywordInFirstParagraph: kw ? firstParagraph.toLowerCase().includes(kw) : false,
    titleLength: title.length,
    h2Count: (content.match(/<h2[\s>]/gi) || []).length,
    h3Count: (content.match(/<h3[\s>]/gi) || []).length,
    imageCount: (content.match(/<img[\s>]/gi) || []).length,
    imagesMissingAlt: (
      content.match(/<img(?![^>]*\salt\s*=\s*["'][^"']+["'])[^>]*>/gi) || []
    ).length,
    linkCount: (content.match(/<a[\s>]/gi) || []).length,
  };
};

/** Bỏ ```json ... ``` mà model có thể bọc quanh JSON cho JSON.parse an toàn. */
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

/** Quy đổi điểm số sang xếp loại hiển thị. */
const gradeFromScore = (s) =>
  s >= 80 ? "Tốt" : s >= 60 ? "Khá" : s >= 40 ? "Trung bình" : "Yếu";

/** Tính điểm từ chính các tiêu chí đang hiển thị: pass=1, warn=0.5, fail=0. */
const scoreFromChecks = (checks) => {
  if (!checks.length) return 0;
  const w = { pass: 1, warn: 0.5, fail: 0 };
  const got = checks.reduce((s, c) => s + (w[c.status] ?? 0), 0);
  return Math.round((got / checks.length) * 100);
};

/**
 * Dựng các tiêu chí SEO KHÁCH QUAN trực tiếp từ metric (không nhờ AI) để điểm và
 * checklist luôn nhất quán với số liệu đo được.
 */
const buildObjectiveChecks = (m) => {
  const hasKeyword = !!m.keyword;

  // Mật độ từ khóa: 0.5-2.5% tốt; ngoài khoảng gần đó là cảnh báo; còn lại kém.
  let densityStatus = "fail";
  if (m.keywordDensity >= 0.5 && m.keywordDensity <= 2.5) densityStatus = "pass";
  else if (m.keywordDensity > 0 && m.keywordDensity <= 3.5) densityStatus = "warn";

  return [
    {
      label: "Từ khóa trong tiêu đề",
      status: !hasKeyword ? "warn" : m.keywordInTitle ? "pass" : "fail",
      detail: !hasKeyword
        ? "Chưa xác định được từ khóa."
        : m.keywordInTitle
        ? `Tiêu đề có chứa "${m.keyword}".`
        : `Tiêu đề chưa chứa "${m.keyword}".`,
    },
    {
      label: "Từ khóa trong đoạn mở đầu",
      status: !hasKeyword ? "warn" : m.keywordInFirstParagraph ? "pass" : "fail",
      detail: m.keywordInFirstParagraph
        ? "Đoạn mở đầu có chứa từ khóa."
        : "Đoạn mở đầu chưa có từ khóa.",
    },
    {
      label: "Mật độ từ khóa",
      status: !hasKeyword ? "warn" : densityStatus,
      detail: `Mật độ ${m.keywordDensity}% (${m.keywordOccurrences} lần / ${m.wordCount} từ). Lý tưởng 0.5-2.5%.`,
    },
    {
      label: "Độ dài nội dung",
      status: m.wordCount >= 300 ? "pass" : m.wordCount >= 150 ? "warn" : "fail",
      detail:
        m.wordCount >= 300
          ? `${m.wordCount} từ, đạt yêu cầu tối thiểu 300 từ.`
          : `${m.wordCount} từ, nên tăng lên tối thiểu 300 từ.`,
    },
    {
      label: "Cấu trúc heading",
      status: m.h2Count >= 1 ? "pass" : "warn",
      detail: `Có ${m.h2Count} thẻ H2 và ${m.h3Count} thẻ H3.`,
    },
    {
      label: "Ảnh có thuộc tính alt",
      status:
        m.imageCount === 0 ? "warn" : m.imagesMissingAlt === 0 ? "pass" : "warn",
      detail:
        m.imageCount === 0
          ? "Bài chưa có ảnh."
          : m.imagesMissingAlt === 0
          ? `${m.imageCount} ảnh đều có alt mô tả.`
          : `${m.imagesMissingAlt}/${m.imageCount} ảnh thiếu thuộc tính alt.`,
    },
    {
      label: "Liên kết",
      status: m.linkCount >= 1 ? "pass" : "warn",
      detail:
        m.linkCount >= 1
          ? `Có ${m.linkCount} liên kết trong bài.`
          : "Chưa có liên kết nào (nên thêm liên kết nội bộ/ngoại).",
    },
  ];
};

const VALID_STATUS = new Set(["pass", "warn", "fail"]);

/**
 * Một lần gọi AI lo phần cần "hiểu ngôn ngữ": nhận diện từ khóa (nếu chưa có),
 * nhận xét tổng quan, gợi ý cải thiện và đánh giá độ tự nhiên/dễ đọc. KHÔNG để AI
 * tự tính chỉ số khách quan (đã có buildObjectiveChecks lo).
 *
 * Ném lỗi gắn `code`: AI_REQUEST_FAILED | AI_EMPTY | AI_INVALID_JSON
 */
const aiAssist = async (client, { title, content, keyword, language }) => {
  const source = stripHtml(content);

  const system = [
    "Bạn là chuyên gia biên tập SEO.",
    "Bạn LUÔN trả về DUY NHẤT một object JSON hợp lệ, không kèm giải thích.",
    "Không Markdown, không code fence.",
  ].join(" ");

  const user = `
Phân tích bài viết và trả về JSON.

${keyword
  ? `Từ khóa chính (người dùng cung cấp): "${keyword}"`
  : `Từ khóa chính: CHƯA CÓ — hãy TỰ NHẬN DIỆN từ khóa chính (một cụm 2-4 từ) từ tiêu đề + nội dung.`}
Tiêu đề: "${title}"
Ngôn ngữ: ${language}

NỘI DUNG (đã bỏ thẻ HTML):
"""
${source}
"""

Nhiệm vụ:
- Nhận xét tổng quan (1-2 câu) về chất lượng SEO/nội dung.
- Đánh giá ĐỘ TỰ NHIÊN/DỄ ĐỌC và VĂN PHONG của câu chữ (phần cần hiểu ngôn ngữ).
- Đưa các gợi ý cải thiện cụ thể, sát nội dung.
KHÔNG cần chấm: từ khóa trong tiêu đề, mật độ, số từ, số heading, ảnh alt, liên kết
— hệ thống tự đo các mục này.

Trả về JSON ĐÚNG shape (mọi text bằng tiếng Việt):
{
  "keyword": "<từ khóa chính>",
  "summary": "<1-2 câu nhận xét tổng quan>",
  "qualitativeChecks": [
    { "label": "Tính tự nhiên và dễ đọc", "status": "pass|warn|fail", "detail": "<nhận xét>" }
  ],
  "suggestions": ["<gợi ý cụ thể>", "..."]
}

Quy tắc: chỉ JSON, không văn xuôi, không code fence.`.trim();

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
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

  // Lọc/chuẩn hóa qualitativeChecks để khớp schema (status hợp lệ).
  const qualitativeChecks = (
    Array.isArray(parsed.qualitativeChecks) ? parsed.qualitativeChecks : []
  )
    .filter((c) => c && c.label)
    .map((c) => ({
      label: String(c.label),
      status: VALID_STATUS.has(c.status) ? c.status : "warn",
      detail: String(c.detail || ""),
    }));

  return {
    keyword: String(parsed.keyword || "").trim(),
    summary: String(parsed.summary || "").trim(),
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.map(String)
      : [],
    qualitativeChecks,
  };
};

/**
 * Chấm điểm SEO: tiêu chí khách quan + điểm do CODE tính từ metric (luôn nhất
 * quán với số liệu); AI lo nhận diện từ khóa + nhận xét + gợi ý + độ dễ đọc.
 * Trả về { metrics, evaluation }.
 *
 * Ném lỗi gắn `code`: AI_CONFIG_MISSING | AI_REQUEST_FAILED | AI_EMPTY | AI_INVALID_JSON
 */
const evaluateSeo = async ({ title = "", content, keyword = "", language = "vi" }) => {
  const client = getAiClient();

  const ai = await aiAssist(client, {
    title,
    content,
    keyword: keyword.trim(),
    language,
  });
  const usedKeyword = keyword.trim() || ai.keyword || "";

  // Đo metric + tiêu chí khách quan theo đúng từ khóa đã dùng.
  const metrics = analyzeContent({ title, content, keyword: usedKeyword });
  const checks = [...buildObjectiveChecks(metrics), ...ai.qualitativeChecks];
  const score = scoreFromChecks(checks);

  const evaluation = {
    score,
    grade: gradeFromScore(score),
    keyword: usedKeyword,
    summary: ai.summary,
    checks,
    suggestions: ai.suggestions,
  };

  return { metrics, evaluation };
};

/**
 * AI viết lại nội dung cho chuẩn SEO theo từ khóa chính, GIỮ NGUYÊN mọi thẻ HTML
 * và vị trí ảnh — chỉ tối ưu phần chữ + tiêu đề. Trả về { title, content }.
 *
 * Ném lỗi gắn `code` giống evaluateSeo để controller map HTTP status.
 */
const optimizeSeo = async ({
  title = "",
  content,
  keyword = "",
  language = "vi",
  issues = [],
}) => {
  const client = getAiClient();

  const issueText = issues.length
    ? `Các điểm cần khắc phục (từ lần chấm trước):\n- ${issues.join("\n- ")}`
    : "Không có danh sách lỗi kèm theo — hãy tự rà theo chuẩn SEO on-page.";

  const system = [
    "Bạn là chuyên gia biên tập nội dung chuẩn SEO on-page.",
    "Bạn LUÔN trả về DUY NHẤT một object JSON hợp lệ, không kèm giải thích.",
    "Không Markdown, không code fence.",
  ].join(" ");

  const user = `
Viết lại bài viết dưới đây cho CHUẨN SEO (ngôn ngữ ${language}), rồi trả về JSON.

${keyword.trim()
  ? `Tối ưu theo từ khóa chính: "${keyword}".`
  : `Chưa có từ khóa — hãy tự nhận diện từ khóa chính từ tiêu đề + nội dung và tối ưu theo từ khóa đó.`}

${issueText}

YÊU CẦU:
1. GIỮ NGUYÊN tuyệt đối: thuộc tính src của mọi <img> và href của mọi <a>.
   KHÔNG đổi, KHÔNG xóa ảnh/liên kết, KHÔNG bịa ra liên kết (href) mới.
2. ĐƯỢC PHÉP cải thiện cấu trúc cho chuẩn SEO:
   - Chuyển các dòng tiêu đề mục (đang là <p> ngắn mang tính tiêu đề, vd "Vị trí",
     "Tiện ích nội khu"...) thành <h2> hoặc <h3> cho hợp lý.
   - Thêm thuộc tính alt mô tả ngắn gọn, tự nhiên (bằng ngôn ngữ bài viết, nên chứa
     từ khóa) cho MỌI <img> chưa có alt — nhưng GIỮ NGUYÊN src của ảnh.
3. Viết lại phần CHỮ để tối ưu SEO:
   - Đưa từ khóa vào tiêu đề, đoạn mở đầu và ít nhất một heading một cách tự nhiên.
   - Mật độ từ khóa hợp lý (~0.5-2.5%), KHÔNG nhồi nhét; ĐA DẠNG cấu trúc câu,
     TRÁNH lặp lại nguyên cụm từ khóa quá nhiều lần (dùng đại từ/biến thể thay thế).
   - Câu chữ mạch lạc, dễ đọc, đa dạng độ dài câu; giữ nguyên thông điệp và sự thật
     (KHÔNG bịa số liệu/giá/liên kết).
4. KHÔNG bọc nội dung trong <code> hay Markdown.

Tiêu đề hiện tại: "${title}"

NỘI DUNG HTML GỐC:
"""
${content}
"""

Trả về JSON ĐÚNG shape:
{
  "title": "<tiêu đề đã tối ưu SEO, <= 60 ký tự, chứa từ khóa>",
  "content": "<toàn bộ HTML đã viết lại, giữ nguyên cấu trúc thẻ>"
}

Quy tắc: chỉ JSON, không văn xuôi, không code fence.`.trim();

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
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

  return {
    title: String(parsed.title || title).trim(),
    content: String(parsed.content || content),
  };
};

module.exports = { analyzeContent, evaluateSeo, optimizeSeo };
