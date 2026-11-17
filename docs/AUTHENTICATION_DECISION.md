# GuitarLab authentication decision

**Status:** Accepted implementation direction for M5; runtime integration remains pending  
**Date:** 2026-11-17  
**Tracking:** [Issue #176](https://github.com/leenusdarnal/guitarlab/issues/176)

## Decision

Use **Better Auth** as the authentication/session framework for the Cloudflare Workers application, backed by the existing Drizzle/D1 server boundary. The first account release uses email and password only. Social providers and learner-data sync are separate follow-up work.

Better Auth is preferred over a hand-rolled password/session implementation because it supplies established account, credential, session, verification and reset flows, while allowing GuitarLab to keep authorization and learner-data ownership in its own server use cases.

References:
- [Better Auth email/password and verification](https://better-auth.com/docs/authentication/email-password)
- [Better Auth Cloudflare guide](https://better-auth.com/docs/guides/cloudflare)
- [Better Auth configuration reference](https://better-auth.com/docs/reference/options)

Before adding runtime dependencies, confirm the latest stable release, SvelteKit integration API, Cloudflare Workers compatibility and D1 adapter against the installed SvelteKit/Drizzle versions. Pin compatible versions and commit the generated lockfile; do not use beta APIs in production.

## Product behaviour

- Guest/local-only use remains the default. A learner can use lessons, practice, tools, IndexedDB, offline mode and JSON backup without registering.
- Registration is optional and does not silently upload or attach the existing local profile to an account.
- The first authenticated release provides registration, verified-email login, session refresh, logout and password reset.
- Do not issue a usable authenticated session until the email address is verified.
- No social login in the first slice.
- Cloud sync is not part of the login release. It remains disabled until the separate outbox, idempotency, conflict, ownership and account-deletion requirements are implemented.

## Security requirements

- Use opaque, high-entropy sessions managed by Better Auth; cookies must be HttpOnly, Secure on HTTPS, SameSite=Lax or stricter, path-scoped and have bounded lifetimes.
- Validate request origins and use framework/library CSRF protections for state-changing requests. Do not invent a parallel cookie/session parser.
- Apply rate limits to registration, sign-in, verification resend and password-reset endpoints. Authentication responses must not disclose whether an email address is registered.
- Require strong password policy and use the framework's maintained password hashing implementation. Never implement custom password hashing.
- Never log passwords, session identifiers, cookies, verification/reset tokens, learner notes or recordings.
- Resolve the current account from the validated server-side session. Every future user-owned D1 query must scope by that account identity; a client-supplied user ID is never authorization.
- Keep authentication endpoints same-origin. Do not broaden CSP or CORS to make auth work.
- Provide export and account/data deletion before cloud learner-data sync is enabled.

## Infrastructure and secrets

- Add a dedicated D1 database for each local, preview and production environment. Never point preview/local at production.
- Do not bind D1 to the existing production Worker until a separate migration and release approval is made.
- Store the Better Auth secret and transactional email credentials in Wrangler/GitHub secret stores. No secret values belong in Git, browser bundles, CI logs or issue comments.
- Email verification and password-reset messages require a real transactional email provider. The feature must remain clearly unavailable rather than pretending to send email when provider configuration is missing.
- Use local-only test mail capture for automated tests; never expose verification/reset tokens in production responses or logs.

## Data and migration boundaries

- Add only the identity/session/verification tables required by Better Auth and the application. Keep namespaced auth tables separate from existing learner-domain tables.
- Do not copy IndexedDB learner profiles or practice history into D1 during account creation.
- Account deletion must revoke sessions and delete identity records; any future cloud learner-data deletion must be covered by the later sync/data-retention design.
- Test migrations against a fresh local D1 and a disposable preview database before production.

## Delivery slices

1. **Auth foundation (Issue #176):** dependency/API compatibility proof, schema and migration, server auth handler, environment configuration and secure session resolution.
2. **Account UX:** sign-up, sign-in, verification pending/resend, reset password, logout and account settings, with a visible guest path.
3. **Security and acceptance:** rate-limit/CSRF/origin tests, enumeration resistance, session expiry/revocation, browser journeys, export/deletion.
4. **Separate M5 sync:** only after auth and deletion gates pass; outbox/idempotency/conflict and per-account ownership are a distinct milestone.

## Non-goals

- Mandatory account creation.
- Cloud sync in the authentication PR.
- Social sign-in.
- Server-side audio or recording uploads.
- Importing or inferring learner history from previous chats, devices or external tools.
