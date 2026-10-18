# Autopilot

**100 simulated cars teach themselves to drive: a neural network and evolution, written from scratch in plain JavaScript.**

**▶ Live demo:** https://autopilot-one-iota.vercel.app

https://github.com/user-attachments/assets/de0f70c0-36ed-484e-b652-33bd68b68beb

## What is this?

A 2D race track is drawn on a canvas and 100 cars drive on it. Nobody programs how to drive. Each car has a tiny neural network for a brain, and at the start those brains are random, so nearly every car crashes. After each generation, the best cars are copied, mixed and slightly mutated to make the next batch. Within a few generations, cars are completing laps.

There are no libraries, no frameworks, no build step and no backend. Everything, including the neural network and the genetic algorithm, is written by hand.

## How it works

**1. Sensing.** Each car fires 5 invisible rays across about 120° in front of it. Each ray finds the nearest wall (line-segment intersection maths) and returns a number from 0 (nothing in range) to 1 (wall touching). It is a simple version of what lidar does on a real vehicle.

**2. Thinking (the neural network).** The 5 sensor readings plus the car's current speed go into a small feed-forward neural network:

```
6 inputs  →  6 hidden neurons  →  4 outputs (forward, reverse, left, right)
```

Every connection has a *weight* and every neuron has a *bias*: 70 numbers in total. These numbers are the car's whole personality. An output above zero means "press that key".

**3. Scoring (fitness).** A car's score is the number of checkpoints it has passed (across laps), with progress towards the next checkpoint as a tiebreaker and a small bonus for speed. Cars are removed if they crash, go backwards, or fail to reach a new checkpoint for about 3 seconds.

**4. Evolution (the genetic algorithm).** When a generation ends:

- the **top 5** brains are copied unchanged (*elitism*),
- other brains are chosen from the top quarter, with fitter cars more likely to be picked (*selection*),
- half the children mix two parents' weights (*crossover*),
- every child gets a few random nudges (*mutation*, set by the slider).

Repeat, and the average driver improves.

### How this relates to real autonomous vehicles

Companies building self-driving cars and robots train and test in simulation first, using tools such as NVIDIA's simulators, so software can fail millions of times safely before it meets a real road. Real systems use much larger neural networks fed by cameras, radar and lidar, and mostly learn from data and reinforcement learning rather than evolution, but the core idea is the same: let software learn by driving in a virtual world.

## Controls

| Control | What it does |
|---|---|
| **Time machine** (1x / 5x / 20x) | Run several simulation steps per frame to fast-forward learning |
| **Mutation slider** | How many of a child's weights get nudged (0% = clones, 50% = chaos) |
| **Track dropdown** | Easy, Medium or Hard preset (or "Your track") |
| **Draw your own track** | Draw a closed loop with mouse or finger; walls and checkpoints are generated automatically |
| **Keep brains when the track changes** | Off: learning restarts. On: the current drivers are dropped on the new track to test whether they generalise |
| **Take the wheel** | Drive one car yourself with the arrow keys (on-screen arrows on touch devices) |
| **Reset learning** | Start again from random brains |
| **Watch a trained driver** | Load the pre-trained demo brain |
| **Save / Load** | Store the best brain in your browser (localStorage) and bring it back |
| **Export** | Download the best brain as a JSON file |
| **How it works** | Short explanation pop-up |

## Run it locally

No install needed.

1. Open the folder in **VS Code**.
2. Install the **Live Server** extension.
3. Right-click `index.html` → **Open with Live Server**.

Any static file server works too, for example `python3 -m http.server` in this folder, then open `http://localhost:8000`.

## Project structure

| File | Job |
|---|---|
| `index.html`, `style.css` | The page and its look |
| `theme.js` | Every canvas colour in one place |
| `utils.js` | Line-segment intersection and small maths helpers |
| `track.js` | Builds walls and checkpoints from a centre line; checks a track is usable |
| `tracks.js` | The three preset tracks |
| `editor.js` | Draw-your-own-track tool |
| `sensor.js` | The car's rays |
| `network.js` | The neural network (forward pass, clone, mutate, crossover, save/load) |
| `car.js` | Car physics, collisions, checkpoints and fitness |
| `evolution.js` | The genetic algorithm |
| `chart.js`, `brainvis.js` | The learning-curve chart and live brain visualiser |
| `demo.js` | The pre-trained brain (generated) |
| `main.js` | Game loop, generations, buttons |
| `tools/train-demo.js` | Re-trains the demo brain on your computer: `node tools/train-demo.js` |

## Ideas for future work

- Give cars a camera-like view (more rays, or a coarse image) and a deeper network.
- Add traffic, other cars and moving obstacles.
- Reward smoother driving and penalise jerky steering.
- Try other learning methods (NEAT, reinforcement learning) and compare them.
- Evolve the sensor layout itself: how many rays, and at what angles.
- Train on many randomly generated tracks so the final brain generalises everywhere.
- Add speed limits, junctions and traffic lights.
- Share brains and tracks through a link.

## Deploying

This is a static site: deploy the folder as-is to Vercel, Netlify or GitHub Pages. No build command is needed.
