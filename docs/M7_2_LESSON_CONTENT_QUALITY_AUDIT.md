# M7.2 — Authored Lesson Content Quality Audit

**Status:** Dataset-level quality scan complete; 12 Rock & Blues lessons remediated; 36 Year 3+ specialist lessons and broader curriculum remediations remain open  
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

The 48 Year 3+ specialist lessons were checked separately:

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

Pilot a high-quality rewrite on a representative 12-lesson batch containing basic chords, rhythm, fretboard, ear learning, technique, harmony and performance. Use the draft assessment profiles as guidance, then compare the result with the existing generic structure before applying the authoring standard across the remaining lessons.
