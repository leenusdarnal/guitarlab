# M7.2 — Authored Lesson Content Quality Audit

**Status:** Dataset-level quality scan complete; Rock & Blues and Fingerstyle & Acoustic routes complete; Jazz & Harmony Weeks 1–4 remediated; 20 Year 3+ specialist lessons and broader curriculum remediations remain open  
**Scope:** 152 authored lessons across Year 1, Year 2 and Year 3+  
**Purpose:** Find structural weaknesses that can make lessons appear complete while leaving learners with generic objectives or non-discriminating assessment criteria.

## 1. Executive finding

The counts in Sections 1–4 describe the initial 152-lesson scan before targeted authoring. Current post-remediation counts are recorded in Section 9 so the original baseline remains auditable.

The 152 lessons contain substantial authored material, but several high-level instructional fields are heavily templated:

- Learning objective 2 is identical in all **152/152** lessons: “Perform the target task accurately at a comfortable, controlled tempo.”
- Learning objective 3 is identical in all **152/152** lessons: “Apply the skill in a short musical context and identify one next improvement.”
- Three success criteria are repeated verbatim in all **152/152** lessons. These account for **456 of 760** success-criterion entries (60%).
- `explanation.keyIdea` contains only **13 distinct texts** across 152 lessons. The largest groups are 33 chord lessons, 29 performance/review lessons, 15 rhythm lessons and 14 arrangement/songwriting lessons.
- `explanation.plainLanguage` has 152 different strings, but follows the same generic template: “This lesson focuses on [focus]. First understand the sound or movement, then practise a small part, then return to the musical whole…”

This does not mean every lesson is poor or that shared explanations are inherently wrong. It means a lesson can satisfy structural completeness checks without having sufficiently specific objectives, explanatory content or criteria for its own checkpoint.

## 2. Measured dataset findings

| Measure | Observed result | Interpretation |
|---|---:|---|
| Authored lessons | 152 | Full source coverage |
| Learning objective 2, most common exact text | 152/152 | No skill-specific second objective |
| Learning objective 3, most common exact text | 152/152 | No skill-specific application/reflection objective |
| Success-criteria entries | 760 total | Approximately five entries per lesson |
| Three most common success criteria | 152 uses each | 60% of all criteria are identical across the curriculum |
| Distinct `explanation.keyIdea` texts | 13 | Family-level boilerplate needs lesson-level application |
| Distinct `explanation.plainLanguage` texts | 152 | Unique focus is inserted into one repeated generic prose frame |

The three criteria shared by every lesson are:
1. “The notes or chords are clear enough for the task and the pulse remains understandable.”
2. “Movement remains relaxed; stop and reset if pain, numbness or tingling occurs.”
3. “The learner can explain the key idea and apply it in the week's musical example.”

The safety/comfort criterion is valuable as a general guardrail. The other two are reasonable general principles, but they are too broad to act as the only evidence for whether a learner can perform a specific skill.

## 3. Reuse of key-idea explanations

The 13 key-idea templates are distributed as follows:

| Topic-family explanation | Lesson count |
|---|---:|
| Chords and voicings | 33 |
| Performance preparation/recovery | 29 |
| Rhythm and pulse | 15 |
| Arrangement and songwriting | 14 |
| General music-theory relationships | 10 |
| Fretboard note map | 9 |
| Scale patterns | 8 |
| Blues playing | 8 |
| Ear-learning process | 8 |
| Fingerstyle roles | 7 |
| Tablature/notation | 6 |
| Picking and legato technique | 3 |
| Instrument setup/tuning/posture | 2 |
| **Total** | **152** |

A reusable family explanation can be pedagogically appropriate. The weakness is when the lesson does not add a worked example, task explanation or criterion that makes the family concept specific to that week's learning outcome.

## 4. Year 3+ has an additional specificity gap

The 48 Year 3+ specialist lessons were checked separately in the initial scan. Since then, all 12 Rock & Blues lessons (Weeks 1–12) have received task-specific authoring; the other 36 specialist lessons remain open. The initial findings below are retained as the pre-remediation baseline:

- **48/48** use the same generic second and third learning objectives as the full curriculum.
- **48/48** use a checkpoint of the form “Demonstrate [lesson title] in a short musical example, explain the key choice and identify one next improvement.”
- **48/48** contain a worked example of the form “Create or perform an original 4- to 8-bar example demonstrating [lesson title].”
- There are only **44 distinct checkpoints** across the 48 lessons.
- The lessons are split across Rock & Blues, Fingerstyle Acoustic, Jazz Harmony and All-Round Musician routes, but the generated worked example does not specify the actual key, progression, rhythmic feel, technique constraints or listening target required for the named lesson.

These fields provide a useful capstone shell, but they are not yet sufficient lesson content for an advanced learner. The Y3+ pathway should be treated as a high-priority authoring remediation: each lesson needs a concrete musical brief, task constraints, relevant skill-specific criteria and a check that transfers the idea beyond the exact example.

## 5. Why this matters

1. **Assessment validity:** A learner can satisfy a generic “clear notes and steady pulse” criterion without demonstrating the actual lesson target, such as a ii–V–I voice-leading connection, a bend to a target pitch, or an interval-recognition task.
2. **Adaptive recommendations:** If assessment criteria do not distinguish the skill being assessed, the system can record an outcome against a skill ID without evidence that the intended construct was tested.
3. **Learner clarity:** Generic objective text does not tell learners what success looks or sounds like in this lesson.
4. **Curriculum progression:** Repeated family explanations can hide whether a later lesson genuinely extends a prior skill or simply repeats its vocabulary.
5. **Feedback quality:** Feedback should refer to a task-specific criterion and a next action, not merely “play accurately” or “practise more.”

This aligns with the research review in `M7_2_EVIDENCE_BASED_CURRICULUM_REVIEW.md`: music assessment needs skill-relevant criteria and context-sensitive descriptors; self-regulated practice needs clear goals, monitoring and reflection; a current performance result is not proof of durable learning.

## 5. Recommended authoring standard

Each authored lesson should retain the current structural fields but provide lesson-specific content in the key assessment locations.

### Learning objectives
- Objective 1: state the concept or technique being learned.
- Objective 2: name the exact performance, recognition or creation task and an observable quality target.
- Objective 3: require application, transfer, comparison or reflection that is specific to the lesson.

### Success criteria
Each lesson should have at least:
- one criterion that tests the primary skill named by the lesson;
- one criterion for quality/control appropriate to that skill (for example intonation, timing, articulation, note location, coordination or musical form);
- one criterion for application, retention or explanation where appropriate.

Keep safety, accessibility and general musicianship guidance, but do not let identical boilerplate criteria replace the skill-specific criteria.

### Explanation and worked examples
- Reuse concise foundational explanations where appropriate.
- Add a task-specific worked example that directly demonstrates the lesson checkpoint.
- Show a common error and a corrective strategy relevant to that task.
- Where an exercise uses a different context from the focus, explain why it is included.

### Assessment and feedback
- Match the assessment mode to the skill: performance, aural response, notation/fretboard response, recording/reflection or creation.
- Keep subjective outcomes open to human judgement.
- Do not apply universal numeric thresholds before level/style-specific rubric validation.
- Add delayed retention and changed-context transfer checks for important skills; do not treat live feedback as proof of mastery.

## 6. Recommended remediation order

| Priority | Work | Scope | Acceptance evidence |
|---|---|---|---|
| P0 | Correct the two unsupported mappings identified in the focused review, after curriculum-owner approval | Year 1 Weeks 2 and 20 | Decision recorded; corrected lesson objectives, explanation and mapping agree |
| P0 | Rewrite generic objective 2 and 3 as task-specific objectives | First representative batch of 12 lessons, then all 152 | Objectives name an observable task and a distinct application/transfer/reflection outcome |
| P0 | Add task-specific success criteria | Same batch, then all 152 | At least two non-boilerplate criteria per lesson directly match its checkpoint |
| P1 | Improve family-level key ideas with lesson-specific examples and error correction | Start with the 33 chord/harmony lessons and the 29 performance/review lessons | Each lesson's worked example and key criterion test its actual target |
| P1 | Align skill mapping, lesson objective and assessment profile | All 152 lessons | A reviewer can trace each mapped skill to a concrete learning outcome and evidence cue |
| P2 | Add delayed retention and transfer prompts | High-value skills and review/capstone lessons | Evidence is collected without immediate instructional prompts and in a changed context |

## 7. Safe implementation rules

- Do not rewrite all 152 lessons with a single automated text substitution.
- Do not remove the repeated posture/safety criterion simply because it is shared.
- Do not treat a lesson's broad family explanation as proof of a particular skill mapping.
- Work in batches and preserve the lesson's existing ID, route, week, checkpoint intent and stable skill IDs unless a reviewed decision explicitly changes them.
- Add a non-blocking curriculum-quality diagnostic before turning duplication thresholds into hard CI failures.
- Promote the quality gate from advisory to blocking only after existing content has been remediated and the curriculum owner approves the standard.

## 8. Next action

The Rock & Blues and Fingerstyle & Acoustic routes have both been completed across Weeks 1–12. The next specialist batch is Jazz & Harmony Weeks 1–12. Continue route-by-route, then return to the highest-impact generic objectives and criteria across the 104 Year 1–2 lessons.


## 9. Historical remediation state after Rock & Blues (2026-11-14)

The Year 3 Rock & Blues route is now fully authored across Weeks 1–12. Weeks 1–4 were improved in release `curriculum-v1.0.1`; Weeks 5–12 were completed in release `curriculum-v1.0.2`. All 12 stable lesson IDs remain unchanged, and the 34-skill catalogue remains at version 1.0.0. Weeks 5–12 received revised skill mappings where the prior associations did not match the actual musical task.

A fresh count across the 152 current lesson records gives:

| Measure | Current result | Remaining interpretation |
|---|---:|---|
| Generic learning objective 2 | 108/152 | 44 lessons remediated; 108 still use the original generic sentence |
| Generic learning objective 3 | 108/152 | 44 lessons remediated; 108 still use the original generic sentence |
| Each of the three formerly repeated criteria | 140 occurrences each | Retained in the 140 lessons not yet rewritten; the 12 Rock & Blues lessons have task-specific criteria |
| Distinct `explanation.keyIdea` texts | 25 | Increased from the initial 13 as route-specific explanations were added |
| Year 3+ specialist generic objective 2 | 36/48 | The 12 Rock & Blues lessons are specific; 36 lessons across the other three routes remain generic |
| Year 3+ specialist generic objective 3 | 36/48 | Same remaining route coverage as above |
| Year 3+ generic capstone-style checkpoint | 36/48 | The 12 Rock & Blues checkpoints are task-specific; 36 remain open |
| Year 3+ specialist lessons with task-specific objectives/checkpoints | 12/48 | Rock & Blues is complete; Fingerstyle Acoustic, Jazz Harmony and All-Round Musician remain |

The original duplicated-criteria and generic-objective findings are therefore not resolved curriculum-wide. Do not promote the advisory duplication diagnostic to a blocking global threshold yet. Continue small, route-level authoring batches and recalculate the audit after each release.

**Next batch:** Fingerstyle & Acoustic Weeks 1–12. Preserve its specialist techniques and existing skill identifiers unless a reviewed mapping decision supports a change. The target is the same observable lesson contract used in the Rock & Blues completion: three distinct objectives, concrete demonstration and checkpoint, at least five task-specific criteria, corrective feedback, an accessible alternative, retrieval and delayed transfer guidance.


## 10. Current remediation state after Fingerstyle & Acoustic (2026-11-14)

The Year 3 Rock & Blues and Fingerstyle & Acoustic routes are now fully authored across Weeks 1–12. Rock & Blues was completed in releases `curriculum-v1.0.1` and `curriculum-v1.0.2`; Fingerstyle & Acoustic was completed in `curriculum-v1.0.3`. All 24 stable lesson IDs and lesson-block IDs remain unchanged. The canonical skill catalogue remains at 34 identifiers and version 1.0.0. Fingerstyle skill mappings were expanded or corrected where the previous associations did not adequately represent the taught performance task.

A fresh count across all 152 current lesson records gives:

| Measure | Current result | Remaining interpretation |
|---|---:|---|
| Generic learning objective 2 | 128/152 | 24 lessons remediated; 128 still use the original generic sentence |
| Generic learning objective 3 | 128/152 | 24 lessons remediated; 128 still use the original generic sentence |
| Each of the three formerly repeated criteria | 128 occurrences each | Retained in the 128 lessons not yet rewritten; both completed routes have task-specific criteria |
| Distinct `explanation.keyIdea` texts | 37 | Increased as route-specific teaching explanations were added |
| Year 3+ specialist generic objective 2 | 24/48 | Remaining instances are all in Jazz & Harmony and All-Round Musician |
| Year 3+ specialist generic objective 3 | 24/48 | Same remaining route coverage |
| Year 3+ generic capstone-style checkpoint | 24/48 | Remaining instances are all in Jazz & Harmony and All-Round Musician |
| Year 3+ specialist lessons with task-specific objectives/checkpoints | 24/48 | Rock & Blues and Fingerstyle & Acoustic complete; two specialist routes remain |

The remaining specialist routes are:
- Jazz & Harmony — 12 lessons
- All-Round Musician — 12 lessons

The original repeated criteria and generic objectives are not resolved curriculum-wide. Do not promote the advisory duplication diagnostic to a blocking global threshold yet. Continue small, route-level authoring batches and recalculate the audit after each release.

**Next batch:** Jazz & Harmony Weeks 1–12. Preserve jazz-specific harmonic, rhythmic, ear-training and improvisation intent; map only to existing skill identifiers unless a separately reviewed catalogue change is justified. Use the same lesson contract: three distinct objectives, concrete demonstration and worked example, task-matched application/checkpoint, five task-specific criteria, corrective feedback, accessible alternatives, retrieval and delayed transfer guidance.


## 11. Current remediation state after Year 1 / Year 2 pilot (2026-11-14)

Release `curriculum-v1.0.4` carries the representative Year 1 / Year 2 authoring pilot onto the completed Year 3 baseline. Twelve Year 1 / Year 2 lessons now have task-specific objectives, checkpoints, worked examples, practice stages, corrections, five task-specific criteria and accessible alternatives. The batch also records 13 high-confidence mapping decisions (four pilot mappings retained/reviewed and nine additional correction sets), without adding or deleting skill identifiers.

A fresh scan across all 152 lessons in the combined curriculum gives:

| Measure | Current result | Remaining interpretation |
|---|---:|---|
| Generic learning objective 2 | 116/152 | 36 lessons now use task-specific objectives; 116 remain generic |
| Generic learning objective 3 | 116/152 | Same 36 rewritten lessons; 116 remain generic |
| Each of the three formerly repeated success criteria | 116 occurrences each | Retained in the 116 lessons not yet rewritten; task-specific criteria now supplement the 36 remediated lessons |
| Distinct `explanation.keyIdea` texts | 49 | Increased from the initial 13 as route-specific explanations were added |
| Year 1 / Year 2 lessons with task-specific authoring | 12/104 | 92 Year 1 / Year 2 lessons remain outside the authored pilot |
| Year 3+ specialist lessons with task-specific objectives/checkpoints | 24/48 | Rock & Blues and Fingerstyle & Acoustic are complete; Jazz & Harmony and All-Round Musician remain |
| Lesson-to-skill associations | 387 | All 34 stable skill IDs remain represented; 10 high-confidence associations were removed or corrected against lesson tasks |

The mapping decision register records a first batch of 25 lesson rows; 127 rows still require a full mapping disposition. The quantitative coverage audit is refreshed in `M7_2_PROGRESS_AND_COVERAGE_AUDIT.md`, but prerequisite, retention and transfer review remains open.

These changes are content and mapping improvements, not validated grading rubrics. All 34 assessment profiles remain draft; numeric cut scores, automated pass/fail decisions and automatic mastery carry-forward remain disabled. Previous release rows and learner evidence remain attached to their original releases.

**Next batch:** Jazz & Harmony Weeks 1–12. Preserve jazz-specific harmonic, rhythmic, ear-training and improvisation intent; use existing skill identifiers and require an explicit evidence-backed decision before introducing any new identifier.


## 12. Current remediation state after Jazz & Harmony batch 1 (2026-11-14)

Release `curriculum-v1.0.6` now includes task-specific authoring for Jazz & Harmony Weeks 1–8. Weeks 5–8 add chord-extension spellings and partial voicings, an integrated comping review, a bossa-inspired two-layer starter pattern and a 12-bar jazz-blues form with one explicit variation. Stable lesson IDs and all 34 skill identifiers are retained; only evidence-aligned mapping changes are introduced.

A fresh source scan across all 152 authored lessons gives:

| Measure | Current result | Remaining interpretation |
|---|---:|---|
| Generic learning objective 2 | 112/152 | 40 lessons now use task-specific objectives; 112 remain generic |
| Generic learning objective 3 | 112/152 | Same 40 remediated lessons |
| Year 3+ specialist lessons with task-specific objectives/checkpoints | 28/48 | Rock & Blues and Fingerstyle & Acoustic are complete; Jazz & Harmony Weeks 1–4 are complete |
| Year 3+ specialist lessons still using generic objectives | 20/48 | Jazz & Harmony Weeks 5–12 (8) and All-Round Musician Weeks 1–12 (12) remain |
| Year 1 / Year 2 lessons with task-specific authoring | 12/104 | 92 Year 1 / Year 2 lessons remain outside the representative pilot |
| Lesson-to-skill associations | 391 | All 34 stable skill IDs remain represented |

Jazz & Harmony Weeks 5–8 are now authored in v1.0.6; the next route batch is Weeks 9–12. Assessment profiles remain draft, immutable release records and learner evidence are preserved, and no universal numeric pass thresholds are introduced.
