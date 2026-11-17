# GuitarLab Implementation Tracker

**Last updated:** 2026-11-15  
**Tracking source:** GitHub Issues and pull requests in this repository  
**Implementation branch:** `main`

## Current top priority — first production release (2026-11-15)

Production deployment is now the highest-priority implementation stream by owner direction. The first release uses the existing local-first architecture; it is not an authenticated cloud-sync release.

- Latest main baseline before this PR: `555b27c1ba230a87a59e4d75c5f7348127f8fd28`; post-merge GuitarLab CI run [#43690672271](https://github.com/leenusdarnal/guitarlab/actions/runs/43690672271) passed application/curriculum and Node.js 26 compatibility jobs.
- Cloudflare account audit: only `guitarlab-preview` exists; no production Worker, D1 database, Worker custom domain or zone was returned.
- First-release target: Worker `guitarlab` at `https://guitarlab.leenusdarnal.workers.dev`; the separate production config contains Workers Static Assets only and no D1 binding.
- The release workflow is manual-only, main-only, requires an explicit boolean confirmation and successful exact-SHA application/curriculum plus Node 26 checks. It builds, dry-runs, deploys and smoke-tests key routes and security headers.
- Required GitHub Actions values: production environment secret `CLOUDFLARE_API_TOKEN` and variable `CLOUDFLARE_ACCOUNT_ID`. Never commit or print secret values.
- Login, accounts and cloud sync are still unimplemented M5 work. They are not enabled in this local-first production release; no server-side learner records are stored.
- Live deployment remains pending until the production workflow is merged, the GitHub production environment is configured and the exact-main workflow completes with recorded evidence.


GitHub Issues remain the execution records. A task is complete only when its code is merged and its stated checks pass. Manual acceptance checks are called out separately; merging an implementation slice does not silently mark those checks complete.

## Historical checkpoint — 2026-11-15 after PR #135 (superseded by the production-priority update above)

- Verified `main`: `18515ec7bb1ab6d76b4f19a5e9a424585945d890`. PR [#135](https://github.com/leenusdarnal/guitarlab/pull/135) merged the SvelteKit-managed CSP, restrictive script/resource directives, regression assertions for actual CSP/security response headers, and `docs/SECURITY_RESPONSE_POLICY.md`.
- PR CI [run #43689404424](https://github.com/leenusdarnal/guitarlab/actions/runs/43689404424) passed. Post-merge main CI [run #43689790086](https://github.com/leenusdarnal/guitarlab/actions/runs/43689790086) also passed both required jobs, including Node.js 26, formatting, lint, type/Svelte checks, tests, production build, Worker smoke, standard browser, music-tools browser, axe accessibility/CSP and curriculum browser acceptance.
- The CSP slice does not close Issue #18. Manual WCAG 2.2 AA, privacy, physical-device, cross-browser audio, licensing, performance and rollback acceptance still need evidence.
- Issue #89 remains physical-evidence work only: no consented real-guitar corpus or physical microphone/browser/device results have been supplied. PR #134's synthetic WAV coverage and evaluator are tooling/regression coverage, not real-world validation.
- Issues #9/#10 remain open for physical desktop/mobile IndexedDB, offline restart, export/restore and reset acceptance.
- Issue #5 remains open. The attempted dispatch expired at GitHub sign-in; workflow page showed zero runs. No failure-injection or recovery run URLs exist. Both modes must be dispatched in an authenticated session.
- Issue #3 remains deferred pending explicit production ownership, hostname, access model, data architecture and release approval. No production resources or deployment are authorized.


## Historical checkpoint — 2026-11-15 after PR #132 (superseded by PR #135)

- Verified current main includes PR #132 merge commit c4c9f23c93a4a1d5ee1c42ff584af63fee3ac294. Issue #69 is closed as completed after its acceptance checklist was reconciled to merged evidence.
- PR #132 extended exact expected-versus-selected response contrasts across all 13 interval classes and all 12 alternate choices for v2 and v3; it preserves v1 compatibility and keeps instruments/scope versions separate. Full application/curriculum and Node.js 26 PR CI passed before merge.
- PR #131 is merged as b34578c4c295e83c5fc95e5350a92d3f664a398e; Issue #130 is closed. PRs #127–#129 and Issue #17 are complete.
- **Current P3 PR:** [#134](https://github.com/leenusdarnal/guitarlab/pull/134) adds privacy-safe optional recording-condition dimensions and grouped local WAV metrics. The current branch feat/audio-corpus-dimension-reports-main132 passed Node.js 26 compatibility and application/curriculum CI run [#43684634245](https://github.com/leenusdarnal/guitarlab/actions/runs/43684634245).
- PR #134's tests use synthetic WAV fixtures only. The real-guitar corpus and physical-device matrix remain Not run until consented recordings and actual hardware/browser combinations are available.
- Issue #89 remains open for those physical measurements; Issues #9/#10 remain open for device-level IndexedDB/offline and backup/restore QA; Issue #18 remains open for release hardening.
- Issue #5 remains open until both controlled failure-injection and recovery runs are actually dispatched and their run URLs recorded. Issue #3 remains open pending explicit production-owner decisions; no production resource or deployment is authorized.

## Historical issue reconciliation checkpoint — 2026-11-14

- **Merged curriculum batch:** PR #102 added Jazz & Harmony Weeks 5–8 and immutable curriculum release v1.0.6; merge commit is `de9b0f3992c258e5dfdc840e48fb45da47276bd2`. Its application, Node.js 26 and curriculum checks passed before merge; post-merge application CI run #43579576570 and curriculum validation run #43579576618 both passed.
- **Closed implementation issue:** Issue #68 (shared audio and microphone pitch recognition) is closed. PRs #73–91 delivered lifecycle tests and fixes, owned audio sessions, microphone capture, pitch estimator, stable-note tracker, tuner, note-recognition exercise and synthetic/local recording evaluation.
- **Open audio validation:** Issue #89 now tracks only real-guitar corpus measurements and physical-browser/device acceptance; do not represent synthetic or mocked-browser checks as hardware validation.
- **Adaptive practice expanded:** PRs #92–94 provide the evidence audit, deterministic read model, canonical skill catalogue and Practice Studio recommendations/category assessment coverage. PR #103 adds append-only local dismiss/correct feedback; PR #104 adds comparable measured-score summaries/trends; PRs #107–109 add objective item outcomes; PR #110 adds item accuracy and repeated-miss prioritisation; PR #111 adds the first explicitly evidenced taxonomy; PR #112 links new sessions/observations to exact authored exercise, lesson, release and taxonomy identity; PR #113 (merged as `fbe9e75`) derives local exposure from exact links. PR #114 merged taxonomy v0.2.0 with 15 scopes and retained the v0.1.0 snapshot. This follow-up advances to v0.3.0 with nine additional evidence-backed scopes, preserving immutable v0.1.0 and v0.2.0 snapshots so historical observations are never reclassified. Legacy free-text records and unsupported taxonomy versions remain excluded. No exposure data is accuracy, completion or mastery evidence.
- **Musicianship and release work remain:** Issue #17 covers chord-movement listening, theory recall, connected theory/CAGED and repertoire. Issue #18 and Issues #3, #5, #9 and #10 retain release, infrastructure and physical-device acceptance gates.
- PRs #102–104 and #110 are merged; refresh live open-PR and Actions state before starting another implementation slice.

## Parallel implementation and merge queue — 2026-11-15

Independent implementation branches may be developed in parallel, but merges remain priority-ordered. P1 adaptive practice and the P2 musicianship/repertoire work are complete. The active slice is P3 recording-corpus evaluation; actual physical-device sign-off remains separate.

| Merge order | PR | Priority / issue | Scope | Current gate |
|---|---|---|---|---|
| Merged 1 | [#117](https://github.com/leenusdarnal/guitarlab/pull/117) | P1 / #69 | Explicit interval-response mismatch evidence labels for the original v1 four-choice instrument | Merged; checks passed |
| Merged 2 | [#118](https://github.com/leenusdarnal/guitarlab/pull/118) | P2 / #17 | Chord-movement listening | Merged; checks passed |
| Merged 3 | [#119](https://github.com/leenusdarnal/guitarlab/pull/119) | P2 / #17 | Theory recall: name, sound and musical use | Merged; checks passed |
| Merged 4 | [#120](https://github.com/leenusdarnal/guitarlab/pull/120) | P2 / #17 | Shared scales, triads, inversions, CAGED and canonical fretboard notes | Merged; duplicate #126 added no implementation delta |
| Merged 5 | [#121](https://github.com/leenusdarnal/guitarlab/pull/121) | P2 / #17 | Local repertoire projects, learner-scoped IndexedDB v7 and backup/restore/reset | Merged; application and Node.js 26 checks passed |
| Merged 6 | [#122](https://github.com/leenusdarnal/guitarlab/pull/122) | P3 / #89, #18, #9, #10 | Real recording, physical-device, storage and recovery evidence matrix | Merged; physical hardware and recording evidence remain not run |
| Merged 7 | [#123](https://github.com/leenusdarnal/guitarlab/pull/123) | P4 / #5 | Isolated manual CI failure/recovery rehearsal | Merged; actual failure-injection and recovery dispatches remain pending |
| Merged 8 | [#125](https://github.com/leenusdarnal/guitarlab/pull/125) | P4 / #3 | Production environment decision and explicit release gates | Merged; owner decisions remain pending; no production resource or deployment authorized |
| Merged 9 | [#124](https://github.com/leenusdarnal/guitarlab/pull/124) | Execution governance | Parallel implementation, strict merge order and durable status tracking | Merged; post-merge main CI passed |
| Merged 10 | [#127](https://github.com/leenusdarnal/guitarlab/pull/127) | P2 / #17 | All 12 simple ascending interval classes across three focused practice sets; supporting-probe v2 | Merged; checks passed |
| Merged 11 | [#128](https://github.com/leenusdarnal/guitarlab/pull/128) | P2 / #17 | Interval progression research and stimulus-validity decision | Merged; post-merge main CI passed |
| Merged 12 | [#129](https://github.com/leenusdarnal/guitarlab/pull/129) | P2 / #17 | Current-content provenance inventory and future per-asset rights gate | Merged; required CI passed; Issue #17 closed |
| Merged 13 | [#131](https://github.com/leenusdarnal/guitarlab/pull/131) | P2 follow-up / #130 | Per-interval C3–B4 root cycles, C3–B5 bounds, interval instrument v3 and historical v2 separation | Merged as b34578c4c295e83c5fc95e5350a92d3f664a398e; full PR CI and Node.js 26 passed; Issue #130 closed |
| Merged 14 | [#132](https://github.com/leenusdarnal/guitarlab/pull/132) | P1 / #69 | Extend explicit expected-versus-selected interval contrasts to all 13-class v2/v3 instruments; preserve v1 | Merged as c4c9f23c93a4a1d5ee1c42ff584af63fee3ac294; full application/curriculum and Node.js 26 CI passed; Issue #69 closed |
| Current | [#134](https://github.com/leenusdarnal/guitarlab/pull/134) | P3 / #89 | Privacy-safe per-condition breakdowns for local WAV evaluator; preserve legacy manifests; synthetic CLI tests only | Open; application/curriculum and Node.js 26 CI run #43684634245 passed |

**Remaining sequence:** merge PR #134 only after the exact current head and all required checks are verified. Then resume Issue #89's real-guitar corpus and physical browser/device matrix using real consented hardware evidence. Issues #9/#10 continue for device-level storage and backup/restore; Issue #18 remains the release-hardening gate.

**Recent CI evidence:** PR #131 full workflow [#43683213960](https://github.com/leenusdarnal/guitarlab/actions/runs/43683213960) passed; PR #132 required workflow [#43684130734](https://github.com/leenusdarnal/guitarlab/actions/runs/43684130734) passed; PR #134 workflow [#43684634245](https://github.com/leenusdarnal/guitarlab/actions/runs/43684634245) passed.

**Honest completion rule:** physical-device/recording acceptance, manual accessibility/privacy review, controlled workflow dispatch and production approval remain open until their evidence exists. Synthetic/mock tests are not hardware sign-off. Production resources and deployment require separate explicit approval.



## Current status

| Area | Status | Evidence / next action |
|---|---|---|
| Product definition, architecture and curriculum | Complete | M0 documents; 152 authored lessons across six routes; versioned content contract and validator |
| Visual direction and design tokens | Implemented | Approved hybrid direction; both-theme contrast validation runs in CI. Full component-level accessibility audit remains in M9 |
| Application foundation | Merged | PR #21: SvelteKit, Svelte 5, TypeScript, Tailwind, Cloudflare adapter, responsive shell and onboarding |
| Cloudflare runtime | Preview Worker exists; first production deployment is now P0 | The new production slice adds an isolated no-D1 Worker config and a manual, main-only, exact-SHA, explicitly confirmed release workflow with route/security-header smoke tests. Production environment credentials must be configured before its first run; no deployment is claimed until that run succeeds |
| CI quality gates | Core checks passing; active ruleset requires PRs and primary CI | Main CI runs on Node 22.23.5 and has a separate Node 26.13.1 compatibility job. The active `Protect main branch` ruleset requires PRs and the `Validate application and curriculum` status check with strict up-to-date enforcement; Node 26 compatibility is not separately required. Controlled failing-check verification and ongoing dependency/action maintenance remain follow-ups under Issue #5 |
| M2.1 data schema | Merged | PR #22: versioned Drizzle schema, local D1 migration, 152 lesson metadata references, 34 stable skill IDs and database integrity tests |
| M2.2 application boundary | Merged | PR #23: repository ports, validated use cases, typed errors and in-memory tests; no remote D1 access |
| M2.3 local learner persistence | Merged; physical-device QA pending | PR #24 implements the empty active profile and versioned IndexedDB stores. PR #43 adds the v1-to-v2 additive migration, learner/status/start-time practice-session index and Chromium data-retention test. Desktop/mobile offline browser acceptance also passes in CI; physical-device reload/offline checks remain |
| M2.4 local backup and recovery | Merged; physical-device QA pending | PR #25 implements versioned export, strict restore preview, transactional replacement and typed-confirmation reset. PR #42 adds Chromium coverage for invalid/unsupported imports, failed-restore rollback, reset cancel/confirm and restore-to-clean-profile; physical-device round-trip remains |
| M3 dashboard and planning | Merged | PR #26 dashboard and PR #28 explainable 10/20/40/custom practice planner; browser acceptance covers key planning journeys |
| M4.1 curriculum reader | Merged | PR #29: six routes, all 152 lessons, lesson reader, previous/next navigation and Chromium acceptance |
| M4.2 interactive lesson progress | Merged — PR #33; manual QA pending | Local section progress, checkpoint self-check, private next-practice note and explicit completion/resume. Lesson completion remains separate from skill mastery; Chromium coverage was added in the PR |
| M4.3 learner-selected lesson presentation | Implementation in progress | Uses the existing profile preference, defaults to balanced, reorders all 11 instructional sections without hiding content or changing progress IDs; six-format browser and helper coverage in the current PR |
| Music tools, practice studio and musicianship | M6 audio implementation complete; M7.1 complete; M7.2 evidence analytics delivered with remaining source-backed taxonomy work tracked under Issue #69; M8.1 Issue #17 complete; Issue #130 interval stimulus follow-up active | PRs #45–46 deliver fretboard, chords and metronome. PRs #78–86 and #90–91 add owned audio sessions, microphone capture, pitch estimation, stable-note tracking, tuner, note-recognition and benchmarks; Issue #68 is closed and Issue #89 holds real-recording/physical-device validation. PRs #50–59 deliver the practice/evidence loop. PRs #92–94 add adaptive recommendations and the canonical skill catalogue; PRs #103–117 add append-only feedback, comparable-score trends, objective item outcomes, evidence-scoped analytics and explicit v1 interval-response contrasts without changing whole-skill mastery. Issue #69 remains open for further source-backed taxonomy and evidence work. PRs #61/#67 add pulse, contour and initial interval classes. PR #118 delivers chord-movement listening; #119 adds name/sound/use theory recall; #120 shares scale/triad/inversion/CAGED calculations with the canonical fretboard model; #121 adds local repertoire projects; PR #127 completes all 12 simple ascending interval classes; #128 records progression research; #129 audits current bundled-content provenance and closes Issue #17. Issue #130 separately tracks deterministic starting-pitch/register variation, using v3 supporting-probe evidence |
| Release hardening | First local-first production release is P0; full sign-off remains open | PR #135 adds managed CSP and response-header regression checks. Production has no D1/auth/cloud-sync binding. After first smoke-tested deployment, remaining work includes physical-device offline/storage/backup (#9/#10), real audio/device evidence (#89), full accessibility/privacy/cross-browser/performance/rollback review (#18), and the pending CI rehearsal (#5). Account login and secure cloud sync remain M5 follow-up work |

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
| M7.1 | [#16 — Practice sessions and evidence capture](https://github.com/leenusdarnal/guitarlab/issues/16) | Complete — PRs #50–59 merged | Local sessions, pause/resume, append-only exercise observations, reflection/next target, searchable history and explainable/correctable skill states. |
| M7.2 | [#69 — Adaptive practice and learning analytics](https://github.com/leenusdarnal/guitarlab/issues/69) | Core analytics and taxonomy merged; P1 follow-up PR in progress | PRs #92–94, #103–104, #107–117 deliver recommendations, local feedback, comparable measured scores, objective item outcomes, taxonomy/source-evidence validation, authored exposure and v1 explicit interval response contrasts. Current slice extends exact expected-versus-selected contrasts to all 13 v2/v3 interval classes without diagnosis, persistence changes or mastery mutation.
| M8.1 | [#17 — Ear training, theory and repertoire](https://github.com/leenusdarnal/guitarlab/issues/17) | Complete — Issue #17 closed after PRs #127–#129 | All 12 simple ascending interval classes, chord movement, theory recall, shared harmony/CAGED, local repertoire, the current-content provenance audit and deterministic C3–B4 root/register variation (PR #131, Issue #130 closed) are merged. Descending/harmonic/notation-aware intervals remain separate research items |
| M6.2 | [#68 — Shared audio and microphone pitch recognition](https://github.com/leenusdarnal/guitarlab/issues/68) | Implementation complete — Issue #68 closed | PRs #73–80 cover lifecycle tests/fixes and owned audio sessions; PRs #81–86 add pitch estimator, microphone input, stable-note tracker, tuner, guided recognition and synthetic benchmarks; PRs #90–91 add benchmark expansion and a local real-recording evaluator. Physical-device and real-guitar evidence remains separately tracked in Issue #89. |
| M9.1 | [#18 — Offline, accessibility, privacy and release hardening](https://github.com/leenusdarnal/guitarlab/issues/18) | Implementation hardened — PR #135 merged; release not ready | SvelteKit-managed CSP and actual response-header regression checks are merged. Remaining: physical-device offline/backup QA, manual WCAG 2.2 AA, privacy, cross-browser audio, licensing, performance, deployment compatibility and rollback evidence |

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
- No microphone capture or adaptive engine is claimed as implemented by this checkpoint. Production deployment and cloud sync remain deferred.

## How progress is recorded

1. Use one focused PR per implementation slice. Independent slices may be developed on parallel branches; record their dependency and merge order. Link to the issue and use `Closes #N` only when every acceptance criterion is complete.
2. Include CI results and manual verification evidence in the pull request description.
3. Update this page when a slice changes state or an acceptance criterion changes.
4. Keep `main` buildable and protected by pull-request and required-status-check rules. Merge in the documented priority order, verifying main CI after each merge and revalidating the next PR against the updated base.
5. Keep learner records, recordings, credentials and runtime databases out of this public repository.

## Definition of done

- Acceptance criteria are met and checked in the issue.
- Relevant format, lint, type-check, unit/integration/browser tests and production build pass.
- Mobile, desktop, keyboard and offline behaviour are verified for user-facing work where applicable.
- Loading, empty, error and offline states are handled.
- Documentation matches the merged implementation.
- No secrets or private learner records are committed.

## Immediate next actions

1. Redeploy the latest `main` commit to the existing local-first production Worker using the manual production workflow. Require exact-SHA application/curriculum and Node.js 26 checks, then attach the new route/security-header smoke-test evidence artifact to Issue #3. Initial production deployment succeeded on 2026-11-16 for `306f7aea`; do not treat that older deployment as current release verification.
2. Complete Issue #5's controlled CI rehearsal in an authenticated GitHub session: dispatch `failure-injection`, then `recovery`, and record both actual workflow run URLs.
3. Complete physical desktop/mobile IndexedDB upgrade, reload, offline restart and storage-error checks in Issue #9.
4. Complete physical-device export/restore/reset and mobile file-picker acceptance in Issue #10.
5. Collect consented local real-guitar recordings with ground truth and run the physical browser/device matrix for Issue #89; keep all missing hardware rows marked not run.
6. Continue Issue #18's manual WCAG 2.2 AA, privacy, cross-browser audio, licensing, performance, CSP deployment compatibility and rollback review. Do not mark physical checks complete based on CI.


## M7.2 implementation slice (2026-11-12)

- Branch: `feat/m7-pause-resume-active-time`, based on merged main commit `ee63b1a`.
- Adds pause/resume and persists accumulated active time separately from wall-clock start time.
- Paused intervals are excluded from displayed and completed duration.
- Active-session creation is guarded inside an IndexedDB read/write transaction to prevent competing tabs from creating sessions simultaneously.
- Browser acceptance covers pause, frozen timer, pause reload recovery, resume, active reload recovery and finish.
- PR #51 CI run `43207060655` passed both required jobs, including the two-tab browser acceptance. A documentation-only reconciliation commit is being revalidated on the latest head. PR remains open/unmerged; Issue #16 remains open.
- Review follow-up: paused status is preserved in dashboard read models; two-tab concurrency browser acceptance is included and passes. The unused D1 schema remains unchanged intentionally until its migration is introduced.


## Historical resume checkpoint — 2026-11-13 (PR #58 merged; skill-state rules underway)

- **Verified main:** `9dbb69ef4181a7f1605da61ed3139b4741843c83` (PR #58 merged; searchable/filterable Practice Studio history).
- **Active branch:** `feat/m7-transparent-skill-state`.
- **Current implementation:** pure, deterministic `explainSkillState` rule engine with human-readable reasons and explicit rule IDs; learner correction application service requires a note and records `decisionSource: learner` plus `correctionNote` on the mastery snapshot.
- **Safety invariant:** stable still requires the latest assessment for the exact learner/release/skill to be passed. Practice duration, lesson completion and self-reported practice observations remain excluded from mastery.
- **Tests added:** state mapping, deterministic latest-attempt selection, due-review precedence, correction metadata validation, and application-service learner correction.
- **Documentation:** `docs/SKILL_STATE_RULES.md`.
- **Remaining in this slice:** verify formatting/type/tests/CI; build learner-facing skill-state review and correction UI with browser acceptance; verify backup compatibility for correction metadata; update tracker with PR and CI evidence.
- **Manual release gate:** physical desktop/iOS/Android offline, reload and backup/restore acceptance remains unverified.
- **Deferred:** PR #47 CI redesign, Cloudflare preview/production deployment, production D1, accounts and cloud sync.


## M7.2 authored exercise exposure implementation — 2026-11-14

- PR #112 merged as `f402b8f307425d1c70b8f9f7f7d303438643948e`; new Practice Studio sessions can optionally persist the exact authored lesson/exercise pair, curriculum release and taxonomy version.
- Linked observations inherit that identity from their session. Legacy free-text sessions/observations are not backfilled or guessed.
- PR #113 adds read-only exposure coverage across the taxonomy's explicit topic, technique, string and fret-position dimensions.
- Counts are distinct authored exercises with at least one linked observation, plus distinct linked sessions. Repetitions, clean repetitions, difficulty and assessment outcomes do not increase exposure.
- Coverage is limited to the ten currently reviewed authored scopes; it must not be described as whole-curriculum coverage or learner mastery.
- PR #113 CI and review are pending. Next work after merge: expand the taxonomy only from author-evidenced mappings; add deterministic confusion labels only for explicit exercise rules.

## M7.2 taxonomy implementation hand-off — 2026-11-14

- Main baseline after PR #110: a04d284e82447707de6b4d70a01115f2b2982e0b.
- Active branch: feat/m7-authored-practice-taxonomy.
- Adds content/curriculum/practice-taxonomy.json (version 0.1.0, curriculum-v1.0.6) with ten author-evidenced Year 1 exercise scopes.
- Adds exact authored-scope lookup, unit tests and scripts/validate-practice-taxonomy.mjs; npm run curriculum:validate now runs the original integrity validator and the taxonomy validator.
- The slice does not yet link practice observations to authored IDs or derive learner exposure. Historic free-text observations remain unchanged.
- Next: validate CI, then add new-session lesson/exercise identity capture and local observation linkage; only then calculate exposure coverage.


## M7.2 taxonomy expansion — 2026-11-14 (PR #114)

- PR #113 merged as `fbe9e75dc9640d31a8b5c9d281cac60b6d503ddf`; post-merge CI run #43623315478 passed.
- Five exact scopes are added for Year 1 Week 16 (fingerstyle thumb / low E), Week 17 (C major and A minor pentatonic note set), Week 37 (melody transcription), Year 2 Week 4 (triad inversions) and Week 30 (rhythm transcription).
- Taxonomy version becomes v0.2.0. The full v0.1.0 metadata and ten scopes are retained as a historical snapshot.
- New sessions select v0.2.0. Exposure analytics read each observation using its own taxonomy version, union stable exercise identities across retained snapshots and never apply a newly introduced dimension to an older record.
- The exposure denominator is the union of exact authored exercises for that stable dimension across retained snapshots. Historic free-text observations, unknown versions, stale releases, mismatched pairs and other learners remain excluded.
- No string/fret metadata is added unless the exercise states it. No confusion codes, scoring changes or mastery changes are included.
- Curriculum-owner review of musical correctness and level appropriateness remains a manual acceptance item.


## M7.2 taxonomy expansion — 2026-11-15 (follow-up to PR #114)

- PR #114 merged taxonomy v0.2.0 with 15 exact exercise scopes and a complete immutable v0.1.0 snapshot.
- This follow-up adds nine new source-evidenced scopes (24 current scopes total) and advances the active taxonomy to v0.3.0.
- The previous v0.2.0 catalogue is retained as a full snapshot alongside v0.1.0. Observations are evaluated only against the exact taxonomy version stored with the session; new dimensions never apply retroactively.
- The overlapping y1-w16-lesson-music fingerstyle scope is retained from v0.2.0 rather than duplicated or redefined.
- CI and curriculum validation are required again after rebasing this PR onto the merged v0.2.0 main branch.


## M7.2 source-evidence validation — 2026-11-15

- PR #115 merged as `bd1a7f82b9585ade6fa02f420e3ca49a4046c4a3`; active taxonomy is v0.3.0 with 24 current exercise scopes and retained v0.1.0/v0.2.0 snapshots.
- Current slice: `feat/m7-validate-exercise-source-evidence`. Every scope's evidence is being changed from descriptive paraphrase to an exact excerpt from the corresponding exercise's own instructions or success criterion.
- `scripts/validate-practice-taxonomy.mjs` now checks exact source membership for current and historical snapshots. Negative guards cover fabricated and cross-exercise evidence.
- CI and curriculum validation are pending. This validator change does not add tags, change exposure denominators, relabel learner records or affect mastery.
