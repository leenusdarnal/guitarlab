# GuitarLab Learning Curriculum

## Source and approach

The Year 1 and Year 2 structures in this repository are distilled from the learner's existing *Complete Guitar Course – Curated Learning Path Edition*. The existing sequence is retained rather than replaced. Its weekly cards, Year 2 continuation, optional notation track and four Year 3+ routes remain the curriculum source of truth.

The route is deliberately progress-based: a week may take more or less than seven days. Advance when the checkpoint is reliable, not because the calendar says so.

## Five-layer learning system

1. **Main course:** follow the primary Udemy Complete Guitar Lessons System course in its intended sequence.
2. **Numbered micro-lesson:** work on the current small personal target; it may span several sessions and is not the same as a curriculum week.
3. **Weekly card:** use the weekly objective, theory connection, practice piece and checkpoint as the broader structure.
4. **One targeted helper:** use one relevant diagram, tutorial or reference only when needed.
5. **Play, record, review:** apply the skill musically, then reflect on tone, timing, relaxed movement and understanding.

This separation resolves an important curriculum detail: numbered micro-lessons and the 52-week course cards are different layers. The app must not force their lesson numbers to match.

## Year 1: 52-week core path

Machine-readable records: [`content/curriculum/year-1.json`](../content/curriculum/year-1.json).

| Phase | Weeks | Theme |
|---|---:|---|
| Beginner base | 1-12 | Setup, tuning, clean single notes, TAB and chord diagrams, first chords, rhythm, natural notes and Quarter 1 review |
| Skills in context | 13-24 | Optional notation, picking, fingerstyle, major scale, shell chords, blues, expression, power/barre foundations and half-year assessment |
| Early intermediate | 25-36 | Roots and octaves, triads, keys, capo/transposition, chord colour, sixteenth rhythm, legato and Quarter 2 review |
| Intermediate bridge | 37-52 | Ear learning, songwriting, blues/rock/jazz vocabulary, sight-reading, position shifts, chord melody, composition and year-end performance |

The Year 1 file preserves all 52 weekly titles, focus areas, observable checkpoints, practice pieces and starting BPM markers. The BPM is a practice reference, not a required pass mark. Start 10-15 BPM below it when clean accuracy is not yet secure.

## Year 2: structured intermediate development

Machine-readable records: [`content/curriculum/year-2.json`](../content/curriculum/year-2.json).

The Year 2 route continues through nine strands: fretboard and triads (Weeks 1-6), rhythm guitar (7-11), scales and melody (12-16), blues (17-22), fingerstyle/acoustic arranging (23-28), repertoire and ear learning (29-34), harmony (35-39), jazz (40-45), and independent musicianship/performance (46-52).

It is a continuation, not a requirement for the first private MVP to unlock. The learner can choose a slower pace and repeat any checkpoint.

## Year 3+ specialisation paths

The source course preserves four optional deepening routes:
- Rock and Blues
- Fingerstyle and Acoustic
- Jazz and Harmony
- All-Round Musician

These pathways should become selectable extensions after the Year 2 capstone, not mandatory content in the initial release.

## Weekly rhythm and practice routine

The curated route recommends a flexible five-day cycle:
- Day 1: learn the new idea and practise slowly.
- Day 2: build accuracy and clean tone.
- Day 3: explain the theory in plain language and recall without looking.
- Day 4: apply it to a song, progression or melody.
- Day 5: record a milestone, assess and set one next target.

Suggested daily session: 40 minutes, plus an optional five-minute recording/review:
- 3 minutes: tune and prepare.
- 7 minutes: warm-up and technique.
- 10 minutes: main lesson segment.
- 10 minutes: theory or chord practice.
- 10 minutes: song, progression or melody.
- Optional 5 minutes: record and review.

The learner may shorten or lengthen this schedule. The app should save the actual duration and work completed, not assume that a timer proves skill.

## Four checks before advancing

A checkpoint is ready when the learner can demonstrate:
1. **Sound:** notes/chords ring clearly and unwanted strings are controlled.
2. **Time:** the pulse continues through changes and rests.
3. **Understanding:** the learner can explain the idea in plain language.
4. **Music:** the skill is applied to a progression, melody or song section.

Do not require staff notation in the core route where TAB is specified as the main path; notation is an optional parallel track.

## Current learner continuity

The app will need two independent progress dimensions:
- the weekly curriculum position and weekly checkpoint status;
- the learner's numbered micro-lesson sequence and its individual status.

The learner's existing baseline is retained for private profile initialisation and must never be committed to this public repository. When the local-first profile is created, seed the known completed/in-progress numbered lessons and keep the current E-minor checkpoint pending; the next planned micro-lesson is A minor, followed by Em-Am transitions. This baseline must not be used to overwrite or falsely complete a weekly card.

## Resource roles

| Resource | Role in the learning system |
|---|---|
| Udemy Complete Guitar Lessons System | Primary teaching sequence; do not jump between competing courses |
| GuitarTuna | Tuning and metronome helper |
| JustinGuitar / National Guitar Academy | Targeted alternative explanations and reference only |
| Songsterr | Interactive TAB when learning full songs |
| Complete Guitar Book / Learn & Master Guitar workbook | Supporting reference, not a second competing syllabus |
| Backing tracks | Musical application and later improvisation |

Keep only the currently relevant resources visible. Paid-course videos and protected tabs are linked, not copied into GuitarLab.
