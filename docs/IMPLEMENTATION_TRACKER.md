# GuitarLab Implementation Tracker

**Last updated:** 2026-11-13  
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
| Music tools, practice studio and repertoire | M6.1 and M7.1 merged; M8.1 underway | PRs #45–46 deliver fretboard, chords and metronome. PRs #50–59 deliver Practice Studio and transparent skill states. M8.1 slice 1 adds pulse, pitch comparison and melodic contour exercises with locally generated audio; interval recognition, theory recall and repertoire remain subsequent slices |
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
| M7.1 | [#16 — Practice sessions and evidence capture](https://github.com/leenusdarnal/guitarlab/issues/16) | Complete — PRs #50–59 merged | Local sessions, pause/resume, append-only exercise observations, reflection/next target, searchable history and explainable/correctable skill states. Adaptive selection and richer analytics are a separate planned follow-up in Issue #69 |
| M7.2 | [#20 — Adaptive practice and learning analytics](https://github.com/leenusdarnal/guitarlab/issues/20) | Planned | Explainable weak-skill prioritisation, per-item accuracy, review selection, fretboard coverage and progress trends; preserve existing mastery rules |
| M8.1 | [#17 — Ear training, theory and repertoire](https://github.com/leenusdarnal/guitarlab/issues/17) | In progress — PRs #61 and #67 merged | Pulse, pitch, contour and four interval classes are implemented with local audio; theory recall, broader intervals, connected fretboard theory and copyright-safe repertoire remain |
| M6.2 | [#19 — Shared audio and microphone pitch recognition](https://github.com/leenusdarnal/guitarlab/issues/19) | Planned | Audit/reuse shared audio lifecycle, opt-in microphone capture, confidence-aware pitch detection, stable-note tracking, tuner and realistic benchmarks |
| M9.1 | [#18 — Offline, accessibility, privacy and release hardening](https://github.com/leenusdarnal/guitarlab/issues/18) | Not ready | Physical-device offline/backup QA, CSP, WCAG accessibility, privacy, cross-browser audio, licensing, performance, deployment and rollback checks |

## M7 first implementation slice (2026-11-12)

- Feature branch: `feat/m7-practice-evidence-contract`.
- Adds `/practice` with a local-first start/finish flow and session history.
- Adds `src/lib/storage/practice.ts`, reusing the existing `startPracticeSession` / `finishPracticeSession` application services and IndexedDB repository.
- The screen explicitly states that elapsed time is not mastery or accuracy evidence.
- Existing application-service tests already cover invalid duration, successful completion, duplicate completion and no automatic mastery.
- Not yet verified: full CI, route browser acceptance, pause/resume, exercise-level observations and manual device checks.

## M8.1 first implementation slice (2026-11-13)

- Branch: `feat/m8-ear-training-foundation`, based on main commit `1022677028607902608300f918e825e70d5cc17c`.
- Adds deterministic, framework-independent listening exercise definitions for steady/uneven pulse, two-note high/low comparison and rising/falling/level melodic contour.
- Adds `/tools/ear-training` with explicit user-triggered Web Audio playback, visible task instructions, replay, answer feedback, retry and next-exercise flow.
- Audio is synthesized locally; no microphone, recording, remote audio asset or copyrighted sample is used.
- Adds unit coverage and extends music-tool browser acceptance for correct/incorrect/retry paths; adds the route to both-theme desktop/320px axe scans.
- This slice does not change lesson progress, practice evidence or skill mastery.
- Remaining in Issue #17: interval recognition, music-theory recall and repertoire workspace.

## Research integration checkpoint — 2026-11-13

- PR #67 merged as `3b9d76301d09b70a48035fab66ef8b7cec6388f7`; it adds interval recognition for unison, minor third, major third and perfect fifth.
- The PR's first rerun exposed a missing learner-facing Intervals tab in the browser acceptance journey. The tab and tools-hub metadata were added before merge.
- The final PR checks passed: formatting, lint, type/Svelte checks, unit tests, production build, Cloudflare Worker smoke test, core browser acceptance, music-tools browser acceptance, accessibility browser acceptance and Node.js 26 compatibility.
- Comparative findings are mapped in [Research Integration Plan](RESEARCH_INTEGRATION_PLAN.md).
- New work is tracked separately: Issue #68 (shared audio and pitch recognition) and Issue #69 (adaptive practice and analytics).
- M7.1 is complete in merged PRs #50–59. M8.1 is partially implemented by PRs #61 and #67. M9 physical-device and release acceptance remains open.
- No microphone capture, adaptive engine, production deployment or cloud sync is claimed as implemented by this checkpoint.

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

1. Verify the post-merge `main` CI run for PR #67 and record the result.
2. Merge the research-integration documentation and issue-mapping PR; keep this research decision record as the source for adopted/adapted/deferred findings.
3. Start the M7.2 adaptive practice issue (#20) only after a short audit of the existing practice planner, assessment evidence and skill-state rules.
4. Start the audio capability audit in Issue #68 before implementing microphone capture; do not duplicate metronome/ear-training audio lifecycle code.
5. Continue Issue #17 with theory recall and connected triad/CAGED learning; keep TAB/repertoire content rights-safe.
6. Complete physical-device offline and backup/restore QA using [the manual acceptance runbook](MANUAL_ACCEPTANCE.md), plus CSP/WCAG/privacy and cross-browser audio checks under Issue #18.
7. Keep Cloudflare production deployment, production D1, authentication and cloud sync deferred until their explicit security and operational gates are satisfied.


## M7.2 implementation slice (2026-11-12)

- Branch: `feat/m7-pause-resume-active-time`, based on merged main commit `ee63b1a`.
- Adds pause/resume and persists accumulated active time separately from wall-clock start time.
- Paused intervals are excluded from displayed and completed duration.
- Active-session creation is guarded inside an IndexedDB read/write transaction to prevent competing tabs from creating sessions simultaneously.
- Browser acceptance covers pause, frozen timer, pause reload recovery, resume, active reload recovery and finish.
- PR #51 CI run `43207060655` passed both required jobs, including the two-tab browser acceptance. A documentation-only reconciliation commit is being revalidated on the latest head. PR remains open/unmerged; Issue #16 remains open.
- Review follow-up: paused status is preserved in dashboard read models; two-tab concurrency browser acceptance is included and passes. The unused D1 schema remains unchanged intentionally until its migration is introduced.


## Resume checkpoint — 2026-11-13 (PR #58 merged; skill-state rules underway)

- **Verified main:** `9dbb69ef4181a7f1605da61ed3139b4741843c83` (PR #58 merged; searchable/filterable Practice Studio history).
- **Active branch:** `feat/m7-transparent-skill-state`.
- **Current implementation:** pure, deterministic `explainSkillState` rule engine with human-readable reasons and explicit rule IDs; learner correction application service requires a note and records `decisionSource: learner` plus `correctionNote` on the mastery snapshot.
- **Safety invariant:** stable still requires the latest assessment for the exact learner/release/skill to be passed. Practice duration, lesson completion and self-reported practice observations remain excluded from mastery.
- **Tests added:** state mapping, deterministic latest-attempt selection, due-review precedence, correction metadata validation, and application-service learner correction.
- **Documentation:** `docs/SKILL_STATE_RULES.md`.
- **Remaining in this slice:** verify formatting/type/tests/CI; build learner-facing skill-state review and correction UI with browser acceptance; verify backup compatibility for correction metadata; update tracker with PR and CI evidence.
- **Manual release gate:** physical desktop/iOS/Android offline, reload and backup/restore acceptance remains unverified.
- **Deferred:** PR #47 CI redesign, Cloudflare preview/production deployment, production D1, accounts and cloud sync.
