# GuitarLab Implementation Roadmap

## Delivery principles

Build a useful learning product in verified increments. Each milestone should leave the application buildable and usable. The initial learner profile is fresh; do not import lesson history from previous chats or external learning systems. The curriculum is versioned content; private learner data is never committed to this public source repository.

## Milestones

### M0 — Product definition and curriculum
- [x] Recover and reconcile the detailed Year 1 52-week plan.
- [x] Recover the Year 2 continuation and optional Year 3+ pathways.
- [x] Define curriculum content format and skill taxonomy.
- [x] Define stable weekly lesson IDs, authored lesson records and independent skill evidence.
- [x] Define first-release scope and product-level visual direction.
- [x] Document foundation and first-release acceptance criteria.
- [x] Define fresh learner profile initialization and privacy boundary.
- [x] Finalise the implementation architecture, trust boundaries, data model, sync policy, Cloudflare services and delivery gates.
- [x] Complete the pre-implementation readiness review, curriculum data audit, feature prioritisation, non-functional requirements and external-tool evaluation.
- [x] Complete multi-angle curriculum research and revise the spiral learning framework, practice progression and selected checkpoints (curriculum v1.1.0).
- [x] Author all 52 Year 1, 52 Year 2 and 48 Year 3 specialist lessons.
- [x] Add a versioned lesson JSON Schema, stable specialist-week IDs and a dependency-free content validator.
- [x] Establish the approved hybrid visual direction and publish the implementation guideline; define and contrast-test exact UI tokens during M1.
- [x] Retire all legacy learner-baseline import requirements; start profiles empty.

M0 product, architecture, curriculum and implementation guidelines are ready for M1. The approved hybrid design direction is documented in docs/DESIGN_DIRECTION.md and docs/IMPLEMENTATION_GUIDELINES.md. M1 can proceed without Work-mode access. The first profile will be initialized empty when local persistence is implemented; the learner's own preferences are entered into that private profile, not committed as shared defaults.

### M1 — Application foundation
- [ ] Create SvelteKit/Svelte 5/TypeScript application.
- [ ] Configure Tailwind CSS 4.
- [ ] Configure Cloudflare adapter and Wrangler.
- [ ] Establish local development and environment separation.
- [ ] Build a versioned, profile-scoped learner settings model and skippable onboarding.
- [ ] Add formatting, linting, type-checking and CI.
- [ ] Add accessible responsive application shell using the approved hybrid design direction and semantic design tokens.

### M2 — Data foundation
- [ ] Configure D1 and Drizzle ORM.
- [ ] Add versioned schema and migrations.
- [ ] Define repository/service boundaries.
- [ ] Add Zod validation and error handling.
- [ ] Add seed data for generic curriculum content.
- [ ] Test migrations and data access.

### M3 — Learning dashboard
- [ ] Today's practice and next recommended lesson.
- [ ] Explainable next-action recommendations based on current lesson, review needs, evidence, prerequisites and available time.
- [ ] 10-, 20- and 40-minute practice plans plus custom duration.
- [ ] Current learning phase and progress.
- [ ] Review-due skills and weak areas.
- [ ] Per-profile goals, practice schedule/duration, preferred lesson presentation and accessibility settings.
- [ ] Compose an explainable daily plan from learner preferences and skill evidence.
- [ ] Responsive desktop and mobile navigation.

### M4 — Curriculum and lesson engine
- [ ] Curriculum overview and phase navigation.
- [ ] Lesson content, objectives and prerequisites.
- [ ] Exercises, checkpoints and lesson completion.
- [ ] Resume-in-progress behaviour.
- [ ] Load self-contained lesson content and record fresh progress.
- [ ] Render lesson blocks according to per-profile presentation preferences while preserving authored learning outcomes and text fallbacks.

### M5 — Learning state and synchronisation
- [ ] Local IndexedDB persistence.
- [ ] Offline practice and lesson progress capture.
- [ ] Initialize an empty versioned learner profile.
- [ ] Outbox-based synchronisation.
- [ ] Conflict detection and recovery.
- [ ] Account and secure cloud sync when ready.
- [ ] Export and restore.

### M6 — Interactive music tools
- [ ] Fretboard explorer and note identification.
- [ ] Tuning-aware instrument profile and handedness-aware fretboard presentation.
- [ ] Chord diagrams and chord laboratory.
- [ ] Chord-transition drills with clean-change quality tracked separately from speed.
- [ ] Metronome and reference tones.
- [ ] Chromatic tuner with explicit microphone permission.

### M7 — Practice studio
- [ ] Custom practice routines.
- [ ] Session timer and exercise sequence.
- [ ] Practice journal and session history.
- [ ] Tempo and repetition tracking with accuracy-first tempo ladders.
- [ ] Add an optional external ComposeYogi launcher for learner-created backing tracks; core practice must remain native and independent.
- [ ] Quick session reflection and one next target with minimal friction.
- [ ] Skill assessments and review scheduling.

### M8 — Musicianship and repertoire
- [ ] Music theory reference and exercises.
- [ ] Ear-training exercises.
- [ ] Progressive scale, interval, triad and CAGED fretboard modes.
- [ ] Song library and bookmark management.
- [ ] TAB/notation viewer for permitted content.
- [ ] Song section loops and practice targets.
- [ ] Add an optional Midee MIDI-visualiser reference link after licence and mobile usability recheck; never make it a required dependency.

### M9 — Release hardening
- [ ] PWA installability and offline asset strategy.
- [ ] Accessibility and mobile usability audit.
- [ ] Security and privacy review.
- [ ] Backup/restore verification.
- [ ] Performance and reliability checks.
- [ ] Add the curriculum validator to the wider application CI and expand automated tests after the app scaffold exists.
- [ ] Production deployment and smoke tests.

## Definition of done

A milestone is complete only when:
- Its acceptance criteria are documented and met.
- Type-check, lint, relevant tests and production build pass.
- Core flows work on mobile and desktop.
- Loading, empty, error and offline states are handled where applicable.
- No secrets or personal learning records are committed.
- Documentation reflects the actual implementation.

## Initial release priorities

1. A reliable, mobile-first dashboard.
2. The self-contained Year 1 curriculum with a fresh start and clear checkpoints.
3. Lesson viewing, checkpoints and resume behaviour.
4. Practice logging and evidence-based skill status.
5. Local/offline persistence, export and restore.
6. Basic fretboard, chord diagrams, metronome and single-note tuner.

Automatic polyphonic chord grading, AI tutoring, social features and collaboration are deferred.


### Personalisation and design implementation baseline

Follow [Implementation Guidelines](IMPLEMENTATION_GUIDELINES.md) for the approved hybrid visual direction, per-profile onboarding, lesson presentation types, daily-plan composition and acceptance criteria. The shared curriculum remains canonical; the learner's session plan, goals, practice emphasis and teaching format are profile-specific. Do not use the current owner's acoustic/20-minute/all-round choices as application-wide defaults.
