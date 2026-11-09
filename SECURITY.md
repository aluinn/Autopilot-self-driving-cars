# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Use GitHub's private reporting instead:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability** (or open <https://github.com/aluinn/Autopilot-self-driving-cars/security/advisories/new>).
3. Describe what you found and how to reproduce it.

You can expect an acknowledgement within a week. This is a hobby-scale project, so there is no bounty and no SLA, but real reports will be looked at and credited if you wish.

## Supported versions

Only the latest commit on `main` (and the latest release, once tagged) is supported.

## Scope and design notes

Autopilot is a **static, client-only web app**: there is no backend, no accounts, no cookies and no network requests of its own other than loading the Space Grotesk font from Google Fonts. That shapes what matters:

- **In scope:** script injection (XSS) through anything the app renders; unsafe handling of saved or imported brain data; problems in the GitHub Actions workflows or the tooling in `tools/`.
- **Stored data:** the only thing the app stores is one saved brain in the browser's `localStorage` (key `autopilot.savedBrain`). It is read back through `NeuralNetwork.fromJSON`, which checks that the layer shapes match.
- **Rendering:** status messages use `textContent`. The one `innerHTML` use in `main.js` builds the sensor bars from constant strings, with no user data.
- **Known limitation:** `NeuralNetwork.fromJSON` validates the weight shapes but does not bound the layer `sizes`, so a deliberately huge `sizes` array in a hand-edited brain could make the tab allocate a lot of memory. The data comes from your own browser storage, so the impact is limited to your own tab. Hardening is welcome as a contribution.
- **Out of scope:** the behaviour of third-party hosts (Vercel, Google Fonts) and anything requiring a compromised browser or machine.
