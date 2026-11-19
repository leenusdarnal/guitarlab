# Authentication Security Acceptance Implementation Plan

> **For agentic workers:** Use the test-driven-development workflow; each test must be observed failing before any production behavior is changed.

**Goal:** Prove that the configured authentication Worker rejects cross-origin state-changing requests and enforces its existing per-route sign-in rate limit.

**Architecture:** Extend the existing local Wrangler/Playwright acceptance script so it exercises the real Better Auth endpoints against the isolated local AUTH_DB. Keep the checks entirely local, use no real mail provider, and do not change production activation or weaken Better Auth's built-in protections.

**Tech Stack:** SvelteKit 3, Better Auth, Cloudflare Workers/Wrangler, D1, Node.js fetch, Playwright.

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

- [ ] Add a request with an untrusted Origin and assert a forbidden response (HTTP 403) with no session cookie.
- [ ] Run the local auth browser acceptance and confirm the new assertion fails if the origin guard is bypassed.
- [ ] Keep the production auth implementation unchanged unless the test proves a real gap.
- [ ] Run the full CI validation after the change.

### Task 2: Prove sign-in rate limiting

**Files:**
- Modify: `scripts/auth-browser-acceptance.mjs`

**Interfaces:**
- Uses the same isolated local Worker and D1 database.
- Exercises repeated invalid sign-in attempts against an unknown test address; it must not send email.

- [ ] Issue bounded invalid sign-in attempts until the configured limit is reached.
- [ ] Assert at least one request is rejected with HTTP 429.
- [ ] Confirm the normal verified sign-in flow still succeeds before the rate-limit probe.
- [ ] Run the full CI validation after the change.

### Task 3: Reconcile the security tracker

**Files:**
- Modify: `docs/ENGINEERING_QUALITY_TRACKER.md`

- [ ] Record the exact CI run and SHA for the new security acceptance evidence.
- [ ] Keep HTTPS Secure-cookie verification, session expiry/refresh, expired reset token, and physical/production checks explicitly open if not proven by this local HTTP test.
- [ ] Do not close Issue #176 or mark SEC-03 complete while evidence remains outstanding.
