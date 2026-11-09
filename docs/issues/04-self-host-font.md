---
title: "Self-host the Space Grotesk font"
labels: ["good first issue", "enhancement"]
---

## Context
The page loads Space Grotesk from Google Fonts (`index.html:12-14`). That is the only network request the app makes, it needs a connection, and it
sends visitors' IP addresses to Google. Without it the app falls back to a system font. The canvas text in `main.js` (`"700 44px 'Space Grotesk'"`) also depends on it.

## Task
Ship the font files with the repo (Space Grotesk is licensed under the SIL Open Font License; include the licence text) and load them with `@font-face`
in `style.css`, then remove the Google Fonts `<link>`s.

## Acceptance
- No request to `fonts.googleapis.com` or `fonts.gstatic.com` when loading the page (check the browser's network panel).
- Weights 300, 400, 500 and 700 render as before, including in the canvas text (make sure the font is loaded before the first canvas draw, e.g. with `document.fonts.load`).
- The OFL licence file is included, and the README "Credits" and `SECURITY.md` mention are updated.
- `npm run lint` passes (it checks that `index.html` references exist) and `npm run e2e` passes.

## Pointers
- `index.html`, `style.css` (`font-family` at ~line 22), `main.js` (canvas fonts at ~lines 366-369), `editor.js` (canvas text).
- Use `.woff2` files; keep them small by subsetting to Latin.
- Please ask before adding any build tooling: the project has no build step by design.
