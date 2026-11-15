# GuitarLab Execution Priority and Resume Plan

**Last updated:** 2026-11-15  
**Repository:** `leenusdarnal/guitarlab`  
**Default branch:** `main`  
**Verified baseline:** `b34578c4c295e83c5fc95e5350a92d3f664a398e` (PR #131 merged; curriculum release v1.0.6)  
**Purpose:** Durable execution queue. Refresh live GitHub state before resuming; current code, tests and CI outrank historical notes.

## Live checkpoint — 2026-11-15 after PR #131

- Verified `main` HEAD: `b34578c4c295e83c5fc95e5350a92d3f664a398e`, squash merge of PR #131. Issue #130 is closed.
- PR #131's complete required workflow [#43683213960](https://github.com/leenusdarnal/guitarlab/actions/runs/43683213960) passed: application/curriculum checks, formatting, lint, type/Svelte, unit, production build, Worker smoke, browser, music-tools, accessibility and curriculum browser acceptance; the Node.js 26 compatibility job also passed.
- PRs #127–#129 remain merged in order. PR #127 shipped all 12 simple ascending melodic interval classes, #128 recorded the progression/stimulus research, and #129 completed the current bundled-content provenance audit. Issue #17 is closed.
- PR #131 completes the bounded stimulus follow-up: each interval class deterministically traverses all 24 chromatic roots C3–B4 using the documented coprime strides; intervals retain their authored semitone distances and stay within C3–B5. Stimulus evidence is versioned as supporting-probe v3 and kept separate from historical v2.
- **Current P1 implementation:** extend the explicit expected-versus-selected interval response contrast read model for Issue #69 to support the complete 13-class v2/v3 instruments, while preserving the legacy v1 four-item mapping. Only exact version/scoring-rule matches and explicit incorrect learner-selected responses are eligible; this is descriptive contrast evidence, not a diagnosis or mastery signal. No learner-record schema or backup format changes are planned.
- PR [#132](https://github.com/leenusdarnal/guitarlab/pull/132) is open from branch `feat/m7-interval-response-contrasts-v2-v3-main131`. It includes exhaustive expected/selected response coverage for all 156 wrong-choice pairs in each of v2 and v3, plus tests for legacy v1, version isolation, unsupported versions/rules, non-response, inconclusive and correct outcomes. Required CI run [#43683680546](https://github.com/leenusdarnal/guitarlab/actions/runs/43683680546) is in progress on the current PR head.
- After the Issue #69 slice passes its own CI and is merged, the next priority is P3 physical-device and real-guitar evidence under Issues #89 and #18, with Issues #9/#10 for physical storage/backup QA. Synthetic/browser CI is not hardware sign-off.
- Issue #5 remains open until controlled failure-injection and recovery are manually dispatched and their real run URLs are recorded. Issue #3 remains open pending explicit owner decisions; no production resources, secrets, D1 database, routes, authentication or production deployment are authorized.
- The PR-head CI for #131 passed before merge. No separate post-merge main workflow run was returned by Actions at this checkpoint; verify main CI before the next merge.
 
## Historical checkpoint — 2026-11-14 after PR #113

- Verified `main`: `fbe9e75dc9640d31a8b5c9d281cac60b6d503ddf`; PR #113 is merged and its post-merge GuitarLab CI run [#43623315478](https://github.com/leenusdarnal/guitarlab/actions/runs/43623315478) passed.
- PR #112 links newly created sessions/observations to the exact authored lesson/exercise pair, curriculum release and taxonomy version.
- PR #113 derives local read-only exposure from exact linked observations; it counts distinct exercises and sessions and does not infer accuracy or mastery.
- Next implementation: expand the source-evidenced taxonomy from ten to fifteen exact exercise scopes in taxonomy v0.2.0 while retaining the v0.1.0 snapshot so historical observations continue to match their original taxonomy.
- No open PR was present at this checkpoint.

## 1. Latest verified checkpoint

- PR #102, Jazz & Harmony Weeks 5–8, merged to `main` as `de9b0f3992c258e5dfdc840e48fb45da47276bd2`.
- PR #102's final branch checks passed: application/curriculum validation, Node.js 26 compatibility and the dedicated curriculum validator. Post-merge curriculum validation run [#43579576618](https://github.com/leenusdarnal/guitarlab/actions/runs/43579576618) passed. The post-merge application CI run [#43579576570](https://github.com/leenusdarnal/guitarlab/actions/runs/43579576570) passed.
- Curriculum v1.0.6 preserves all 152 lesson IDs and 34 canonical skill IDs. Task-specific authoring now covers 44/152 lessons overall and 32/48 Year 3+ specialist lessons; 391 mapping links are retained.
- Audio implementation Issue #68 is closed. PRs #73–80 added lifecycle tests, explicit session ownership and deterministic teardown; PRs #81–86 added pitch estimation, explicit microphone capture, stable-note tracking, tuner, note-recognition exercises and synthetic benchmarks; PRs #90–91 expanded synthetic validation and added a local real-recording evaluator.
- Remaining audio evidence is isolated in [Issue #89](https://github.com/leenusdarnal/guitarlab/issues/89): a consented real-guitar corpus, physical-device/browser measurements and resource-cleanup acceptance. Mocked browser tests and synthetic fixtures are not hardware evidence.
- M7.2 adaptive practice now includes the evidence audit (PR #92), deterministic evidence-aware read model (PR #93), canonical skill catalogue and Practice Studio recommendations/assessment coverage (PR #94), append-only local dismiss/correct feedback with provenance (PR #103), and comparable measured-score summaries/trends by skill (PR #104). Issue #69 remains open for structured per-item outcomes/confusion signals and genuine topic/fretboard coverage; the present records do not support those claims.
- Ear-training foundations and interval recognition are merged in PRs #61 and #67. Jazz & Harmony Weeks 1–8 are merged in PRs #101–102.
- Preview deployment workflow has previously succeeded for a main-branch commit; verify the exact commit before relying on it. Production deployment, production D1, authentication and cloud sync remain deferred.
- No open PR was present immediately after PR #102 merged. Refresh PRs, issues and Actions before beginning each new slice.

## 2. Priority order

### P0 — Reconcile curriculum v1.0.6 and the live repository checkpoint (complete)

1. [x] Review and merge PR #102 after curriculum and application checks passed.
2. [x] Verify post-merge application CI run #43579576570 and curriculum validation run #43579576618.
3. [x] Merge PRs #103–104 and verify PR #104 application/curriculum plus Node.js 26 checks (run #43584492437).
4. [x] Reconcile execution priority, implementation tracker, M7.2 evidence audit, roadmap and Issue #69 (documentation PR #105).

**Exit criteria:** current main SHA, CI evidence, curriculum progress and issue state are aligned across the repository tracker and GitHub.

### P1 — Adaptive recommendations, item analytics and authored practice taxonomy (Issue #69)

**Delivered:**
- PRs #92–94: evidence audit, deterministic learner/release-scoped read model, canonical 34-skill catalogue and Practice Studio recommendations/category assessment coverage.
- PR #103: append-only local recommendation feedback with provenance and backup/restore/reset integration.
- PR #104: comparable measured-score summaries, descriptive spread and conservative trends.
- PRs #107–110: objectively keyed item outcomes, comparable item accuracy and repeated-same-item-miss prioritisation without changing whole-skill mastery.
- PRs #111–115: explicitly authored practice taxonomy, stable session/observation links, exact topic/technique/string/fret-position exposure, and retained historical taxonomy snapshots.
- PR #116: verbatim source-evidence validation for each scope against its exact exercise instructions or success criterion, including negative guards for fabricated/cross-exercise text.
- PR #117: explicit expected-versus-selected response contrasts for the original four-choice interval instrument, without diagnosing misconceptions or affecting mastery.

**Current focused implementation — versioned interval response contrasts (Issue #69):**
1. Extend descriptive response contrasts to exact interval instrument v2 and v3, covering all 13 expected interval classes and all 12 alternative learner-selected answers for each expected class.
2. Preserve the original v1 hyphenated item-ID mapping and its four-answer allow-list.
3. Require matching definition version, scoring-rule version and `supporting_probe` scope; ignore malformed IDs, unsupported versions, mismatched rules, unsupported selections, correct outcomes, no-response and inconclusive evidence.
4. Keep the analytics read-only. Do not add misconception inference, learner-record fields, database migrations, backup changes or mastery mutation.

**Exit criteria:** all versioned expected/selected pairs are covered by unit tests; v1 compatibility and v2/v3 separation are verified; formatting, lint, type/Svelte, unit, build and required browser/accessibility CI pass. Issue #69 is not closed until its remaining acceptance criteria are reconciled against merged evidence.
 
### P2 — Musicianship, connected theory and repertoire (Issue #17) — complete

- [x] Chord-movement listening with feedback, retry and accessible visual instructions (PR #118).
- [x] Theory recall prompts connecting name, sound and musical use (PR #119).
- [x] Shared scale, triad, inversion and CAGED calculations (PR #120).
- [x] Local repertoire notes, section structure, bookmarks, practice targets and backup/restore (PR #121).
- [x] All 12 simple interval classes across three focused ascending melodic sets (PR #127).
- [x] Current bundled-content provenance and future asset-level licensing gate (PR #129); Issue #17 closed.

**Exit criteria:** met for the current built-in GuitarLab content. The licensing audit is not blanket clearance for user-entered material or external links. Future bundled files still need per-asset rights evidence.

### P2 follow-up — Deterministic interval starting pitch and register (Issue #130) — complete

- [x] Cycle each interval class through all 24 chromatic MIDI roots C3–B4 with deterministic strides of five for four-choice sets and seven for the five-choice set.
- [x] Preserve authored semitone distance and ascending melodic presentation; all generated tones remain within C3–B5.
- [x] Version the stimulus as definition v3 / `exact-interval-choice-v3`, retain `supporting_probe`, and keep historical v2 records separate.
- [x] Verify full root coverage, frequency bounds, semitone invariance, deterministic replay, retry/next behaviour and Web Audio teardown.
- [x] Merge PR #131 as `b34578c4c295e83c5fc95e5350a92d3f664a398e`; required workflow #43683213960 passed, including Node.js 26 compatibility.

**Exit criteria:** met. Issue #130 is closed. Descending/harmonic intervals and notation spelling remain separate, unclaimed work.
 
### P3 — Real-device audio and release evidence (Issues #89 and #18)

1. Define a consented, local-only real-guitar corpus with ground-truth frequencies and provenance.
2. Measure per-string detection coverage, median/P95 absolute cents error, false detections during silence/noise and note-on latency.
3. Record instrument/pickup or microphone, playing dynamics, tuning offsets, room noise and attack/sustain/decay segments.
4. Run microphone, tuner and resource-cleanup acceptance on physical desktop/mobile devices and supported browser engines.
5. Continue CSP, WCAG 2.2 AA, privacy, dependency/licence, performance, rollback and offline acceptance.
6. Record tested and untested browser/device combinations; do not generalise mocked Chromium results.

**Exit criteria:** a reproducible evidence report and device matrix exist, or the exact missing hardware access is explicitly documented as blocked.

### P4 — Remaining infrastructure and manual acceptance (Issues #3, #5, #9 and #10)

1. Verify the CI controlled-failure/recovery path without weakening required checks.
2. Complete physical desktop/mobile IndexedDB upgrade, reload and offline restart checks.
3. Complete physical-device backup/restore and destructive-reset confirmation checks.
4. Review production environment ownership, private-data architecture and access controls. Production provisioning/deployment requires separate explicit approval.

**Exit criteria:** manual runbook evidence is recorded and production remains isolated until separately approved.

## 3. Adopt / adapt / defer decisions

**Adopt:** deterministic evidence-aware prioritisation, explicit recommendation reason codes, append-only learner feedback, confidence/noise handling, stable-note tracking, connected CAGED/triad learning, browser audio acceptance and an operational licence register.

**Adapt:** use a simple explainable rules model rather than BKT/IRT; treat repeated self-reported difficulty as a pacing hint, not incorrect-answer evidence; use third-party repositories as design references, not source to copy.

**Defer/reject:** opaque predictive mastery, AI tutor, social competition, polyphonic chord grading without validation, mandatory cloud sync, GPL code reuse without a licensing decision and copyrighted TAB scraping.

See [Research Integration Plan](RESEARCH_INTEGRATION_PLAN.md) for the comparative research decisions.

## 4. Working rules

1. Implement independent, bounded PRs in parallel when dependencies permit. Do not make a branch depend on another unmerged PR unless it is explicitly based on that branch.
2. Start each task from the latest verified `main` SHA.
3. Inspect open PRs, open issues, active Actions runs and latest main CI before starting.
4. Use small, independently testable changes with explicit acceptance criteria.
5. Never weaken assertions, skip required checks or increase timeouts to hide failures.
6. Keep learner records, notes, recordings, secrets and production data out of source and logs.
7. Merge only when required checks pass and the user has authorised the merge.
8. Do not deploy Cloudflare production without explicit approval.
9. Update roadmap, tracker and this checkpoint after every meaningful merge.

## 5. Resume protocol

When the user says “resume GuitarLab” or “continue implementation”:

1. Fetch current `main` SHA and verify the latest main CI.
2. List open PRs, open issues and active workflow runs.
3. Read this file, `docs/IMPLEMENTATION_TRACKER.md` and the relevant GitHub issue.
4. Reconcile acceptance criteria against current code and merged PRs; do not repeat completed work.
5. Continue the highest-priority incomplete task above; independent lower-priority work may proceed on parallel branches, but merge strictly in priority order.
6. Before merging, verify PR head SHA and required checks; after every merge verify main CI, then rebase and revalidate the next queued PR. Record PR, CI evidence, manual QA and the next exact task before pausing.

## 6. Current hand-off

| Field | Value |
|---|---|
| Last verified main SHA | `b34578c4c295e83c5fc95e5350a92d3f664a398e` (PR #131 merged) |
| PRs #117–#131 | Merged in priority order for adaptive response contrast v1, musicianship/repertoire, real-device evidence planning, CI rehearsal, production approval gates, interval progression/research/licensing and interval root/register variation |
| PR #131 | Merged as `b34578c4c295e83c5fc95e5350a92d3f664a398e`; required workflow #43683213960 passed application/curriculum and Node.js 26 jobs |
| Current P1 PR | [#132](https://github.com/leenusdarnal/guitarlab/pull/132), branch `feat/m7-interval-response-contrasts-v2-v3-main131`; extends explicit interval response contrasts to 13-class v2/v3 instruments while retaining v1 compatibility; required CI in progress |
| Issue #69 | Open; remaining focused slice is version-aware response contrast coverage and final acceptance reconciliation. No misconception inference or mastery mutation |
| Issue #17 / #130 | Closed; current musicianship and bundled-content provenance work and deterministic interval roots shipped |
| Physical evidence | Issues #89 and #18 real-guitar/device/release validation; Issues #9/#10 physical offline storage and backup/restore QA |
| Controlled CI evidence | Issue #5 remains open until both manual failure-injection and recovery run URLs are recorded |
| Production | Issue #3 remains open pending owner decisions and explicit approval; production provisioning/deployment remains unauthorized |
| Deferred | Production D1, authentication, cloud sync and production deployment |

**Source-of-truth hierarchy:** current code/tests on `main` → merged PR evidence → current GitHub Issues/Actions → this checkpoint → historical notes and chat summaries.


## M7.2 taxonomy expansion checkpoint — 2026-11-14

- PR #113 merged as `fbe9e75dc9640d31a8b5c9d281cac60b6d503ddf`; main CI run #43623315478 passed.
- The next batch adds five exact exercises: Year 1 Weeks 16, 17 and 37; Year 2 Weeks 4 and 30.
- Taxonomy moves from v0.1.0 to v0.2.0 and retains an immutable v0.1.0 snapshot. New sessions use v0.2.0; historical records remain matched against v0.1.0 without backfilling.
- Exposure aggregation unions scope identity across supported taxonomy snapshots while only applying dimension tags that existed in the record's own version.
- Five topics and one technique are added. Only the explicit low E bass string in the Week 16 musical-application exercise is tagged as string 6; no new fret-position/range is inferred.
- Curriculum-owner review remains a manual follow-up. No confusion codes or mastery rules are added.


## M7.2 evidence-validation slice — 2026-11-15

- Baseline: PR #115 merged as `bd1a7f82b9585ade6fa02f420e3ca49a4046c4a3`; post-merge application CI and curriculum validation passed.
- Active branch: `feat/m7-validate-exercise-source-evidence`.
- The taxonomy validator now requires every `sourceEvidence` excerpt to occur verbatim in the exact linked exercise's authored `instructions` or `successCriterion`, across current and retained historical snapshots.
- The evidence matcher has explicit negative guards for fabricated text and text that belongs to a different exercise. The v0.3.0 catalogue and historical version boundaries are preserved.
- Next: run curriculum validation, formatting, type/unit checks and full CI; correct any evidence that fails rather than relaxing the matcher. After merge, continue deterministic exercise-specific confusion/error research only where authored rules make a misconception unambiguous.
