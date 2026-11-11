# GuitarLab Product Specification

## Product promise

GuitarLab helps a learner know what to practise, practise it deliberately, understand why it works and see whether the skill is becoming reliable.

## Primary user journey

1. Open the dashboard and see today's suggested practice.
2. Resume the current micro-lesson or select a due curriculum review.
3. Read a concise explanation and see a demonstration/reference.
4. Perform a practical exercise with a clear success criterion.
5. Record the result, tempo or self-assessment.
6. Apply the skill to a musical phrase or song.
7. Review the session summary and receive a sensible next step.

## Experience principles

- Hybrid workspace: a clear learning dashboard and a focused practice studio.
- Mobile-first controls for use beside the instrument.
- Keyboard accessibility for non-audio interactions.
- Minimal distractions during timed exercises.
- Dark charcoal with restrained violet is the working visual direction, subject to final visual concept selection.
- Encouraging feedback without punitive streaks.
- Clear distinction between content completion and demonstrated skill.

## Learning system

GuitarLab preserves the existing curated 52-week Year 1 route, the Year 2 continuation and four optional Year 3+ styles. See [Curriculum](CURRICULUM.md) and the machine-readable files under `content/curriculum/`.

The master route has five layers: primary video course, numbered micro-lesson, weekly card, one targeted helper resource, and play/record/review. A numbered micro-lesson and a curriculum week are separate identifiers and separate progress records.

## Skill model

Skill states:
- `not_started`
- `learning`
- `practising`
- `stable`
- `review_due`

A lesson being viewed or marked complete is not proof of mastery. Store skill evidence and assessment history so current mastery can be revised without erasing prior attempts.

Skill domains and examples:
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

Default suggested session: 40 minutes, with an optional five-minute record/review block. The schedule is adjustable:
- Tune and prepare — 3 minutes.
- Warm-up and technique — 7 minutes.
- Main lesson segment — 10 minutes.
- Theory or chord practice — 10 minutes.
- Song, progression or melody — 10 minutes.
- Optional recording and review — 5 minutes.

The suggested weekly rhythm is five days: learn the idea; build accuracy; explain/recall the concept; apply it to music; record and review a milestone. Repeat or split a week when the checkpoint is not secure.

Each practice item should specify a target, duration/repetitions, success criterion and next-step guidance. Record actual practice; a timer alone does not prove skill.

## Progress and migration

The learner's previous progress must be preserved. Curriculum-week progress and numbered micro-lesson progress are separate. The initial private baseline is defined in [Learner Progress Migration](LEARNING_PROGRESS_MIGRATION.md) and is intentionally not committed to this public repository. The app will seed it into the private local profile when IndexedDB persistence is implemented.

## Resource handling

The learner's primary course is the Udemy Complete Guitar Lessons System. Use one targeted helper only when needed: GuitarTuna for tuning/metronome, JustinGuitar or National Guitar Academy for alternate explanations, Songsterr when learning full songs, and the supplied books/workbook as reference material.

Store resource metadata and links. Do not reproduce paid course videos, copyrighted tabs or recordings without permission.

## Audio and privacy

- Microphone features are opt-in.
- Explain why permission is requested.
- Process tuner and pitch data locally by default.
- Do not upload audio automatically.
- Begin with single-note pitch detection and reference tones.
- Do not claim reliable automatic chord recognition without validation.

## First release

The initial private release is defined in [First-Release Scope](RELEASE_SCOPE.md). It prioritises the full Year 1 route, dashboard, lesson continuity, practice logging, local-first/offline support and foundational music tools. Cloud sync is enabled only after authentication and authorisation are in place.

## Success measures

- Learner can quickly identify the next useful practice action.
- Existing progress resumes without reset or duplicated attempts.
- Practice history is accurate and recoverable.
- Skills have meaningful evidence and review intervals.
- Core learning and practice flows remain usable offline.
- The learner can export and restore personal learning data.
