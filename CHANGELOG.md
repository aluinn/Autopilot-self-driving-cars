# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project documentation: README with screenshots, `docs/ARCHITECTURE.md`, `docs/DATA_SOURCES.md`, `docs/PERFORMANCE.md`, ROADMAP and issue drafts in `docs/issues/`.
- Community files: LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CITATION.cff, issue and PR templates, Dependabot config.
- `tools/screenshots.js` to regenerate the README screenshots with Playwright.
- Unit tests, an end-to-end smoke test and CI/CodeQL workflows.

## [1.0.0] - 2026-10-18

### Added
- Neural network (6 → 6 → 4) and genetic algorithm (elitism, fitness-weighted selection, crossover, mutation), hand-written.
- 100-car simulation with five lidar-style rays per car, crash and stuck detection, and checkpoint-based fitness.
- Easy, Medium and Hard preset tracks, plus a draw-your-own-track editor with validation.
- Learning-curve chart, sensor read-out and live network visualiser.
- Time machine (1×/5×/20×), mutation slider, manual driving, and a "keep brains" generalisation toggle.
- Pre-trained demo brain and `tools/train-demo.js` to regenerate it.
- Save, load and export of brains.

[Unreleased]: https://github.com/aluinn/autopilot/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/aluinn/autopilot/releases/tag/v1.0.0
