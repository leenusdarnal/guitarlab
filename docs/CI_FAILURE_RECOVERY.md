# Controlled CI failure and recovery rehearsal

## Purpose

Issue #5 requires evidence that CI reports a controlled failure and that the workflow can subsequently recover. The repository's normal required CI is deliberately not weakened or given a failure-injection flag.

The separate `.github/workflows/controlled-ci-rehearsal.yml` workflow is manual-only, has no write permissions, does not check out code, and does not deploy.

## Run after this workflow is merged to main

GitHub only offers `workflow_dispatch` for workflows present on the default branch. Once this PR is merged:

1. Open **Actions → Controlled CI failure and recovery rehearsal → Run workflow**.
2. Select `failure-injection` and run it against `main`.
3. Confirm the run fails at the explicitly named **Inject the expected failure** step with exit status 1. This red run is expected and isolated; it is not the GuitarLab CI required status.
4. Dispatch the same workflow again with `recovery`.
5. Confirm **Verify the recovery path** passes.
6. Separately confirm the normal **GuitarLab CI** and **Curriculum validation** statuses for the tested main commit remain green.
7. Record the two workflow run URLs, tested commit SHA, date/time/timezone and reviewer below.

Do not rerun or cancel the required application CI as part of this exercise. The controlled red run must never be interpreted as an application regression or a successful application validation.

## Safety boundaries

- The rehearsal runs only on explicit manual dispatch.
- It is not a dependency of the PR workflow, required branch protection or deployment.
- It requires no secrets, repository writes, external services or production resources.
- Failure injection is a deterministic shell exit and cannot modify repository data.
- The recovery mode confirms a clean independent run; it does not automatically turn the failed run green.

## Evidence log

| Mode | Workflow run URL | Commit SHA | Date / timezone | Reviewer | Result |
| --- | --- | --- | --- | --- | --- |
| failure-injection | Pending — dispatch after merge | Pending | Pending | Pending | Not run |
| recovery | Pending — dispatch after failed run | Pending | Pending | Pending | Not run |

**Issue #5 status:** remains open until both real workflow runs are recorded. A PR that adds the rehearsal is not itself proof that the rehearsal passed.
