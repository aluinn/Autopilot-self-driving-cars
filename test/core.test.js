const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./helpers");

const A = load(42);

test("getIntersection finds a crossing and its offset along the first segment", () => {
  const hit = A.getIntersection({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: -5 }, { x: 5, y: 5 });
  assert.deepEqual([hit.x, hit.y, hit.offset], [5, 0, 0.5]);
});

test("getIntersection returns null for parallel and non-touching segments", () => {
  assert.equal(A.getIntersection({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 1 }, { x: 10, y: 1 }), null);
  assert.equal(A.getIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 5, y: -5 }, { x: 5, y: 5 }), null);
});

test("lerp interpolates", () => {
  assert.equal(A.lerp(10, 20, 0.25), 12.5);
});

test("a [6,6,4] network has exactly 70 adjustable numbers", () => {
  const net = new A.NeuralNetwork([6, 6, 4]);
  const count = net.layers.reduce((n, l) => n + l.weights.flat().length + l.biases.length, 0);
  assert.equal(count, 70);
});

test("feedForward returns 4 outputs, each within -1..1", () => {
  const net = new A.NeuralNetwork([6, 6, 4]);
  const out = net.feedForward([0, 0.2, 1, 0.5, 0, 0.3]);
  assert.equal(out.length, 4);
  for (const v of out) assert.ok(v >= -1 && v <= 1);
});

test("toJSON/fromJSON round-trips and gives identical outputs", () => {
  const net = new A.NeuralNetwork([6, 6, 4]);
  const copy = A.NeuralNetwork.fromJSON(JSON.parse(JSON.stringify(net.toJSON())));
  const input = [0.1, 0.9, 0.3, 0, 0.5, 0.7];
  assert.deepEqual([...copy.feedForward(input)], [...net.feedForward(input)]);
});

test("fromJSON rejects data with the wrong shape", () => {
  const data = new A.NeuralNetwork([6, 6, 4]).toJSON();
  data.layers[0].weights[0].pop();
  assert.throws(() => A.NeuralNetwork.fromJSON(data), /wrong shape/);
  assert.throws(() => A.NeuralNetwork.fromJSON({ sizes: [6, 6, 4], layers: [] }), /Bad brain data/);
});

test("clone is independent of the original", () => {
  const net = new A.NeuralNetwork([6, 6, 4]);
  const copy = net.clone();
  copy.layers[0].weights[0][0] += 1;
  assert.notEqual(copy.layers[0].weights[0][0], net.layers[0].weights[0][0]);
});

test("mutate with rate 0 changes nothing; rate 1 changes everything", () => {
  const net = new A.NeuralNetwork([6, 6, 4]);
  const before = JSON.stringify(net.toJSON());
  net.mutate(0);
  assert.equal(JSON.stringify(net.toJSON()), before);
  net.mutate(1);
  assert.notEqual(JSON.stringify(net.toJSON()), before);
});

test("crossover takes every gene from one of the two parents", () => {
  const a = new A.NeuralNetwork([6, 6, 4]);
  const b = new A.NeuralNetwork([6, 6, 4]);
  const child = A.NeuralNetwork.crossover(a, b);
  child.layers.forEach((layer, l) => {
    layer.weights.forEach((row, o) => row.forEach((v, i) => {
      assert.ok(v === a.layers[l].weights[o][i] || v === b.layers[l].weights[o][i]);
    }));
  });
});

test("all three presets build and pass validation", () => {
  for (const [name, preset] of Object.entries(A.PRESETS)) {
    const track = A.buildTrack(preset.points);
    assert.ok(track.checkpoints.length > 10, name + " has checkpoints");
    assert.equal(A.validateTrack(track), null, name + " is valid");
  }
});

test("validateTrack rejects a loop that is too small", () => {
  const small = [{ x: 500, y: 350 }, { x: 520, y: 350 }, { x: 520, y: 370 }, { x: 500, y: 370 }];
  assert.match(A.validateTrack(A.buildTrack(small)), /too small/);
});

test("a car driving into a wall crashes", () => {
  const track = A.buildTrack(A.PRESETS.easy.points);
  const s = track.start;
  const car = new A.Car(s.x, s.y, s.angle + Math.PI / 2, null); // point at the wall
  for (let i = 0; i < 400 && !car.crashed; i++) car.update({ forward: true }, track);
  assert.equal(car.crashed, true);
});

test("the demo brain passes checkpoints on every preset, and a random brain does worse", () => {
  const demo = A.NeuralNetwork.fromJSON(A.DEMO_BRAIN);
  const random = new A.NeuralNetwork([6, 6, 4]);
  for (const preset of Object.values(A.PRESETS)) {
    const track = A.buildTrack(preset.points);
    const drive = (brain) => {
      const s = track.start;
      const car = new A.Car(s.x, s.y, s.angle, brain);
      car.sensor.update(track);
      for (let t = 0; t < 1200 && !car.crashed; t++) car.update({}, track);
      return car.passed;
    };
    assert.ok(drive(demo) > track.checkpoints.length * 0.5, "demo gets over half a lap");
    assert.ok(drive(demo) > drive(random));
  }
});

test("nextGeneration keeps the population size and copies the elite unchanged", () => {
  const cars = Array.from({ length: 100 }, (_, i) => ({ brain: new A.NeuralNetwork([6, 6, 4]), fitness: i }));
  const next = A.nextGeneration(cars, 100, 0.1);
  assert.equal(next.length, 100);
  const bestFirst = cars.slice().sort((x, y) => y.fitness - x.fitness);
  for (let i = 0; i < A.ELITE_COUNT; i++) {
    assert.deepEqual(next[i].toJSON(), bestFirst[i].brain.toJSON());
    assert.notEqual(next[i], bestFirst[i].brain); // a copy, not the same object
  }
});
