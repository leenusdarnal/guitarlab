# M7.2 — Practice Evidence and Planner Audit

**Status:** Partial implementation verified; next gap is structured item evidence and explicit topic/fretboard taxonomy  
**Reviewed against:** `main` at `a1da00fe0fb5804464ccb1679c128d1176957041` (PRs #92–94, #103–104 merged)  
**Scope:** Existing practice planning, activity observations, assessment history and skill-state rules

## Executive summary

GuitarLab already has the core records needed for a conservative, local-first adaptive practice layer. The existing planner is deterministic and explains its lesson, review, warm-up and musical-application suggestions. Practice observations and assessment attempts are separate records, and the skill-state explanation explicitly excludes practice duration and self-reported repetitions from mastery decisions.

The recommendation read model and category assessment-coverage view landed in PRs #93–94; append-only local learner feedback landed in PR #103; comparable measured-score summaries, spread and cautious trends landed in PR #104. The remaining gap is not another display of the same score aggregates: item-level correctness/confusion and true topic/fretboard exposure require explicit source fields and canonical metadata. Do not invent them from free-text exercise IDs, lesson titles or repetition logs, and do not change the underlying assessment or mastery rules.

## Existing architecture

### 1. Practice planner

- `src/lib/application/practice-plan.ts` exposes the pure `buildPracticePlan` function.
- Inputs include available minutes, the current lesson, due-review candidates, learner goals, recent session signals and an explicit `now` timestamp.
- Candidate tasks currently include warm-up, current lesson focus, due skill review, musical application and reflection.
- Due reviews are filtered by `nextReviewAt <= now`, then ordered by state, confidence, due timestamp and skill ID.
- Task selection is deterministic, budget-aware and does not squeeze tasks to fit. Reasons explain why each selected task is present.
- Recent completed-session focus and difficulty are used as context for musical application, not as performance grades.
- Existing tests cover duration budgets, due-review ordering, missing evidence, learner goals and recent-session context.

**Remaining gap:** the planner still cannot consume per-item correctness or repeated confusion because current persisted evidence is skill-level, not item-level. The read model includes assessment outcome, review-due and explicit learner-difficulty signals, plus category-level assessment coverage; it does not measure exposure to a topic, string or fretboard position. PR #104 adds a descriptive measured-score trend, but the planner does not yet use it to override assessment state or change recommendation priority.

### 2. Exercise observations

- `src/lib/domain/learning/practice-evidence.ts` defines strict submission and persisted-input schemas.
- Each observation is associated with a session and exercise ID, and records total repetitions, clean repetitions, optional tempo and optional learner-entered difficulty.
- Validation prevents clean repetitions exceeding total repetitions.
- The domain contract describes observations as append-only activity evidence, explicitly not assessment or mastery decisions.
- `src/lib/storage/practice.ts` exposes active-learner local IndexedDB reads/writes for sessions and exercise observations.

**Gap:** clean repetitions are a learner-entered self-observation, not independently verified correctness. They can inform a clearly labelled self-reported signal, but must not be treated as measured accuracy or as a mastery award. The current observation schema has no per-attempt item outcome, error/confusion code, or structured topic/fretboard tags. Avoid retroactively inventing these fields from free-text exercise IDs.

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

**Delivered in PR #103:** recommendations can be dismissed or corrected with a bounded reason; records are append-only, learner/release scoped and local in IndexedDB, with deterministic latest-feedback resolution and reappearance after newer evidence. Backup, restore and confirmed reset account for the new store. **Delivered in PR #104:** the analytics disclosure presents measured-score count/latest/mean/spread and a four-score trend by assessment kind. It explicitly distinguishes missing evidence and does not use self-entered practice repetitions. **Remaining gap:** item-level accuracy/confusion and topic/fretboard practice coverage remain unavailable until explicit structured records and taxonomy metadata exist.

## M7.2 implementation state after PRs #92–94 and #103–104

- PR #92 completed the baseline evidence/planner audit.
- PR #93 added `buildAdaptivePracticeSnapshot` as a pure deterministic read model with active-learner/release scoping, stable reason codes, review-due and assessment signals, measured-score summaries, explicit missing evidence and assessment-category coverage. It does not write or mutate mastery.
- PR #94 integrated the read model into Practice Studio and added the canonical versioned catalogue for the existing 34 skill IDs, draft-only assessment profiles and integrity validation.
- PR #103 added bounded append-only dismiss/correct feedback, learner/release-scoped IndexedDB storage, deterministic latest-feedback resolution and accessible Practice Studio controls. Backup/restore/reset handling and browser acceptance are included; feedback does not alter assessments or mastery.
- PR #104 added comparable measured-score count/latest/mean/spread and conservative improving/stable/declining trends. Only the most recently used assessment kind is summarized. A trend requires four comparable measured scores, compares two earlier with two recent scores, and uses a five-point threshold.
- Repeated high difficulty in self-reported exercise observations remains a pacing hint only; it is not a wrong-answer count or accuracy score. Score spread/trends are descriptive summaries, not mastery decisions or verified item-level accuracy.
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
- [ ] Define a versioned per-item evidence contract for correctness/confusion only where the assessment flow directly observes an outcome; include provenance, learner/release scope and backup compatibility.
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
