// tracks.js — the three preset tracks. Each is just a loop of points down the
// middle of the road (clockwise, 1000 x 700 world); track.js turns it into walls
// and checkpoints. Cars start at the first point.

const PRESETS = {
  // Wide, smooth, forgiving bends.
  easy: {
    label: "Easy",
    points: [
      { x: 500, y: 110 }, { x: 760, y: 150 }, { x: 880, y: 350 }, { x: 780, y: 540 },
      { x: 500, y: 600 }, { x: 230, y: 540 }, { x: 120, y: 350 }, { x: 240, y: 160 },
    ],
  },
  // A few bends and one tighter corner near the bottom right.
  medium: {
    label: "Medium",
    points: [
      { x: 200, y: 150 }, { x: 450, y: 110 }, { x: 750, y: 130 },
      { x: 880, y: 240 }, { x: 860, y: 400 }, { x: 740, y: 450 },
      { x: 680, y: 570 }, { x: 480, y: 600 }, { x: 330, y: 580 },
      { x: 210, y: 500 }, { x: 120, y: 410 }, { x: 90, y: 280 },
    ],
  },
  // Snaking, with S-bends and a hairpin.
  hard: {
    label: "Hard",
    points: [
      { x: 150, y: 110 }, { x: 400, y: 90 }, { x: 600, y: 170 }, { x: 780, y: 100 },
      { x: 910, y: 200 }, { x: 860, y: 320 }, { x: 750, y: 330 }, { x: 690, y: 390 }, { x: 740, y: 460 },
      { x: 870, y: 520 }, { x: 880, y: 610 }, { x: 740, y: 650 }, { x: 590, y: 600 }, { x: 470, y: 480 },
      { x: 330, y: 600 }, { x: 160, y: 620 }, { x: 70, y: 500 }, { x: 160, y: 380 },
      { x: 70, y: 260 },
    ],
  },
};
