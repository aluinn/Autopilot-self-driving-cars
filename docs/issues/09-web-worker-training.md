---
title: "Run the simulation in a Web Worker"
labels: ["enhancement"]
---

## Context
`frame()` in `main.js` runs `stepsPerFrame` (up to 20) simulation steps on the main thread before each draw. On the maintainer's machine this is cheap
(see `docs/PERFORMANCE.md`: about 3 ms of a 16.7 ms frame at 20×), but slower devices were not measured and a long step loop can delay input handling. Moving the simulation
to a worker is the standard fix and would also allow faster-than-20× speeds.

## Task
Prototype a worker that owns the cars and runs steps, posting back the minimal state needed for drawing (car poses, crashed flags, the best car's sensor readings and
network activations, and the per-generation history). Keep the "no build step" rule: a classic worker script loaded with `importScripts` of the existing files is fine.

## Acceptance
- Behaviour matches the current version: generations, narrator, save/load/export, manual driving and the editor all still work.
- A before/after measurement from `npm run bench` or a new script is included in the PR, on a throttled CPU if possible (Chrome DevTools or Playwright CPU throttling).
- The e2e test passes. Note which features, if any, stay on the main thread.
- The architecture doc (`docs/ARCHITECTURE.md`) is updated with the new data flow.

## Pointers
- The simulation files (`utils`, `track`, `tracks`, `sensor`, `network`, `car`, `evolution`) have no DOM dependencies; `tools/train-demo.js` already runs them without a browser.
- Beware: `Car.draw`, `Sensor.draw` and `drawTrack` use the canvas and `THEME`, so drawing needs the state copied back.
- This is the largest of the drafts; consider splitting it (worker for the AI population first, manual driving later).
