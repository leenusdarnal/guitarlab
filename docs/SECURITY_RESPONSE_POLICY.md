# Application security response policy

**Status:** Implemented in the application build; deployment-level verification and release review remain open.

## Content Security Policy

SvelteKit emits the enforced `Content-Security-Policy` header using the policy configured in `vite.config.ts`.

- `mode: 'auto'` uses per-response nonces for dynamically rendered pages and hashes for prerendered output.
- `default-src 'self'` establishes the same-origin default.
- Executable scripts are restricted to `'self'`; the policy does not allow `'unsafe-inline'` or `'unsafe-eval'` in `script-src`.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and `frame-ancestors 'none'` restrict embedded objects, base URL changes, form targets and framing.
- Images may use same-origin, data and blob URLs. Media may use same-origin and blob URLs. Workers may use same-origin and blob URLs.
- `style-src` allows `'unsafe-inline'` because Svelte transitions and component style attributes can create inline CSS. This exception applies to CSS only; do not copy it into `script-src`.

SvelteKit automatically adds the nonces or hashes needed for the scripts and styles it generates. If a feature introduces a new external origin, add only the specific required origin to the narrowest applicable directive and include a regression assertion. Do not broaden `default-src` or script execution sources as a workaround.

Reference: [SvelteKit CSP configuration](https://svelte.dev/docs/kit/%40sveltejs-kit-vite#csp).

## Other response headers

`src/hooks.server.ts` sets:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(self), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Strict-Transport-Security` on HTTPS responses only

The browser acceptance workflow checks the actual HTML response headers and the security-critical CSP directives. The checks intentionally reject inline/eval script allowances.

## Verification boundary

The automated assertions verify that the configured policy is emitted by the local Cloudflare Worker preview. They do not prove that every production route, browser extension, third-party integration or future feature is compatible with the policy. They are not a substitute for security review, CSP violation monitoring, physical-device acceptance, deployment configuration review or release approval.

Before enabling a new external integration, review its required script, style, image, media, worker and connection origins. Re-run browser acceptance after changing CSP. Keep production deployment deferred until the owner, data architecture, access controls and release approval gates are resolved.
