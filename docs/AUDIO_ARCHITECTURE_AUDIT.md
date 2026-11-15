# GuitarLab Audio Architecture and Delivery Audit

**Last reconciled:** 2026-11-14  
**Verified baseline:** `main` at `de9b0f3992c258e5dfdc840e48fb45da47276bd2`  
**Implementation tracking:** [Issue #68](https://github.com/leenusdarnal/guitarlab/issues/68) — closed  
**Remaining external validation:** [Issue #89](https://github.com/leenusdarnal/guitarlab/issues/89)

## Executive finding

The shared audio and single-note pitch-recognition implementation is now merged. Do not restart the earlier audio-foundation plan or duplicate its work. PRs #73–80 cover lifecycle tests, cleanup fixes and explicitly owned audio sessions. PRs #81–86 and #90–91 cover confidence-aware pitch estimation, explicit microphone input, stable-note tracking, the tuner, guided note recognition, synthetic benchmarks and a local real-recording evaluation tool.

The implementation is local-first and microphone capture is user initiated. The remaining gap is evidence from a consented real-guitar corpus and physical browsers/devices. Synthetic signals and mocked Chromium acceptance are regression evidence; they are not proof of real-world accuracy or hardware compatibility.

## Implemented areas

| Area | Merged implementation | Current boundary |
|---|---|---|
| Audio lifecycle | PRs #73–80 | Feature-owned sessions; start/resume/stop/dispose; metronome scheduler stays feature-owned; resource cleanup is tested |
| Pitch estimator | PR #81 | Single-note pitch estimate with confidence and uncertain/no-signal handling |
| Microphone input | PR #82 | Permission only after explicit learner action; local ephemeral samples; device/error handling and stream-track cleanup |
| Stable-note tracking | PR #83 | Smoothing/hysteresis and sustained-note event suppression |
| Tuner | PR #84 | Chromatic tuner at `/tools/tuner`; permission and device states are learner-facing |
| Note recognition | PR #85 | Guided generated-audio/recognition exercise; does not require recording upload |
| Synthetic validation | PRs #86 and #90 | Deterministic fixtures and regression/error-budget tests |
| Local recording evaluation | PR #91 | Evaluator runs on local supplied recordings; source recordings are not intended for repository or production upload |

## Architecture constraints to preserve

1. Keep `AudioContext` ownership explicit and feature-scoped; do not add a global singleton.
2. Preserve the metronome's Web Audio lookahead scheduler. Do not replace it with repeated timer-driven beat playback.
3. Request microphone permission only after a clear learner action.
4. Keep raw samples local and ephemeral; do not upload, persist or log raw audio or microphone samples.
5. Treat low-confidence detections as uncertain rather than showing a confident wrong note.
6. Keep microphone denial, missing devices and unsupported APIs from blocking the metronome, ear training or other non-microphone functionality.
7. Do not infer polyphonic chord recognition from the single-note estimator.
8. Avoid unsupported accuracy claims. Record device/browser, input device, sample rate and acoustic context for any real-world measurement.

## Remaining evidence — Issue #89

- Define and review a consented, local-only real-guitar recording corpus with known ground-truth frequencies and provenance.
- Measure per-string detection coverage, median and P95 absolute cents error, false-note rate during silence/noise, and note-on latency.
- Include instrument/pickup or microphone, playing dynamics, tuning offsets, room noise, and attack/sustain/decay segments.
- Run physical microphone acceptance on supported browser/OS/device combinations and record exact versions, sample rate and device class.
- Verify track cleanup and audio-context lifecycle on physical devices during stop, route navigation, permission denial, device removal and page teardown.
- Attach only derived aggregate metrics to the repository; retain raw recordings locally unless consent and licensing explicitly allow otherwise.
- Record tested versus untested combinations. Do not infer compatibility from mocked Chromium runs.

## Related release hardening — Issue #18

Cross-browser audio timing, permission-denied paths and physical-device resource cleanup are part of the wider release checklist. CSP, full WCAG 2.2 AA review, privacy, dependencies/content licences, performance, offline and rollback acceptance remain separate gates. Production deployment remains deferred.

## Completion boundary

- [x] Existing Web Audio lifecycle risk audited and remediated in PRs #73–80.
- [x] Explicit microphone input, pitch estimator, stable-note tracking, tuner and note-recognition exercise merged in PRs #81–85.
- [x] Synthetic pitch validation merged in PRs #86 and #90.
- [x] Local real-recording evaluation tooling merged in PR #91.
- [ ] Real-guitar corpus metrics and physical-device/browser matrix recorded in Issue #89.

