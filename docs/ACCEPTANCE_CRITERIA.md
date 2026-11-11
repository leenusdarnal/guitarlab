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


## Pre-implementation readiness additions

- [x] Audit Year 1 and Year 2 JSON: 52 ordered records each, unique IDs, valid phase references and valid starting-tempo bounds.
- [x] Confirm Year 3+ has four 12-week specialist outlines.
- [x] Document that current curriculum records are weekly outlines, not fully authored lesson scripts.
- [x] Define first-release practice presets (10/20/40/custom) and explainable next-action recommendations.
- [x] Define accuracy-first evidence rules and prohibit timer-only mastery.
- [x] Define local instrument preferences and a progressive fretboard feature path.
- [x] Evaluate external no-signup music tools and set a link-only integration boundary.
- [x] Document P0/P1/deferred feature priorities and non-functional requirements.
- [ ] Select the final visual concept using the Product Design workflow before detailed UI implementation.
- [ ] Add a repository licence only if the owner decides to grant reuse permissions; this is not required to begin private local-first development.

The review is recorded in [Pre-Implementation Readiness](PRE_IMPLEMENTATION_READINESS.md). The checks above are documentation and data-shape checks; they do not represent application implementation, build or runtime test results.

## Curriculum research and revision

- [x] Screen 72 research results across eight Exa workstreams and review selected full-text sources.
- [x] Preserve the existing 52-week Year 1 and Year 2 stable week IDs.
- [x] Add a machine-readable spiral learning framework for rhythm, ear, technique, fretboard/theory, repertoire and reflection.
- [x] Correct the Week 6 chord prerequisite mismatch and narrow the first fretboard checkpoint.
- [x] Make pulse and listening recurring from Week 1; keep notation optional.
- [x] Define flexible practice lengths, accuracy-first tempo progression, adaptive review and multi-dimensional assessment.
- [x] Document evidence limitations and selected source bibliography.
- [ ] Add automated schema validation and curriculum tests during M1.
- [ ] Progressively author full lesson content; current weekly records remain outlines.
