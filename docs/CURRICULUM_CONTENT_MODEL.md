# GuitarLab Curriculum Content Model

## Content hierarchy

Curriculum content is versioned data, independent of the user interface and personal learner state.

```text
Learning route
  └── Stage / specialisation
       └── Week card (stable curriculum ID)
            └── Authored lesson (stable lesson ID)
                 ├── Objectives and prerequisites
                 ├── Explanation and worked example
                 ├── Demonstration / reference guidance
                 ├── Ordered lesson blocks
                 ├── Focused exercises
                 ├── Musical application
                 ├── Success criteria
                 ├── Common mistakes and corrections
                 ├── Accessible alternative
                 └── Retrieval and review guidance
```

## Source files and coverage

| File | Records | Role |
|---|---:|---|
| `content/curriculum/year-1.json` | 52 | Year 1 weekly outline and stable week IDs |
| `content/curriculum/year-1-lessons.json` | 52 | Fully authored Year 1 lessons |
| `content/curriculum/year-2.json` | 52 | Year 2 weekly outline and stable week IDs |
| `content/curriculum/year-2-lessons.json` | 52 | Fully authored Year 2 lessons |
| `content/curriculum/year-3-specialisations.json` | 4 routes × 12 weeks | Optional specialist route outline |
| `content/curriculum/year-3-specialisation-lessons.json` | 48 | Fully authored specialist lessons |
| `content/curriculum/learning-framework.json` | 1 framework | Spiral teaching, practice, review and assessment rules |

Each authored lesson has its own stable ID and a `curriculumWeekId` that points to its outline record. The week ID is the source of truth for ordering and cross-file matching. Do not reuse an ID for a different skill or lesson.

## Lesson record contract

The lesson JSON files use `schemaVersion: 1` and their own semantic content version. The contract is published in [`lesson.schema.json`](../content/curriculum/lesson.schema.json). Each lesson record contains:

| Field | Meaning |
|---|---|
| `id` | Stable authored lesson ID |
| `curriculumId` | Parent curriculum |
| `curriculumWeekId` | Matching stable weekly outline ID |
| `week` / `route` | Position within the year or optional specialisation |
| `checkpoint` | The observable finish line inherited from the matching weekly outline |
| `workedExamples` | Concrete chord shapes, note maps, scale formulas, rhythm counts or musical prompts where relevant |
| `skillIds` | Stable skill taxonomy links trained by this lesson |
| `title` / `focus` | Learner-facing title and learning focus |
| `estimatedMinutes` | Planning estimate, never a completion rule |
| `startingTempoBpm` | Optional starting reference; not a pass mark |
| `learningObjectives` | Observable outcomes |
| `prerequisites` | Explicit prerequisite IDs; empty means no hard gate |
| `priorTopicsToRefresh` | Optional retrieval prompts that do not imply previous learner completion |
| `explanation` | Key idea, plain-language description and worked example |
| `demonstrationOrReference` | Guided demonstration and non-exclusive reference suggestion |
| `lessonBlocks` | Ordered listen, explain, demonstrate, apply and retrieve blocks |
| `exercises` | Typed instructions, time, success criterion and evidence type |
| `musicalApplication` | Practice-piece prompt, steps and source/licensing policy |
| `successCriteria` | Accuracy, sound/time, comfort and understanding/transfer |
| `commonMistakesAndCorrections` | Paired mistake and corrective action |
| `accessibleAlternative` | Lower-complexity path that preserves the learning intention |
| `retrievalPrompt` | Questions for recall without looking |
| `nextReviewSuggestion` | Adaptive review guidance and transparent heuristic intervals |
| `practiceOptions` | Flexible 10-, 20- and 40-minute task selection |
| `instructorNotes` | Pacing, tempo and mastery boundaries |

### Exercise types

Current authoring uses recall, focused practice, musical application and reflection. The app may add types such as fretboard identification, chord formation, chord transition, rhythm, picking, ear training, theory quiz, song section and recording review, provided that the schema version and tests are updated deliberately.

An exercise should always tell the learner what to do and how to recognise a successful attempt. State whether evidence is measured, observed/self-checked, self-reported or reviewed from a recording. Never claim that audio or timing was objectively assessed unless the relevant implemented tool has been validated.

## Authoring principles

1. **Self-contained teaching:** A learner can understand and practise the lesson without a required external paid course.
2. **Hear, understand, do, apply, retrieve:** Begin with listening or observation, isolate the task, practise slowly, transfer it to music and recall the idea without looking.
3. **Specific instructions:** Avoid vague directions such as "practise more". Identify the string, note/chord/form, movement or musical context wherever relevant.
4. **Accuracy before speed:** Tempo is increased only when the quality target is met. If timing, tone or comfort drops, reduce tempo.
5. **Focused then mixed practice:** Isolate unfamiliar movements, then combine them with known skills when stable.
6. **Musical transfer:** Every lesson includes an application, not just a mechanical drill.
7. **Accessible alternatives:** Reduce range, tempo, complexity or duration without presenting the alternative as failure.
8. **Non-punitive review:** Use errors, hesitation, confidence and elapsed time as signals; a review date is not a deadline.
9. **No false mastery:** Viewing, elapsed time, streaks or a single attempt do not establish stable skill.
10. **Copyright-aware references:** Link to third-party resources; do not reproduce protected course material, tabs, books or recordings.

## Skill taxonomy

Use stable IDs grouped into these domains:

| Domain | Example skill IDs | Evidence |
|---|---|---|
| Instrument foundations | `instrument.tuning`, `instrument.posture`, `instrument.fretting`, `instrument.clean-tone` | Correct tuning; relaxed setup; clean separate notes |
| Picking and coordination | `technique.alternate-picking`, `technique.string-crossing`, `technique.legato`, `technique.bends`, `technique.slides` | Consistent strokes, even tone, string-crossing control, target-pitch accuracy |
| Rhythm and groove | `rhythm.pulse`, `rhythm.subdivision`, `rhythm.strumming`, `rhythm.muting`, `rhythm.dynamics` | Pulse continuity, subdivision accuracy, clean starts/stops and rests |
| Fretboard and notation | `fretboard.string-map`, `fretboard.natural-notes`, `fretboard.octaves`, `notation.tab`, `notation.staff` | Correct note/string/fret identification and phrase reading |
| Chords and harmony | `harmony.open-chords`, `harmony.transitions`, `harmony.power-chords`, `harmony.barre-chords`, `harmony.triads`, `harmony.seventh-chords`, `harmony.voice-leading` | Clear chord tones, accurate changes, correct construction and progression |
| Scales and lead | `lead.major-scale`, `lead.pentatonic`, `lead.arpeggios`, `lead.improvisation`, `lead.phrasing` | Accurate maps, chord-tone targeting, intentional motifs and resolution |
| Fingerstyle and arranging | `fingerstyle.thumb-independence`, `fingerstyle.patterns`, `arrangement.song-form`, `arrangement.chord-melody` | Stable bass, balanced melody, coherent form and voice movement |
| Ear and musicianship | `ear.pitch`, `ear.intervals`, `ear.rhythm`, `ear.melody-transcription` | Identification, singing, reproduction and transcription |
| Repertoire and performance | `repertoire.song-learning`, `performance.recording`, `performance.recovery` | Complete sections, continuity, prepared endings and recovery |

Skill IDs are independent of week numbers. One skill can be trained and reviewed in many lessons.

## Learner progress and privacy

A new learner profile begins with no imported completions, mastery ratings, practice notes or assessment history. The default learning start is Year 1 Week 1. A fresh placement assessment may recommend a different starting point, but must create new evidence and must never import or infer progress from prior chats, private context or an external course.

Public curriculum JSON contains generic lesson content only. Individual practice history, recordings, preferences, confidence and assessment attempts belong in private local storage. Do not commit personal learner data or private seed payloads.

Lesson completion and skill mastery remain separate. The UI may show a completed content card while the linked skill remains in learning or practising state.

## Evidence and assessment

Evidence types:

- `measured`: a validated tool measured the specific property.
- `observed_or_self_checked`: learner or instructor observed the performance.
- `self_reported`: learner confidence or perceived difficulty.
- `recording_reviewed`: learner or instructor reviewed an audio/video recording.

Assessment attempts are append-only. Store skill ID, assessment type, timestamp, curriculum version, result, evidence source and reflection. Recalculating current mastery must not delete prior attempts.

Initial mastery guidance: seek more than one successful demonstration separated in time and at least one application beyond an isolated drill. Keep the rule visible and allow the learner to review or challenge a result.

## Review scheduling

Use adaptive spaced retrieval. Suggested starter prompts are the next practice session, about one week later and about one month later, but these are configurable product heuristics, not scientifically optimal fixed intervals. Review sooner after errors, hesitation or low confidence; extend the interval after confident retrieval on separate occasions. Bring stable skills back in new musical contexts.

## Validation requirements

Run the dependency-free integrity check from the repository root with `node scripts/validate-curriculum.mjs`. The curriculum validator should check:

- JSON parsing and supported schema/content versions.
- Expected lesson counts: 52 Year 1, 52 Year 2 and 48 Year 3 specialist lessons.
- Unique lesson IDs, exercise IDs and stable week IDs.
- Every authored lesson maps to exactly one outline week or one declared specialisation week.
- Ordered week numbers and valid route/phase references.
- Required fields, non-empty instructions and success criteria.
- Allowed evidence and exercise types.
- Sensible non-negative durations and positive BPM references when present.
- No user-specific learner progress, recordings, tokens or private profile records in curriculum files.

Validation is a content integrity check, not a substitute for a guitarist/instructor review of musical accuracy. Updates to content do not silently change skill ID meaning or curriculum week IDs. Year 3 specialist week IDs are stored in `weekRecords` while the existing human-readable `weeks` title arrays remain available for compatibility.
