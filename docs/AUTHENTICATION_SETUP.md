# Optional account authentication setup

Account creation is optional. The guest application continues to use the existing browser-local learner profile and storage. Authentication does not copy local learner data to D1.

## Local setup

The local Wrangler configuration contains a separate `AUTH_DB` binding named `guitarlab-auth-local`. It is independent of the learner-domain `DB` binding.

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Generate a secret with `openssl rand -base64 32` and set it as `BETTER_AUTH_SECRET`.
3. Set `BETTER_AUTH_URL=http://localhost:8787` when using the local Wrangler Worker.
4. Configure a real Resend API key and a sender address verified by that Resend account.
5. Apply the isolated identity schema with `npm run db:auth:migrate:local`, then verify its tables with `npm run db:auth:test:local`.
6. Build and run the Worker with `npm run build` followed by `npm run preview`.

Do not commit `.dev.vars`. The example file contains placeholders only. The application deliberately disables account endpoints when the database, 32-character-or-longer secret, explicit base URL, or email sender configuration is missing.

## Runtime configuration

The auth Worker needs these bindings/secrets:

| Name | Purpose |
| --- | --- |
| `AUTH_DB` | Dedicated D1 database for users, accounts, sessions, verification tokens and persistent rate limits |
| `BETTER_AUTH_SECRET` | High-entropy Better Auth secret (at least 32 characters) |
| `BETTER_AUTH_URL` | Exact public origin for this deployment, with no path |
| `RESEND_API_KEY` | Transactional email API key used for verification and password reset |
| `AUTH_FROM_EMAIL` | Sender identity verified by the email provider |

The SvelteKit hook uses Better Auth's SvelteKit handler, reads the server session into request locals, and retains the application's existing response security headers. Better Auth's origin/CSRF protections remain enabled. Session cookies are HttpOnly, Secure on HTTPS, SameSite=Lax and path-scoped. Rate limits are persisted in the auth D1 database and use Cloudflare's `cf-connecting-ip` header.

## Deployment gates

Preview and production Wrangler configs intentionally have no `AUTH_DB` binding yet. Do not add one or deploy auth until each environment has its own D1 database, its migrations have been rehearsed against that database, the Better Auth secret and Resend credentials have been stored as environment secrets, and the exact origin/sender have been verified. No production database or secret is provisioned by this change.

Cloud sync remains out of scope. Do not attach, upload or backfill IndexedDB learner profiles or practice history during account creation. The separate sync milestone must cover export, deletion, ownership, idempotency and conflict recovery before learner data is stored in cloud D1.
