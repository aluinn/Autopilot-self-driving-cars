---
title: "Import a brain from a JSON file"
labels: ["good first issue", "enhancement"]
---

## Context
**Export** downloads `autopilot-brain.json`, but there is no way to load a file back in; **Load** only reads the copy in `localStorage`.
That makes it impossible to share a brain with someone else.

## Task
Add an **Import** button next to Save / Load / Export that lets the user pick a `.json` file and start learning from that brain
(the same way **Load** does).

## Acceptance
- Importing a file produced by Export restores a population based on that brain, and shows a status message.
- A file that isn't valid JSON, or has the wrong shape, shows a friendly message in the status line and changes nothing.
- A brain whose `sizes` isn't `[6, 6, 4]` is rejected with a clear message (the sensor and car code assume 6 inputs and 4 outputs).
- Bonus: make `NeuralNetwork.fromJSON` refuse absurdly large `sizes` (see the known limitation in `SECURITY.md`).
- A unit test in `test/core.test.js` covers the new validation.

## Pointers
- `index.html`: the `btn-row` with `saveBtn`, `loadBtn`, `exportBtn`.
- `main.js`: the Save / Load / Export handlers (~lines 152-205) and `startFromBrain()`.
- `network.js`: `NeuralNetwork.fromJSON`.
- Use a hidden `<input type="file" accept="application/json">` and `FileReader`/`file.text()`.
