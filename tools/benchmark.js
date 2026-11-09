// tools/benchmark.js — measures simulation speed. Run with:  node tools/benchmark.js
//
// Part 1 (Node, no rendering): how long does one simulation step take with 100 cars,
//   and how long does breeding a generation take?
// Part 2 (headless Chrome via Playwright, with rendering): how many frames per second
//   does the page really achieve at 1x, 5x and 20x? Skipped if Playwright can't start a browser.
//
// Numbers depend on your machine; the output header prints yours so results can be compared.

const os = require("os");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { createServer } = require("./serve");

// Load the sources into THIS context (like tools/train-demo.js does). A vm.createContext
// sandbox, as used by the unit tests, makes global lookups several times slower and would
// give misleading timings.
const root = path.join(__dirname, "..");
vm.runInThisContext(
  ["utils", "track", "tracks", "sensor", "network", "car", "evolution", "demo"].map((f) => fs.readFileSync(path.join(root, f + ".js"), "utf8")).join("\n") +
  "\n;globalThis.__api = { buildTrack, PRESETS, Car, NeuralNetwork, nextGeneration, DEMO_BRAIN };");
const A = globalThis.__api;
const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const fmt = (n, d = 2) => n.toFixed(d);

// A population of 100 cars, either random brains or mutated copies of the demo brain
// (these survive much longer, so they are the heavier, more realistic workload).
function population(track, kind) {
  return Array.from({ length: 100 }, () => {
    const brain = kind === "demo" ? A.NeuralNetwork.fromJSON(A.DEMO_BRAIN) : new A.NeuralNetwork([6, 6, 4]);
    if (kind === "demo") brain.mutate(0.05, 0.2);
    const s = track.start;
    const car = new A.Car(s.x, s.y, s.angle, brain);
    car.sensor.update(track);
    return car;
  });
}

function msPerStep(track, kind, steps = 600) {
  const cars = population(track, kind);
  const t0 = process.hrtime.bigint();
  let alive = 0;
  for (let i = 0; i < steps; i++) {
    for (const car of cars) car.update({}, track);
    alive += cars.filter((c) => !c.crashed).length;
  }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { msPerStep: ms / steps, avgAlive: alive / steps };
}

(async () => {
  console.log(`Machine: ${os.cpus()[0].model}, ${os.cpus().length} cores, ${os.platform()} ${os.arch()}, Node ${process.version}`);
  console.log("\nPart 1: simulation core in Node (100 cars, no rendering, median of 5 runs of 600 steps)");
  console.log("| Track | Brains | ms per step | avg cars alive | max steps/frame at 60 fps |");
  console.log("|---|---|---|---|---|");
  for (const [name, preset] of Object.entries(A.PRESETS)) {
    const track = A.buildTrack(preset.points);
    for (const kind of ["random", "demo"]) {
      msPerStep(track, kind, 100); // warm-up
      const runs = Array.from({ length: 5 }, () => msPerStep(track, kind));
      const ms = median(runs.map((r) => r.msPerStep));
      console.log(`| ${name} | ${kind} | ${fmt(ms, 3)} | ${fmt(median(runs.map((r) => r.avgAlive)), 1)} | ${fmt(16.67 / ms, 0)} |`);
    }
  }

  // What does the spatial grid in track.js buy? Compare with testing every wall segment.
  {
    const track = A.buildTrack(A.PRESETS.medium.points);
    const brute = Object.assign({}, track, { query: () => track.walls });
    const grid = median(Array.from({ length: 5 }, () => msPerStep(track, "demo").msPerStep));
    const all = median(Array.from({ length: 5 }, () => msPerStep(brute, "demo").msPerStep));
    console.log(`\nWall lookup, Medium track, demo brains: grid = ${fmt(grid, 3)} ms/step, every segment = ${fmt(all, 3)} ms/step (${fmt(all / grid, 1)}x slower)`);
  }

  const cars = Array.from({ length: 100 }, (_, i) => ({ brain: new A.NeuralNetwork([6, 6, 4]), fitness: i }));
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 1000; i++) A.nextGeneration(cars, 100, 0.1);
  console.log(`\nnextGeneration (breed 100 brains): ${fmt(Number(process.hrtime.bigint() - t0) / 1e6 / 1000, 3)} ms per call (mean of 1000)`);

  console.log("\nPart 2: frames per second in headless Chrome (Medium track, demo brain, 5 s per setting)");
  let browser;
  try {
    const { chromium } = require("playwright");
    try { browser = await chromium.launch({ channel: "chrome" }); } catch { browser = await chromium.launch(); }
  } catch (e) { console.log("skipped: could not start a browser (" + e.message.split("\n")[0] + ")"); return; }
  const server = createServer();
  await new Promise((r) => server.listen(0, r));
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(`http://localhost:${server.address().port}/`);
  await page.click("#demoBtn");
  console.log("| Speed | frames per second |");
  console.log("|---|---|");
  for (const speed of [1, 5, 20]) {
    await page.evaluate((s) => { stepsPerFrame = s; }, speed);
    await page.waitForTimeout(500);
    const fps = await page.evaluate(() => new Promise((resolve) => {
      let frames = 0; const start = performance.now();
      const tick = () => { frames++; performance.now() - start < 5000 ? requestAnimationFrame(tick) : resolve(frames / 5); };
      requestAnimationFrame(tick);
    }));
    console.log(`| ${speed}x | ${fmt(fps, 1)} |`);
  }
  // Where does a frame's time go? Time the real step() and draw() functions inside the page.
  await page.evaluate(() => { stepsPerFrame = 0; }); // stop the page's own loop doing steps
  const cost = await page.evaluate(() => {
    const time = (fn, n) => { const t = performance.now(); for (let i = 0; i < n; i++) fn(); return (performance.now() - t) / n; };
    time(step, 50);
    return { step: time(step, 300), draw: time(draw, 100) };
  });
  console.log(`\nIn-browser cost (demo brain, ${await page.evaluate(() => cars.filter((c) => !c.crashed).length)} of 100 cars alive): step() = ${fmt(cost.step, 3)} ms, draw() = ${fmt(cost.draw, 3)} ms`);
  console.log(`=> one frame at 20x costs about ${fmt(20 * cost.step + cost.draw, 1)} ms of the 16.7 ms budget at 60 fps`);
  await browser.close();
  server.close();
})();
