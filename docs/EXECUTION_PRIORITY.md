# GuitarLab Execution Priority and Resume Plan

**Last verified:** 2026-11-12  
**Repository:** `leenusdarnal/guitarlab`  
**Default branch:** `main`  
**Baseline commit:** `0780df6dbe9d2889a28c4bc802270995ff71197f`  
**Document purpose:** Durable execution queue and restart checkpoint. Update this file after each meaningful implementation slice and before pausing work.

> This is an execution plan, not a claim that every listed item has been re-audited. The first task on every resume is to refresh the live repository state and reconcile this document with the code, Issues, PRs and CI.

## 1. Current verified baseline

### Repository and delivery state

- `main` points to `0780df6dbe9d2889a28c4bc802270995ff71197f` after merging documentation PR #48.
- The latest observed CI run for that main commit is [GuitarLab CI #43173177888](https://github.com/leenusdarnal/guitarlab/actions/runs/43173177888), which completed successfully.
- The successful main run used Node.js 22.23.5 and passed the three browser acceptance suites. Node 22 remains the current project baseline (`.nvmrc` / `package.json` engine is to be confirmed again during the next audit).
- PRs #45 and #46 are merged. PR #46 completes the chord library and metronome work and closes Issue #15.
- PR #48 is merged and adds this durable execution plan.
- PR #47 (Node.js 26 / CI redesign) is **closed without merging**. Its branch and commits are not part of `main`. Keep its CI investigation deferred; do not reopen or cherry-pick it without a separate, controlled plan.
- No Cloudflare preview or production deployment is authorised by this document. Production deployment remains deferred until explicit user approval.

### Product capabilities evidenced in repository documentation and merged PRs

- 152 authored lessons: 52 Year 1, 52 Year 2 and 48 Year 3+ specialisation lessons.
- SvelteKit / Svelte 5 / TypeScript application on the Cloudflare Workers adapter.
- Local learner profile and IndexedDB persistence, local export/restore/reset flows.
- Learner dashboard, explainable practice planner and curriculum reader.
- Persistent lesson checkpoints, completion and resume behaviour.
- Initial privacy-safe offline app-shell slice, with browser acceptance for desktop/mobile viewports and IndexedDB v1-to-v2 migration.
- Tuning-aware fretboard explorer (PR #45).
- Open chord library, alternating chord-change drill and Web Audio metronome (PR #46).

These are repository-level implementation claims; physical-device acceptance and broader release readiness are still separate gates.

### Known documentation / tracking drift

The README, roadmap and implementation tracker contain stale statements that conflict with merged repository history. Examples include PR #45 being described as under review, PR #46 tools being described as in progress, and older roadmap checkboxes that still show already-merged lesson progress or music tools as incomplete. Open Issues #1–#5, #9–#11 also appear to retain historical acceptance checkboxes despite substantial merged implementation. A documentation reconciliation is now in PR #49; it updates README, roadmap, tracker and this checkpoint. Issue checkboxes still require criterion-by-criterion review rather than automatic closure.

**Do not assume an issue is still unimplemented solely because it is open.** Inspect its acceptance criteria against current code and merged PRs. Close or update issues only after confirming every criterion and recording any remaining manual QA.

### Branch protection caution

The GitHub branch API reported `main` as protected, but its branch-protection response showed required-status-check enforcement as off / empty. A separate repository ruleset was previously reported as active. On the first resume, inspect the current ruleset and effective required checks before stating that CI is enforced on PR merges. Do not change protection settings without approval.

## 2. Priority order

Work in this order. Each numbered item should become a small, reviewable PR unless it is an audit or manual QA task that does not require code changes.

### P0 — Re-establish the live baseline and reconcile project tracking

**Why first:** Work must resume from the actual state of `main`, not from old summaries or stale roadmap checkboxes.

Tasks:
1. Fetch the latest `main` SHA and confirm PR #47 remains closed and unmerged.
2. List all open PRs and open Issues; identify any active GitHub Actions runs.
3. Inspect the latest main CI run and current workflow files. Record the required check names and whether they are actually enforced by the active ruleset.
4. Inspect `README.md`, `docs/ROADMAP.md`, `docs/IMPLEMENTATION_TRACKER.md` and `docs/MANUAL_ACCEPTANCE.md`.
5. Reconcile merged work: PRs #33, #35, #36, #42, #43, #45 and #46, plus any later merged work.
6. Correct stale milestone statuses and issue references. Keep automated verification and physical-device sign-off distinct.
7. Record the resulting baseline SHA, latest CI run, open PRs, open issues and next task in this document.

**Exit criteria:** A verified current-state report; documentation agrees with `main`; no task is marked complete without code or test evidence.

### P1 — Complete outstanding manual data / offline acceptance

**Why next:** Local learner data must be trustworthy before adding more learning workflows.

Primary runbook: [Manual acceptance](MANUAL_ACCEPTANCE.md)

Tasks:
1. Perform real-device desktop and mobile acceptance for offline navigation and previously visited lessons.
2. Verify learner profile, lesson checkpoint and practice-session data survive reload and browser restart.
3. Perform a real export → clean-profile restore round trip.
4. Verify invalid/unsupported backup rejection and that failed restore leaves existing data intact.
5. Verify reset cancellation and explicit confirmation behaviour.
6. Record device/browser/OS, steps, expected result, actual result and evidence. Do not record private learner data in this public repository.

Relevant open issues to reconcile:
- [#9 — IndexedDB learner profile](https://github.com/leenusdarnal/guitarlab/issues/9)
- [#10 — Export, restore and safe reset](https://github.com/leenusdarnal/guitarlab/issues/10)
- [#18 — Release readiness](https://github.com/leenusdarnal/guitarlab/issues/18)

**Exit criteria:** Manual acceptance evidence is recorded; any discovered defects have focused issues/PRs; Issues #9 and #10 are updated or closed only when all criteria are met.

### P2 — Build the complete Practice Studio and evidence loop

**Why next:** This is the largest remaining gap between lesson consumption and measurable deliberate practice.

Primary issue: [#16 — Practice sessions, evidence capture and review history](https://github.com/leenusdarnal/guitarlab/issues/16)

Recommended implementation slices:
1. Practice session lifecycle: start, pause, resume, finish and recover after reload.
2. Exercise sequence and session timer; record actual elapsed practice time.
3. Capture exercise-level evidence: repetitions, clean repetitions, tempo, accuracy/quality, difficulty and learner reflection.
4. Keep elapsed time, speed and accuracy as separate observations. Never infer mastery from time or speed alone.
5. Persist append-only evidence through the existing application/repository boundaries.
6. Connect completed lesson checkpoints and practice evidence to skill status without conflating lesson completion with mastery.
7. Add review scheduling based on demonstrated evidence.
8. Add concise session history and one next-practice target.
9. Add unit, persistence and browser acceptance for empty, interrupted, resumed and completed sessions.

**Exit criteria:** A learner can select a plan, complete a session, save evidence, resume after interruption, see history and receive an explainable next action. Evidence remains local/private and mastery rules are explicit and tested.

### P3 — Release hardening and quality gates

**Why:** Stabilise core workflows before expanding the curriculum surface.

Primary issue: [#18 — Offline, accessibility, privacy and release readiness](https://github.com/leenusdarnal/guitarlab/issues/18)

Tasks:
1. Security/privacy review, including response headers and a carefully tested Content Security Policy compatible with SvelteKit hydration and Worker deployment.
2. Accessibility audit: keyboard-only journeys, focus visibility, screen-reader semantics, contrast, reduced motion and touch targets.
3. Responsive QA on real mobile and desktop browsers.
4. Offline/PWA review: cache versioning, update/refresh behaviour, stale-cache recovery, storage quota and explicit offline states. Do not call the current app shell a complete offline-first sync solution.
5. Performance budgets and profiling for first load, lesson navigation and practice interactions.
6. Error handling, safe recovery and privacy-safe diagnostics.
7. Re-check migrations, backup/restore, data retention and reset behaviour.
8. Verify local, preview and production environment separation and rollback procedure.
9. Keep preview deployment separate and manual. Use synthetic data only. Production deployment requires explicit approval.

**Exit criteria:** Critical/high release risks are fixed or explicitly accepted; accessibility, privacy, offline, performance and recovery evidence is recorded; preview/production gates are documented.

### P4 — Musicianship, theory and repertoire

Primary issue: [#17 — Ear training, theory recall and repertoire](https://github.com/leenusdarnal/guitarlab/issues/17)

Build in independent slices:
1. Ear-training fundamentals: pulse, high/low, contour and interval recognition.
2. Theory recall with name / sound / use prompts and feedback/retry.
3. Scales, intervals, triads and CAGED fretboard learning modes.
4. Song workspace with section structure, bookmarks and practice targets.
5. TAB/notation support only for original, public-domain or properly licensed content.
6. Browser and accessibility acceptance for audio controls and exercises.

**Exit criteria:** Exercises have accessible feedback and retry paths; audio/content rights are clear; learning evidence can connect to the Practice Studio without inventing mastery.

### P5 — Platform evolution and optional cloud capabilities

Only begin after local learning and data recovery are reliable.

Tasks:
1. Complete installability and offline curriculum strategy where it adds clear user value.
2. Design an outbox and idempotent sync protocol.
3. Define account ownership, authentication, authorisation, conflict resolution and deletion/export policy before implementing cloud sync.
4. Add observability and operational diagnostics without collecting sensitive practice/audio content.
5. Revisit Node.js 26 / CI redesign from closed PR #47 as a separate experiment:
   - preserve Node 22 + Playwright-managed Chromium + sequential browser suites as the known-good baseline;
   - change one variable at a time;
   - isolate Node 26 compatibility from browser installation and parallelism changes;
   - retain all assertions and required validation;
   - do not merge until the full required CI passes reliably.
6. Evaluate tuner and other advanced music tools as separate scoped work.

**Exit criteria:** Architecture, privacy and recovery rules are documented and tested before enabling accounts or remote learner-data storage.

## 3. Explicitly deferred work

Until separately prioritised and approved:
- Node.js 26 upgrade / PR #47 CI redesign.
- Production Cloudflare deployment.
- Production D1 provisioning, accounts and cloud sync.
- AI tutor, automatic polyphonic chord grading and other features that depend on a validated evidence engine.
- Social/community features, marketplace/subscriptions and DAW-scale recording features.

## 4. Working and PR rules

1. Work on one implementation PR at a time.
2. Before starting a new implementation PR, inspect and resolve any existing open PR according to its priority. Do not silently abandon or bypass it.
3. Use small, independently testable slices with clear acceptance criteria.
4. Do not weaken assertions, skip required checks or increase timeouts merely to hide a failure.
5. Never commit credentials, private learner records, recordings or production data.
6. Use the current `main` SHA as the branch base and avoid force-pushing.
7. Run the relevant formatting, lint, type/Svelte checks, unit tests, database/curriculum validation, production build and browser acceptance.
8. Merge only after the user authorises it and all required checks pass.
9. Do not deploy to Cloudflare production without explicit approval.
10. Update this document and the implementation tracker after every merged slice.

## 5. Resume protocol — use this every time work restarts

When the user says “resume GuitarLab”, “continue the plan” or similar:

1. Read this file from the current `main` branch.
2. Fetch the current `main` SHA; do not assume it is the baseline SHA recorded above.
3. Inspect open PRs, open Issues, active Actions runs and the latest completed main CI run.
4. Check whether the current priority's acceptance criteria have changed or been completed by a later merge.
5. If a PR is in progress, continue that PR first unless it is blocked; report the blocker and a safe alternative.
6. Otherwise start the highest-priority incomplete task in Section 2.
7. Update the checklist/status below with evidence, PR links, CI run links and the next exact action.
8. Do not repeat completed work. Do not infer completion from an old chat summary.

## 6. Live progress checkpoint

This section is the hand-off state. Update it before pausing work.

| Field | Current value |
|---|---|
| Last verified main SHA | `0780df6dbe9d2889a28c4bc802270995ff71197f` |
| Latest observed successful code CI | [#43173177888](https://github.com/leenusdarnal/guitarlab/actions/runs/43173177888) on the pre-documentation code baseline; PR #48 documentation CI passed before merge. Verify a fresh main run on resume |
| Open implementation PR | PR #49 documentation reconciliation; no application-code PR observed |
| PR #47 | Closed, unmerged; deferred |
| Current phase | P0 — baseline audit and documentation reconciliation |
| Current task | Documentation reconciliation is in PR #49; review its CI and merge before starting P1 |
| Next task after P0 | P1 — complete physical-device offline and backup/restore acceptance; preview HTTPS environment/credentials are a dependency and must not be provisioned without approval |
| Production deployment | Deferred; explicit approval required |

### Status update template

Append or replace this section when work progresses:

- **Date:**
- **Main SHA:**
- **Task completed:**
- **PR / issue:**
- **CI evidence:**
- **Manual QA evidence:**
- **Remaining blockers:**
- **Next exact task:**
- **Decisions / deferred items:**

---

**Source-of-truth hierarchy:** current code and tests on `main` → merged PR evidence → current GitHub Issues/Actions → this execution checkpoint → older chat summaries. If they conflict, inspect and reconcile rather than trusting the oldest status.
