---
title: "Configurable population size and number of sensor rays"
labels: ["enhancement"]
---

## Context
Population is a constant (`POPULATION_SIZE = 100`, `main.js:5`), the network shape is hard-coded in `main.js:45` and the sensor has `rayCount = 5` (`sensor.js:12`).
The README ideas list asks for "more rays" and experimenting with the sensor layout. The input count of the network is `rayCount + 1` (the +1 is speed), so these must stay in sync,
and the sensor read-out in the UI has five hard-coded bars (`main.js:117`).

## Task
Expose population size (for example 20-300) and ray count (for example 3-9) as controls under "Training". Changing either restarts learning.

## Acceptance
- Changing the ray count rebuilds the networks with the right input size, and the brain visualiser and sensor read-out show the new layout.
- The demo brain and saved brains (which assume 5 rays) are handled gracefully: **Watch a trained driver** is disabled or explains why when the ray count isn't 5; loading an incompatible saved brain shows a message.
- Population size changes are reflected in the "Still driving" counter.
- Unit tests cover `Sensor` with several ray counts, and the e2e test still passes.

## Pointers
- `sensor.js`, `network.js` (`sizes`), `main.js` (`randomBrains`, `populationFrom`, `readoutBars`), `brainvis.js` (`INPUT_LABELS`).
- `docs/PERFORMANCE.md` gives a per-car cost to reason about the upper limits.
