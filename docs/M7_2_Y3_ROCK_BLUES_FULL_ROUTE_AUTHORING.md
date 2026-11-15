# M7.2 — Year 3 Rock & Blues Full-Route Authoring

**Status:** Authoring implemented; schema, migration and CI validation pending  
**Curriculum dataset:** `year-3-specialisation-lessons.json` version `1.0.2`  
**Release:** `curriculum-v1.0.2`, parent `curriculum-v1.0.1`  
**Scope:** All 12 Rock & Blues lessons (Weeks 1–12)

## 1. Outcome

The first four lessons were improved in the Week 1–4 pilot. This follow-on completes Weeks 5–12 so the entire Rock & Blues route has a concrete musical task, lesson-specific objectives, a worked example, guided demonstration, focused exercises, musical application, task-specific criteria, common-error corrections, accessible alternatives and retrieval/review prompts.

The route now moves from a blues accompaniment foundation to increasingly independent melodic, harmonic and creative work:

| Week | Lesson | Musical task and evidence |
|---:|---|---|
| 1 | Technique reset | Comfortable setup, standard tuning and independent string identification |
| 2 | Pentatonic across neck | Connect A minor pentatonic boxes 1 and 2 and resolve a phrase to A |
| 3 | Bends to pitch | Bend B-string fret 8 (G) towards the A reference at fret 10 |
| 4 | Legato control | Combine controlled alternate picking, string crossing and a B-string legato cell |
| 5 | Blues shuffle arrangement | Play a 12-bar A shuffle with quick-change D7 in bar 2 and E7 turnaround |
| 6 | Quarter review: lead tone | Record and review a complete 12-bar A blues lead chorus |
| 7 | Chord-tone soloing | Target C# over A7, F# over D7 and G# over E7, with flat-seventh alternatives |
| 8 | Riff construction | Compose a repeatable one- or two-bar A minor pentatonic riff with one controlled variation |
| 9 | Modal colour | Compare A Mixolydian with A major over A7 and resolve G natural to an A7 chord tone |
| 10 | Phrasing and silence | Build call-and-response phrases with counted rests and motivic variation |
| 11 | Performance arrangement | Arrange an intro, 12-bar head, 12-bar solo chorus and intentional ending tag |
| 12 | Path capstone | Present an original A blues performance with form, riff, chord-aware lead, expressive technique and reflection |

## 2. Musical accuracy and teaching sequence

### Week 5 — Shuffle form

The lesson uses a clearly labelled quick-change 12-bar form in A:

`A7 | D7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7`

It identifies the bar-2 D7 as the quick-change IV and the bar-12 E7 as the turnaround into the next A7 chorus. The root-fifth starter pairs are stated with standard-tuning positions: A–E (low E fret 5 / A fret 7), D–A (A fret 5 / D fret 7) and E–B (A fret 7 / D fret 9). Shuffle feel is explained as a long-short pair drawn from triplet subdivision while the quarter-note pulse remains steady.

### Week 6 — Review through recording

The learner records one complete chorus and evaluates distinct dimensions separately: form and pulse, pentatonic connection, bend target, legato control, muting/articulation and phrase shape. The sound setup remains constant between takes so the learner can hear changes in playing rather than attributing every difference to equipment. A recording is treated as a reflection aid, not proof of retained mastery.

### Week 7 — Chord-tone targeting

The lesson explicitly spells the dominant seventh chords:

- A7: A–C#–E–G
- D7: D–F#–A–C
- E7: E–G#–B–D

The first target-note pass uses the major thirds C#, F# and G#. A second pass can use the flat sevenths G, C and D. A minor pentatonic notes are connecting material; C natural is identified as a blues inflection that should resolve deliberately (for example to C# over A7), not be treated as interchangeable with the major third.

### Week 9 — Modal colour

A Mixolydian is stated as A–B–C#–D–E–F#–G (1–2–3–4–5–6–b7). The learner compares G natural with G# from A major over an A7 vamp and resolves G to A, C# or E. The lesson explicitly warns against treating A Mixolydian as a blanket scale over D7 and E7; learners re-target chord tones or intentionally change modal centre.

### Weeks 8 and 10–12 — Creation, phrasing and performance

The riff lesson prioritises motif identity, repetition, rests, muting and one-feature variation. The phrasing lesson makes silence countable and uses question/answer relationships rather than generic scale runs. The arrangement lesson maps sections and rehearses transitions and recovery points. The capstone offers a full two-chorus arrangement and a shorter one-chorus route so the evidence remains musically complete without imposing a speed or equipment threshold.

## 3. Existing skill catalogue and mapping review

The catalogue remains at 34 existing skill identifiers, version 1.0.0. No new skill identifiers or assessment profiles were created. Weeks 5–12 now reference only existing canonical identifiers:

| Week | Skill identifiers |
|---:|---|
| 5 | `rhythm.pulse`, `rhythm.subdivision`, `rhythm.strumming`, `rhythm.muting`, `arrangement.song-form` |
| 6 | `lead.pentatonic`, `lead.phrasing`, `technique.bends`, `technique.legato`, `technique.alternate-picking`, `rhythm.pulse`, `performance.recording`, `performance.recovery` |
| 7 | `harmony.seventh-chords`, `harmony.voice-leading`, `lead.phrasing`, `lead.pentatonic` |
| 8 | `lead.phrasing`, `lead.pentatonic`, `rhythm.muting`, `rhythm.pulse`, `arrangement.song-form` |
| 9 | `lead.major-scale`, `lead.pentatonic`, `harmony.seventh-chords`, `lead.phrasing` |
| 10 | `lead.phrasing`, `rhythm.muting`, `rhythm.pulse`, `ear.rhythm` |
| 11 | `arrangement.song-form`, `repertoire.song-learning`, `performance.recording`, `performance.recovery` |
| 12 | `arrangement.song-form`, `repertoire.song-learning`, `performance.recording`, `performance.recovery`, `lead.phrasing`, `lead.pentatonic`, `rhythm.pulse`, `harmony.seventh-chords`, `technique.bends`, `technique.legato` |

The Week 7 mapping replaces the previous open-chord association with the dominant-seventh, voice-leading and lead-phrasing skills that the lesson actually teaches. Week 9 no longer maps modal colour only to arrangement/song-form. Week 10 no longer maps phrasing and silence to triads/voice-leading. Other weeks add only existing skills that are explicitly practised or reviewed by that lesson.

## 4. Assessment and learning-evidence boundaries

Each of Weeks 5–12 now has three distinct objectives and five task-specific success criteria. The criteria address the target music directly (for example shuffle subdivision and turnaround, chord-tone landing notes, use of rests, section transitions and intentional ending) rather than relying on generic “play accurately” language.

Recording and self-review are used to prompt reflection and a next action. No numeric cut score, automated grading, pass/fail threshold or mastery rule is added. A single performance, completion event or recording does not establish durable learning; important skills are revisited after a delay and in a changed musical context. Tempo guidance is a starting reference, not a test threshold. Accessibility alternatives preserve the central musical idea while allowing a smaller note set, slower pulse, shorter form, partner accompaniment or audio-only evidence.

## 5. Release and data safety

- Dataset version moves from `1.0.1` to `1.0.2`.
- Release `curriculum-v1.0.2` names `curriculum-v1.0.1` as its parent.
- All 12 Rock & Blues lesson IDs are preserved.
- Weeks 1–4 retain the pilot content from version 1.0.1; Weeks 5–12 receive the new task-specific content and reviewed mappings.
- The canonical 34-skill catalogue and draft assessment profiles remain unchanged.
- The release manifest marks `mappingsUnchanged: false` because Weeks 5–12 have corrected or expanded lesson-to-skill associations.
- Previous releases, learner assessment attempts, practice evidence, completion events and mastery records are not rewritten. New progress belongs to the new release; there is no automatic mastery carry-forward.

The database migration is generated from the repository's existing Drizzle workflow. It adds the immutable release and its lesson/skill metadata; it does not rewrite learner evidence.

## 6. Research basis and design choices

1. **National Association for Music Education / Library of Congress, *Harmonizing Instruments for Guitar — Proficient Level*.** The guitar unit teaches a 12-bar blues shuffle with quick-change IV and swung eighth notes, and includes creating original melodies in the blues context. This supports making the shuffle form and bar-level chord changes explicit in Week 5. [Unit PDF](https://nafme.org/wp-content/uploads/2026/02/harmonizing-instruments-guitar-unit-proficient-level.pdf).
2. **Berklee Online, *Basic Improvisation*.** Its syllabus sequences blues and pentatonic vocabulary, call-and-response and phrasing, rhythmic motifs, chord tones, voice leading and chord-scale/motif variation. The route uses a similar scaffold from groove and motif to chord-aware soloing and original performance. [Course and syllabus](https://online.berklee.edu/courses/basic-improvisation).
3. **Azzara and Snell, “Assessment of Improvisation in Music,” Oxford Handbook of Assessment Policy and Practice in Music Education.** The review describes criteria including reuse and development of related ideas, motivic development, effective silence, tension/release and harmonic resolution. These ideas inform Weeks 8, 10 and 12's criteria for motif identity, rests, variation and chord-aware resolution. [Chapter](https://academic.oup.com/edited-volume/42059/chapter/355878230).
4. **Boucher, Creech and Dubé, “Video feedback and the self-evaluation of college-level guitarists during individual practice,” *Psychology of Music* (2019 online; 2021 issue).** In a small study of 16 intermediate–advanced classical guitarists, video feedback changed the way participants formulated self-evaluative comments. The lesson uses recording as a way to focus review, but does not generalise the small study as proof of improved retention or mastery. [Article](https://journals.sagepub.com/doi/10.1177/0305735619842374).

## 7. Acceptance checks

- [x] All 12 Rock & Blues lesson IDs remain present.
- [x] Weeks 5–12 have lesson-specific objectives, examples, demonstration steps, application tasks and retrieval prompts.
- [x] Weeks 5–12 have five task-specific success criteria and common-error corrections.
- [x] All referenced skill IDs exist in the canonical 34-skill catalogue.
- [x] Dataset and release manifest are versioned as 1.0.2 / curriculum-v1.0.2.
- [ ] Curriculum validator passes on the new pull request head.
- [ ] Generated migration, local D1 integrity, formatting, lint, type checks, unit tests, build and browser acceptance pass.
- [ ] Curriculum reviewer checks the musical examples and difficulty progression.
