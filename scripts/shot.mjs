/**
 * Dev-only screenshot helper.
 *   node scripts/shot.mjs http://localhost:3100/ru mobile
 *   node scripts/shot.mjs http://localhost:3100/ru desktop
 */
import puppeteer from "puppeteer-core";

const url = process.argv[2] ?? "http://localhost:3100/ru";
const mode = process.argv[3] ?? "mobile";
const out = process.argv[4] ?? `shot-${mode}.png`;

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--hide-scrollbars", "--disable-gpu", "--font-render-hinting=none"],
});

const page = await browser.newPage();
if (mode === "mobile") {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
}
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: out, fullPage: process.argv.includes("--full") });
await browser.close();
console.log("saved", out);
