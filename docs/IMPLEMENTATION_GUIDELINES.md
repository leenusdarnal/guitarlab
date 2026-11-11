# GuitarLab Implementation Guidelines

**Status:** Implementation baseline for the first application build  
**Repository:** `leenusdarnal/guitarlab`  
**Purpose:** Translate the product, curriculum and visual-design decisions into an implementable guide. This document supplements the product specification, curriculum, architecture, release scope and roadmap; it does not replace the authored curriculum or existing technical decisions.

## 1. Product intent

GuitarLab is a personal, adaptive guitar-learning environment that helps a learner understand what to practise, see and hear how to do it, practise with useful tools, demonstrate what they can do, and decide what to learn next.

The product must work for different learners rather than assuming everyone has the same guitar, schedule, goals, ability, preferred teaching format or practice routine. The curriculum is shared and authored; the learning plan, lesson presentation, practice selection and progress are specific to each learner profile.

The product is a learning platform and practice companion—not a DAW, social network, generic video course catalogue or AI-chat wrapper.

### Core experience loop

1. **Learn:** introduce one manageable idea.
2. **See and hear:** show a clear visual or audio demonstration where useful.
3. **Practise:** isolate the skill at a comfortable pace.
4. **Apply:** use it in a musical phrase, progression or repertoire item.
5. **Recall and test:** retrieve the idea and demonstrate the skill without relying on the explanation.
6. **Record:** capture the practice and evidence accurately.
7. **Adapt:** recommend the next useful action and explain why.

A learner can repeat, split, skip or revisit practice blocks. The app must not advance the curriculum solely because a lesson was opened, a timer ran or a calendar week elapsed.

## 2. Design direction

### Approved direction: a deliberate hybrid

Use the structural clarity and interactive-tool emphasis of the **Modern & Interactive** concept, the acoustic warmth and instrument photography of the **Classic Academy** concept, and the restrained hierarchy and low-distraction focus of the **Focused Learner** concept.

This is a design direction, not a mandate to copy a generated mockup pixel for pixel. Generated mockups are visual inspiration only; their sample labels, dates, percentages, lesson counts and curriculum groupings are not authoritative product data.

### Visual language

- Base surface: deep graphite/charcoal, with a carefully tested light theme.
- Primary accent: warm amber/orange, used for the main learning action and active states.
- Secondary accent: restrained violet/blue for tools, theory and supporting categories; do not use every colour everywhere.
- Atmosphere: real acoustic-guitar details and selective instrument imagery, balanced with crisp diagrams and interactive fretboard graphics.
- Typography: highly legible sans-serif for interface and lesson text; optional monospaced type for TAB, note names, fret positions, tempo and technical readouts.
- Layout: generous spacing, clear hierarchy and simple grouped surfaces. Avoid a grid of cards for every piece of content.
- Tone: encouraging, intelligent and calm. Avoid punitive streaks, noisy gradients, casino-style reward loops and shame language.
- Dark and light themes must both meet contrast requirements. Do not make the dark theme the only usable theme.

### Interaction principles

- Mobile-first; the app is used beside a guitar, often with one hand available.
- Primary actions need generous touch targets and clear labels.
- Lesson content should be scannable, with one main action at a time.
- Practice mode should reduce navigation and visual noise. Keep the current drill, timer/metronome and essential controls in reach.
- Use progressive disclosure for advanced theory and tools. Do not expose a beginner to every advanced fretboard mode on Day 1.
- Show save/offline/sync status without interrupting practice.
- Provide useful empty, loading, error, permission-denied and offline states.

## 3. Information architecture

Use a compact navigation system with these primary areas:

1. **Home / Today:** next recommended action, today's personalised practice, current lesson, due reviews and a small progress summary.
2. **Learn:** curriculum map, lessons, explanations, visual demonstrations and checkpoints.
3. **Practice:** focused practice studio, routines, timer, metronome, exercise history and session reflection.
4. **Tools:** fretboard, notes, intervals, scales, chord library, tuning/reference tones and theory references.
5. **Songs / Library:** level-appropriate repertoire, saved songs, riffs, sections and permitted external learning resources.
6. **Progress:** skill map, lesson states, assessment evidence, review queue, practice history, recordings and export/restore.
7. **Profile / Settings:** learner preferences, instrument setup, lesson presentation, goals, schedule, theme, accessibility and privacy controls.

On a narrow screen, use a compact bottom navigation for the most frequent areas and place secondary tools under a clearly labelled More/Tools destination. On desktop, use restrained side navigation and a wide content area.

### Dashboard content order

Prioritise the learner's next useful action, not vanity metrics:

- Greeting and current learner goal.
- One primary recommended practice action with a short reason.
- Today's personalised time plan and a visible option to edit it.
- Resume current lesson or continue the next lesson.
- A compact view of skills due for review.
- Progress overview and next milestone.

Never hard-code a sample lesson, percentage, streak, week number or pathway into the dashboard. Render these from the active learner profile and curriculum state. A fresh learner should clearly see that progress is at zero and that the starting route is Year 1 Week 1.

## 4. Learner-specific setup and preferences

### First-run onboarding

Create a short, friendly, skippable onboarding flow. Ask only for information that materially changes instruction or recommendations. Allow the learner to skip uncertain answers and edit every preference later.

Collect these preference groups:

| Group | Per-learner settings |
|---|---|
| Instrument | Acoustic, electric, classical or other; string count; tuning preset; handedness |
| Starting point | Fresh beginner by default; optional in-app placement activity; self-described musical background |
| Goal | All-round musician, acoustic/fingerstyle, rock/blues, jazz/harmony, singer-songwriter/accompaniment, or a custom goal; allow primary and secondary goals |
| Practice schedule | Preferred minutes per session, available days, weekly target and preferred reminder behaviour |
| Lesson presentation | Balanced, visual-first, demonstration/audio-first, text/reading-first, interactive/drill-first or song-first |
| Practice emphasis | Adjustable emphasis across technique, rhythm, repertoire, theory, ear training, creativity and performance |
| Pace and guidance | Short/steady/deep explanation preference, repetition tolerance, feedback detail and review intensity |
| Accessibility | Text size, reduced motion, contrast/theme, left-handed diagram orientation, captions and alternative text-led instructions |
| Musical interests | Preferred styles, song difficulty, repertoire interests and content to avoid |

Do not require a learner to answer every field before starting. At minimum, capture enough information to choose an appropriate instrument presentation and useful first session. Offer a sensible balanced route when a learner skips goal or presentation preferences.

### Private profile values and shared defaults

Do not store any individual's instrument, experience level, schedule, goals, lesson-format choices or progress baseline in shared source files. Collect those values through the learner's own profile setup and keep them in private local profile storage. A project conversation or test example is not a source of global product defaults.

If a learner skips a field, leave it unset or use an explicitly documented neutral fallback. In particular, do not infer handedness.

### Per-profile isolation

- All preferences, practice plans, schedules, progress, notes, recordings and assessment evidence belong to the active learner profile.
- Never store personal profile values in the public curriculum JSON.
- Never let one learner's settings, practice history or mastery affect another learner.
- The initial release may remain local-first and single-active-profile per browser installation, but model profile ownership explicitly so multiple profiles and secure sync can be added without redesigning the curriculum.
- A profile may be reset only through an explicit, clearly explained action. Export/restore must be available before destructive reset where feasible.

## 5. Personalised lesson and practice planning

### Shared curriculum, personalised delivery

Do not generate a separate, conflicting syllabus for each learner. Use the stable, authored curriculum as the source of truth. Personalisation changes the lesson's presentation, chosen exercises, session duration, practice emphasis, review schedule and next action—not the stable lesson IDs, prerequisite meaning or authored learning outcomes.

Build each learner's plan from:

- instrument and tuning configuration;
- current curriculum position and prerequisites;
- demonstrated skill evidence and review-due skills;
- primary and secondary goals;
- available practice time and chosen weekly schedule;
- preferred lesson presentation and explanation depth;
- stated confidence/difficulty and recent practice results;
- saved repertoire interests and accessibility preferences.

Recommendations should initially be deterministic and explainable. Show a concise reason such as: “This review is suggested because your last two chord-change attempts were uneven.” Let the learner accept, edit, postpone or dismiss a recommendation. Never silently mark a lesson complete or change a learner's goal.

### Lesson presentation types

A learner should be able to select a preferred teaching mix, and change it at any time:

- **Visual-first:** labelled guitar images, fretboard views, chord diagrams, fingering maps and step illustrations.
- **Demonstration-first:** short video/audio examples or linked demonstrations, followed by a concise explanation and a practical task.
- **Text-first:** plain-language explanation, worked examples, TAB/notation where appropriate and a written checklist.
- **Interactive-first:** quizzes, note identification, fretboard interaction, rhythm challenges and guided checkpoints.
- **Song-first:** introduce a musical example early, then teach the technique/theory needed to play it.
- **Balanced:** mix the most useful formats for the current topic.

A lesson can combine several presentation types. Do not promise video or audio for every lesson if a valid media asset is unavailable. Every lesson must remain understandable using its self-contained text and visual fallback.

### Practice-plan types and durations

Offer flexible session lengths, including 10, 20 and 40 minutes plus a custom duration. The learner's preferred duration is a personal setting, not a universal product rule.

A session composer should select only a useful subset of activities for the available time. It can choose from preparation, warm-up, new learning, technique drill, rhythm, review, ear/theory work, song application, retrieval and reflection. It must not compress every category into a rushed short session.

Allow the learner to save named routines, for example:

- Balanced daily practice.
- Technique-focused practice.
- Rhythm and accompaniment.
- Lead and improvisation.
- Fingerstyle and acoustic.
- Song/repertoire session.
- Theory and ear-training session.
- Custom routine.

These are starting templates, not locked plans. Each routine should be editable and stored within the learner profile.

### All-round goal handling

For a learner selecting All-Round Musician, provide broad exposure to rhythm, lead, fingerstyle, repertoire, theory/harmony, ear training, reading, creativity and performance over time. Do not force all domains into every 20-minute session. Balance the weekly and monthly plan while protecting the current lesson's prerequisites.

A learner with a different goal should receive a different emphasis while retaining the shared foundations. Allow goal priorities to change without deleting previously earned evidence.

## 6. Canonical curriculum: preserve exactly

The existing repository curriculum is the source of truth. Do not replace it with the invented phase labels shown in generated design examples.

| Route | Structure |
|---|---|
| Year 1 | 52 weekly lessons: Beginner Base (Weeks 1–12), Skills in Context (13–24), Early Intermediate (25–36), Intermediate Bridge (37–52) |
| Year 2 | 52 intermediate weekly lessons, covering fretboard/triads, rhythm guitar, scales/melody, blues, fingerstyle/acoustic arranging, repertoire/ear learning, harmony, jazz and independent musicianship |
| Year 3+ A | Rock & Blues, 12 specialist lessons |
| Year 3+ B | Fingerstyle & Acoustic, 12 specialist lessons |
| Year 3+ C | Jazz & Harmony, 12 specialist lessons |
| Year 3+ D | All-Round Musician, 12 specialist lessons |

There are 152 authored lessons in the repository: 52 Year 1, 52 Year 2 and 48 across the four optional specialisations.

Preserve stable IDs, prerequisite references, authored objectives, demonstrations, exercises, musical applications, success criteria, corrections, accessible alternatives and retrieval prompts. Validate curriculum changes with `node scripts/validate-curriculum.mjs`. Treat the four Year 3+ paths as optional specialisations, not as a misleading sequence of mandatory calendar years.

The learner's long-term goal affects recommendations and which optional pathway is suggested; it does not rewrite or delete the canonical course.

## 7. Teaching, mastery and feedback rules

### Lesson structure

Present each authored lesson using a consistent, readable order:

1. What the learner will be able to do.
2. Why the skill matters musically.
3. Explanation in plain language.
4. Visual/audio demonstration or text fallback.
5. Guided steps.
6. Focused exercise.
7. Musical application.
8. Common mistakes and corrections.
9. Checkpoint and retrieval questions.
10. Brief reflection and next-step recommendation.

The interface may rearrange or collapse sections to match the learner's preferred presentation, but must preserve all authored outcomes and safety/copyright notes.

### Completion is not mastery

Maintain separate state for lesson-content completion and skill mastery. Use the existing skill-state model: `not_started`, `learning`, `practising`, `stable` and `review_due`.

Evidence should distinguish objective measurements from learner self-report. Keep attempts append-only. Accuracy, sound/time, comfort/control, understanding and musical transfer are separate dimensions. A timer, streak, video watch or “mark complete” action is never proof of skill mastery.

Use non-punitive feedback. When a checkpoint is not ready, explain what to practise next and allow the learner to repeat or split the lesson.

## 8. Instrument and interactive tools

- The initial instrument model must be tuning-aware; standard six-string E–A–D–G–B–E is the initial supported path.
- Store pitches per string rather than hard-coding string labels throughout tool components.
- Mirror fretboard and chord diagrams for left-handed display without reversing pitch/string identity.
- Provide progressive fretboard modes: string/note identification first, then intervals/scale degrees, roots, scales/positions, chord tones/triads and CAGED exploration.
- Chord diagrams must clearly identify open, muted and fretted strings and finger positions.
- Chord-transition drills track clean changes separately from speed.
- Metronome and reference tones should work without microphone permission.
- Tuner/microphone permission must be requested only after an explicit learner action. Process audio locally by default and show uncertain/unsupported states honestly.
- Advanced tools should unlock progressively through navigation and curriculum context, not arbitrary reward gates.

## 9. Privacy, local-first operation and copyright

- Keep the learner profile, preferences, progress, practice notes, assessment attempts and recordings private in local application storage by default.
- The public repository contains generic curriculum and application code only.
- Do not commit real learner profiles, recordings, personal practice logs, authentication tokens or private fixtures.
- Clearly distinguish “saved on this device” from “synced”.
- Cloud sync remains disabled until authentication, per-profile authorisation and conflict handling are implemented and tested.
- Microphone and recording features are opt-in; never upload automatically.
- External learning tools are optional links, not runtime dependencies. Do not copy or host paid course videos, protected tabs, copyrighted books or recordings without permission.
- Stop practice when sharp pain, tingling, numbness or persistent hand/wrist pain occurs. GuitarLab is educational software, not medical advice.

## 10. Implementation sequence

1. **Guideline and design tokens:** implement the hybrid visual direction, semantic colour/typography/spacing tokens, responsive breakpoints, accessible focus and theme variants.
2. **Learner profile and onboarding:** create a versioned profile model and skippable, editable preference setup. Keep all values profile-scoped.
3. **Application shell:** mobile/desktop navigation, Today dashboard, empty state, loading/error/offline states and theme switch.
4. **Curriculum/lesson engine:** render existing authored lessons, routes, prerequisites, resume state and checkpoint flow without changing stable IDs.
5. **Personal plan composer:** produce explainable daily plans from goals, duration, presentation preferences, skill evidence and review needs.
6. **Practice capture:** timer, editable exercise blocks, metronome, tempo/repetition evidence, quick reflection and session history.
7. **Music tools:** fretboard, chords and foundational tuner/reference tones; then progressive advanced modes.
8. **Musicianship and repertoire:** theory, ear training, styles, songs, recording/review and optional pathways.
9. **Resilience and release:** local persistence, export/restore, PWA/offline, accessibility, privacy, security and mobile/desktop QA.

Do not begin by building every tool at once. Complete and test the end-to-end beginner learning loop first, then expand.

## 11. Acceptance checklist

Before the first useful release, verify that:

- [ ] A new learner can create a profile without an account and can skip optional questions.
- [ ] Instrument, handedness, tuning, time, goal and lesson-presentation preferences are editable.
- [ ] A learner's preferences never affect another profile or shared curriculum content.
- [ ] No individual's profile values are hard-coded in shared source, fixtures or global defaults; the learner can enter them privately.
- [ ] A learner can choose balanced, visual, demonstration, text, interactive or song-first lesson presentation.
- [ ] The 10/20/40/custom planner selects an appropriate amount of work rather than rushing through a fixed checklist.
- [ ] The next-practice recommendation exposes its reason and can be changed by the learner.
- [ ] All 152 authored lessons and all four specialisations remain available with stable IDs.
- [ ] Lesson completion and demonstrated skill mastery are stored separately.
- [ ] The app starts with zero progress and no imported history.
- [ ] Practice data remains available after reload and during offline use.
- [ ] Core flows are responsive, keyboard accessible and usable with either handedness.
- [ ] Microphone use is opt-in and audio privacy states are clear.
- [ ] Curriculum validation, type-check, lint, unit tests, end-to-end tests and production build pass before release.

## 12. Definition of done

A feature is not complete when its screen merely looks finished. It is complete when its user-specific behaviour, persisted data, error/empty/offline states, accessibility, privacy and relevant tests work; the documentation matches the shipped behaviour; and no private learner information is committed to the public repository.

## Related source-of-truth documents

- [Product specification](PRODUCT_SPEC.md)
- [Learning curriculum](CURRICULUM.md)
- [Curriculum content model](CURRICULUM_CONTENT_MODEL.md)
- [Design direction](DESIGN_DIRECTION.md)
- [Fresh learner profile policy](LEARNING_PROGRESS_MIGRATION.md)
- [First-release scope](RELEASE_SCOPE.md)
- [Implementation roadmap](ROADMAP.md)
- [Pre-implementation readiness](PRE_IMPLEMENTATION_READINESS.md)
