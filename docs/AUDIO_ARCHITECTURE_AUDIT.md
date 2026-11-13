# GuitarLab Audio Architecture Audit

**Date:** 2026-11-13  
**Baseline:** `main` at `29625fe9b69263a10550587458724d9baccbf382`  
**Tracking:** [Issue #68 — Shared audio foundation and microphone pitch recognition](https://github.com/leenusdarnal/guitarlab/issues/68)

## Executive finding

GuitarLab currently has two implemented Web Audio feature areas: the metronome/reference tone and generated ear-training exercises. They each own their own `AudioContext` lifecycle and implement oscillator/gain-node setup independently. There is no shared audio-session abstraction and no microphone capture or pitch-detection implementation in the current source tree.

This is a justified opportunity for a small shared audio foundation, but not a reason to introduce a global singleton or rewrite the feature schedulers. Keep scheduling policy owned by each feature; extract only the common context lifecycle and tone-node construction after tests cover the current behaviour.

## Current implementation inventory

| Area | Source | Context ownership | Playback and cleanup |
|---|---|---|---|
| Metronome | `src/lib/audio/metronome.ts` — `WebAudioMetronome` | One context owned by each metronome instance; created lazily on start | Lookahead scheduler uses a 25 ms timer and 100 ms audio-clock window. `stop()` clears the timer and visibility listener. `dispose()` closes the owned context. Individual oscillator/gain nodes disconnect on `ended`. |
| Reference tone | `src/lib/audio/metronome.ts` — `playReferenceTone()` | Creates a fresh context for each call | Schedules one oscillator/gain pair, waits for `ended`, disconnects nodes and closes the context in `finally`. |
| Ear training | `src/routes/tools/ear-training/+page.svelte` — `playExercise()` | One context retained by the page component and lazily created after learner action | Schedules each exercise tone using oscillator/gain pairs; nodes disconnect on `ended`. The context closes in Svelte `onDestroy`. An abortable completion wait is cleared on teardown; hiding the document aborts playback and closes the page-owned context. The next explicit play creates a fresh context. |
| Microphone/tuner | No implementation found in the current repository tree | None | No `getUserMedia`, `MediaStream`, analyser or pitch detector found in the inspected audio feature files/tree. |

## Findings and risks

### 1. Duplicated context lifecycle

- Metronome, reference tone and ear training each construct `AudioContext` independently.
- Each feature handles suspended-context resume and checks for a running context.
- Ownership differs: long-lived metronome instance, one-shot reference tone, and page-scoped ear-training context.
- A shared abstraction should make ownership and disposal explicit without forcing all three use cases into one lifetime.

### 2. Duplicated oscillator/gain construction

- Metronome clicks, reference tone and ear-training notes all create oscillator and gain nodes, set a sine frequency, shape a short gain envelope, connect to destination and disconnect on `ended`.
- Their envelopes and scheduling differ intentionally; a shared primitive should accept frequency, absolute audio start/end times and gain/envelope parameters rather than hard-code a single sound profile.
- The metronome's lookahead scheduling must remain on the Web Audio clock. Do not replace it with repeated `setTimeout` playback.

### 3. Stop and teardown semantics need explicit tests

- Metronome `stop()` stops future scheduling but already queued lookahead oscillators can still play for their short scheduled duration. Confirm and document the intended maximum tail before deciding whether active source nodes need explicit cancellation.
- Ear-training teardown now aborts its completion wait before closing the page-owned context, so unmount does not leave the completion timer pending or update stale component state.
- Ear training now follows the metronome's hidden-tab policy: a `visibilitychange` to `hidden` aborts playback, closes the page-owned context and clears the playing state. A later learner action creates a fresh context.
- Reference tone closes its one-shot context in `finally`, which is a useful ownership pattern to preserve.

### 4. Existing test coverage is incomplete at the Web Audio boundary

- `src/lib/audio/metronome.test.ts` covers tempo/meter validation and invalid reference-tone arguments.
- Browser acceptance verifies metronome start/stop, reference-tone playback, ear-training playback and answers; it now also covers ear-training interruption on tab hide and route teardown.
- `src/lib/audio/playback-lifecycle.test.ts` verifies normal completion, abort-driven timer cleanup, already-aborted signals and invalid durations. Actual AudioContext creation/resume/close remains covered by the metronome tests only; reference-tone and ear-training Web Audio context boundaries still need dedicated deterministic seams.
- Add deterministic fake-Web-Audio tests before refactoring; retain browser acceptance for actual browser integration.

### 5. Microphone capability is a new feature, not a refactor of existing capture

- No microphone permission or capture path exists in the inspected source tree.
- Microphone capture must be introduced only after an explicit learner action.
- Keep raw samples local and ephemeral. Never log, persist or upload microphone samples by default.
- Pitch detection must report confidence and distinguish silence/noise/uncertain input from a confidently detected note.
- Stable-note tracking is needed to avoid emitting repeated note events for one sustained note.

## Recommended target boundaries

1. **Audio session factory (small, feature-owned instances):** create/resume an `AudioContext`, expose its running context, and close it deterministically. No implicit global singleton.
2. **Tone scheduling primitive:** create and clean up an oscillator/gain voice using caller-supplied timing and envelope settings. Do not own the metronome's timer or ear-training exercise sequence.
3. **Feature schedulers remain separate:** `WebAudioMetronome` retains lookahead timing; ear training retains exercise generation and sequencing; reference tone remains a one-shot caller.
4. **Microphone input service (separate capability):** explicit permission, stream-track stop, analyser lifecycle, silence/noise handling and confidence-aware pitch estimation. Do not couple it to tone playback.
5. **Test seams:** inject context creation or a narrow audio-context factory so unit tests can deterministically verify resume, failure, stop, close and node cleanup.

## Proposed implementation sequence

### A. Characterise current behaviour
- Add fake AudioContext tests for the metronome and reference tone.
- Add ear-training playback lifecycle tests, including component teardown during playback.
- Record the short scheduled-click tail and choose hidden-tab behaviour.

### B. Extract the minimal shared playback layer
- Introduce an explicitly owned audio-session factory.
- Introduce a tone voice helper with caller-defined timing/envelope.
- Migrate reference tone first, then ear training, then metronome only if the tests show no timing regression.
- Keep the feature-specific schedulers and exercise domain pure.

### C. Add microphone capture and pitch estimation
- Add permission/no-device/unsupported-browser handling.
- Implement a testable pitch-estimation core independent of browser media APIs.
- Add silence/noise rejection, confidence thresholds and stable-note tracking.
- Connect a browser capture adapter only after the estimator is tested.

### D. Add tuner and validation
- Add chromatic tuner UI with explicit start/stop.
- Benchmark synthetic signals and representative real guitar recordings.
- Test supported browser engines and physical devices.
- Document measured limitations; do not publish accuracy claims without representative results.

## Non-goals for this slice

- Do not add polyphonic chord recognition.
- Do not upload or persist raw audio.
- Do not introduce a global singleton AudioContext manager.
- Do not replace Web Audio lookahead scheduling with timer-based beat playback.
- Do not copy third-party pitch-detection source code.
- Do not change user-facing sound or timing until regression tests exist.

## Audit exit criteria

- [x] Current Web Audio owners and lifecycle patterns are inventoried.
- [x] Existing duplication and lifecycle risks are documented.
- [x] Microphone/tuner implementation status is verified as not present in the inspected repository tree.
- [x] Minimal shared boundaries and a safe migration order are proposed.
- [ ] Unit tests characterise current context lifecycle and teardown behaviour.
- [ ] Shared audio-session and tone helpers are implemented and regression-tested.
- [ ] Microphone capture, pitch estimation, tuner and real-device benchmarks are implemented in later slices.
