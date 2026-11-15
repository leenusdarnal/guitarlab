# GuitarLab — CI Reliability Improvement Tracker

**Purpose:** Reduce avoidable CI failures, make failures easier to diagnose, and keep validation representative of the code actually committed to the repository.

**Scope:** GitHub Actions workflow reliability, dependency installation, formatting, database migration validation, and browser acceptance stability. Product features and curriculum changes are out of scope.

**Working branch:** `chore/ci-reliability-improvements`

**Related work:** [UX-02 PR #139](https://github.com/leenusdarnal/guitarlab/pull/139) exposed formatting baseline issues while broadening Prettier coverage. This CI work is independent and is based on `main`.

## Status legend

- **Implemented in this PR** — change is present on this branch; CI still needs to validate it.
- **Pending** — researched and tracked, not yet implemented.
- **Partially verified** — the normal CI path passed, but a negative/fault-injection acceptance case remains untested.
- **Verified** — all listed acceptance criteria have passed in GitHub Actions.
- **Deferred** — intentionally postponed with a reason.

Do not mark an item Verified from a code inspection alone. Record the workflow run and evidence.

## Findings that motivated this tracker

1. A sequential validation job stopped at its first failing step. In run [#1363](https://github.com/leenusdarnal/guitarlab/actions/runs/43711188955), formatting failed and lint, Node 22 type/Svelte checks, unit tests, the production build, deployment dry-runs, smoke tests, and browser suites were skipped. The separate Node 26 job passed its type/Svelte checks, unit tests, and production build.
2. The same run's repository-wide formatting experiment reported nine existing formatting issues across curriculum JSON, a Drizzle snapshot, application tests, a curriculum catalogue, and validation scripts. The active `main` workflow still checks changed files through a manually maintained allowlist; broadening that gate must include a deliberate baseline-cleanup plan.
3. CI generated and finalized Drizzle migrations before applying them, but did not explicitly fail if generation changed or created migration artifacts that were not committed to the PR.
4. Four browser acceptance scripts contain many `networkidle` waits. This is a possible source of timing sensitivity and should be replaced selectively with user-visible readiness assertions, not by a blind global replacement.
5. The Node 26 setup enables npm caching; the Node 22 setup did not.
6. Playwright and axe-core were installed through a separate no-save npm install rather than the normal lockfile-controlled dependency installation.

## Implementation tracker

| ID | Priority | Work item | Acceptance criteria | Status |
|---|---|---|---|---|
| CI-01 | P0 | Run independent checks even when a sibling check fails | A formatting or lint failure does not prevent lint, type/Svelte checks, unit tests, or the build from reporting their own results. Dependent steps still skip when their prerequisites fail. | Partially verified — all independent checks passed on the successful path in run #1366; deliberate failure injection remains outstanding |
| CI-02 | P0 | Detect generated database migration drift | After Drizzle generation/finalization, CI fails with a clear diagnostic if tracked or untracked files under `drizzle/migrations` changed. Valid committed migration changes pass. | Partially verified — clean committed migrations passed the drift check in run #1366; deliberate uncommitted-change injection remains outstanding |
| CI-03 | P1 | Cache npm data for the Node 22 validation job | `actions/setup-node` uses the npm cache keyed by `package-lock.json`; installs remain reproducible through `npm ci`. | Verified in run #1366 — Node 22 setup and dependency installation passed |
| CI-04 | P1 | Establish a deliberate formatting baseline | Inventory all Prettier-managed file types, resolve pre-existing formatting debt in a separate cleanup, and use one consistent formatter policy without allowing CI to modify submitted code. Do not silently widen the current changed-file allowlist. | Pending |
| CI-05 | P1 | Make Playwright and axe installation lockfile-controlled | Add compatible, pinned development dependencies and update the lockfile; remove the separate ad hoc install; verify clean `npm ci` installs both. | Pending |
| CI-06 | P1 | Reduce browser acceptance timing flakiness | Replace high-risk `networkidle` waits with explicit route, heading, state, and application-readiness assertions; retain meaningful end-to-end coverage. Validate all four browser suites repeatedly. | Pending |
| CI-07 | P2 | Cache browser binaries | Cache the Playwright browser installation with a key that includes the Playwright version and operating-system image; cache misses must fall back safely to installation. | Pending |
| CI-08 | P2 | Improve CI failure diagnostics | Preserve useful browser traces/screenshots, Wrangler logs, and test output on failure; make artifacts available without exposing learner data or secrets. | Pending |
| CI-09 | P2 | Review dependency audit behavior | Preserve blocking high/critical advisories, distinguish registry/network failures from vulnerability findings, and ensure audit output is understandable and actionable. Never convert an unavailable audit into a passing security result. | Pending |
| CI-10 | P2 | Reassess job and step timeouts | Measure complete workflow durations first; set explicit, evidence-based timeouts that avoid premature cancellation while still bounding hung processes. | Pending |
| CI-11 | P3 | Review validation duplication and ordering | Identify checks repeated across Node 22/26 jobs; retain Node compatibility coverage while avoiding unnecessary repeated work. Any consolidation must preserve clear failure attribution. | Pending |

## Details for the first implementation batch

### CI-01 — Independent check reporting

The primary validation job now gives independent checks an explicit condition tied to successful dependency installation rather than relying on the default `success()` condition of the preceding step.

The dependency graph remains intentional:

- Dependency installation is a prerequisite for project checks.
- Database migration application depends on successful generation/finalization; D1 integrity tests depend on successful migration application.
- Cloudflare deployment dry-runs and the Worker smoke test depend on a successful production build.
- Browser acceptance suites depend on a successful build and successful Playwright/Chromium setup.
- Browser suites are independently eligible to run, so one failed browser suite does not suppress the other suites.
- The separate Node 26 job also runs its type/Svelte check, unit tests, and build independently after dependency installation.

A cancelled workflow should still stop promptly. A failed prerequisite should not trigger dependent work.

### CI-02 — Database migration drift

CI checks both tracked and untracked state under `drizzle/migrations` after generation/finalization. If Drizzle produces an uncommitted SQL migration, snapshot, or journal change, the job reports the changed paths and fails before applying local migrations.

This catches the case where CI tests a generated migration that was not included in the reviewed PR.

### CI-03 — npm cache

The Node 22 dependency setup now enables the npm cache and keys it from `package-lock.json`. The lockfile remains the source of truth; this is a package-download cache, not a replacement for `npm ci`.

## Validation record

| Date | Workflow / PR | Result | Evidence |
|---|---|---|---|
| 2026-11-15 | PR #139, run #1363 | Failed at formatting; Node 26 job passed | [Run #1363](https://github.com/leenusdarnal/guitarlab/actions/runs/43711188955). Nine format warnings; independent later Node 22 steps were skipped in the then-current workflow. |
| 2026-11-15 | PR #140, run #1366 | Successful-path validation passed on the PR head SHA | [Run #1366](https://github.com/leenusdarnal/guitarlab/actions/runs/43712693446). Primary Node 22 job passed dependency audit, migration generation and clean-tree drift guard, local D1 migration/integrity, curriculum and design-token validation, changed-file formatting, lint, type/Svelte checks, unit tests, production build, Cloudflare configuration dry-runs, Worker smoke test, and all four browser acceptance suites. Node 26 dependency install, type/Svelte checks, unit tests, and production build passed. Required legacy status passed. CI-01 failure-isolation and CI-02 uncommitted-migration negative cases were not fault-injected. |

## Change control and sequencing

1. Keep this tracker updated in every CI improvement PR.
2. Implement and validate one coherent batch at a time; keep changes separate from UX/product PRs.
3. Do not loosen a check merely to make CI green. Distinguish product/code failures, repository hygiene failures, dependency/security findings, and runner/network failures.
4. Do not introduce automatic formatting in GitHub Actions. Developers and pre-commit hooks format; CI verifies the committed result.
5. Preserve required branch-protection status contexts unless the repository's branch protection is deliberately migrated and verified.
6. Never run production deployment as part of a CI reliability experiment; deployment configuration dry-runs and local smoke tests are validation only.
7. Mark work Verified only after the relevant checks pass on the PR head SHA.

## Out of scope for this tracker

- Changing GuitarLab product behavior, curriculum content, skill identifiers, or learner data.
- Disabling security, accessibility, type, unit, migration, or browser acceptance checks to reduce runtime.
- Treating a green Node 26 compatibility job as a substitute for all Node 22 checks.
