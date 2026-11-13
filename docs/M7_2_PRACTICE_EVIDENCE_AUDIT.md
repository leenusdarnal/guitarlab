# M7.2 — Practice Evidence and Planner Audit

**Status:** Baseline audit; implementation design input  
**Reviewed against:** `main` at `ec3c3c841675af84727d87807c4975a4a5c5a8f0`  
**Scope:** Existing practice planning, activity observations, assessment history and skill-state rules

## Executive summary

GuitarLab already has the core records needed for a conservative, local-first adaptive practice layer. The existing planner is deterministic and explains its lesson, review, warm-up and musical-application suggestions. Practice observations and assessment attempts are separate records, and the skill-state explanation explicitly excludes practice duration and self-reported repetitions from mastery decisions.

The main gap is not a missing source of truth: it is the absence of a derived read model that joins valid per-exercise observations, assessment evidence, review dates and topic coverage into ranked, explainable recommendations and learner-facing analytics. M7.2 should add that read model without changing the underlying records or mastery rules.

## Existing architecture

### 1. Practice planner

- `src/lib/application/practice-plan.ts` exposes the pure `buildPracticePlan` function.
- Inputs include available minutes, the current lesson, due-review candidates, learner goals, recent session signals and an explicit `now` timestamp.
- Candidate tasks currently include warm-up, current lesson focus, due skill review, musical application and reflection.
- Due reviews are filtered by `nextReviewAt <= now`, then ordered by state, confidence, due timestamp and skill ID.
- Task selection is deterministic, budget-aware and does not squeeze tasks to fit. Reasons explain why each selected task is present.
- Recent completed-session focus and difficulty are used as context for musical application, not as performance grades.
- Existing tests cover duration budgets, due-review ordering, missing evidence, learner goals and recent-session context.

**Gap:** the planner does not currently consume per-item correctness/accuracy, repeated confusions, neglected topic/fretboard coverage, or learner feedback about prior recommendations. The current review candidate carries state, confidence and next-review timestamp, but not assessment trend or evidence recency.

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

**Gap:** no consolidated accuracy/consistency/coverage analytics or dismiss/correct workflow for adaptive recommendations was identified in the reviewed practice planner and evidence contracts. The next implementation should inspect the relevant route/data loading boundaries before choosing where the derived view belongs.

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

- [x] Audit current planner, activity evidence, assessment history and skill-state rules.
- [ ] Specify and test the recommendation scoring/reason-code contract.
- [ ] Implement deterministic prioritisation using only supported evidence.
- [ ] Add local learner feedback (dismiss/correct) with provenance.
- [ ] Add derived accuracy, consistency and coverage views with missing-data states.
- [ ] Add unit, application and browser tests, including deterministic tie-breaks and mastery invariants.
- [ ] Update the M7.2 issue and implementation checkpoint with merged evidence.

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
