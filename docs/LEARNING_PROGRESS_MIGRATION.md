# Learner Progress Migration Plan

## Privacy boundary

The GitHub repository is public. Personal learner status, recordings, practice notes and account data must stay in local/private application storage and must not be committed as source files, seed fixtures or screenshots.

## Two separate progress tracks

The product must not confuse:
1. **Curriculum progress:** phase, week, week-card and checkpoint progress in the 52-week master route.
2. **Numbered micro-lesson progress:** the learner's smaller, individually numbered lesson sequence.

A mapping between the two may be suggested, but the records remain independent. For example, a micro-lesson can be in progress while its associated weekly card remains partially complete.

## Initial private baseline

When the local profile is first initialised, the app should import the existing learner baseline from a private setup payload:
- preserve the already completed numbered lessons;
- preserve the current E-minor micro-lesson as in progress, with its mastery check pending;
- set A minor as the next planned micro-lesson;
- retain Em-Am chord transitions as the following practice target;
- do not mark a curriculum week complete merely because a micro-lesson was completed.

The actual baseline values belong in a private local profile and are intentionally omitted from the public repository.

## Required import fields

- stable learner-local ID
- source system / import version
- numbered lesson ID and status
- current micro-lesson ID
- current skill IDs and current mastery state
- completed-at timestamps when known (otherwise null, never fabricated)
- next planned target
- import timestamp and migration version

## Safety and idempotency

- Import is idempotent: running it twice must not duplicate lessons or assessments.
- Never replace a newer local record with an older seed value.
- Preserve unknown timestamps as unknown.
- Store imported status as baseline evidence, not as a fabricated objective assessment.
- Keep previous assessment history immutable.
- Provide a visible confirmation and a data export before destructive profile reset.

## Implementation timing

M0 defines the source mapping and privacy contract. The actual private profile seed is performed when local persistence is implemented (M5), then verified with an export/restore test. Until then, the known baseline remains in the existing learning context and is not written to the public Git repository.
