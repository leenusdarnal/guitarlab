# GuitarLab — Cloudflare Deployment Plan

**Repository:** `leenusdarnal/guitarlab`  
**Primary branch:** `main`  
**Platform:** Cloudflare Workers  
**Framework:** SvelteKit with `@sveltejs/adapter-cloudflare`  
**Local persistence:** IndexedDB / browser-local storage  
**Remote database:** Cloudflare D1 is configured in the repository's local development setup, but remote learner-data persistence is not currently enabled  
**Status:** Planning and audit; no production deployment authorized  
**Last reviewed:** 13 November 2026

---

## 1. Objective and operating principles

Establish a safe, repeatable release process with two distinct environments:

- **Preview:** validates an approved application commit before release.
- **Production:** serves the live application and is deployed only after explicit release approval.

Preserve Cloudflare Workers as the hosting architecture. This is a full-stack SvelteKit Worker application, not a static-only Cloudflare Pages site.

Principles:

1. Verify existing resources before creating or changing them.
2. Keep preview and production configuration, secrets and data isolated.
3. Do not introduce remote D1 persistence until the product's data architecture and cloud-sync requirements are explicitly decided.
4. Never use production data in preview.
5. Never deploy production or run production migrations without explicit approval.
6. Record commit SHA, build/deployment version, migration state and verification result for every release.
7. A successful upload or HTTP response is not proof that the application is functionally healthy.

## 2. Confirmed findings

The following findings were established from the repository and connected Cloudflare account during the 13 November 2026 review.

| Area | Confirmed finding |
|---|---|
| GitHub repository | `leenusdarnal/guitarlab` |
| Primary branch | `main` |
| Cloudflare authentication | Working |
| Hosting architecture | Cloudflare Workers |
| Preview Worker | `guitarlab-preview` exists |
| Preview URL | https://guitarlab-preview.leenusdarnal.workers.dev |
| Preview deployment | A successful upload/version was observed |
| Preview traffic | 100% assigned to the observed version |
| Preview HTTP response | URL responded; returned page showed the GuitarLab dashboard loading state |
| Cloudflare Pages projects | None found in the connected account |
| Cloudflare D1 databases | Zero returned by the account-level D1 listing at audit time |
| Production Worker | Not confirmed |
| Preview Wrangler config | `wrangler.preview.jsonc` exists |
| Production Wrangler config | Not found at `wrangler.production.jsonc` |
| Preview workflow | `.github/workflows/deploy-preview.yml` exists |
| Production deployment workflow | Not found in the inspected workflow paths |

**Interpretation of the D1 finding:** The repository README explicitly says the preview configuration intentionally has no D1 binding, learner preferences and practice data remain browser-local, and cloud sync is not enabled. Therefore, the absence of a remote preview D1 binding is not automatically a defect. Do not create D1 databases just to make the deployment plan look complete. First decide whether remote persistence, accounts or cloud sync are part of the release scope.

### Repository configuration observations

- `wrangler.jsonc` is the local/default configuration and contains a D1 binding named `DB` pointing to `guitarlab-local` with an all-zero placeholder ID. The README identifies this as a local placeholder and says not to use `--remote` for local checks.
- `wrangler.preview.jsonc` targets `guitarlab-preview`, uses the SvelteKit Cloudflare build output, configures assets and observability, and intentionally omits D1.
- No `wrangler.production.jsonc` was found in the inspected paths.
- Drizzle schema configuration points to `src/lib/server/db/schema.ts` and writes migrations under `drizzle/migrations`.
- The README describes the current application as local-first and says cloud sync is not enabled.
- The preview deployment workflow is manually dispatched, checks the selected SHA is still the current `main` tip, requires successful named CI checks for that exact SHA, builds and deploys the preview Worker, then performs a basic HTTP/HTML smoke test.
- The existing preview smoke test is only a reachability/content check. It does not prove browser hydration, all user journeys, or remote database behavior.

Useful repository references:

- [README and current deployment notes](../README.md)
- [Main Wrangler configuration](../wrangler.jsonc)
- [Preview Wrangler configuration](../wrangler.preview.jsonc)
- [Preview deployment workflow](../.github/workflows/deploy-preview.yml)
- [Drizzle configuration](../drizzle.config.ts)
- [Data model documentation](DATA_MODEL.md)
- [Manual acceptance runbook](MANUAL_ACCEPTANCE.md)
- [Execution priority plan](EXECUTION_PRIORITY.md)

## 3. Target environment model

### Preview

- Worker: `guitarlab-preview`
- URL: `https://guitarlab-preview.leenusdarnal.workers.dev`
- Deploy only an approved commit after required CI checks pass.
- Use preview-specific variables and secrets.
- Use synthetic test profiles/data only.
- Keep browser-local data isolated from production by origin.
- Do not bind production D1 or production credentials.
- If remote D1 is later approved, provision a dedicated preview database and bind it only to preview.

### Production

- Intended Worker name: `guitarlab` (verify actual resource and ownership before use).
- Verify the production URL, routes, bindings and existing deployment history before changing anything.
- Configure production-only variables and secrets.
- Keep production learner data isolated.
- Do not assume a production D1 database exists. Remote D1 must be a separately approved product/infrastructure decision.
- Production release requires explicit approval.

## 4. Execution phases and gates

### Phase A — Complete repository and infrastructure audit (CF-01 / CF-02)

Tasks:

1. Inspect the latest `main` branch and record its commit SHA.
2. Inventory all Wrangler configuration files and environment references.
3. Inspect SvelteKit adapter, build scripts and pinned Wrangler version.
4. Inventory Drizzle schema, migrations and migration metadata.
5. Trace every application use of the `DB` binding.
6. Confirm which features currently use IndexedDB/local storage and whether any server routes require D1.
7. Review all GitHub Actions workflows, CI check names and deployment permissions.
8. Verify GitHub `preview` environment, secrets and variables without exposing secret values.
9. Verify Cloudflare Worker names, versions, routes, custom domains, bindings and observability.
10. Confirm whether a production Worker exists.
11. Document any unresolved account/resource discrepancy.

**Gate A:** No infrastructure changes until the intended application persistence model and target resources are understood.

### Phase B — Decide and configure data architecture (CF-03 / CF-04)

First make an explicit product decision:

**Option 1 — Keep the current local-first release**

- Do not create remote D1 databases merely for deployment.
- Keep learner preferences and practice data in browser-local storage/IndexedDB.
- Keep the preview Worker without a D1 binding, consistent with the current README.
- Keep the local D1 placeholder confined to local development and local tests.
- Document that accounts/cloud sync are not part of this release.

**Option 2 — Introduce remote persistence/cloud sync**

Only after explicit approval:

1. Define data ownership, authentication, authorization and sync behavior.
2. Define schema and migration rollout requirements.
3. Create separate preview and production D1 databases.
4. Record actual database IDs securely in environment configuration.
5. Add explicit environment-specific D1 bindings.
6. Ensure preview cannot reference production database IDs.
7. Test migration reproducibility and isolation.
8. Define backup, retention, export and recovery procedures.

Do not select Option 2 implicitly. A D1 schema existing in the repository does not itself mean remote cloud persistence is enabled.

**Gate B:** The selected data architecture is documented and every environment's bindings match that decision.

### Phase C — Preview configuration and acceptance (CF-05 / CF-06 / CF-07)

1. Verify preview GitHub environment configuration.
2. Confirm `CLOUDFLARE_API_TOKEN` is stored as an Actions secret and `CLOUDFLARE_ACCOUNT_ID` as an Actions variable; never print or commit their values.
3. Verify token permissions are limited to the required account/Worker deployment operations.
4. Validate `wrangler.preview.jsonc` and its build output.
5. Run all required CI checks against the exact commit.
6. Deploy only through the approved preview workflow.
7. Record commit SHA, Worker version/deployment identifier and timestamp.
8. Verify the public URL and critical routes.
9. Run browser acceptance tests for homepage, navigation, dashboard, learner profile, curriculum, lesson checkpoints, practice planner and supported music tools.
10. Verify IndexedDB/local persistence, backup/restore and offline behavior where applicable.
11. Check browser console, network failures and Worker exceptions.
12. Run accessibility and mobile/desktop acceptance checks.

The existing workflow's HTTP smoke test is a useful first check, not the complete acceptance gate.

**Gate C:** Preview acceptance passes for the exact commit proposed for production.

### Phase D — Production preparation (CF-08 / CF-09 / CF-10)

1. Confirm whether the production Worker already exists.
2. Verify its name, account, current version, routes and URL.
3. Determine whether production needs D1 at all for the approved release scope.
4. If remote D1 is approved, verify the actual production database ID and binding; never infer or reuse a preview ID.
5. Configure production-only secrets and variables.
6. Review authentication, session/cookie settings and allowed origins if those features are enabled.
7. Review every migration that would be applied.
8. Assess backward compatibility and whether an expand-and-contract migration is needed.
9. Prepare a supported backup/export and database recovery procedure before risky changes.
10. Confirm preview and production isolation.
11. Confirm CI success and preview acceptance for the release commit.
12. Prepare an operational rollback plan.

**Gate D:** Production resources and release prerequisites are verified. No production changes occur just because preparation is complete.

### Phase E — Production release (CF-11 / CF-12 / CF-13)

Production deployment is not authorized by this document. Obtain explicit release approval first.

Release sequence:

1. Freeze the approved commit SHA.
2. Confirm branch protection and required checks on `main`.
3. Verify CI success for that exact SHA.
4. Verify the same application version/build passed preview acceptance.
5. Review production configuration and secrets.
6. Review pending production migrations, if remote D1 is in scope.
7. Back up production data before risky schema/data changes.
8. Apply only explicitly approved production migrations.
9. Deploy the approved application build to the verified production Worker.
10. Confirm Cloudflare reports a successful deployment.
11. Verify production URL and critical routes.
12. Test the approved critical user journeys.
13. Inspect Worker logs, exceptions and request failures.
14. Record commit SHA, deployment/version ID, migration state and release time.

Production smoke tests should cover the application shell, authentication if enabled, curriculum/lesson flows, practice-session lifecycle, progress persistence, music tools, database operations if enabled, browser errors, Worker exceptions and accessibility.

**Gate E:** Production is considered released only after successful post-deployment verification.

### Phase F — CI/CD hardening (CF-14)

Keep the existing manual preview workflow as the starting point.

Pull request CI:

- Formatting and lint.
- Svelte/TypeScript checks.
- Unit/integration tests.
- Curriculum validation.
- Production build.
- Local D1/migration integrity checks where relevant.
- Worker configuration validation.
- Browser, music-tool and accessibility acceptance.

Preview:

- Manual/approved trigger.
- Exact commit and CI verification.
- Build and configuration dry-run.
- Preview deployment.
- Browser smoke/acceptance tests.
- Deployment record.

Production:

- Explicit release approval through a protected GitHub environment.
- Exact approved commit/build verification.
- Production deployment only after preview gate.
- Post-deployment smoke tests and release record.

Do not make production deployment an automatic side effect of merging an unrelated pull request. Avoid rebuilding a different artifact after preview; promote the exact tested build where the tooling and workflow support it.

### Phase G — Monitoring, rollback and recovery (CF-15)

- Keep Worker observability enabled and verify useful logs are available.
- Monitor request failures, exceptions, latency and asset loading.
- Monitor D1 errors only if remote D1 is introduced.
- Document the previous known-good Worker version and rollback procedure.
- Document database recovery separately from Worker rollback.
- Prefer backward-compatible database migrations.
- Record incidents, root causes and corrective actions.

A Worker rollback does not reverse D1 schema changes or restore deleted data.

### Phase H — Custom domain (CF-16)

Deferred until the Worker deployment is stable.

Potential domain: `guitarlab.is-a.dev`

Verify domain ownership, DNS, Worker routing and TLS/HTTPS. The previous Vercel proxy experiment is not required for the Cloudflare Workers deployment.

## 5. Execution tracker

| ID | Task | Priority | Status |
|---|---|---|---|
| CF-01 | Complete repository deployment and data-flow audit | Critical | Repository code audit complete; settings verification remains pending |
| CF-02 | Verify Cloudflare Workers, routes, bindings and production resource | Critical | Partially verified — one preview Worker found; no D1 DB or production Worker found in inspected account |
| CF-03 | Decide whether remote D1 is required; provision only if approved | Critical | Decision pending |
| CF-04 | Align environment configuration with the selected data architecture | Critical | Pending — default deploy script needs an explicit environment target |
| CF-05 | Verify preview secrets and variables | High | Pending verification |
| CF-06 | Validate preview build and deployment workflow | Critical | Partially complete |
| CF-07 | Complete preview browser and application acceptance | Critical | Pending |
| CF-08 | Verify production Worker and production configuration | Critical | Pending |
| CF-09 | Review production migrations and recovery, if D1 is in scope | Critical | Pending |
| CF-10 | Complete production readiness checks | Critical | Pending |
| CF-11 | Obtain explicit production release approval | Critical | Pending |
| CF-12 | Deploy production Worker | Critical | Not authorized |
| CF-13 | Complete production smoke tests | Critical | Pending |
| CF-14 | Harden CI/CD and implement gated production workflow | High | Pending |
| CF-15 | Document monitoring, rollback and recovery | High | Pending |
| CF-16 | Configure custom domain | Medium | Deferred |

Statuses must be updated only after evidence is collected. “Partially complete” means the infrastructure action occurred but acceptance is not complete.

## 6. Authorization boundaries

| Activity | Authorization |
|---|---|
| Read repository and Cloudflare configuration | Authorized |
| Inspect existing Workers and versions | Authorized |
| Inspect migrations, CI and deployment workflows | Authorized |
| Prepare proposed documentation/configuration changes | Authorized as a planning activity |
| Change live Worker configuration | Requires separate approval |
| Create D1 databases | Requires explicit approval and data-architecture decision |
| Run remote preview migrations | Requires approval |
| Deploy preview | Requires explicit deployment authorization |
| Run production migrations | Explicit approval required |
| Deploy production | Explicit release approval required |
| Configure custom domain/DNS | Separate approval required |

## 7. Definition of done

The deployment project is complete when:

1. Preview and production have verified, independent configuration.
2. The persistence architecture is explicit; if remote D1 is enabled, databases and bindings are isolated.
3. Preview deployment is repeatable and tied to a known commit.
4. Preview application acceptance passes.
5. Production deployment matches the approved and preview-verified release.
6. Production smoke tests pass.
7. Secrets are securely managed.
8. CI/CD release gates work as intended.
9. Application rollback and database recovery procedures are documented.
10. Monitoring and operational procedures are available.
11. Repository documentation matches the actual deployed infrastructure.

## 8. Resume instructions

**Project:** GuitarLab Cloudflare deployment  
**Repository:** `leenusdarnal/guitarlab`  
**Resume at:** CF-01 — complete repository and infrastructure audit.

Start by inspecting the migration inventory, database schema, application database access patterns, local-first persistence, all `DB` binding references, GitHub environment configuration and current production Worker resources.

The preview Worker exists and responds, but this does not establish full application acceptance. The connected Cloudflare account returned zero D1 databases at the time of review. The repository README says preview intentionally has no D1 binding and cloud sync is not enabled. Treat remote D1 as a product/infrastructure decision, not an automatic deployment prerequisite.

**Do not create databases, modify live Cloudflare resources, run remote migrations, deploy preview or deploy production without the applicable explicit approval.**

Execution order: audit → verify resources → decide persistence architecture → prepare environment configuration → validate preview → prepare production → obtain approval → deploy production → monitor.


## 10. CF-01 audit update — 13 November 2026

The repository audit was extended after PR #64 merged. Main branch at the time of this review was `ac82086e9e47bc920b178c6c134dd51eedfba74c`.

### Database and application data-flow

- Drizzle has one committed migration: `drizzle/migrations/0000_overrated_star_brand.sql`, with one journal entry.
- The migration defines 10 tables, 14 triggers, 152 curriculum lesson metadata rows and 34 skill identifiers.
- The schema includes learner profiles, lesson progress/completion, assessment evidence, mastery snapshots and practice sessions. It does not include user identity or authentication/session tables.
- The migration finalizer fingerprints the six authored curriculum JSON files and prevents silently rewriting the seeded curriculum release. It adds immutable curriculum and append-only evidence guards.
- CI successfully generated/finalized the migration, applied it to local-only D1 and ran the local D1 invariant tests.
- `src/lib/server/db/index.ts` exports a request-scoped Drizzle client factory, but the inspected server route loaders do not use it. The only server page loaders found are the public curriculum listing and lesson reader; neither accesses D1. The repository tree contains no `+server.ts` API routes.
- Learner persistence is implemented through IndexedDB adapters and browser-local storage. The README and data-model document explicitly say no learner-facing D1 data route or cloud sync is enabled.
- `src/app.d.ts` declares a `DB: D1Database` platform binding even though the preview configuration intentionally omits it. This is currently a type declaration, not evidence of runtime DB use. Keep it under review and avoid adding D1-dependent code until the environment contract is explicit.

**Conclusion:** Remote D1 provisioning is not a prerequisite for deploying the current local-first application. Do not create preview or production databases unless a separately approved cloud-sync scope requires them.

### Deployment command safety

- `package.json` currently defines `deploy: wrangler deploy`.
- The default `wrangler.jsonc` names the Worker `guitarlab` and includes the all-zero local D1 placeholder ID.
- Running the generic `npm run deploy` with Cloudflare credentials could target the production-named Worker using the default configuration. This command was not run.
- Before any deployment is authorized, replace ambiguous deployment commands with explicit environment-specific commands/configuration, and make accidental production deployment difficult or impossible.
- The existing preview GitHub Actions workflow is safer: manual dispatch with an explicit boolean confirmation, main-tip SHA verification, exact-SHA CI checks, the `preview` GitHub environment, configuration dry-run and preview deployment.
- The preview workflow rebuilds the selected commit; it does not promote the CI artifact. The CI workflow uploads a one-day artifact containing the Worker build and `wrangler.jsonc`, while the preview deployment workflow rebuilds using `wrangler.preview.jsonc`. Decide whether to promote a single tested artifact or retain a reproducible exact-SHA rebuild and document that choice.
- The post-deploy preview smoke test checks that HTML contains `GuitarLab`; it does not execute the deployed app's full browser acceptance suite.

### GitHub controls and CI

- An active repository ruleset named **Protect main branch** targets `refs/heads/main`.
- It blocks branch deletion and non-fast-forward updates, requires pull requests, and requires the `Validate application and curriculum` status check with strict up-to-date checks.
- The ruleset currently does not require the separate `Check Node.js 26 compatibility` status for merging. The preview workflow independently requires both named checks before deploying.
- PR #64 merged successfully. The subsequent main CI run completed successfully: application/curriculum validation and Node.js 26 compatibility both passed, including local D1 migration/invariant checks, build, local Worker smoke test, browser acceptance, music-tool browser acceptance, accessibility and curriculum browser acceptance.
- The linked GitHub integration could not read the repository's branch-protection endpoint directly, but the repository ruleset endpoint was readable and confirmed the active ruleset.
- The existence and values of GitHub environment secrets/variables were not independently verified through the available read-only repository API. Secret values must never be exposed in documentation or logs. Verify the `preview` environment and its secret/variable configuration before attempting a preview deployment.

### Remaining verification and next work

1. Verify GitHub `preview` environment configuration and secret/variable presence without exposing values.
2. Reconfirm Cloudflare Worker/version/route inventory before any deployment action.
3. Decide whether this release remains local-first (recommended based on current implementation) or introduces authenticated cloud sync as a separate milestone.
4. Make deployment scripts and Wrangler configuration environment-explicit.
5. Run full acceptance against the deployed preview, not only the local Worker.
6. Keep production deployment and remote migrations blocked until separately approved.

CF-01 repository code audit is complete. CF-02 and CF-05 still require environment/resource verification. No live Cloudflare resources, databases, secrets, migrations or deployments were changed during this audit.
