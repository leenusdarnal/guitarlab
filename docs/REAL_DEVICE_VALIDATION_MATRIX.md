# Real-device validation matrix — consolidated

**Status:** Superseded as a standalone status tracker on 18 November 2026.

The canonical physical-device, browser, accessibility, storage/recovery, audio corpus and release evidence matrix now lives in [ENGINEERING_QUALITY_TRACKER.md](ENGINEERING_QUALITY_TRACKER.md), Section 7.

Use [MANUAL_ACCEPTANCE.md](MANUAL_ACCEPTANCE.md) for repeatable steps. Record the status, date, exact commit SHA, device/OS, browser/version, viewport/theme, assistive technology, result and reviewer against the corresponding task ID in the unified tracker.

Evidence rules remain mandatory:

- Synthetic fixtures and mocked microphone permissions are regression coverage only; they are not physical-device results.
- Use synthetic learner data for storage and release tests.
- Use consented, provenance-checked recordings; keep raw recordings, manifests and identifying details private.
- Distinguish not run, blocked, failed, passed and not applicable. An empty cell is not a pass.
- Never place credentials, tokens, private learner data or raw recording assets in this public repository.

Do not recreate a separate matrix or sign-off checklist here.