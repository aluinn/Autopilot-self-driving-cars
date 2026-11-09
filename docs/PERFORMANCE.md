# Performance

Numbers from a script you can re-run: `npm run bench` ([`tools/benchmark.js`](../tools/benchmark.js)).

## Machine

Apple M1 Pro, 8 cores, macOS (darwin arm64), Node v24.20.0, Chrome (headless, via Playwright), run on 2026-11-09.
Single machine, a handful of runs each (medians of 5): treat the numbers as orders of magnitude, not guarantees.

## Results

**Simulation core in Node** (100 cars, no rendering, 600 steps per run):

| Track | Brains | ms per step | avg cars alive | max steps per 60 fps frame |
|---|---|---|---|---|
| easy | random | 0.051 | 20.0 | 325 |
| easy | demo | 0.233 | 92.0 | 71 |
| medium | random | 0.050 | 19.3 | 334 |
| medium | demo | 0.245 | 93.4 | 68 |
| hard | random | 0.052 | 20.3 | 319 |
| hard | demo | 0.216 | 81.9 | 77 |

"Demo" means mutated copies of the demo brain, which mostly survive, so most of the 100 cars are being simulated: the
heavy case. Random brains crash within a few ticks, so most cars are idle. A step costs roughly 2.5 µs per live car per step.

**Wall lookup** (Medium track, demo brains): with the spatial grid 0.240 ms/step; testing every wall segment 1.029 ms/step, **4.3× slower**.

**Breeding** a generation (`nextGeneration`, 100 brains): 0.43 ms.

**In headless Chrome** (Medium track, demo brain, with rendering): 60.2 frames per second at 1×, 5× and 20× (the display refresh cap). Timing the page's own
functions directly: `step()` ≈ 0.15 ms and `draw()` ≈ 0.09 ms with 59 of 100 cars alive at that moment,
so a 20× frame costs about 3 ms of the 16.7 ms budget. (An earlier run gave 0.12 ms and 0.09 ms with 49 cars alive: it varies with how many cars are alive.)

## What this means

- On this machine the simulation is far from a bottleneck; 20× fits easily. Slower machines and phones were **not** measured, so the claim "20× can drop frames on slow devices" is a hypothesis.
- Rendering is a small share of the frame at 1×, and simulation dominates as the speed goes up.
- Headless Chrome may not behave like a headed browser with a real GPU and compositor. These are indicative, not definitive.

## Pitfall found while measuring

The first version of the benchmark loaded the sources with `vm.createContext` (as the unit tests do) and reported about 2 ms per step. That looked
inconsistent with the browser's 60 fps at 20×. Loading the identical code with `vm.runInThisContext` gave about 0.25 ms. Global variable lookups in a `vm` sandbox are much slower, so benchmark or train in the main context.

## Reproduce

```bash
npm install
npm run bench          # prints the machine, then the tables above
```

If Playwright can't start a browser the second half is skipped with a message.
