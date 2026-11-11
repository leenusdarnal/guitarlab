# GuitarLab Product Specification

## Product promise

GuitarLab is a self-contained guitar-learning environment. It teaches the learner what to practise, why the skill matters, how to perform it, how to apply it musically and how to judge whether it is becoming reliable.

## Primary learner journey

1. Create a fresh learner profile and begin the curriculum or take an optional new placement assessment.
2. Open the dashboard and choose today's suggested practice.
3. Read the lesson explanation and follow its guided demonstration.
4. Perform focused exercises with clear success criteria.
5. Apply the skill to an original phrase, progression or permitted repertoire.
6. Record evidence or a self-assessment without overstating automated measurement.
7. Review the session, retrieve the key idea and receive a reasoned next step.

## Experience principles

- Hybrid workspace: clear learning dashboard and focused practice studio.
- Mobile-first controls for use beside the instrument.
- Keyboard accessibility for non-audio interactions.
- Minimal distractions during timed exercises.
- Approved hybrid visual direction: clear interactive structure, warm acoustic-guitar character and a calm, low-distraction practice experience. See [Design Direction](DESIGN_DIRECTION.md) and [Implementation Guidelines](IMPLEMENTATION_GUIDELINES.md).
- Encouraging feedback without punitive streaks.
- Clear distinction between lesson completion and demonstrated skill.
- No assumption that the learner has completed a lesson in another app, chat or course.

## Learning system

GuitarLab contains a complete 52-week Year 1 route, a 52-week Year 2 continuation and four optional 12-week Year 3+ specialisations. All 156 weekly lessons have authored lesson content. Each lesson is self-contained and does not depend on a paid external course. See [Curriculum](CURRICULUM.md), the [content model](CURRICULUM_CONTENT_MODEL.md) and the machine-readable files under `content/curriculum/`.

The learning sequence is built around hearing/observing, understanding, isolating a small skill, practising slowly, observing and adjusting, mixing with a known skill, applying to music and retrieving the idea. Weekly cards are ordering guides rather than seven-day deadlines.

## Skill model

Skill states:
- `not_started`
- `learning`
- `practising`
- `stable`
- `review_due`

Viewing a lesson or marking its content complete is not proof of mastery. Store append-only skill evidence and assessment history so current mastery can be recalculated without erasing prior attempts.

Skill domains:
- Instrument foundations: tuning, posture, fretting and clean tone.
- Picking/coordination: alternate picking, string crossing, legato, bends and slides.
- Rhythm/groove: pulse, subdivisions, strumming, muting and dynamics.
- Fretboard/notation: string map, natural notes, octaves, TAB and optional staff notation.
- Chords/harmony: open, power, barre, shell, triad, seventh chords and voice leading.
- Scales/lead: major scale, pentatonic, arpeggios, improvisation and phrasing.
- Fingerstyle/arranging: thumb independence, patterns, song form and chord melody.
- Ear/musicianship: pitch, intervals, rhythm and melody transcription.
- Repertoire/performance: song learning, recording and recovery.

## Practice design

Practice duration is a learner-specific preference. Offer 10-, 20- and 40-minute presets plus a custom duration, but do not enforce one global duration as the right plan for every learner. The selected duration is stored in the active learner profile. A short session selects fewer, higher-value tasks rather than rushing through every category. The current project owner's intended profile uses 20 minutes per day; this must not become a global default for other learners.

A full session may include preparation, a warm-up, focused new learning, spaced review, musical application and reflection. The learner may practise on any sustainable schedule and split a weekly lesson across sessions. The suggested tempo is a reference only; accuracy, tone and comfort take priority.

Each practice item specifies a target, instructions, duration/repetitions, success criterion, evidence type and next-step guidance. Record actual practice; a timer alone does not prove skill.

## Fresh learner profile and privacy

A new profile starts with no completed lessons, previous lesson number, imported mastery status, practice notes, recordings or assessment history from prior chats or external learning systems. The default route begins at Year 1 Week 1. An optional placement assessment may recommend a starting point, but it must be performed inside GuitarLab and must not silently mark prior lessons complete.

The public repository stores generic curriculum content only. Personal practice records, recordings, preferences, confidence ratings and assessment attempts belong in private local application storage. See [Fresh Learner Profile Policy](LEARNING_PROGRESS_MIGRATION.md).

## Resource handling

External resources are optional demonstrations or alternate explanations, never required prerequisites for understanding a lesson. GuitarLab may store provider, title, URL, role and access notes. Do not reproduce paid course videos, protected tabs, copyrighted books or recordings without permission. Use original examples and properly licensed or public-domain repertoire wherever possible.

## Audio and privacy

- Microphone features are opt-in.
- Explain why permission is requested.
- Process tuner and pitch data locally by default.
- Do not upload audio automatically.
- Begin with single-note pitch detection and reference tones.
- Do not claim reliable automatic chord recognition without validation.

## First release

The initial private release is defined in [First-Release Scope](RELEASE_SCOPE.md). It prioritises the fresh-start Year 1 curriculum, dashboard, authored lesson viewer, practice logging, local-first/offline support and foundational music tools. Cloud sync is enabled only after authentication and authorisation are in place.

## Success measures

- A new learner can begin without external prerequisites or imported history.
- The learner can quickly identify the next useful practice action.
- Lesson objectives, exercises and checkpoints are understandable and usable.
- Practice history is accurate and recoverable.
- Skills have meaningful evidence and review intervals.
- Core learning and practice flows remain usable offline.
- The learner can export and restore data created within GuitarLab.

## Pre-implementation refinements

The pre-implementation decisions and priority boundaries are recorded in [Pre-Implementation Readiness](PRE_IMPLEMENTATION_READINESS.md).

- **Flexible practice length:** 10-, 20- and 40-minute plans plus custom duration; 40 minutes remains the suggested full session. A short session selects the most useful task instead of rushing through every category.
- **Explainable next action:** deterministic recommendations based on current lesson, due skills, prerequisites, recent practice evidence, learner difficulty/confidence and available time. Display why an activity is recommended and let the learner override it.
- **Accuracy before speed:** tempo ladders record clean repetitions and total repetitions separately. Tempo increases only when the exercise-specific quality target is met; a timer or speed alone never grants mastery.
- **Instrument setup:** local preferences include handedness, instrument type, string count, tuning, note-label mode and practice goal. The initial six-string standard-tuning path is the default.
- **Progressive fretboard learning:** start with note identification; later add interval/scale-degree labels, scale positions, triads and CAGED views.
- **Quick session review:** actual duration, exercises, tempo/repetitions where applicable, difficulty, short reflection and one next target. Keep saving lightweight.
- **External companions:** optional backing-track and learning tools never receive learner profile, journal or recording data and never become runtime dependencies.

Do not add AI tutoring, social features, automatic polyphonic chord grading or a full DAW to the first useful release.


## Learner-specific personalisation

The curriculum is shared, stable and authored; the teaching plan and presentation are specific to the active learner profile. Onboarding should capture editable preferences for instrument, handedness, tuning, starting point, goals, preferred lesson presentation, practice duration/schedule, practice emphasis, pace/feedback and accessibility. Allow optional fields to be skipped and updated later.

Supported lesson presentation preferences include balanced, visual-first, demonstration/audio-first, text-first, interactive/drill-first and song-first. A lesson may combine formats; text and visual fallbacks must keep every lesson self-contained when media is unavailable.

Compose a personalised practice plan from the learner's profile, prerequisites, current lesson, skill evidence, due reviews, available time, stated difficulty/confidence and goals. Explain each recommendation and let the learner edit, postpone or dismiss it. Do not create a separate conflicting syllabus for each learner, change stable curriculum IDs, or infer mastery from a timer or lesson viewing.

The current project owner's intended private profile is acoustic guitar, absolute beginner, 20 minutes per day and an all-round musician goal. Apply those values only to that learner's private profile when configured in the app. Do not hard-code them into shared curriculum files, global defaults, generic fixtures or another learner's profile. Handedness is not yet known and must remain unset until the learner selects it.
