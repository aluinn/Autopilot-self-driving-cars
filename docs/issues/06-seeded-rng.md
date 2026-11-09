---
title: "Seeded random numbers for reproducible runs"
labels: ["enhancement"]
---

## Context
All randomness comes from `Math.random()`: initial weights and mutation in `network.js` (lines 28, 31, 95, 108, 109) and parent selection and crossover choice
in `evolution.js` (lines 28, 39). A run can never be replayed, which makes bug reports, comparisons between settings and teaching examples hard.
`test/helpers.js` already contains a small seeded generator (`seededRandom`, mulberry32) that the unit tests inject.

## Task
Introduce a single `random()` function (default: `Math.random`) used everywhere the code currently calls `Math.random`, with a way to seed it
(for example a `?seed=123` URL parameter, shown on the page), so the same seed gives the same sequence of generations.

## Acceptance
- With the same seed and the same settings, two page loads produce the same generation-1 best fitness and the same generation-2 population.
- Without a seed, behaviour is unchanged.
- The seed is shown somewhere in the UI, and the README FAQ ("Are runs reproducible?") is updated.
- Unit tests prove determinism for `nextGeneration` and `NeuralNetwork.mutate` given a seeded `random`.
- Note: the physics is already deterministic, but check that user input (manual driving) and frame timing don't leak into AI cars.

## Pointers
- `utils.js` is the natural home for the shared function.
- `test/helpers.js` (the current test-only injection) can be simplified once this lands.
- `tools/train-demo.js` could accept a seed to make the demo brain reproducible.
