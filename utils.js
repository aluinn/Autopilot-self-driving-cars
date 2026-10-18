// utils.js — small maths helpers shared by everything else.

// Where do two line segments cross?
// Segment 1 goes from A to B, segment 2 from C to D (each is {x, y}).
// Returns {x, y, offset} where offset (0..1) says how far along A->B the
// crossing is, or null if the segments don't touch.
function getIntersection(A, B, C, D) {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  if (bottom === 0) return null; // parallel lines never cross

  const t = tTop / bottom;
  const u = uTop / bottom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: A.x + t * (B.x - A.x),
      y: A.y + t * (B.y - A.y),
      offset: t,
    };
  }
  return null;
}

// Linear interpolation: a value t of the way from a to b.
function lerp(a, b, t) {
  return a + (b - a) * t;
}
