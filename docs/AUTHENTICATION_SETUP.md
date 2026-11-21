# Authentication setup

GuitarLab account authentication is optional. Guests continue to use the browser-local learner profile and storage. Authentication does not copy local learner data to D1.

The supported account sign-in methods are Google OAuth and GitHub OAuth. Email/password registration, email verification and password reset are not part of the supported setup. No transactional email service is used.

## Local setup

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Generate a secret with `openssl rand -base64 32` and set it as `BETTER_AUTH_SECRET`.
3. Set `BETTER_AUTH_URL=http://localhost:8787` when using the local Wrangler Worker.
4. Set up Google and/or GitHub OAuth credentials as described below.
5. Apply the isolated local identity schema with `npm run db:auth:migrate:local`, then verify its tables with `npm run db:auth:test:local`.
6. Build and run the Worker with `npm run build` followed by `npm run dev`.

Do not commit `.dev.vars`. The example file contains placeholders only. Authentication remains unavailable unless its database, secret, explicit base URL and at least one complete OAuth provider are configured.

## Production configuration

The production Worker is `guitarlab`, hosted at `https://guitarlab.leenusdarnal.workers.dev`. Its dedicated D1 database is `guitarlab-auth-production` (ID `0b81ddcc-7612-4842-9878-051e26be6962`), bound as `AUTH_DB`. The production origin is set as `BETTER_AUTH_URL` in `wrangler.production.jsonc`; the auth schema uses `drizzle/auth-migrations`.

Configure these Worker bindings/secrets in Cloudflare Dashboard → Workers & Pages → `guitarlab` → Settings → Variables and Secrets:

| Name | Type | Purpose |
| --- | --- | --- |
| `AUTH_DB` | D1 binding | Dedicated auth database |
| `BETTER_AUTH_SECRET` | Secret | High-entropy Better Auth secret, at least 32 characters |
| `BETTER_AUTH_URL` | Variable | Exact public origin, no path |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Secrets | Optional Google OAuth credentials |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Secrets | Optional GitHub OAuth credentials |

Generate the production secret with a cryptographically secure random generator (for example, `openssl rand -base64 48`). Never reuse it in local development or commit credentials to source control, PRs, chat, logs or Wrangler configuration. Adding a Worker secret can create and deploy a new Worker version; do so only on the intended production Worker.

## OAuth callback setup

Configure only the OAuth providers you intend to enable. Register these exact callback URLs in the corresponding provider application:

| Provider | Callback URL |
| --- | --- |
| Google | `https://guitarlab.leenusdarnal.workers.dev/api/auth/callback/google` |
| GitHub | `https://guitarlab.leenusdarnal.workers.dev/api/auth/callback/github` |

For Google, set the authorized JavaScript origin to `https://guitarlab.leenusdarnal.workers.dev` (no path). GitHub OAuth Apps support one callback URL; use the production callback above.

Add each configured provider's client ID and secret as Cloudflare Worker secrets. Never paste credential values into chat or repository files. OAuth sign-in does not require an email delivery provider.

## Migration and verification

The production auth migration workflow is manually dispatched from `main`, requires explicit confirmation, checks CI for the selected commit, verifies Cloudflare token status and D1 access, applies pending migrations, and checks the resulting tables. Review the pending migration list and confirm the target is production before authorizing the workflow. Do not run migrations or deploy solely because credentials were added.

After the schema and Worker configuration are verified, test Google and GitHub sign-in using the production callback URLs. Keep account endpoints fail-closed until the required database, secret, origin and at least one complete OAuth provider are configured.

## Security and data boundaries

The auth database is separate from the learner-domain database. Account creation does not copy, attach, upload or backfill IndexedDB learner profiles or practice history. Cloud learner-data sync remains out of scope until export, deletion, ownership, idempotency and conflict recovery are designed and accepted.

The application retains Better Auth origin/CSRF protections, secure session-cookie settings on HTTPS, database-backed rate limits and server-validated sessions. A passing local test does not establish production or physical-device acceptance; record deployed-environment evidence in the Engineering Quality & Release Tracker.
