# CI reliability tracker — consolidated

**Status:** Superseded as a live task tracker on 18 November 2026.

All current CI reliability, migration-drift, formatting, dependency installation, browser timing, diagnostics, audit and workflow timeout tasks are maintained in [ENGINEERING_QUALITY_TRACKER.md](ENGINEERING_QUALITY_TRACKER.md), Section 8.

Use these current task IDs only:
- **CI-01–CI-02:** independent checks and migration-drift negative tests.
- **CI-03:** Node/npm cache (done).
- **CI-04–CI-06:** formatting baseline, lockfile-controlled browser tools and browser readiness.
- **CI-07:** browser binary cache deferred while the pinned Playwright container supplies the browsers.
- **CI-08–CI-11:** failure diagnostics, dependency audit, timeouts and validation duplication.

Do not add new CI status rows or validation logs here. Update the canonical task row and attach the PR/Actions evidence there.

The historical CI findings and validation records from the former tracker are retained in this file's Git history. The controlled failure/recovery procedure remains in [CI_FAILURE_RECOVERY.md](CI_FAILURE_RECOVERY.md); record its outcomes against QA-05 in the unified tracker.
