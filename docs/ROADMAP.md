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

- [x] Create SvelteKit/Svelte 5/TypeScript application (PR #21).
- [x] Configure Tailwind CSS 4.
- [x] Configure Cloudflare adapter and Wrangler for the local Worker runtime.
- [ ] Establish isolated local, preview and production environments; no live deployment is configured yet.
- [x] Build a versioned, profile-scoped learner settings model and skippable onboarding.
- [x] Add formatting, linting, type-checking, unit tests and GitHub Actions CI.
- [x] Add the initial responsive application shell using the approved hybrid design direction and semantic design tokens.
- [ ] Complete manual mobile, keyboard and component-level accessibility verification.

M1 foundation is merged in PR #21. Worker build and local smoke checks pass. Cloudflare preview/production configuration and live deployment remain separate release work.

### M2 — Data foundation

- [x] Add the versioned Drizzle domain schema and local D1 migrations (PR #22).
- [x] Define repository/service boundaries and application use cases (PR #23).
- [x] Add Zod validation, typed errors and safe error boundaries.
- [x] Seed versioned curriculum metadata and stable skill IDs.
- [x] Test local migrations and data integrity.
- [x] Implement an empty learner profile and browser-local IndexedDB repositories (PR #24).
- [x] Implement local export, validated restore preview, transactional replacement and safe reset (PR #25).
- [ ] Verify IndexedDB reload/offline restart/upgrade and backup round-trip/rollback in a real browser.

The D1 schema and migration are local/test foundations only. There is no production D1 database, learner-facing cloud route, authentication or cloud sync.

### M3 — Learning dashboard

- [x] Today's practice and next recommended lesson.
- [x] Explainable next-action recommendations based on current lesson, review needs, available evidence and learner goals.
- [x] 10-, 20- and 40-minute practice plans plus custom duration.
- [x] Current learning phase and progress.
- [x] Review-due skills and recent practice context without inventing learner history.
- [x] Per-profile goals, practice duration and lesson presentation preferences.
- [x] Compose an explainable daily plan from learner preferences and available skill evidence.
- [x] Responsive desktop and mobile dashboard/planner journeys.

M3.1 is merged in PR #26 and M3.2 in PR #28. Advanced accessibility and offline browser verification remain part of M9.

### M4 — Curriculum and lesson engine

- [x] Curriculum overview and phase/week navigation across six routes.
- [x] Self-contained lesson content, objectives, prerequisites and optional refreshers.
- [x] Worked examples, demonstration steps, exercises, musical application, success criteria and accessible alternatives.
- [ ] Interactive checkpoints, lesson completion events and resume behaviour (M4.2).
- [x] Load all 152 authored lessons with stable IDs and versioned content.
- [ ] Record and restore learner progress against lesson blocks/checkpoints.
- [ ] Render lesson blocks according to per-profile presentation preferences while preserving authored learning outcomes and text fallbacks.

M4.1 is merged in PR #29. The reader displays authored content but deliberately does not mark lessons complete or grant skill mastery. M4.2 is the next curriculum implementation slice.

### M5 — Learning state and synchronisation

- [x] Local IndexedDB learner profile and repository foundation (delivered in M2.3).
- [ ] Offline app-shell and selected-curriculum caching.
- [ ] Reliable offline lesson/practice capture and recovery across browser restarts.
- [x] Initialize an empty versioned learner profile.
- [ ] Outbox-based synchronisation and idempotent operation processing.
- [ ] Conflict detection and recovery.
- [ ] Account and secure cloud sync when ready.
- [x] Local export and validated restore workflow; browser round-trip/rollback acceptance remains.

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
- [ ] Optional external ComposeYogi launcher; core practice remains native.
- [ ] Quick session reflection and one next target with minimal friction.
- [ ] Skill assessments and review scheduling.

### M8 — Musicianship and repertoire

- [ ] Music theory reference and exercises.
- [ ] Ear-training exercises.
- [ ] Progressive scale, interval, triad and CAGED fretboard modes.
- [ ] Song library and bookmark management.
- [ ] TAB/notation viewer for permitted content.
- [ ] Song section loops and practice targets.
- [ ] Optional Midee MIDI-visualiser reference link after licence and mobile usability recheck.

### M9 — Release hardening

- [ ] PWA installability and offline asset strategy.
- [ ] Accessibility and mobile usability audit.
- [ ] Security and privacy review.
- [ ] Backup/restore verification in a browser.
- [ ] Performance and reliability checks.
- [x] Curriculum validator integrated into the main application CI.
- [ ] Explicit Cloudflare preview deployment and browser-level verification.
- [ ] Private production deployment, smoke tests and rollback procedure.

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
