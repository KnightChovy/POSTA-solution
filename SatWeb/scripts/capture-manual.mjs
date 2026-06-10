// Chụp ảnh user manual cho CẢ tiếng Việt và tiếng Anh.
// Ảnh lưu dạng /public/manual/<base>-<lang>.png (vd tong-quan-vi.png, tong-quan-en.png).
// Chạy: node scripts/capture-manual.mjs   (cần app + backend đang chạy)
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "manual");
const BASE = process.env.BASE_URL || "http://localhost:5174";
const EMAIL = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.LOGIN_PASSWORD;
const LANGS = ["vi", "en"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="text"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL("**/dashboard", { timeout: 30000 }).catch(() => {});
  await sleep(2000);
}

async function captureForLang(browser, lang) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  // Đặt ngôn ngữ TRƯỚC khi app khởi tạo (i18n đọc localStorage key "posta-lang").
  await ctx.addInitScript((l) => {
    try {
      localStorage.setItem("posta-lang", l);
    } catch {}
  }, lang);

  const page = await ctx.newPage();
  await login(page);

  // Dashboard
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await sleep(2000);
  await page.screenshot({ path: join(OUT, `tong-quan-${lang}.png`), fullPage: true });
  console.log(`✓ tong-quan-${lang}.png`);

  // Thêm website
  await page.goto(`${BASE}/create-site`, { waitUntil: "networkidle" });
  await sleep(1500);
  await page.screenshot({ path: join(OUT, `buoc-2-them-site-${lang}.png`), fullPage: true });
  console.log(`✓ buoc-2-them-site-${lang}.png`);

  // Tạo bài viết + điền nội dung
  await page.goto(`${BASE}/create-post`, { waitUntil: "networkidle" });
  await sleep(2500);
  await page.locator("input").first().fill("Top 5 mẹo chăm sóc da mùa hè cho da dầu");
  const frame = page.frameLocator('iframe[id$="_ifr"]');
  await frame.locator("body").click();
  await frame.locator("body").fill(
    "Mùa hè khiến da dầu tiết nhiều bã nhờn hơn. Bài viết chia sẻ 5 mẹo " +
      "chăm sóc da mùa hè giúp kiểm soát dầu, làm sạch sâu và bảo vệ da khỏi tia UV. " +
      "Áp dụng đều đặn để làn da luôn khỏe và sáng mịn.",
  );
  await sleep(800);
  await page.screenshot({ path: join(OUT, `buoc-3-tao-bai-${lang}.png`), fullPage: true });
  console.log(`✓ buoc-3-tao-bai-${lang}.png`);

  // Chấm điểm SEO -> chụp riêng panel kết quả
  await page.locator('input[placeholder]').nth(1).fill("chăm sóc da mùa hè");
  await page.getByRole("button", { name: /SEO/i }).first().click();
  await page.waitForSelector("text=/100", { timeout: 60000 }).catch(() => {});
  await sleep(2500);
  const panel = page.locator(".max-w-4xl").last();
  await panel.scrollIntoViewIfNeeded();
  await sleep(500);
  await panel.screenshot({ path: join(OUT, `buoc-4-seo-${lang}.png`) });
  console.log(`✓ buoc-4-seo-${lang}.png`);

  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const lang of LANGS) {
    console.log(`--- ${lang.toUpperCase()} ---`);
    await captureForLang(browser, lang);
  }
  await browser.close();
  console.log("DONE");
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
