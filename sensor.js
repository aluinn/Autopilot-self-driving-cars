// sensor.js — the car's "eyes".
//
// The sensor fires 5 invisible rays from the car's nose, fanned out across 120°.
// Each ray travels up to `rayLength` pixels and stops at the first wall it hits.
// The reading for each ray is a number from 0 to 1:
//   0 = nothing in range (clear road), 1 = wall touching the car.
// These 5 numbers are what the neural network will "see" in Phase 3.

class Sensor {
  constructor(car) {
    this.car = car;
    this.rayCount = 5;
    this.rayLength = 150;
    this.raySpread = (120 * Math.PI) / 180; // 120° in radians

    this.rays = [];      // each ray: [start point, end point]
    this.hits = [];      // where each ray touched a wall (or null)
    this.readings = new Array(this.rayCount).fill(0);
  }

  // Re-measure everything from the car's current position and direction.
  update(track) {
    this.rays = [];
    this.hits = [];

    for (let i = 0; i < this.rayCount; i++) {
      // Spread rays evenly from -60° (left) to +60° (right) of the car's heading.
      const t = this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1);
      const rayAngle = this.car.angle + lerp(-this.raySpread / 2, this.raySpread / 2, t);

      const start = { x: this.car.x, y: this.car.y };
      const end = {
        x: start.x + Math.cos(rayAngle) * this.rayLength,
        y: start.y + Math.sin(rayAngle) * this.rayLength,
      };

      // Find the closest wall this ray crosses (only checking nearby walls).
      let closest = null;
      const nearby = track.query(
        Math.min(start.x, end.x), Math.min(start.y, end.y),
        Math.max(start.x, end.x), Math.max(start.y, end.y));
      for (const w of nearby) {
        const hit = getIntersection(start, end, w.a, w.b);
        if (hit && (!closest || hit.offset < closest.offset)) closest = hit;
      }

      this.rays.push([start, end]);
      this.hits.push(closest);
      // offset is how far along the ray the hit is (0 = at the car, 1 = at max range),
      // so flip it: close wall -> big reading.
      this.readings[i] = closest ? 1 - closest.offset : 0;
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.rays.length; i++) {
      const [start, end] = this.rays[i];
      const hit = this.hits[i];
      const stop = hit || end; // draw up to the wall if there is one

      ctx.strokeStyle = THEME.accentSoft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(stop.x, stop.y);
      ctx.stroke();

      if (hit) {
        ctx.fillStyle = THEME.text;
        ctx.beginPath();
        ctx.arc(hit.x, hit.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
