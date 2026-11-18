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

M1 foundation is merged in PR #21. Worker build and local smoke checks pass. The isolated no-D1 production config and manual release workflow are implemented. The first local-first production deployment succeeded on 2026-11-16 for commit `306f7aea19596731dac88192d8228590544f00fc`; five route smoke tests and security-header checks passed, and a 90-day artifact records Worker version `36ba069d-3462-467d-8076-90c17383f255`. Subsequent `main` changes require exact-SHA deployment reconciliation before they can be called live; see [QA-04 in the unified engineering-quality tracker](ENGINEERING_QUALITY_TRACKER.md#74-production-and-ci-release-evidence). Temporary host: `https://guitarlab.leenusdarnal.workers.dev`; no custom domain or zone is connected.

### M2 — Data foundation

- [x] Add the versioned Drizzle domain schema and local D1 migrations (PR #22).
- [x] Define repository/service boundaries and application use cases (PR #23).
- [x] Add Zod validation, typed errors and safe error boundaries.
- [x] Seed versioned curriculum metadata and stable skill IDs.
- [x] Test local migrations and data integrity.
- [x] Implement an empty learner profile and browser-local IndexedDB repositories (PR #24).
- [x] Implement local export, validated restore preview, transactional replacement and safe reset (PR #25).
- [ ] Complete physical-device IndexedDB reload/offline restart/upgrade and backup round-trip/rollback acceptance; automated Chromium migration and rollback coverage is merged (PRs #42–43).

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
- [x] Interactive checkpoints, lesson completion events and resume behaviour (PR #33).
- [x] Load all 152 authored lessons with stable IDs and versioned content.
- [x] Record and restore learner progress against lesson blocks/checkpoints (PR #33; automated browser acceptance merged).
- [x] Render lesson sections in the learner's saved presentation order (balanced, visual-first, demonstration-first, text-first, interactive-first or song-first) while retaining all authored content, stable progress IDs and text fallbacks.

M4.1 is merged in PR #29. M4.2 section progress and checkpoint completion are implemented in PR #33; manual QA remains separate. The reader now consumes the optional profile presentation preference and defaults to the authored balanced sequence when no preference is selected. Presentation changes only section order: it does not rewrite curriculum JSON, hide content, or affect lesson completion or skill mastery.

### M5 — Learning state and synchronisation

- [x] Local IndexedDB learner profile and repository foundation (delivered in M2.3).
- [x] Initial privacy-safe offline app shell and previously visited public lesson caching (PR #35); complete selected-curriculum pre-caching remains future work.
- [ ] Complete offline lesson/practice capture and recovery across physical-device browser restarts; automated viewport acceptance is merged, manual device acceptance remains (task-level status and evidence: OFF-03/OFF-04 and QA-03 in [the unified tracker](ENGINEERING_QUALITY_TRACKER.md)).
- [x] Initialize an empty versioned learner profile.
- [ ] Outbox-based synchronisation and idempotent operation processing.
- [ ] Conflict detection and recovery.
- [ ] Complete optional account registration/login and secure sessions ([Issue #176](https://github.com/leenusdarnal/guitarlab/issues/176); runtime/account foundation merged in PR #177; lifecycle and environment acceptance remain open under SEC-01–SEC-03 in [the unified tracker](ENGINEERING_QUALITY_TRACKER.md)); guest/local mode remains the default.
- [ ] Outbox-based cloud sync, idempotency, conflict recovery and account-scoped data ownership; do not enable until account export/deletion and security gates pass.
- [x] Local export and validated restore workflow; browser round-trip/rollback acceptance remains.

### M6 — Interactive music tools

- [x] Tuning-aware fretboard pitch model and standard E tuning (merged PR #45).
- [x] Interactive fretboard explorer, sharp/flat spelling, note finding and keyboard navigation (merged PR #45).
- [x] Persist handedness per learner profile and mirror only the diagram presentation (merged PR #45).
- [x] Chord diagrams and chord library (PR #46).
- [x] Chord-transition observations with clean-change quality tracked separately from elapsed time (PR #46).
- [x] Metronome with tempo/meter controls and user-initiated reference tone (PR #46).
- [x] Feature-owned audio sessions and deterministic playback lifecycle tests/fixes (PRs #73–80).
- [x] Explicit-action microphone input with local-only sample access and track cleanup (PR #82).
- [x] Confidence-aware single-note pitch estimation and stable-note tracking (PRs #81 and #83).
- [x] Chromatic tuner and guided note-recognition exercise (PRs #84–85).
- [x] Synthetic pitch benchmarks and local real-recording evaluation tooling (PRs #86, #90–91).
- [ ] Real-guitar corpus measurements and physical-browser/device acceptance (Issue #89; detailed evidence status: QA-01/QA-02 in [the unified tracker](ENGINEERING_QUALITY_TRACKER.md)).

PRs #45–46 provide the fretboard, chord library and metronome. The audio follow-up is now implemented through PRs #73–86 and #90–91: feature-owned audio sessions, local opt-in microphone capture, a confidence-aware pitch estimator, stable-note tracking, tuner, guided recognition exercise and synthetic/local-recording evaluation tools. Issue #68 is closed. Issue #89 remains open for consented real-guitar corpus measurements and physical-device/browser acceptance; do not represent synthetic or mocked browser tests as hardware evidence.

### M7 — Practice studio

- [ ] Custom practice routines and reusable exercise sequences.
- [x] Local session lifecycle, timer, pause/resume and recovery (PRs #50–51).
- [x] Practice observations, exercise logging, reflection and next target (PRs #56–57).
- [x] Searchable/filterable session history (PR #58).
- [x] Explainable skill states and learner corrections with provenance (PR #59).
- [ ] Accuracy-first tempo ladders and richer per-item performance trends.
- [x] First adaptive-practice read model: deterministic reason codes, active learner/release scoping, measured-score summaries, missing-evidence states and assessment-category coverage (PR #93).
- [x] Practice Studio recommendation list, category assessment-coverage view and canonical 34-skill catalogue (PR #94).
- [x] Append-only local dismiss/correct feedback with provenance, deterministic resolution, backup/restore/reset handling and browser acceptance (PR #103).
- [x] Per-skill measured-score summaries, descriptive score spread and conservative four-score trends within the latest assessment kind (PR #104).
- [ ] Structured per-item assessment outcomes and confusion metadata with provenance, versioning and privacy-safe backup/restore.
- [ ] Canonical topic/technique/fretboard tags and derived exposure coverage based only on explicit tags and learner evidence (Issue #69).

M7.1's core evidence loop is implemented in PRs #50–59. M7.2 now has deterministic read-only recommendations, category assessment coverage, append-only local learner feedback and comparable measured-score trends (PRs #92–94, #103–104). Issue #69 remains open for item-level correctness/confusion and topic/fretboard coverage because current practice observations are learner-entered activity notes, not item outcomes or structured instrument-location evidence. Do not infer accuracy from clean repetitions or mastery from time, lesson completion or repetitions.

- [ ] Optional external ComposeYogi launcher; core practice remains native.

M7.1's core evidence loop is implemented in PRs #50–59. M7.2 now has deterministic read-only recommendations, category assessment coverage, append-only local learner feedback and comparable measured-score trends (PRs #92–94, #103–104). Issue #69 remains open for item-level correctness/confusion and topic/fretboard coverage because current practice observations are learner-entered activity notes, not item outcomes or structured instrument-location evidence. Do not infer accuracy from clean repetitions or mastery from time, lesson completion or repetitions.

### M8 — Musicianship and repertoire

- [ ] Music theory reference and recall exercises (name / sound / use).
- [x] Ear-training foundations: pulse, pitch and melodic contour (PR #61).
- [x] Interval recognition: unison, minor third, major third and perfect fifth (PR #67).
- [ ] Chord-movement listening and progressive interval coverage.
- [ ] Progressive scale, triad, inversion and CAGED fretboard modes using the shared music-theory domain.
- [ ] Song library, bookmarks, section structure and practice targets.
- [ ] TAB/notation viewer only for original, public-domain or properly licensed content.
- [ ] Song section loops and practice targets.
- [ ] Optional Midee MIDI-visualiser reference link after licence and mobile usability recheck.

PR #61 and PR #67 deliver the first local, generated-audio listening exercises. Theory recall, broader interval coverage, connected fretboard theory and the copyright-safe repertoire workspace remain open.

### M9 — Release hardening

M9 is the product-level release milestone. Detailed engineering-quality tasks, their owners, current states, CI links and physical-device evidence are maintained **only** in the [Engineering Quality & Release Tracker](ENGINEERING_QUALITY_TRACKER.md). This roadmap records the milestone gates, not duplicate task-level checklists.

- [ ] Privacy-safe offline caching and useful offline recovery verified (OFF-01–OFF-04).
- [ ] Accessibility, responsive usability and physical-device acceptance verified (UX-01–UX-09; QA-01–QA-03).
- [ ] Authentication lifecycle, environment isolation, CSP and privacy/security review verified (SEC-01–SEC-06).
- [ ] Performance, reliability, audio and data-recovery evidence recorded (PERF-01–PERF-05; QA-01–QA-05).
- [ ] Current production SHA, smoke tests and rollback procedure verified (QA-04).
- [ ] M9 release sign-off recorded and Issue #18 reconciled (QA-06).

The initial local-first production Worker and baseline security-header checks were deployed previously. A successful deployment of an earlier commit is not evidence that the latest `main` SHA is deployed. This release remains guest/local-first unless optional account infrastructure is separately configured; cloud learner-data sync remains disabled until its security, ownership and recovery gates pass.

## M7 implementation note (2026-11-12)

The first slice adds `/practice`, a local IndexedDB-backed session flow and history. It reuses the existing application services and does not award mastery from time spent. See [the execution priority and resume plan](EXECUTION_PRIORITY.md) for the active branch, validation status and next slice.

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


### M7.2 — Pause/resume and reliable session timing (2026-11-12)

- [x] Add pause/resume session lifecycle states.
- [x] Persist accumulated active time and exclude paused intervals.
- [x] Serialize session creation through a shared IndexedDB read/write transaction to prevent competing active sessions across tabs.
- [x] Extend browser acceptance for pause, frozen timer, resume, reload recovery and completion.
- [x] Pass full CI (PR #51 run `43207060655`); the documentation checkpoint is being revalidated on the latest head.
- [x] Complete true two-tab concurrency browser acceptance before merge.
- [ ] Add exercise sequencing and append-only exercise observations in a later slice.

Paused time is not counted as active time. Active time remains learner-reported session metadata and is not evidence of playing accuracy or skill mastery.
