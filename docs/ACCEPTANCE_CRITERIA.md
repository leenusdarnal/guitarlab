# M0 Foundation Acceptance Criteria

M0 is a specification and curriculum milestone. It is complete when the requirements below are documented and cross-linked; application behaviour is tested in the milestone where it is implemented.

## Curriculum source
- [x] Recover the full 52-week Year 1 curriculum from the curated learning-path source.
- [x] Recover the 52-week Year 2 continuation outline.
- [x] Record four optional Year 3+ specialisation routes.
- [x] Preserve optional staff notation as an enrichment track, not a core-route blocker.
- [x] Preserve the five-day learning cycle and adaptive pacing checkpoints.

## Learning model
- [x] Separate weekly curriculum cards from numbered micro-lessons.
- [x] Define versioned content structure and stable IDs.
- [x] Define the nine skill domains and evidence types.
- [x] Separate lesson completion from demonstrated mastery.
- [x] Define append-only assessment history and non-punitive review.

## Product scope
- [x] Define the personal, single-learner first-release scope.
- [x] Define local-first and offline requirements.
- [x] Define first-release practice and music tools.
- [x] Explicitly defer unvalidated polyphonic chord grading, AI tutor and social features.
- [x] Document the private-data boundary for the public repository.

## Experience direction
- [x] Establish hybrid dashboard + immersive practice studio.
- [x] Establish minimal, premium, high-contrast visual principles.
- [x] Establish screen hierarchy and mobile practice requirements.
- [ ] Select a final visual concept and token set before detailed UI implementation.

## Private learner baseline
- [x] Record the baseline migration rules and lesson-state mapping.
- [x] Specify idempotent import, unknown timestamp handling and immutable history.
- [ ] Execute the private runtime import when the local persistence layer exists (M5).

## Gate to M1
M1 may begin from the documented product and architecture requirements. Detailed UI implementation must wait for the final visual concept selection. The private progress import is intentionally deferred until a private local profile exists.
