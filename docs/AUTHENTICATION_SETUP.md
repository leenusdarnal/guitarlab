# Optional account authentication setup

Account creation is optional. The guest application continues to use the existing browser-local learner profile and storage. Authentication does not copy local learner data to D1. The first account release supports email/password plus opt-in Google and GitHub OAuth. Each method is independently enabled only when its required environment credentials are complete; configuring OAuth does not require a transactional email provider, while email/password verification and password reset do.

## Local setup

The local Wrangler configuration contains a separate `AUTH_DB` binding named `guitarlab-auth-local`. It is independent of the learner-domain `DB` binding.

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Generate a secret with `openssl rand -base64 32` and set it as `BETTER_AUTH_SECRET`.
3. Set `BETTER_AUTH_URL=http://localhost:8787` when using the local Wrangler Worker.
4. For email/password registration, configure a real Resend API key and a sender address verified by that Resend account. For passwordless social sign-in, configure Google and/or GitHub OAuth credentials instead.
5. Apply the isolated identity schema with `npm run db:auth:migrate:local`, then verify its tables with `npm run db:auth:test:local`.
6. Build and run the Worker with `npm run build` followed by `npm run preview`.

Do not commit `.dev.vars`. The example file contains placeholders only. The application deliberately disables account endpoints when the database, 32-character-or-longer secret, explicit base URL, or at least one complete sign-in method is missing.

## Runtime configuration

The auth Worker needs these bindings/secrets:

| Name | Purpose |
| --- | --- |
| `AUTH_DB` | Dedicated D1 database for users, accounts, sessions, verification tokens and persistent rate limits |
| `BETTER_AUTH_SECRET` | High-entropy Better Auth secret (at least 32 characters) |
| `BETTER_AUTH_URL` | Exact public origin for this deployment, with no path |
| `RESEND_API_KEY` | Transactional email API key used for verification and password reset |
| `AUTH_FROM_EMAIL` | Sender identity verified by the email provider (only needed for email/password, verification and password reset) | 
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth application credentials | 
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth application credentials |

The SvelteKit 3 hook reads Cloudflare bindings from the `cloudflare:workers` module (`env` and `waitUntil`); do not use the removed SvelteKit `event.platform` binding API. It uses Better Auth's SvelteKit handler, reads the server session into request locals, and retains the application's existing response security headers. The global navigation switches between Sign in and Account from the server-validated session; the account page provides sign-out. A guest request to the account page redirects to Sign in. Better Auth's origin/CSRF protections remain enabled. Session cookies are HttpOnly, Secure on HTTPS, SameSite=Lax and path-scoped. Rate limits are persisted in the auth D1 database and use Cloudflare's `cf-connecting-ip` header.

## Remote environment provisioning

The two remote authentication databases have been created in the Cloudflare account and are intentionally empty until the migration workflow is run. They are independent of the learner-domain database and of each other.

| Environment | Worker | Exact Better Auth origin | Dedicated D1 database | Database ID |
| --- | --- | --- | --- | --- |
| Preview | `guitarlab-preview` | `https://guitarlab-preview.leenusdarnal.workers.dev` | `guitarlab-auth-preview` | `2abf9a07-620a-4c24-8d12-f75b34b31d21` |
| Production | `guitarlab` | `https://guitarlab.leenusdarnal.workers.dev` | `guitarlab-auth-production` | `0b81ddcc-7612-4842-9878-051e26be6962` |

The matching `AUTH_DB` bindings and exact `BETTER_AUTH_URL` values are staged in `wrangler.preview.jsonc` and `wrangler.production.jsonc`. Both use `drizzle/auth-migrations`. The two deployment workflows are configured to apply pending auth migrations to their own database before deploying the corresponding Worker. A separate **Migrate GuitarLab auth D1** workflow can apply and verify the schema without deploying Worker code. The remote database resources and their Wrangler bindings exist; they remain uninitialized until the guarded migration workflow succeeds.

### Remaining credentials and activation gates

The live Worker inspection on 20 November 2026 found no `BETTER_AUTH_SECRET` or `RESEND_API_KEY` secret bindings on either Worker. The preview migration workflow also previously failed at its token/D1 access preflight (Cloudflare error 7403); it applied no SQL. PR #209 added explicit token-status and selected-database read-only access checks. Cloudflare connector access to both D1 databases was independently verified with read-only `SELECT 1` queries, but that does not validate the separate GitHub Actions environment token. Current SEC-02 state and the exact safe retry gate are owned by [the Engineering Quality & Release Tracker](ENGINEERING_QUALITY_TRACKER.md). Do not add credentials to source control, PR comments, chat, workflow logs or Wrangler config files.

Before enabling remote account endpoints, configure each Worker independently in Cloudflare Dashboard → Workers & Pages → select the Worker → Settings → Variables and Secrets:

1. Add a unique `BETTER_AUTH_SECRET` secret for that environment, generated with a cryptographically secure random generator (at least 32 characters; `openssl rand -base64 48` is suitable).
2. Add `RESEND_API_KEY` as a secret, using a sending-only key where the provider supports scoped keys.
3. Set `AUTH_FROM_EMAIL` as a non-secret variable to a sender identity that is verified in the corresponding Resend account.
4. Keep the `BETTER_AUTH_URL` and `AUTH_DB` values from the checked-in Wrangler config; do not substitute the other environment's URL or database.

Secret additions through `wrangler secret put` create and deploy a new Worker version immediately. Apply them only to the intended Worker and only after the matching D1 binding has been deployed. Never reuse the preview Better Auth secret in production. The app remains fail-closed while the database, secret or origin is absent, or when no usable sign-in method is configured. Google and GitHub OAuth can operate without an email delivery provider. Email/password registration, verification and password reset remain disabled unless both `RESEND_API_KEY` and `AUTH_FROM_EMAIL` are configured.

Recommended rollout: first configure an active preview GitHub Actions token with the required account scope and D1 Write permission, then require the guarded preflight and exact-SHA CI to pass before applying preview migrations. Configure preview credentials and a verified sender only for the sign-in methods being enabled; deploy preview and complete provider-backed smoke tests. Repeat independently for production with production credentials and explicit deployment approval. Do not copy preview data or secrets into production. This setup does not enable cloud learner-data sync.

Cloud sync remains out of scope. Do not attach, upload or backfill IndexedDB learner profiles or practice history during account creation. The separate sync milestone must cover export, deletion, ownership, idempotency and conflict recovery before learner data is stored in cloud D1.

## Automated account lifecycle and security acceptance

CI runs `npm run test:auth-browser` against the local Wrangler Worker and isolated local `AUTH_DB`. The script creates a temporary `.dev.vars` file with a fresh random Better Auth secret, a local-only sender identity and a loopback mail sink. It also creates a temporary Wrangler JSONC config that opts the local Worker into HTTPS. The script restores any previous `.dev.vars` file, removes its generated Wrangler config and stops the local servers during cleanup.

`AUTH_TEST_MAIL_SINK_URL` is accepted only when `BETTER_AUTH_URL` is a loopback development origin and the sink itself is an HTTP loopback URL (`localhost`, `127.0.0.1` or `[::1]`). The sink receives verification/reset messages only inside the local acceptance run; it does not receive a Resend bearer token. A non-local auth origin with this override fails the auth configuration gate. Never set this variable in preview or production.

The browser acceptance test also sets three timing overrides: `AUTH_TEST_SESSION_EXPIRES_IN_SECONDS`, `AUTH_TEST_SESSION_UPDATE_AGE_SECONDS` and `AUTH_TEST_RESET_TOKEN_EXPIRES_IN_SECONDS`. They are accepted only alongside the loopback mail sink on a loopback auth origin, must be positive integers no greater than 60 seconds, and must have an update age shorter than the session lifetime. They exist only to make refresh, expiry and expired-token behaviour testable in CI. The default runtime remains a 30-day session, a 1-day refresh age and a 1-hour reset token. These settings must never be added to preview or production.

Password-reset messages link directly to the frontend reset route with Better Auth's one-time token; the client submits that token to Better Auth's reset endpoint. The local HTTPS journey covers duplicate registration and generic responses, pending verification, unverified sign-in rejection, verification resend/completion, successful sign-in, protected account access, HttpOnly/Secure/SameSite/Path cookie attributes, expired and replayed reset tokens, password-reset session revocation, session refresh and eventual expiry, logout, guest-safe redirects, untrusted-Origin rejection without a session cookie, sign-in HTTP 429 rate limiting, and axe checks for sign-in/account/reset states. Worker output is checked for the synthetic emails, credentials, session cookies and one-time tokens used by the run. These local tests do not enable remote account access. The preview and production D1 resources, bindings and exact HTTPS origins are provisioned in configuration, but the remote schemas must pass the guarded migration workflow and each Worker still needs its own Better Auth secret plus complete credentials for at least one enabled sign-in method. Email/password additionally requires a Resend key and verified sender; Google/GitHub OAuth does not. Keep endpoints fail-closed until SEC-02 and the relevant deployed-environment checks are verified. A passing local HTTPS journey is not production environment or physical-device sign-off.


## Social OAuth setup (no email delivery provider required)

Google and GitHub sign-in are optional Better Auth social providers. Configure the provider credentials as Worker secrets on the intended environment; never commit them or paste them into chat, issues, pull requests or logs.

| Provider | Environment variables | Preview callback |
| --- | --- | --- |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `https://guitarlab-preview.leenusdarnal.workers.dev/api/auth/callback/google` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `https://guitarlab-preview.leenusdarnal.workers.dev/api/auth/callback/github` |

For each OAuth application, register the preview callback above. Register the matching production callback separately using `https://guitarlab.leenusdarnal.workers.dev/api/auth/callback/google` or `/api/auth/callback/github`. Keep preview and production OAuth applications/credentials separate where practical. Google JavaScript origins should contain only the preview or production Worker origin (without a path). GitHub OAuth Apps accept one callback URL, so use separate preview and production OAuth Apps.

Add the four provider values as Cloudflare Worker secrets only for providers you have configured. Social sign-in does not require `RESEND_API_KEY` or `AUTH_FROM_EMAIL`; those remain necessary only if email/password registration and transactional messages are enabled. The login page retains guest access.
