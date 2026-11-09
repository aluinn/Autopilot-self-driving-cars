---
title: "Add a pause button"
labels: ["good first issue", "enhancement"]
---

## Context
The simulation only pauses while you are drawing a track (`if (editing) return;` in `step()`). There is no way to freeze the cars to look
closely at the sensor read-out or the brain diagram.

## Task
Add a **Pause / Resume** control (and the space bar as a shortcut) that stops simulation steps but keeps drawing, so the panels
stay live and the canvas doesn't go blank.

## Acceptance
- Clicking the button, or pressing Space (when no text control has focus), toggles pause; the label reflects the state.
- While paused, the generation, alive count and cars do not change; resuming continues from the same tick.
- Pausing and then taking the wheel, switching tracks or resetting still behaves sensibly (decide, and document the choice in the PR).
- The space bar doesn't scroll the page while the shortcut is active.

## Pointers
- `main.js`: `step()` (~line 98), the keyboard section (~line 324), `frame()` at the end.
- `index.html`: the Training column, next to the Time machine segmented control.
