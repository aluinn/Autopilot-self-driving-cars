# Roadmap

Autopilot is a teaching toy that doubles as a small neuroevolution lab. This is a list of
directions, not promises. Items link to issue drafts in [`docs/issues/`](docs/issues) when
one exists. Want to take one? Open an issue first so we don't duplicate work.

## Now: polish and robustness
- Narration that knows when a trained brain is loaded ([draft](docs/issues/01-narrator-after-demo.md)).
- Import brains from a file, to match Export ([draft](docs/issues/02-import-brain-json.md)).
- Pause button ([draft](docs/issues/03-pause-button.md)).
- Self-hosted font so the app works fully offline ([draft](docs/issues/04-self-host-font.md)).
- Remember the track you drew ([draft](docs/issues/05-persist-custom-track.md)).

## Next: make experiments reproducible and shareable
- Seeded random numbers so a run can be replayed ([draft](docs/issues/06-seeded-rng.md)).
- Share a track through a link ([draft](docs/issues/07-share-track-url.md)).
- Configurable population size and number of rays ([draft](docs/issues/08-configurable-population-and-rays.md)).
- Run the simulation in a Web Worker so 20× stays smooth ([draft](docs/issues/09-web-worker-training.md)).
- Reward smoother driving and penalise jerky steering ([draft](docs/issues/10-smooth-driving-fitness.md)).

## Later: bigger ideas
- Give cars a camera-like view (more rays or a coarse image) and a deeper network.
- Traffic, other cars and moving obstacles.
- Other learning methods (NEAT, reinforcement learning) compared side by side.
- Evolve the sensor layout itself: how many rays, at what angles.
- Train on many randomly generated tracks so the final brain generalises everywhere.
- Speed limits, junctions and traffic lights.
