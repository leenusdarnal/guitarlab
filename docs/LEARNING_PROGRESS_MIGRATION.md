# Learner Progress Migration Plan

## Privacy boundary

The GitHub repository is public. Personal learner status, recordings, practice notes and account data must stay in local/private application storage and must not be committed as source files, seed fixtures or screenshots.

## Two separate progress tracks

The product must not confuse:
1. **Curriculum progress:** phase, week, week-card and checkpoint progress in the 52-week master route.
2. **Numbered micro-lesson progress:** the learner's smaller, individually numbered lesson sequence.

A mapping between the two may be suggested, but the records remain independent. A micro-lesson can be in progress while its associated weekly card remains partially complete.

## Initial private baseline

When the local profile is first initialised, the app should import the existing learner baseline from a private setup payload. The payload must preserve:
- completed numbered lessons and their known completion state;
- the current micro-lesson and whether its mastery check is pending;
- the next planned micro-lesson;
- any following practice target;
- any known skill states and assessment evidence.

The actual lesson names, statuses, notes and personal practice history are private profile data. They must not appear in public documentation, seed fixtures, issue screenshots or commits.

Do not mark a curriculum week complete merely because a numbered micro-lesson was completed.

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

M0 defines the source mapping and privacy contract. The actual private profile seed is performed when local persistence is implemented (M5), then verified with an export/restore test. Until then, the personal baseline remains in the existing private learning context and is not written to the public Git repository.
