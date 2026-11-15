# GuitarLab — Real-device and recording evidence matrix

**Status: PENDING.** No physical hardware or consented real recordings have been supplied for this validation. This document is a test log, not a pass report.

## Evidence rules

- Synthetic fixtures, mocked microphone permissions and automated Chromium tests are regression coverage only. They do not establish physical microphone accuracy or cross-browser/OS compatibility.
- Use informed consent and confirm recording provenance/licensing. Keep raw WAVs, manifests, identifiers and personal device details on the evaluator's machine. Do not commit recordings or upload samples.
- Publish only reviewed aggregate metrics that may lawfully be shared.
- Use **not run**, **blocked**, **failed** and **passed** distinctly. An empty cell is not a pass.
- Keep production access restricted until privacy, recovery and release gates are approved.

## 1. Real-guitar corpus register

For each segment, record instrument/string, pickup or microphone/interface and gain, native sample rate, channel count, tuning reference and uncertainty, browser/OS/device where relevant, room/noise, dynamic, and attack/sustain/decay/muted/silence labels. Use non-identifying segment IDs.

| Segment ID | Instrument / string | Capture path | Tuning / ground truth | Dynamic / phase | Room / noise | Consent / provenance | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pending | Pending | Pending | Pending | Pending | Pending | Pending | Not run |

## 2. Required measurements

Run `node scripts/evaluate-pitch-recordings.mjs <private-manifest.json>` locally. Retain recordings and manifests privately.

| Measurement | Required breakdown | Result | Status |
| --- | --- | --- | --- |
| Detection coverage | Per string, capture path, instrument and segment phase | Pending | Not run |
| Median absolute cents error | Per string and capture condition | Pending | Not run |
| P95 absolute cents error | Per string and capture condition | Pending | Not run |
| False-note rate | Silence, muted strings and representative room noise | Pending | Not run |
| Note-on latency | Per string/dynamic where onset ground truth exists | Pending | Not run |

Missing detections or missing onset values are not zero-error measurements. Review segment results so weak strings/noisy conditions cannot be hidden by an aggregate.

## 3. Physical browser/device matrix

Record exact OS and browser version, device class, actual input sample rate and microphone path.

| Platform | Device / OS | Browser + exact version | Microphone / sample rate | Permission / denial | Stop / navigation / teardown | Device removal / track ended | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop Windows | Pending | Pending | Pending | Pending | Pending | Pending | Not run |
| Desktop macOS | Pending | Pending | Pending | Pending | Pending | Pending | Not run |
| Desktop Linux | Pending | Pending | Pending | Pending | Pending | Pending | Not run |
| iOS Safari | Pending | Pending | Pending | Pending | Pending | Pending | Not run |
| Android Chrome | Pending | Pending | Pending | Pending | Pending | Pending | Not run |

Cover opt-in capture, permission denial, missing/unsupported devices, stop, navigation away, hidden tab, device unplug/removal, track-ended and page teardown. Verify all media tracks stop and AudioContext resources close. Non-microphone tools must remain usable after permission denial.

## 4. Physical storage and recovery

Use synthetic learner data only. Follow `docs/MANUAL_ACCEPTANCE.md`.

| Device / browser | Existing profile upgrade | Reload / offline restart | Backup export | Restore preview / cancel | Restore replacement | Reset cancel / confirm | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop | Pending | Pending | Pending | Pending | Pending | Pending | Not run |
| iOS Safari | Pending | Pending | Pending | Pending | Pending | Pending | Not run |
| Android Chrome | Pending | Pending | Pending | Pending | Pending | Pending | Not run |

Do not close Issues #9, #10 or #18 based on CI alone.

## 5. Accessibility, privacy and release gates

| Gate | Reviewer | Evidence | Status |
| --- | --- | --- | --- |
| WCAG 2.2 AA: keyboard, touch, screen reader and reduced motion | Pending | Pending | Not run |
| CSP and response headers | Pending | Pending | Not run |
| Privacy, environment isolation, secrets and logs | Pending | Pending | Not run |
| Performance and error recovery | Pending | Pending | Not run |
| HTTPS preview smoke test | Pending | Pending | Blocked on approved preview environment |
| Deployment rollback rehearsal | Pending | Pending | Not run |
| Dependency, audio sample, repertoire and TAB licence/provenance review | Pending | Pending | Not run |
| Production access restriction and release approval | Pending | Pending | Blocked — no production approval |

## 6. Sign-off

Require dated evidence, exact commit SHA, timezone, device/browser versions and reviewer for every required row. State limitations and untested combinations explicitly.

| Reviewer | Date / timezone | Commit SHA | Decision | Limitations |
| --- | --- | --- | --- | --- |
| Pending | Pending | Pending | Not signed off | Hardware and real-recording evidence not yet supplied |
