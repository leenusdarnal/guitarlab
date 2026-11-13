# GuitarLab — Research Integration Plan

**Status:** Approved implementation direction; work is tracked through the existing M6–M9 milestones and focused GitHub issues.
**Prepared:** 2026-11-13
**Baseline:** PR #67 merged to `main` as `3b9d76301d09b70a48035fab66ef8b7cec6388f7`.

## Purpose

Translate the comparative repository review into concrete, testable improvements to GuitarLab without duplicating existing features, importing unsuitable dependencies, or weakening its local-first privacy and evidence-based learning model.

This document records decisions and sequencing. It does not claim that deferred capabilities have been implemented.

## 1. Research findings and adoption decisions

| Finding from comparable projects | GuitarLab decision | Integration point |
|---|---|---|
| Per-item accuracy, weak-item selection and difficulty adjustment | Adopt a small, explainable rules-based approach first; measure it before considering predictive models | M7 adaptive practice |
| Stable pitch tracking, microphone session management and local audio processing | Adopt the engineering patterns, not copied code; add permission, noise and confidence handling | M6 audio capability / new Issue #68 |
| FFT/chroma, silence rejection and confidence thresholds | Use as design/evaluation references; validate with synthetic signals and real guitar recordings before claiming accuracy | Issue #68 |
| CAGED, triads, inversions and connected fretboard positions | Integrate through shared theory functions and progressive learning modes | M8 theory/fretboard |
| Enharmonic spelling and theory consistency | Keep one canonical note/interval/scale/chord model | Shared music domain |
| Cross-browser audio timing and interaction tests | Extend Playwright coverage across supported browsers and add audio lifecycle tests | M9 release quality |
| Offline backup, security headers, rate limiting and dependency notices | Adopt relevant operational controls; do not copy another app's deployment assumptions | M9 and existing Cloudflare plan |
| Tab playback and repertoire workflows | Build only around original, public-domain or properly licensed material | M8 repertoire |

Repository references reviewed:
- [dknathalage/guitar-learning-tools](https://github.com/dknathalage/guitar-learning-tools) — adaptive learning and per-skill prioritisation patterns.
- [AndruGomes13/guitar-practice](https://github.com/AndruGomes13/guitar-practice) — pitch detection, stable-note tracking and per-item practice statistics.
- [SeanSnaider/Guitar-Scale-Tool](https://github.com/SeanSnaider/Guitar-Scale-Tool) — confidence/noise handling and synthetic plus real-recording evaluation.
- [radzionc/guitar](https://github.com/radzionc/guitar) — CAGED, scales, triads and fretboard relationships.
- [mrieppel/fretboard](https://github.com/mrieppel/fretboard) — note spelling and enharmonic representation.
- [jscr3ator/Fretlark](https://github.com/jscr3ator/Fretlark) — Cloudflare operations, security and third-party licence documentation.
- [louislam/its-mytabs](https://github.com/louislam/its-mytabs) — browser-level playback, timing and media interaction tests.
- [Kmille/freetar](https://github.com/Kmille/freetar) — repertoire and playback concepts; GPL-3.0 means code is not to be copied without an explicit licensing decision.
- [swhoque/Fretboard-Master](https://github.com/swhoque/Fretboard-Master) — limited desktop-oriented reference.
- [joaocarvalhoopen/How_to_learn_guitar_on_a_budget](https://github.com/joaocarvalhoopen/How_to_learn_guitar_on_a_budget) — resource catalogue, not a software architecture to adopt.

Star counts and repository activity are discovery signals, not proof of correctness or product quality. No third-party implementation code or copyrighted learning content is authorised for copying by this review.

## 2. Existing GuitarLab work to reuse

- M6: tuning-aware fretboard, chord library, chord-change observations, Web Audio metronome and reference tone (PRs #45–46).
- M7: local practice sessions, pause/resume, exercise observations, reflections, searchable history, assessment-based skill states and learner corrections (PRs #50–59).
- M8: pulse, pitch and melodic-contour ear training (PR #61), followed by interval recognition (PR #67).
- M9: offline app-shell foundations, security headers, storage durability and backup/restore browser coverage (PRs #35–36 and #42–43).

New work must extend these foundations. In particular:
- Practice time, lesson completion and self-reported repetitions must not independently award mastery.
- Assessment attempts remain append-only; mastery remains explainable and correctable under the existing rules.
- Microphone input is opt-in and processed locally by default; raw audio is not uploaded or logged.
- Shared music-theory calculations remain framework-independent and have one source of truth.
- IndexedDB remains the primary learner-data store; cloud sync is not a prerequisite for local practice.

## 3. Work packages and sequence

### Gate A — Reconcile the implementation baseline
1. Confirm PR #67 merge and its post-merge main CI result.
2. Update roadmap, tracker and execution checkpoint so merged work is not still shown as pending.
3. Keep physical-device release acceptance separate from automated CI evidence.

### Gate B — Complete the M7 evidence loop and define the next learning layer
1. Close M7.1 only after its merged session, evidence, history and skill-state criteria are reconciled.
2. Create a separate adaptive-practice work package for weak-skill prioritisation, review selection, accuracy trends and coverage analytics.
3. Keep the first recommendation algorithm deterministic and explainable. Do not introduce BKT/IRT or opaque predictive scoring before the simple approach is measured.

### Gate C — Shared audio and microphone-based pitch recognition
1. Audit the existing metronome, ear-training playback and tuner direction for duplicated AudioContext ownership and lifecycle logic.
2. Define reusable audio-session and permission boundaries before adding microphone capture.
3. Implement pitch estimation with silence/noise rejection, stable-note tracking and confidence output.
4. Add a chromatic tuner and a small note-recognition exercise only after the pitch detector has measured behaviour.
5. Evaluate synthetic fixtures and real guitar recordings; publish limitations and do not make unsupported accuracy claims.

### Gate D — Connected theory and fretboard learning
1. Audit and consolidate note spelling, interval, scale and chord calculations.
2. Add theory recall with name/sound/use prompts.
3. Connect triads, inversions, scales and CAGED shapes to the existing fretboard model.
4. Ensure the same theory model drives diagrams, exercise generation and explanations.

### Gate E — Release and repertoire quality
1. Extend browser acceptance for audio lifecycle, timing, keyboard use, responsive layouts and supported browser engines.
2. Complete physical-device offline, backup/restore, accessibility and privacy acceptance under Issue #18.
3. Add a third-party dependency/licence register.
4. Build repertoire/TAB workflows only for original, public-domain or properly licensed content; external resources remain links and receive no private learner data.

## 4. Architecture and quality constraints

- One shared music-theory domain; no parallel note/interval/chord implementations.
- Reusable browser audio services with explicit start/stop/dispose lifecycle.
- Microphone permission requested only after a clear learner action.
- Local processing by default; no raw audio in analytics, logs, fixtures or cloud sync.
- Confidence-aware feedback; uncertain detection must be reported as uncertain, not as a wrong note.
- Mastery remains assessment-driven. Practice analytics are derived views, not a second source of truth.
- Every feature has unit tests, relevant integration tests and browser acceptance.
- No new dependency without licence, maintenance, bundle-size and browser-compatibility review.
- No weakening of CI assertions or release gates to get a feature merged.

## 5. Explicitly deferred

- Complex Bayesian/IRT mastery models until simple adaptive recommendations have been evaluated.
- AI tutor, social competition, leaderboards and mandatory accounts.
- Automatic polyphonic chord grading until representative real-world accuracy is demonstrated.
- Cloud sync and remote audio processing as prerequisites for core learning.
- GPL code reuse without a deliberate licence decision.
- Copyrighted TAB scraping or redistribution.

## 6. Definition of done

A research finding is incorporated only when:
1. Its decision (adopt, adapt, defer or reject) is recorded.
2. It maps to an existing milestone or a focused GitHub issue.
3. Dependencies and privacy/licensing implications are documented.
4. Implementation has explicit acceptance criteria.
5. Code is merged only after required CI and relevant browser tests pass.
6. Roadmap, tracker and resume checkpoint are updated with evidence.

## 7. Tracking

- [Issue #16](https://github.com/leenusdarnal/guitarlab/issues/16) — M7.1 practice sessions/evidence loop.
- [Issue #17](https://github.com/leenusdarnal/guitarlab/issues/17) — M8.1 ear training, theory and repertoire.
- [Issue #18](https://github.com/leenusdarnal/guitarlab/issues/18) — M9.1 release hardening.
- [Issue #68 — shared audio and microphone pitch recognition](https://github.com/leenusdarnal/guitarlab/issues/68).
- [Issue #69 — adaptive practice recommendations and learning analytics](https://github.com/leenusdarnal/guitarlab/issues/69).

GitHub Issues and merged PRs are the execution records. This document is the research-decision record, not a substitute for current code or CI evidence.
