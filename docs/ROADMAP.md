# GuitarLab Implementation Roadmap

## Delivery principles

Build a useful learning product in verified increments. Each milestone should leave the application buildable and usable. Do not replace or reset the learner's existing guitar progress when importing curriculum content.

## Milestones

### M0 — Product definition and curriculum
- [ ] Recover and reconcile the learner's existing 52-week plan.
- [ ] Import completed lessons and current lesson position.
- [ ] Define curriculum content format and skill taxonomy.
- [ ] Confirm first-release scope and visual direction.
- [ ] Document acceptance criteria.

### M1 — Application foundation
- [ ] Create SvelteKit/Svelte 5/TypeScript application.
- [ ] Configure Tailwind CSS 4.
- [ ] Configure Cloudflare adapter and Wrangler.
- [ ] Establish local development and environment separation.
- [ ] Add formatting, linting, type-checking and CI.
- [ ] Add accessible responsive application shell.

### M2 — Data foundation
- [ ] Configure D1 and Drizzle ORM.
- [ ] Add versioned schema and migrations.
- [ ] Define repository/service boundaries.
- [ ] Add Zod validation and error handling.
- [ ] Add seed data for generic curriculum content.
- [ ] Test migrations and data access.

### M3 — Learning dashboard
- [ ] Today's practice and next recommended lesson.
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
- [ ] Outbox-based synchronisation.
- [ ] Conflict detection and recovery.
- [ ] Account and secure cloud sync when ready.
- [ ] Export and restore.

### M6 — Interactive music tools
- [ ] Fretboard explorer and note identification.
- [ ] Chord diagrams and chord laboratory.
- [ ] Chord-transition drills.
- [ ] Metronome and reference tones.
- [ ] Chromatic tuner with explicit microphone permission.

### M7 — Practice studio
- [ ] Custom practice routines.
- [ ] Session timer and exercise sequence.
- [ ] Practice journal and session history.
- [ ] Tempo and repetition tracking.
- [ ] Skill assessments and review scheduling.

### M8 — Musicianship and repertoire
- [ ] Music theory reference and exercises.
- [ ] Ear-training exercises.
- [ ] Song library and bookmark management.
- [ ] TAB/notation viewer for permitted content.
- [ ] Song section loops and practice targets.

### M9 — Release hardening
- [ ] PWA installability and offline asset strategy.
- [ ] Accessibility and mobile usability audit.
- [ ] Security and privacy review.
- [ ] Backup/restore verification.
- [ ] Performance and reliability checks.
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

The first useful release should prioritise:
1. A reliable dashboard.
2. The learner's real curriculum and current progress.
3. Lesson viewing and completion.
4. Practice logging.
5. Local/offline persistence.
6. Basic fretboard, chord diagrams and metronome.

Advanced audio grading, social features, AI tutors and collaboration are explicitly later-stage work.
