# Temporary implementation session notes

This file is temporary and must be deleted before PR #193 is merged. Durable findings belong in docs/ENGINEERING_QUALITY_TRACKER.md.

## Current scope
- Priority 1: service-worker privacy and offline-navigation hardening.
- Working branch: fix/offline-service-worker-privacy-availability-2026-11-19
- Review PR: #193

## Findings and changes in progress
- Server responses that set Set-Cookie need server-side private/no-store headers; browser service-worker code cannot reliably inspect Set-Cookie.
- navigator.onLine is only a hint; navigation should attempt network access and fall back safely.
- Public cached pages may be used on transient 5xx responses; private navigation must never read Cache Storage and 404s must not be masked.
- Browser acceptance showed unvisited prerendered HTML was available offline because prerendered pages were included in the asset precache. The asset precache is being narrowed to build assets only; HTML should enter the page cache only after a successful visit.
- Physical-device offline acceptance and multi-tab/service-worker lifecycle acceptance remain manual and must not be marked complete.

## Verification
- Earlier PR run failed browser acceptance: offline dashboard timed out and unvisited lesson returned 200 instead of the explicit 503 fallback.
- Root cause identified: prerendered HTML was included in the install-time asset precache.
- A corrected run is required after removing prerendered HTML from the precache.

## Cleanup
Delete this file after the final findings and remaining manual acceptance items are reconciled into the existing engineering quality tracker.
