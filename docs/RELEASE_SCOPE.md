# GuitarLab First-Release Scope

## Product target

A personal learning companion for one guitarist, usable on a phone beside the instrument and on desktop for planning and review. It should make the next useful practice action obvious and preserve the learner's existing progress.

## Included in the first useful release

### Learning experience
- Responsive dashboard with current target, next lesson, review-due skills and today's practice.
- Versioned Year 1 curriculum (all 52 weekly cards) and the Year 2 continuation outline.
- A lesson reader with objectives, explanation, exercise, practice piece and observable checkpoint.
- Separate handling for the weekly course and the learner's numbered micro-lessons.
- Manual progress marking that never equates lesson viewing with mastery.

### Practice experience
- Adjustable 40-minute suggested routine and optional recording/review block.
- Practice timer, metronome and session journal.
- Exercise logging for tempo, repetitions, clean attempts, difficulty and next target.
- Simple review queue for skills that need retrieval or more practice.
- Practice history and progress summary.

### Interactive music tools
- Six-string fretboard with note labels, root highlighting and note-finding exercises.
- Chord diagrams and a chord laboratory for open chords and basic transitions.
- Reference tones and a chromatic single-note tuner.
- Tuner microphone permission only after explicit user action; local processing by default.

### Data and resilience
- Local-first profile and IndexedDB persistence.
- Offline access to the app shell, curriculum and recently used lessons.
- Local export/restore of personal learning data.
- Cloudflare Worker runtime and D1 data layer designed for optional authenticated sync.
- Production deployment must be access-restricted or protected by secure authentication before any personal cloud data is stored.

## Deferred beyond first release

- Automatic polyphonic chord recognition or automatic chord grading.
- AI tutor / paid AI APIs.
- Social feed, rankings, public learner profiles or leaderboards.
- Multi-user collaboration, shared practice rooms or real-time jam features.
- Course-video hosting or redistribution of copyrighted material.
- Marketplace, subscriptions and creator tools.
- Complex recording editor and automatic performance scoring.
- Advanced notation editor and large user-generated tab catalog.

## Release 1 acceptance criteria

### Curriculum and progress
- All 52 Year 1 records load in order and carry stable IDs.
- The learner can resume the last active lesson.
- Weekly card progress and numbered micro-lesson progress are independent.
- A lesson can be complete while a linked skill remains in learning/practising state.
- Review-due skills are visible and can be practised without reopening the whole lesson.
- Assessment history is append-only; changing current mastery does not erase prior evidence.

### Practice
- A session can be started, paused, resumed and completed.
- A session stores start/end time, actual duration, exercises, notes and optional tempo observations.
- A timer alone never increments skill mastery.
- The learner can complete a short session and can customise the default routine.

### Offline and data safety
- A previously loaded lesson and local progress remain available without network access.
- Progress changes made offline survive reload and are queued for future sync.
- The user can export personal data and restore it into a clean profile.
- No personal lesson baseline, recordings, credentials or runtime databases are committed to this public repo.

### Interactive tools
- Fretboard labels and string order are correct for standard E-A-D-G-B-E tuning.
- Chord diagrams clearly distinguish fretted, open and muted strings.
- Metronome timing remains stable enough for practice at supported tempos.
- Tuner displays a confidence/uncertain state rather than a misleading note when pitch detection is unreliable.
- Microphone is opt-in and audio remains on-device unless the user explicitly chooses otherwise.

### Accessibility and quality
- All primary controls are keyboard accessible and labelled.
- Layout works at mobile and desktop widths.
- Colour contrast, focus visibility and reduced-motion preferences are respected.
- Loading, empty, error and offline states are designed.
- Type-check, lint, unit tests, end-to-end tests and production build pass before release.

## Release boundary

This is a private personal learning tool even though its source repository is public. The production app must not expose the learner's profile or progress. Keep the initial experience single-user and local-first; introduce cloud account/sync only with a verified authentication and authorisation boundary.


## Pre-implementation refinements

These clarifications refine—not replace—the first-release scope. The prioritisation and rationale are maintained in [Pre-Implementation Readiness](PRE_IMPLEMENTATION_READINESS.md).

### Required first-release behaviours
- Offer 10-, 20- and 40-minute practice plans plus a custom duration; preserve 40 minutes as the default suggestion.
- Explain the reason for the suggested next practice action and let the learner change it.
- Keep progress records for numbered micro-lessons and weekly cards independent.
- Make practice capture quick: actual duration, exercises, tempo/repetition observations where applicable, difficulty, short reflection and next target.
- Record accuracy separately from speed. Do not infer mastery from a timer, number of minutes, or raw repetition count.
- Provide local settings for handedness, instrument type, standard tuning, note-label preference and practice-time preference.
- Include a curriculum-content validation command in CI before content is treated as release-ready.

### Planned enhancements after the core loop
- Accuracy-gated tempo ladders and more detailed exercise-specific evidence.
- Scale/interval/triad/CAGED fretboard views.
- Metronome subdivisions, accents, tap tempo and improved count-in.
- Local audio review and phrase looping where device support is reliable.
- Optional external backing-track launcher, beginning with ComposeYogi.

These additions must not delay the reliable curriculum, practice capture, local persistence, export/restore and mobile usability.