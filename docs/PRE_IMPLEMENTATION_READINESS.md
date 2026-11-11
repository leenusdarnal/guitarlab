# GuitarLab — Pre-Implementation Readiness Review

**Review date:** 2026-11-11  
**Repository:** [leenusdarnal/guitarlab](https://github.com/leenusdarnal/guitarlab)  
**Status:** Product and technical preparation substantially complete; visual-concept gate remains open.  
**Purpose:** Resolve product decisions and acceptance criteria before creating the application scaffold. This document does not mark any application milestone as implemented.

## 1. Executive decision

GuitarLab should remain a focused, local-first guitar teacher and practice companion—not become a DAW, social network, general music production suite or AI chatbot.

The core experience is:

1. Know what is worth practising next.
2. Understand the exercise and its measurable target.
3. Practise slowly and correctly, with the right tools available.
4. Capture what actually happened.
5. See what improved, what needs review and why the next task was recommended.

The existing SvelteKit / Svelte 5 / TypeScript / Cloudflare architecture remains appropriate. IndexedDB remains the source of truth for the initial learner profile. D1 and cloud sync remain optional and gated by authentication, ownership checks and conflict handling.

## 2. Repository and curriculum audit

### Verified curriculum structure

The three curriculum JSON files were parsed and checked during this review.

| Content | Result |
|---|---|
| Year 1 | 52 ordered weeks, 4 phases, 52 unique IDs, valid phase references |
| Year 2 | 52 ordered weeks, 9 phases, 52 unique IDs, valid phase references |
| Starting tempo markers | All integer values within the broad 30–240 BPM validation range |
| Year 3+ | Four specialist routes, each outlined for 12 weeks |

The records contain stable IDs, titles, focus, checkpoints, practice exercises and starting BPM. The JSON files are structurally consistent at this level.

**Important content boundary:** the current week records are curriculum outlines, not fully authored lesson scripts. They do not yet carry complete objectives, prerequisite graphs, step-by-step teaching content, exercise sets, resource timestamps or evidence definitions. Those should be added progressively using the content model; do not fabricate detailed lesson content merely to fill every field before M1.

### Validation work to automate

Add a curriculum validation command and CI gate during M1. It should verify JSON shape, stable and unique IDs, ordered week numbers, valid phase references, tempo bounds, required learner-facing fields, valid skill IDs once the skill registry exists, safe resource URLs and schema-version compatibility.

Do not change existing IDs or the meaning of current fields. Content schema changes must be explicitly versioned.

## 3. Product refinements approved for the first useful release

These refinements improve the learning loop without making the initial product substantially larger.

### A. Flexible practice length

Keep 40 minutes as the recommended default, but add quick plans for **10, 20 and 40 minutes**, plus a custom duration. A short session must still be useful and should select one high-value task rather than squeezing every practice category into a rushed routine.

The learner can edit or skip any block. A session timer records elapsed practice only; it never awards mastery on its own.

### B. Explainable next-practice recommendation

Use a small deterministic recommendation engine, not an AI dependency. It should consider:
- the active numbered micro-lesson and current curriculum checkpoint;
- skills marked review-due or still being practised;
- the last recorded result and the learner's stated difficulty/confidence;
- available practice time and the learner's selected goal;
- prerequisites and whether a skill has recent evidence.

Every recommendation must have a plain-language reason, such as “review this chord change because the last two attempts were uneven”. The learner can accept, change or dismiss it. The engine must not silently move the curriculum forward.

### C. Accuracy-first tempo progression

Add a repeatable tempo-ladder pattern for appropriate exercises:
- set a comfortable starting tempo;
- count clean repetitions separately from total repetitions;
- increase tempo only when the exercise meets its stated accuracy criterion;
- reduce tempo when accuracy or comfort drops;
- allow manual override and record the actual tempo.

Do not use a universal “clean streak” as a mastery claim. The success threshold belongs to the exercise and its evidence type.

### D. Guitar setup and accessibility preferences

Add a short, skippable local setup step for:
- handedness (right/left);
- instrument type (acoustic, electric or classical);
- string count, with six-string as the initial supported default;
- tuning preset, initially standard E-A-D-G-B-E;
- note display preference (note names or scale degrees);
- daily practice-time preference and a flexible weekly target.

The domain model should be tuning-aware from the beginning. The initial interface can expose standard tuning first and add alternate tunings when the fretboard and chord calculations are verified. Left-handed presentation should mirror diagrams and fretboard orientation without reversing the actual string-pitch model.

### E. Fretboard learning progression

The first release should teach note locations and test recall. The later fretboard explorer should grow into:
- note names versus interval/scale-degree labels;
- root-note highlighting;
- selected scale and position views;
- triad and chord-tone highlighting;
- CAGED position exploration.

These advanced modes support the Year 2 curriculum, but they should not delay the core note-finding exercise.

### F. Low-friction practice capture

At the end of a session, capture actual duration, exercise, tempo/repetitions where applicable, a short reflection, difficulty and one next target. Use sensible defaults and allow a one-tap “save and finish”. Do not require a lengthy journal entry after every practice.

### G. Visible offline and data safety

Show whether the app is ready offline and whether local data was saved. Include export, restore preview and recoverable error states before calling the first useful release complete. Keep a clear distinction between “saved on this device” and “synced”.

## 4. Product scope and feature priority

### P0 — first useful release

- Mobile-first dashboard and focused practice view.
- Existing Year 1 route and Year 2 continuation outline.
- Separate numbered micro-lessons and weekly curriculum progress.
- Lesson checkpoints, resume behaviour and explicit next-action reasons.
- 10/20/40/custom practice plans.
- Practice timer, metronome, basic chord library and diagrams.
- Fretboard note-finding drills.
- Chord-transition practice with clean-change count separate from speed.
- Local profile and IndexedDB progress, practice and settings.
- Offline app shell and recently loaded public curriculum.
- Export and restore with schema validation and preview.
- Evidence-based skill states and non-punitive review queue.

### P1 — after the core learning loop is reliable

- Adaptive tempo ladder and exercise-specific progressions.
- More fretboard modes: intervals, scales, triads and CAGED.
- Metronome subdivisions, accents, tap tempo and count-in refinements.
- Chromatic tuner and reference tones with explicit microphone permission.
- Ear-training drills and music-theory recall exercises.
- Local audio-file review and section looping where browser/device support permits.
- Optional companion-resource launchers, including backing-track creation.

### Deferred

- Automatic polyphonic chord recognition or objective performance grading.
- AI tutor, paid AI APIs or remote model dependency.
- Social features, public learner profiles, leaderboards and collaboration.
- Cloud sync before authentication, authorisation and conflict resolution.
- Remote recording storage and R2 before a clear backup requirement.
- Course-video hosting, copying paid materials or redistributing copyrighted tabs.
- Full DAW, MIDI composition studio or general-purpose audio editor inside GuitarLab.

## 5. External-tool evaluation

The NoSignups review identified optional companions, not core dependencies.

| Tool | Decision | Appropriate use |
|---|---|---|
| [ComposeYogi](https://composeyogi.com/compose) | **Recommended first external companion** | Build a simple drum/bass/chord backing track and export WAV or MIDI for a practice session. The project identifies an MIT licence. |
| [Midee](https://midee.app/) | External link only after licence recheck | Visualise a MIDI melody and practise note timing. The inspected repository did not expose a root LICENSE file; do not bundle or adapt its code until licence is confirmed. |
| [Drumhaus](https://drumha.us/) | External link only | Rhythm and swing exploration. Its source is CC BY-NC-SA 4.0; do not copy its implementation into GuitarLab without reviewing the licence implications. |
| [AudioMass](https://audiomass.co/) | Optional future reference | Local browser-based audio trimming and analysis. Recheck the current source licence and mobile usability before reuse. |
| [openDAW](https://opendaw.studio/) | Advanced external reference | Full music production is outside the focused guitar-practice workflow. |
| [Scale Ninja](https://github.com/engageintellect/scale-ninja) | Feature reference, not a dependency | Its MIT-licensed project demonstrates scale, triad, CAGED and scale-degree fretboard views. Recreate only the required GuitarLab behaviours in its own architecture, with attribution if any code is reused. |
| [Fretboard.js](https://github.com/moonwave99/fretboard.js) | Do not adopt without a fresh audit | It is an ISC-licensed SVG fretboard library, but the inspected repository's latest commit was in 2022. A tuning-aware GuitarLab component is likely a better fit. |

Integration rule: link out in a new tab with a clear external-resource label. Do not assume iframe embedding is allowed. Do not transmit journal data, learner profile, recordings or private curriculum progress to these sites. Core GuitarLab flows must work when every external provider is unavailable.

## 6. Learning-state rules to freeze before coding

1. Weekly curriculum progress and numbered micro-lesson progress are different records with different IDs.
2. Viewing a lesson, running a timer or importing a baseline is not proof of mastery.
3. Keep each assessment attempt as append-only evidence.
4. Store the evidence source and whether a result is objectively measured or self-reported.
5. Keep speed and accuracy separate. A fast but inaccurate chord change is not an improvement.
6. A review suggestion is guidance, not a deadline. No punitive streak resets or shame language.
7. Skill state is derived from evidence but remains inspectable and correctable by the learner.
8. A recommendation must expose its reason and must not automatically mark curriculum content complete.

## 7. Local profile and instrument settings

The initial profile is local and needs no account. The profile may include instrument configuration, handedness, note-label preference, practice schedule and goals. Learner history, notes and recordings remain private to the device.

Data-model requirements:
- stable IDs and schema version for local records;
- explicit created/updated timestamps and provenance;
- instrument tuning represented as ordered string pitches, not hard-coded string labels in every tool;
- practice sessions linked to exercises and skills where appropriate;
- append-only assessment evidence;
- exportable settings and learner records;
- separate public curriculum content from private learner state.

The existing private learner baseline remains outside this public repository. Import it only after IndexedDB exists, with idempotency and export/restore tests.

## 8. Non-functional requirements

- **Mobile-first:** the practice controls must be reachable one-handed and must not require horizontal scrolling at common phone widths.
- **Accessibility:** semantic headings and controls, keyboard operation, visible focus, reduced motion, contrast checks, screen-reader names for audio controls, and no colour-only feedback.
- **Audio:** microphone access only after an explicit action; local processing by default; silence/noise/permission-denied/unsupported states; no false confidence from weak pitch estimates.
- **Offline:** cached app shell and versioned public curriculum; local progress survives reload and temporary network loss.
- **Privacy:** no journal text, raw microphone data, recordings, session tokens or profile identifiers in analytics or logs.
- **Reliability:** graceful storage quota errors, migration rollback strategy, export recovery and no silent data loss.
- **Performance:** lazy-load audio and advanced visualisation code; keep the first dashboard load lightweight.
- **Copyright:** store links and learner-owned files; do not host or reconstruct paid video lessons, copyrighted tabs or protected recordings without permission.

## 9. Pre-build decisions and gates

| Decision / gate | Status | Rule |
|---|---|---|
| Product promise and learning model | Ready | Use this review and the existing product specification as authority. |
| Curriculum foundation | Ready for initial rendering | Expand lesson detail gradually; keep existing IDs stable. |
| Architecture | Accepted | Do not introduce a second backend, microservices or a mandatory account. |
| First-release scope | Refined | P0/P1/deferred boundaries are listed above. |
| External companion strategy | Decided | Optional links only; ComposeYogi is the first candidate. |
| Private progress import | Intentionally deferred | Import to IndexedDB in M5; no private baseline in Git. |
| Final visual concept | **Open gate** | Must be selected before building the detailed application shell. |
| Repository licence | Open, non-blocking | Do not add a licence until the owner chooses whether source reuse is permitted. Public visibility is not a reuse licence. |
| Cloud production resources | Deferred | No production D1, secrets or public learner-data endpoint until security controls are implemented and verified. |

The Product Design workflow requires three visual directions and the learner's selection. This must be completed in a supported Work-mode design workflow before detailed UI implementation. Do not claim that the final visual concept or final design tokens are approved from this requirements review alone.

## 10. Definition of ready for M1

M1 can begin when:
- the learner has selected one of the three visual concepts;
- the selected direction is translated into accessible design tokens and responsive shell rules;
- the existing architecture and scope docs are linked and internally consistent;
- the repo remains free of personal progress data and credentials;
- the implementation plan makes local-only mode the default and keeps cloud sync disabled.

M1's scaffold, build, tests and deployment readiness must then be verified in code. This review does not claim those implementation checks have run.

## 11. Owner decisions deliberately left open

Only two owner-level decisions remain before a polished, distributable release: the final visual concept and whether the public source repository should receive an open-source licence. The first is a prerequisite to the detailed UI build; the second is not a blocker for a private local-first implementation.
