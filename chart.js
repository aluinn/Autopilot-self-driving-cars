// chart.js — draws the little "best fitness per generation" line chart
// on its own small canvas. No library: just a few lines and some text.

function drawChart(canvas, data) {
  const c = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const padL = 44, padR = 8, padT = 8, padB = 22;

  c.clearRect(0, 0, w, h);

  // Axes
  c.strokeStyle = THEME.line;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(padL, padT); c.lineTo(padL, h - padB); c.lineTo(w - padR, h - padB);
  c.stroke();

  c.fillStyle = THEME.muted;
  c.font = "13px 'Space Grotesk', sans-serif";
  c.fillText("gen", w - 30, h - 6);

  if (data.length === 0) return;

  const maxVal = Math.max(...data, 1);
  c.fillText(maxVal.toFixed(0), 4, padT + 8);
  c.fillText("0", 30, h - padB);

  // Turn a data index/value into canvas coordinates.
  const xFor = (i) => padL + (data.length === 1 ? 0 : (i / (data.length - 1)) * (w - padL - padR));
  const yFor = (v) => h - padB - (v / maxVal) * (h - padT - padB);

  c.strokeStyle = THEME.accent;
  c.lineWidth = 2.5;
  c.beginPath();
  data.forEach((v, i) => (i ? c.lineTo(xFor(i), yFor(v)) : c.moveTo(xFor(i), yFor(v))));
  c.stroke();

  // Dot on the latest value
  c.fillStyle = THEME.accent;
  c.beginPath();
  c.arc(xFor(data.length - 1), yFor(data[data.length - 1]), 3, 0, Math.PI * 2);
  c.fill();
}
