// tools/screenshots.js — captures the README screenshots from the running app.
// Run with:  node tools/screenshots.js   (needs `npm install` for Playwright)
// Output goes to docs/assets/shot-*.png. Uses installed Chrome if present,
// otherwise Playwright's bundled Chromium.

const path = require("path");
const { chromium } = require("playwright");
const { createServer } = require("./serve");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs", "assets");
const server = createServer();

async function launch() {
  try { return await chromium.launch({ channel: "chrome" }); } catch { return await chromium.launch(); }
}

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/`;
  const browser = await launch();
  const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(outDir, `shot-${name}.png`), ...opts });
  const stage = (page) => page.locator(".stage");

  // Shoot just the track card (canvas + narrator + legend), scrolled into view.
  const stageShot = async (page, name) => {
    await stage(page).scrollIntoViewIfNeeded();
    await page.addStyleTag({ content: ".nav{visibility:hidden}" }); // the fixed nav would overlap the card
    await page.waitForTimeout(200);
    await stage(page).screenshot({ path: path.join(outDir, `shot-${name}.png`) });
    await page.evaluate(() => { for (const s of document.querySelectorAll("style")) if (s.textContent === ".nav{visibility:hidden}") s.remove(); });
  };

  const untilLap = (page) => page.waitForFunction(() => bestLapsEver >= 1, null, { timeout: 60000 }).catch(() => {});

  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(url);
  await page.waitForTimeout(1800);

  // 1. Generation 1: random brains, mostly crashing.
  await stageShot(page, "gen1-chaos");

  // 2. Trained demo driver on the medium track, plus the whole page (panels included).
  await page.click("#demoBtn");
  await page.click('[data-speed="5"]');
  await untilLap(page);
  await page.click('[data-speed="1"]');
  await page.waitForTimeout(1500);
  await stageShot(page, "demo-driving");
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "full-page", { fullPage: true });

  // 3. Evolution from scratch at 20x, until the first lap (or a time limit).
  await page.click("#resetBtn");
  await page.click('[data-speed="20"]');
  await page.waitForFunction(() => bestLapsEver >= 1, null, { timeout: 150000 }).catch(() => {});
  console.log("evolving shot taken at generation", await page.evaluate(() => generation));
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "evolving", { fullPage: true });

  // 4. Hard track with the demo brain.
  await page.selectOption("#trackSelect", "hard");
  await page.click("#demoBtn");
  await page.click('[data-speed="5"]');
  await untilLap(page);
  await page.click('[data-speed="1"]');
  await page.waitForTimeout(1500);
  await stageShot(page, "hard-track");

  // 5. Draw your own track.
  await page.check("#keepBrains"); // drop the demo drivers onto the new road
  await page.click("#editBtn");
  await stage(page).scrollIntoViewIfNeeded();
  const box = await page.locator("#trackCanvas").boundingBox();
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    pts.push([box.x + box.width * (0.5 + 0.32 * Math.cos(a)), box.y + box.height * (0.5 + 0.3 * Math.sin(a) * (1 + 0.25 * Math.cos(2 * a)))]);
  }
  await page.mouse.move(...pts[0]);
  await page.mouse.down();
  for (const p of pts.slice(1, 28)) await page.mouse.move(...p);
  await stageShot(page, "draw-track");
  for (const p of pts.slice(28)) await page.mouse.move(...p);
  await page.mouse.up();
  await page.click('[data-speed="5"]');
  await page.waitForTimeout(4000);
  await page.click('[data-speed="1"]');
  await stageShot(page, "custom-track");

  // 6. How-it-works dialog.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click("#howBtn");
  await page.waitForTimeout(300);
  await shot(page, "how-it-works");
  await page.click("#howClose");

  // 7. Phone.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await phone.goto(url);
  await phone.click("#demoBtn");
  await phone.evaluate(() => { stepsPerFrame = 5; }); // the speed buttons are further down the page
  await untilLap(phone);
  await phone.evaluate(() => { stepsPerFrame = 1; });
  await phone.waitForTimeout(1500);
  await phone.evaluate(() => window.scrollTo(0, 0));
  await shot(phone, "phone");

  await browser.close();
  server.close();
  console.log("Screenshots written to docs/assets/");
})();
