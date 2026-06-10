// Chụp lại riêng panel kết quả SEO (cắt gọn), thay cho ảnh full-page.
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "manual");
const BASE = process.env.BASE_URL || "http://localhost:5174";
const EMAIL = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.LOGIN_PASSWORD;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="text"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL("**/dashboard", { timeout: 30000 }).catch(() => {});
  await sleep(2000);

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
  await page.locator('input[placeholder]').nth(1).fill("chăm sóc da mùa hè");
  await page.getByRole("button", { name: /SEO/i }).first().click();
  await page.waitForSelector("text=/100", { timeout: 60000 }).catch(() => {});
  await sleep(2500);

  // Card SEO là phần tử .max-w-4xl cuối cùng trên trang
  const panel = page.locator(".max-w-4xl").last();
  await panel.scrollIntoViewIfNeeded();
  await sleep(500);
  await panel.screenshot({ path: join(OUT, "buoc-4-seo.png") });
  console.log("✓ saved buoc-4-seo.png (cropped)");

  await browser.close();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
