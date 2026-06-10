import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:5174";
const EMAIL = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.LOGIN_PASSWORD;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  for (const lang of ["vi", "en"]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript((l) => { try { localStorage.setItem("posta-lang", l); } catch {} }, lang);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.locator('input[type="text"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL("**/dashboard", { timeout: 30000 }).catch(() => {});
    await sleep(1500);
    await page.goto(`${BASE}/help/app-password`, { waitUntil: "networkidle" });
    await sleep(2000);
    await page.screenshot({ path: join(__dirname, `_manual-${lang}.png`), fullPage: true });
    console.log(`✓ _manual-${lang}.png`);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
