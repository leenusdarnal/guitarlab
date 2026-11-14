# M7.2 — Skill Definition Audit (34 Existing Skills)

**Status:** Preliminary technical/content audit complete; curriculum-owner validation pending  
**Catalogue baseline:** `content/curriculum/skill-catalog.json` v1.0.0  
**Curriculum release:** `curriculum-v1`  
**Scope:** All 34 existing skill identifiers. No identifiers or lesson mappings are changed by this audit.

## 1. Executive finding

The catalogue contains 34 distinct, consistently namespaced skill identifiers across 12 categories. The entries generally describe capabilities rather than broad learning strands, and most are capable of being assessed with an observable performance or response.

However, the current `description` field is not yet a complete assessment specification. Most descriptions explain what a skill is, but do not define:
- the task or context in which it should be demonstrated;
- the observable evidence that counts as successful performance;
- the expected consistency, accuracy, tempo, or independence;
- whether assessment is suitable for automated measurement, structured self-report, or human review.

**Conclusion:** Keep the current 34 identifiers as the stable baseline. Improve assessment criteria and metadata before considering taxonomy expansion. This is a preliminary audit, not curriculum-owner sign-off and not a claim that all 34 skills already have validated rubrics.

## 2. Audit method and interpretation

Each skill was reviewed for:
1. **Capability focus:** Does the entry describe something a learner can do?
2. **Observable evidence:** Can a reviewer identify a performance, response, or artefact that demonstrates it?
3. **Scope clarity:** Is the skill sufficiently distinct from adjacent skills?
4. **Assessment route:** What evidence source is appropriate?
5. **Definition gap:** What must be clarified before a consistent rubric can be authored?

Assessment routes used below:
- **Performance:** Observe the learner playing or performing.
- **Recognition:** Learner identifies, names, counts, sings, or selects a musical feature.
- **Artefact:** Review a recording, transcription, arrangement, or other produced work.
- **Human review:** A teacher/reviewer evaluates musical quality or context.
- **Hybrid:** Combine objective evidence with human judgement.

These are suggested evidence types, not implemented assessment capabilities. No universal numeric pass threshold is assigned here; thresholds require curriculum and level context.

## 3. Complete skill-by-skill register

| # | Skill identifier | Current definition focus | Suggested observable evidence | Assessment route | Audit finding / clarification needed |
|---:|---|---|---|---|---|
| 1 | `arrangement.song-form` | Organise ideas into sections and coherent arrangement | Learner labels or performs a recognisable section sequence and explains/produces a coherent arrangement | Artefact + human review | **Clarify:** define expected form complexity by level; distinguish identifying form from creating an arrangement |
| 2 | `ear.intervals` | Hear, compare and identify pitch intervals | Correctly identifies or reproduces target interval relationships in a defined listening task | Recognition + performance | **Clarify:** specify interval set, direction, tonal context, and whether singing or naming is required |
| 3 | `ear.melody-transcription` | Work out melody notes on guitar by listening | Produces a playable note sequence that matches a supplied melody | Artefact + performance + human review | **Clarify:** define permitted replay/reference support, phrase length, rhythm accuracy, and pitch tolerance |
| 4 | `ear.pitch` | Recognise, sing or match target pitch | Matches a reference pitch vocally or on guitar within an agreed tolerance | Performance / instrument-assisted measurement | **Clarify:** distinguish pitch matching from absolute-pitch naming; define reference and tolerance |
| 5 | `ear.rhythm` | Hear, recall and reproduce rhythmic patterns | Reproduces a heard rhythm with correct beat placement and subdivision | Recognition + performance | **Clarify:** define pattern length, notation support, tempo range, and timing tolerance |
| 6 | `fingerstyle.patterns` | Play and vary repeating fingerstyle patterns | Performs a specified pattern with intended thumb/finger assignment and steady pulse | Performance | **Clarify:** identify pattern families and whether variation/improvisation is required |
| 7 | `fingerstyle.thumb-independence` | Maintain independent thumb role while fingers play other notes | Maintains bass/thumb pattern while upper notes continue without unintended interruption | Performance | **Clarify:** define independence task and acceptable tempo/coordination for each level |
| 8 | `fretboard.natural-notes` | Locate and name natural notes across strings/positions | Finds requested natural notes on specified strings/frets accurately | Recognition + performance | **Clarify:** specify fretboard range, response speed expectations, and whether enharmonic naming is included |
| 9 | `fretboard.octaves` | Find octave relationships and navigate the neck | Locates octave-equivalent notes and transfers a note to another position using a recognised shape | Recognition + performance | **Clarify:** define included octave shapes and string-pair coverage |
| 10 | `fretboard.string-map` | Relate string names, fret positions and note locations | Names open strings and maps a requested note to a valid string/fret location | Recognition + performance | **Clarify:** distinguish string identification from full note-location fluency; define required range |
| 11 | `harmony.barre-chords` | Form and move barre-chord shapes with controlled pressure | Produces a clean barre-chord voicing and changes position while avoiding unintended muted/buzzing notes | Performance | **Clarify:** define chord families, fretboard positions, and what counts as a clean voicing |
| 12 | `harmony.open-chords` | Form open-position chords and check intended notes | Forms specified open chords and sounds the required strings clearly | Performance | **Review scope:** reused across varied chord lessons; confirm whether one skill is sufficiently coherent or whether definitions need subcriteria without changing the ID |
| 13 | `harmony.power-chords` | Form movable root-and-fifth shapes | Plays root/fifth power-chord shapes at target positions with correct muting and timing | Performance | **Clarify:** define root-string options, movement, muting, and rhythm expectations |
| 14 | `harmony.seventh-chords` | Build and play seventh-chord shapes and sounds | Identifies or constructs the required seventh-chord quality and performs a valid voicing | Recognition + performance | **Clarify:** specify included chord qualities and whether theory naming, construction, or performance is assessed |
| 15 | `harmony.transitions` | Move between chord shapes smoothly and in time | Changes between a specified chord sequence while maintaining pulse and producing clean chord attacks | Performance | **Clarify:** define chord-change count, tempo, transition quality, and whether strumming is part of the criterion |
| 16 | `harmony.triads` | Build and navigate triads and inversions | Identifies, constructs, or plays a requested triad/inversion with correct chord tones | Recognition + performance | **Clarify:** define triad qualities, string sets, inversion range, and expected theoretical explanation |
| 17 | `harmony.voice-leading` | Connect chords by efficient individual-note movement | Plays a chord progression while retaining common tones or moving voices by the intended small intervals | Performance + human review | **Clarify:** specify progression/voicing context and whether smoothness is judged mechanically or musically |
| 18 | `instrument.posture` | Comfortable, stable guitar position and relaxed setup | Demonstrates stable instrument support, neutral/reasonably relaxed posture, and workable hand positioning | Human observation | **Clarify:** use inclusive ergonomic guidance; avoid treating one body posture as universal |
| 19 | `instrument.tuning` | Tune guitar and identify standard open-string pitches | Tunes all required strings to the stated reference and identifies standard open-string names/pitches | Instrument measurement + recognition | **Clarify:** specify tuning system/reference, acceptable cents deviation, and whether alternate tunings are in scope |
| 20 | `lead.major-scale` | Understand and play major-scale patterns and note sequences | Plays a defined major-scale pattern with correct note order and can locate its tonic | Performance + recognition | **Clarify:** specify positions, keys, fingering, and whether scale-degree understanding is assessed |
| 21 | `lead.pentatonic` | Map and play major/minor pentatonic patterns | Plays the required pentatonic pattern and identifies or resolves to its tonal centre in a musical task | Performance + human review | **Clarify:** distinguish major and minor forms, positions, and application/phrasing expectations |
| 22 | `lead.phrasing` | Shape melodic ideas with timing, dynamics, articulation and space | Performs a short phrase with intentional note length, dynamics, articulation, and pauses | Performance + human review | **Clarify:** qualitative skill; define a level-appropriate rubric rather than a single correctness score |
| 23 | `notation.tab` | Interpret string/fret information in tablature | Reads a short tab excerpt and performs or identifies the corresponding notes in sequence | Recognition + performance | **Clarify:** define rhythmic notation expectations, symbols/techniques included, and excerpt complexity |
| 24 | `performance.recording` | Capture a performance and review playback | Creates a usable recording and identifies at least one specific observation from playback | Artefact + reflection | **Clarify:** distinguish technical recording operation from reflective listening; define required recording quality |
| 25 | `performance.recovery` | Recover from slips or interruptions and continue | After a controlled interruption or mistake, re-enters at an appropriate musical point and maintains continuity | Performance + human review | **Clarify:** define recovery context and assess continuity rather than penalising the initial mistake alone |
| 26 | `repertoire.song-learning` | Learn, retain and perform complete musical material | Performs an agreed section/song from memory or with permitted support, maintaining structure and continuity | Performance + human review | **Clarify:** specify retention interval, permitted prompts, arrangement fidelity, and level-appropriate repertoire |
| 27 | `rhythm.muting` | Control unwanted noise and use muted sounds/rests intentionally | Produces intended muted/percussive notes and keeps non-target strings quiet during a defined pattern | Performance | **Clarify:** separate noise-control from intentional percussive muting in the rubric |
| 28 | `rhythm.pulse` | Maintain consistent beat while playing or resting | Maintains beat through a defined exercise, including rests, with measured timing consistency | Performance / timing analysis | **Clarify:** define tempo range, duration, allowed metronome use, and timing tolerance |
| 29 | `rhythm.strumming` | Play accompaniment patterns with controlled strokes and accents | Performs a stated strumming pattern with correct stroke direction, pulse, and accents | Performance | **Clarify:** define pattern notation, accent accuracy, muting expectations, and tempo |
| 30 | `rhythm.subdivision` | Count and perform divisions of the beat | Counts, claps, or plays specified subdivisions accurately against a pulse | Recognition + performance | **Clarify:** list included subdivision values and distinguish counting knowledge from execution |
| 31 | `technique.alternate-picking` | Coordinate alternating downstrokes and upstrokes | Plays a defined single-note sequence with alternating pick direction and controlled timing | Performance | **Clarify:** specify whether strict alternation is required in all contexts and how string changes are handled |
| 32 | `technique.bends` | Bend notes toward intended pitch | Bends to a target pitch and sustains/releases it with controlled intonation | Performance + pitch measurement | **Clarify:** specify bend intervals, target pitch tolerance, string/fret context, and release control |
| 33 | `technique.legato` | Connect notes with hammer-ons, pull-offs and smooth articulation | Performs a defined hammer-on/pull-off phrase with clear note attacks and even timing/volume | Performance | **Clarify:** define technique coverage and whether slides are included; current description names hammer-ons/pull-offs |
| 34 | `technique.string-crossing` | Move picking hand between strings economically | Plays a sequence across adjacent/non-adjacent strings with accurate targeting and controlled unwanted noise | Performance | **Clarify:** define string-crossing patterns and whether economy of motion is observed or inferred from outcome |

## 4. Cross-catalogue findings

### 4.1 Strengths
- All 34 entries use stable, category-prefixed identifiers.
- Each skill has a display name and a description.
- The catalogue distinguishes skill records from its 12 broader category labels.
- Most skills can be evidenced through a learner action, musical response, or artefact.
- The current definitions are a useful baseline and do not justify wholesale identifier replacement.

### 4.2 Gaps to address before assessment implementation
1. **No explicit success criteria:** Descriptions are not rubrics. A separate assessment specification is needed.
2. **Mixed skill granularity:** Some entries describe a narrow technique (for example, pitch bends), while others cover a broad capability (for example, song learning and repertoire).
3. **Mixed assessment modalities:** Some skills are directly observable in performance; others require recognition tasks, artefacts, or human judgement.
4. **Qualitative dimensions:** Phrasing, voice leading, arrangement, posture, and performance recovery need context-sensitive human review; they should not be reduced to an unsupported binary/automated score.
5. **Potentially compound skills:** Recording and performance review combines capture and reflection; muting combines noise control and intentional muted sounds. Determine whether separate rubric dimensions are sufficient before considering separate IDs.
6. **Context-dependent breadth:** Open chords, major scale, pentatonic patterns, and repertoire need level/position/context boundaries so the same skill can be assessed consistently.

### 4.3 Category distribution

| Category | Skill count |
|---|---:|
| Arrangement | 1 |
| Ear | 4 |
| Fingerstyle | 2 |
| Fretboard | 3 |
| Harmony | 7 |
| Instrument setup | 2 |
| Lead playing | 3 |
| Notation | 1 |
| Performance | 2 |
| Repertoire | 1 |
| Rhythm | 4 |
| Technique | 4 |
| **Total** | **34** |

Category totals describe the existing namespace grouping; they are not a measure of curriculum importance or learner proficiency.

## 5. Recommended assessment specification (next design step)

Do not overload the catalogue's short `description` field with full rubrics. Introduce a separate, versioned assessment specification only after the curriculum owner reviews these proposals.

For each skill, the specification should define:
- learning outcome;
- task/context and required equipment/material;
- observable criteria;
- scoring dimensions and level-specific thresholds;
- evidence type and provenance;
- human-review requirements;
- known limitations and accommodations;
- relationship to the stable skill ID and curriculum release.

A rubric may have multiple dimensions. For example, a bend could assess target pitch accuracy, sustain, and release separately. A phrasing rubric could assess timing, dynamics, articulation, and use of space without pretending there is one universally correct performance.

## 6. Decisions and recommendations

| Decision | Recommendation | State |
|---|---|---|
| Retain existing 34 IDs | Yes; preserve stable identifiers | Recommended |
| Add more skill IDs now | No; defer until mapping and granularity review proves a genuine gap | Recommended |
| Treat category/strand as assessable skill | No | Confirmed model distinction |
| Treat current descriptions as complete rubrics | No | Confirmed gap |
| Introduce numeric pass thresholds | Only after level-specific curriculum review | Deferred |
| Split compound skills | Not yet; test whether rubric dimensions resolve the ambiguity | Deferred |
| Change lesson mappings based on this audit | No; use lesson-level evidence in the separate mapping audit | Not authorised |

## 7. Open curriculum-owner decisions

- [ ] Confirm the proposed observable evidence for each skill.
- [ ] Decide level-specific boundaries for broad skills such as open chords, repertoire, and scale patterns.
- [ ] Decide how qualitative skills will be reviewed and recorded.
- [ ] Decide whether compound entries need multiple rubric dimensions or future separate IDs.
- [ ] Approve an assessment specification format and ownership process.
- [ ] Confirm no skill identifier changes are needed before the lesson mapping audit.

## 8. Completion status

- [x] Enumerate all 34 current skill identifiers.
- [x] Review existing display names and descriptions.
- [x] Draft observable evidence and assessment routes for all 34.
- [x] Record cross-catalogue granularity and assessment gaps.
- [ ] Curriculum-owner review and approval.
- [ ] Incorporate approved definitions/criteria into a versioned assessment specification.
- [ ] Complete lesson-to-skill mapping audit for all 152 lessons.

**Audit status:** Preliminary definition review complete. The catalogue remains unchanged. Next workstream: produce the full lesson-to-skill mapping review register and validate each association against the lesson objective and checkpoint.
