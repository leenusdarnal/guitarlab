# M7.2 — Practice Evidence and Planner Audit

**Status:** Objective item capture and comparable item analytics are implemented (PRs #107–110). The next slice introduces a versioned, author-evidenced exercise taxonomy; learner exposure coverage remains deferred until practice records can reference stable authored exercise IDs and curriculum releases.  
**Reviewed against:** merged PR #110 at `a04d284e82447707de6b4d70a01115f2b2982e0b` (PRs #92–94, #103–110 merged)  
**Scope:** Existing practice planning, activity observations, assessment history and skill-state rules

## Executive summary

GuitarLab already has the core records needed for a conservative, local-first adaptive practice layer. The existing planner is deterministic and explains its lesson, review, warm-up and musical-application suggestions. Practice observations and assessment attempts are separate records, and the skill-state explanation explicitly excludes practice duration and self-reported repetitions from mastery decisions.

The recommendation read model and category assessment-coverage view landed in PRs #93–94; append-only local learner feedback landed in PR #103; comparable measured-score summaries, spread and cautious trends landed in PR #104. Versioned item outcomes and repeated-miss analytics are now available through PRs #107–110. True topic/fretboard exposure is still not available: practice observations use learner-entered exercise names, and current sessions are not reliably associated with authored lesson/exercise IDs. A first taxonomy can document explicitly scoped authored exercises, but exposure must not be calculated until session linkage exists. Do not invent metadata from free-text names, lesson titles or repetition logs, and do not change assessment or mastery rules.

## Existing architecture

### 1. Practice planner

- `src/lib/application/practice-plan.ts` exposes the pure `buildPracticePlan` function.
- Inputs include available minutes, the current lesson, due-review candidates, learner goals, recent session signals and an explicit `now` timestamp.
- Candidate tasks currently include warm-up, current lesson focus, due skill review, musical application and reflection.
- Due reviews are filtered by `nextReviewAt <= now`, then ordered by state, confidence, due timestamp and skill ID.
- Task selection is deterministic, budget-aware and does not squeeze tasks to fit. Reasons explain why each selected task is present.
- Recent completed-session focus and difficulty are used as context for musical application, not as performance grades.
- Existing tests cover duration budgets, due-review ordering, missing evidence, learner goals and recent-session context.

**Remaining gap:** the adaptive read model now summarises versioned item outcomes separately from whole-skill measured scores and raises focused-practice priority after repeated incorrect outcomes on the same stable item (PR #110). It still does not measure actual practice exposure to a topic, string or fretboard position. Score trends remain descriptive and do not override assessment state or mastery.

### 2. Exercise observations

- `src/lib/domain/learning/practice-evidence.ts` defines strict submission and persisted-input schemas.
- Each observation is associated with a session and exercise ID, and records total repetitions, clean repetitions, optional tempo and optional learner-entered difficulty.
- Validation prevents clean repetitions exceeding total repetitions.
- The domain contract describes observations as append-only activity evidence, explicitly not assessment or mastery decisions.
- `src/lib/storage/practice.ts` exposes active-learner local IndexedDB reads/writes for sessions and exercise observations.

**Gap:** clean repetitions are learner-entered self-observations, not independently verified correctness. They are not measured accuracy or mastery. The existing practice observation schema remains free-text and has no stable authored exercise reference. Item outcomes are stored separately on objective assessment attempts. The first practice taxonomy slice adds authored scope metadata for a narrow set of known exercises, but it does not retroactively tag historic free-text observations.

### 3. Assessment history and skill state

- `src/lib/domain/learning/assessment.ts` defines append-only assessment attempts with skill, assessment kind, evidence type, outcome, optional score, summary and bounded scalar metadata.
- Outcomes distinguish `passed`, `needs_practice` and `inconclusive`; evidence types distinguish measured, observed/self-checked, self-reported and recording-reviewed evidence.
- `src/lib/domain/learning/skill-state.ts` derives an explanation from ordered assessment attempts and the current skill record.
- The latest assessment outcome is authoritative under the current rule set; a stable skill can become `review_due` when its review date arrives.
- With no assessments, the skill remains `not_started`; inconclusive evidence does not imply stable mastery.
- The skill-state module explicitly states that duration, lesson completion and self-reported repetitions are not inputs to mastery.

**Gap:** M7.2 needs a derived recommendation signal that can rank a skill for additional practice without rewriting its state. It must not replace `explainSkillState`, alter assessment outcomes, or reinterpret an inconclusive attempt as failure.

### 4. Learner-facing practice experience

- `src/routes/practice/+page.svelte` provides the local Practice Studio, session lifecycle, reflection/next-target capture and exercise-observation entry/history.
- The application already communicates that elapsed session time is activity history, not verified active practice or a skill assessment.
- Session and evidence operations use the active learner's local storage.

**Implemented:** the Practice Studio now shows up to six deterministic evidence-aware recommendations and assessment-category coverage from the reached Year 1 skill set (PR #94). It distinguishes assessment evidence from learner-entered exercise observations and shows an explicit missing-evidence state.

**Delivered in PR #103:** recommendations can be dismissed or corrected with bounded reasons and append-only local provenance. **Delivered in PR #104:** measured-score summaries, spread and conservative trends. **Delivered in PR #110:** item accuracy, inconclusive counts and repeated-miss prioritisation, separated from whole-skill mastery. The next taxonomy slice does not yet produce exposure coverage because the active practice session is not linked to authored exercise IDs.

## M7.2 implementation state after PRs #92–94 and #103–110

- PR #92 completed the baseline evidence/planner audit.
- PR #93 added `buildAdaptivePracticeSnapshot` as a pure deterministic read model with active-learner/release scoping, stable reason codes, review-due and assessment signals, measured-score summaries, explicit missing evidence and assessment-category coverage. It does not write or mutate mastery.
- PR #94 integrated the read model into Practice Studio and added the canonical versioned catalogue for the existing 34 skill IDs, draft-only assessment profiles and integrity validation.
- PR #103 added bounded append-only dismiss/correct feedback, learner/release-scoped IndexedDB storage, deterministic latest-feedback resolution and accessible Practice Studio controls. Backup/restore/reset handling and browser acceptance are included; feedback does not alter assessments or mastery.
- PR #104 added comparable measured-score count/latest/mean/spread and conservative improving/stable/declining trends. Only the most recently used assessment kind is summarized. A trend requires four comparable measured scores, compares two earlier with two recent scores, and uses a five-point threshold.
- PR #107 adds objective standard-tuning item capture; PR #108 adds interval-recognition item capture; PR #109 adds pulse-listening item capture. All are supporting probes, not whole-skill mastery assessments.
- PR #110 derives comparable item accuracy and consecutive repeated-miss signals from those versioned outcomes. Inconclusive attempts remain visible but are excluded from accuracy; correct or inconclusive later outcomes reset the same item's miss streak. Supporting probes do not change skill state or mastery.
- Repeated high difficulty in self-reported exercise observations remains a pacing hint only; it is not a wrong-answer count or accuracy score. Score spread/trends are descriptive summaries, not mastery decisions.
- Current feedback choices are dismissal, already confident, too difficult and not relevant. They do not update assessment attempts or mastery. New recommendation evidence after a feedback timestamp can make a recommendation eligible to return.

## Evidence quality rules for M7.2

| Evidence source | Permitted use | Must not be used for |
|---|---|---|
| Assessment outcome and evidence type | Explain assessed skill status; prioritise valid needs-practice and inconclusive follow-up with evidence-type context | Silently rewriting the outcome or treating all evidence types as equally measured |
| Assessment score / item metadata | Per-item performance only where the existing assessment actually records comparable item-level evidence | Inferring item accuracy from a skill-level score or free text |
| Clean / total repetitions | Labelled self-reported practice signal; optionally surface as learner reflection context | Verified accuracy, assessment pass, or stable mastery |
| Practice duration / completed sessions | Activity history and pacing context | Skill correctness or mastery |
| Review timestamp | Deterministic due/overdue ordering | Overriding a newer assessment outcome |
| Exercise ID / lesson focus | Existing exercise/lesson linkage where known | Guessing topic, string, fretboard position or confusion taxonomy from unstructured labels |
| Missing data | Explicit “not enough evidence” state | Treating missing as zero, failure or poor performance |

## Recommended M7.2 design

1. Add a pure application-level read model that accepts already-loaded active-learner records and a fixed `now`; no database writes or network calls in the prioritisation function.
2. Use stable reason codes, for example `assessment_needs_practice`, `assessment_inconclusive`, `review_overdue`, `repeated_self_reported_difficulty`, `coverage_gap` and `insufficient_evidence`. Only emit a reason when its source data exists.
3. Keep evidence classes explicit. Assessment-derived signals and learner-entered practice observations must remain distinguishable in both ranking and UI copy.
4. Treat repeated difficulty as a weak prioritisation hint only when observations can be grouped reliably by the same exercise. Do not call it repeated incorrect answers: the current observation schema does not record per-attempt correctness.
5. Add coverage only from explicit, canonical topic/fretboard metadata already available in curriculum or assessment records. Do not infer coverage from arbitrary exercise names.
6. Preserve deterministic tie-breaking (priority, evidence timestamp, stable skill/exercise ID). Make the clock an input for testability.
7. Add dismiss/correct as separate learner-feedback records or a similarly auditable local mechanism. Preserve recommendation identity, action, timestamp and correction provenance; never mutate assessment history or mastery as a side effect.
8. Derive accuracy and consistency only from comparable, explicitly scored assessment/item observations. If item-level evidence is absent, render an explicit unavailable/insufficient-evidence state.
9. Keep analytics derived and local. Do not create a duplicate progress store or add cloud sync.
10. Evaluate the simple rules-based approach before considering BKT/IRT or predictive scheduling.

## Implementation sequence

- [x] Audit current planner, activity evidence, assessment history and skill-state rules (PR #92).
- [x] Specify and test deterministic reason codes, evidence scoping and recommendation ordering (PR #93).
- [x] Add Practice Studio recommendations, catalogue integrity and category assessment coverage (PR #94).
- [x] Add local append-only dismiss/correct feedback with provenance, persistence, backup/restore/reset and browser tests (PR #103).
- [x] Add per-skill measured-score summaries, descriptive spread and conservative trend states with unit tests (PR #104).
- [x] Define a versioned per-item evidence contract for correctness only where the assessment flow directly observes an outcome; include provenance, learner/release scope and backup compatibility (PRs #107–109).
- [ ] Add explicit canonical topic/technique/fretboard metadata where authors can reliably tag the assessed scope; do not guess tags from free text.
- [ ] Use item outcomes for repeated-confusion prioritisation and item accuracy only after valid source records exist.
- [ ] Add topic/fretboard exposure coverage only after canonical metadata and corresponding learner evidence exist.
- [x] Keep session duration, repetitions, feedback and recommendations outside mastery decisions; preserve explicit missing-data states.
- [ ] Update the M7.2 issue and implementation checkpoint when the structured evidence slice is merged.

## Explicit non-goals

- No mastery changes from practice time, lesson completion, clean-repetition counts or recommendation interactions.
- No claim that self-entered clean repetitions are independently verified accuracy.
- No fabricated per-item correctness, confusion labels or fretboard coverage.
- No opaque AI/ML, BKT/IRT or cloud-dependent recommendation service.
- No raw audio, private learner notes or recording payloads in analytics.

## Files reviewed

- `src/lib/application/practice-plan.ts`
- `src/lib/application/practice-history.ts`
- `src/lib/application/practice-plan.test.ts`
- `src/lib/domain/learning/practice-evidence.ts`
- `src/lib/domain/learning/assessment.ts`
- `src/lib/domain/learning/skill-state.ts`
- `src/lib/storage/practice.ts`
- `src/routes/practice/+page.svelte`
- `docs/RESEARCH_INTEGRATION_PLAN.md`


## Item-evidence rollout — current main after PRs #107–109

The assessment capture audit was followed by three narrow, learner-facing objective evidence producers. They share the existing versioned assessment-attempt contract and append-only learner-scoped IndexedDB store; no new assessment store or cloud learner-data flow was added.

- **PR #107 — standard tuning recall:** six explicitly selected open-string pitch items, stable string/item identities, a versioned exact-match rule and a five-of-six threshold. Missing responses remain inconclusive. It measures recall of standard open-string pitches, not physical tuning accuracy.
- **PR #108 — interval recognition:** one explicit interval choice against a browser-generated listening item, with a stable item ID and versioned exact-choice rule. It measures interval listening discrimination, not performed intervals.
- **PR #109 — Pulse listening:** one explicit steady/uneven choice against a deterministic four-beat pattern, with stable pattern IDs and a versioned exact-choice rule. It maps to `ear.rhythm` as a listening-recognition supporting probe; it does not measure the learner's ability to play or maintain a steady pulse.

All three flows record response provenance and direct item correctness. The two listening flows are explicitly `supporting_probe` evidence. The standard-tuning flow is also a supporting probe. They are not whole-skill mastery assessments; they must not replace a skill-level assessment, award mastery or be conflated with physical performance. No confusion/error code is inferred from an incorrect selection.

### Remaining integration gap

The Practice Studio read model excludes supporting probes from whole-skill assessment counts, measured-score trends and mastery recommendations. PR #110 now surfaces their comparable item outcomes separately and uses repeated same-item misses for focused-practice ranking without changing whole-skill mastery.

The next implementation should link new practice observations to stable authored lesson/exercise IDs and curriculum release, then derive topic/fretboard exposure only from those links and the authored taxonomy. Existing free-text observations remain unclassified. Expand the taxonomy only after explicit author review; keep confusion/error codes deferred unless an assessment can identify a specific misconception deterministically.

### Current sequence

- [x] Trace the assessment capture path and identify the missing learner-facing producer (this follow-up audit; PR #106's unmerged branch is superseded by this update).
- [x] Add the first objectively scored, learner-facing item evidence producer (PR #107).
- [x] Extend objective item capture to interval listening (PR #108).
- [x] Extend objective item capture to Pulse listening (PR #109).
- [x] Integrate versioned item accuracy and repeated-miss prioritisation into Practice Studio without changing mastery rules (PR #110).
- [x] Add a first authored topic, technique, string and fret-position taxonomy for ten directly evidenced Year 1 exercises.
- [ ] Link new practice observations to authored lesson/exercise IDs and curriculum release; do not retroactively classify free-text history.
- [ ] Add topic/fretboard exposure coverage only after stable authored exercise links exist.
- [ ] Expand taxonomy across Years 1–3 through author review; add confusion/error labels only where the task deterministically supports them.


## Structured item analytics and authored practice taxonomy checkpoint

- [x] Add objective, versioned item outcomes for standard tuning, interval recognition and pulse listening (PRs #107–109).
- [x] Surface item accuracy and repeated same-item misses without changing whole-skill mastery or category assessment coverage (PR #110).
- [x] Create a versioned authored exercise taxonomy with separate topic, technique, string, fret-position and numeric fret-range dimensions for an initial ten explicitly evidenced Year 1 exercise scopes (content/curriculum/practice-taxonomy.json).
- [x] Expose exact lesson/exercise lookup for the active curriculum release; unknown and generic exercises remain untagged (src/lib/application/practice-taxonomy.ts).
- [x] Add unit tests and curriculum validation for taxonomy references and scope constraints.
- [ ] Extend Practice Studio session creation to select an authored lesson and exercise ID, persisting curriculum release and stable exercise identity alongside learner observations.
- [ ] Add exposure coverage only after new records carry that stable scope. Historic free-text observations remain unclassified.
- [ ] Expand taxonomy across Years 1–3 through author review; do not bulk-tag using keyword or title similarity.
- [ ] Add structured error/confusion labels only when a task deterministically identifies a specific misconception.

**Privacy and evidence boundary:** The taxonomy is public authored curriculum metadata. Learner observations remain local IndexedDB records. Taxonomy tags do not assert learner performance, correctness, proficiency or mastery.
