// network.js — a small neural network, written from scratch.
//
// Think of it as a tiny decision machine with three stages:
//   inputs  (6 numbers: 5 sensor readings + current speed)
//   hidden  (6 "neurons", each a weighted mix of all the inputs)
//   outputs (4 neurons: forward, reverse, left, right)
//
// Every connection has a WEIGHT (how strongly one neuron listens to another) and
// every neuron has a BIAS (a built-in lean towards on or off). The network's
// entire "personality" is just these numbers. Learning means finding good ones.

class Layer {
  constructor(inputCount, outputCount) {
    this.inputCount = inputCount;
    this.outputCount = outputCount;
    this.weights = []; // weights[o][i]: strength of input i -> neuron o
    this.biases = [];  // biases[o]
    this.inputs = new Array(inputCount).fill(0);
    this.outputs = new Array(outputCount).fill(0); // remembered so we can draw them
    this.randomise();
  }

  // Start with random values between -1 and 1.
  randomise() {
    this.weights = [];
    for (let o = 0; o < this.outputCount; o++) {
      const row = [];
      for (let i = 0; i < this.inputCount; i++) row.push(Math.random() * 2 - 1);
      this.weights.push(row);
    }
    this.biases = Array.from({ length: this.outputCount }, () => Math.random() * 2 - 1);
  }

  forward(inputs) {
    this.inputs = inputs;
    for (let o = 0; o < this.outputCount; o++) {
      // Add up every input multiplied by its weight, plus the bias...
      let sum = this.biases[o];
      for (let i = 0; i < this.inputCount; i++) sum += inputs[i] * this.weights[o][i];
      // ...then squash into the range -1..1 so no neuron can shout too loud.
      this.outputs[o] = Math.tanh(sum);
    }
    return this.outputs;
  }
}

class NeuralNetwork {
  // sizes = how many neurons in each stage, e.g. [6, 6, 4]
  constructor(sizes = [6, 6, 4]) {
    this.sizes = sizes;
    this.layers = [];
    for (let i = 0; i < sizes.length - 1; i++) {
      this.layers.push(new Layer(sizes[i], sizes[i + 1]));
    }
    this.lastInputs = new Array(sizes[0]).fill(0);
  }

  // Turn the network into plain data (for saving / exporting)...
  toJSON() {
    return {
      sizes: this.sizes,
      layers: this.layers.map((l) => ({ weights: l.weights, biases: l.biases })),
    };
  }

  // ...and back again. Throws an error if the data doesn't look right.
  static fromJSON(data) {
    const net = new NeuralNetwork(data.sizes);
    if (!Array.isArray(data.layers) || data.layers.length !== net.layers.length) throw new Error("Bad brain data");
    net.layers.forEach((layer, l) => {
      const saved = data.layers[l];
      const okShape = saved.biases.length === layer.outputCount &&
        saved.weights.length === layer.outputCount &&
        saved.weights.every((row) => row.length === layer.inputCount);
      if (!okShape) throw new Error("Brain has the wrong shape");
      layer.weights = saved.weights.map((row) => row.slice());
      layer.biases = saved.biases.slice();
    });
    return net;
  }

  // An exact, independent copy of this network.
  clone() {
    const copy = new NeuralNetwork(this.sizes);
    copy.layers.forEach((layer, l) => {
      layer.weights = this.layers[l].weights.map((row) => row.slice());
      layer.biases = this.layers[l].biases.slice();
    });
    return copy;
  }

  // Mutation: each weight/bias has a `rate` chance (0 to 1) of being nudged by a
  // random amount up to +/- `strength`. Small nudges = small changes in behaviour.
  mutate(rate, strength = 0.5) {
    const nudge = (v) => (Math.random() < rate ? v + (Math.random() * 2 - 1) * strength : v);
    for (const layer of this.layers) {
      layer.weights = layer.weights.map((row) => row.map(nudge));
      layer.biases = layer.biases.map(nudge);
    }
  }

  // Crossover: a child that takes each weight/bias from parent A or parent B
  // (a coin flip each time) — like shuffling two decks of genes together.
  static crossover(a, b) {
    const child = a.clone();
    child.layers.forEach((layer, l) => {
      const other = b.layers[l];
      layer.weights = layer.weights.map((row, o) => row.map((v, i) => (Math.random() < 0.5 ? v : other.weights[o][i])));
      layer.biases = layer.biases.map((v, o) => (Math.random() < 0.5 ? v : other.biases[o]));
    });
    return child;
  }

  // Run numbers through every layer and return the final outputs (each -1..1).
  feedForward(inputs) {
    this.lastInputs = inputs;
    let values = inputs;
    for (const layer of this.layers) values = layer.forward(values);
    return values;
  }
}
