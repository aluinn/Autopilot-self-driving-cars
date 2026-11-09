// test/helpers.js — loads the browser-global source files into a sandbox so they can be
// unit-tested in Node without changing them. Math.random is replaced by a seeded generator
// so every test run is deterministic.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const FILES = ["utils", "track", "tracks", "sensor", "network", "car", "evolution"];

// mulberry32: a small, well-known seeded random number generator.
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function load(seed = 1) {
  const sandboxMath = Object.create(Math);
  sandboxMath.random = seededRandom(seed);
  const context = vm.createContext({ Math: sandboxMath, console });
  const source = FILES.map((f) => fs.readFileSync(path.join(root, f + ".js"), "utf8")).join("\n") +
    "\n;this.api = { getIntersection, lerp, buildTrack, validateTrack, smoothLoop, PRESETS, Sensor, NeuralNetwork, Car, nextGeneration, ELITE_COUNT };";
  vm.runInContext(source, context);
  const demoSource = fs.readFileSync(path.join(root, "demo.js"), "utf8") + "\n;this.demo = DEMO_BRAIN;";
  vm.runInContext(demoSource, context);
  return { ...context.api, DEMO_BRAIN: context.demo, random: sandboxMath.random };
}

module.exports = { load, seededRandom };
