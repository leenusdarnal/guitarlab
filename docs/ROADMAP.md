# GuitarLab Implementation Roadmap

## Delivery principles

Build a useful learning product in verified increments. Each milestone should leave the application buildable and usable. Do not replace or reset the learner's existing guitar progress when importing curriculum content. The curriculum is versioned content; private learner data is never committed to this public source repository.

## Milestones

### M0 — Product definition and curriculum
- [x] Recover and reconcile the detailed Year 1 52-week plan.
- [x] Recover the Year 2 continuation and optional Year 3+ pathways.
- [x] Define curriculum content format and skill taxonomy.
- [x] Define separate weekly-card and numbered micro-lesson progress.
- [x] Define first-release scope and product-level visual direction.
- [x] Document foundation and first-release acceptance criteria.
- [x] Specify private learner-baseline migration and privacy boundary.
- [x] Finalise the implementation architecture, trust boundaries, data model, sync policy, Cloudflare services and delivery gates.
- [x] Complete the pre-implementation readiness review, curriculum data audit, feature prioritisation, non-functional requirements and external-tool evaluation.
- [x] Complete multi-angle curriculum research and revise the spiral learning framework, practice progression and selected checkpoints (curriculum v1.1.0).
- [ ] Select final visual concept and detailed design tokens before UI implementation.
- [ ] Execute private learner-baseline import after local persistence exists (M5).

M0 product and architecture specifications are ready for M1. Finalising the architectural design does not select the final visual UI concept; that remains a design gate before detailed UI implementation. The private progress import remains deferred until a private local profile exists.

### M1 — Application foundation
- [ ] Create SvelteKit/Svelte 5/TypeScript application.
- [ ] Configure Tailwind CSS 4.
- [ ] Configure Cloudflare adapter and Wrangler.
- [ ] Establish local development and environment separation.
- [ ] Add formatting, linting, type-checking and CI.
- [ ] Add accessible responsive application shell after visual concept selection.

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
- [ ] Goal and schedule preferences.
- [ ] Responsive desktop and mobile navigation.

### M4 — Curriculum and lesson engine
- [ ] Curriculum overview and phase navigation.
- [ ] Lesson content, objectives and prerequisites.
- [ ] Exercises, checkpoints and lesson completion.
- [ ] Resume-in-progress behaviour.
- [ ] Import existing progress without resetting history.

### M5 — Learning state and synchronisation
- [ ] Local IndexedDB persistence.
- [ ] Offline practice and lesson progress capture.
- [ ] Idempotent private learner-baseline import.
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
- [ ] Verify curriculum schema and content validation in CI.
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
2. The preserved Year 1 curriculum and separate numbered micro-lesson continuity.
3. Lesson viewing, checkpoints and resume behaviour.
4. Practice logging and evidence-based skill status.
5. Local/offline persistence, export and restore.
6. Basic fretboard, chord diagrams, metronome and single-note tuner.

Automatic polyphonic chord grading, AI tutoring, social features and collaboration are deferred.
