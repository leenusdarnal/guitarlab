# GuitarLab Learning Curriculum

## Curriculum promise

GuitarLab provides a complete, self-contained learning route from first contact with the guitar through intermediate musicianship and optional advanced specialisation. The curriculum contains **152 authored lessons**: 52 in Year 1, 52 in Year 2 and 48 across four optional Year 3 routes. Every weekly curriculum card has a corresponding authored lesson with an explanation, guided demonstration, focused exercises, musical application, success criteria, corrections, accessible alternatives and retrieval prompts.

The route is progress-based rather than calendar-bound. A numbered week is an ordering aid: it may take one session or several. Advance when the checkpoint is reliable, not because seven days have passed.

## Curriculum map

| Stage | Scope | Main outcome |
|---|---|---|
| Year 1 | 52 weeks | Beginner foundations through an intermediate bridge: instrument setup, clean notes, reading TAB, chords, rhythm, fretboard, scales, blues, improvisation, ear learning, arranging and performance |
| Year 2 | 52 weeks | Intermediate musicianship: fretboard fluency, triads, rhythm guitar, scale positions, blues, fingerstyle, ear transcription, harmony, jazz and independent practice |
| Year 3+ | Four optional 12-week routes | Focused development in Rock & Blues, Fingerstyle & Acoustic, Jazz & Harmony or All-Round Musicianship |

## Year 1 — Beginner to intermediate bridge

Machine-readable weekly outline: [year-1.json](../content/curriculum/year-1.json).

Fully authored lesson content: [year-1-lessons.json](../content/curriculum/year-1-lessons.json).

| Phase | Weeks | Coverage |
|---|---:|---|
| Beginner base | 1–12 | Setup, tuning, clean notes, TAB and chord diagrams, open chords, pulse, rhythm and first review |
| Skills in context | 13–24 | Optional notation, picking, fingerstyle, major scale, shell chords, blues, expression, power/barre foundations and mid-year assessment |
| Early intermediate | 25–36 | Roots, octaves, triads, keys, capo/transposition, chord colour, sixteenth rhythm, legato, phrasing and review |
| Intermediate bridge | 37–52 | Ear learning, songwriting, blues/rock/jazz vocabulary, sight-reading, position shifts, chord melody, composition and year-end performance |

The outline preserves stable week IDs, focus areas, observable checkpoints, practice examples and starting BPM references. Each weekly record maps to one fully authored lesson by its stable week ID. BPM values are starting references, not pass marks.

## Year 2 — Intermediate musicianship

Machine-readable weekly outline: [year-2.json](../content/curriculum/year-2.json).

Fully authored lesson content: [year-2-lessons.json](../content/curriculum/year-2-lessons.json).

The route covers fretboard and triads (Weeks 1–6), rhythm guitar (7–11), scales and melody (12–16), blues (17–22), fingerstyle and acoustic arranging (23–28), repertoire and ear learning (29–34), harmony (35–39), jazz (40–45), and independent musicianship and performance (46–52).

Year 2 is a structured next stage, not an automatic calendar unlock. The learner may repeat or split lessons and should choose progression based on readiness and musical goals.

## Year 3+ — Optional specialisations

Outline: [year-3-specialisations.json](../content/curriculum/year-3-specialisations.json).

Fully authored content for all 48 specialist lessons: [year-3-specialisation-lessons.json](../content/curriculum/year-3-specialisation-lessons.json). Each specialist week has a stable ID in the route's `weekRecords` array.

Four optional 12-week routes are available:

- **Rock & Blues:** lead technique, pentatonic vocabulary, bends, legato, riffs, phrasing and performance.
- **Fingerstyle & Acoustic:** right-hand independence, arpeggios, alternating bass, chord melody, arrangement and dynamics.
- **Jazz & Harmony:** jazz grips, swing, guide tones, ii–V–I, extensions, bossa, jazz blues and reharmonisation.
- **All-Round Musician:** listening, intervals, reading, harmony, transposition, arranging, recording, songwriting and ensemble skills.

The routes are selectable extensions, not a mandatory fourth calendar year. Choose by interest and prerequisite skills.

## The authored lesson format

Each of the 156 lesson records includes:

1. Learner-facing objectives.
2. A plain-language explanation and worked example.
3. A guided demonstration with ordered steps and reference guidance.
4. Lesson blocks for listening, concept learning, demonstration, musical application and retrieval.
5. Focused practice, musical application and reflection exercises.
6. Observable success criteria spanning accuracy, sound/time, control/comfort and understanding/transfer.
7. Common mistakes paired with specific corrections.
8. An accessible alternative that reduces complexity without removing the musical goal.
9. Retrieval questions and an adaptive review suggestion.
10. Flexible 10-, 20- and 40-minute practice options.

The schema is published in [lesson.schema.json](../content/curriculum/lesson.schema.json); run `node scripts/validate-curriculum.mjs` to check content integrity. The skill taxonomy and data model are described in [Curriculum Content Model](CURRICULUM_CONTENT_MODEL.md). The evidence review and instructional rationale are in [Curriculum Research and Revision](CURRICULUM_RESEARCH.md).

## Spiral learning model

Six strands recur throughout the route:

- Sound, pulse and rhythm.
- Ear, singing and audiation.
- Technique, tone and comfort.
- Fretboard and applied theory.
- Repertoire and creativity.
- Reflection and retrieval.

Pulse, listening and relaxed technique begin in Week 1. Ear training is integrated throughout rather than postponed to a single unit. New movements are first practised in a focused block, then mixed with familiar skills as they become stable. The curriculum does not force random interleaving for every task.

## Flexible practice

The suggested full practice session is 40 minutes. Ten- and 20-minute sessions are also valid: they select fewer, higher-value tasks rather than rushing through the full plan. Custom durations are supported.

A sustainable session can include preparation, a focused drill, a review item, musical application and a brief reflection. The learner may practise on any schedule and split a weekly lesson across multiple sessions. A timer records duration; it does not establish skill mastery.

## Checkpoints and mastery

A checkpoint should be demonstrated, not merely viewed. Review the following dimensions:

- **Accuracy:** correct notes, strings, rhythm or chord changes.
- **Sound and time:** clear tone, intentional rests and a continuous pulse.
- **Control and comfort:** relaxed movement and suitable instrument setup.
- **Understanding:** explain the idea in plain language and retrieve it without looking.
- **Musical transfer:** use the skill in a phrase, progression or repertoire section.

A single successful attempt is useful evidence, not proof of permanent mastery. Repeat demonstrations over time and in more than one musical context. Speed is secondary to accuracy and comfort. Stop an exercise if pain, numbness or tingling occurs; GuitarLab is an educational tool, not a medical service.

## Starting fresh and learner privacy

A new GuitarLab learner profile starts with no imported lesson completions, skill ratings, practice history or personal baseline from earlier chats or external systems. The default route begins at Year 1 Week 1. An optional placement activity may recommend a starting point based on a fresh demonstration, but it must not silently import or infer previous progress.

The public repository stores generic curriculum content only. Personal practice records, recordings, confidence ratings and assessment history belong in private local application storage and must not be committed as source files, fixtures or screenshots.

## Resources and copyright

Lessons are self-contained and do not require a specific paid course or a particular third-party platform. External material may be used as an optional demonstration or alternative explanation. GuitarLab links to third-party resources; it does not copy paid course videos, protected tabs, books or recordings without permission. Original GuitarLab examples and properly licensed or public-domain material are preferred.

## Research-backed revision

The curriculum framework uses focused repetition for new movements, progressive mixed practice, adaptive retrieval, flexible session lengths and multi-dimensional assessment. Research findings and limitations are documented in [CURRICULUM_RESEARCH.md](CURRICULUM_RESEARCH.md). Review intervals and mastery thresholds remain transparent product heuristics rather than claims of scientifically optimal timing.
