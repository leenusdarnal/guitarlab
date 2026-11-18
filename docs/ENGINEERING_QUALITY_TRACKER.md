# GuitarLab Engineering Quality & Release Tracker

**Status:** Active — canonical engineering-quality tracker  
**Last reconciled:** 18 November 2026  
**Verified source baseline:** `main` at `41805887fee753b1c47e2b1442218ac53c4d948f`  
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
| Historical findings | [UI_UX_AUDIT_2026-11-15.md](UI_UX_AUDIT_2026-11-15.md) and [CURRICULUM_AUDIT_AND_REMEDIATION_TRACKER.md](CURRICULUM_AUDIT_AND_REMEDIATION_TRACKER.md) | Original audit evidence and curriculum-specific work; do not duplicate the status of tasks tracked here |

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

- Main commit `41805887fee753b1c47e2b1442218ac53c4d948f` includes PR #180.
- Main GuitarLab CI run [#44310609981](https://github.com/leenusdarnal/guitarlab/actions/runs/44310609981) completed successfully.
- Main curriculum validation [#44310610413](https://github.com/leenusdarnal/guitarlab/actions/runs/44310610413) completed successfully.
- PR #180's final required CI run [#44287911608](https://github.com/leenusdarnal/guitarlab/actions/runs/44287911608) passed before merge.
- PR #177 delivered the Better Auth runtime/account foundation. Issue [#176](https://github.com/leenusdarnal/guitarlab/issues/176) remains open; the full email/account lifecycle and isolated environment activation have not been evidenced as complete.
- The initial offline app-shell/previously visited public-page caching slice was delivered in PR #35; its original Issue [#34](https://github.com/leenusdarnal/guitarlab/issues/34) is closed. That closure does **not** establish the authenticated-page cache boundary or physical-device offline acceptance described below.
- No live Core Web Vitals or production bundle-budget measurements were established by this audit. No physical-device, screen-reader or real-guitar recording results are claimed.

### 1.4 Current priority queue

| Order | Task | Priority | Status |
|---:|---|---|---|
| 1 | OFF-01 — Restrict Cache Storage to explicitly public content | P0 | IN PROGRESS |
| 2 | OFF-02 — Add cache-isolation, logout and offline regression tests | P1 | OPEN |
| 3 | SEC-01 — Complete authenticated account lifecycle acceptance | P1 | PARTIAL |
| 4 | UX-02 / UX-03 — Complete manual accessibility and physical-device acceptance | P1 | BLOCKED |
| 5 | QA-03 — Complete physical-device storage/offline/backup acceptance | P1 | BLOCKED |
| 6 | QA-01 / QA-02 — Complete real-audio and physical-browser validation | P1 | BLOCKED |
| 7 | QA-04 — Reconcile exact production SHA and rollback evidence | P1 | OPEN |
| 8 | PERF-01 — Establish production bundle and Core Web Vitals baselines | P2 | OPEN |
| 9 | ARC-01 / ARC-02 — Split route components and consolidate shared UI patterns | P2 | OPEN |

---

## 2. Offline, service worker and data privacy

**Goal:** preserve useful local-first offline learning without ever replaying or storing private account/session content as a public app page.

| ID | Priority | Status | Finding / required outcome | Evidence / dependency |
|---|---|---|---|---|
| OFF-01 | P0 | **IN PROGRESS** | Replace permissive HTML caching with an explicit public-content policy. The current service worker accepts same-origin successful HTML when it is not marked `private`/`no-store` and does not expose `Set-Cookie`. The authenticated account page returns the account name/email but does not explicitly set a private no-store policy. This is a source-level privacy risk; a live exploit has not been reproduced. | `src/service-worker/index.ts`; `src/routes/account/+page.server.ts`; `src/hooks.server.ts` |
| OFF-02 | P1 | **OPEN** | Add regression coverage for authenticated/private route exclusion, logout, cache fallback, cache update and failure cases. | Depends on OFF-01 |
| OFF-03 | P1 | **PARTIAL** | Harden offline navigation and lifecycle behaviour: treat `navigator.onLine` as a hint rather than proof of connectivity; verify failed precache installation, storage quota/cache write errors, HTTP error handling and multi-tab service-worker updates. | Initial service worker and offline fallback are merged in PR #35 |
| OFF-04 | P1 | **BLOCKED** | Complete physical-device offline acceptance: visit a public lesson online, activate the worker, go offline, reopen the visited lesson, verify an unvisited page gets an accessible fallback, restore connectivity and repeat in portrait/landscape. | [MANUAL_ACCEPTANCE.md](MANUAL_ACCEPTANCE.md); Issues #9/#10/#18 |
| OFF-05 | P3 | **DEFERRED** | Decide and implement full PWA installability and learner-selected offline curriculum packs, including storage quota messaging and explicit download/remove controls. Do not silently precache the entire curriculum. | M9 in [ROADMAP.md](ROADMAP.md) |

### OFF-01 acceptance checklist

**Implementation in progress:** branch `fix/offline-public-cache-boundary` adds an exact prerendered-public-route allowlist, private/no-store headers for authenticated and identity routes, rejection of query/credential-varying responses, and removal of unsafe legacy page-cache entries on activation. Unit coverage is being added; OFF-01 remains open until CI and browser-level cache-isolation checks pass.


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

**Security note:** OFF-01 is the first implementation action. Until it passes, do not describe the service-worker cache as privacy-verified.

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
| SEC-01 | P1 | **PARTIAL** | Complete registration, email verification/resend, sign-in, password-reset, logout, session-expiry and revocation journeys with a safe test-mail sink. | PR #177 merged; Issue #176 remains open |
| SEC-02 | P1 | **BLOCKED** | Provision and verify isolated local/preview/production auth D1 databases, migrations, Better Auth secret, exact origin and transactional email credentials before enabling account endpoints in those environments. | [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) states preview/production auth bindings are not enabled |
| SEC-03 | P1 | **PARTIAL** | Verify security and privacy behaviour end-to-end: no account enumeration, origin/CSRF protection, rate limiting, secure cookie attributes, session revocation and no sensitive data in logs/responses. | Better Auth configuration and local security-header checks exist; end-to-end evidence incomplete |
| SEC-04 | P1 | **DEFERRED** | Keep cloud learner-data sync disabled until account ownership enforcement, export/deletion, idempotency, conflict handling and recovery are separately implemented and tested. | Architecture and authentication decision |
| SEC-05 | P1 | **PARTIAL** | Verify CSP and security headers on the actual deployed environment and complete a production privacy/configuration review. Consider CSP reporting/violation monitoring only with a privacy-safe endpoint and reviewed data handling. | Local Worker preview header/CSP assertions pass; deployment review remains open |
| SEC-06 | P2 | **OPEN** | Complete the dependency, external-origin and content/licence register; review optional integrations before adoption. | M9 release checklist; preserve copyright/provenance decisions |

### SEC-01 / SEC-02 acceptance checklist

- [ ] Use a test-mail sink; never send real verification or password-reset email from automated tests.
- [ ] Verify sign-up, duplicate-account response, verification pending, verification resend and successful verification.
- [ ] Verify unverified users cannot obtain a usable authenticated session.
- [ ] Verify sign-in, sign-out, session refresh/expiry and server-side revocation.
- [ ] Verify password-reset request and completion, expired/used token behaviour and session revocation after reset.
- [ ] Ensure responses do not disclose whether an email address is registered.
- [ ] Verify CSRF/origin checks and configured rate limits against the running Worker.
- [ ] Inspect actual session cookie attributes on HTTPS: HttpOnly, Secure, SameSite and Path. Review whether a `__Host-` prefix is supported without changing Better Auth's security semantics.
- [ ] Verify no password, cookie, session token, verification/reset token, learner notes or recordings are written to logs.
- [ ] Include `/login`, `/account` and verification/reset states in axe and browser accessibility acceptance when auth is configured; the current core accessibility route list does not include those routes.
- [ ] Verify every environment uses a distinct auth database and the correct exact origin/secrets.
- [ ] Keep public/preview/production account endpoints unavailable until the required environment configuration and mail provider are approved.
- [ ] Keep local IndexedDB learner records separate from account creation; no silent migration or upload.

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
| QA-04 | P1 | **OPEN** | Reconcile the exact deployed Worker version to the intended current `main` SHA. Earlier docs record a successful first production release for `306f7aea19596731dac88192d8228590544f00fc`; this audit does not establish that `41805887fee753b1c47e2b1442218ac53c4d948f` is deployed. Verify routes, security headers, retained artifact and rollback to a prior Worker version. |
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
| CI-05 | P1 | **OPEN** | CI installs Playwright and axe-core with `npm install --no-save --package-lock=false` after `npm ci`. | Pin compatible versions in `package.json`/lockfile, remove the ad hoc install, and verify a clean `npm ci` supplies the test tools. |
| CI-06 | P2 | **OPEN** | Browser acceptance scripts still contain multiple `networkidle` waits (the accessibility script has seven occurrences in the reviewed baseline). | Replace timing-sensitive waits selectively with route/heading/application-state readiness assertions; retain meaningful end-to-end behaviour coverage. |
| CI-07 | P3 | **DEFERRED** | A pinned Playwright container already provides matching browser binaries and OS dependencies; an additional browser-binary cache is currently redundant. | Reconsider only if measurements show container/image startup is a material bottleneck. |
| CI-08 | P2 | **OPEN** | Failure diagnostics need better retention for Playwright traces/screenshots and Wrangler/browser logs. Current CI preserves a short-lived preview build artifact on main pushes, not a general test-failure evidence bundle. | Upload useful diagnostics on failure with short retention; confirm artifacts contain no learner data, secrets or credentials. |
| CI-09 | P1 | **DONE — automated** | Dependency audits distinguish complete reports from registry/incomplete-report failures; high/critical production advisories block, while development-toolchain advisories are reported. | Preserve fail-closed behaviour when the audit report is missing/incomplete; never turn a network/provider error into a passing security result. |
| CI-10 | P2 | **PARTIAL** | Job-level timeouts and bounded audit commands exist (45-minute application job, 15-minute Node 26 job, 120-second audit commands). | Measure workflow duration and step-level hangs; set evidence-based per-step bounds without causing premature cancellation. |
| CI-11 | P3 | **OPEN** | Type/Svelte checks, unit tests and production build run in both main validation and Node 26 compatibility jobs. | Review the deliberate duplication after measuring runtime; retain compatibility coverage and clear failure attribution. |

### CI reliability acceptance checklist

- [ ] Run a controlled failure-injection case for CI-01 and record the workflow run URL, SHA and expected failed step.
- [ ] Run a migration-drift injection for CI-02 in a disposable branch/worktree and record the expected failure; never alter a real release migration to manufacture the result.
- [x] Confirm the current Node 22/npm cache and Node 26/npm cache are configured in `.github/workflows/ci.yml`.
- [ ] Move Playwright and axe-core to lockfile-controlled development dependencies.
- [ ] Replace high-risk `networkidle` waits with explicit application-readiness assertions in the browser suites.
- [ ] Preserve failure traces/screenshots/logs as bounded GitHub Actions artifacts, with no private learner data or secrets.
- [x] Confirm incomplete or unavailable npm audit reports fail rather than pass silently.
- [ ] Measure workflow duration before changing job/step timeout values.
- [ ] Review duplicate validation work while retaining Node.js compatibility checks.

**Current CI evidence:** main CI [run #44310609981](https://github.com/leenusdarnal/guitarlab/actions/runs/44310609981) completed successfully on `41805887fee753b1c47e2b1442218ac53c4d948f`; curriculum validation [run #44310610413](https://github.com/leenusdarnal/guitarlab/actions/runs/44310610413) also passed. Green normal CI does not prove CI-01/CI-02 fault-injection cases or QA-05 controlled failure/recovery rehearsal have been run.

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
| [#176 — authentication](https://github.com/leenusdarnal/guitarlab/issues/176) | Open | PR #177 merged the runtime/account foundation; full lifecycle and environment gates remain in SEC-01–SEC-03. |

---

## 10. Definition of done and update protocol

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

**Current exit criterion:** OFF-01 and OFF-02 must pass before offline caching is described as privacy-verified. The P1 physical-device, accessibility, authentication and production evidence gates must be completed before declaring M9 release hardening verified.
