# Transparent skill-state rules

**Status:** implementation slice in progress  
**Scope:** local learner skill-state explanation and explicit learner correction

## Evidence boundary

Skill state is derived from assessment attempts, not from time spent practising. Practice-session duration, planned minutes, lesson completion, self-reported repetitions, tempo and difficulty remain activity or practice observations; none of them independently establishes mastery.

## Suggested-state rules

The application evaluates the latest assessment for a learner, curriculum release and skill. Attempts are ordered by assessment timestamp, then record timestamp, then stable ID as a deterministic tie-breaker.

| Condition | Suggested state | Explanation |
|---|---|---|
| No assessment exists | `not_started` | There is no assessment evidence yet |
| Latest assessment is `passed` | `stable` | The latest assessment passed; this is a suggestion, not a permanent guarantee |
| Latest assessment is `needs_practice` | `practising` | The latest assessment identified more practice to do |
| Latest assessment is `inconclusive` | `learning` | There is not enough evidence to call the skill stable |
| Existing state is `stable` and its review date has arrived | `review_due` | The learner should recheck the skill |

A due review takes precedence over the latest passed result when the persisted state is stable and its review timestamp is at or before the current time. A future review date does not change the suggested state.

## Learner correction

The application exposes an explicit learner correction operation. It requires a non-empty explanation (maximum 500 characters), stores the selected state and correction note with the mastery snapshot, and records `decisionSource: learner`. Evidence-derived updates use `decisionSource: evidence`.

A learner may correct a suggested state to a less advanced state when their real-world experience differs from the assessment. The safety invariant remains: a learner cannot mark a skill `stable` unless the latest assessment for that exact learner/release/skill is passed. Corrections do not rewrite or delete immutable assessment attempts.

## Transparency contract

Every explanation returns the suggested state, a stable rule identifier, evidence count, latest outcome and assessment timestamp, review timestamp, and a learner-readable reason. The function is pure and does not persist or mutate records.

## Deliberate non-goals

- No automatic score, accuracy estimate or confidence inference.
- No mastery inference from session duration, lesson completion or practice observations.
- No AI-generated assessment.
- No replacement of the existing review scheduler.
- No claim that the correction interaction is available in the learner UI until the dedicated screen and browser acceptance are implemented.
