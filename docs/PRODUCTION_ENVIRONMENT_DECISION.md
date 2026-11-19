# GuitarLab — production environment decision and release record

**Status: first local-first production release deployed; ongoing production changes remain approval-gated.**

**Last reconciled:** 19 November 2026  
**Repository baseline:** `main` at `55b1d34b57ef7ddeaa7ee7fdea649a3b764830bf`

This document is the current record for the first production release and the decisions that remain open. It supersedes the earlier pre-deployment statement that no production deployment had been authorized. The historical 13 November account inventory below is retained only as dated evidence, not as the current production state.

## 1. Verified first production release

The first local-first production deployment was completed successfully on 17 November 2026.

- **Worker:** `guitarlab`
- **Temporary URL:** https://guitarlab.leenusdarnal.workers.dev
- **Workflow:** [Deploy GuitarLab production — run #44054131712](https://github.com/leenusdarnal/guitarlab/actions/runs/44054131712)
- **Exact deployed commit:** `1e18998eba43d0c2f6e3267ddeccb11b198b4188`
- **Workflow result:** successful; exact-commit CI verification, production build/deploy, five-route smoke tests, security-header checks and evidence capture completed.
- **Evidence artifact:** `guitarlab-production-deployment-1e18998eba43d0c2f6e3267` (the canonical artifact name recorded in Issue #3 is `guitarlab-production-deployment-1e18998eba43d0c2f6e3267`).
- **Retention recorded by Issue #3:** through 15 February 2027.
- **Issue:** [#3 — Deploy first local-first GuitarLab production Worker](https://github.com/leenusdarnal/guitarlab/issues/3), closed 17 November after all first-release acceptance criteria were checked.

The first release is intentionally local-first: learner profiles, progress, practice sessions and preferences remain in browser-local IndexedDB. The release did not enable D1, server-side learner data, registration/login, user sessions or cloud sync.

## 2. Current release reconciliation

Current repository `main` is `55b1d34b57ef7ddeaa7ee7fdea649a3b764830bf` (19 November; PR #201). The verified first deployment is older, at `1e18998eba43d0c2f6e3267ddeccb11b198b4188`.

**Do not describe the current main SHA as deployed.** The GitHub deployment workflow evidence proves the initial release SHA and its smoke tests; it does not prove that later commits have been deployed. The active Worker version was not independently queried during this documentation reconciliation.

QA-04 in `ENGINEERING_QUALITY_TRACKER.md` remains OPEN until the current Worker version is reconciled against the deployment artifact and an explicit decision is recorded to keep or update production. No production redeployment is authorized by this documentation change.

## 3. First-release architecture and continuing boundaries

- Learner profiles, progress, practice sessions and preferences remain browser-local.
- The Worker serves the application shell and public curriculum.
- No remote D1 binding or remote learner-data store is part of this release.
- Authentication and cloud sync remain separate M5 work; they must not be inferred from the production deployment.
- The production URL is a stateless application release, not evidence of account security or server-side learner-data protection.

## 4. Historical environment audit (13 November 2026)

The pre-release audit recorded that the connected Cloudflare account exposed the preview Worker `guitarlab-preview`; it did not confirm a production Worker named `guitarlab` at that time. The account-level D1 listing returned no databases and no Worker custom domains were listed during that audit. The preview Wrangler config omitted D1, and the learner data path used browser-local storage.

Those observations are limited to the connected account and the 13 November audit date. They are historical and must not be presented as a current inventory after the 17 November production deployment.

## 5. Decisions still required for future production changes

| Decision | Current state | Required before changing production |
|---|---|---|
| Cloudflare account / zone ownership | Not reverified in this audit | Confirm accountable owner and access |
| Production Worker identity | Initial Worker `guitarlab` deployed | Confirm current resource and version |
| Hostname / routing | Temporary workers.dev URL in use | Approve custom domain / route separately |
| Access model | Public stateless app shell | Reassess before adding private server-side data |
| Learner data location | Browser-local only | Separate approval for any remote persistence |
| Remote D1 | Not part of first release | Schema, isolation, backup, retention and recovery decision |
| Authentication / authorization | Not enabled by first release | Threat model, implementation and lifecycle acceptance |
| Secrets / environment variables | Production workflow uses protected GitHub environment | Review least privilege, ownership and rotation |
| Release approval | First release completed | Explicit approval required for each future production deployment |
| Incident / rollback ownership | Workflow and retained deployment evidence exist | Confirm operator and rollback procedure |

## 6. Release gates for subsequent deployments

A subsequent production deployment must:

1. Be manually initiated from `main` with explicit confirmation.
2. Verify required CI for the exact selected SHA.
3. Build and dry-run the production configuration.
4. Use the protected `production` GitHub environment and its configured credentials.
5. Run route and security-header smoke tests.
6. Preserve the exact SHA, Worker version/deployment ID, timestamp, target URL and smoke-test results as a retained artifact.
7. Record a known-good rollback version and verify compatibility before changing production.

Do not treat the successful first release as blanket approval for later deployments, database provisioning, authentication, custom domains or cloud-sync changes.

## 7. Sign-off and decision log

| Decision / approval | Current evidence | Status |
|---|---|---|
| First local-first production deployment | Run #44054131712, SHA `1e18998eba43d0c2f6e3267ddeccb11b198b4188`, Issue #3 | **DONE — first release** |
| Current live Worker version | Not independently queried during 19 November reconciliation | **OPEN — QA-04** |
| Access and data model for first release | Browser-local learner data; no remote D1 / cloud sync | **DONE — first-release boundary** |
| Production configuration for future changes | Existing manual workflow and protected environment | Review before each change |
| Backup / recovery for remote learner data | No remote learner-data store in first release | Not applicable to first release; required if architecture changes |
| Rollback evidence for current live Worker | Must reconcile retained artifact and active version | **OPEN — QA-04** |

**Authority:** Issue #3 records the completed first deployment. `ENGINEERING_QUALITY_TRACKER.md` owns the remaining QA-04 status. This document records release facts and future change gates; it does not authorize a new deployment or infrastructure mutation.
