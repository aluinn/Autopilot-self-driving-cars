// car.js — one car: its physics, its crash detection, its progress round the
// track, and how it's drawn.
//
// A car is controlled by four on/off switches: forward, reverse, left, right.
// A human flips them with the keyboard; an AI car's neural network flips them.

class Car {
  // Pass a NeuralNetwork as `brain` to make an AI car; leave it out for a human car.
  constructor(x, y, angle, brain = null) {
    this.brain = brain;
    this.x = x;
    this.y = y;
    this.angle = angle;   // direction the nose points, in radians (0 = right)
    this.speed = 0;

    this.width = 16;
    this.length = 28;

    // Physics settings
    this.acceleration = 0.2;
    this.maxSpeed = 4;
    this.maxReverse = 1.5;
    this.friction = 0.05;
    this.turnRate = 0.045;

    // "crashed" means stopped for good: hit a wall, got stuck, or went backwards.
    this.crashed = false;

    // Progress tracking (used for fitness)
    this.passed = 0;                  // checkpoints passed so far, across all laps
    this.ticks = 0;                   // how long this car has been alive
    this.ticksSinceCheckpoint = 0;    // for the "you're stuck" rule
    this.distance = 0;                // total distance driven
    this.fitness = 0;

    this.sensor = new Sensor(this); // the car's eyes (see sensor.js)
  }

  // Advance the car by one tick. `controls` = {forward, reverse, left, right}.
  update(controls, track) {
    if (this.crashed) return;

    // AI cars ignore the keyboard and let their brain press the switches.
    if (this.brain) controls = this.think();

    // Speed up / slow down
    if (controls.forward) this.speed += this.acceleration;
    if (controls.reverse) this.speed -= this.acceleration;

    // Cap the speed
    this.speed = Math.max(-this.maxReverse, Math.min(this.maxSpeed, this.speed));

    // Friction slowly drags the car to a stop when you let go
    if (this.speed > 0) this.speed = Math.max(0, this.speed - this.friction);
    if (this.speed < 0) this.speed = Math.min(0, this.speed + this.friction);

    // Steering only works while moving, and flips when reversing (like a real car)
    if (this.speed !== 0) {
      const direction = this.speed > 0 ? 1 : -1;
      const grip = Math.min(1, Math.abs(this.speed) / 2); // gentle at very low speed
      if (controls.left) this.angle -= this.turnRate * direction * grip;
      if (controls.right) this.angle += this.turnRate * direction * grip;
    }

    // Move in the direction we're facing
    const prevX = this.x, prevY = this.y;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.ticks++;
    this.distance += this.speed;

    // Look around from the new position
    this.sensor.update(track);

    // Did we hit a wall?
    if (this.hitsWall(track)) {
      this.crashed = true;
      this.speed = 0;
    } else if (this.brain) {
      this.trackProgress(track, prevX, prevY);
    }

    this.fitness = this.calcFitness(track);
  }

  // Count checkpoints, and apply the extra "kill" rules for AI cars.
  trackProgress(track, prevX, prevY) {
    const cps = track.checkpoints, n = cps.length;
    const from = { x: prevX, y: prevY }, to = { x: this.x, y: this.y };

    const target = cps[this.passed % n];            // the next one to reach
    const behind = cps[(this.passed - 1 + n) % n];  // the one we just passed

    if (getIntersection(from, to, target.a, target.b)) {
      this.passed++;
      this.ticksSinceCheckpoint = 0;
    } else {
      this.ticksSinceCheckpoint++;
      // Rule: crossing the previous checkpoint the wrong way = driving backwards.
      if (getIntersection(from, to, behind.a, behind.b)) this.kill();
      // Rule: no new checkpoint for ~3 seconds (at 60 ticks/second) = stuck.
      if (this.ticksSinceCheckpoint > 180) this.kill();
    }
  }

  kill() {
    this.crashed = true;
    this.speed = 0;
  }

  // Fitness = how good this car is. A bigger number is better:
  //   whole checkpoints passed        (the main thing)
  // + progress towards the next one   (0 to 1, the tiebreaker)
  // + a small bonus for average speed (0 to 0.5)
  calcFitness(track) {
    const cps = track.checkpoints, n = cps.length;
    const next = cps[this.passed % n].mid;
    const prev = cps[(this.passed - 1 + n) % n].mid;
    const gap = Math.hypot(next.x - prev.x, next.y - prev.y) || 1;
    const dist = Math.hypot(next.x - this.x, next.y - this.y);
    const progress = Math.max(0, Math.min(0.99, 1 - dist / gap));
    const avgSpeed = this.ticks > 0 ? Math.max(0, this.distance / this.ticks) : 0;
    return this.passed + progress + 0.5 * (avgSpeed / this.maxSpeed);
  }

  // Whole laps completed.
  laps(track) {
    return Math.floor(this.passed / track.checkpoints.length);
  }

  // The brain looks at the sensors + speed and decides which switches to press.
  think() {
    const inputs = [...this.sensor.readings, this.speed / this.maxSpeed];
    const out = this.brain.feedForward(inputs);
    // Each output is between -1 and 1; above 0 means "switch on".
    return { forward: out[0] > 0, reverse: out[1] > 0, left: out[2] > 0, right: out[3] > 0 };
  }

  // The car's four corners, as points in the world.
  corners() {
    const hl = this.length / 2, hw = this.width / 2;
    const cos = Math.cos(this.angle), sin = Math.sin(this.angle);
    // [forward offset, sideways offset] for each corner
    return [[hl, -hw], [hl, hw], [-hl, hw], [-hl, -hw]].map(([f, s]) => ({
      x: this.x + cos * f - sin * s,
      y: this.y + sin * f + cos * s,
    }));
  }

  // Does any side of the car (corner to corner) cross a nearby wall segment?
  hitsWall(track) {
    const c = this.corners();
    const xs = c.map((p) => p.x), ys = c.map((p) => p.y);
    const nearby = track.query(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    for (let i = 0; i < 4; i++) {
      const a = c[i], b = c[(i + 1) % 4];
      for (const w of nearby) {
        if (getIntersection(a, b, w.a, w.b)) return true;
      }
    }
    return false;
  }

  // alpha: 1 = solid, lower = see-through. highlight: purple glow (best / human car).
  // Glow is slow to draw, so the crowd of ordinary cars goes without it.
  draw(ctx, alpha = 1, highlight = true) {
    const c = this.corners();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    c.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();

    // Crowd cars are white; the highlighted car is purple; crashed cars are dim purple.
    const colour = this.crashed ? THEME.crashed : highlight ? THEME.accent : THEME.crowd;
    ctx.fillStyle = colour;
    if (highlight) {
      ctx.shadowColor = colour;
      ctx.shadowBlur = 10;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    if (highlight) {
      // A white dot at the nose so you can see which way it faces
      ctx.fillStyle = THEME.text;
      ctx.beginPath();
      ctx.arc((c[0].x + c[1].x) / 2, (c[0].y + c[1].y) / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
