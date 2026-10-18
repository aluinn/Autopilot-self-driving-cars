// tools/train-demo.js — trains a brain on your computer and writes it to demo.js.
// Run with:  node tools/train-demo.js
// It uses exactly the same car / sensor / network / evolution code as the website,
// just without drawing anything, so it can run thousands of ticks very quickly.
//
// The brain is trained on ALL THREE preset tracks at once, so it learns to
// drive in general rather than memorising one road.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const files = ["utils", "track", "tracks", "sensor", "network", "car", "evolution"];
vm.runInThisContext(
  files.map((f) => fs.readFileSync(path.join(root, f + ".js"), "utf8")).join("\n") +
  "\n;globalThis.__api = { buildTrack, PRESETS, Car, NeuralNetwork, nextGeneration };"
);
const { buildTrack, PRESETS, Car, NeuralNetwork, nextGeneration } = globalThis.__api;

const tracks = Object.values(PRESETS).map((p) => buildTrack(p.points));
const GENERATIONS = 80;
const TICKS = 2400;

// Drive one brain on one track from a (slightly wobbled) start. Returns the car.
function drive(brain, track, angleOffset = 0, sideOffset = 0) {
  const s = track.start;
  const nx = -Math.sin(s.angle), ny = Math.cos(s.angle);
  const car = new Car(s.x + nx * sideOffset, s.y + ny * sideOffset, s.angle + angleOffset, brain);
  car.sensor.update(track);
  for (let t = 0; t < TICKS && !car.crashed; t++) car.update({}, track);
  return car;
}

// Score on a track, scaled to "laps' worth" so short and long tracks count equally.
const lapsWorth = (car, track) => car.fitness / track.checkpoints.length;

// 1. Evolution: every brain is tested on every track; its score is the total.
let brains = Array.from({ length: 100 }, () => new NeuralNetwork([6, 6, 4]));
const candidates = [];
for (let g = 1; g <= GENERATIONS; g++) {
  // Score = total over the tracks + extra weight on the WORST track, so a brain
  // can't get ahead by acing the easy roads and giving up on the hard one.
  const scored = brains.map((brain) => {
    const results = tracks.map((t) => lapsWorth(drive(brain, t), t));
    return { brain, fitness: 10 * (results.reduce((a, b) => a + b, 0) + 3 * Math.min(...results)) };
  });
  scored.sort((a, b) => b.fitness - a.fitness);
  if (g > GENERATIONS - 10) scored.slice(0, 5).forEach((c) => candidates.push(c.brain));
  console.log(`gen ${g}: best total ${scored[0].fitness.toFixed(1)}`);
  brains = nextGeneration(scored, 100, 0.1);
}

// 2. Pick the most ROBUST candidate: the one whose WORST result, over all tracks and
//    several slightly different starting positions, is best.
const wobbles = [[0, 0], [0.12, 0], [-0.12, 0], [0, 12], [0, -12], [0.08, 8], [-0.08, -8]];
let winner = null, winnerScore = -1;
for (const b of candidates) {
  const score = Math.min(...tracks.flatMap((t) => wobbles.map(([a, s]) => lapsWorth(drive(b, t, a, s), t))));
  if (score > winnerScore) { winnerScore = score; winner = b; }
}
console.log("Chosen brain: worst case =", winnerScore.toFixed(2), "laps' worth (over 3 tracks x 7 starts)");

// 3. Write it into demo.js (rounded to keep the file small).
const round = (v) => Math.round(v * 1000) / 1000;
const data = winner.toJSON();
data.layers = data.layers.map((l) => ({ weights: l.weights.map((r) => r.map(round)), biases: l.biases.map(round) }));
const out =
  "// demo.js — a pre-trained brain, made by tools/train-demo.js. Do not edit by hand.\n" +
  "// The Demo button loads this so visitors see good driving straight away.\n" +
  "const DEMO_BRAIN = " + JSON.stringify(data) + ";\n";
fs.writeFileSync(path.join(root, "demo.js"), out);
console.log("Wrote demo.js");
