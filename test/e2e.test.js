// End-to-end smoke test: serve the real site, open it in a real browser, and check that
// the main flows work and nothing throws. Needs Playwright's browser:
//   npx playwright install chromium     (CI does this; locally Chrome is used if present)

const test = require("node:test");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { createServer } = require("../tools/serve");

async function launch() {
  try { return await chromium.launch(); } catch { return await chromium.launch({ channel: "chrome" }); }
}

test("app loads, simulates, loads the demo brain and accepts a drawn track", async (t) => {
  const server = createServer();
  await new Promise((r) => server.listen(0, r));
  const browser = await launch();
  t.after(async () => { await browser.close(); server.close(); });

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  // Don't depend on Google Fonts being reachable: serve an empty stylesheet instead.
  await page.route(/fonts\.googleapis\.com/, (route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.goto(`http://localhost:${server.address().port}/`);

  // 1. Starts at generation 1 with 100 cars, and the simulation advances.
  assert.equal(await page.textContent("#genCount"), "1");
  assert.match(await page.textContent("#aliveCount"), /\/ 100$/);
  await page.waitForFunction(() => tick > 30);

  // 2. Fast-forwarding eventually produces generation 2.
  await page.click('[data-speed="20"]');
  await page.waitForFunction(() => generation >= 2, null, { timeout: 60000 });

  // 3. The demo brain loads and resets to generation 1 with a status message.
  await page.click('[data-speed="1"]');
  await page.click("#demoBtn");
  await page.waitForFunction(() => document.getElementById("genCount").textContent === "1"); // DOM updates on the next frame
  assert.equal(await page.textContent("#genCount"), "1");
  assert.match(await page.textContent("#status"), /Demo loaded/);

  // 4. Switching track works.
  await page.selectOption("#trackSelect", "hard");
  assert.match(await page.textContent("#status"), /Hard track loaded/);

  // 5. Drawing a loop creates "Your track".
  await page.click("#editBtn");
  await page.locator("#trackCanvas").scrollIntoViewIfNeeded();
  const box = await page.locator("#trackCanvas").boundingBox();
  await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.5);
  await page.mouse.down();
  for (let i = 1; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    await page.mouse.move(box.x + box.width * (0.5 + 0.32 * Math.cos(a)), box.y + box.height * (0.5 + 0.3 * Math.sin(a)));
  }
  await page.mouse.up();
  assert.equal(await page.inputValue("#trackSelect"), "custom");
  assert.match(await page.textContent("#status"), /Your track is live/);

  // 6. The How-it-works dialog opens and closes.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click("#howBtn");
  assert.equal(await page.evaluate(() => document.getElementById("howDialog").open), true);
  await page.click("#howClose");
  assert.equal(await page.evaluate(() => document.getElementById("howDialog").open), false);

  assert.deepEqual(errors, [], "no console errors or uncaught exceptions");
});
