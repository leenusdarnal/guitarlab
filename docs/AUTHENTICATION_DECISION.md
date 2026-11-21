# GuitarLab authentication and account decision

**Status:** Accepted — OAuth-only account access. Live implementation and release acceptance are tracked in the [Engineering Quality & Release Tracker](ENGINEERING_QUALITY_TRACKER.md), Section 6.  
**Last revised:** 21 November 2026  
**Architecture tracking:** [Issue #176](https://github.com/leenusdarnal/guitarlab/issues/176)  
**Account and learner profile experience:** [Issue #218](https://github.com/leenusdarnal/guitarlab/issues/218)

## Authority and scope

This document records the accepted authentication, account-profile and learner-data boundaries. It is an architecture decision, not a duplicate task checklist. Current implementation state and release evidence belong in the Engineering Quality & Release Tracker. Environment identifiers, callback URLs, migration instructions and secret setup belong in [Authentication Setup](AUTHENTICATION_SETUP.md).

## Decision

Use **Better Auth** for authenticated sessions in the SvelteKit application on Cloudflare Workers, backed by the dedicated authentication D1 database.

The only supported account sign-in methods are:

- Google OAuth.
- GitHub OAuth.

Both providers are independently optional in an environment. A provider is available only when its complete client ID and client secret pair is configured. Guest use remains available when authentication is unavailable or a learner chooses not to sign in.

**Email/password sign-up and sign-in, password reset, email verification flows, and transactional email are not supported.** Do not add these flows without a new explicit product and security decision. The authentication setup and product UI must remain OAuth-only.

## Account profile and learner profile are different data

### Account profile

The account profile is identity information managed by Better Auth in the authentication database:

- Display name: editable by the signed-in account holder.
- Profile image: optional URL hosted by an approved Google or GitHub avatar domain; arbitrary external image hosts are blocked by CSP. GuitarLab does not provide image hosting or upload.
- Email address: supplied and managed by the OAuth identity provider; it is read-only in GuitarLab.
- Session: resolved from the validated server-side Better Auth session. Account screens may show the current session expiry and provide sign-out.

Account profile updates must use Better Auth's authenticated current-user update API. Do not accept a client-supplied user ID as the target identity, create a parallel account table, or write directly to auth tables from browser code. Keep account and session responses private and non-cacheable.

### Learner profile

The learner profile is a local-first learning record managed by the existing IndexedDB repository and versioned preferences schema. It includes guitar context (instrument, experience, playing hand and tuning), musical goals, practice target and lesson-presentation preferences. The existing learner profile also owns practice history and progress.

The learner profile:

- Is available to signed-in and guest learners.
- Remains on the current browser/device and continues to work without an account.
- Is edited through the existing validated learner-preferences application/storage path.
- Is not copied, attached, migrated, uploaded or synced when a person signs in or out.
- Must retain compatibility with existing local profiles and versioned backups.

**Account identity is not a learner identity.** Never use the authenticated account ID to replace the local learner ID, and do not merge account and learner records.

Cloud learner-data sync is a separate future architecture decision. It must not be introduced as part of account-profile or learner-profile UI work. Before any sync is enabled, define account ownership, explicit opt-in, export, deletion, idempotency, conflict handling, recovery and multi-device behavior.

## Security requirements

- Resolve the current account exclusively from the validated Better Auth session on the server.
- Keep auth secrets and provider credentials in the intended Worker secret store; never commit or log them.
- Use HttpOnly cookies, Secure cookies on HTTPS, SameSite=Lax or stricter, path scoping and bounded session lifetimes.
- Preserve Better Auth's origin/CSRF protections. Keep auth endpoints same-origin; do not broaden CORS or CSP to bypass configuration.
- Keep account, session and authentication API responses private and no-store. They must never enter the public service-worker cache.
- Validate and bound user-editable account fields. Accept only HTTPS avatar URLs from the allowlisted Google/GitHub avatar hosts; do not permit arbitrary image hosts or email changes through the profile form.
- Rate-limit sensitive authentication endpoints and keep diagnostic output free of cookies, session identifiers, provider credentials and learner content.
- Keep the authentication database separate from learner-domain local storage and any future sync service.
- Sign-out ends the account session; it must not clear or rewrite the local learner profile.

## Environment and operations

Support local development and the production Worker only. Do not reintroduce a Preview Worker/environment as part of authentication. Authentication must fail closed unless the intended D1 binding, a high-entropy Better Auth secret, an explicit valid base URL and at least one complete OAuth provider are configured.

Use [Authentication Setup](AUTHENTICATION_SETUP.md) as the sole operational source for local setup, production configuration, provider callbacks and guarded migrations. Do not copy live secret values into docs, source, issues or chat.

A successful build or production deployment is not proof that provider callbacks work. Production acceptance must separately verify the production migration state, intended Google/GitHub credentials, OAuth callback/state handling, session creation, session refresh, account profile update, sign-out and guest access. Record evidence in the Engineering Quality & Release Tracker.

## Delivery boundaries

1. **Authentication foundation (Issue #176):** Better Auth, isolated auth schema, secure server session resolution, OAuth provider configuration and guest-safe fallback.
2. **Account and learner profile experience (Issue #218):** editable account display name and optional allowlisted Google/GitHub avatar URL; read-only provider-managed email; visible session details and sign-out; editable local learner profile; clear navigation; tests and documentation.
3. **Production acceptance:** validate the configured OAuth providers and session/security behavior on the production Worker. This remains distinct from local automated tests.
4. **Future sync:** deferred until a separate architecture, privacy and deletion design is approved.

## Non-goals

- Email/password authentication, email verification, password reset or transactional email.
- Mandatory account creation or blocking guest learning.
- Uploading or hosting profile images.
- Cloud learner-data sync or merging local learner data into an account.
- Server-side audio or recording uploads.
