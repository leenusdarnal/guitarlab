# Curriculum reader acceptance checks

The browser acceptance script runs against the locally built Cloudflare Worker. It starts Wrangler Preview, launches Chromium, exercises the curriculum catalogue and reader, and stops the local Worker.

## Run locally

Requires Node.js 22.18+, project dependencies and Chromium.

```bash
npm install
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium
npm run db:setup:local
npm run build
npm run test:curriculum-browser
```

## Covered behaviours

- Six catalogue routes are displayed: Year 1, Year 2 and four Year 3+ specialisations.
- All 152 lessons appear in stable week order and link through their original authored lesson IDs.
- Year 1, Year 2 and a specialist lesson open the same complete reader contract.
- Lesson pages show objectives, prerequisites/refreshers, explanation, worked example, guided demonstration, lesson blocks, exercises, success criteria, musical application, accessible alternatives and review guidance.
- Previous/next lesson navigation follows the selected route, without implying lesson completion or skill mastery.
- Unknown lesson IDs show a deliberate 404 error state.
- The catalogue fits a 390px viewport without page-level horizontal overflow.
- No uncaught browser page errors occur during the tested journey.

## Deliberate limits

Content is served from versioned JSON bundled with the Worker; this is not a remote content service. Automated browser acceptance does not replace physical-device, keyboard-only or screen-reader review.
