# GuitarLab Execution Priority and Resume Plan

**Last updated:** 2026-11-13
**Repository:** `leenusdarnal/guitarlab`
**Default branch:** `main`
**Verified baseline:** `06439a3a573ac8dd5388d5f1c8c5770767c2fad2` (PR #70 merged; PR #67 and research integration are on main)
**Purpose:** Durable execution queue. Refresh live GitHub state before resuming; current code, tests and CI outrank historical notes.

## 1. Latest verified checkpoint

- PR #67, interval recognition, is merged to `main`.
- The PR required formatting fixes and a missing Intervals selector was discovered by browser acceptance; both were corrected before merge.
- PR #67 final checks passed: primary application/curriculum validation and Node.js 26 compatibility. The primary job included formatting, lint, type/Svelte checks, unit tests, production build, Worker smoke test, core browser acceptance, music-tools browser acceptance and accessibility browser acceptance.
- Merge commit: `3b9d76301d09b70a48035fab66ef8b7cec6388f7`.
- PR #67 post-merge main CI [#43434837239](https://github.com/leenusdarnal/guitarlab/actions/runs/43434837239) passed.
- Research integration documentation PR #70 merged as `06439a3a573ac8dd5388d5f1c8c5770767c2fad2`; post-merge main CI [#43436043487](https://github.com/leenusdarnal/guitarlab/actions/runs/43436043487) is the current verification run.
- M7.1 practice sessions/evidence/history/skill-state UI is delivered by PRs #50–59.
- M8.1 ear training includes pulse, pitch and contour (PR #61) plus interval recognition (PR #67).
- Open product issues include #17 and #18; Issue #16 is closed as completed. Research follow-ups are tracked in Issues #68 and #69.
- Cloudflare production deployment remains deferred. Do not provision production D1, enable authentication/cloud sync or deploy production without explicit approval.

## 2. Priority order

### P0 — Complete research integration documentation <badge></badge>

1. [x] Merge the research-integration plan and reconcile roadmap, tracker, architecture and execution checkpoint (PR #70).
2. [x] Close Issue #16 after verifying all five M7.1 acceptance criteria against merged PRs #50–59.
3. [x] Update Issue #17 with completed PR #61/#67 work and remaining theory/repertoire scope.
4. [x] Extend Issue #18 with cross-browser audio, microphone privacy, licence and physical-device acceptance.
5. [x] Create focused Issues #68 (audio/pitch recognition) and #69 (adaptive practice/analytics).
6. [x] Verify PR #70 CI and merge it.

**Exit criteria met:** the research plan, roadmap, tracker, architecture notes and focused GitHub issues are merged; every finding has an adopt/adapt/defer decision and an execution home.

### P1 — Audit shared audio and music-theory foundations

1. Map existing AudioContext ownership and lifecycle in metronome, ear training and tuner-related modules.
2. Identify duplicate scheduling, permission, cleanup and error-handling logic.
3. Audit note spelling, intervals, scales, chords and fretboard mapping for duplicated calculations.
4. Document the smallest shared interfaces before refactoring.
5. Do not change user-facing behaviour in the audit-only slice.

**Exit criteria:** a file-level refactor plan, dependency map and tests that protect existing audio/music behaviour.

### P2 — Adaptive practice and learning analytics (Issue #69)

1. Inspect the existing daily practice planner and skill-state rules.
2. Define a small deterministic prioritisation model using assessment accuracy, recent evidence, review due dates and coverage gaps.
3. Track per-item outcomes where evidence is already captured; do not invent precision from elapsed time.
4. Recommend a focused next drill and explain why it was selected.
5. Add trend views for accuracy, consistency and fretboard/topic coverage using derived data.
6. Keep learner corrections and the existing mastery rules authoritative.

**Exit criteria:** recommendations are reproducible, explainable, dismissible/correctable and covered by domain/browser tests; practice time alone never grants mastery.

### P3 — Shared audio and microphone pitch recognition (Issue #68)

1. Implement reusable audio-session lifecycle only where the audit shows duplication.
2. Add explicit microphone permission and device capability handling.
3. Implement single-note pitch estimation, silence/noise rejection, stable-note tracking and confidence output.
4. Add the chromatic tuner and then a focused note-recognition exercise.
5. Benchmark synthetic fixtures and representative real guitar recordings across supported browsers/devices.
6. Keep raw audio local and ephemeral; do not upload, log or store it by default.

**Exit criteria:** uncertain detection is shown as uncertain; measured benchmark results and limitations are documented; microphone denial and unsupported-browser paths remain usable.

### P4 — Connected theory, fretboard and ear training (Issue #17)

1. Add theory recall prompts for name, sound and musical use.
2. Extend interval coverage and add chord-movement listening.
3. Connect triads, inversions, scales and CAGED positions to the existing fretboard model.
4. Use one shared theory domain for diagrams, prompts and explanations.
5. Build song workspace and TAB/notation support only for original, public-domain or properly licensed content.

**Exit criteria:** clear feedback/retry, accessible non-audio instructions, shared theory calculations and content/licensing review.

### P5 — Release hardening (Issue #18)

1. Physical-device offline/reload/backup/restore acceptance.
2. CSP review and full WCAG 2.2 AA audit.
3. Cross-browser audio timing, lifecycle and permission tests.
4. Privacy and dependency/licence review.
5. Performance budgets, safe diagnostics and rollback evidence.
6. Preview deployment verification with synthetic data only; production remains separately gated.

**Exit criteria:** evidence is recorded for desktop/mobile devices and supported browsers; unresolved risks are explicitly accepted or fixed.

## 3. Adopt / adapt / defer decisions

**Adopt:** stable-note tracking, confidence/noise handling, per-item accuracy, weak-skill prioritisation, connected CAGED/triad learning, browser audio acceptance, licence register and operational hardening.

**Adapt:** use a simple explainable adaptive rules engine rather than importing a complex BKT/IRT model; use audio detection patterns as design references rather than copying code; use repertoire concepts only with permitted content.

**Defer/reject:** opaque predictive mastery, AI tutor, social competition, automatic polyphonic chord grading without validation, mandatory cloud sync, GPL code reuse without a licensing decision and copyrighted TAB scraping.

See [Research Integration Plan](RESEARCH_INTEGRATION_PLAN.md) for the detailed comparative repository decisions.

## 4. Working rules

1. One implementation PR at a time.
2. Start each task from the latest verified `main` SHA.
3. Inspect open PRs, issues, active Actions runs and latest main CI before starting.
4. Use small, independently testable changes with explicit acceptance criteria.
5. Never weaken assertions, skip required checks or increase timeouts to hide failures.
6. Keep learner records, notes, recordings, secrets and production data out of source and logs.
7. Merge only when required checks pass and the user has authorised the merge.
8. Do not deploy Cloudflare production without explicit approval.
9. Update roadmap, tracker and this checkpoint after every meaningful merge.

## 5. Resume protocol

When the user says “resume GuitarLab” or “continue implementation”:

1. Fetch current `main` SHA and verify the latest main CI.
2. List open PRs, open issues and active workflow runs.
3. Read this file, `docs/IMPLEMENTATION_TRACKER.md` and the relevant GitHub issue.
4. Reconcile acceptance criteria against current code and merged PRs; do not repeat completed work.
5. Continue the highest-priority incomplete task above, one slice at a time.
6. Record PR, CI evidence, manual QA and the next exact task before pausing.

## 6. Current hand-off

| Field | Value |
|---|---|
| Last verified main SHA | `3b9d76301d09b70a48035fab66ef8b7cec6388f7` |
| PR #67 | Merged |
| Post-merge main CI | Run [#43434837239](https://github.com/leenusdarnal/guitarlab/actions/runs/43434837239); refresh result |
| Current work | Research integration merged; verify post-merge main CI run #43436043487 |
| Next engineering task | Audit shared audio and music-theory foundations (Issue #68), then plan adaptive learning (Issue #69) |
| M7.1 | Complete in PRs #50–59; Issue #16 closed |
| M8.1 | PRs #61 and #67 merged; Issue #17 remains open |
| M9 | Physical-device and release acceptance remains open under Issue #18 |
| Deferred | Production deployment, production D1, authentication, cloud sync, PR #47 CI redesign |

**Source-of-truth hierarchy:** current code/tests on `main` → merged PR evidence → current GitHub Issues/Actions → this checkpoint → historical notes and chat summaries.
