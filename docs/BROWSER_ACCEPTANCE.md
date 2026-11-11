# Browser acceptance checks

The browser acceptance script exercises the production Cloudflare Worker build locally. It starts Wrangler Preview, launches Chromium, runs the user-facing checks, and shuts the local Worker down.

## Run locally

Requires Node.js 22.18+, project dependencies, and a Chromium installation.

```bash
npm install
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium
npm run db:setup:local
npm run build
npm run test:browser
```

The CI workflow installs Chromium before running the same script.

## Covered behaviours

- A fresh profile starts without assumed lesson completion, mastery, or practice history.
- The dashboard renders all four Year 1 phases and its honest empty states.
- Theme preference persists after a full page reload.
- Learner preferences are saved in IndexedDB, then shown on the dashboard after navigation and reload.
- Practice planning explains each recommended task, uses the learner's selected goal and recent practice evidence, and respects 10-minute, 20-minute, 40-minute and custom duration choices.
- Custom durations outside 5–180 whole minutes are rejected.
- A learner can select a plan, dismiss suggestions and restore them without recording a session or changing progress.
- Mobile navigation and practice recommendations remain usable at a 390px viewport.
- No uncaught browser page errors occur during the tested journey.

## Deliberate limits

This is a local browser test against the production Worker build, not a public Cloudflare deployment. It does not prove real-device rendering, screen-reader usability, microphone behaviour, or offline reload while the network is unavailable. Those checks remain part of release acceptance.
