# GuitarLab Engineering Quality & Release Tracker

**Status:** Active — canonical engineering-quality tracker  
**Last reconciled:** 21 November 2026  
**Audit baseline:** `main` at `346c723ace482a908785decfdb390773719619d4` (PR #220 merged; latest main status reports `Validate application and curriculum` = success; 21 November 2026)  
**Scope:** Architecture, UX, accessibility, performance, offline/PWA, privacy, security, authentication and release acceptance.

> **Single source of truth:** This document owns the live status, priority, evidence and next actions for the engineering-quality work listed below. Do not maintain parallel checklists for these same tasks in the legacy UX, optimization, implementation, execution-priority or real-device tracker files.

---

## 1. How to use this tracker

### 1.1 Source-of-truth rules

| Concern | Authority | What belongs there |
|---|---|---|
| Engineering-quality task status | **This document** | Priorities, task state, owners/PRs, automated and manual evidence, release gates |
| Product milestones and feature scope | [ROADMAP.md](ROADMAP.md) | M0–M9 milestone-level progress only; link here for detailed quality acceptance |
| Product and data architecture | [ARCHITECTURE.md](ARCHITECTURE.md) | Accepted architecture and trust boundaries; not task status |
| Visual and interaction specification | [DESIGN_DIRECTION.md](DESIGN_DIRECTION.md) and [IMPLEMENTATION_GUIDELINES.md](IMPLEMENTATION_GUIDELINES.md) | Design and product behaviour decisions; not task status |
| Authentication/security decisions | [AUTHENTICATION_DECISION.md](AUTHENTICATION_DECISION.md), [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md), [SECURITY_RESPONSE_POLICY.md](SECURITY_RESPONSE_POLICY.md) | Design constraints, configuration and security policy; this document tracks whether they are verified |
| Automated test procedures | [BROWSER_ACCEPTANCE.md](BROWSER_ACCEPTANCE.md) | How to run automated browser acceptance |
| Manual test procedures | [MANUAL_ACCEPTANCE.md](MANUAL_ACCEPTANCE.md) | Step-by-step physical-browser and storage acceptance; record outcomes/status here |
| Curriculum remediation | [CURRICULUM_AUDIT_AND_REMEDIATION_TRACKER.md](CURRICULUM_AUDIT_AND_REMEDIATION_TRACKER.md) | Sole live task status for curriculum authoring, mapping, prerequisite/progression, assessment and taxonomy remediation |\n| Historical UX findings | [UI_UX_AUDIT.md](UI_UX_AUDIT.md), [UI_UX_AUDIT_2026-11-15.md](UI_UX_AUDIT_2026-11-15.md) and dated research reports | Evidence snapshots only; current UX status belongs in this tracker |

The legacy documents [UI_UX_IMPLEMENTATION_TRACKER.md](UI_UX_IMPLEMENTATION_TRACKER.md), [OPTIMIZATION_ROADMAP.md](OPTIMIZATION_ROADMAP.md), [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md), [EXECUTION_PRIORITY.md](EXECUTION_PRIORITY.md) and [REAL_DEVICE_VALIDATION_MATRIX.md](REAL_DEVICE_VALIDATION_MATRIX.md) are now navigation/compatibility pointers. Their former task lists have been reconciled into this tracker. The repository's Git history retains the prior versions.

GitHub Issues remain the durable discussion and ownership records. This document is the consolidated engineering-quality status view. A task is not complete merely because its code exists or a related issue is closed.

### 1.2 Status definitions

| Status | Meaning |
|---|---|
| **OPEN** | Not implemented or not yet sufficiently tested |
| **PARTIAL** | Some implementation or automated coverage exists; required acceptance is incomplete |
| **IN PROGRESS** | An identified implementation/review is actively underway |
| **BLOCKED** | Cannot be verified until a device, account, environment, decision or other prerequisite is available |
| **DONE — automated** | Implementation is merged and all stated automated checks pass |
| **VERIFIED — manual** | Required human/device/assistive-technology evidence is dated and recorded |
| **DEFERRED** | Deliberately out of the current release; not a hidden release blocker unless scope changes |

Priority: **P0** = privacy/security boundary requiring immediate correction; **P1** = learner-critical, accessibility or release-gate work; **P2** = meaningful performance/maintainability improvement; **P3** = optional enhancement.

### 1.3 Reconciliation baseline

- PR #186 merged to `main` as `2a1e50cd0d91ddabe941deeb6c480b7521940046`; final required CI run [#44341993219](https://github.com/leenusdarnal/guitarlab/actions/runs/44341993219) passed all three checks. The CSS inventory remains a historical source scan at `6439dac92f889b3838e4446023e563a11db56e7` and should be refreshed only if source changes materially affect styling.
- Main at this reconciliation is `0cefe5722cca1f27391ff968f150f67824b05326` (20 November 2026; PR #212 merged). Post-merge CI run [#44783678807](https://github.com/leenusdarnal/guitarlab/actions/runs/44783678807) passed the required checks on that exact SHA.
- Main GuitarLab CI run [#44310609981](https://github.com/leenusdarnal/guitarlab/actions/runs/44310609981) completed successfully.
- Main curriculum validation [#44310610413](https://github.com/leenusdarnal/guitarlab/actions/runs/44310610413) completed successfully.
- PR #180's final required CI run [#44287911608](https://github.com/leenusdarnal/guitarlab/actions/runs/44287911608) passed before merge.
- PR #188 and PR #189 delivered two narrowly scoped shared guitar-tool chrome extractions; PR #189 is merged as `f0eab761d49823c163243311ba47018c0feb42b3` after all three required CI jobs passed.
- PR #190 moved Playwright 1.56.1 and axe-core 4.14.0 into exact lockfile-controlled development dependencies and removed the second install. Required CI [run #44469593267](https://github.com/leenusdarnal/guitarlab/actions/runs/44469593267) passed all three jobs, including browser, WebKit and accessibility suites; merged as `96eea7728b51a03b5a4ebd291c8b752329fbf27c`.
- PR #205 completed local authentication lifecycle/security acceptance and merged as `8ccc7e18ce5f06d5e76d42e136f89814b5c722ef`. Final PR-head CI [run #44669861146](https://github.com/leenusdarnal/guitarlab/actions/runs/44669861146) passed all required jobs, including HTTPS/HSTS and secure-cookie checks, session refresh/expiry, reset-token expiry/replay, session revocation, auth-route accessibility and diagnostic redaction. Preview/production provisioning and deployed-environment review remain separate SEC-02/SEC-05 gates.
- PR #219 merged account and local learner-profile settings as `194d29b425045d551194968f9fa8e68366a6011a`; Issue #218 is closed. PR #220 then fixed the WebKit mobile-menu state race and merged as current `main` at `346c723ace482a908785decfdb390773719619d4`. The latest main combined status reports `Validate application and curriculum` = success; this does not prove production deployment.
- Read-only production inspection on 21 November 2026 confirmed the dedicated `AUTH_DB` binding and five expected auth tables, with `0001_auth_tables.sql` recorded in `d1_migrations`. Expected Better Auth/Google/GitHub secret binding names are present; secret values were not read or validated.
- Cloudflare showed 100% of production traffic on Worker version `ae75036a-a2ef-4856-8962-4114f805199e` (version 9), deployed at `2026-11-21T18:19:26Z`. That version metadata contains no Git SHA, `workers/tag` or `workers/message`; its timestamp is not proof of the source commit. The guarded production workflow now writes the Git SHA and workflow identity into future Worker version tags/messages and retains an evidence artifact. No production traffic or configuration was changed during this inspection.
- PR #177 delivered the Better Auth runtime foundation; PR #216 reconciled the supported product to Google/GitHub OAuth-only account access. Email/password, verification email, password reset and transactional email are not supported product flows. Production provider acceptance remains tracked under SEC-02.
- The initial offline app-shell/previously visited public-page caching slice was delivered in PR #35; its original Issue [#34](https://github.com/leenusdarnal/guitarlab/issues/34) is closed. That closure does **not** establish the authenticated-page cache boundary or physical-device offline acceptance described below.
- No live Core Web Vitals or production bundle-budget measurements were established by this audit. No physical-device, screen-reader or real-guitar recording results are claimed.

### 1.4 Current priority queue

| Order | Task | Priority | Status |
|---:|---|---|---|
| 1 | OFF-01 — Restrict Cache Storage to explicitly public content | P0 | DONE — automated |
| 2 | OFF-02 — Add cache-isolation, logout and offline regression tests | P1 | DONE — automated |
| 3 | OFF-03 — Harden offline navigation and service-worker lifecycle | P1 | DONE — automated |
| 4 | SEC-01 — Complete authenticated account lifecycle acceptance | P1 | DONE — automated — local Worker lifecycle/security acceptance merged in PR #205; required CI passed |
| 5 | SEC-02 — Activate production-only Google/GitHub OAuth | P1 | PARTIAL — production AUTH_DB binding, five expected auth tables, recorded `0001_auth_tables.sql` migration and all five expected secret binding names are present. Secret/provider values and callback functionality are not proven; complete production Google/GitHub OAuth, session and guest smoke tests. Preview is removed; email/password/Resend remain out of scope. |
| 6 | CI-05 — Make browser-test dependencies lockfile-controlled | P1 | DONE — automated |
| 7 | UX-02 / UX-03 — Complete manual accessibility and physical-device acceptance | P1 | BLOCKED |
| 8 | QA-03 — Complete physical-device storage/offline/backup acceptance | P1 | BLOCKED |
| 9 | QA-01 / QA-02 — Complete real-audio and physical-browser validation | P1 | BLOCKED |
| 10 | QA-04 — Reconcile exact production SHA and rollback evidence | P1 | OPEN |
| 11 | PERF-01 — Establish production bundle and Core Web Vitals baselines | P2 | OPEN |
| 12 | ARC-01 / ARC-02 — Split route components and consolidate shared UI patterns | P2 | OPEN |
| 12 | CSS-01 — Inventory Tailwind version, configuration and styling usage | P2 | DONE — read-only |
| 13 | CSS-02 — Review CSS ownership, hotspots and duplication candidates | P2 | DONE — automated review |
| 14 | CSS-03 — Define staged Tailwind/CSS modernisation plan | P2 | DONE — documented |
| 15 | CSS-04 — Implement approved, incremental CSS improvements | P2 | IN PROGRESS — narrow token-mapped Tailwind utility migrations in PRs #196–#198 are merged; no further route migration until CSS-05 evidence is collected |
| 16 | CSS-05 — Verify visual, accessibility and build regressions | P2 | IN PROGRESS — reconcile merged slices, establish reproducible built-CSS measurements and complete visual acceptance |
| 17 | OFF-04 — Physical-device offline acceptance (future follow-up) | P2 | DEFERRED — outside the current implementation sequence |

---

## 2. Offline, service worker and data privacy

**Goal:** preserve useful local-first offline learning without ever replaying or storing private account/session content as a public app page.

| ID | Priority | Status | Finding / required outcome | Evidence / dependency |
|---|---|---|---|---|
| OFF-01 | P0 | **DONE — automated** | PR #193 completes the server-side public-only response boundary: authenticated/private routes and every response setting `Set-Cookie` receive `Cache-Control: private, no-store`, and the public cache marker is removed. The service worker only stores validated public navigations. | [PR #193](https://github.com/leenusdarnal/guitarlab/pull/193); [CI run #44509897385](https://github.com/leenusdarnal/guitarlab/actions/runs/44509897385) |
| OFF-02 | P1 | **DONE — automated** | Unit and browser regression coverage verifies cookie-setting response policy, private route families, no private cache reads/replay, successful public-page caching, network-first navigation, transient 5xx public-cache fallback, 404 preservation and explicit offline fallback for unvisited pages. Browser offline tests stop the loopback Worker so they exercise an actual network failure rather than Playwright's offline emulation alone. | [PR #193](https://github.com/leenusdarnal/guitarlab/pull/193); [CI run #44509897385](https://github.com/leenusdarnal/guitarlab/actions/runs/44509897385) |
| OFF-03 | P1 | **DONE — automated** | Navigation hardening, failed-install cache rollback, read/write failure coverage and real multi-tab update/waiting/activation acceptance are merged. Required CI passed on PR #195. | [PR #193](https://github.com/leenusdarnal/guitarlab/pull/193); [PR #195](https://github.com/leenusdarnal/guitarlab/pull/195); [CI run #44522527995](https://github.com/leenusdarnal/guitarlab/actions/runs/44522527995). Physical-device testing remains separate under OFF-04 |
| OFF-04 | P2 | **DEFERRED** | Future physical-device acceptance, deliberately deferred on 19 November 2026 and not a blocker for the current implementation sequence. On real iOS Safari and Android Chrome: visit a public lesson online, activate the worker, go offline, reopen the visited lesson, verify an unvisited page gets an accessible fallback, restore connectivity and repeat in portrait/landscape. | Reopen when physical-device testing is scheduled; follow [MANUAL_ACCEPTANCE.md](MANUAL_ACCEPTANCE.md); Issues #9/#10/#18 |
| OFF-05 | P3 | **DEFERRED** | Decide and implement full PWA installability and learner-selected offline curriculum packs, including storage quota messaging and explicit download/remove controls. Do not silently precache the entire curriculum. | M9 in [ROADMAP.md](ROADMAP.md) |

### OFF-01 acceptance checklist

**Implemented and merged:** [PR #186](https://github.com/leenusdarnal/guitarlab/pull/186) enforces the public-only page-cache boundary and passed final required CI, including browser acceptance, on merged commit `2a1e50cd0d91ddabe941deeb6c480b7521940046`. This establishes automated coverage, not physical-device acceptance; OFF-04 remains a separately tracked future task and should be resumed when physical-device testing is scheduled.


- [ ] Cache only an explicit allowlist of public app assets and public curriculum pages, or require an explicit public cache directive in addition to an allowlist.
- [ ] Do not rely on the absence of `Set-Cookie` as the privacy boundary.
- [ ] Mark authenticated account HTML and sensitive authentication responses `Cache-Control: private, no-store`.
- [ ] Exclude account, sign-in, sign-up, verification, password-reset, session and all API/private routes from runtime page caching.
- [ ] Exclude responses that vary by credentials/cookies or otherwise contain user-specific data.
- [ ] Keep non-GET and cross-origin requests out of Cache Storage.
- [ ] Confirm only public lesson content and static app assets are cacheable.
- [ ] Preserve the bounded page-cache policy and remove stale GuitarLab cache versions safely.

### OFF-02 regression checklist

- [ ] Public lesson response is cached and can be reopened offline.
- [ ] Authenticated account response is not present in any Cache Storage entry.
- [ ] A signed-in learner goes offline and cannot receive a previously cached account page through the service worker.
- [ ] After logout, offline navigation does not replay the prior account page or authenticated HTML.
- [ ] Login, registration, verification and password-reset responses are never cached.
- [ ] API, private/no-store, credential-varying, cross-origin and non-GET traffic is not cached.
- [ ] Offline fallback is accessible, identifies the offline state and offers a clear retry/reconnect path.
- [ ] A cache quota/write failure does not break an otherwise successful online navigation.
- [ ] Service-worker update/activation removes only stale GuitarLab-owned caches and works with multiple open tabs.

**Security note:** the OFF-01/OFF-02 privacy boundary and regression coverage are automated and merged. Physical-device offline acceptance has not been performed; it is deliberately deferred under OFF-04. Do not describe offline behaviour as physically device-verified until that future acceptance is recorded.

---

## 3. UX, accessibility and responsive usability

**Goal:** make learning actions easy to find and operate with keyboard, touch, zoom and assistive technologies, including while the learner is holding a guitar.

| ID | Priority | Status | Finding / required outcome | Evidence / dependency |
|---|---|---|---|---|
| UX-01 | P1 | **PARTIAL** | Verify the searchable lesson finder manually: search by title/topic/focus/checkpoint/route, all 152 lessons across six paths, filters, clear/no-result recovery, direct links and stable lesson order. | Automated curriculum browser coverage exists; manual acceptance remains open |
| UX-02 | P1 | **BLOCKED** | Complete keyboard-only, visible-focus, skip-link, Escape, route-change focus, actual 200% browser zoom and screen-reader acceptance on real browsers/devices. | Axe/focus/reflow automation exists; VoiceOver/TalkBack not tested |
| UX-03 | P1 | **BLOCKED** | Validate the five-item mobile navigation, safe areas, notch/landscape/browser-chrome behaviour, 44–48px controls and one-handed reach on a physical phone. | PR #166 and responsive automation are merged; physical-device evidence absent |
| UX-04 | P1 | **PARTIAL** | Finish learner-facing hierarchy and consistency: the next useful action and today's plan should lead on mobile; action-looking cards/rows must have meaningful semantics and visible focus; remove stale labels/disclaimers. | See source audit and remaining UX items below |
| UX-05 | P1 | **PARTIAL** | Finish Practice Studio ergonomics: correction actions remain secondary, one clear mastery explanation, compact tuner/metronome access, wake-lock fallback and session recovery without counting idle time as active practice. | Existing session lifecycle and mobile action-placement tests are merged |
| UX-06 | P1 | **PARTIAL** | Complete instrument-tool acceptance for fretboard/chord diagrams, tuner, metronome and ear training: touch, keyboard, text alternatives, stable state announcements and physical microphone behaviour. | Automated tool suites exist; manual/device work tracked in QA-02 |
| UX-07 | P2 | **PARTIAL** | Complete design-system adoption: readable instructional type, semantic dark/light tokens, consistent controls/panels/alerts/empty states and reduced route-level style duplication. | Brand, icons and theme foundation shipped; full shared component/token sweep remains open |
| UX-08 | P2 | **OPEN** | Measure layout shift before adding more loading skeletons; audit all remaining learner-facing errors for a specific retry and next action. | Optimization and UX audit findings |
| UX-09 | P1 | **OPEN** | Run five learner think-aloud tasks and record completion, time, taps, confusion and follow-up actions. | Requires participant/device access; no learner usability results are claimed |

### UX-02 / UX-03 acceptance checklist

- [ ] Test Today, Learn, one lesson, Practice, tuner, Tools and Data & backups using keyboard only.
- [ ] Confirm skip link reaches a focusable main-content target.
- [ ] Confirm focus remains visible and is not lost after save, menu close, modal/dialog action or route navigation.
- [ ] Confirm Escape closes the mobile More menu and returns focus to its trigger.
- [ ] Test actual 200% browser zoom; viewport-equivalent 640 CSS-pixel tests are useful automation but are not browser-zoom evidence.
- [ ] Test VoiceOver with iOS Safari for Today, Learn, a lesson, Practice and tuner.
- [ ] Test TalkBack with Android Chrome for the same core journeys.
- [ ] Test 320, 360, 390, 768 and 1280 CSS-pixel widths; verify no horizontal page overflow and no clipped focusable content.
- [ ] Test portrait and landscape, safe-area insets and mobile browser chrome on physical devices.
- [ ] Verify controls and navigation are reachable while holding a guitar; record touch-target issues rather than assuming 44px sizing alone proves usability.
- [ ] Verify dark and light themes for every tested route.
- [ ] Review icon-only controls in the browser accessibility tree; automated accessible-name checks do not replace human review.

### UX-04 / UX-05 remaining product checks

- [ ] Put the next useful learning action and today's plan first on the mobile Today screen.
- [ ] Ensure every task card, review row and apparent action has the correct link/button semantics and visible focus.
- [ ] Keep correction/analytics subordinate to the primary practice action.
- [ ] Provide one concise explanation of the difference between activity, completion and skill mastery.
- [ ] Make tuner/metronome hand-off available without losing the active session; preserve explicit learner control.
- [ ] Review wake-lock unsupported, denied, auto-released, hidden-tab and teardown states.
- [ ] Confirm elapsed wall-clock time or idle gaps are not counted as active practice evidence.
- [ ] Remove/rewrite stale tool disclaimers and labels that no longer describe the product.

### UX-06 / UX-07 remaining consistency checks

- [ ] Test fretboard/chord diagrams with keyboard and touch; preserve a useful textual equivalent.
- [ ] Verify high-frequency tuner updates remain visual and stable note/state changes are announced succinctly.
- [ ] Ensure microphone access is explicit, denial is recoverable and no audio is uploaded by default.
- [ ] Audit learner-facing body copy so instructional content is not styled as small muted metadata.
- [ ] Finish shared semantic text/control tokens across routes and both themes.
- [ ] Extract shared buttons, fields, panels, banners, empty states and status messages incrementally.
- [ ] Measure CLS on Today and other large surfaces before deciding where skeletons are useful.

### UX-09 learner research tasks

Run these five tasks with representative learners using a physical device:

1. Start a 10-minute practice session.
2. Find and resume a lesson.
3. Find a lesson by topic.
4. Tune the guitar.
5. Start a 60 BPM metronome and back up progress.

Record device/browser, theme, task completion, time, taps, confusion points and observed accessibility barriers. Do not infer successful usability from source review or automated CI.

---

## 4. Performance and loading

**Goal:** establish measured performance baselines before optimizing; protect responsiveness on modest phones and slower networks.

| ID | Priority | Status | Finding / required outcome | Evidence / dependency |
|---|---|---|---|---|
| PERF-01 | P2 | **OPEN** | Establish production bundle and route-level transfer baselines; publish a bundle report and agree initial budgets. | [OPTIMIZATION_ROADMAP.md](OPTIMIZATION_ROADMAP.md) historical roadmap; no current budget |
| PERF-02 | P2 | **OPEN** | Measure LCP, INP and CLS for dashboard, Learn, lesson reader, Practice and Tools on desktop and mobile profiles. | No current production field/lab baseline established |
| PERF-03 | P2 | **OPEN** | Reduce eager loading of large lesson bodies and split oversized route modules by feature where this reduces measured cost. | Existing generated compact curriculum index is a completed optimization |
| PERF-04 | P2 | **OPEN** | Profile interaction latency and long tasks on lesson search, dashboard planning and interactive music tools; optimize only measured bottlenecks. | Modern Web Guidance performance references |
| PERF-05 | P2 | **OPEN** | Review hard document navigations used for internal destinations and use SvelteKit navigation where it preserves expected semantics and improves measured transitions. | Source review candidate; not yet measured as a defect |

### Performance acceptance checklist

- [ ] Capture a production build baseline with total JS/CSS, route chunks, largest dependencies and compressed transfer sizes.
- [ ] Set and document an initial bundle budget only after recording the baseline.
- [ ] Capture LCP/INP/CLS for the five high-value journeys above under repeatable mobile and desktop conditions.
- [ ] Record test device profile, browser, viewport, network/CPU throttling and exact commit SHA.
- [ ] Inspect long tasks and INP interaction attribution before changing interaction code.
- [ ] Consider `web-vitals` attribution only after privacy and telemetry decisions are reviewed; do not send learner notes, account data, raw input or sensitive URL/query content to analytics.
- [ ] Treat Long Animation Frames data as optional diagnostic enhancement: support is not uniform across Safari and Firefox, and core functionality must not depend on it.
- [ ] Re-measure after each optimization and report the before/after result; do not claim a performance gain from source-size estimates alone.

**Completed optimization retained:** the dashboard uses a generated compact curriculum index instead of importing the entire Year 1 authored lesson body. The historical estimate of roughly 98% smaller raw source bytes describes that index comparison, not a measured 98% reduction in network transfer or JavaScript bundle size.

---

## 5. Architecture and frontend maintainability

**Goal:** improve change safety and consistency without replacing SvelteKit/Svelte 5 or weakening the local-first architecture.

| ID | Priority | Status | Finding / required outcome | Evidence / dependency |
|---|---|---|---|---|
| ARC-01 | P2 | **OPEN** | Split large route-level screens into feature components (Today dashboard, lesson reader, fretboard, chord library, Data & backups). | [OPTIMIZATION_ROADMAP.md](OPTIMIZATION_ROADMAP.md) |
| ARC-02 | P2 | **OPEN** | Consolidate repeated buttons, form fields, chips, panels, alerts, empty states and loading/error patterns into shared components where behaviour is genuinely shared. | UI audit and design direction |
| ARC-03 | P2 | **OPEN** | Centralise theme preference resolution and persistence; remove duplicate theme application logic between root layout and dashboard. | `src/routes/+layout.svelte`; `src/routes/+page.svelte` |
| ARC-04 | P2 | **OPEN** | Decompose oversized application orchestration and IndexedDB modules along use-case/repository boundaries, retaining framework-independent domain logic. | Architecture and optimization roadmaps |
| ARC-05 | P2 | **OPEN** | Document supported browsers and baseline policy for any newly adopted web platform feature; add fallbacks for features outside the supported baseline. | Modern Web Guidance; physical matrix in Section 7 |

### Architecture guardrails

- Keep the current SvelteKit/Svelte 5/TypeScript/Cloudflare Workers architecture.
- IndexedDB remains the primary local learner-data authority.
- Keep public curriculum separate from private learner data.
- Keep music calculations and learning-state rules framework-independent.
- Components depend on application/repository contracts, not directly on Drizzle or server-only bindings.
- Avoid introducing large dependencies when browser-native functionality or existing project components meet the need.
- Do not split files solely to reduce line count; make boundaries around coherent responsibilities and test them.

---

## 6. Security, authentication and account readiness

**Goal:** account sign-in remains optional and must not weaken guest/local learning or activate cloud learner-data storage prematurely.

| ID | Priority | Status | Finding / required outcome | Evidence / dependency |
|---|---|---|---|---|
| SEC-01 | P1 | **DONE — automated** | Local Better Auth lifecycle/security acceptance is covered against the HTTPS Wrangler Worker and isolated local AUTH_DB (PR #205). This verifies the auth foundation, not production OAuth configuration or provider callbacks. The supported account methods are Google and GitHub OAuth; email/password and transactional email are out of scope after PR #216. | [PR #203](https://github.com/leenusdarnal/guitarlab/pull/203); [PR #204](https://github.com/leenusdarnal/guitarlab/pull/204); [PR #205](https://github.com/leenusdarnal/guitarlab/pull/205); [CI run #44669861146](https://github.com/leenusdarnal/guitarlab/actions/runs/44669861146); [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) |
| SEC-02 | P1 | **PARTIAL — production acceptance** | Read-only Cloudflare inspection on 21 November 2026 confirms the production `AUTH_DB` binding points to the dedicated `guitarlab-auth-production` D1 database; the `user`, `session`, `account`, `verification` and `rateLimit` tables exist; `d1_migrations` records `0001_auth_tables.sql` as applied; and the Worker exposes the expected names for `BETTER_AUTH_SECRET` plus both Google/GitHub client ID/secret bindings. Secret values were not read, so their correctness is not established. Production Google/GitHub callback/state, session refresh/logout and guest-flow acceptance remains open. Keep endpoints fail-closed until end-to-end checks pass. Preview is removed; email/password, Resend and `AUTH_FROM_EMAIL` are out of scope. | [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) |
| SEC-03 | P1 | **DONE — automated (local Worker)** | Local security acceptance verifies untrusted-Origin rejection, rate limiting, session lifecycle/revocation, secure HTTPS cookie attributes, sensitive diagnostic redaction and accessibility of the auth routes. Historical credential-flow test evidence does not make email/password, verification email or password reset supported product features. Production HTTPS/CSP/privacy verification remains a separate SEC-05 gate. | [PR #203](https://github.com/leenusdarnal/guitarlab/pull/203); [PR #204](https://github.com/leenusdarnal/guitarlab/pull/204); [PR #205](https://github.com/leenusdarnal/guitarlab/pull/205); [CI run #44669861146](https://github.com/leenusdarnal/guitarlab/actions/runs/44669861146) |
| SEC-04 | P1 | **DEFERRED** | Keep cloud learner-data sync disabled until account ownership enforcement, export/deletion, idempotency, conflict handling and recovery are separately implemented and tested. | Architecture and authentication decision |
| SEC-05 | P1 | **PARTIAL** | Verify CSP and security headers on the actual deployed environment and complete a production privacy/configuration review. Consider CSP reporting/violation monitoring only with a privacy-safe endpoint and reviewed data handling. | Local Worker header/CSP assertions pass; deployed-environment review remains open |
| PROF-01 | P1 | **DONE — automated** | PR #219 delivers editable OAuth account display name and allowlisted avatar, read-only provider-managed email, session details/sign-out, and an editable guest-accessible local learner profile. Issue #218 is closed; sign-in/out preserves local learner data, with no account attachment or cloud sync. | [PR #219](https://github.com/leenusdarnal/guitarlab/pull/219); [Issue #218](https://github.com/leenusdarnal/guitarlab/issues/218) |
| SEC-06 | P2 | **OPEN** | Complete the dependency, external-origin and content/licence register; review optional integrations before adoption. | M9 release checklist; preserve copyright/provenance decisions |

### SEC-01 / SEC-03 local acceptance and SEC-02 production OAuth gates

- [x] Local HTTPS Worker auth lifecycle/security foundation and auth-route accessibility coverage are automated (PR #205; CI run #44669861146). These tests include legacy email/password flows and do not imply that email/password is a supported production sign-in method.
- [x] Confirm the production origin and stage it as BETTER_AUTH_URL in the production Wrangler config (PR #206).
- [x] Create and document a dedicated production auth D1 database, isolated from learner data and unrelated databases.
- [x] Confirm the production AUTH_DB binding is active and the five expected auth tables exist; D1 records `0001_auth_tables.sql` as applied. This read-only audit did not run or alter migrations and does not claim a full remote migration-plan dry run.
- [x] Confirm the production Worker has bindings named `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`; their values were not read and provider validity is not established.
- [ ] Complete production Google and GitHub OAuth callback/state, session refresh, logout and guest-access smoke tests.
- [ ] Verify account endpoints remain fail-closed if the schema, secret or provider configuration is incomplete.
- [ ] Keep local IndexedDB learner records separate from account creation; no silent migration or upload.
- [ ] Record the exact deployed source commit, production smoke-test result and verified rollback target under QA-04. A source-SHA Worker version tag/message is now added by the guarded production workflow for future releases; the currently active untagged version cannot be retroactively attributed from available metadata.

### SEC-04 non-negotiable sync gates

- [ ] Server-side ownership checks on every user-owned record/use case.
- [ ] Account export and deletion flow, including identity/session deletion and a documented retention policy.
- [ ] Stable operation IDs, idempotent writes and bounded sync batches.
- [ ] Type-specific conflict resolution; no blanket last-write-wins.
- [ ] Recovery tests for partial upload, retries, duplicate operations and deleted accounts.
- [ ] Explicit opt-in and user-visible explanation before any local learner data is uploaded.
- [ ] Independent review and release approval before enabling cloud sync.

---

## 7. Device, browser, audio and release evidence

**Goal:** keep automated regression coverage and real-world acceptance distinct. Synthetic fixtures and mocked permissions do not count as hardware evidence.

### 7.1 Physical browser/device matrix

| Platform | Required coverage | Status | Evidence |
|---|---|---|---|
| Desktop Windows | Keyboard, 200% zoom, reader/practice flows, storage and backup | **Not run** | Record exact OS/browser versions |
| Desktop macOS | Keyboard, VoiceOver where applicable, storage and backup | **Not run** | Record exact OS/browser versions |
| Desktop Linux | Keyboard, responsive layout, storage and backup | **Not run** | Record exact OS/browser versions |
| iOS Safari | VoiceOver, offline restart, safe areas, storage, backup/restore, microphone lifecycle | **Not run** | Physical device and exact iOS/Safari versions required |
| Android Chrome | TalkBack, offline restart, safe areas, storage, backup/restore, microphone lifecycle | **Not run** | Physical device and exact Android/Chrome versions required |

### 7.2 Audio and real-guitar evidence

| ID | Priority | Status | Required evidence |
|---|---|---|---|
| QA-01 | P1 | **BLOCKED** | Consent-backed, private real-guitar corpus with ground truth and per-string/capture/noise/phase breakdowns; detection coverage, median/P95 cents error, false-note rate and onset latency where ground truth exists. |
| QA-02 | P1 | **BLOCKED** | Physical microphone validation for permission grant/denial, missing device, device removal, track-ended, hidden tab, navigation, stop and resource teardown across supported browsers. |

Related tracking: [Issue #89](https://github.com/leenusdarnal/guitarlab/issues/89) remains open. Keep recordings, manifests, identifying device details and consent records private. Publish only reviewed aggregate metrics. Synthetic WAVs and mocked Chromium microphone permissions are automated regression evidence, not real-guitar accuracy or physical-browser compatibility.

### 7.3 Storage and recovery evidence

| ID | Priority | Status | Required evidence |
|---|---|---|---|
| QA-03 | P1 | **BLOCKED** | Existing profile reload/reopen, IndexedDB upgrade, offline restart, export, restore preview/cancel/replacement, reset cancel/confirm and storage persistence UX on physical desktop/iOS/Android devices. |

Related tracking: [Issue #9](https://github.com/leenusdarnal/guitarlab/issues/9) and [Issue #10](https://github.com/leenusdarnal/guitarlab/issues/10) remain open. Automated Chromium migration/rollback and backup/restore coverage does not close the physical-device gate. Use synthetic learner data only. Follow [MANUAL_ACCEPTANCE.md](MANUAL_ACCEPTANCE.md).

### 7.4 Production and CI release evidence

| ID | Priority | Status | Required evidence |
|---|---|---|---|
| QA-04 | P1 | **OPEN** | Reconcile the exact deployed Worker version to `main` and verify rollback/smoke-test evidence. The first local-first production deployment is verified by workflow run [#44054131712](https://github.com/leenusdarnal/guitarlab/actions/runs/44054131712) at SHA `1e18998eba43d0c2f6e3267ddeccb11b198b4188` (17 November 2026). On 21 November, Cloudflare showed 100% traffic on Worker version `ae75036a-a2ef-4856-8962-4114f805199e` (version 9), deployed `2026-11-21T18:19:26Z`; available metadata had no source SHA/tag/message, so it cannot be attributed to current `main` from this audit. The production workflow now adds a source-SHA/version tag and message plus an evidence artifact to future deployments. Still run that workflow on the intended `main` SHA, verify the artifact/version match, smoke-test result and a usable rollback target. |
| QA-05 | P2 | **OPEN** | Complete the controlled CI failure-injection and recovery rehearsal (see CI-01/CI-02 and [CI failure recovery runbook](CI_FAILURE_RECOVERY.md)); record the actual workflow run URLs. A currently green CI run does not prove this rehearsal has been completed. |
| QA-06 | P1 | **OPEN** | Complete the umbrella M9 privacy, security, accessibility, offline, performance and release review; close only when all required P1 evidence is recorded. |

Related issues: [#18](https://github.com/leenusdarnal/guitarlab/issues/18) remains open for release hardening; [#5](https://github.com/leenusdarnal/guitarlab/issues/5) remains open for CI process tracking. Reconcile stale issue status against current evidence rather than treating an old issue state as proof of a current defect or completion.

### 7.5 Evidence record template

For each manual run, add a dated entry here or link to a private evidence location containing:

| Field | Required value |
|---|---|
| Task ID | One ID from this tracker |
| Date/time and timezone | Exact run timestamp |
| Commit SHA | Exact tested source |
| Environment | Preview/production/local; never store credentials |
| Device and OS | Exact device class and OS version |
| Browser and version | Exact browser/version |
| Viewport/theme | CSS dimensions, orientation, dark/light |
| Assistive technology | Name and version, or not used |
| Steps and result | Reproducible steps and pass/fail/not-run |
| Defects | Issue/PR link, severity and reproduction |
| Reviewer | Person who performed/reviewed the test |

Never record account credentials, session tokens, personal learner data, private recordings or identifying corpus manifests in this public repository.

---

## 8. CI reliability and developer workflow

**Goal:** keep required CI representative, diagnosable and reproducible without weakening application, security, accessibility, type, migration or browser checks.

| ID | Priority | Status | Work item / current evidence | Acceptance |
|---|---|---|---|---|
| CI-01 | P1 | **PARTIAL** | Independent validation steps now continue after unrelated sibling failures when dependency installation succeeded. | Inject a controlled formatting/lint failure and prove independent checks still report their results; dependent steps must skip safely. |
| CI-02 | P1 | **PARTIAL** | Migration drift detection checks tracked and untracked changes under `drizzle/migrations` after generation/finalization. | Inject an uncommitted generated migration and prove CI fails with changed-path diagnostics; clean committed migrations must pass. |
| CI-03 | P2 | **DONE — automated** | npm cache is enabled for the Node 22 and Node 26 dependency-install jobs and keyed to the lockfile. | Keep `npm ci` reproducible; cache is only a package-download optimization. |
| CI-04 | P2 | **OPEN** | Formatting validation still uses a changed-file allowlist; Svelte route formatting has not been brought into a clean repository-wide baseline. | Inventory managed file types, clean existing debt deliberately, and broaden formatting without auto-modifying code in CI. |
| CI-05 | P1 | **DONE — automated** | Playwright 1.56.1 and axe-core 4.14.0 are exact development dependencies resolved by `package-lock.json`; CI now runs a clean `npm ci` and verifies both packages with `npm ls` without a second install. | [PR #190](https://github.com/leenusdarnal/guitarlab/pull/190); [CI run #44469593267](https://github.com/leenusdarnal/guitarlab/actions/runs/44469593267) passed all three required jobs, including all browser and accessibility suites. |
| CI-06 | P2 | **DONE — automated** | PR #208 migrated the accessibility suite; PR #211 migrated the remaining 77 navigation waits across the general browser, music-tools and curriculum suites to `domcontentloaded` with route-specific readiness assertions. The suites explicitly wait for IndexedDB-backed onboarding profile hydration, backup storage-status initialization, service-worker readiness and offline behavior. The auth lifecycle browser test now distinguishes successful sign-in from intentionally rejected credentials and waits for observable route state rather than Playwright's navigation/load event. All required CI jobs passed on final PR head `4b48801d88894fe31b0c10049649019ec381fa1e`. | Preserve explicit offline/service-worker assertions; avoid using network quiet or implicit load events as application-readiness proxies. | [PR #208](https://github.com/leenusdarnal/guitarlab/pull/208); [PR #211](https://github.com/leenusdarnal/guitarlab/pull/211); [CI run #44763924302](https://github.com/leenusdarnal/guitarlab/actions/runs/44763924302). |
| CI-07 | P3 | **DEFERRED** | A pinned Playwright container already provides matching browser binaries and OS dependencies; an additional browser-binary cache is currently redundant. | Reconsider only if measurements show container/image startup is a material bottleneck. |
| CI-08 | P2 | **PARTIAL** | PR implements a failure-only, three-day artifact for the authentication browser suite's redacted diagnostic output and the Cloudflare Worker smoke-test log. Authentication diagnostics redact generated emails, passwords, cookies and one-time tokens. Browser traces/screenshots and general browser-suite logs are deliberately excluded because the suites exercise local learner records and authenticated state; broader capture needs a privacy-safe fixture/redaction design first. | Verify the failure artifact on a controlled disposable failure; then assess a privacy-safe trace/screenshot harness before expanding capture. |
| CI-09 | P1 | **DONE — automated** | Dependency audits distinguish complete reports from registry/incomplete-report failures; high/critical production advisories block, while development-toolchain advisories are reported. | Preserve fail-closed behaviour when the audit report is missing/incomplete; never turn a network/provider error into a passing security result. |
| CI-10 | P2 | **PARTIAL** | Job-level timeouts and bounded audit commands exist (45-minute application job, 15-minute Node 26 job, 120-second audit commands). | Measure workflow duration and step-level hangs; set evidence-based per-step bounds without causing premature cancellation. |
| CI-11 | P3 | **OPEN** | Type/Svelte checks, unit tests and production build run in both main validation and Node 26 compatibility jobs. | Review the deliberate duplication after measuring runtime; retain compatibility coverage and clear failure attribution. |

### CI reliability acceptance checklist

- [ ] Run a controlled failure-injection case for CI-01 and record the workflow run URL, SHA and expected failed step.
- [ ] Run a migration-drift injection for CI-02 in a disposable branch/worktree and record the expected failure; never alter a real release migration to manufacture the result.
- [x] Confirm the current Node 22/npm cache and Node 26/npm cache are configured in `.github/workflows/ci.yml`.
- [x] Move Playwright and axe-core to lockfile-controlled development dependencies; [PR #190](https://github.com/leenusdarnal/guitarlab/pull/190) is merged and required CI passed on the final PR head.
- [x] Replace browser-suite `networkidle` navigation waits with `domcontentloaded` plus route-specific application, service-worker and offline assertions; verify the full browser CI matrix on the implementation PR.
- [x] Preserve the currently safe failure diagnostics (redacted auth output and Worker smoke-test log) as a failure-only, three-day artifact; browser traces/screenshots remain excluded pending a privacy-safe harness.
- [x] Confirm incomplete or unavailable npm audit reports fail rather than pass silently.
- [ ] Measure workflow duration before changing job/step timeout values.
- [ ] Review duplicate validation work while retaining Node.js compatibility checks.

**Current CI evidence:** main CI [run #44783678807](https://github.com/leenusdarnal/guitarlab/actions/runs/44783678807) completed successfully on exact main SHA `0cefe5722cca1f27391ff968f150f67824b05326` after PR #212 merged. CI-05 verification is recorded on PR #190's final head by [run #44469593267](https://github.com/leenusdarnal/guitarlab/actions/runs/44469593267). Green normal CI does not prove CI-01/CI-02 fault-injection cases or QA-05 controlled failure/recovery rehearsal have been run.

**Change-control guardrails:** do not weaken branch-protection contexts, disable validation, format files automatically in CI, or run production deployment as part of a reliability experiment. Distinguish product/code failures, repo hygiene, dependency/security findings and runner/network failures.

---

## 9. GitHub issue reconciliation

This table records the state observed during the 18 November 2026 reconciliation. Refresh live GitHub state before changing issue status.

| Issue | Observed state | Reconciliation |
|---|---|---|
| [#5 — CI quality gates](https://github.com/leenusdarnal/guitarlab/issues/5) | Open | Main CI is green on the current baseline; keep the separate failure/recovery rehearsal as QA-05 and reconcile whether the original CI setup issue can be closed. |
| [#9 — IndexedDB/local learner profile](https://github.com/leenusdarnal/guitarlab/issues/9) | Open | Core implementation exists; physical reload/offline/upgrade acceptance remains. |
| [#10 — backup/restore/reset](https://github.com/leenusdarnal/guitarlab/issues/10) | Open | Core implementation and automated rollback coverage exist; physical-device acceptance remains. |
| [#18 — release hardening](https://github.com/leenusdarnal/guitarlab/issues/18) | Open | Umbrella P1 release gate; close only after required sections in this tracker are verified. |
| [#34 — initial offline app shell](https://github.com/leenusdarnal/guitarlab/issues/34) | Closed | Initial implementation shipped in PR #35. OFF-01–OFF-04 are follow-up privacy and acceptance tasks, not proof that the closed scope failed. |
| [#69 — adaptive practice](https://github.com/leenusdarnal/guitarlab/issues/69) | Closed | Outside this engineering-quality tracker; retain its curriculum/practice evidence in the relevant product records. |
| [#89 — real recordings/physical audio](https://github.com/leenusdarnal/guitarlab/issues/89) | Open | Remains a physical evidence task; synthetic fixtures are not a substitute. |
| [#176 — authentication](https://github.com/leenusdarnal/guitarlab/issues/176) | Open (last reconciled 18 November) | PR #177 foundation, PR #203 lifecycle, PR #204 origin/rate-limit checks and PR #205 full local HTTPS lifecycle/security acceptance are merged. Optional Google/GitHub OAuth scope has been reconciled in PR #212 and issue #176. Remote preview/production auth activation remains gated under SEC-02/SEC-05; cloud learner-data sync remains deferred under SEC-04. Refresh live issue state before closing. |

---


---

## 10. CSS, Tailwind and styling maintainability

**Goal:** improve maintainability and consistency without redesigning GuitarLab, replacing its semantic design system, or delaying the P0 service-worker privacy fix.

### 10.1 Read-only baseline (18 November 2026)

**Repository baseline:** main at 6439dac92f889b3838e4446023e563a11db56e7f. This inventory is a source-level scan of the 26 styling-bearing files under src/ (25 Svelte component style blocks plus src/app.css). Counts are approximate where pattern matching is involved; they are not a runtime CSS coverage or visual-regression measurement.

| Area | Finding |
|---|---|
| Tailwind package | tailwindcss: ^4.0.0; package-lock resolves 4.3.5 |
| Vite integration | @tailwindcss/vite: ^4.0.0; package-lock resolves 4.3.5; plugin is enabled in vite.config.ts |
| CSS entry | src/app.css starts with @import "tailwindcss"; |
| Configuration | No legacy tailwind.config.* or standalone PostCSS config was found at the repository root |
| Styling ownership | One global stylesheet and 25 Svelte component-scoped <style> blocks |
| CSS size | About 144,035 characters in component-scoped styles plus 4,711 in src/app.css (148,746 combined) |
| CSS structure | Approx. 1,495 rule blocks and 4,088 declarations in the scanned styles |
| Class usage | 952 literal class attributes and 1,020 tokens; only 5 tokens matched a broad utility-class pattern. This is a heuristic, not a full Tailwind AST report |
| Tailwind directives | No @apply was found in the scanned styles; no custom @theme block was found |
| Overrides / dynamic styling | 19 !important occurrences, 7 literal style= attributes and 67 Svelte class: directives |
| Design tokens | src/app.css contains 65 custom-property declarations representing 47 distinct names, including dark/light semantic colours, spacing, typography, radii and layout roles |

**Interpretation:** Tailwind v4 is integrated correctly through its Vite plugin and CSS import, but the current UI is overwhelmingly styled with semantic class names and component-scoped CSS. Tailwind utility adoption is minimal. In practice Tailwind currently supplies its CSS processing, theme defaults and Preflight more than a utility-first component styling convention.

The semantic token system in src/app.css is an asset, not migration debt. Preserve the existing dark/light themes, CSS variables, accessible control defaults, safe-area rules and reduced-motion behaviour. Do not replace them with the Tailwind default palette or a wholesale utility-class conversion.

### 10.2 Main CSS hotspots for a later, targeted review

| File | Scoped CSS characters | Approx. rules | Notes |
|---|---:|---:|---|
| src/routes/practice/+page.svelte | 16,320 | 152 | Practice workflow; largest stylesheet block and declaration count |
| src/routes/+page.svelte | 16,206 | 188 | Dashboard; second-largest stylesheet block |
| src/routes/learn/[lessonId]/+page.svelte | 11,904 | 140 | Lesson and progress interaction |
| src/routes/tools/fretboard/+page.svelte | 11,101 | 97 | Diagram geometry and responsive scrolling |
| src/routes/skills/+page.svelte | 10,825 | 106 | Skill map and state presentation |
| src/routes/learn/+page.svelte | 6,967 | 81 | Curriculum browsing |
| src/routes/tools/chords/+page.svelte | 7,401 | 70 | Chord diagram and selector UI |
| src/routes/tools/tuner/+page.svelte | 7,188 | 68 | Audio state and tuner presentation |

These are investigation targets, not evidence that the styles are duplicated or safe to delete. The fretboard, audio tools, practice and lesson views contain specialised interaction states; keep their component styles unless a concrete duplication or maintenance problem is demonstrated.

### 10.3 Staged modernisation plan

| Stage | Task | Guardrails / acceptance |
|---|---|---|
| CSS-01 — Inventory | Record resolved Tailwind version, Vite integration, CSS entry points, class usage, directives, tokens and hotspots | **Complete — read-only baseline above** |
| CSS-02 — Ownership review | For each hotspot, classify global tokens/resets, reusable patterns, component-specific layout, state styling and genuinely duplicated declarations | **Complete — source-level review**: across the hotspot files, repeated selector names were compared by declarations and usage, not treated as proof of duplication. PR #188 extracted the identical fretboard/chords page chrome. A follow-up comparison found the exact `.back-link` declaration shared by tuner, metronome and ear-training; their panel, typography and guidance variants remain route-owned. No selector was classified as safe to delete solely because it recurs. Dead-style removal still requires dynamic-state/browser verification. |
| CSS-03 — Styling contract | Adopt a documented rule: semantic CSS variables remain the source of truth for product tokens; component-scoped CSS owns complex domain visuals and interaction states; Tailwind utilities are optional for simple layout/spacing/typography primitives when they improve clarity | **Complete — approved direction**: preserve semantic tokens and themes; keep specialised instrument/practice/lesson styles scoped; use Tailwind utilities only where they improve simple local primitives; no wholesale conversion or `@apply` abstraction. |
| CSS-04 — Incremental implementation | Make small, component-scoped changes only after CSS-02 identifies a specific benefit; keep each change independently reviewable and avoid broad route rewrites | **IN PROGRESS** — PRs #188 and #189 delivered the verified shared tool-page chrome extractions. [PR #196](https://github.com/leenusdarnal/guitarlab/pull/196) merged as `c86e10e64292ee6512e76729bec198c9f568b4e9`; its PR-head CI [#44525756899](https://github.com/leenusdarnal/guitarlab/actions/runs/44525756899) passed. It adds selective semantic Tailwind v4 theme aliases and migrates the Practice Tools index container/list/row/icon-tile/responsive layout primitives. [PR #197](https://github.com/leenusdarnal/guitarlab/pull/197) merged as `3f92e5ea507929ca063a8bf0620de3ab5231aff1`; all three required CI jobs passed. It moves only the lesson-catalog outer container and small-screen padding to utilities. [PR #198](https://github.com/leenusdarnal/guitarlab/pull/198) merged as `26a9033a4a7ba99f66503998e53e4c1461191125`; all three required CI jobs passed, including browser and accessibility acceptance. It moves only the skill-map outer container and existing 420px padding override to utilities; skill-state, loading, mobile list/detail and interaction styling remain scoped. CSS-04 stays open only for additional evidence-backed opportunities; do not expand route migrations until CSS-05 validation is complete. |
| CSS-05 — Verification | Compare screenshots and built CSS; run npm run check, npm run lint, npm run test:run, production build and browser acceptance | **IN PROGRESS** — PR #201 adds a deterministic production CSS report to `npm run build` and `npm run css:report`. Its first successful CI production build (PR head `fddc9a715ed31309fa639dc1acb4b42a5fc25cfd`) emitted 23 CSS assets: 174,336 B raw, 37,828 B gzip and 31,982 B Brotli (compression measured per emitted asset; totals are sums). This is a current measurement, not a before/after gain: no comparable pre-migration artifact has been established. Required desktop/mobile light/dark screenshot comparison, keyboard focus, 200% zoom, reduced-motion and responsive-overflow acceptance remain open. Record exact SHA, browser/version, viewport, theme, steps and outcome; do not claim visual/manual acceptance from green CI alone. |

### 10.4 Technical recommendations

1. **Keep Tailwind v4.** There is no v3-to-v4 migration to perform. Do not change package versions or add a legacy JavaScript config / PostCSS layer without a concrete, tested requirement.
2. **Keep the current Vite plugin and CSS import.** This matches Tailwind's documented Vite setup for SvelteKit. The absence of a legacy config file is not itself a defect in v4's CSS-first model.
3. **Preserve semantic CSS variables.** Do not move all 65 current tokens into @theme. Consider selective @theme inline aliases only when a real utility-class use case is established and the alias correctly follows the active light/dark theme.
4. **Use utilities selectively.** Prefer them for simple, local layout primitives. Keep authored component CSS for fretboard geometry, audio feedback, lesson states, practice controls and other domain-specific behaviour.
5. **Do not introduce @apply as a default abstraction.** Tailwind v4 requires @reference for theme definitions used from separately bundled Svelte style blocks; using the existing CSS variables directly is often clearer and avoids generating extra utility CSS in those blocks.
6. **Investigate the 19 !important declarations and 7 inline-style attributes individually.** Remove or replace them only when the cascade/state intent is understood and regression evidence exists.
7. **Treat compiler unused-selector warnings as leads, not automatic deletion instructions.** Check conditional rendering, dynamic class names and route states before removing a selector.
8. **Measure output before claiming performance gains.** Record generated CSS bytes and a consistent production build baseline before and after each change; do not infer bundle savings from source character counts.

Official Tailwind references: [Vite installation](https://tailwindcss.com/docs/installation/using-vite), [theme variables and CSS-first configuration](https://tailwindcss.com/docs/theme), [Preflight behaviour](https://tailwindcss.com/docs/preflight), and [Svelte @reference guidance](https://tailwindcss.com/docs/upgrade-guide).

### 10.5 CSS workstream acceptance

- [x] Confirm package declarations and exact lockfile-resolved Tailwind / Vite plugin versions.
- [x] Confirm Vite plugin and CSS entry-point integration.
- [x] Inventory all 26 source styling files and quantify the current style ownership model.
- [x] Record existing design-token and theme architecture to preserve.
- [x] Complete selector-level duplication review for the largest component stylesheets; exact shared tool-page chrome candidates are recorded above. Unused-style deletion remains conditional on runtime/browser evidence.
- [x] Agree on the styling contract before any CSS migration or rewrite.
- [x] Keep implementation after the P0 offline privacy fix and required cache-isolation checks; PR #186 is merged and final CI/browser acceptance passed.
- [ ] Record production CSS asset byte counts (raw and gzip) for the current merged baseline and a comparable pre-migration build using the same lockfile, Node version and build command; if no reproducible pre-migration baseline is available, record that limitation explicitly.
- [ ] Capture and compare Practice Tools, lesson-catalog and skill-map screenshots at representative desktop/mobile viewports in light and dark themes.
- [ ] Verify keyboard focus visibility, 200% zoom, reduced-motion behaviour and responsive overflow for all three migrated slices.
- [ ] Record exact SHA, browser/version, viewport, theme, test steps, outcome and reviewer; do not infer manual visual acceptance from green CI.

**Current decision:** PR #188 extracted the shared fretboard/chords tool-page chrome and PR #189 extracted only the byte-for-byte identical back-link chrome across tuner, metronome and ear-training. Keep each tool's heading, panel, guidance, audio state and instrument geometry local. Do not infer further extractions from selector-name recurrence; identify a new exact duplication before continuing, and pair each implementation with build, unit, browser and visual checks.

---

## 11. Definition of done and update protocol

A task may move to **DONE — automated** only when its implementation is merged, relevant automated checks pass on the final merged SHA, and the evidence link is recorded.

A task may move to **VERIFIED — manual** only when:
- Every required manual acceptance item is completed or explicitly marked not applicable with a reason.
- Exact device/browser/OS/viewport/theme and commit SHA are recorded where relevant.
- Any failure is linked to an issue and is not silently waived.
- Privacy and test-data rules are followed.
- A reviewer records the outcome and limitations.

When updating this tracker:
1. Update the existing task row; do not create a second checklist in another tracker.
2. Add the PR, CI run or manual evidence link to the same row.
3. Keep issue state and implementation state distinct.
4. Move deferred scope into the deferred section with a reason.
5. Update the reconciliation baseline and review date.
6. Keep [ROADMAP.md](ROADMAP.md) at milestone level and link back here for detailed engineering-quality status.

**Current exit criterion:** OFF-01 and OFF-02 are automated-complete on merged PR #193; OFF-03 is automated-complete on merged PR #195 with required CI and real multi-tab update/waiting/activation acceptance; OFF-04 is deliberately DEFERRED and is not a blocker for the current implementation sequence. Revisit OFF-04 before describing offline behaviour as physically device-verified. OFF-01 and OFF-02 must pass before offline caching is described as privacy-verified. Other P1 physical-device, accessibility, authentication and production evidence gates remain subject to their own acceptance before declaring M9 release hardening verified.
