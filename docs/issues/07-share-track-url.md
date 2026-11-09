---
title: "Share a track through a link"
labels: ["enhancement"]
---

## Context
The README roadmap lists "Share brains and tracks through a link". Today a drawn track exists only in the current tab. Editor output is a short list of
control points (`TrackEditor.up` resamples the stroke to 40 px spacing), which is small enough to fit in a URL.

## Task
Add a **Copy link** action that encodes the custom track's control points into the URL hash (for example a compact base64 of rounded integer coordinates),
and make the page load such a link by building the track, validating it, and selecting "Your track".

## Acceptance
- Opening a copied link in a fresh tab shows the same track.
- A malformed or hostile hash is ignored with a friendly message and no exceptions. Decoded points are validated (count and numeric range) and pass `validateTrack` before use.
- The link length for a typical track is reported in the PR, and the format is documented in `docs/ARCHITECTURE.md`.
- Decide and document what happens when the link is opened while the user has a drawn track already.

## Pointers
- `editor.js`: `up()`; `main.js`: the editor callback (~line 252) and `changeTrack()`.
- `track.js`: `buildTrack`, `validateTrack`.
- Consider combining with issue 05 (persisting the track) so both share the same encode/decode code.
