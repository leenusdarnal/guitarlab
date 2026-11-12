# GuitarLab Implementation Tracker

**Last updated:** 2026-11-12  
**Tracking source:** GitHub Issues and pull requests in this repository  
**Implementation branch:** `main`

GitHub Issues remain the execution records. A task is complete only when its code is merged and its stated checks pass. Manual acceptance checks are called out separately; merging an implementation slice does not silently mark those checks complete.

## Current status

| Area | Status | Evidence / next action |
|---|---|---|
| Product definition, architecture and curriculum | Complete | M0 documents; 152 authored lessons across six routes; versioned content contract and validator |
| Visual direction and design tokens | Implemented | Approved hybrid direction; both-theme contrast validation runs in CI. Full component-level accessibility audit remains in M9 |
| Application foundation | Merged | PR #21: SvelteKit, Svelte 5, TypeScript, Tailwind, Cloudflare adapter, responsive shell and onboarding |
| Cloudflare runtime | Preview workflow implemented; no deployment performed | PR #32 provides the isolated preview Worker. PR #36 adds an exact-current-`main` SHA gate and requires the latest successful application/curriculum and Node 26 checks before deployment. Preview environment credentials and a synthetic-data deployment remain unverified; production is unconfigured |
| CI quality gates | Core checks passing; branch ruleset active | PR #30 adds locked installs, changed-file Prettier checks and a high/critical dependency audit. PR #36 pins Node 22.23.5 and adds Node 26.13.1 compatibility. The active main ruleset requires `Validate application and curriculum`; adding Node 26 compatibility as a required merge check and controlled failing-check verification remain follow-ups under Issue #5 |
| M2.1 data schema | Merged | PR #22: versioned Drizzle schema, local D1 migration, 152 lesson metadata references, 34 stable skill IDs and database integrity tests |
| M2.2 application boundary | Merged | PR #23: repository ports, validated use cases, typed errors and in-memory tests; no remote D1 access |
| M2.3 local learner persistence | Merged; manual QA pending | PR #24: empty active profile and versioned IndexedDB stores/repositories. Verify browser reload, offline restart and storage upgrade behaviour |
| M2.4 local backup and recovery | Merged; manual QA pending | PR #25: versioned export, strict restore preview, transactional replacement and typed-confirmation reset. Verify browser round-trip and rollback-under-failure |
| M3 dashboard and planning | Merged | PR #26 dashboard and PR #28 explainable 10/20/40/custom practice planner; browser acceptance covers key planning journeys |
| M4.1 curriculum reader | Merged | PR #29: six routes, all 152 lessons, lesson reader, previous/next navigation and Chromium acceptance |
| M4.2 interactive lesson progress | Merged — PR #33; manual QA pending | Local section progress, checkpoint self-check, private next-practice note and explicit completion/resume. Lesson completion remains separate from skill mastery; Chromium coverage was added in the PR |
| Music tools, practice studio and repertoire | Not started | M6–M8 issues #15–17 |
| Release hardening | Not ready | PR #35 adds the first offline app shell; desktop/mobile acceptance, backup QA, CSP, full accessibility/privacy review, environment isolation, preview deployment and rollback verification remain. PR #36 reliability/storage/deployment hardening is under review |

**Repository state (2026-11-12):** PR #33 and the first offline app-shell slice in PR #35 are merged into `main`. The offline browser acceptance test checks previously visited lessons offline and the explicit fallback for an unvisited lesson; manual device acceptance remains open. PR #36 has been updated to include the latest `main` commit and contains the P1 reliability, storage-persistence and preview-deployment hardening; it remains under review pending its latest CI results. The active `main` ruleset requires pull requests and the `Validate application and curriculum` check. No preview or production deployment, production D1 database, authentication or cloud sync is configured.

## M1 — Application foundation

| Slice | Work item | State | Evidence / remaining |
|---|---|---|---|
| M1.0 | [#1 — Select visual concept and freeze design tokens](https://github.com/leenusdarnal/guitarlab/issues/1) | Implemented | Approved hybrid direction and contrast-validated semantic tokens |
| M1.1 | [#2 — Bootstrap SvelteKit, Svelte 5 and TypeScript](https://github.com/leenusdarnal/guitarlab/issues/2) | Merged — PR #21 | Type/Svelte checks and production Worker build pass |
| M1.2 | [#3 — Configure Cloudflare Worker and Wrangler](https://github.com/leenusdarnal/guitarlab/issues/3) | Local runtime implemented | Explicit preview/production environment separation and live deployment remain |
| M1.3 | [#4 — Implement the visual system and responsive shell](https://github.com/leenusdarnal/guitarlab/issues/4) | Initial shell merged — PR #21 | Full keyboard, device and component-level accessibility review remains |
| M1.4 | [#5 — Add quality tooling and CI](https://github.com/leenusdarnal/guitarlab/issues/5) | Core gates merged — PR #21; hardening merged — PR #30 | Verify controlled failing-check behaviour and maintain dependency/action updates |
| M1.5 | [#6 — Integrate curriculum integrity checks](https://github.com/leenusdarnal/guitarlab/issues/6) | Implemented | Validator runs in the main CI workflow and checks 52 + 52 + 48 authored lessons |

## M2 — Data foundation

| Slice | Work item | State | Evidence / remaining |
|---|---|---|---|
| M2.1 | [#7 — Versioned domain model and D1/Drizzle migrations](https://github.com/leenusdarnal/guitarlab/issues/7) | Merged — PR #22 | Local migration and database invariants pass; no production D1 resource |
| M2.2 | [#8 — Repository interfaces and application services](https://github.com/leenusdarnal/guitarlab/issues/8) | Merged — PR #23 | Storage-independent ports, Zod validation, typed safe errors and application tests |
| M2.3 | [#9 — Empty learner profile and IndexedDB](https://github.com/leenusdarnal/guitarlab/issues/9) | Merged — PR #24 | Browser reload/offline restart and IndexedDB upgrade verification remain |
| M2.4 | [#10 — Export, restore preview and safe reset](https://github.com/leenusdarnal/guitarlab/issues/10) | Merged — PR #25; manual QA open | Verify browser export/import round-trip, failed-restore rollback and reset behaviour |

## M3 — Learning dashboard and practice planning

| Slice | Work item | State | Evidence / remaining |
|---|---|---|---|
| M3.1 | [#11 — Learner dashboard and learning path](https://github.com/leenusdarnal/guitarlab/issues/11) | Merged — PR #26 | Fresh-start, current lesson, progress and empty/review/practice states |
| M3.2 | [#12 — Explainable recommendations and flexible practice plans](https://github.com/leenusdarnal/guitarlab/issues/12) | Merged — PR #28 | 10/20/40/custom budgets, goal-aware explanations, accept/dismiss/restore and browser coverage |

## M4 — Curriculum and lesson engine

| Slice | Work item | State | Evidence / remaining |
|---|---|---|---|
| M4.1 | [#13 — Curriculum navigation and authored lesson reader](https://github.com/leenusdarnal/guitarlab/issues/13) | Merged — PR #29 | Six routes and 152 stable lesson links; Year 1, Year 2 and specialist reader paths pass Chromium acceptance |
| M4.2 | [#14 — Checkpoints, completion and resume](https://github.com/leenusdarnal/guitarlab/issues/14) | Implemented in PR #33; CI/manual QA pending | Local section progress, checkpoint self-check and private practice note; reload/resume and explicit completion. Completion remains separate from skill mastery |

## M5–M9 — Learning state, tools and release

| Slice | Work item | State | Evidence / remaining |
|---|---|---|---|
| M5 | Local-first state and optional sync | Partially implemented | IndexedDB and local backup/restore exist in M2.3/M2.4. The first privacy-safe offline app shell merged in PR #35; only app assets and previously visited public pages are covered, so device acceptance remains. PR #36 adds explicit storage-persistence and quota safeguards; outbox, conflict handling, authentication and cloud sync remain |
| M6.1 | [#15 — Fretboard, chord library and metronome](https://github.com/leenusdarnal/guitarlab/issues/15) | Not started | Music-tool domain and browser acceptance |
| M7.1 | [#16 — Practice sessions and evidence capture](https://github.com/leenusdarnal/guitarlab/issues/16) | Not started | Session UI, pause/resume, exercise capture and review workflow |
| M8.1 | [#17 — Ear training, theory and repertoire](https://github.com/leenusdarnal/guitarlab/issues/17) | Not started | Accessible ear/theory drills and copyright-safe repertoire workspace |
| M9.1 | [#18 — Offline, accessibility, privacy and release hardening](https://github.com/leenusdarnal/guitarlab/issues/18) | Not ready | Offline, backup, accessibility, privacy, security, performance, deploy and rollback checks |

## How progress is recorded

1. Use one pull request per small implementation slice where practical; link it to its issue with `Closes #N` when all acceptance criteria are complete.
2. Include CI results and manual verification evidence in the pull request description.
3. Update this page when a slice changes state or an acceptance criterion changes.
4. Keep `main` buildable and protected by pull-request and required-status-check rules.
5. Keep learner records, recordings, credentials and runtime databases out of this public repository.

## Definition of done

- Acceptance criteria are met and checked in the issue.
- Relevant format, lint, type-check, unit/integration/browser tests and production build pass.
- Mobile, desktop, keyboard and offline behaviour are verified for user-facing work where applicable.
- Loading, empty, error and offline states are handled.
- Documentation matches the merged implementation.
- No secrets or private learner records are committed.

## Immediate next actions

1. Complete PR #36 review and merge only after its latest application/curriculum and Node 26 checks pass; verify the required-check policy remains enforced on `main`.
2. Complete desktop/mobile offline acceptance, then validate backup export/restore round-trip, failed-restore rollback, reset and IndexedDB upgrade behaviour. Add automated restore coverage where practical.
3. Deliver M6 fretboard, chord library and metronome as small tested slices.
4. Deliver M7 practice sessions/evidence capture, then M8 ear training/theory/repertoire as separate reviewable slices.
5. Complete M9 CSP/security, WCAG accessibility, privacy, performance, offline/PWA, environment-isolation and deployment rollback checks.
6. Keep the preview deployment deferred until the exact-SHA gate, GitHub preview environment and credentials are configured; use synthetic data only. Keep production D1, authentication and cloud sync deferred until ownership, authorisation and conflict rules are implemented and reviewed.
