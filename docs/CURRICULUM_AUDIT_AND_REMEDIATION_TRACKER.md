# GuitarLab Curriculum Audit & Remediation Tracker

**Status:** Open — audit baseline recorded; remediation not yet started by this tracker  
**Audit date:** 2026-11-18  
**Baseline branch:** `main`  
**Baseline commit:** `fbaae1701d0e15eed7258863d105d6232e600904`  
**Active curriculum release:** `curriculum-v1.0.6`  
**Scope:** 152 authored lessons across Year 1, Year 2 and four optional Year 3 specialisations

> Working source of truth for closing the curriculum audit. Check tasks only when the change is merged and its acceptance evidence is recorded. A structurally valid lesson is not automatically a pedagogically complete lesson.

---

## 1. Executive status

**Overall assessment:** The curriculum architecture and breadth are strong, but lesson authoring, mapping review and progression requirements are not complete enough to declare the curriculum finished.

| Measure | Baseline | Interpretation |
|---|---:|---|
| Authored lessons | 152 | 52 Year 1, 52 Year 2, 48 Year 3 specialist lessons |
| Authored exercises | 608 | Four per lesson; exercise IDs are unique in the current source |
| Task-specific lessons | 44 / 152 | 29%; 108 lessons still use generic objectives / criteria |
| Skill catalogue | 34 IDs | All 34 are used by at least one lesson |
| Lesson-to-skill associations | 391 | Every association still requires evidence-based review |
| Lessons with explicit prerequisites | 0 / 152 | No formal prerequisite graph is currently authored |
| Skill assessment profiles | 34 | All remain draft; automated decisions are not approved |

### Year 3 specialist authoring

| Route | Task-specific lessons | Remaining |
|---|---:|---:|
| Rock & Blues | 12 / 12 | 0 |
| Fingerstyle & Acoustic | 12 / 12 | 0 |
| Jazz & Harmony | 8 / 12 | 4 |
| All-Round Musician | 0 / 12 | 12 |
| **Total** | **32 / 48** | **16** |

### Year 1 and Year 2 authoring

| Stage | Task-specific lessons | Generic lessons remaining |
|---|---:|---:|
| Year 1 | 9 / 52 | 43 |
| Year 2 | 3 / 52 | 49 |
| **Total** | **12 / 104** | **92** |

The 44 task-specific lessons are the 12 Year 1 / Year 2 pilot lessons plus 32 specialist lessons. These counts describe authoring specificity, not independent instructor approval.

---

## 2. Priority definitions and workflow

### Priority

- **P0 — Correctness blocker:** Teaches or assesses the wrong concept, has an unsupported mapping, or has a materially misleading checkpoint. Resolve before declaring the affected route reliable.
- **P1 — Curriculum completion:** Missing task-specific authoring, progression, mapping decisions or specialist-route requirements.
- **P2 — Quality and maturity:** Assessment refinement, practice analytics, documentation alignment and longer-term quality automation.

### Task status

Use one status for each tracked item:

- `Not started`
- `In progress`
- `Blocked — owner decision`
- `Ready for review`
- `Done`
- `Deferred` (requires a reason and review date)

**Definition of done:** A task is not Done when code or JSON has merely been edited. It must be merged, pass the applicable validation, preserve stable IDs and learner-history compatibility, and have its evidence recorded in this document.

### Required change discipline

1. Preserve stable lesson IDs, week IDs and existing skill IDs unless an explicitly reviewed versioned migration approves a change.
2. Never infer or rewrite personal learner progress, assessment attempts, recordings or mastery history.
3. Do not award mastery from lesson completion, practice duration, streaks or a single take.
4. Do not promote draft skill profiles to automated grading without separate validation and approval.
5. Make curriculum edits in small, reviewable batches. Keep related changes together and merge in the agreed priority order.
6. Keep outline cards, authored lesson records, skill mappings, release manifests and migration snapshots consistent.
7. A validator pass confirms data integrity; it does not prove musical accuracy or instructional quality.

---

## 3. P0 — Correct known instructional errors

These are the first remediation items. Inspect the full lesson before changing it.

### CURR-P0-01 — Year 1 Week 2: Clear single notes

**Current concern:** The focus and checkpoint are about fretting-hand fundamentals, clean tone and relaxed pressure. Its mappings still name `harmony.triads` and `harmony.voice-leading`, and its key explanation / focused exercise retain unrelated harmony and note-formula language.

- [ ] Rewrite the key idea and plain-language explanation around clean fretting, minimum effective pressure and relaxed movement.
- [ ] Rewrite the demonstration and exercises to teach finger placement, note clarity, buzzing diagnosis and two-hand coordination.
- [ ] Replace unrelated theory prompts with concrete single-note tasks and observable correction steps.
- [ ] Define task-specific criteria for note clarity, pressure, coordination and comfort.
- [ ] Resolve the mapping only after the skill-catalogue decision below; do not force-fit an unrelated skill.
- [ ] Confirm outline checkpoint and authored lesson checkpoint remain identical.
- [ ] Record a guitar-instructor review of the exercise and fret/string examples.

**Owner decision required:** Should the two unsupported harmony mappings be removed, and should clean fretting / single-note tone become a new skill identifier? The candidate `technique.clean-fretting` has been mentioned in earlier review notes but is not an approved ID.

**Acceptance evidence:** A reviewer can follow the lesson and learn the stated clean-note skill without being asked to perform unrelated chord theory; every mapped skill has direct task evidence.

**Status:** Blocked — owner decision

### CURR-P0-02 — Year 1 Week 20: Play with expression

**Current concern:** Its mappings have already been corrected to `lead.phrasing` and `technique.bends`, but the key explanation and focused exercise still contain unrelated music-theory / root-formula language. The focus covers slides, bends, dynamics and phrasing.

- [ ] Rewrite the explanation so it teaches expressive note movement, target pitch, timing, dynamics and phrase shape.
- [ ] Add specific slide and bend demonstrations with playable note/fret examples.
- [ ] Make the focused exercise practise the intended expressive technique rather than chord formulas.
- [ ] Define task-specific criteria for intonation, timing, articulation, dynamics and comfort.
- [ ] Confirm that `lead.phrasing` and `technique.bends` are justified by the actual learner tasks; document slides/dynamics as uncovered outcomes if no current ID fits.
- [ ] Check the accessible alternative preserves the expressive learning goal.

**Acceptance evidence:** The whole lesson teaches and assesses expression; no unrelated harmony instructions remain; current stable lesson ID is preserved.

**Status:** Not started

### CURR-P0-03 — Year 2 Week 1: Fretboard map 1

**Current concern:** The focus and worked example introduce natural notes on the low E and A strings through fret 5, while the checkpoint says “every natural note to fret 5” without stating a string range.

- [ ] Decide whether the intended scope is low E and A only or a wider set of strings.
- [ ] Align focus, objectives, demonstration, exercises, worked examples and checkpoint to the same string/fret scope.
- [ ] Make the independent recall task test the exact scope taught.
- [ ] Keep the checkpoint aligned between the outline and authored lesson.

**Acceptance evidence:** A learner can tell exactly which strings and frets are included, and the demonstrated notes cover the complete stated task.

**Status:** Not started

### CURR-P0-04 — Year 2 Week 2: Octaves across adjacent string sets

**Current concern:** The lesson teaches octave relationships, but its current mappings are `fretboard.string-map` and `fretboard.natural-notes`; it does not map to the existing `fretboard.octaves` skill. That skill currently has only one association across the full curriculum.

- [ ] Review the complete explanation, exercises and checkpoint for direct octave-skill evidence.
- [ ] Add `fretboard.octaves` if the lesson explicitly teaches and assesses octave locations; otherwise document why it is not an assessed outcome.
- [ ] Add a task-specific octave criterion and a transfer task across another string set.
- [ ] Update the mapping register and coverage audit after the decision.

**Acceptance evidence:** Octave-location teaching, assessment and skill mapping agree; the learner demonstrates the relationship rather than only memorising a shape.

**Status:** Not started

---

## 4. P1 — Finish Year 3 specialist authoring

All Year 3 lessons must meet the same instructional contract. Keep the four route goals and stable week IDs.

### CURR-P1-01 — Jazz & Harmony Weeks 9–12

**Current remaining lessons:** 4

- [ ] Week 9 — Chord-tone soloing: specify the chord progression, target chord tones, timing at changes and a playable solo exercise.
- [ ] Week 10 — Tune learning workflow: teach a repeatable listening, form, bass, melody, harmony and recall process; include an original short tune example.
- [ ] Week 11 — Reharmonisation: demonstrate a clear original progression, at least one justified reharmonisation option and voice-leading comparison.
- [ ] Week 12 — Path capstone: define a coherent performance/analysis brief with measurable musical criteria and a delayed reflection.
- [ ] Make objectives, explanations, demonstrations, four exercises, criteria, corrections, retrieval and accessible alternatives route-specific.
- [ ] Review skill mappings against what the learner actually demonstrates. Do not retain `harmony.open-chords` merely as a generic harmony label.
- [ ] Check chord spelling, voicing feasibility, harmonic function and voice-leading with a qualified reviewer.

**Acceptance evidence:** Four distinct, self-contained lessons with playable original examples, task-specific criteria and defensible skill mappings.

**Status:** Not started

### CURR-P1-02 — All-Round Musician Weeks 1–12

**Current remaining lessons:** 12

- [ ] Week 1 — Listening journal: give a structured listen / notice / describe / compare prompt.
- [ ] Week 2 — Ear intervals: define the interval set, reference note, direction and instrument/voice response.
- [ ] Week 3 — Sight-reading routine: distinguish staff notation from TAB and provide a readable original excerpt.
- [ ] Week 4 — Harmony analysis: use an original progression with chord quality, function and evidence prompts.
- [ ] Week 5 — Transposition: demonstrate a progression moved to a new key with verifiable note/chord changes.
- [ ] Week 6 — Musicianship review: integrate listening, reading, harmony and performance with separate criteria.
- [ ] Week 7 — Arranging texture: compare at least two contrasting textures using an original musical seed.
- [ ] Week 8 — Recording feedback: provide an actionable review process that distinguishes audible evidence from subjective preference.
- [ ] Week 9 — Songwriting form: teach motif, section contrast, repetition and an intentional ending.
- [ ] Week 10 — Ensemble preparation: include count-ins, cues, listening, role awareness and recovery.
- [ ] Week 11 — Teaching a skill: require a clear explanation, demonstration, learner check and correction sequence.
- [ ] Week 12 — Path capstone: integrate route outcomes into an original, assessable musical presentation.
- [ ] Replace generic objectives and generic checkpoints with task-specific material in every lesson.
- [ ] Review the existing mappings, especially broad `harmony.open-chords` labels where no open-chord task is actually taught.
- [ ] Review the whole route for appropriate sequencing and a coherent progression from listening to independent musicianship.

**Acceptance evidence:** 12 complete lessons with distinct objectives, original examples, clear learner actions, specific evidence criteria and route-level capstone alignment.

**Status:** Not started

### CURR-P1-03 — Year 3 route entry requirements

- [ ] Define route-specific recommended entry skills for Rock & Blues, Fingerstyle & Acoustic, Jazz & Harmony and All-Round Musician.
- [ ] Distinguish essential foundations from optional enrichment.
- [ ] Add route readiness guidance to the route outline / route selection experience.
- [ ] Provide a fresh placement / diagnostic option without importing prior learner history.
- [ ] Allow a learner to attempt a route while making any missing prerequisites visible; do not introduce blanket calendar locks.

**Acceptance evidence:** A learner can understand what each route expects and why it is recommended, with no hidden progression assumptions.

**Status:** Not started

---

## 5. P1 — Complete Year 1 and Year 2 lesson authoring

### CURR-P1-04 — Year 1 remaining 43 lessons

- [ ] Process lessons in stable week order, in small reviewable batches.
- [ ] Replace generic objective 2 and objective 3 with distinct, observable tasks and transfer outcomes.
- [ ] Replace boilerplate criteria with criteria that assess the actual lesson target.
- [ ] Add concrete worked examples, note/string/fret or rhythm details where relevant.
- [ ] Make demonstration steps executable by a learner without a paid external resource.
- [ ] Ensure focused practice, musical application and retrieval each target the lesson's actual skill.
- [ ] Add specific common mistakes with corrective actions.
- [ ] Ensure accessible alternatives reduce complexity without removing the learning goal.
- [ ] Keep optional staff notation genuinely optional where the route says it is optional.
- [ ] Complete a musical accuracy review of chord names, fingerings, TAB, rhythms and scale examples.

**Baseline:** 9 of 52 are task-specific; 43 remain.

**Acceptance evidence:** Every remaining lesson meets the authoring standard in Section 9 and is checked against its weekly outline.

**Status:** Not started

### CURR-P1-05 — Year 2 remaining 49 lessons

- [ ] Process lessons in stable week order, in small reviewable batches.
- [ ] Replace generic objective 2 and objective 3 with specific performance, understanding and transfer outcomes.
- [ ] Make success criteria specific to the target skill and level.
- [ ] Add worked examples for fretboard, triads, chord voicings, rhythm, scales, blues, fingerstyle, ear training and jazz.
- [ ] Distinguish recognition, explanation, performance and transfer instead of treating them as interchangeable.
- [ ] Include review lessons that actually retest prior skills and identify evidence for the next learning target.
- [ ] Ensure Year 2 develops and revisits Year 1 foundations rather than only increasing topic difficulty.
- [ ] Complete a musical accuracy and accessibility review.

**Baseline:** 3 of 52 are task-specific; 49 remain.

**Acceptance evidence:** Every remaining lesson is self-contained, level-appropriate, task-specific and aligned to its outline checkpoint.

**Status:** Not started

---

## 6. P1 — Complete the lesson-to-skill mapping audit

### CURR-P1-06 — Rebaseline the mapping register to v1.0.6

**Current concern:** `docs/M7_2_LESSON_SKILL_MAPPING_REGISTER.md` still identifies v1.0.2 as its source baseline, while the active curriculum release is v1.0.6. Its stated disposition summary does not amount to a complete review of all current lesson mappings.

- [ ] Regenerate the 152-row register from the current v1.0.6 lesson sources.
- [ ] Include every current skill association, with one review decision per association.
- [ ] Capture the evidence source: objective, teaching passage, exercise, worked example or checkpoint.
- [ ] Use explicit dispositions: keep, remove, clarify, or owner decision.
- [ ] Separate advisory lexical flags from evidence-backed mapping decisions.
- [ ] Record current totals and the active release ID at the top of the register.
- [ ] Update the curriculum audit documents that cite older mapping totals or release versions.

**Acceptance evidence:** The register matches all 152 current lessons and all 391 current associations; every association has an evidence-backed disposition or a clearly assigned owner decision.

**Status:** Not started

### CURR-P1-07 — Review all mapping associations

- [ ] Review all lesson-to-skill associations against the actual authored lesson, not just its title or a keyword match.
- [ ] Resolve every remaining `harmony.open-chords` association where open-chord formation is incidental or absent.
- [ ] Review high-risk groups: triads, voice leading, ear rhythm, fingerstyle thumb independence and pentatonic skills.
- [ ] Check the Year 1 Week 2 unresolved clean-fretting mapping.
- [ ] Verify that review / capstone lessons show evidence for recording, recovery and repertoire where those skills are mapped.
- [ ] Review sparse coverage for octave navigation, chord transitions, power chords, barre chords, bends, alternate picking, string crossing and legato.
- [ ] Record missing capabilities separately from mapping errors; do not create new IDs simply to balance counts.
- [ ] Obtain curriculum-owner approval for disputed or consequential changes.
- [ ] Add mapping decisions to a versioned release and preserve historical learner evidence.

**Acceptance evidence:** All 391 associations have a disposition and rationale, unsupported mappings are removed only through approved changes, and missing capabilities are recorded without forced mappings.

**Status:** Not started

---

## 7. P1 — Define a real learning progression

### CURR-P1-08 — Build the prerequisite model

**Current concern:** All 152 lessons currently have empty `prerequisites` arrays. Year 3 specialist lessons do populate `priorTopicsToRefresh`, but refresh topics are not a substitute for formal dependencies.

- [ ] Define a documented prerequisite vocabulary and reference model using stable skill IDs.
- [ ] For each lesson, decide whether it has no prerequisite, a recommended prerequisite, or an essential mastery prerequisite.
- [ ] Add only dependencies that are instructionally necessary; do not convert chronological order into a hard gate.
- [ ] Validate that referenced lesson / skill IDs exist.
- [ ] Detect circular dependencies.
- [ ] Add explicit refresh prompts for skills that should be revisited but are not hard prerequisites.
- [ ] Review cross-stage dependencies from Year 1 to Year 2 and from Year 2 to each Year 3 route.
- [ ] Add route-level entry skills and readiness explanations.
- [ ] Ensure progression recommendations use fresh learner evidence, never inferred history.

**Acceptance evidence:** All relevant dependencies are explicit, valid, acyclic and understandable; every lesson with an empty prerequisite list has been deliberately reviewed, not left empty by default.

**Status:** Not started

### CURR-P1-09 — Audit skill introduction, practice, retention and transfer

- [ ] For each of the 34 skills, record where it is introduced.
- [ ] Identify guided practice and independent performance opportunities.
- [ ] Identify delayed retrieval / retention opportunities.
- [ ] Identify application in a changed key, register, rhythm, progression or musical context.
- [ ] Decide whether each sparse skill needs a revisit, clearer mapping, or an intentional route-specific explanation.
- [ ] Check that advanced lessons rely on skills learners have had a fair chance to learn.
- [ ] Preserve a distinction between exposure, practice, evidence and mastery.

**Acceptance evidence:** A complete skill progression matrix exists and every apparent gap has an explicit keep / reinforce / clarify / defer decision.

**Status:** Not started

---

## 8. P2 — Assessment, practice evidence and taxonomy

### CURR-P2-01 — Improve skill-specific assessment profiles

- [ ] Keep the 34 current assessment profiles in draft until their criteria have been reviewed.
- [ ] Review each profile's assessment mode, criteria, evidence types, retention probe and transfer probe.
- [ ] Define level-appropriate expectations without universal numeric cut scores.
- [ ] Specify when human review is required.
- [ ] Document limitations and accessible alternatives for each assessment type.
- [ ] Separate measured evidence, observed/self-checked evidence, self-report and recording review.
- [ ] Keep automated mastery decisions disabled until evidence validity and reliability are demonstrated.

**Acceptance evidence:** Curriculum-owner and instructor review is recorded for all profiles; no profile is treated as an approved automated pass/fail rubric prematurely.

**Status:** Not started

### CURR-P2-02 — Expand practice taxonomy safely

- [ ] Review current practice-taxonomy coverage against the 608 authored exercises.
- [ ] Expand coverage only in source-reviewed batches.
- [ ] Tag only details explicitly stated by an exercise or its success criterion.
- [ ] Do not infer a string, fret range, technique or topic from a lesson title or generic template.
- [ ] Keep historic taxonomy versions resolvable and do not backfill historic learner observations with guessed tags.
- [ ] Keep exposure counts distinct from exercise completion, correctness, retention and mastery.
- [ ] Add misconception / confusion labels only where an exercise produces deterministic evidence for that misconception.

**Acceptance evidence:** Every new taxonomy tag has an authored-source rationale, versioned compatibility and tests; learner records remain immutable.

**Status:** Not started

### CURR-P2-03 — Improve retention and musical transfer

- [ ] Add delayed checks for high-value skills and review / capstone lessons.
- [ ] Ask learners to retrieve without immediately seeing the lesson explanation.
- [ ] Vary musical context when testing transfer: key, string set, register, rhythm, progression or repertoire.
- [ ] Keep review intervals as configurable heuristics, not claims of universally optimal spacing.
- [ ] Give specific next-step feedback from the learner's evidence rather than from elapsed time alone.

**Acceptance evidence:** Retention and transfer prompts exist for priority skills and do not misrepresent practice exposure as mastery.

---

## 9. Authoring standard and quality gates

Every lesson changed under this tracker must meet this minimum contract:

- [ ] **Objectives:** At least three distinct, observable objectives where appropriate: understand/name, perform, and apply/transfer/create. Do not reuse generic template sentences.
- [ ] **Explanation:** Accurate and specific to this lesson's focus. The explanation must not be copied from an unrelated topic family.
- [ ] **Demonstration:** Ordered steps that tell the learner what to play, listen for, notice and correct.
- [ ] **Worked example:** Concrete notes, strings, frets, chord spellings, rhythm counts, scale formula, phrase or original musical prompt where relevant.
- [ ] **Practice:** Focused exercise, musical application and retrieval are separate and directly relevant to the learning goal.
- [ ] **Success criteria:** Specific enough that a learner or reviewer can tell whether the task was performed successfully.
- [ ] **Evidence type:** Correctly distinguish measured, observed/self-checked, self-reported and recording-reviewed evidence.
- [ ] **Mistakes and corrections:** Include realistic mistakes paired with actionable corrections.
- [ ] **Accessible alternative:** Reduce complexity, range, tempo or duration while retaining the musical intention.
- [ ] **Transfer:** Where appropriate, use a changed context rather than repeating the exact same drill.
- [ ] **Pacing:** Explain that week numbering is an ordering aid, not a seven-day deadline.
- [ ] **Safety:** Include relevant comfort guidance; never diagnose or prescribe treatment.
- [ ] **Copyright:** Use original, learner-created, licensed or public-domain examples. Link to protected commercial material rather than reproducing it.
- [ ] **Privacy:** Keep learner progress, recordings, confidence and assessment history out of public curriculum source files.

### Human musical review

- [ ] Chord spellings and guitar voicings are musically correct and playable.
- [ ] TAB line order, string/fret positions and note names are correct.
- [ ] Rhythm notation, subdivision and bar counts are internally consistent.
- [ ] Scale / mode formulas and chord-tone examples are correct.
- [ ] Prerequisites and difficulty are appropriate for the target stage.
- [ ] Physical instructions are comfortable and avoid unnecessary strain.
- [ ] Accessible alternatives preserve the intended learning outcome.

**Acceptance evidence:** Each content batch has a named reviewer or explicit review record, not just a machine validator result.

---

## 10. Catalogue and documentation alignment

### CURR-P2-04 — Resolve candidate skill-definition gaps

The following are candidates for review, not approved new identifiers:

- [ ] Clean fretting / individual-note tone: compare all existing technique and instrument skills before deciding whether a new ID is necessary.
- [ ] Staff notation / sight-reading: `docs/CURRICULUM_CONTENT_MODEL.md` references `notation.staff`, but the active catalogue currently contains only the TAB notation skill. Decide whether staff reading should be represented as a distinct skill or remain optional content outside the current assessable catalogue.
- [ ] Arpeggios: verify whether the content-model example `lead.arpeggios` should be a real catalogue skill or whether current chord-tone / harmony definitions sufficiently cover the outcomes.
- [ ] Slides and dynamics: review whether these are subcriteria under phrasing or require separately assessable skills.
- [ ] Clarify the boundaries of broad skills such as repertoire, open chords, scale patterns and performance recovery.

- [ ] Record the owner decision for each candidate.
- [ ] If new IDs are approved, version the catalogue and all dependent schemas, mappings, assessment profiles, tests and release manifests.
- [ ] Do not change the meaning of an existing skill ID in place.

**Acceptance evidence:** Every candidate has a recorded keep / add / defer decision with rationale and compatibility implications.

**Status:** Not started

### CURR-P2-05 — Bring audit documents up to date

- [ ] Update the mapping register source baseline from v1.0.2 to the active reviewed release.
- [ ] Reconcile the counts in the lesson-quality, coverage, mapping and authoring-pilot reports.
- [ ] Distinguish historical findings from current source facts.
- [ ] Link this tracker from the relevant curriculum documentation / implementation tracker.
- [ ] Update this tracker after each merged batch with PR number, changed lesson IDs, validation result and reviewer evidence.
- [ ] Close tasks only after their acceptance criteria are met.

**Acceptance evidence:** No active curriculum tracker presents stale release IDs or historical counts as current facts.

**Status:** Not started

---

## 11. Validation and release checklist

Run the repository's curriculum integrity validation for every curriculum-data batch:

```sh
node scripts/validate-curriculum.mjs
```

Also complete the applicable repository checks for each PR:

- [ ] Prettier / formatting.
- [ ] Type checking and Svelte checks where relevant.
- [ ] Unit and integration tests.
- [ ] Curriculum validator and curriculum-specific tests.
- [ ] Full required CI.
- [ ] Manual learner-flow / browser acceptance where lesson rendering or practice behaviour changes.
- [ ] Guitar / music-content review for substantive musical edits.
- [ ] Release manifest and migration fingerprint checks where curriculum releases or migrations change.

### Curriculum data integrity

- [ ] 52 Year 1, 52 Year 2 and 48 Year 3 lessons remain linked to the correct outline records.
- [ ] Stable lesson IDs and week IDs are unique and unchanged unless specifically approved.
- [ ] Exercise IDs remain unique.
- [ ] Every lesson skill ID exists in the active catalogue.
- [ ] Every skill catalogue entry is deliberately represented or marked as deferred / not currently taught.
- [ ] Prerequisite references are valid and acyclic.
- [ ] All lesson outline checkpoints match their authored lesson counterparts.
- [ ] Release manifests and immutable curriculum snapshots remain consistent.
- [ ] No learner-specific data has entered public content.

**Release acceptance:** All required automated checks pass, all curriculum-owner decisions are recorded, and human musical review is complete for the changed content.

---

## 12. Progress log

Append one entry for every implementation batch. Keep entries chronological; do not rewrite historical evidence.

| Date | PR / commit | Scope / lesson IDs | Validation | Reviewer | Status / notes |
|---|---|---|---|---|---|
| 2026-11-18 | Audit baseline | 152 lessons / 391 mappings | Source metrics inspected | Pending | Tracker created; no curriculum data changed by the audit |

### Decision log

| Date | Decision | Rationale / evidence | Approved by | Related task / PR |
|---|---|---|---|---|
|  |  |  |  |  |

### Blockers and deferred items

| Item | Blocker / reason | Owner | Next review date | Status |
|---|---|---|---|---|
| Year 1 Week 2 skill mapping / clean-fretting taxonomy decision | Owner decision required before changing the mapping or introducing an ID | Curriculum owner |  | Blocked — owner decision |

---

## 13. Overall completion criteria

The curriculum audit can be closed only when:

- [ ] Both P0 instructional errors and the identified Year 2 scope/mapping issues are resolved and reviewed.
- [ ] All 48 Year 3 lessons are fully task-specific and reviewed.
- [ ] All 104 Year 1 / Year 2 lessons meet the authoring standard.
- [ ] All 152 lessons have an explicit prerequisite / no-prerequisite decision.
- [ ] All 391 current skill associations have an evidence-backed disposition.
- [ ] All 34 skills have a reviewed introduction → practice → independent performance → retention → transfer progression, or a documented reason why a stage is not applicable.
- [ ] Candidate taxonomy gaps have approved decisions.
- [ ] Assessment profiles have appropriate human review and remain non-automated until justified.
- [ ] Required curriculum validation, repository CI and human musical review pass.
- [ ] Documentation and release metadata reflect the same current curriculum baseline.
- [ ] Learner history, release compatibility and privacy guarantees are preserved.

**Closure rule:** Do not mark the curriculum “complete” solely because all JSON files validate, all lesson cards render, or every week has a title and checkpoint. Completion requires instructional specificity, musical accuracy, coherent progression and evidence that the learner can apply and retain the skills.
