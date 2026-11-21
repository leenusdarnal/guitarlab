# Cloudflare deployment and environment reference

**Document role:** Environment and workflow reference only. This file is not a deployment task tracker.

## Environment boundaries

- **Local:** `wrangler.jsonc` uses local development bindings. Local D1 commands must never target remote databases.
- **Production:** `wrangler.production.jsonc` targets the production Worker and its dedicated Better Auth D1 database.
- The production `AUTH_DB` binding is for Better Auth identity, session and rate-limit records; it is not an enabled cloud learner-data store.
- Learner profiles, progress and practice data remain in browser-local IndexedDB. Do not upload or backfill learner records as part of account provisioning.

## Workflow authority

Use the checked-in GitHub Actions workflows as the executable deployment and migration contract:

- `.github/workflows/deploy-production.yml` — manually triggered, protected production Worker deployment.
- `.github/workflows/migrate-auth-d1.yml` — explicit, guarded auth D1 migration and verification.

The workflows enforce an exact `main` SHA and required CI checks before a deployment or migration. Do not deploy through an ad-hoc Wrangler command, use the default local config for a remote target, or run remote migrations to bypass workflow preflights. A successful read-only connector query does not prove that the GitHub Actions environment token is valid.

## Approval and safety boundaries

A documentation change does not authorize a Worker deployment, secret mutation, remote migration, custom-domain change or learner-data upload. Production credentials must remain protected. Never commit secrets or expose them in chat, pull requests, logs or documentation.

## Current-state authorities

- [Production Environment Decision](PRODUCTION_ENVIRONMENT_DECISION.md) records the production release and deployment decision.
- [Authentication Setup](AUTHENTICATION_SETUP.md) owns the production auth database identifier, Better Auth origins, credential requirements and OAuth callback URLs.
- [Engineering Quality & Release Tracker](ENGINEERING_QUALITY_TRACKER.md) owns current SEC-02, QA-04 and all other engineering/release gate status.

Historical environment observations are retained only where needed as dated evidence. They do not describe current deployment targets.
