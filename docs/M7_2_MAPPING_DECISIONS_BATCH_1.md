# M7.2 — Curriculum Mapping Decisions, Batch 1

**Release:** `curriculum-v1.0.4`  
**Scope:** First Year 1 / Year 2 authoring pilot plus high-confidence mapping corrections  
**Baseline:** 152 lessons, 397 pre-batch associations and 34 stable skill IDs on the current Year 3 baseline  
**Current result:** 387 associations after this batch; all 34 existing skill IDs remain referenced  
**Decision rule:** Compare the skill definition with the actual task, checkpoint and evidence. A phrase match or broad topic association is not sufficient.

## 1. Mapping changes applied

| Lesson | Previous interpretation | Decision in this batch | Evidence |
|---|---|---|---|
| Year 1 W18 — Shell chords: roots and guide tones | Open-chord association was too broad | Use seventh chords and voice leading | Cmaj7, Dm7 and G7 shell voicings plus a ii–V–I guide-tone movement task |
| Year 1 W20 — Play with expression | Triads and voice leading were unsupported | Use melodic phrasing and pitch bends | The lesson asks for slides, bends, dynamics and expressive phrasing |
| Year 1 W21 — Movable power chords | Open-chord tag conflated chord families | Use power chords | The task forms and moves root–fifth power-chord shapes |
| Year 1 W22 — Approach barre chords safely | Open-chord tag conflated chord families | Use barre chords | The task practises partial-barre formation and pressure control |
| Year 1 W23 — Minor pentatonic box 1 | Major scale was a false-positive tag | Keep pentatonic only | The checkpoint and practice task are A minor pentatonic box 1 |
| Year 1 W26 — Triads on the top strings | Open-chord tag conflated compact triads with open-position chords | Keep triads only | The checkpoint is C/F/G triads on the top three strings |
| Year 1 W42 — The ii–V–I connection | Open-chord tag did not describe the target | Use voice leading | The task connects ii–V–I through the smallest individual-note movement |
| Year 2 W04 — Triad inversions | Open-chord tag conflated voicing families | Keep triads only | The learner plays root position and inversions on the top string set |
| Year 2 W29 — Song form and sections | Triads/voice-leading tags were unsupported | Use song form and arrangement | The assessed task maps verse, chorus, bridge and turnaround sections |
| Year 2 W30 — Learn by ear: rhythm | Pitch, melody and interval tags exceeded the task | Use ear rhythm only | The checkpoint is a four-bar rhythm transcription of attacks, accents and rests |
| Year 2 W35 — Music theory: intervals | Open-chord tag was incidental | Use interval recognition | Learners identify, sing and play unison, thirds, fifths and octaves |
| Year 2 W36 — Build seventh chords | Open-chord tag was incidental | Use seventh chords | The task constructs maj7, m7 and dominant seventh chords from formulas |
| Year 2 W41 — Jazz ii–V–I voice leading | Open-chord tag missed the actual construct | Use voice leading | The task resolves guide tones and tracks chord tones through the progression |

No new skill IDs were created. The curriculum keeps the original 34-skill catalogue.

## 2. Pilot mappings reviewed and retained

| Lesson | Mapping decision |
|---|---|
| Year 1 W4 — First chord shapes | Retain open chords |
| Year 1 W7 — Strum in time | Retain pulse, subdivision and strumming |
| Year 1 W11 — Your first music map | Retain string map and natural notes |
| Year 1 W15 — Pick control and clean tone | Retain alternate picking and string crossing |
| Year 1 W16 — Fingerstyle foundation | Retain thumb independence and fingerstyle patterns |
| Year 1 W17 — Build the major scale | Retain major scale and pentatonic; both now have explicit outcomes |
| Year 1 W37 — Learn a melody by ear | Retain pitch, rhythm, melody transcription and intervals; each is now made explicit |
| Year 2 W50 — Recording craft | Retain repertoire, recording and recovery; the one-take task includes all three |

## 3. Decisions deliberately not guessed

- **Year 1 W2 — Clear single notes:** its clean-fretting outcome is not represented precisely by the current catalogue. The two harmony mappings remain unresolved until the curriculum owner decides whether to remove them and whether a narrowly defined clean-fretting skill is warranted. `technique.clean-fretting` is a candidate only, not an approved new ID.
- **Year 1 W31 — Hammer-ons and pull-offs:** confirm whether alternate picking and string crossing are separately taught and assessed, or whether the lesson should focus on legato only.
- The broader open-chord review identified 33 original associations (2 direct, 5 contextual, 26 likely misaligned). This batch corrects the highest-confidence cases, but does not automatically remove all remaining contextual or likely-misaligned associations. The remaining lessons need full task/block-level review.

## 4. Integrity and learner-history safeguards

- Existing lesson IDs are preserved.
- The 34 skill IDs and their catalogue version remain unchanged.
- The new release is `curriculum-v1.0.4`, parented to `curriculum-v1.0.3`.
- Previous release snapshots and evidence remain intact; no progress, assessment or mastery record is rewritten or carried forward.
- Lesson completion, practice time and repetition counts do not independently establish mastery.
- Draft assessment profiles remain draft; no numeric thresholds or automated pass/fail decisions are enabled.

## 5. Remaining audit

The source-derived register still contains 127 lesson rows without a final mapping disposition. This batch is a controlled first decision set, not a claim that all 341 associations have been approved. Continue with complete lesson blocks, checkpoint evidence and a recorded keep/remove/clarify/escalate decision for each remaining row.
