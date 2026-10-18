// track.js — builds the race track.
//
// A track starts as a "centre line": a loop of points down the middle of the road.
// We smooth it into a curve, then push points sideways by half the road width
// to get an inner wall and an outer wall. Walls are lists of line segments,
// which is all the collision and sensor code needs.
// The presets (tracks.js) and the hand-drawn editor (editor.js) both feed their
// centre lines into buildTrack().

const TRACK_WIDTH = 64;
const RESAMPLE_STEP = 16;   // centre-line points end up this many pixels apart
const WORLD_W = 1000, WORLD_H = 700; // the canvas size

// Turn a few control points into a smooth closed curve (Catmull-Rom spline).
// Each pair of neighbours gets `steps` extra points placed along a smooth curve.
function smoothLoop(points, steps = 12) {
  const out = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  return out;
}

// Re-space a closed loop of points so they are evenly `step` pixels apart.
// (Hand-drawn lines have uneven spacing; the walls and checkpoints want even spacing.)
function resampleLoop(points, step) {
  const n = points.length;
  const lens = points.map((p, i) => Math.hypot(points[(i + 1) % n].x - p.x, points[(i + 1) % n].y - p.y));
  const total = lens.reduce((a, b) => a + b, 0);
  const count = Math.max(3, Math.round(total / step));
  const spacing = total / count;

  const out = [];
  let seg = 0, segStart = 0; // which piece we're on, and how far along the loop it starts
  for (let k = 0; k < count; k++) {
    const target = k * spacing;
    while (seg < n - 1 && segStart + lens[seg] < target) { segStart += lens[seg]; seg++; }
    const t = lens[seg] > 0 ? (target - segStart) / lens[seg] : 0;
    const p = points[seg], q = points[(seg + 1) % n];
    out.push({ x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) });
  }
  return out;
}

// Push every centre-line point sideways by `dist` (negative = the other side).
function offsetLoop(centre, dist) {
  const n = centre.length;
  return centre.map((p, i) => {
    const prev = centre[(i - 1 + n) % n];
    const next = centre[(i + 1) % n];
    // Direction of travel here, then rotate 90° to get the sideways direction.
    let dx = next.x - prev.x, dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    return { x: p.x - dy * dist, y: p.y + dx * dist };
  });
}

// Area of a polygon (always positive). Used to tell inner from outer.
function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a / 2);
}

// Join a loop of points into line segments [{a, b}, ...].
// (`stamp` is scratch space used by the wall lookup grid below.)
function loopToSegments(pts) {
  return pts.map((p, i) => ({ a: p, b: pts[(i + 1) % pts.length], stamp: -1 }));
}

// --- Fast wall lookup --------------------------------------------------------
// Checking every car and sensor ray against all ~290 wall segments is slow.
// Instead we chop the world into a grid of squares and note which segments
// touch each square. To test a ray we only look at the squares it passes over.
const GRID_CELL = 80;

function buildGrid(segments) {
  const cells = new Map();
  for (const s of segments) {
    const x0 = Math.floor(Math.min(s.a.x, s.b.x) / GRID_CELL), x1 = Math.floor(Math.max(s.a.x, s.b.x) / GRID_CELL);
    const y0 = Math.floor(Math.min(s.a.y, s.b.y) / GRID_CELL), y1 = Math.floor(Math.max(s.a.y, s.b.y) / GRID_CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const key = cx * 10007 + cy;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(s);
      }
    }
  }
  return cells;
}

// Number of checkpoints = centre-line points / this. Smaller = more checkpoints.
const CHECKPOINT_SPACING = 4;

// Build a complete track object from a list of control points.
function buildTrack(controlPoints, width = TRACK_WIDTH) {
  const centre = resampleLoop(smoothLoop(controlPoints), RESAMPLE_STEP);
  const sideA = offsetLoop(centre, width / 2);
  const sideB = offsetLoop(centre, -width / 2);
  // Whichever loop encloses more area is the outer wall.
  const aIsOuter = polygonArea(sideA) > polygonArea(sideB);
  const outer = aIsOuter ? sideA : sideB;
  const inner = aIsOuter ? sideB : sideA;

  // Start line: first centre point, facing along the road.
  const p = centre[0], q = centre[1];
  const start = { x: p.x, y: p.y, angle: Math.atan2(q.y - p.y, q.x - p.x) };

  // Checkpoints: invisible lines straight across the road, in driving order.
  // sideA[i] and sideB[i] are the two wall points directly across from each other.
  // They sit a little past the start line so the first one is ahead of the cars.
  const checkpoints = [];
  for (let i = 2; i < centre.length; i += CHECKPOINT_SPACING) {
    const a = sideA[i], b = sideB[i];
    checkpoints.push({ a, b, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } });
  }

  const walls = loopToSegments(outer).concat(loopToSegments(inner));
  const grid = buildGrid(walls);
  let queryStamp = 0;
  const found = []; // reused every call to avoid creating garbage

  return {
    centre, outer, inner, start, width, checkpoints, walls,
    // Which wall segments might be inside this box? (Returned list is reused —
    // use it straight away, don't keep it.)
    query(minX, minY, maxX, maxY) {
      queryStamp++;
      found.length = 0;
      const x1 = Math.floor(maxX / GRID_CELL), y1 = Math.floor(maxY / GRID_CELL);
      for (let cx = Math.floor(minX / GRID_CELL); cx <= x1; cx++) {
        for (let cy = Math.floor(minY / GRID_CELL); cy <= y1; cy++) {
          const list = grid.get(cx * 10007 + cy);
          if (!list) continue;
          for (const s of list) {
            if (s.stamp !== queryStamp) { s.stamp = queryStamp; found.push(s); } // skip duplicates
          }
        }
      }
      return found;
    },
  };
}

// Is this track usable? Returns null if fine, or a friendly message saying what's wrong.
// Hand-drawn tracks can have corners too tight for the road width (the walls fold over
// themselves), loops that cross, or parts that run too close together.
function validateTrack(track) {
  const n = track.centre.length;
  const length = n * RESAMPLE_STEP;
  if (length < 900) return "That loop is too small. Draw a bigger one.";
  if (length > 5500) return "That track is far too long. Try a shorter loop.";

  for (const p of track.outer.concat(track.inner)) {
    if (p.x < 0 || p.x > WORLD_W || p.y < 0 || p.y > WORLD_H) return "Too close to the edge. Keep the road inside the box.";
  }

  // Two different parts of the road squeezed together (or crossing, like a figure 8).
  const minGap = Math.ceil((3 * track.width) / RESAMPLE_STEP);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.min(j - i, n - (j - i)) <= minGap) continue; // neighbours along the road
      const d = Math.hypot(track.centre[i].x - track.centre[j].x, track.centre[i].y - track.centre[j].y);
      if (d < track.width * 1.3) return "Two parts of the track are too close together. Give the road some space.";
    }
  }

  // Walls that cross themselves = a corner that's too tight for the road width.
  const walls = track.walls;
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const sameLoop = (i < n) === (j < n);
      const adjacent = sameLoop && (j - i === 1 || j - i === n - 1);
      if (adjacent) continue;
      if (getIntersection(walls[i].a, walls[i].b, walls[j].a, walls[j].b)) {
        return "A corner is too tight for the road width. Use gentler bends.";
      }
    }
  }
  return null;
}

// Draw the road and walls.
function drawTrack(ctx, track) {
  const trace = (pts) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
  };

  // Road: fill the outer shape, then cut the inner shape back out.
  ctx.fillStyle = THEME.road;
  trace(track.outer);
  ctx.fill();
  ctx.fillStyle = THEME.ground;
  trace(track.inner);
  ctx.fill();

  // Walls: plain blue-grey lines.
  ctx.strokeStyle = THEME.wall;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  trace(track.outer); ctx.stroke();
  trace(track.inner); ctx.stroke();

  // Start line across the road.
  const s = track.start;
  const nx = -Math.sin(s.angle), ny = Math.cos(s.angle);
  ctx.strokeStyle = THEME.muted;
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x + nx * track.width / 2, s.y + ny * track.width / 2);
  ctx.lineTo(s.x - nx * track.width / 2, s.y - ny * track.width / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}
