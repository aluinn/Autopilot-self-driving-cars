// brainvis.js — draws a neural network live, so you can watch a brain "think".
//
//  - Each circle is a neuron. The brighter it glows, the more active it is right now.
//  - Each line is a connection. Cyan = positive weight (encourages the next neuron),
//    pink = negative weight (discourages it). A thicker line = a stronger weight.

const INPUT_LABELS = ["L", "FL", "F", "FR", "R", "SPD"];
const OUTPUT_LABELS = ["↑", "↓", "←", "→"];

function drawBrain(canvas, net) {
  const c = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  c.clearRect(0, 0, w, h);

  const sizes = net.sizes;
  const padX = 46, padY = 20, radius = 9;

  // Position of neuron j in layer L: layers are columns, neurons spread vertically.
  const pos = (L, j) => ({
    x: padX + (L / (sizes.length - 1)) * (w - 2 * padX),
    y: h / 2 + (j - (sizes[L] - 1) / 2) * Math.min(34, (h - 2 * padY) / sizes[L]),
  });

  // How active is neuron j in layer L? (-1 to 1)
  const activation = (L, j) => (L === 0 ? net.lastInputs[j] : net.layers[L - 1].outputs[j]);

  // Connections first, so the neurons are drawn on top.
  for (let L = 0; L < net.layers.length; L++) {
    const layer = net.layers[L];
    for (let o = 0; o < layer.outputCount; o++) {
      for (let i = 0; i < layer.inputCount; i++) {
        const wt = layer.weights[o][i];
        const a = pos(L, i), b = pos(L + 1, o);
        // Connections carrying a lot of signal right now look brighter.
        const live = Math.min(1, Math.abs(activation(L, i)));
        c.strokeStyle = wt >= 0 ? THEME.accent : THEME.negative;
        c.globalAlpha = 0.12 + 0.5 * live;
        c.lineWidth = Math.max(0.3, Math.abs(wt) * 2.2);
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
    }
  }
  c.globalAlpha = 1;

  // Neurons
  c.font = "13px 'Space Grotesk', sans-serif";
  c.textBaseline = "middle";
  for (let L = 0; L < sizes.length; L++) {
    for (let j = 0; j < sizes[L]; j++) {
      const p = pos(L, j);
      const a = activation(L, j) || 0;
      const lit = Math.min(1, Math.abs(a));

      c.fillStyle = THEME.node;
      c.beginPath();
      c.arc(p.x, p.y, radius, 0, Math.PI * 2);
      c.fill();

      c.globalAlpha = 0.15 + 0.85 * lit; // brighter = more active
      c.fillStyle = a >= 0 ? THEME.accent : THEME.negative;
      c.beginPath();
      c.arc(p.x, p.y, radius, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;

      c.strokeStyle = THEME.wall;
      c.lineWidth = 1;
      c.stroke();

      // Labels on the first and last columns
      c.fillStyle = THEME.muted;
      if (L === 0) { c.textAlign = "right"; c.fillText(INPUT_LABELS[j], p.x - radius - 4, p.y); }
      if (L === sizes.length - 1) { c.textAlign = "left"; c.fillText(OUTPUT_LABELS[j], p.x + radius + 4, p.y); }
    }
  }
}
