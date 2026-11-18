# GuitarLab Curriculum Audit — Implementation Tracker

**Status:** Open — audit accepted, remediation not yet started  
**Audit date:** 2026-11-18  
**Baseline:** `main`, active curriculum release `curriculum-v1.0.6`  
**Scope:** Year 1, Year 2, all four Year 3+ specialisations, skill catalogue, assessment profiles, practice taxonomy, mapping register and curriculum validation

> This is the implementation source of truth for the curriculum audit. Update the checkboxes, status, evidence and release references as work lands. Do not mark a task complete merely because a JSON file parses or a PR merges; use the acceptance criteria below.

## 1. Executive decision

The curriculum architecture is worth preserving. The 52-week Year 1 and Year 2 routes, four optional Year 3 specialisations, stable lesson IDs, spiral-learning model, flexible practice plans and separation of learner data from public curriculum content should remain intact.

The problem is incomplete and inconsistent instructional execution. Remediation should improve authored lessons, prerequisite progression, skill mappings, assessment evidence and validation without rewriting the curriculum wholesale.

**Overall verdict:** Good curriculum architecture; instructional authoring, progression and mapping review remain incomplete.

## 2. Audited baseline

| Measure | Main baseline | Interpretation |
|---|---:|---|
| Authored lessons | 152 | 52 Year 1 + 52 Year 2 + 48 Year 3+ |
| Exercises | 608 | Four per lesson; 608 unique exercise IDs |
| Skill catalogue | 34 skills | All 34 currently appear in lesson mappings |
| Lesson-to-skill associations | 391 | Every association still needs evidence-backed review |
| Task-specific authored lessons | 44 / 152 (28.9%) | 108 lessons still use generic learning objectives / criteria |
| Lessons with populated hard prerequisites | 0 / 152 | All `prerequisites` arrays are empty |
| Lessons with prior topics to refresh | 44 / 152 | Present in specialist routes; this is not a prerequisite graph |
| Skill assessment profiles | 34 | All remain draft; automated pass/fail decisions are not approved |
| Broken outline-to-lesson links found in audit | 0 | Week IDs and checkpoint links aligned in the inspected files |
| Unknown skill references found in audit | 0 | Structural validity does not prove semantic mapping validity |

### 2.1 Authoring progress by stage

| Stage / route | Task-specific authoring | Still generic |
|---|---:|---:|
| Year 1 | 9 / 52 | 43 |
| Year 2 | 3 / 52 | 49 |
| Rock & Blues | 12 / 12 | 0 |
| Fingerstyle & Acoustic | 12 / 12 | 0 |
| Jazz & Harmony | 8 / 12 | 4 |
| All-Round Musician | 0 / 12 | 12 |
| **Total** | **44 / 152** | **108** |

The 108 open lesson records are enumerated in the checklists in section 5. The four high-priority corrections in section 4 are included in those 108 records; do not count them twice.

### 2.2 Mapping-register baseline discrepancy

The current `docs/M7_2_LESSON_SKILL_MAPPING_REGISTER.md` contains 152 lesson rows with these visible row statuses:

| Row status | Rows |
|---|---:|
| Pending | 85 |
| Lexical screen flag — manual review needed | 62 |
| Flagged for focused review | 2 |
| Reviewed — owner decision pending | 2 |
| Reviewed — provisional keep | 1 |
| **Total** | **152** |

The register's own summary separately reports 25 lessons with a documented disposition and 127 still requiring disposition. Those figures do not reconcile directly with the row-status counts above. Lexical flags are advisory prompts, not completed semantic reviews. **Reconcile the register's summary, release reference and row-level status definitions before using it as a progress dashboard.**

## 3. Prioritised work plan

### P0 — Correct known instructional mismatches

| ID | Task | Status | Acceptance evidence |
|---|---|---|---|
| CURR-001 | Rewrite Year 1 Week 2 (`y1-w02-lesson`) around clean single-note fretting, minimum effective pressure, finger placement, two-hand coordination and relaxed movement. Remove the unsupported triad / voice-leading mapping after the documented owner decision; decide whether clean fretting needs a new skill ID rather than forcing an unrelated one. | [ ] Open | Explanation, demonstrations, exercises, worked example, criteria and mapping all describe the same actual task; skill decision is recorded. |
| CURR-002 | Finish Year 1 Week 20 (`y1-w20-lesson`). The mapping was corrected in an earlier release to phrasing and bends, but the explanation still uses an unrelated music-theory key idea and the focused exercise asks for note formulas / root movement. Teach slides, bends, dynamics and phrasing with playable examples and task-specific feedback. | [ ] Open | No stale theory template remains; bend / slide / phrase tasks are explicit; criteria assess the selected expressive outcomes. |
| CURR-003 | Clarify Year 2 Week 1 (`y2-w01-lesson`). Its focus and worked example describe natural notes on low E and A, while the checkpoint says every natural note to fret 5 without stating the string range. | [ ] Open | Focus, note map, exercise instructions and checkpoint name the same strings, fret range and expected note set. |
| CURR-004 | Review Year 2 Week 2 (`y2-w02-lesson`) octave mapping and teaching evidence. The lesson teaches octave relationships, but `fretboard.octaves` is not currently mapped to it and has only one association in the full curriculum. | [ ] Open | Worked octave examples, practice task and checkpoint are explicit; add the existing octave skill mapping only if the lesson directly assesses it. |

### P1 — Finish authored lessons

#### Year 1 — 43 lessons requiring task-specific authoring

Complete all remaining records below. CURR-001 and CURR-002 are priority corrections within this list.

| Done | Week | Lesson ID | Lesson |
|---|---:|---|---|
| [ ] | 1 | `y1-w01-lesson` | Meet your guitar |
| [ ] | 2 | `y1-w02-lesson` | Clear single notes |
| [ ] | 3 | `y1-w03-lesson` | Read guitar maps |
| [ ] | 5 | `y1-w05-lesson` | Open chords A, D and E |
| [ ] | 6 | `y1-w06-lesson` | First complete chord loop |
| [ ] | 8 | `y1-w08-lesson` | Optional notation: strings 1 and 2 |
| [ ] | 9 | `y1-w09-lesson` | Add C, Am and Dm |
| [ ] | 10 | `y1-w10-lesson` | Make rhythm musical |
| [ ] | 12 | `y1-w12-lesson` | Quarter 1 review and recording |
| [ ] | 13 | `y1-w13-lesson` | Optional notation: strings 3 and 4 |
| [ ] | 14 | `y1-w14-lesson` | Optional notation: low E and A landmarks |
| [ ] | 18 | `y1-w18-lesson` | Shell chords: roots and guide tones |
| [ ] | 19 | `y1-w19-lesson` | Your first 12-bar blues |
| [ ] | 20 | `y1-w20-lesson` | Play with expression |
| [ ] | 21 | `y1-w21-lesson` | Movable power chords |
| [ ] | 22 | `y1-w22-lesson` | Approach barre chords safely |
| [ ] | 24 | `y1-w24-lesson` | Half-year playing test |
| [ ] | 25 | `y1-w25-lesson` | Find roots and octaves |
| [ ] | 27 | `y1-w27-lesson` | Chords in keys |
| [ ] | 28 | `y1-w28-lesson` | Capo and transposition |
| [ ] | 29 | `y1-w29-lesson` | Suspended and seventh chords |
| [ ] | 30 | `y1-w30-lesson` | Sixteenth-note rhythm |
| [ ] | 31 | `y1-w31-lesson` | Hammer-ons and pull-offs |
| [ ] | 32 | `y1-w32-lesson` | Quarter 2 review |
| [ ] | 33 | `y1-w33-lesson` | Major pentatonic and phrasing |
| [ ] | 34 | `y1-w34-lesson` | Improvise with motifs |
| [ ] | 35 | `y1-w35-lesson` | Arpeggios and chord tones |
| [ ] | 36 | `y1-w36-lesson` | Three notes per string |
| [ ] | 38 | `y1-w38-lesson` | Songwriting and arrangement |
| [ ] | 39 | `y1-w39-lesson` | Blues turnarounds |
| [ ] | 40 | `y1-w40-lesson` | Rock rhythm and muting |
| [ ] | 41 | `y1-w41-lesson` | Jazz chord grips |
| [ ] | 42 | `y1-w42-lesson` | The ii-V-I connection |
| [ ] | 43 | `y1-w43-lesson` | Comping styles |
| [ ] | 44 | `y1-w44-lesson` | Quarter 3 review |
| [ ] | 45 | `y1-w45-lesson` | Sight-read across strings |
| [ ] | 46 | `y1-w46-lesson` | Move between positions |
| [ ] | 47 | `y1-w47-lesson` | Chord melody basics |
| [ ] | 48 | `y1-w48-lesson` | Compose a complete study |
| [ ] | 49 | `y1-w49-lesson` | Dynamics and articulation |
| [ ] | 50 | `y1-w50-lesson` | Repertoire polishing |
| [ ] | 51 | `y1-w51-lesson` | Mock performance and transcription |
| [ ] | 52 | `y1-w52-lesson` | Year-end playing test |

#### Year 2 — 49 lessons requiring task-specific authoring

CURR-003 and CURR-004 are priority corrections within this list.

| Done | Week | Lesson ID | Lesson |
|---|---:|---|---|
| [ ] | 1 | `y2-w01-lesson` | Fretboard map 1 |
| [ ] | 2 | `y2-w02-lesson` | Fretboard map 2 |
| [ ] | 3 | `y2-w03-lesson` | CAGED and advanced fretboard map |
| [ ] | 5 | `y2-w05-lesson` | Minor triad inversions |
| [ ] | 6 | `y2-w06-lesson` | Quarter review: fretboard |
| [ ] | 7 | `y2-w07-lesson` | Power-chord accuracy |
| [ ] | 8 | `y2-w08-lesson` | Palm-muted groove |
| [ ] | 9 | `y2-w09-lesson` | Barre chord refresh |
| [ ] | 10 | `y2-w10-lesson` | A-shape barre chords |
| [ ] | 11 | `y2-w11-lesson` | Quarter review: rhythm guitar |
| [ ] | 12 | `y2-w12-lesson` | Major scale position 1 |
| [ ] | 13 | `y2-w13-lesson` | Scale sequences |
| [ ] | 14 | `y2-w14-lesson` | Position changes |
| [ ] | 15 | `y2-w15-lesson` | Major scale phrase-making |
| [ ] | 16 | `y2-w16-lesson` | Quarter review: melody |
| [ ] | 17 | `y2-w17-lesson` | Blues shuffle 1 |
| [ ] | 18 | `y2-w18-lesson` | Blues shuffle 2 |
| [ ] | 19 | `y2-w19-lesson` | Blues lead vocabulary |
| [ ] | 20 | `y2-w20-lesson` | Bends and vibrato |
| [ ] | 21 | `y2-w21-lesson` | Blues turnaround |
| [ ] | 22 | `y2-w22-lesson` | Quarter review: blues |
| [ ] | 23 | `y2-w23-lesson` | Fingerstyle bass independence |
| [ ] | 24 | `y2-w24-lesson` | Fingerstyle pattern changes |
| [ ] | 25 | `y2-w25-lesson` | Fingerstyle melody balance |
| [ ] | 26 | `y2-w26-lesson` | Percussive and muted accents |
| [ ] | 27 | `y2-w27-lesson` | Arrange a folk piece |
| [ ] | 28 | `y2-w28-lesson` | Quarter review: acoustic |
| [ ] | 29 | `y2-w29-lesson` | Song form and sections |
| [ ] | 31 | `y2-w31-lesson` | Learn by ear: bass |
| [ ] | 32 | `y2-w32-lesson` | Learn by ear: melody |
| [ ] | 33 | `y2-w33-lesson` | Chord melody II |
| [ ] | 34 | `y2-w34-lesson` | Quarter review: repertoire |
| [ ] | 35 | `y2-w35-lesson` | Music theory: intervals |
| [ ] | 36 | `y2-w36-lesson` | Build seventh chords |
| [ ] | 37 | `y2-w37-lesson` | Chord extensions |
| [ ] | 38 | `y2-w38-lesson` | Chord substitution |
| [ ] | 39 | `y2-w39-lesson` | Quarter review: harmony |
| [ ] | 40 | `y2-w40-lesson` | Jazz swing comping |
| [ ] | 41 | `y2-w41-lesson` | Jazz ii-V-I voice leading |
| [ ] | 42 | `y2-w42-lesson` | Bossa nova foundation |
| [ ] | 43 | `y2-w43-lesson` | Jazz melody phrasing |
| [ ] | 44 | `y2-w44-lesson` | Jazz blues |
| [ ] | 45 | `y2-w45-lesson` | Quarter review: jazz |
| [ ] | 46 | `y2-w46-lesson` | Practice architecture |
| [ ] | 47 | `y2-w47-lesson` | Transcribe a phrase |
| [ ] | 48 | `y2-w48-lesson` | Write a solo chorus |
| [ ] | 49 | `y2-w49-lesson` | Arrangement, dynamics and style comparison |
| [ ] | 51 | `y2-w51-lesson` | Rehearsal, stamina and a 3-piece set |
| [ ] | 52 | `y2-w52-lesson` | Year 2 mock exam and next-path plan |

#### Year 3+ — 16 specialist lessons requiring task-specific authoring

| Done | Route | Week | Lesson ID | Lesson |
|---|---|---:|---|---|
| [ ] | Jazz & Harmony | 9 | `y3-jazz-harmony-w09-lesson` | Chord-tone soloing |
| [ ] | Jazz & Harmony | 10 | `y3-jazz-harmony-w10-lesson` | Tune learning workflow |
| [ ] | Jazz & Harmony | 11 | `y3-jazz-harmony-w11-lesson` | Reharmonisation |
| [ ] | Jazz & Harmony | 12 | `y3-jazz-harmony-w12-lesson` | Path capstone |
| [ ] | All-Round Musician | 1 | `y3-all-round-musician-w01-lesson` | Listening journal |
| [ ] | All-Round Musician | 2 | `y3-all-round-musician-w02-lesson` | Ear intervals |
| [ ] | All-Round Musician | 3 | `y3-all-round-musician-w03-lesson` | Sight reading routine |
| [ ] | All-Round Musician | 4 | `y3-all-round-musician-w04-lesson` | Harmony analysis |
| [ ] | All-Round Musician | 5 | `y3-all-round-musician-w05-lesson` | Transposition |
| [ ] | All-Round Musician | 6 | `y3-all-round-musician-w06-lesson` | Quarter review: musicianship |
| [ ] | All-Round Musician | 7 | `y3-all-round-musician-w07-lesson` | Arranging texture |
| [ ] | All-Round Musician | 8 | `y3-all-round-musician-w08-lesson` | Recording feedback |
| [ ] | All-Round Musician | 9 | `y3-all-round-musician-w09-lesson` | Songwriting form |
| [ ] | All-Round Musician | 10 | `y3-all-round-musician-w10-lesson` | Ensemble preparation |
| [ ] | All-Round Musician | 11 | `y3-all-round-musician-w11-lesson` | Teaching a skill |
| [ ] | All-Round Musician | 12 | `y3-all-round-musician-w12-lesson` | Path capstone |

### P1 — Complete the lesson-to-skill mapping audit

- [ ] **CURR-020:** Reconcile `M7_2_LESSON_SKILL_MAPPING_REGISTER.md` with the active `curriculum-v1.0.6` release. Fix the stale release reference and reconcile the row-status counts with the summary counts.
- [ ] **CURR-021:** Review all 152 lessons and all 391 current skill associations against the skill definition, lesson focus/objectives, actual teaching and exercise content, and checkpoint/success criteria.
- [ ] **CURR-022:** Record a disposition for every association: keep, remove, clarify or escalate. Include a short evidence reference (lesson block, exercise or criterion); a keyword/lexical match alone is not approval.
- [ ] **CURR-023:** Resolve Year 1 Week 2's unsupported harmony mappings and clean-fretting catalogue gap with an explicit curriculum-owner decision.
- [ ] **CURR-024:** Confirm Year 1 Week 31 and Year 3 Rock & Blues Week 4 outcomes expose the picking, string-crossing and legato skills their content teaches.
- [ ] **CURR-025:** Review Year 2 Week 2 for `fretboard.octaves` and inspect sparse skills, including fretboard octaves, chord transitions, power chords, tuning, posture, alternate picking and legato.
- [ ] **CURR-026:** Re-run the focused open-chord mapping review against the current 22 associations. Earlier reports refer to older release counts and must be treated as historical evidence, not current dispositions.
- [ ] **CURR-027:** Revisit high-frequency associations such as recording, recovery and repertoire to ensure the exact assessed skill is visible in each lesson.
- [ ] **CURR-028:** Publish an updated summary with counts of reviewed associations, unresolved owner decisions and confirmed corrections. Do not mark the audit complete while any association lacks a disposition.

### P1 — Define progression and prerequisites

- [ ] **CURR-030:** Design a prerequisite model that distinguishes recommended knowledge from mastery-gated readiness. Do not automatically gate every lesson.
- [ ] **CURR-031:** Populate evidence-backed prerequisite relationships for relevant Year 1 and Year 2 lessons; validate that the dependency graph is acyclic and references known lesson / skill IDs.
- [ ] **CURR-032:** Define skill readiness and entry expectations for each of the four Year 3+ routes. Preserve learner choice while making gaps visible.
- [ ] **CURR-033:** Separate `prerequisites` from `priorTopicsToRefresh`. A retrieval reminder must not be interpreted as a hard prerequisite or as proof of previous completion.
- [ ] **CURR-034:** Add intermediate bridges where needed, especially fretboard octave fluency, reading / transcription, alternate picking and legato. Decide whether a full lesson, recurring exercise or explicit refresh task is the right intervention.
- [ ] **CURR-035:** Document the intended progression for each of the 34 skills: introduction, guided practice, independent performance, delayed retrieval and musical transfer.

### P1 — Review catalogue boundaries and coverage gaps

- [ ] **CURR-040:** Retain the existing 34 stable skill IDs unless a documented learning outcome cannot be represented by the current catalogue.
- [ ] **CURR-041:** Decide whether clean fretting / single-note tone requires a distinct skill; compare the proposal against existing technique and instrument skills before adding an ID.
- [ ] **CURR-042:** Resolve the documentation/catalogue mismatch for staff notation: curriculum documentation references `notation.staff`, but the active catalogue does not define that skill.
- [ ] **CURR-043:** Review whether expressive slides, dynamics, arpeggio performance and other recurring outcomes need separate skills or should remain criteria within broader skills. Do not split IDs merely to balance counts.
- [ ] **CURR-044:** Version any approved catalogue changes and document compatibility consequences. Never reinterpret historical assessment evidence under a new skill definition without an explicit migration policy.

### P2 — Improve assessment and practice evidence

- [ ] **CURR-050:** Keep all 34 assessment profiles in draft until musical accuracy, level boundaries, evidence types and review requirements have been checked.
- [ ] **CURR-051:** Replace generic criteria with task-specific, observable evidence for every remediated lesson (for example bend intonation, fingerstyle independence, subdivision accuracy, interval reproduction and chord-tone resolution).
- [ ] **CURR-052:** Specify delayed-retention and changed-context transfer probes for important skills and review / capstone lessons.
- [ ] **CURR-053:** Separate observed/self-checked, self-reported, recording-reviewed and objectively measured evidence. Do not claim automated audio measurement unless the relevant tool is validated for that exact task.
- [ ] **CURR-054:** Expand authored practice taxonomy only through source-reviewed lesson/exercise scopes. Do not bulk-tag using title or keyword similarity.
- [ ] **CURR-055:** Keep recording, practice duration, repetition count and lesson completion separate from skill mastery.

### P2 — Strengthen validation and curriculum governance

- [ ] **CURR-060:** Extend curriculum validation to check prerequisite references, dependency cycles, route entry definitions and skill-assessment profile references.
- [ ] **CURR-061:** Add authoring-quality diagnostics for generic objectives, generic criteria, stale template text, mismatched focus/checkpoint/exercise content and empty or overly broad musical examples.
- [ ] **CURR-062:** Treat quality diagnostics as review gates only after representative false-positive / false-negative testing. Structural JSON validity is not proof of musical quality.
- [ ] **CURR-063:** Require an instructor / guitarist review of note spellings, fret positions, chord shapes, voicings, rhythmic notation, route level and accessibility for each authored batch.
- [ ] **CURR-064:** Refresh curriculum research and audit documents when content changes; clearly label superseded counts and historical release findings.
- [ ] **CURR-065:** Run the curriculum validator, formatting, type checks, unit tests and full relevant CI for every content batch before merge.
- [ ] **CURR-066:** Preserve stable lesson IDs and immutable release history. Any curriculum content change must use the established release/versioning process; do not rewrite historic learner progress or silently carry mastery forward.

## 4. Lesson authoring acceptance standard

A lesson is considered task-specifically authored only when all applicable checks below pass:

- [ ] Learning objectives describe distinct, observable outcomes for the actual lesson rather than generic "perform the task" language.
- [ ] Explanation is accurate, plain-language and specific to the skill; no unrelated topic-family template remains.
- [ ] Worked examples include concrete musical material appropriate to the guitar (notes, strings/frets, chord spellings/voicings, rhythm counts, phrase or progression as relevant).
- [ ] Guided demonstration has ordered steps that a learner can follow without requiring a paid external course.
- [ ] Focused practice isolates the intended skill and gives a useful success criterion.
- [ ] Musical application uses the target skill in a real phrase, progression, arrangement or listening task.
- [ ] Success criteria are task-specific and cover the meaningful dimensions of the skill; generic accuracy / pulse / comfort wording may supplement, not replace, the actual target criteria.
- [ ] Common mistakes have actionable, matched corrections.
- [ ] Accessible alternative reduces complexity while preserving the learning intention.
- [ ] Retrieval prompt checks recall without simply repeating the displayed explanation.
- [ ] Review suggestion supports delayed retrieval / transfer and remains a transparent heuristic rather than a claimed optimal schedule.
- [ ] Evidence type is truthful; the app never presents self-report or an unvalidated recording review as objective measurement.
- [ ] Skill mappings are supported by actual teaching or assessment evidence.
- [ ] Relevant prerequisites / prior topics are accurately identified.

## 5. Musical and assessment safeguards

1. Accuracy before speed. BPM values are starting references, not pass marks.
2. A single successful attempt is not proof of durable mastery.
3. Demonstrate important skills more than once, separated in time, and in more than one musical context where appropriate.
4. Avoid universal numeric pass thresholds until skill-specific criteria have been reviewed and validated.
5. Keep draft assessment profiles non-authoritative. No automated grading or pass/fail decisions are approved by this tracker.
6. Stop-if-pain / discomfort guidance remains educational and non-diagnostic.
7. Use original GuitarLab material, learner-created examples or properly licensed/public-domain material; link to commercial tabs and recordings rather than copying protected material.

## 6. Release and learner-data safeguards

- Stable curriculum week IDs, authored lesson IDs and existing skill IDs must remain unchanged unless a separate approved migration explicitly requires otherwise.
- Curriculum changes must create a new immutable release using the existing release and migration workflow.
- Historical completions, practice sessions, recordings, assessments and mastery records remain tied to the release under which they were created.
- Do not infer or backfill learner evidence from lesson titles, practice notes, old free-text observations or prior releases.
- Public curriculum files contain generic teaching content only. Personal learner data remains in private application storage.

## 7. Definition of done

The curriculum audit remediation milestone is complete only when:

- [ ] All 152 lessons meet the authoring acceptance standard or have a documented, approved exception.
- [ ] All 391 lesson-to-skill associations have an evidence-backed disposition.
- [ ] The 34-skill catalogue has a recorded owner decision for identified granularity / coverage questions.
- [ ] Prerequisite and route-readiness relationships are documented, validated and do not create dependency cycles.
- [ ] All four specialist routes have task-specific authoring across all 48 lessons.
- [ ] Assessment profiles have completed human review; any automated decision capability remains separately validated and explicitly approved.
- [ ] Curriculum and practice taxonomy validation passes on the exact release inputs.
- [ ] Human musical review and learner-facing acceptance review are recorded.
- [ ] Release notes, compatibility safeguards and implementation tracking are current.

## 8. Progress log

Add one entry per implementation batch. Include the PR, release ID, lessons / mappings changed, validation evidence and any deferred decisions.

| Date | PR / release | Scope completed | Validation / review | Follow-up |
|---|---|---|---|---|
| 2026-11-18 | Audit baseline: `curriculum-v1.0.6` | Audit and tracker created; no curriculum data changed | Source files and existing curriculum audit documents inspected | Begin P0 corrections |

## 9. Related source documents

- [Curriculum overview](CURRICULUM.md)
- [Curriculum content model](CURRICULUM_CONTENT_MODEL.md)
- [Curriculum research](CURRICULUM_RESEARCH.md)
- [Evidence-based curriculum review](M7_2_EVIDENCE_BASED_CURRICULUM_REVIEW.md)
- [Lesson content quality audit](M7_2_LESSON_CONTENT_QUALITY_AUDIT.md)
- [Skill definition audit](M7_2_SKILL_DEFINITION_AUDIT.md)
- [Progress and coverage audit](M7_2_PROGRESS_AND_COVERAGE_AUDIT.md)
- [Lesson-to-skill mapping register](M7_2_LESSON_SKILL_MAPPING_REGISTER.md)
- [Curriculum integrity plan](M7_2_CURRICULUM_INTEGRITY_PLAN.md)
- [Practice evidence audit](M7_2_PRACTICE_EVIDENCE_AUDIT.md)
- [Curriculum validator](../scripts/validate-curriculum.mjs)
