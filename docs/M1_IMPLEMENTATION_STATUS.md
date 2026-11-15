# M1 — Application Foundation Implementation Status

**Implementation slice:** Initial foundation, merged in PR #21 on 2026-11-11  
**Branch at implementation:** `feat/m1-application-foundation`  
**Status:** Historical milestone report. The current project state is tracked in [Implementation Tracker](IMPLEMENTATION_TRACKER.md) and [Roadmap](ROADMAP.md).  
**Architecture authority:** [Architecture](ARCHITECTURE.md), [Roadmap](ROADMAP.md), [Implementation Guidelines](IMPLEMENTATION_GUIDELINES.md)

## Scope delivered in the initial foundation slice

- SvelteKit, Svelte 5 and TypeScript application scaffold.
- Tailwind CSS 4 Vite integration.
- Cloudflare Workers adapter and local Wrangler configuration.
- Semantic dark/light design tokens and initial responsive application shell.
- Fresh-start dashboard with no hard-coded learner history or assumed preferences.
- Versioned Zod learner-preferences contract with empty profile factory.
- Skippable learner setup screen.
- Vitest unit tests for empty profile defaults and preference validation.
- ESLint, Prettier and GitHub Actions validation workflow.
- Existing curriculum validator exposed as an npm script.

Subsequent merged milestones extended this foundation with local D1/Drizzle schema and application services (PRs #22–23), IndexedDB learner persistence (PR #24), local backup/restore/reset (PR #25), dashboard and personalised practice planning (PRs #26 and #28), and the authored curriculum reader (PR #29).

## Current boundaries

- D1/Drizzle schema and migrations exist for local/test use. There is no production D1 database or learner-facing cloud data route.
- IndexedDB persistence and local learner repositories are implemented in M2.3. Browser reload/offline restart and storage-upgrade QA remain pending.
- Local export/restore and safe reset are implemented in M2.4. Browser round-trip and rollback-under-failure QA remain pending.
- Authentication, ownership enforcement for cloud data, outbox/conflict resolution and cloud sync are not enabled.
- Local Wrangler Worker build and smoke testing pass. Isolated preview/production environments and live Cloudflare deployment are not configured.
- Service-worker/PWA app-shell caching and offline curriculum availability remain release-hardening work.

## Verification

The merged PRs run through GitHub Actions. The PR #29 merge commit passed dependency audit, curriculum and design validation, formatting, lint, Svelte/TypeScript checks, unit tests, local D1 migration/invariant tests, production Worker build, local Worker smoke test and Chromium browser acceptance.

Automated local browser checks are not a substitute for real-device, keyboard-only, screen-reader, offline-restart or microphone-permission review. Those checks remain release acceptance work.

## Privacy and learner-baseline rule

The shared source contains generic application code and authored curriculum only. No personal profile, practice history, recording, credential or prior lesson completion is committed. Every new learner profile starts without assumed preferences, progress or mastery.
