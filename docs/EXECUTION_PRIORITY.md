# GuitarLab Execution Priority and Resume Plan

**Last updated:** 2026-11-15  
**Repository:** `leenusdarnal/guitarlab`  
**Default branch:** `main`  
**Verified baseline:** `2cc859fea62eacd5838e9ee5cbeb41005a4b0131` (PR #129 merged; curriculum release v1.0.6)  
**Purpose:** Durable execution queue. Refresh live GitHub state before resuming; current code, tests and CI outrank historical notes.

## Live checkpoint — 2026-11-15 after PR #129

- Verified `main` HEAD: `2cc859fea62eacd5838e9ee5cbeb41005a4b0131`, the squash merge of PR #129. PRs #127, #128 and #129 were merged in priority order after the earlier governance and M7 work.
- Post-merge main GuitarLab CI run [#43682019382](https://github.com/leenusdarnal/guitarlab/actions/runs/43682019382) passed, including application/curriculum validation and Node.js 26 compatibility.
- PR #127 added all 12 simple ascending melodic interval classes across three focused sets, with generated local audio and version-2 supporting-probe evidence.
- PR #128 added [the interval progression and stimulus research](https://github.com/leenusdarnal/guitarlab/blob/main/docs/INTERVAL_TRAINING_PROGRESSION.md), identifying fixed A4 as the next bounded stimulus limitation.
- PR #129 added the [content provenance and licensing audit](https://github.com/leenusdarnal/guitarlab/blob/main/docs/CONTENT_PROVENANCE_AUDIT.md). Its audited 265-entry tracked tree contained no standalone TAB, notation, image, audio or MIDI assets. This clears the current bundled-content acceptance check only; every future bundled asset still needs item-level rights evidence.
- Issue #17 is complete and closed. Its checklist now records all shipped listening, theory, repertoire and current-content provenance work. Descending/harmonic intervals, notation spelling and pitch/register variation are separate follow-ups, not silently claimed as complete.
- The active next slice is [Issue #130 — deterministic interval starting-pitch and register variation](https://github.com/leenusdarnal/guitarlab/issues/130), on branch `feat/m8-interval-register-variation`. Each interval class independently cycles all 24 chromatic roots C3–B4 deterministically (stride 5 for the four-choice sets, 7 for the five-choice set); the second tone is derived from the authored semitone distance. The changed stimulus policy uses supporting-probe v3 so historical v2 evidence remains separate.
- Issue #5 remains open until the controlled workflow is manually dispatched in both modes (expected failure and clean recovery), and the real run URLs are recorded.
- Issue #3 remains open pending explicit owner decisions on account ownership, hostname, access model, data architecture and release approval. No production resources, secrets, D1 database, routes, authentication or production deployment have been created or authorized.
- Physical-device and recording evidence remains outstanding under Issues #89, #9, #10 and #18. Synthetic fixtures and automated browser checks do not count as hardware sign-off.
- After Issue #130's PR passes and is merged, verify post-merge main CI before moving to the next priority. Production deployment remains deferred.

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
- PRs #107–109: objectively keyed item evidence for standard tuning, interval recognition and pulse listening.
- PR #110: separate item accuracy and repeated-miss prioritisation, without changing whole-skill mastery.

**Delivered authored exercise scope (PR #111):**
1. Versioned public taxonomy with separate topic, technique, string, fret-position and numeric fret-range dimensions.
2. Exact stable lesson/exercise links only where authored instructions or success criteria support the tag.
3. Unknown string/fret values remain empty; no inference from free text, titles or broad skill categories.
4. Taxonomy terms, release identity, exercise references and numeric bounds are validated in curriculum CI.
5. Taxonomy metadata remains separate from learner-owned observations.

**Current implementation slice — stable local observation links:**
1. Offer an optional Practice Studio selector of exact authored lesson/exercise pairs for the active release.
2. Persist selected release, lesson ID, exercise ID and taxonomy version on the session; inherit them on new observations.
3. Keep general sessions and prior free-text history unlinked; no retroactive classification.
4. Validate session/observation identity and preserve optional fields in existing version-1 backups.
5. Do not calculate topic/string/fretboard exposure until a separate definition and read model are reviewed.

**Next after PR #113:**
1. Expand authored exercise scope only through exact source review; the next bounded batch covers five Year 1 / Year 2 exercises and keeps unsupported string/fret values empty.
2. Version taxonomy additions and retain prior snapshots so old records remain interpretable under their original taxonomy.
3. Preserve the PR #113 exposure definition: one or more exact linked observations constitute activity exposure, not completion, accuracy or mastery.
4. Add confusion codes only when an exercise deterministically identifies a specific error.

**Exit criteria:** canonical tags have authored source evidence, taxonomy validation passes, and later exposure analytics are grounded in local records linked to stable lesson/exercise IDs. No taxonomy metadata or practice activity changes mastery.

### P2 — Musicianship, connected theory and repertoire (Issue #17) — complete

- [x] Chord-movement listening with feedback, retry and accessible visual instructions (PR #118).
- [x] Theory recall prompts connecting name, sound and musical use (PR #119).
- [x] Shared scale, triad, inversion and CAGED calculations (PR #120).
- [x] Local repertoire notes, section structure, bookmarks, practice targets and backup/restore (PR #121).
- [x] All 12 simple interval classes across three focused ascending melodic sets (PR #127).
- [x] Current bundled-content provenance and future asset-level licensing gate (PR #129); Issue #17 closed.

**Exit criteria:** met for the current built-in GuitarLab content. The licensing audit is not blanket clearance for user-entered material or external links. Future bundled files still need per-asset rights evidence.

### P2 follow-up — Deterministic interval starting pitch and register (Issue #130)

1. Cycle each interval class through the documented chromatic MIDI range C3–B4; use deterministic root strides of five for four-choice sets and seven for the five-choice set, each coprime with 24.
2. Preserve the authored semitone interval and ascending melodic presentation; keep every generated tone within C3–B5.
3. Version the changed interval stimulus as definition v3 / scoring rule v3 while keeping the supporting-probe-only decision scope and historical v2 records separate.
4. Verify root coverage, frequency bounds, semitone invariance and replay determinism in all three interval sets.
5. Retain learner-facing relative-interval prompts, retry/next behaviour and owned Web Audio teardown.

**Exit criteria:** CI and browser acceptance pass on the focused implementation PR; supporting-probe evidence v2 and v3 remain separately grouped.

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
| Last verified main SHA | `a78da53dc82457326663ae2d6a93f00ef64cda60` (PR #124 merged); post-merge CI run #43677525851 passed |
| PRs #117–#125 | Merged in priority order; interval feedback, chord movement, theory recall, shared harmony/CAGED, local repertoire, real-device evidence matrix, isolated CI rehearsal and production approval gates |
| PR #124 | Merged as `a78da53dc82457326663ae2d6a93f00ef64cda60`; execution governance and tracker updated |
| PR #127 | Open; Issue #17 extended interval recognition. Current head `1829a80f59e6c3baf5f96089afb4003e30420b1`; up to date with main; full CI run #43677940024 is pending/in progress |
| Post-merge main CI | [Run #43677525851](https://github.com/leenusdarnal/guitarlab/actions/runs/43677525851) passed application/curriculum and Node.js 26 jobs |
| PR #127 CI | [Run #43677940024](https://github.com/leenusdarnal/guitarlab/actions/runs/43677940024); required application/curriculum workflow in progress; Node.js 26 compatibility passed |
| Current product follow-up | Issue #17: PR #127 extends ascending interval listening; remaining TAB/notation provenance/licensing review remains open |
| Audio and device evidence | Issue #89 real-guitar/physical audio evidence; Issues #9 and #10 physical-device storage and backup/restore; Issue #18 accessibility, privacy and release acceptance |
| Controlled CI evidence | Issue #5 remains open until real failure-injection and recovery run URLs are recorded |
| Production | Issue #3 remains open pending owner decisions and explicit approval; no production provisioning or deployment |
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
