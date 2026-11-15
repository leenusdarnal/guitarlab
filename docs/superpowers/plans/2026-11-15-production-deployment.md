# First Production Deployment Implementation Plan

> **For agentic workers:** Native execution in this session. Steps use checkbox syntax for tracking.

**Goal:** Deploy the existing local-first GuitarLab application to a separate production Cloudflare Worker with exact-commit CI gates and post-deploy smoke verification.

**Architecture:** Keep the first release local-first. Use a standalone `wrangler.production.jsonc` with Workers Static Assets and no D1 binding; deploy only through a manual GitHub Actions workflow against the latest `main` SHA. The workflow checks both required CI lanes, deploys the exact verified commit and tests public routes and response-security headers.

**Tech Stack:** SvelteKit, Cloudflare Workers, Wrangler 4, GitHub Actions, Node.js 22.23.5 and Node.js 26.13.1 compatibility lane.

**Spec:** `docs/CLOUDFLARE_DEPLOYMENT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`.

## Global Constraints

- Production is a local-first app release; do not bind D1 or create remote learner-data routes.
- Never commit or echo Cloudflare credentials.
- Deployment is manual-only, `main`-only and requires the latest exact-SHA application/curriculum and Node.js 26 checks to pass.
- Preview configuration and worker remain isolated and unchanged.
- Login, account ownership and cloud sync remain separate M5 work; do not represent them as implemented.
- Do not create domains, DNS records, databases or remote migrations as part of this deployment slice.

## Review Focus

- A dispatch from a branch other than `main` must not deploy.
- A stale selected SHA must stop before deploy.
- Missing Cloudflare secret or invalid account ID must stop before deploy.
- A preview or local placeholder D1 binding must never enter production configuration.
- A failed route or missing/unsafe response header must fail the post-deploy smoke test.

---

### Task 1: Add isolated production Worker configuration

**Files:** `wrangler.production.jsonc`, `package.json`, `.github/workflows/ci.yml`.

- [ ] Add a config for Worker `guitarlab`, entry point `.svelte-kit/cloudflare/_worker.js`, Workers Static Assets binding `ASSETS`, `workers_dev: true`, and no D1/routes.
- [ ] Add `deploy:production:dry-run` and `deploy:production` scripts.
- [ ] Add a CI dry-run step for the production config.

### Task 2: Add a manual production release workflow

**Files:** `.github/workflows/deploy-production.yml`.

- [ ] Restrict to dispatches on `main` with explicit `deploy_production=true`.
- [ ] Check both latest exact-SHA CI check names.
- [ ] Build, dry-run and deploy the same selected commit.
- [ ] Smoke-test `/`, `/learn`, `/practice`, `/tools/tuner` and `/settings/data`.
- [ ] Verify CSP, HSTS, MIME, frame and referrer headers; reject unsafe script-src allowances.
- [ ] Configure the GitHub production environment with required credentials and main-only deployment policy before first live run. Use Workers Admin only for the first Worker creation, then rotate to a Worker Editor token scoped to `guitarlab`.

### Task 3: Reconcile release priority and launch boundary

**Files:** `docs/EXECUTION_PRIORITY.md`, `docs/IMPLEMENTATION_TRACKER.md`, `docs/CLOUDFLARE_DEPLOYMENT_PLAN.md`, `docs/SECURITY_RESPONSE_POLICY.md`, `docs/ROADMAP.md`, `README.md`.

- [ ] Record production deployment as P0/top priority.
- [ ] Record Cloudflare resource inventory and temporary workers.dev hostname.
- [ ] State clearly that login/cloud sync remain unimplemented and are not enabled in the first release.
- [ ] Record the exact live deployment, version, timestamp and smoke result only after workflow success.
