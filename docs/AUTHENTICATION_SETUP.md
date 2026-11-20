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

## Automated account lifecycle and security acceptance

CI runs `npm run test:auth-browser` against the local Wrangler Worker and isolated local `AUTH_DB`. The script creates a temporary `.dev.vars` file with a fresh random Better Auth secret, a local-only sender identity and a loopback mail sink. It also creates a temporary Wrangler JSONC config that opts the local Worker into HTTPS. The script restores any previous `.dev.vars` file, removes its generated Wrangler config and stops the local servers during cleanup.

`AUTH_TEST_MAIL_SINK_URL` is accepted only when `BETTER_AUTH_URL` is a loopback development origin and the sink itself is an HTTP loopback URL (`localhost`, `127.0.0.1` or `[::1]`). The sink receives verification/reset messages only inside the local acceptance run; it does not receive a Resend bearer token. A non-local auth origin with this override fails the auth configuration gate. Never set this variable in preview or production.

The browser acceptance test also sets three timing overrides: `AUTH_TEST_SESSION_EXPIRES_IN_SECONDS`, `AUTH_TEST_SESSION_UPDATE_AGE_SECONDS` and `AUTH_TEST_RESET_TOKEN_EXPIRES_IN_SECONDS`. They are accepted only alongside the loopback mail sink on a loopback auth origin, must be positive integers no greater than 60 seconds, and must have an update age shorter than the session lifetime. They exist only to make refresh, expiry and expired-token behaviour testable in CI. The default runtime remains a 30-day session, a 1-day refresh age and a 1-hour reset token. These settings must never be added to preview or production.

Password-reset messages link directly to the frontend reset route with Better Auth's one-time token; the client submits that token to Better Auth's reset endpoint. The local HTTPS journey covers duplicate registration and generic responses, pending verification, unverified sign-in rejection, verification resend/completion, successful sign-in, protected account access, HttpOnly/Secure/SameSite/Path cookie attributes, expired and replayed reset tokens, password-reset session revocation, session refresh and eventual expiry, logout, guest-safe redirects, untrusted-Origin rejection without a session cookie, sign-in HTTP 429 rate limiting, and axe checks for sign-in/account/reset states. Worker output is checked for the synthetic emails, credentials, session cookies and one-time tokens used by the run. None of this enables remote account access: preview/production still require separately provisioned D1 databases, migrations, secrets, exact HTTPS origins and verified sender credentials. A passing local HTTPS journey is not production environment or physical-device sign-off.

