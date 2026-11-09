---
title: "Narrator says \"pure chaos\" after loading a trained brain"
labels: ["good first issue", "bug"]
---

## Context
`startFromBrain()` in `main.js` (used by **Watch a trained driver** and **Load**) resets `generation` to 1.
`narration()` then returns "Generation 1: pure chaos. Every brain is random, so most cars crash in seconds." (`main.js:308`)
even though the cars are skilled and mostly surviving. It is visible in the screenshots in `docs/assets/`: a trained driver doing laps under a "pure chaos" caption.

## Task
Make the narrator aware of where the population came from, so that after loading a demo or saved brain it says something truthful
(for example "Starting from a trained brain. Watch what it remembers."), and goes back to the normal messages once it has evolved or the learning is reset.

## Acceptance
- After **Watch a trained driver**, the narrator never says that brains are random.
- After **Reset learning**, generation 1 still shows the "pure chaos" message.
- The existing "finished a lap" / "multiple laps" messages still take priority when they apply.
- `npm run lint && npm test && npm run e2e` pass.

## Pointers
- `main.js`: `startFromBrain()` (~line 68), `resetLearning()` (~line 49), `narration()` (~line 301).
- Hint: a module-level flag such as `startedFromTrainedBrain`, set in `startFromBrain` and cleared in `resetLearning`, is enough.
