// Script tạm: tự đăng nhập rồi chụp màn hình các trang để làm ảnh user manual.
// Chạy: node scripts/capture-manual.mjs   (cần app + backend đang chạy)
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "manual");
const BASE = process.env.BASE_URL || "http://localhost:5174";
const EMAIL = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.LOGIN_PASSWORD;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, name), fullPage: true });
  console.log("✓ saved", name);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // 1) Đăng nhập
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="text"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL("**/dashboard", { timeout: 30000 }).catch(() => {});
  await sleep(2500);

  // 2) Dashboard (tong-quan)
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await sleep(2000);
  await shot(page, "tong-quan.png");

  // 3) Thêm website (create-site)
  await page.goto(`${BASE}/create-site`, { waitUntil: "networkidle" });
  await sleep(1500);
  await shot(page, "buoc-2-them-site.png");

  // 4) Tạo bài viết (create-post) — điền tiêu đề + nội dung để ảnh có dữ liệu
  await page.goto(`${BASE}/create-post`, { waitUntil: "networkidle" });
  await sleep(2500);
  try {
    await page.locator('input[name="title"], input').first().fill(
      "Top 5 mẹo chăm sóc da mùa hè cho da dầu",
    );
    // TinyMCE nằm trong iframe (id kết thúc _ifr)
    const frame = page.frameLocator('iframe[id$="_ifr"]');
    await frame.locator("body").click();
    await frame.locator("body").fill(
      "Mùa hè khiến da dầu tiết nhiều bã nhờn hơn. Bài viết chia sẻ 5 mẹo " +
        "chăm sóc da mùa hè giúp kiểm soát dầu, làm sạch sâu và bảo vệ da khỏi " +
        "tia UV. Áp dụng đều đặn để làn da luôn khỏe và sáng mịn.",
    );
    await sleep(800);
  } catch (e) {
    console.log("! fill post failed:", e.message);
  }
  await shot(page, "buoc-3-tao-bai.png");

  // 5) Chấm điểm SEO -> chụp panel kết quả
  try {
    await page.getByText("chăm sóc da", { exact: false }); // no-op guard
    await page.locator('input[placeholder]').nth(1).fill("chăm sóc da mùa hè");
  } catch {}
  try {
    // Nút "Chấm điểm SEO"
    const btn = page
      .getByRole("button", { name: /SEO/i })
      .first();
    await btn.click({ timeout: 5000 });
    // Chờ panel kết quả (điểm /100) xuất hiện — AI có thể mất vài giây
    await page.waitForSelector("text=/100", { timeout: 60000 }).catch(() => {});
    await sleep(2000);
    await shot(page, "buoc-4-seo.png");
  } catch (e) {
    console.log("! SEO scoring failed:", e.message);
    await shot(page, "buoc-4-seo.png");
  }

  // 6) Tiến độ
  await page.goto(`${BASE}/progress`, { waitUntil: "networkidle" });
  await sleep(2000);
  await shot(page, "buoc-5-tien-do.png");

  await browser.close();
  console.log("DONE");
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
