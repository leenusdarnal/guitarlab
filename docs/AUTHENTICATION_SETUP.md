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

The SvelteKit 3 hook reads Cloudflare bindings from the `cloudflare:workers` module (`env` and `waitUntil`); do not use the removed SvelteKit `event.platform` binding API. It uses Better Auth's SvelteKit handler, reads the server session into request locals, and retains the application's existing response security headers. The global navigation switches between Sign in and Account from the server-validated session; the account page provides sign-out. A guest request to the account page redirects to Sign in. Better Auth's origin/CSRF protections remain enabled. Session cookies are HttpOnly, Secure on HTTPS, SameSite=Lax and path-scoped. Rate limits are persisted in the auth D1 database and use Cloudflare's `cf-connecting-ip` header.

## Deployment gates

Preview and production Wrangler configs intentionally have no `AUTH_DB` binding yet. Do not add one or deploy auth until each environment has its own D1 database, its migrations have been rehearsed against that database, the Better Auth secret and Resend credentials have been stored as environment secrets, and the exact origin/sender have been verified. No production database or secret is provisioned by this change.

Cloud sync remains out of scope. Do not attach, upload or backfill IndexedDB learner profiles or practice history during account creation. The separate sync milestone must cover export, deletion, ownership, idempotency and conflict recovery before learner data is stored in cloud D1.

## Automated account lifecycle acceptance

CI runs `npm run test:auth-browser` against the local Wrangler Worker and the isolated local `AUTH_DB`. The script creates a temporary `.dev.vars` file with a fresh random Better Auth secret, a local-only sender identity and a loopback mail sink; it restores any previous `.dev.vars` file and stops both local servers during cleanup.

`AUTH_TEST_MAIL_SINK_URL` is an optional test-only override. It is accepted only when `BETTER_AUTH_URL` is a loopback development origin and the sink itself is an HTTP loopback URL (`localhost`, `127.0.0.1` or `[::1]`). The sink receives verification/reset messages only inside the local acceptance run; it does not receive a Resend bearer token. A non-local auth origin with this override fails the auth configuration gate. Never set this variable in preview or production.

Password-reset messages link directly to the frontend reset route with Better Auth's one-time token; the client submits that token to Better Auth's reset endpoint. The browser journey covers duplicate registration, pending verification, unverified sign-in rejection, verification resend and completion, sign-in, account access, password reset, used-token replay rejection, session revocation after password reset, logout and guest-safe protected-route redirects. It also checks the local session cookie's HttpOnly, SameSite and Path attributes. HTTPS Secure-cookie verification, session refresh/expiry, CSRF/origin and rate-limit acceptance remain separate security checks; a passing local HTTP journey is not production activation evidence.

