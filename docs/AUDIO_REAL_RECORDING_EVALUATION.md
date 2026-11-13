# Local Real-Recording Pitch Evaluation

This evaluator provides a repeatable, offline workflow for measuring real guitar recordings without adding audio files to the repository or sending samples to a service.

## Requirements

- Node.js 26 (the repository's CI runtime).
- WAV recordings in PCM 8/16/24/32-bit or IEEE float32 format.
- A JSON manifest with expected fundamental frequencies or `null` for silence/noise segments.
- Ground-truth frequencies obtained from a calibrated reference or a documented recording setup.

The tool downmixes channels to mono and analyzes each file at its native sample rate. It does not resample, modify, copy, or upload audio. It emits aggregate metrics and segment IDs to stdout; file paths and raw samples are excluded.

## Manifest format

Create a manifest next to the WAV files, for example `local-pitch-manifest.json`:

```json
{
  "entries": [
    {
      "id": "guitar-a2-sustain",
      "file": "./recordings/guitar-a2.wav",
      "expectedFrequencyHz": 110,
      "startSeconds": 0.25,
      "endSeconds": 2.25,
      "expectedOnsetSeconds": 0.25
    },
    {
      "id": "room-noise",
      "file": "./recordings/room-noise.wav",
      "expectedFrequencyHz": null,
      "startSeconds": 0,
      "endSeconds": 2
    }
  ]
}
```

Each entry is one labeled segment. Use a separate entry for each string, attack/sustain/decay region, instrument/pickup or microphone, tuning offset, room, and noise condition. For silence/noise, set `expectedFrequencyHz` to `null`. Expected frequencies must be between 40 and 1,000 Hz, matching the evaluator's current analysis band.

## Run locally

```sh
node scripts/evaluate-pitch-recordings.mjs ./local-pitch-manifest.json > local-pitch-report.json
```

The manifest, recordings, and report should remain on the evaluator's machine. Do not commit the WAV files, manifest paths, private recording metadata, or report unless the recording owners have explicitly consented and the provenance/licence permits publication. Prefer publishing reviewed aggregate metrics only.

## Metrics

- **Detection coverage:** proportion of analysis windows in a pitched segment where the estimator returned a detection.
- **Median / P95 absolute cents error:** absolute tuning error across detected windows, relative to the manifest's ground-truth frequency.
- **False-note rate:** proportion of windows in a silence/noise segment where a note was detected.
- **Note-on latency:** first stable tracker note-on time minus the supplied expected onset time. This is omitted when no onset annotation is provided or no note-on occurs.

The summary averages segment-level coverage and false-note rates equally. Use the per-segment results for per-string and per-condition comparisons; do not interpret the segment average as a duration-weighted corpus metric.

## Recording protocol

For every recording, document the following in a private lab notebook, not in production telemetry:

- Consent and provenance; instrument and string; tuning and reference frequency.
- Pickup or microphone model/type, input gain, interface, and channel count.
- Browser, OS, device model, browser version, actual sample rate, and capture settings when testing browser capture.
- Room/noise condition and playing dynamic.
- Ground-truth method and uncertainty.
- Separate attack, sustain, decay, muted-string, silence, and representative background-noise segments.

Collect multiple instruments and capture paths. Keep a physical browser/device matrix separate from synthetic tests. Record permission, stop, navigation, device removal, track-ended, and page-teardown cleanup outcomes on real hardware.

## Limitations

This is an offline WAV analysis harness, not an in-browser microphone test. It does not establish browser compatibility, physical microphone behavior, polyphonic recognition, or accuracy beyond the supplied corpus. The current evaluator uses fixed 4,096-sample windows and 1,024-sample hops, with a 40–1,000 Hz range. Results at different sample rates have different time-window durations. A null or missing metric means no qualifying detections or no onset annotation; it is not a zero-error result.
