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
| Cloudflare runtime | Preview workflow implemented; no deployment performed | PR #32 provides the isolated preview Worker. PR #36 adds an exact-current-`main` SHA gate and checks the latest successful application/curriculum and Node 26 compatibility runs before deployment. Preview environment credentials and a synthetic-data deployment remain unverified; production is unconfigured |
| CI quality gates | Core checks passing; active ruleset requires PRs and primary CI | Main CI runs on Node 22.23.5 and has a separate Node 26.13.1 compatibility job. The active `Protect main branch` ruleset requires PRs and the `Validate application and curriculum` status check with strict up-to-date enforcement; Node 26 compatibility is not separately required. Controlled failing-check verification and ongoing dependency/action maintenance remain follow-ups under Issue #5 |
| M2.1 data schema | Merged | PR #22: versioned Drizzle schema, local D1 migration, 152 lesson metadata references, 34 stable skill IDs and database integrity tests |
| M2.2 application boundary | Merged | PR #23: repository ports, validated use cases, typed errors and in-memory tests; no remote D1 access |
| M2.3 local learner persistence | Merged; physical-device QA pending | PR #24 implements the empty active profile and versioned IndexedDB stores. PR #43 adds the v1-to-v2 additive migration, learner/status/start-time practice-session index and Chromium data-retention test. Desktop/mobile offline browser acceptance also passes in CI; physical-device reload/offline checks remain |
| M2.4 local backup and recovery | Merged; physical-device QA pending | PR #25 implements versioned export, strict restore preview, transactional replacement and typed-confirmation reset. PR #42 adds Chromium coverage for invalid/unsupported imports, failed-restore rollback, reset cancel/confirm and restore-to-clean-profile; physical-device round-trip remains |
| M3 dashboard and planning | Merged | PR #26 dashboard and PR #28 explainable 10/20/40/custom practice planner; browser acceptance covers key planning journeys |
| M4.1 curriculum reader | Merged | PR #29: six routes, all 152 lessons, lesson reader, previous/next navigation and Chromium acceptance |
| M4.2 interactive lesson progress | Merged — PR #33; manual QA pending | Local section progress, checkpoint self-check, private next-practice note and explicit completion/resume. Lesson completion remains separate from skill mastery; Chromium coverage was added in the PR |
| Music tools, practice studio and repertoire | M6.1 tools merged; M7/M8 pending | PR #45 and PR #46 deliver the tuning-aware fretboard, chord library, chord-change drill and metronome. The chromatic tuner, complete Practice Studio, ear training/theory and repertoire remain future work |
| Release hardening | Not ready | PR #35 adds the first offline app shell; PR #36 adds P1 reliability/security-header/storage-persistence and exact-SHA preview-gate hardening; PR #42 adds backup/restore/rollback/reset browser coverage; PR #43 adds IndexedDB v1-to-v2 upgrade and desktop/mobile offline browser acceptance. Physical-device acceptance, CSP, full accessibility/privacy review, environment isolation, preview deployment and rollback verification remain |

**Repository state (2026-11-12):** PRs #33, #35, #36, #42, #43, #45 and #46 are merged into `main`. PR #42's Chromium suite verifies invalid/unsupported backup rejection, failed-restore transaction rollback, reset cancel/confirm and restore-to-clean-profile. PR #43 upgrades IndexedDB v1 to v2 without losing the active learner, preferences or existing practice session, and checks cached/uncached offline navigation at desktop and mobile viewport sizes. Both PR checks and the PR #43 post-merge `main` CI run passed. Physical-device QA remains open and is documented in [the manual acceptance runbook](MANUAL_ACCEPTANCE.md). The active `main` ruleset requires pull requests and the `Validate application and curriculum` check. No preview or production deployment, production D1 database, authentication or cloud sync is configured.

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
| M2.3 | [#9 — Empty learner profile and IndexedDB](https://github.com/leenusdarnal/guitarlab/issues/9) | Merged — PR #24 and upgrade hardening in PR #43 | Chromium CI verifies v1-to-v2 upgrade, all stores, active learner, preferences, practice-session retention and the new composite index. Physical-device reload/upgrade acceptance remains |
| M2.4 | [#10 — Export, restore preview and safe reset](https://github.com/leenusdarnal/guitarlab/issues/10) | Merged — PR #25 and automated QA in PR #42 | Chromium CI passes invalid/unsupported import, explicit confirmation, IndexedDB transaction rollback, reset cancel/confirm and restore-to-clean-profile scenarios. Physical-device backup/restore QA remains open |

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
| M5 | Local-first state and optional sync | Partially implemented | IndexedDB v2, local backup/restore, and the privacy-safe offline app shell are implemented. CI covers schema upgrade/data retention and desktop/mobile viewport offline reload/fallback. Physical-device acceptance, outbox, conflict handling, authentication and cloud sync remain |
| M6.1 | [#15 — Fretboard, chord library and metronome](https://github.com/leenusdarnal/guitarlab/issues/15) | Complete — PRs #45 and #46 merged; Issue #15 closed | Fretboard is live with tuning-aware pitch mapping, note spelling, handedness and accessible note finding. PR #46 adds open-chord diagrams, separate clean-change/time observations and a local Web Audio metronome with tempo, meter and reference tone; unit and browser acceptance are included |
| M7.1 | [#16 — Practice sessions and evidence capture](https://github.com/leenusdarnal/guitarlab/issues/16) | Initial slice merged — PR #50; M7.2 in progress | Local Practice Studio start/finish/history and reload recovery are merged. Current branch adds pause/resume, accumulated active-time accounting and transaction-serialized single-active-session creation. Exercise observations, reflections and review scheduling remain future slices |
| M8.1 | [#17 — Ear training, theory and repertoire](https://github.com/leenusdarnal/guitarlab/issues/17) | Not started | Accessible ear/theory drills and copyright-safe repertoire workspace |
| M9.1 | [#18 — Offline, accessibility, privacy and release hardening](https://github.com/leenusdarnal/guitarlab/issues/18) | Not ready | Offline, backup, accessibility, privacy, security, performance, deploy and rollback checks |

## M7 first implementation slice (2026-11-12)

- Feature branch: `feat/m7-practice-evidence-contract`.
- Adds `/practice` with a local-first start/finish flow and session history.
- Adds `src/lib/storage/practice.ts`, reusing the existing `startPracticeSession` / `finishPracticeSession` application services and IndexedDB repository.
- The screen explicitly states that elapsed time is not mastery or accuracy evidence.
- Existing application-service tests already cover invalid duration, successful completion, duplicate completion and no automatic mastery.
- Not yet verified: full CI, route browser acceptance, pause/resume, exercise-level observations and manual device checks.

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

1. Complete physical-device desktop/mobile offline and backup/restore QA using [the manual acceptance runbook](MANUAL_ACCEPTANCE.md); keep Issues #9, #10 and #18 open until evidence is recorded.
2. M6.1 fretboard, chord library and metronome are merged in PRs #45–46; Issue #15 is complete. Keep the chromatic tuner as a separately scoped future feature.
3. Deliver M7 practice sessions/evidence capture, then M8 ear training/theory/repertoire as separate reviewable slices.
5. Complete M9 CSP/security, WCAG accessibility, privacy, performance, offline/PWA, environment-isolation and deployment rollback checks.
6. Keep the preview deployment deferred until the exact-SHA gate, GitHub preview environment and credentials are configured; use synthetic data only. Keep production D1, authentication and cloud sync deferred until ownership, authorisation and conflict rules are implemented and reviewed.


## M7.2 implementation slice (2026-11-12)

- Branch: `feat/m7-pause-resume-active-time`, based on merged main commit `ee63b1a`.
- Adds pause/resume and persists accumulated active time separately from wall-clock start time.
- Paused intervals are excluded from displayed and completed duration.
- Active-session creation is guarded inside an IndexedDB read/write transaction to prevent competing tabs from creating sessions simultaneously.
- Browser acceptance covers pause, frozen timer, pause reload recovery, resume, active reload recovery and finish.
- PR #51 CI run `43204452773` passed both required jobs. PR remains open/unmerged; Issue #16 remains open.
- Review follow-up: preserve paused status in dashboard read models, avoid changing the unused D1 schema without a migration, and add real two-tab concurrency browser acceptance before merge.
