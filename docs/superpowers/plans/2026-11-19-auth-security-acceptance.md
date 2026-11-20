# Authentication Security Acceptance Implementation Plan

> **Historical implementation-plan snapshot — not current task status.** The plan and its checkboxes record the proposed/observed work at the date in the filename. Current product milestones belong in [ROADMAP.md](../../ROADMAP.md); current engineering/release gates belong in [ENGINEERING_QUALITY_TRACKER.md](../../ENGINEERING_QUALITY_TRACKER.md). Do not resume or close work from this historical checklist without checking those authorities and live GitHub state.


> **For agentic workers:** Use the test-driven-development workflow; each test must be observed failing before any production behavior is changed.

**Goal:** Exercise the local authentication lifecycle and its security boundaries over HTTPS, including origin protection, rate limiting, secure cookies, reset-token expiry/replay, session refresh/expiry, session revocation, privacy-safe diagnostics and auth-route accessibility.

**Architecture:** Extend the local Wrangler/Playwright acceptance script against the isolated local AUTH_DB. Use an ephemeral Wrangler config for local HTTPS and tightly bounded timing overrides available only with a loopback test mail sink on a loopback hostname. Keep real mail provider calls and all remote environment activation out of tests; production timing and security protections remain unchanged.

**Tech Stack:** SvelteKit 3, Better Auth, Cloudflare Workers/Wrangler, D1, Node.js, Playwright and axe-core.

**Spec:** `docs/ENGINEERING_QUALITY_TRACKER.md`, SEC-03 and SEC-01/SEC-02 acceptance checklist.

## Global Constraints

- Guest/local-only mode remains the default.
- No production or preview AUTH_DB binding is added.
- No learner data is uploaded or synchronized.
- Keep Better Auth origin/CSRF protections enabled.
- Keep existing database-backed rate limits: sign-in 5 requests per 60 seconds; do not raise limits to make tests pass.
- Test email delivery remains loopback-only.

## Review Focus

- A cross-origin request must be rejected before mutating account/session state.
- A valid same-origin authentication request must remain functional.
- Rate-limit assertions must not depend on brittle exact attempt counts when earlier browser steps have already consumed the same IP/route bucket.
- Failure diagnostics must not print email addresses, credentials, cookies, or one-time tokens.
- The local test must never send messages to the real Resend API.

---

### Task 1: Prove cross-origin protection

**Files:**
- Modify: `scripts/auth-browser-acceptance.mjs`

**Interfaces:**
- Uses the running local Worker at `origin`.
- Calls Better Auth's `/api/auth/sign-in/email` endpoint with a deliberately untrusted `Origin` header.

- [x] Add a request with an untrusted Origin and assert a forbidden response (HTTP 403) with no session cookie (PR #204).
- [ ] Mutation-test the origin assertion by temporarily disabling the trusted-origin guard in a disposable test branch; do not weaken production configuration.
- [x] Keep production origin and rate-limit configuration unchanged.
- [ ] Run the full CI validation on this branch and record the final run and commit SHA.

### Task 2: Prove sign-in rate limiting

**Files:**
- Modify: `scripts/auth-browser-acceptance.mjs`

**Interfaces:**
- Uses the same isolated local Worker and D1 database.
- Exercises repeated invalid sign-in attempts against an unknown test address; it must not send email.

- [x] Issue bounded invalid sign-in attempts until the configured limit is reached (PR #204).
- [x] Assert at least one request is rejected with HTTP 429 (PR #204).
- [x] Confirm the normal verified sign-in flow still succeeds before the rate-limit probe (PR #203).
- [ ] Run the full CI validation after the change.

### Task 3: Reconcile the security tracker

**Files:**
- Modify: `docs/ENGINEERING_QUALITY_TRACKER.md`

- [ ] Record the exact CI run and SHA for the new security acceptance evidence.
- [ ] Keep HTTPS Secure-cookie verification, session expiry/refresh, expired reset token, and physical/production checks explicitly open if not proven by this local HTTP test.
- [ ] Do not close Issue #176 or mark SEC-03 complete while evidence remains outstanding.


### Task 4: Verify HTTPS cookie and session lifecycle

- [x] Generate a temporary local Wrangler config that uses HTTPS without changing checked-in preview/production configs.
- [x] Assert HSTS is present for the HTTPS local Worker and the session cookie is HttpOnly, Secure, SameSite=Lax and path-scoped.
- [x] Add local-only bounded timing overrides for session expiry, refresh age and reset-token expiry; reject these overrides outside loopback origin + loopback test mail sink.
- [x] Assert session refresh extends expiry, an idle session expires, and a reset token is rejected after expiry.
- [x] Preserve password-reset replay rejection and session revocation after password reset.
- [ ] Validate the complete journey on the full CI run.

### Task 5: Verify log privacy and auth accessibility

- [x] Redact known test emails, credentials, cookies and one-time tokens from failure diagnostics.
- [x] Assert captured Worker output does not contain the synthetic test addresses, passwords, session cookies or one-time tokens.
- [x] Run axe checks against sign-in, account and expired-reset states during the local authenticated acceptance.
- [ ] Validate these checks on the full CI run; physical screen-reader and device acceptance remains separately tracked in the engineering tracker.

### Explicitly blocked external gates

- Preview/production D1 databases, migrations, Worker secrets, origins and Resend sender credentials are not provisioned by this plan. Keep SEC-02 blocked until per-environment provisioning and live verification are approved.
- Production response headers/CSP and deployment privacy review remain SEC-05; local HTTPS acceptance cannot close it.
- Cloud learner-data sync remains disabled under SEC-04.
