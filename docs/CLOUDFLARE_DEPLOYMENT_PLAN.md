# Cloudflare deployment and environment reference

**Document role:** Environment and workflow reference only. This file is not a deployment task tracker.

## Environment boundaries

- **Local:** `wrangler.jsonc` uses local development bindings. Local D1 commands must never target remote databases.
- **Preview:** `wrangler.preview.jsonc` targets the preview Worker and its dedicated Better Auth D1 database.
- **Production:** `wrangler.production.jsonc` targets the production Worker and its separate Better Auth D1 database.
- Preview and production identity databases are isolated from each other and from the local learner profile. The `AUTH_DB` binding is for Better Auth identity, session and rate-limit records; it is not an enabled cloud learner-data store.
- Learner profiles, progress and practice data remain in browser-local IndexedDB. Do not upload or backfill learner records as part of account provisioning.

## Workflow authority

Use the checked-in GitHub Actions workflows as the executable deployment and migration contract:

- `.github/workflows/deploy-preview.yml` — manually triggered preview Worker deployment.
- `.github/workflows/deploy-production.yml` — manually triggered, protected production deployment.
- `.github/workflows/migrate-auth-d1.yml` — explicit, guarded auth D1 migration and verification.

The workflows enforce an exact `main` SHA and required CI checks before a deployment or migration. Do not deploy through an ad-hoc Wrangler command, use the default local config for a remote target, or run remote migrations to bypass workflow preflights. A successful read-only connector query does not prove that the GitHub Actions environment token is valid.

## Approval and safety boundaries

A documentation change does not authorize a Worker deployment, secret mutation, remote migration, custom-domain change or learner-data upload. Keep preview and production credentials distinct. Never commit secrets or expose them in chat, pull requests, logs or documentation.

## Current-state authorities

- [Production Environment Decision](PRODUCTION_ENVIRONMENT_DECISION.md) records the first local-first production release and exact deployed SHA.
- [Authentication Setup](AUTHENTICATION_SETUP.md) owns the auth database identifiers, Better Auth origins, credential requirements and OAuth callback URLs.
- [Engineering Quality & Release Tracker](ENGINEERING_QUALITY_TRACKER.md) owns current SEC-02, QA-04 and all other engineering/release gate status.

The old phase checklists and infrastructure inventories in the previous version of this document were dated planning snapshots. They are not current state and are retained in Git history rather than as a second tracker.
