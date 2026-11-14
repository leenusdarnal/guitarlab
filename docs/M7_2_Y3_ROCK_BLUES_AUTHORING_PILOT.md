# M7.2 — Year 3 Rock & Blues Lesson Authoring Pilot

**Status:** Implementation pilot complete; CI and curriculum review pending  
**Curriculum dataset version:** 1.0.1  
**Scope:** Four Year 3 Rock & Blues lessons (Weeks 1–4)  
**Skill catalogue:** Unchanged at version 1.0.0 / release `curriculum-v1`

## 1. Purpose

Test a more specific lesson-authoring standard on a small, representative advanced-pathway batch before applying it to all 48 Year 3+ lessons.

The pilot replaces generic capstone-style objectives, checkpoints and worked-example prompts with concrete musical tasks that can be demonstrated and reviewed. It also separates related but distinct skills so that each has an observable criterion.

## 2. Lessons updated

| Lesson ID | Title | Specific task now assessed |
|---|---|---|
| `y3-rock-blues-w01-lesson` | Technique reset | Support the instrument comfortably, tune all six strings to standard tuning, recheck tuning and name strings without a chart |
| `y3-rock-blues-w02-lesson` | Pentatonic across neck | Connect A minor pentatonic boxes 1 and 2, name A–C–D–E–G and resolve a short phrase to A |
| `y3-rock-blues-w03-lesson` | Bends to pitch | Bend B-string fret 8 (G) to the A reference at fret 10, sustain/release cleanly and apply it in an A minor pentatonic phrase |
| `y3-rock-blues-w04-lesson` | Legato control | Perform a D/G string-crossing D–U–D–U cell and a B-string 5–7–5–7 picked/hammer-on/pull-off/hammer-on cell |

## 3. What changed in each lesson

Each lesson now has three lesson-specific learning objectives, a concrete checkpoint, targeted key-idea and plain-language explanations, explicit demonstration steps, task-specific musical application, tailored retrieval prompts, focused-practice instructions, reflection prompts, common errors and corrections, an accessible alternative, and revised worked examples.

Each lesson has five task-specific assessment criteria:
- Week 1: string identification, tuning accuracy, instrument support, comfort and independent recall.
- Week 2: major-scale understanding, pentatonic note set, position mapping, position connection and musical application.
- Week 3: target pitch, sustain/release, technique/comfort, pentatonic context and phrasing/time.
- Week 4: alternate picking, string crossing, legato articulation, timing/volume and control/comfort.

The pilot deliberately preserves an inclusive approach to posture and technique. Learners may adapt the setup and exercise to their comfort and mobility; pain or strain is not treated as a performance target.

## 4. Identity and data safety

- All four lesson IDs are unchanged.
- All four existing `skillIds` arrays are unchanged.
- The 34-skill catalogue is unchanged.
- The original `curriculum-v1` release remains immutable; the new authored snapshot is `curriculum-v1.0.1`.
- No learner assessment, practice observation or mastery record is migrated or rewritten.
- The Year 3 specialist lesson dataset version is incremented from 1.0.0 to 1.0.1 to identify this authored-content revision.

## 5. Acceptance checks for the pilot

- [x] All four target lesson records exist in the authored Year 3 specialist dataset.
- [x] Each has three explicit objectives and a concrete checkpoint.
- [x] Each has five skill/task-specific success criteria.
- [x] Worked examples and exercises match the named checkpoint.
- [x] Accessibility and common-error guidance remain present.
- [x] Stable lesson IDs and skill mappings are preserved.
- [x] An explicit immutable release manifest and D1 migration seed `curriculum-v1.0.1` alongside the original `curriculum-v1` snapshot.\n- [x] Local D1 checks assert both releases and all 152 lesson metadata rows remain present independently.\n- [ ] Curriculum validation CI passes on the pull request head.
- [ ] Formatting, application and browser acceptance CI passes.
- [ ] Curriculum reviewer approves task difficulty and note/fret examples.

## 6. What this pilot is testing

The pilot tests whether advanced lessons become clearer when the learner can answer:
1. What exact musical or technical task am I doing?
2. What should I hear or see when the task is successful?
3. What common error should I listen for?
4. How can I apply the skill in a musical phrase?
5. What should I recall or try later without the original prompt?

It does not yet establish a validated grading rubric. The draft skill assessment profiles remain separate and unapproved; this pilot's criteria are authoring guidance, not automatic pass/fail or mastery rules. The database migration adds a new release snapshot without updating or deleting any old progress, assessment or mastery evidence; no automatic carry-forward is performed.

## 7. Next stage

Run CI, review the pilot against learner-facing clarity and musical correctness, then decide whether to extend the same authoring pattern to the remaining 44 specialist lessons. Do not mass-rewrite the full specialist curriculum until this sample has been reviewed.
