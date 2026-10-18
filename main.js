// main.js — glues everything together: sets up the canvas, reads the keyboard,
// runs the generations, and runs the game loop
// (update the world, draw it, repeat ~60 times a second).

const POPULATION_SIZE = 100;
const GENERATION_TICKS = 2400; // time limit per generation (40 seconds of sim time)

const canvas = document.getElementById("trackCanvas");
const ctx = canvas.getContext("2d");

// Build the preset tracks once; `track` is whichever one is in use right now.
const presetTracks = {};
for (const key in PRESETS) presetTracks[key] = buildTrack(PRESETS[key].points);
let customTrack = null;   // the one you draw
let track = presetTracks.medium;
let editing = false;      // true while you're drawing a track (the simulation pauses)

// --- State --------------------------------------------------------------------
let cars = [];            // every car currently on the track
let manualMode = false;   // true = one human car, false = the AI crowd
let generation = 1;
let tick = 0;             // how long the current generation has been running
let bestLapsEver = 0;
let history = [];         // best fitness of each finished generation (for the chart)
let stepsPerFrame = 1;    // speed control: 1, 5 or 20
let mutationRate = 0.1;   // from the slider

function newCar(brain) {
  const car = new Car(track.start.x, track.start.y, track.start.angle, brain);
  car.sensor.update(track); // first look, so the car can "see" before moving
  return car;
}

// Put a fresh set of cars on the start line. `brains` = the AI brains to use.
function spawnCars(brains) {
  if (manualMode) {
    cars = [newCar(null)];
  } else {
    cars = brains.map((b) => newCar(b));
  }
  tick = 0;
}

function randomBrains() {
  return Array.from({ length: POPULATION_SIZE }, () => new NeuralNetwork([6, 6, 4]));
}

// Start learning from scratch.
function resetLearning() {
  generation = 1;
  bestLapsEver = 0;
  history = [];
  spawnCars(randomBrains());
  drawChart(chartCanvas, history);
}

// A population built from one good brain: the first few are exact copies,
// the rest are lightly mutated copies, so they don't all drive identically.
function populationFrom(brain) {
  return Array.from({ length: POPULATION_SIZE }, (_, i) => {
    const copy = brain.clone();
    if (i >= ELITE_COUNT) copy.mutate(0.05, 0.2);
    return copy;
  });
}

// Restart at generation 1 with a population based on `brain` (used by Demo / Load).
function startFromBrain(brain) {
  manualMode = false;
  $("manualToggle").checked = false;
  syncManualUI();
  generation = 1;
  bestLapsEver = 0;
  history = [];
  spawnCars(populationFrom(brain));
  drawChart(chartCanvas, history);
}

// The generation is over: record the result, breed the next one.
function endGeneration() {
  history.push(findBestCar().fitness);
  const brains = nextGeneration(cars, POPULATION_SIZE, mutationRate);
  generation++;
  spawnCars(brains);
  drawChart(chartCanvas, history);
}

// The best car: the fittest one still driving, or if everyone has stopped, the fittest overall.
function findBestCar() {
  let best = cars[0];
  for (const c of cars) {
    if ((!c.crashed && best.crashed) || (c.crashed === best.crashed && c.fitness > best.fitness)) best = c;
  }
  return best;
}

// One tick of the simulation (the game loop may do several per frame).
function step() {
  if (editing) return; // paused while drawing
  for (const car of cars) {
    car.update(controls, track);
    bestLapsEver = Math.max(bestLapsEver, car.laps(track));
  }
  if (manualMode) return;

  tick++;
  // A generation ends when everyone has stopped, or time runs out.
  if (tick >= GENERATION_TICKS || cars.every((c) => c.crashed)) endGeneration();
}

// --- Side panel -------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const chartCanvas = $("chart");
const brainCanvas = $("brainCanvas");

const readoutBars = [];
for (let i = 0; i < 5; i++) {
  const row = document.createElement("div");
  row.className = "bar-row";
  row.innerHTML = `<span>${["L", "FL", "F", "FR", "R"][i]}</span><div class="bar"><div class="fill"></div></div><span class="val">0.00</span>`;
  $("sensorReadout").appendChild(row);
  readoutBars.push({ fill: row.querySelector(".fill"), val: row.querySelector(".val") });
}

function updatePanel(best) {
  best.sensor.readings.forEach((r, i) => {
    readoutBars[i].fill.style.width = r * 100 + "%";
    readoutBars[i].val.textContent = r.toFixed(2);
  });
  const alive = cars.filter((c) => !c.crashed).length;
  $("genCount").textContent = generation;
  $("aliveCount").textContent = alive + " / " + cars.length;
  $("bestFitness").textContent = best.fitness.toFixed(1);
  $("bestLaps").textContent = bestLapsEver;
}

// Speed buttons
document.querySelectorAll("[data-speed]").forEach((btn) => {
  btn.addEventListener("click", () => {
    stepsPerFrame = Number(btn.dataset.speed);
    document.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("active", b === btn));
  });
});

// Mutation slider
$("mutationSlider").addEventListener("input", (e) => {
  mutationRate = Number(e.target.value) / 100;
  $("mutationLabel").textContent = e.target.value + "%";
});

// --- Saving, loading, exporting, demo ---------------------------------------
const SAVE_KEY = "autopilot.savedBrain";

function say(message) {
  $("status").textContent = message;
}

// The brain of the best car, or null if we're in manual mode (humans have no brain).
function bestBrain() {
  const best = findBestCar();
  return best.brain || null;
}

$("demoBtn").addEventListener("click", () => {
  startFromBrain(NeuralNetwork.fromJSON(DEMO_BRAIN));
  say("Demo loaded. This brain already knows the road.");
});

$("saveBtn").addEventListener("click", () => {
  const brain = bestBrain();
  if (!brain) return say("Switch off manual drive first. Humans don't come with a brain.");
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(brain.toJSON()));
    say("Brain saved. It's in this browser until you clear it.");
  } catch (err) {
    say("Couldn't save: this browser is blocking storage.");
  }
});

$("loadBtn").addEventListener("click", () => {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (!text) return say("No saved brain yet. Hit Save first.");
    startFromBrain(NeuralNetwork.fromJSON(JSON.parse(text)));
    say("Brain restored. Let's see what it remembers.");
  } catch (err) {
    say("That saved brain looks corrupted.");
  }
});

// Export: download the best brain as a .json file.
$("exportBtn").addEventListener("click", () => {
  const brain = bestBrain();
  if (!brain) return say("Switch off manual drive first. Humans don't come with a brain.");
  const blob = new Blob([JSON.stringify(brain.toJSON(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "autopilot-brain.json";
  link.click();
  URL.revokeObjectURL(link.href);
  say("Exported autopilot-brain.json. That's a whole mind in 70 numbers.");
});

$("resetBtn").addEventListener("click", () => {
  resetLearning();
  say("");
});
// Show the on-screen arrow buttons only while driving by hand.
function syncManualUI() {
  $("dpad").hidden = !manualMode;
}
$("manualToggle").addEventListener("change", (e) => {
  manualMode = e.target.checked;
  syncManualUI();
  resetLearning();
});

// On-screen arrows (for touch screens) flip the same switches as the keyboard.
document.querySelectorAll("[data-drive]").forEach((btn) => {
  const set = (on) => { controls[btn.dataset.drive] = on; };
  btn.addEventListener("pointerdown", (e) => { e.preventDefault(); set(true); });
  for (const type of ["pointerup", "pointerleave", "pointercancel"]) btn.addEventListener(type, () => set(false));
});

// "How it works" pop-up
const howDialog = $("howDialog");
$("howBtn").addEventListener("click", () => howDialog.showModal());
$("howClose").addEventListener("click", () => howDialog.close());
howDialog.addEventListener("click", (e) => {
  // Click outside the box (on the dark backdrop) to close.
  const r = howDialog.getBoundingClientRect();
  const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  if (!inside) howDialog.close();
});

// --- Tracks: switching presets and drawing your own -----------------------------
// Switch to a new track. Either start learning again from scratch, or (if the
// "keep brains" box is ticked) drop the current drivers onto the new road to see
// whether what they learned works somewhere new.
function changeTrack(newTrack) {
  const keep = !manualMode && $("keepBrains").checked;
  const brains = keep ? cars.map((c) => c.brain.clone()) : null;
  track = newTrack;
  if (keep) {
    bestLapsEver = 0;
    spawnCars(brains);
  } else {
    resetLearning();
  }
}

const editor = new TrackEditor(canvas, (points) => {
  let candidate, problem;
  try {
    candidate = buildTrack(points);
    problem = validateTrack(candidate);
  } catch (err) {
    problem = "Couldn't build that track. Try drawing it again.";
  }
  if (problem) { say(problem); return problem; }

  customTrack = candidate;
  if (!$("trackSelect").querySelector('[value="custom"]')) {
    const option = document.createElement("option");
    option.value = "custom";
    option.textContent = "Your track";
    $("trackSelect").appendChild(option);
  }
  $("trackSelect").value = "custom";
  stopEditing();
  changeTrack(candidate);
  say($("keepBrains").checked ? "Your track is live. Same drivers, new road." : "Your track is live. The cars are starting from scratch.");
  return null;
});

function startEditing() {
  editing = true;
  editor.start();
  $("editBtn").textContent = "Cancel drawing";
  say("");
}
function stopEditing() {
  editing = false;
  editor.stop();
  $("editBtn").textContent = "Draw your own track";
}

$("editBtn").addEventListener("click", () => (editing ? stopEditing() : startEditing()));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && editing) stopEditing(); });

$("trackSelect").addEventListener("change", (e) => {
  if (editing) stopEditing();
  const key = e.target.value;
  changeTrack(key === "custom" ? customTrack : presetTracks[key]);
  say(key === "custom" ? "Back on your track." : PRESETS[key].label + " track loaded.");
});

// --- Narrator: a live line of commentary about what's happening --------------
let lastNarration = "";

function narration(best) {
  if (editing) return editor.message || "Draw a loop with your mouse or finger. I'll build the walls and checkpoints for you.";
  if (manualMode) return "You have the wheel. Arrow keys. Try to beat what a hundred machines can learn.";
  if (mutationRate === 0) return "Mutation is off, so every child is an exact clone. Evolution has nothing new to try.";
  if (mutationRate >= 0.4) return "Mutation is cranked up. Children barely resemble their parents, so it's mostly chaos.";
  if (bestLapsEver >= 3) return "Multiple laps, zero instructions. This brain has mastered the track.";
  if (bestLapsEver >= 1) return "A car just finished a lap. Nobody told it how to drive. It worked it out.";
  if (generation === 1) return "Generation 1: pure chaos. Every brain is random, so most cars crash in seconds.";
  if (best.fitness < 8) return "Generation " + generation + ": the survivors' children are learning not to hit walls.";
  return "Generation " + generation + ": each batch drives a little further than the last.";
}

function updateNarrator(best) {
  const text = narration(best);
  if (text !== lastNarration) { // only touch the page when the words change
    $("narratorText").textContent = text;
    lastNarration = text;
  }
}

// --- Keyboard ---------------------------------------------------------------
// Only the human car (manual mode) listens to these.
const controls = { forward: false, reverse: false, left: false, right: false };
const keyMap = {
  ArrowUp: "forward", ArrowDown: "reverse", ArrowLeft: "left", ArrowRight: "right",
};

function setKey(e, isDown) {
  const action = keyMap[e.key];
  if (!action) return;
  controls[action] = isDown;
  e.preventDefault(); // stop arrow keys from scrolling the page
}
document.addEventListener("keydown", (e) => setKey(e, true));
document.addEventListener("keyup", (e) => setKey(e, false));

// --- Drawing ------------------------------------------------------------------
function draw() {
  const best = findBestCar();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // While drawing: show the old track faintly behind your line.
  if (editing) {
    ctx.globalAlpha = 0.2;
    drawTrack(ctx, track);
    ctx.globalAlpha = 1;
    editor.draw(ctx);
    updateNarrator(best);
    return;
  }

  drawTrack(ctx, track);

  // Crowd first (see-through; wrecks fainter still), then the best car on top.
  for (const car of cars) {
    if (car !== best) car.draw(ctx, car.crashed ? 0.3 : 0.35, false);
  }
  best.sensor.draw(ctx); // only the best car shows its rays
  best.draw(ctx, 1, true);

  // Big generation counter in the corner of the track
  if (!manualMode) {
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = THEME.muted;
    ctx.font = "700 13px 'Space Grotesk', sans-serif";
    ctx.fillText("GENERATION", 22, 30);
    ctx.fillStyle = THEME.text;
    ctx.font = "700 44px 'Space Grotesk', sans-serif";
    ctx.fillText(String(generation), 20, 72);
  }

  if (best.brain) drawBrain(brainCanvas, best.brain);
  updatePanel(best);
  updateNarrator(best);
}

// --- Game loop --------------------------------------------------------------
function frame() {
  for (let i = 0; i < stepsPerFrame; i++) step(); // fast-forward = more steps per frame
  draw();
  requestAnimationFrame(frame);
}

resetLearning();
frame();
