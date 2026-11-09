---
title: "Remember the track you drew"
labels: ["good first issue", "enhancement"]
---

## Context
`customTrack` in `main.js` lives only in memory (`main.js:14`, set at ~line 262), so a page refresh loses a track the user may have spent time drawing.
Brains can already be saved to `localStorage`; tracks can't.

## Task
Save the accepted control points of the drawn track to `localStorage` (guarded with try/catch, like the brain Save code) and restore it on page load,
adding the "Your track" option to the dropdown without switching to it automatically.

## Acceptance
- Draw a track, reload the page: "Your track" is in the dropdown and selecting it works.
- Corrupt or missing stored data is ignored silently and the app starts normally.
- A restored track still goes through `buildTrack` and `validateTrack` before use.
- If storage is blocked, nothing breaks.
- An e2e or unit test covers the round trip.

## Pointers
- `main.js`: the `TrackEditor` callback (~lines 252-280) receives `points`; store those, not the built track.
- `track.js`: `buildTrack`, `validateTrack`.
- Existing pattern to copy: `SAVE_KEY` and the Save/Load handlers.
