# GuitarLab Curriculum Content Model

## Versioning and hierarchy

The curriculum is content, not UI. Store it as versioned data and render it through reusable lesson components.

```text
Learning path
  └── Phase
       └── Week
            └── Lesson
                 ├── Concept and explanation
                 ├── Demonstration / reference
                 ├── Exercise(s)
                 ├── Practice piece
                 ├── Success checkpoint
                 └── Reflection / next action
```

The initial machine-readable source lives in `content/curriculum/year-1.json` and `content/curriculum/year-2.json`. Each file has a stable `id`, semantic `version`, phase definitions and ordered week records. A week can be split into multiple learner sessions; the calendar week is a guide, not a forced completion deadline.

## Curriculum record fields

| Field | Meaning |
|---|---|
| `id` | Stable identifier, e.g. `y1-w04`; never reuse for a different skill |
| `week` | Ordered week number within the path |
| `phaseId` | Phase reference |
| `title` | Learner-facing title |
| `focus` | Main learning theme |
| `checkpoint` | Observable finish line |
| `practiceExercise` | Suggested musical application |
| `startingTempoBpm` | Suggested starting benchmark; lower it when accuracy slips |
| `objectives` | Future structured list of teachable outcomes |
| `skillIds` | Links to the skills this week trains |
| `resources` | Links to a course segment, reference or permitted example |
| `optionalTracks` | Enrichment such as staff notation; never block the core route |
| `reviewPolicy` | Review interval or retrieval practice guidance |

The current JSON files provide the first eight fields. M4 may extend the schema with the remaining optional fields using a versioned migration; do not silently change field meaning.

## Skill taxonomy

Use stable skill IDs grouped into these domains:

| Domain | Example skill IDs | Evidence |
|---|---|---|
| Instrument foundations | `instrument.tuning`, `instrument.posture`, `instrument.fretting`, `instrument.clean-tone` | Correct tuning; relaxed setup; clean, separate notes |
| Picking and coordination | `technique.alternate-picking`, `technique.string-crossing`, `technique.legato`, `technique.bends`, `technique.slides` | Correct strokes, even tone, string-crossing control, target-pitch accuracy |
| Rhythm and groove | `rhythm.pulse`, `rhythm.subdivision`, `rhythm.strumming`, `rhythm.muting`, `rhythm.dynamics` | Pulse continuity, subdivision accuracy, clean starts/stops and rests |
| Fretboard and notation | `fretboard.string-map`, `fretboard.natural-notes`, `fretboard.octaves`, `notation.tab`, `notation.staff` | Correct note/string/fret identification and phrase reading |
| Chords and harmony | `harmony.open-chords`, `harmony.transitions`, `harmony.power-chords`, `harmony.barre-chords`, `harmony.triads`, `harmony.seventh-chords`, `harmony.voice-leading` | Clear chord tones, accurate changes, correct chord construction and progression |
| Scales and lead | `lead.major-scale`, `lead.pentatonic`, `lead.arpeggios`, `lead.improvisation`, `lead.phrasing` | Accurate scale maps, chord-tone targeting, intentional motifs and resolution |
| Fingerstyle and arranging | `fingerstyle.thumb-independence`, `fingerstyle.patterns`, `arrangement.song-form`, `arrangement.chord-melody` | Stable bass, balanced melody, coherent form and voice movement |
| Ear and musicianship | `ear.pitch`, `ear.intervals`, `ear.rhythm`, `ear.melody-transcription` | Correct identification, singing, reproduction and transcription |
| Repertoire and performance | `repertoire.song-learning`, `performance.recording`, `performance.recovery` | Complete sections, uninterrupted form, prepared endings and recovery |

Skill IDs are independent of week numbers. The same skill can be trained in many weeks and reviewed across multiple paths.

## Learner state

A skill has one current state:
- `not_started`
- `learning`
- `practising`
- `stable`
- `review_due`

Lesson completion and skill mastery are separate. Viewing content does not automatically increase mastery.

## Evidence types

- Chord: individual-string clarity checks and repeated clean formations.
- Chord transition: clean changes per timed interval, with accuracy recorded separately from speed.
- Picking: correct-string and down/up consistency.
- Rhythm: pulse continuity and subdivision task results.
- Fretboard: note-identification accuracy and response time.
- Theory: retrieval and application questions.
- Ear: interval, rhythm or melody responses.
- Song: section completion, continuity, tempo and recovery.
- Self-report: confidence/difficulty notes, clearly labelled as self-reported.

Do not label audio as objectively assessed unless an implemented, tested detector produced the measurement. Initial mastery can combine learner self-assessment, exercise outcomes and optional recordings reviewed by the learner.

## Assessment history and review

Assessment attempts are append-only evidence records. Recalculating current mastery must not delete prior attempts. Store:
- skill ID and assessment type
- timestamp and curriculum version
- result / accuracy / achieved tempo where measurable
- evidence source (self-report, quiz, timer, local audio tool, external review)
- learner reflection and next practice target

Review scheduling should use failure/uncertainty and recent success rather than a punitive streak. A suggested review is not a deadline.

## Content and licensing

Course references store provider, title, URL, role and access notes. GuitarLab links to the learner's course and external references; it does not mirror paid videos or reproduce protected tabs, books or recordings without permission.


## Expanded lesson authoring contract

The present Year 1 and Year 2 records are valid weekly outlines. Do not pretend they are fully authored lesson scripts. Extend them gradually as individual lessons are prepared, using a backwards-compatible and explicitly versioned content schema.

The next schema revision should distinguish:
- `schemaVersion`: structural schema version used by validators and migrations;
- `version`: semantic release version of the curriculum content itself.

Recommended optional fields for a progressively authored week:

| Field | Purpose |
|---|---|
| `learningObjectives` | Observable outcomes written from the learner's point of view |
| `prerequisites` | Stable skill IDs or lesson IDs required before this activity |
| `lessonBlocks` | Ordered teaching blocks such as explanation, diagram, demonstration link or recall prompt |
| `exercises` | Typed practice instructions with targets, constraints and success criteria |
| `resources` | Metadata and external links; no copied paid videos or protected tabs |
| `reviewPolicy` | Suggested retrieval/review guidance based on evidence |
| `estimatedMinutes` | Planning estimate, not a completion requirement |
| `optionalTracks` | Enrichment that never blocks the core route |

An exercise should contain a stable ID, title, type, instructions, linked skill IDs, target duration or repetitions, optional starting BPM, observable success criterion, evidence type and accessible alternative where appropriate. Suggested types include `recall`, `fretboard-identification`, `chord-formation`, `chord-transition`, `rhythm`, `picking`, `ear-training`, `theory-quiz`, `song-section` and `reflection`.

A practice target must describe what the learner does and how they can tell whether it was successful. Avoid unsupported objective claims such as automatic tone or timing scores when no validated measurement exists. Identify learner self-assessment as self-reported evidence.

### Content validation rules

The M1 validation command should check JSON parsing, schema version, stable unique IDs, ordered week numbers, valid phase/skill references, allowed exercise types, sensible tempo values, required fields and safe resource URLs. It should not require all optional authoring fields to be present in the existing outline files. Each schema migration must have tests and must preserve existing curriculum IDs and progress references.

### Practice recommendation provenance

When the app recommends a lesson, skill or exercise, preserve the recommendation reason and the evidence used to produce it. The recommendation engine is deterministic in the first release; no external AI call or cloud dependency is required.