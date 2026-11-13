# Synthetic Pitch Benchmark

## Purpose

This deterministic regression benchmark covers the six standard guitar open-string fundamentals, a harmonic-rich A2 tone, a decaying G3 pluck with a small deterministic noise component, and digital silence.

Run it with:

```sh
npm run test:run -- src/lib/audio/pitch-benchmark.test.ts
```

Fixtures are generated in memory. The test checks frequency error in cents, silence rejection, repeatability, and duplicate note-on suppression during a sustained note. Sample data is never written to disk, uploaded, or logged.

## Acceptance budgets

| Fixture group | Acceptance |
| --- | --- |
| E2, A2, D3, G3, B3, E4 pure tones | Detected within 15 cents |
| Harmonic-rich A2 | Fundamental detected within 20 cents |
| Decaying G3 pluck with deterministic low-level noise | Detected within 35 cents |
| Digital silence | Returned as silence, with no note |
| Sustained G3 tracker sequence | Exactly one note-on; no note-change or note-off |

These are synthetic-fixture regression budgets, not claims about real instrument accuracy or environmental noise rejection.

## Real-recording validation status

No real-guitar recording corpus is bundled or measured by this benchmark. Before publishing real-world accuracy claims, collect consented, representative recordings across strings, instruments, pickups/microphones, rooms, playing dynamics, tuning offsets, and background-noise conditions. Keep raw recordings out of production telemetry and define a local-only evaluation workflow with documented sample provenance and ground-truth frequencies.

Report per-string detection coverage, median and 95th-percentile absolute cents error, false-note rate during silence/noise, and note-on latency. Separate results by browser/device and record the exact browser, OS, sample rate, window size, and estimator settings. A browser/device row must remain untested until exercised on physical hardware; synthetic tests do not establish browser microphone compatibility.
