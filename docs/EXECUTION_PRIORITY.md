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

### P1 — Adaptive recommendations and evidence-backed analytics (Issue #69)

**Delivered:**

- PR #92: audited the planner, append-only practice observations, assessment history and mastery boundary.
- PR #93: added a deterministic, learner/release-scoped read model with stable reason codes, review-due and assessment signals, explicit missing-evidence states, measured-score summaries and assessment-category coverage.
- PR #94: integrated recommendations and assessment coverage into Practice Studio; added the canonical catalogue for the existing 34 skill IDs and draft-only assessment profiles.
- PR #103: added bounded, append-only dismiss/correct feedback with provenance, learner/release-scoped IndexedDB persistence, deterministic resolution against newer evidence, backup/restore/reset handling and accessible Practice Studio controls.
- PR #104: added measured-score count/latest/mean/spread and cautious improving/stable/declining trends per skill. Scores are compared only within the latest assessment kind; a trend requires four comparable scores and compares two earlier with two recent scores.

**Next implementation slice — structured evidence contract (not guessed analytics):**

1. Define a bounded, versioned per-item assessment evidence shape with stable item identity and outcome (`correct`, `incorrect`, `inconclusive`) only for assessment flows that actually observe the outcome.
2. Keep item evidence tied to learner, curriculum release, skill and assessment attempt; define provenance and retention/export behaviour before persisting it.
3. Add taxonomy metadata only where curriculum/assessment authors can explicitly name topic, technique or fretboard scope. Do not infer it from free-text exercise names, lesson titles or repetition logs.
4. Add deterministic tests for repeated-confusion prioritisation and coverage only after the corresponding structured evidence exists.
5. Preserve assessment outcomes and mastery rules; additional item evidence can inform recommendations but must not silently award mastery.

**Known evidence limits:** practice observations contain learner-entered repetitions and difficulty, not per-item correctness. Skill catalogue categories support assessment-category coverage, not string/fretboard-position exposure. PR #104 score spread and four-score trend are descriptive measured-score consistency signals, not per-item accuracy or mastery. Do not represent any of these missing dimensions as zero or poor performance.

**Exit criteria:** a versioned item-evidence contract, provenance/privacy rules and canonical topic/fretboard metadata are implemented and tested before recommendation ranking uses them. Existing feedback and analytics remain read-only with respect to mastery.

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
| Last verified main SHA | `a1da00fe0fb5804464ccb1679c128d1176957041` |
| PR #102 | Merged; Jazz & Harmony Weeks 5–8; curriculum v1.0.6 |
| PR #103 | Merged; append-only local recommendation feedback; merge commit `b27eed5e27e805d43259019fa304f80df20f356a` |
| PR #104 | Merged; comparable measured-score summaries/trends; merge commit `a1da00fe0fb5804464ccb1679c128d1176957041` |
| PR #104 validation | Run [#43584492437](https://github.com/leenusdarnal/guitarlab/actions/runs/43584492437); primary application/curriculum and Node.js 26 jobs passed |
| Current engineering task | Design a versioned, privacy-bounded per-item assessment evidence contract and explicit topic/fretboard taxonomy before implementing per-item accuracy/confusion or coverage ranking |
| Audio | Issue #68 closed; real-device evidence remains in Issue #89 |
| Curriculum | 44/152 lessons task-specific; 32/48 Year 3+ specialist lessons; next specialist authoring is Jazz Weeks 9–12 and All-Round Musician |
| M8 | PRs #61/#67 merged; theory recall, chord movement, connected fretboard theory and repertoire remain in Issue #17 |
| M9 | Physical-device and release acceptance remains open under Issue #18 |
| Deferred | Production deployment, production D1, authentication, cloud sync and unreviewed CI redesign |

**Source-of-truth hierarchy:** current code/tests on `main` → merged PR evidence → current GitHub Issues/Actions → this checkpoint → historical notes and chat summaries.
