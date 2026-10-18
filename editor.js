// editor.js — lets you draw your own track with a mouse or finger.
//
// You draw the CENTRE LINE of the road in one stroke. When you let go, we:
//   1. join the end back to the start so it's a closed loop,
//   2. space the points out evenly and smooth out wobbles in your hand,
//   3. hand the result to main.js, which builds the walls and checkpoints
//      (the same way it does for the presets) and checks the track is usable.

class TrackEditor {
  // onFinish(points) should return null if the track was accepted,
  // or a message explaining what's wrong (we then let you try again).
  constructor(canvas, onFinish) {
    this.canvas = canvas;
    this.onFinish = onFinish;
    this.active = false;
    this.drawing = false;
    this.stroke = [];     // the points of the line being drawn
    this.message = "";    // last problem, shown on the canvas

    // Pointer events cover mouse, touch and pen with the same code.
    canvas.addEventListener("pointerdown", (e) => this.down(e));
    canvas.addEventListener("pointermove", (e) => this.move(e));
    canvas.addEventListener("pointerup", (e) => this.up(e));
    canvas.addEventListener("pointercancel", () => { this.drawing = false; this.stroke = []; });
  }

  start() {
    this.active = true;
    this.drawing = false;
    this.stroke = [];
    this.message = "";
    this.canvas.classList.add("editing");
  }

  stop() {
    this.active = false;
    this.drawing = false;
    this.stroke = [];
    this.canvas.classList.remove("editing");
  }

  // Mouse position -> track coordinates (the canvas is scaled on screen).
  toWorld(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * this.canvas.width,
      y: ((e.clientY - r.top) / r.height) * this.canvas.height,
    };
  }

  down(e) {
    if (!this.active) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.drawing = true;
    this.message = "";
    this.stroke = [this.toWorld(e)];
  }

  move(e) {
    if (!this.active || !this.drawing) return;
    const p = this.toWorld(e);
    const last = this.stroke[this.stroke.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) >= 6) this.stroke.push(p); // skip tiny jitters
  }

  up() {
    if (!this.active || !this.drawing) return;
    this.drawing = false;

    if (this.stroke.length < 10) {
      this.message = "Draw a longer line. Go all the way round.";
      this.stroke = [];
      return;
    }

    // Even spacing, then two light smoothing passes to iron out hand wobble.
    let loop = resampleLoop(this.stroke, 40);
    for (let pass = 0; pass < 2; pass++) {
      loop = loop.map((p, i) => {
        const a = loop[(i - 1 + loop.length) % loop.length];
        const b = loop[(i + 1) % loop.length];
        return { x: (a.x + 2 * p.x + b.x) / 4, y: (a.y + 2 * p.y + b.y) / 4 };
      });
    }

    const problem = loop.length < 8 ? "That loop is too small. Draw a bigger one." : this.onFinish(loop);
    if (problem) {
      this.message = problem;
      this.stroke = [];
    }
  }

  // Drawn on top of the (dimmed) old track while editing.
  draw(ctx) {
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    if (this.stroke.length === 0) {
      ctx.fillStyle = THEME.text;
      ctx.font = "300 40px 'Space Grotesk', sans-serif";
      ctx.fillText("DRAW A LOOP", this.canvas.width / 2, this.canvas.height / 2 - 6);
      ctx.fillStyle = this.message ? THEME.accent : THEME.muted;
      ctx.font = "400 17px 'Space Grotesk', sans-serif";
      ctx.fillText(this.message || "Press, drag all the way round, then let go. The ends join up by themselves.", this.canvas.width / 2, this.canvas.height / 2 + 28);
    } else {
      ctx.strokeStyle = THEME.accent;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      this.stroke.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      // Start marker
      ctx.fillStyle = THEME.text;
      ctx.beginPath();
      ctx.arc(this.stroke[0].x, this.stroke[0].y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = "start";
  }
}
