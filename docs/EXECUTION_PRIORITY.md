# GuitarLab Execution Priority and Resume Plan

**Last verified:** 2026-11-12  
**Repository:** `leenusdarnal/guitarlab`  
**Default branch:** `main`  
**Last verified main commit:** `1f2e8e9bf4ba2c2164ef76c09336254a0f83303d`  
**Document purpose:** Durable execution queue and restart checkpoint. Update this file after each meaningful implementation slice and before pausing work.

> This is an execution plan, not a claim that every listed item has been re-audited. The first task on every resume is to refresh the live repository state and reconcile this document with the code, Issues, PRs and CI.

## 1. Current verified baseline

### Repository and delivery state

- `main` points to `1f2e8e9bf4ba2c2164ef76c09336254a0f83303d` after squash-merging PR #56 (local append-only exercise evidence persistence and backup/restore support).
- Post-merge main CI [#43258018206](https://github.com/leenusdarnal/guitarlab/actions/runs/43258018206) completed successfully, including both application/curriculum and Node.js 26 compatibility jobs and all browser suites.
- Canonical local development remains Node.js `22.23.5` (`.nvmrc`); Node.js 26 is a separate compatibility job, not an upgrade of the baseline.
- PRs #45–#56 are merged except PR #47, which remains **closed without merging** and deferred. There were no open PRs after PR #56 merged; this checkpoint starts a new single-slice PR.
- Open product issues remain, including #16–#18 and manual acceptance follow-ups on #9/#10.
- The active `Protect main branch` repository ruleset requires PRs and the `Validate application and curriculum` status check; it also blocks branch deletion and non-fast-forward updates.
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
| Last verified main SHA | `1f2e8e9bf4ba2c2164ef76c09336254a0f83303d` |
| Latest successful main CI | [#43258018206](https://github.com/leenusdarnal/guitarlab/actions/runs/43258018206) — application/curriculum and Node 26 compatibility passed |
| Open PRs at resume | None before the current focused UI slice |
| PR #47 | Closed without merge; explicitly deferred |
| Main protection | Active repository ruleset; PR required; `Validate application and curriculum` required status check |
| Current phase | P2 — Practice Studio evidence loop |
| Current task | Add learner-facing exercise observation capture/history and optional session reflection/next target on `feat/m7-practice-studio-evidence-ui` |
| Next task | Add review scheduling/history filters and explicit evidence-to-mastery rules in separate slices |
| Manual QA | Physical desktop/iOS/Android offline and backup acceptance remains unverified |
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


## Resume checkpoint — 2026-11-12 (M7 first slice)

- **Verified main baseline:** `9ea94efc10b6d229ba8d414e6f41e7cb35a3183e` (merge of PR #49).
- **Active implementation PR:** [#50 — local Practice Studio session flow](https://github.com/leenusdarnal/guitarlab/pull/50).
- **Branch:** `feat/m7-practice-evidence-contract`.
- **Implemented in this slice:** `/practice` route; dashboard desktop/mobile navigation; active learner-scoped IndexedDB session listing; session start with optional focus and planned duration; live elapsed display; finish using actual wall-clock duration; local session history; reload recovery for an in-progress session.
- **Reused existing code:** application `startPracticeSession` / `finishPracticeSession` services, `PracticeSessionRepository`, IndexedDB v2 `practiceSessions` store and its learner index.
- **Learning integrity:** duration is wall-clock session elapsed time (including time between reloads), not verified active playing; it is activity metadata only and creates no skill assessment or mastery. Planned minutes are kept separate from elapsed duration.
- **Validation state:** existing application service tests cover lifecycle validation and the no-mastery invariant. A route-specific Playwright flow is now added to `scripts/browser-acceptance.mjs` for start → reload recovery → finish → history. Latest observed head run [#43193353005](https://github.com/leenusdarnal/guitarlab/actions/runs/43193353005) is in progress at Playwright installation; re-check the current PR head and required check before merging.
- **Known limitation:** active-session prevention is a read-before-create guard, not a cross-tab atomic lock. Fix this alongside pause/resume before treating concurrent-tab safety as complete. The timer remains wall-clock elapsed time, not verified active playing.
- **P1 still outstanding:** physical desktop/iOS/Android offline and backup/restore checks require real devices and must remain unverified until evidence is supplied.
- **CI correction:** first primary CI attempt failed only at changed-file Prettier for `src/lib/storage/practice.ts` (two line wraps); those exact formatting changes were applied. No validation assertion was weakened. A new CI run was triggered for the corrected head.
- **Next exact implementation:** add transactional single-active-session enforcement, pause/resume with accumulated active time, and interruption/reload tests. Then add exercise sequencing and immutable exercise observations; keep observations distinct from validated mastery assessments.
- **Deferred:** PR #47 Node 26/CI redesign; Cloudflare preview/production deployment; production D1/auth/cloud sync. No deployment was performed.


### PR #50 browser acceptance fix — 2026-11-12

- **Root cause:** Svelte's `<input type="number">` `bind:value` supplies a numeric value (or `undefined` when empty), but the Practice Studio start handler called `plannedMinutes.trim()` as if it were a string. This raised a caught `TypeError` before the start service ran, leaving the page in its idle state and causing the browser test to time out waiting for the active-session heading.
- **Fix committed:** `8746de96179574b1a28a5a73e9bd8349d486b3f9` (`fix(m7): handle numeric practice duration input`). The state is now `number | undefined`, blank maps to `null`, and supplied values are checked with `Number.isSafeInteger` plus the existing 1–180 minute bounds.
- **Validation:** The full PR CI must be rechecked on the latest head; do not merge until browser acceptance and all required checks pass. The browser test exercises numeric duration entry, start, reload recovery, finish and history.
- **Resume:** If CI still fails, inspect the latest `Browser acceptance tests` job log first; check the rendered alert text and browser runtime errors before changing selectors or weakening assertions.


## Resume checkpoint — 2026-11-12 (M7.2 pause/resume slice)

- **Main baseline:** `ee63b1ac04961a6d438275bbc379c6ade7a3b1e3` (PR #50 merged).
- **Branch:** `feat/m7-pause-resume-active-time`.
- **Scope:** pause/resume lifecycle, accumulated active-time accounting, transactional single-active-session enforcement across tabs, reload recovery and browser acceptance.
- **Time semantics:** paused intervals are excluded; legacy in-progress rows without `activeStartedAt` fall back to `startedAt`; elapsed time remains activity metadata, never mastery evidence.
- **P1 manual gate:** physical desktop/iOS/Android offline and backup/restore acceptance remains unverified and requires device evidence. Keep release sign-off open.
- **Validation:** Latest PR #51 CI run `43207060655` passed both required jobs (application/curriculum and Node.js 26), including the two-tab concurrency browser acceptance. PR remains open and unmerged.
- **Review follow-ups:** paused status is preserved in dashboard/practice-plan read models and the two-tab concurrency assertion is now included. The unused server-side D1 schema remains intentionally unchanged until its migration is introduced. No outstanding code-level blocker was identified in the final review.
- **Next exact task:** obtain explicit user approval before merging PR #51. Physical desktop/iOS/Android offline and backup/restore QA remains a separate release gate.


## Resume checkpoint — 2026-11-12 (live baseline refresh before M7 evidence persistence)

- **Verified main:** `49afa10698c6e96a2c1ec01077da08ba5ddd0ffe`; latest main CI [#43246790446](https://github.com/leenusdarnal/guitarlab/actions/runs/43246790446) passed.
- **Open PRs:** none at resume. **PR #47:** closed without merge; remains deferred.
- **Protection:** active `Protect main branch` ruleset requires pull requests and the `Validate application and curriculum` check.
- **Completed since the previous checkpoint:** PR #50 session lifecycle; PR #51 pause/resume, active-time accounting and concurrency guard; PR #52 validated exercise-observation contract; PR #53 curriculum/practice lookup optimization; PR #54 UI/navigation improvements; PR #55 automated accessibility browser checks.
- **Next implementation slice:** append-only learner-scoped practice observations in IndexedDB, with export/restore/reset and v1-to-v4 migration coverage. This is local practice activity evidence only, not mastery.
- **Manual release gate:** physical desktop/iOS/Android offline, reload and backup/restore acceptance remains unverified and must not be marked complete without real-device evidence.
- **Deferred:** Node 26 CI redesign from PR #47, Cloudflare preview/production deployment, production D1, accounts and cloud sync.


## Resume checkpoint — 2026-11-12 (PR #56 merged; Practice Studio UI next)

- **Verified main:** `1f2e8e9bf4ba2c2164ef76c09336254a0f83303d`; post-merge CI [#43258018206](https://github.com/leenusdarnal/guitarlab/actions/runs/43258018206) passed the required application/curriculum job and Node.js 26 compatibility.
- **Protection:** main remains protected; pull requests and the `Validate application and curriculum` check are required.
- **Merged:** PR #56 adds learner-scoped append-only exercise observations, IndexedDB v4 persistence, backup/restore/reset support and migration coverage.
- **Current focused slice:** `feat/m7-practice-studio-evidence-ui` adds capture/display of learner-entered repetitions, clean repetitions, tempo and difficulty; session reflection and next target are optional and must survive backup export/restore.
- **Learning integrity:** elapsed time is activity metadata; clean repetitions, repetitions, tempo and difficulty remain separate self-reported observations. Nothing in this slice grants mastery or computes an automatic accuracy score.
- **Next after merge:** build review scheduling and history filtering as another small PR; only then connect evidence to explicit, correctable skill-state rules.
- **Manual release gate:** physical desktop/iOS/Android offline, reload and backup/restore acceptance remains unverified.
- **Deferred:** PR #47 Node 26/CI redesign, Cloudflare preview/production deployment, production D1, accounts and cloud sync.
