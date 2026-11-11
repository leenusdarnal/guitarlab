# M1 — Application Foundation Implementation Status

**Started:** 2026-11-11  
**Branch:** `feat/m1-application-foundation`  
**Architecture authority:** [Architecture](ARCHITECTURE.md), [Roadmap](ROADMAP.md), [Implementation Guidelines](IMPLEMENTATION_GUIDELINES.md)

## Scope implemented in the first foundation slice

- SvelteKit, Svelte 5 and TypeScript application scaffold.
- Tailwind CSS 4 Vite integration.
- Cloudflare Workers adapter and Wrangler configuration.
- Semantic dark/light design tokens and responsive application shell.
- Fresh-start dashboard with no hard-coded learner history or assumed preferences.
- Versioned Zod learner-preferences contract with empty profile factory.
- Skippable learner setup screen; setup currently validates in memory and deliberately does not claim to persist.
- Vitest unit tests for empty profile defaults and preference validation.
- ESLint, Prettier and GitHub Actions validation workflow.
- Existing curriculum validator exposed as an npm script.

## Deliberately deferred

- D1 and Drizzle: M2, not M1. No production database or cloud sync is activated.
- IndexedDB persistence: M5. The onboarding preview does not save learner data.
- Authentication: only needed when authenticated cloud sync is implemented.
- Service worker/PWA and offline curriculum caching: later resilience milestone.
- Production deployment: requires dependency installation, CI verification and Cloudflare environment setup.

## Verification status

The repository API was used to create and commit source files. Runtime installation, formatting, lint, type-check, tests, Worker preview and deployment must be executed before this slice is considered verified. CI is configured to run the checks on the branch/PR.

## Privacy and learner-baseline rule

The shared source contains generic application code only. No personal profile, practice history, recording, credential or prior lesson completion is committed. Every new learner preference starts unset.
