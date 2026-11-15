# GuitarLab — production environment decision and release gates

**Status: pending owner decisions and explicit release approval. No production configuration or resource is authorized by this document.**

This decision record supports Issue #3. It records what is known, what must be decided, and the conditions required before a production Worker, database, domain or credential is created or changed.

## 1. Current verified position

The repository's Cloudflare deployment plan records the following account-scope findings from the 13 November 2026 audit:

- The connected Cloudflare account exposed the preview Worker `guitarlab-preview`; no production Worker named `guitarlab` was confirmed in that account.
- The account-level D1 listing returned no databases and no Worker custom domains were listed at audit time.
- The preview Wrangler config omits D1 and the current learner data path uses IndexedDB/browser-local storage.
- The application does not currently expose authenticated server routes for learner data or a cloud-sync API.
- The repository release scope says production must be access-restricted or protected by secure authentication before personal cloud data is stored.
- No production Wrangler config or production deployment workflow is present in the audited paths.

These statements are limited to the connected account and audit date. They are not a guarantee that a resource does not exist in another account or zone. Recheck the account and resource owner before any future change.

## 2. Proposed first-release boundary — for owner approval

The current product design is local-first: learner profiles, practice sessions and personal notes are browser-local. The lowest-risk first-release proposal is therefore:

1. Keep learner data in IndexedDB/local storage.
2. Do not provision or bind remote D1 for the first release unless a separately scoped cloud-sync feature is approved.
3. Do not add user identity, authentication or sync APIs implicitly as part of deploying the current local-first build.
4. Treat the Worker as an application delivery/runtime environment, not as an authorized learner-data store.
5. Decide explicitly whether the production URL should be private/restricted or publicly reachable as a stateless app shell. A public URL must not expose private learner data or imply account security that does not exist.

This is a proposal, not an approved production decision. The owner must confirm the intended access model and data boundary before configuration is created.

## 3. Decisions required before writing production configuration

| Decision | Required owner input | Current state |
| --- | --- | --- |
| Cloudflare account and zone owner | Name/team accountable for billing, access and incident response | Pending |
| Production Worker identity | Confirm intended Worker name and whether a resource already exists | Pending |
| Production hostname / routing | Confirm domain ownership, hostname and routing model | Pending |
| Access model | Public stateless shell, private access, or authenticated product | Pending |
| Learner data location | Browser-local only, or separately approved remote persistence | Pending |
| Remote D1 | Yes/no; if yes, schema, owner, backup, retention and recovery | Pending — not provisioned |
| Authentication / authorization | Required only if accounts or private server-side data are in scope; specify implementation and threat model | Pending |
| Secrets and environment variables | Required names, least-privilege token scopes, secret owner and rotation process | Pending |
| Release approval | Authorized approver, change window and rollback decision owner | Pending |
| Incident / rollback ownership | Who can inspect Worker logs, roll back code and recover data | Pending |

Do not infer an approval from repository access, a successful preview deployment or the existence of a local D1 placeholder.

## 4. Isolation requirements

When the owner approves an environment model:

- Preview and production must use explicit, independent Wrangler configuration and GitHub environments.
- Preview must never bind to production databases, secrets, routes or data.
- Production secrets must be stored in the protected production environment and never written to source, logs, documentation or PR descriptions.
- Do not use production learner data in browser acceptance or preview.
- Do not add remote D1 unless the data architecture explicitly requires it. If approved, preview and production require separate database IDs and migration/recovery plans.
- Local configuration must remain local-only; the all-zero placeholder D1 identifier is not a production binding.
- Do not make production deployment an automatic side effect of a normal PR merge.
- Production release must use the exact approved commit/build that passed required CI and preview acceptance.

## 5. Production release gates

All gates must have evidence and an accountable reviewer.

| Gate | Required evidence | State |
| --- | --- | --- |
| Account/resource ownership | Confirmed Cloudflare account, Worker and zone owner | Not run |
| Access model decision | Approved public/private/authenticated scope | Pending owner |
| Data architecture decision | Local-only or approved authenticated cloud-sync design | Pending owner |
| Configuration isolation | Reviewed production Wrangler configuration and protected environment | Blocked on decisions |
| Secret permissions | Least-privilege token, secure storage and rotation owner | Not verified |
| Application acceptance | Exact commit passes CI and preview browser/manual acceptance | Not run for production |
| Privacy / security review | Data-flow, authentication, logging, CSP and threat-model sign-off | Not run |
| Backup / recovery | Tested recovery procedure appropriate to selected storage architecture | Not run |
| Rollback | Known-good Worker version and data rollback compatibility | Not run |
| Explicit release approval | Named approver and recorded approval for exact SHA | Not approved |

## 6. Prohibited actions until approval

- Do not create or rename a production Worker.
- Do not create production D1, apply remote migrations or bind any remote database.
- Do not create production routes, custom domains or DNS records.
- Do not create, print or commit production secrets.
- Do not deploy production or grant public access to personal server-side learner data.
- Do not close Issue #3 solely because this decision record exists.

## 7. Decision and sign-off log

| Decision / approval | Owner | Date / timezone | Evidence / ticket | Status |
| --- | --- | --- | --- | --- |
| Account and resource ownership | Pending | Pending | Pending | Not approved |
| Access and data model | Pending | Pending | Pending | Not approved |
| Production configuration review | Pending | Pending | Pending | Not run |
| Production release approval | Pending | Pending | Pending | Not approved |

**Issue #3 remains open.** This document is preparation for a future owner decision; it does not define actual production resource identifiers or authorize a deployment.
