# GuitarLab Execution Priority and Resume Plan

**Last updated:** 2026-11-15  
**Repository:** `leenusdarnal/guitarlab`  
**Default branch:** `main`  
**Verified baseline:** `555b27c1ba230a87a59e4d75c5f7348127f8fd28` (PR #136 merged; documentation reconciled after CSP hardening)  
**Purpose:** Durable execution queue. Refresh live GitHub state before resuming; current code, tests and CI outrank historical notes.

## P0 — First production release (owner priority set 2026-11-15)

**This is the top implementation priority until the first production release is deployed and verified.**

- Release the existing local-first GuitarLab application; learner profiles, progress, sessions and preferences remain in browser-local IndexedDB.
- Use the isolated `wrangler.production.jsonc` config and manual `Deploy GuitarLab production` workflow. Only a dispatch from `main` with `deploy_production=true` may deploy.
- Require the latest successful `Validate application and curriculum` and `Check Node.js 26 compatibility` checks for the exact selected SHA.
- Worker name: `guitarlab`; temporary first-release URL: `https://guitarlab.leenusdarnal.workers.dev` (the connected account's workers.dev subdomain is `leenusdarnal`).
- Production has no D1 binding, authentication routes, account service, learner-data API or cloud sync. Do not claim login/cloud sync exists; that is separate M5 implementation work.
- Live Cloudflare inventory: one Worker (`guitarlab-preview`), no production Worker, no D1 database, no Worker custom domain and no zone in the connected account. workers.dev is a temporary hostname; attach an owned custom domain/route for long-term production.
- Configure the GitHub Actions `production` environment with secret `CLOUDFLARE_API_TOKEN` and variable `CLOUDFLARE_ACCOUNT_ID`; restrict deploy branches to `main` and require a reviewer where settings support it.
- The release workflow builds and dry-runs the exact main SHA, deploys that build, and smoke-tests `/`, `/learn`, `/practice`, `/tools/tuner`, `/settings/data` plus CSP/HSTS/MIME/frame/referrer headers.
- Do not provision D1, run remote migrations, enable account/cloud-sync services, or create domains/DNS in this release slice.

**Exit criteria:** an exact-main production workflow succeeds, all smoke checks pass, and the commit, Worker version/deployment ID, timestamp and URL are recorded. Keep P0 open until then.

**After first production verification:** resume M5 account/authentication and secure sync, then Issues #9/#10 physical storage/recovery acceptance, #89 real-device audio, and #18 full release sign-off. Issue #5 remains pending for authenticated CI rehearsal dispatch.

## Historical checkpoint — 2026-11-15 after PR #135 (superseded by the P0 production-release queue above)

- Verified `main` at `18515ec7bb1ab6d76b4f19a5e9a424585945d890`; PR [#135](https://github.com/leenusdarnal/guitarlab/pull/135) is merged.
- PR #135 configures SvelteKit-managed Content Security Policy with automatic nonce/hash handling, restrictive script/resource directives, actual response-header assertions in browser acceptance, and `docs/SECURITY_RESPONSE_POLICY.md`.
- PR CI [run #43689404424](https://github.com/leenusdarnal/guitarlab/actions/runs/43689404424) and post-merge main CI [run #43689790086](https://github.com/leenusdarnal/guitarlab/actions/runs/43689790086) both passed. The merged run includes Node.js 26, application/curriculum, unit, build, Worker smoke, browser, music-tools, accessibility/CSP and curriculum-browser checks.
- PR #135 is a bounded CSP implementation, not a full security sign-off. Issue #18 remains open for manual WCAG 2.2 AA, physical keyboard/touch/screen-reader checks, privacy review, cross-browser audio lifecycle, licensing, performance and rollback evidence.
- PR #134's local WAV evaluator supports privacy-safe condition breakdowns. Issue #89 still requires consented real-guitar recordings with ground truth and physical browser/device measurements. No physical corpus or hardware result is claimed.
- Issues #9 and #10 remain open for physical desktop/mobile IndexedDB, offline restart, export/restore and reset acceptance. Automated Chromium coverage is not physical-device sign-off.
- Issue #5 remains open: neither controlled rehearsal has been dispatched. The previous attempt expired at GitHub sign-in and produced no run. Dispatch both `failure-injection` and `recovery` from an authenticated GitHub session and record the actual run URLs.
- Issue #3 remains deferred pending explicit decisions on production ownership, hostname, access model, data architecture and release approval. Do not provision production resources or deploy production.
- **Next:** complete the authenticated Issue #5 workflow rehearsal, then progress the physical acceptance queues for Issues #9, #10, #89 and #18 without marking unrun checks complete.


## Historical checkpoint — 2026-11-15 after PR #132 (superseded by PR #135)

- Verified current main includes merge commit c4c9f23c93a4a1d5ee1c42ff584af63fee3ac294 for PR #132. Issue #69 is reconciled and closed as completed.
- PR #132 extended explicit expected-versus-selected interval response contrasts to all 13 interval classes and all 12 alternatives for v2 and v3, retained the v1 four-choice mapping, and passed full application/curriculum and Node.js 26 CI before merge.
- PR #131 remains merged as b34578c4c295e83c5fc95e5350a92d3f664a398e; Issue #130 is closed. Its 24-root C3–B4 deterministic cycle preserves intervals within C3–B5 and keeps v2/v3 evidence distinct.
- PRs #127–#129 remain merged in priority order; Issue #17 is closed. All simple ascending melodic interval classes, progression research, current-content provenance and local repertoire/harmony work have shipped.
- Issue #69 is closed after PR #116 exact source-evidence validation, PR #117 v1 response contrasts and PR #132 v2/v3 response contrasts. Contrast labels are descriptive selected-response patterns, not psychological diagnoses or mastery evidence.
- **Current P3 implementation:** PR [#134](https://github.com/leenusdarnal/guitarlab/pull/134) extends the local WAV evaluator with privacy-safe, allow-listed condition dimensions and per-facet aggregate reporting for instrument family, string, capture path, phase, dynamic, noise and tuning. It preserves legacy manifests and per-segment metrics; no physical-device result is claimed.
- PR #134 branch feat/audio-corpus-dimension-reports-main132, current head 77238d1ad0775dda5a74fbe5bb54a40de5b80a50. Required workflow [#43684634245](https://github.com/leenusdarnal/guitarlab/actions/runs/43684634245) passed application/curriculum and Node.js 26 checks on the current implementation.
- After PR #134, the remaining Issue #89 work is genuinely physical: consented local guitar recordings with ground truth and physical browser/OS/device acceptance. Issues #9/#10 remain physical IndexedDB/offline/backup/restore QA; Issue #18 remains release hardening. Synthetic fixtures and mocked Chromium are regression coverage only.
- Issue #5 remains open until controlled failure-injection and recovery are manually dispatched and their actual run URLs recorded. Issue #3 remains open pending explicit owner decisions; no production resources, secrets, D1 database, routes, authentication or production deployment are authorized.

## Historical checkpoint — 2026-11-14 after PR #113

- Verified `main`: `fbe9e75dc9640d31a8b5c9d281cac60b6d503ddf`; PR #113 is merged and its post-merge GuitarLab CI run [#43623315478](https://github.com/leenusdarnal/guitarlab/actions/runs/43623315478) passed.
- PR #112 links newly created sessions/observations to the exact authored lesson/exercise pair, curriculum release and taxonomy version.
- PR #113 derives local read-only exposure from exact linked observations; it counts distinct exercises and sessions and does not infer accuracy or mastery.
- Next implementation: expand the source-evidenced taxonomy from ten to fifteen exact exercise scopes in taxonomy v0.2.0 while retaining the v0.1.0 snapshot so historical observations continue to match their original taxonomy.
- No open PR was present at this checkpoint.

## 1. Latest verified checkpoint

- PR #102, Jazz & Harmony Weeks 5–8, merged to `main` as `de9b0f3992c258e5dfdc840e48fb45da47276bd2`.
- PR #102's final branch checks passed: application/curriculum validation, Node.js 26 compatibility and the dedicated curriculum validator. Post-merge curriculum validation run [#43579576618](https://github.com/leenusdarnal/guitarlab/actions/runs/43579576618) passed. The post-merge application CI run [#43579576570](https://github.com/leenusdarnal/guitarlab/actions/runs/43579576570) passed.
- Curriculum v1.0.6 preserves all 152 lesson IDs and 34 canonical skill IDs. Task-specific authoring now covers 44/152 lessons overall and 32/48 Year 3+ specialist lessons; 391 mapping links are retained.
- Audio implementation Issue #68 is closed. PRs #73–80 added lifecycle tests, explicit session ownership and deterministic teardown; PRs #81–86 added pitch estimation, explicit microphone capture, stable-note tracking, tuner, note-recognition exercises and synthetic benchmarks; PRs #90–91 expanded synthetic validation and added a local real-recording evaluator.
- Remaining audio evidence is isolated in [Issue #89](https://github.com/leenusdarnal/guitarlab/issues/89): a consented real-guitar corpus, physical-device/browser measurements and resource-cleanup acceptance. Mocked browser tests and synthetic fixtures are not hardware evidence.
- M7.2 adaptive practice now includes the evidence audit (PR #92), deterministic evidence-aware read model (PR #93), canonical skill catalogue and Practice Studio recommendations/assessment coverage (PR #94), append-only local dismiss/correct feedback with provenance (PR #103), and comparable measured-score summaries/trends by skill (PR #104). Issue #69 remains open for structured per-item outcomes/confusion signals and genuine topic/fretboard coverage; the present records do not support those claims.
- Ear-training foundations and interval recognition are merged in PRs #61 and #67. Jazz & Harmony Weeks 1–8 are merged in PRs #101–102.
- Preview deployment workflow has previously succeeded for a main-branch commit; verify the exact commit before relying on it. Production deployment, production D1, authentication and cloud sync remain deferred.
- No open PR was present immediately after PR #102 merged. Refresh PRs, issues and Actions before beginning each new slice.

## 2. Priority order

### P0 — Reconcile curriculum v1.0.6 and the live repository checkpoint (complete)

1. [x] Review and merge PR #102 after curriculum and application checks passed.
2. [x] Verify post-merge application CI run #43579576570 and curriculum validation run #43579576618.
3. [x] Merge PRs #103–104 and verify PR #104 application/curriculum plus Node.js 26 checks (run #43584492437).
4. [x] Reconcile execution priority, implementation tracker, M7.2 evidence audit, roadmap and Issue #69 (documentation PR #105).

**Exit criteria:** current main SHA, CI evidence, curriculum progress and issue state are aligned across the repository tracker and GitHub.

### P1 — Adaptive recommendations, item analytics and authored practice taxonomy (Issue #69) — complete

- PRs #92–94: evidence audit, deterministic learner/release-scoped read model, canonical 34-skill catalogue and Practice Studio recommendations/category assessment coverage.
- PR #103: append-only local recommendation feedback with provenance and backup/restore/reset integration.
- PR #104: comparable measured-score summaries, descriptive spread and conservative trends.
- PRs #107–110: objectively keyed item outcomes, comparable item accuracy and repeated-same-item-miss prioritisation without changing whole-skill mastery.
- PRs #111–115: explicitly authored practice taxonomy, stable session/observation links, exact topic/technique/string/fret-position exposure, and retained historical taxonomy snapshots.
- PR #116: verbatim source-evidence validation for each scope against its exact exercise instructions or success criterion, including negative guards for fabricated/cross-exercise text.
- PR #117: explicit expected-versus-selected response contrasts for the original four-choice interval instrument.
- PR #132: explicit expected-versus-selected response contrasts for all 13-class v2/v3 instruments; preserves v1 mapping, version/scoring-rule isolation and supporting-probe scope.
- Issue #69 is closed. Response contrasts remain read-only descriptive patterns and do not diagnose misconceptions or affect mastery.

**Exit criteria:** met. Persisted recommendation feedback is covered by PR #103; the later v1/v2/v3 response contrast read models add no learner-record fields, migrations or backup-format changes.


### P2 — Musicianship, connected theory and repertoire (Issue #17) — complete

- [x] Chord-movement listening with feedback, retry and accessible visual instructions (PR #118).
- [x] Theory recall prompts connecting name, sound and musical use (PR #119).
- [x] Shared scale, triad, inversion and CAGED calculations (PR #120).
- [x] Local repertoire notes, section structure, bookmarks, practice targets and backup/restore (PR #121).
- [x] All 12 simple interval classes across three focused ascending melodic sets (PR #127).
- [x] Current bundled-content provenance and future asset-level licensing gate (PR #129); Issue #17 closed.

**Exit criteria:** met for the current built-in GuitarLab content. The licensing audit is not blanket clearance for user-entered material or external links. Future bundled files still need per-asset rights evidence.

### P2 follow-up — Deterministic interval starting pitch and register (Issue #130) — complete

- [x] Cycle each interval class through all 24 chromatic MIDI roots C3–B4 with deterministic strides of five for four-choice sets and seven for the five-choice set.
- [x] Preserve authored semitone distance and ascending melodic presentation; all generated tones remain within C3–B5.
- [x] Version the stimulus as definition v3 / `exact-interval-choice-v3`, retain `supporting_probe`, and keep historical v2 records separate.
- [x] Verify full root coverage, frequency bounds, semitone invariance, deterministic replay, retry/next behaviour and Web Audio teardown.
- [x] Merge PR #131 as `b34578c4c295e83c5fc95e5350a92d3f664a398e`; required workflow #43683213960 passed, including Node.js 26 compatibility.

**Exit criteria:** met. Issue #130 is closed. Descending/harmonic intervals and notation spelling remain separate, unclaimed work.
 
### P3 — Real-device audio and release evidence (Issues #89 and #18)

1. Define a consented, local-only real-guitar corpus with ground-truth frequencies and provenance.
2. Measure per-string detection coverage, median/P95 absolute cents error, false detections during silence/noise and note-on latency.
3. Record instrument/pickup or microphone, playing dynamics, tuning offsets, room noise and attack/sustain/decay segments.
4. Run microphone, tuner and resource-cleanup acceptance on physical desktop/mobile devices and supported browser engines.
5. [x] Implement SvelteKit-managed CSP and response-header regression assertions (PR #135); continue manual CSP deployment compatibility, WCAG 2.2 AA, privacy, dependency/licence, performance, rollback and offline acceptance.
6. Record tested and untested browser/device combinations; do not generalise mocked Chromium results.

**Exit criteria:** a reproducible evidence report and device matrix exist, or the exact missing hardware access is explicitly documented as blocked.

### P4 — Remaining infrastructure and manual acceptance (Issues #3, #5, #9 and #10)

1. Verify the CI controlled-failure/recovery path without weakening required checks.
2. Complete physical desktop/mobile IndexedDB upgrade, reload and offline restart checks.
3. Complete physical-device backup/restore and destructive-reset confirmation checks.
4. Review production environment ownership, private-data architecture and access controls. Production provisioning/deployment requires separate explicit approval.

**Exit criteria:** manual runbook evidence is recorded and production remains isolated until separately approved.

## 3. Adopt / adapt / defer decisions

**Adopt:** deterministic evidence-aware prioritisation, explicit recommendation reason codes, append-only learner feedback, confidence/noise handling, stable-note tracking, connected CAGED/triad learning, browser audio acceptance and an operational licence register.

**Adapt:** use a simple explainable rules model rather than BKT/IRT; treat repeated self-reported difficulty as a pacing hint, not incorrect-answer evidence; use third-party repositories as design references, not source to copy.

**Defer/reject:** opaque predictive mastery, AI tutor, social competition, polyphonic chord grading without validation, mandatory cloud sync, GPL code reuse without a licensing decision and copyrighted TAB scraping.

See [Research Integration Plan](RESEARCH_INTEGRATION_PLAN.md) for the comparative research decisions.

## 4. Working rules

1. Implement independent, bounded PRs in parallel when dependencies permit. Do not make a branch depend on another unmerged PR unless it is explicitly based on that branch.
2. Start each task from the latest verified `main` SHA.
3. Inspect open PRs, open issues, active Actions runs and latest main CI before starting.
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
5. Continue the highest-priority incomplete task above; independent lower-priority work may proceed on parallel branches, but merge strictly in priority order.
6. Before merging, verify PR head SHA and required checks; after every merge verify main CI, then rebase and revalidate the next queued PR. Record PR, CI evidence, manual QA and the next exact task before pausing.

## 6. Current hand-off

| Field | Value |
|---|---|
| Last verified main SHA | `18515ec7bb1ab6d76b4f19a5e9a424585945d890` (PR #135 merged) |
| PR #135 | Merged; SvelteKit-managed CSP and response-header regression assertions; PR CI #43689404424 and post-merge main CI #43689790086 passed |
| PR #134 | Merged; privacy-safe local WAV evaluator condition breakdowns; this is evaluator tooling, not real-guitar measurement evidence |
| Issue #17 / #69 / #130 | Closed; musicianship/repertoire/provenance, adaptive practice and deterministic interval roots delivered |
| Issue #89 | Open; consented real-guitar corpus, ground-truth metrics and physical browser/device matrix not yet supplied/run |
| Issues #9 / #10 | Open; physical-device IndexedDB/offline and backup/restore/reset acceptance remains |
| Issue #18 | Open; CSP implementation merged, but manual accessibility, privacy, physical-device, audio lifecycle, licensing, performance and rollback sign-off remains |
| Issue #5 | Open; failure-injection and recovery dispatches have not run because the previous GitHub sign-in session expired; no run URLs exist yet |
| Issue #3 | Open and deferred; production ownership/architecture/release approval decisions remain unresolved |
| Deferred | Production D1, authentication, cloud sync and production deployment |

**Source-of-truth hierarchy:** current code/tests on `main` → merged PR evidence → current GitHub Issues/Actions → this checkpoint → historical notes and chat summaries.


## M7.2 taxonomy expansion checkpoint — 2026-11-14

- PR #113 merged as `fbe9e75dc9640d31a8b5c9d281cac60b6d503ddf`; main CI run #43623315478 passed.
- The next batch adds five exact exercises: Year 1 Weeks 16, 17 and 37; Year 2 Weeks 4 and 30.
- Taxonomy moves from v0.1.0 to v0.2.0 and retains an immutable v0.1.0 snapshot. New sessions use v0.2.0; historical records remain matched against v0.1.0 without backfilling.
- Exposure aggregation unions scope identity across supported taxonomy snapshots while only applying dimension tags that existed in the record's own version.
- Five topics and one technique are added. Only the explicit low E bass string in the Week 16 musical-application exercise is tagged as string 6; no new fret-position/range is inferred.
- Curriculum-owner review remains a manual follow-up. No confusion codes or mastery rules are added.


## M7.2 evidence-validation slice — 2026-11-15

- Baseline: PR #115 merged as `bd1a7f82b9585ade6fa02f420e3ca49a4046c4a3`; post-merge application CI and curriculum validation passed.
- Active branch: `feat/m7-validate-exercise-source-evidence`.
- The taxonomy validator now requires every `sourceEvidence` excerpt to occur verbatim in the exact linked exercise's authored `instructions` or `successCriterion`, across current and retained historical snapshots.
- The evidence matcher has explicit negative guards for fabricated text and text that belongs to a different exercise. The v0.3.0 catalogue and historical version boundaries are preserved.
- Next: run curriculum validation, formatting, type/unit checks and full CI; correct any evidence that fails rather than relaxing the matcher. After merge, continue deterministic exercise-specific confusion/error research only where authored rules make a misconception unambiguous.
