# GuitarLab Execution Priority and Resume Plan

**Last updated:** 2026-11-14  
**Repository:** `leenusdarnal/guitarlab`  
**Default branch:** `main`  
**Verified baseline:** `a1da00fe0fb5804464ccb1679c128d1176957041` (PR #104 merged; curriculum release v1.0.6)  
**Purpose:** Durable execution queue. Refresh live GitHub state before resuming; current code, tests and CI outrank historical notes.

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

**Next after this slice:**
1. Expand authored exercise scope through explicit author review across Years 1–3.
2. Define what constitutes an exposure event and build aggregate coverage from stable links only.
3. Add confusion codes only when an exercise deterministically identifies a specific error.

**Exit criteria:** canonical tags have authored source evidence, taxonomy validation passes, and later exposure analytics are grounded in local records linked to stable lesson/exercise IDs. No taxonomy metadata or practice activity changes mastery.

### P2 — Musicianship, connected theory and repertoire (Issue #17)

1. Add chord-movement listening with feedback, retry and accessible visual instructions.
2. Extend interval work only where new intervals add a distinct learning outcome.
3. Add music-theory recall prompts connecting name, sound and musical use.
4. Connect triads, inversions, scales and CAGED positions to one shared music-theory/fretboard domain.
5. Add song-project notes, section structure, bookmarks and practice targets.
6. Keep TAB/notation content original, public-domain or properly licensed; external resources remain links and receive no learner-private data.

**Exit criteria:** musical examples are original/local or appropriately licensed; learning prompts are specific, accessible and tested; shared theory calculations are reused rather than duplicated.

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

1. One implementation PR at a time.
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
5. Continue the highest-priority incomplete task above, one slice at a time.
6. Record PR, CI evidence, manual QA and the next exact task before pausing.

## 6. Current hand-off

| Field | Value |
|---|---|
| Last verified main SHA | `9fa940474ebe650552ed70f222dc1cf44b506aba` (PR #111 merged) |
| PR #102 | Merged; Jazz & Harmony Weeks 5–8; curriculum v1.0.6 |
| PR #103 | Merged; append-only local recommendation feedback; merge commit `b27eed5e27e805d43259019fa304f80df20f356a` |
| PR #104 | Merged; comparable measured-score summaries/trends; merge commit `a1da00fe0fb5804464ccb1679c128d1176957041` |
| PR #110 | Merged; item accuracy and repeated-miss analytics; merge commit `a04d284e82447707de6b4d70a01115f2b2982e0b` |
| PR #111 | Merged; authored practice taxonomy v0.1.0 for ten evidenced Year 1 exercises; merge commit `9fa940474ebe650552ed70f222dc1cf44b506aba` |
| PR #104 validation | Run [#43584492437](https://github.com/leenusdarnal/guitarlab/actions/runs/43584492437); primary application/curriculum and Node.js 26 jobs passed |
| Current engineering task | Add the optional authored-exercise session selector and persist stable links on new local observations; author-review more scopes before defining exposure analytics |
| Audio | Issue #68 closed; real-device evidence remains in Issue #89 |
| Curriculum | 44/152 lessons task-specific; 32/48 Year 3+ specialist lessons; next specialist authoring is Jazz Weeks 9–12 and All-Round Musician |
| M8 | PRs #61/#67 merged; theory recall, chord movement, connected fretboard theory and repertoire remain in Issue #17 |
| M9 | Physical-device and release acceptance remains open under Issue #18 |
| Deferred | Production deployment, production D1, authentication, cloud sync and unreviewed CI redesign |

**Source-of-truth hierarchy:** current code/tests on `main` → merged PR evidence → current GitHub Issues/Actions → this checkpoint → historical notes and chat summaries.
