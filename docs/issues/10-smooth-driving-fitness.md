---
title: "Experiment: reward smoother driving"
labels: ["enhancement"]
---

## Context
The fitness (`Car.calcFitness`, `car.js:115`) counts checkpoints, progress and a small speed bonus. Evolved drivers often wobble between left and right. The README ideas list
asks to "reward smoother driving and penalise jerky steering". The car already knows its steering switches each tick (`controls.left` / `controls.right` in `Car.update`).

## Task
Track how often a car changes its steering command (or the total absolute heading change per distance) and subtract a small penalty from fitness, behind a UI toggle
("Reward smooth driving") so the effect can be compared with the default.

## Acceptance
- With the toggle off, fitness values are identical to today (a unit test pins this).
- With it on, a car that goes straight scores higher than one that zig-zags the same distance (unit test).
- The penalty can't make a car that passes more checkpoints rank below one that passes fewer (document how you ensured that, e.g. cap at less than one checkpoint's worth).
- `docs/TRAINING.md` documents the new term; the PR includes a short comparison of learning curves with and without it (state how many runs you used; one run is anecdote).

## Pointers
- `car.js`: `update`, `think`, `calcFitness`; `main.js`: the Training controls; `tools/train-demo.js` if you want a smoother demo brain (don't commit a re-trained `demo.js` in the same PR).
