// theme.js — every colour used on the canvases, in one place.
// (The page's CSS uses the same palette; see the :root block in style.css.)
//
// Three colours only: purple, black and white.
//   purple = "the leader / active / positive"
//   white  = "the pack / negative links / sharp details"
//   dim purple = "crashed"

const THEME = {
  accent: "#a855f7",
  accentSoft: "rgba(168, 85, 247, 0.4)",
  crowd: "#ffffff",    // the ordinary cars (drawn see-through)
  crashed: "#6b55a0",  // wrecks
  negative: "#ffffff", // negative brain connections
  ground: "#000000",   // page / infield
  road: "#141218",
  wall: "#9d92bb",
  line: "#2a2040",     // chart axes etc.
  node: "#0b0812",
  text: "#ffffff",
  muted: "#a79fbd",
};
