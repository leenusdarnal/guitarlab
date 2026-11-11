# GuitarLab Implementation Tracker

**Last updated:** 2026-11-11  
**Tracking source:** GitHub Issues in this repository  
**Implementation branch:** `main`

This file is the human-readable index. GitHub Issues remain the execution records: each work item has a scope, dependencies and acceptance criteria. A task is not complete just because code was written; it must pass its stated checks and be verified in a pull request.

## Current status

| Area | Status | Evidence / next action |
|---|---|---|
| Product definition and architecture | Complete | `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md` |
| Curriculum foundation | Complete | 152 authored lessons; `npm run curriculum:validate` validates 52 + 52 + 48 lessons |
| Visual direction | Approved | Hybrid of modern interactive structure, warm acoustic character and focused practice; `docs/DESIGN_DIRECTION.md` |
| Design-token contrast | Added to CI | `scripts/validate-design-tokens.mjs` checks dark/light text, status, accent and focus pairs |
| Application foundation | Merged | PR #21; SvelteKit 3/Svelte 5/TypeScript, Tailwind 4, Cloudflare adapter, initial dashboard and onboarding |
| Cloudflare runtime | Configured and locally verified | Worker production build and local Wrangler smoke test pass; no live preview or production deployment is claimed |
| CI quality gates | Passing | Latest merged commit passed curriculum, theme contrast, formatting, lint, Svelte/type-check, unit tests and Cloudflare Worker build. Audit reported no high/critical advisories; moderate/low dev-tool advisories remain |
| Data foundation | M2.1 merged | PR #22; 10 Drizzle tables, versioned local D1 migration, 152 lesson metadata references, 34 skill IDs and passing database invariants; no production DB or cloud sync |
| Repository/application boundary | M2.2 merged | PR #23; repository ports, validated use cases, typed safe errors, in-memory tests and updated architecture documentation. No storage adapter or cloud sync is enabled |
| Learner-local persistence | Draft PR #24; CI green, manual QA pending | Browser-local IndexedDB stores, empty active profile, preference persistence and repository adapters. Still needs browser reload/offline and upgrade verification before issue #9 is complete |
| Backup and recovery | M2.4 implementation in draft PR #25; CI/browser verification pending | Versioned export, strict import validation, non-mutating restore preview, one-transaction replacement restore and typed-confirmation reset. Browser-level round-trip and rollback QA remains |
| Full curriculum reader and progress engine | Not started | M3–M5; current database contract preserves authored IDs and separates lesson completion from demonstrated mastery |

**Important:** PR #21, PR #22 and PR #23 are merged. M2.3 is proposed in draft PR #24 and is not part of `main` until reviewed and merged. Its CI passes, but browser-level reload/offline and upgrade verification remain open. M2.4.1 is proposed in draft PR #25, stacked on PR #24; it adds the versioned backup contract, active-learner export/download, validated preview, transactional replacement restore and explicit safe reset UI. No production D1 resource, authentication, cloud sync or live deployment is claimed.

## M1 — Application foundation

| Slice | Work item | Current status | Evidence / exit check |
|---|---|---|---|
| M1.0 | [#1 — Select visual concept and freeze design tokens](https://github.com/leenusdarnal/guitarlab/issues/1) | Direction approved; contrast validation added | Hybrid direction documented; both themes must pass automated contrast checks |
| M1.1 | [#2 — Bootstrap SvelteKit, Svelte 5 and TypeScript](https://github.com/leenusdarnal/guitarlab/issues/2) | Merged | Install, Svelte/type check, unit tests and production build passed in GitHub Actions |
| M1.2 | [#3 — Configure Cloudflare Worker and Wrangler](https://github.com/leenusdarnal/guitarlab/issues/3) | Build passed; preview pending | Worker build and local Wrangler smoke test passed; live preview and browser-level test remain |
| M1.3 | [#4 — Implement approved visual system and responsive shell](https://github.com/leenusdarnal/guitarlab/issues/4) | Initial shell merged | Browser QA on desktop/mobile, keyboard and reduced motion remains |
| M1.4 | [#5 — Add quality tooling and CI](https://github.com/leenusdarnal/guitarlab/issues/5) | Merged; core validation passed | Formatting, lint, Svelte/type-check, unit tests and Worker build passed. Audit job is informational/continue-on-error and reports moderate/low dev-tool advisories |
| M1.5 | [#6 — Integrate curriculum integrity checks](https://github.com/leenusdarnal/guitarlab/issues/6) | Added to CI; validator passed | 52 Year 1 + 52 Year 2 + 48 Year 3 lessons validate |

Merged: [#21 — GuitarLab M1 application foundation](https://github.com/leenusdarnal/guitarlab/pull/21)

## M2 — Data foundation

M2.1 is merged in [PR #22](https://github.com/leenusdarnal/guitarlab/pull/22), and [issue #7](https://github.com/leenusdarnal/guitarlab/issues/7) is closed. The schema defines 10 relational tables, seeds 152 lesson metadata references and 34 skill IDs, and keeps lesson bodies in Git. The versioned migration and database invariants pass in Wrangler local D1. No production D1, authentication or cloud sync is created.

M2.2 is merged in [PR #23](https://github.com/leenusdarnal/guitarlab/pull/23), and [issue #8](https://github.com/leenusdarnal/guitarlab/issues/8) is closed. The slice keeps application logic independent of Drizzle and IndexedDB, separates public curriculum reads from private learner repositories, and tests transitions with in-memory adapters. It does not provision or expose remote data.

M2.3 is proposed in [draft PR #24](https://github.com/leenusdarnal/guitarlab/pull/24). CI passes for its current head. The remaining acceptance check is browser-level persistence across reload/offline restart plus verification of storage upgrade behaviour; therefore issue #9 is not yet marked complete.



| Slice | Work item | Depends on | Exit check |
|---|---|---|---|
| M2.1 | [#7 — Versioned domain model and D1/Drizzle migrations](https://github.com/leenusdarnal/guitarlab/issues/7) | Merged — PR #22 | Fresh local D1 migration, FK/unique constraints, append-only assessment triggers and separate completion/mastery invariants all pass in CI |
| M2.2 | [#8 — Repository interfaces and application services](https://github.com/leenusdarnal/guitarlab/issues/8) | Merged — PR #23 | Storage-independent contracts, typed validation/errors, versioned public reads, atomic completion and evidence/practice transition tests passed in CI |
| M2.3 | [#9 — Empty learner profile and IndexedDB](https://github.com/leenusdarnal/guitarlab/issues/9) | Draft PR #24; CI passes, browser reload/offline QA pending | New profile is empty, persists locally and survives offline reload |
| M2.4 | [#10 — Export, restore preview and safe reset](https://github.com/leenusdarnal/guitarlab/issues/10) | Draft PR #25, stacked on M2.3 | Validated round-trip; failed restore leaves existing data intact; reset requires explicit confirmation |

## M3 — Dashboard

| Slice | Work item | Depends on | Exit check |
|---|---|---|---|
| M3.1 | [#11 — Learner dashboard and learning path](https://github.com/leenusdarnal/guitarlab/issues/11) | M1.3, M2.3 | Fresh-start, progress and review states render correctly |
| M3.2 | [#12 — Explainable recommendations and flexible practice plans](https://github.com/leenusdarnal/guitarlab/issues/12) | M2.2, M2.3, M3.1 | 10/20/40/custom plans and reasoned recommendations pass unit tests |

## M4 — Curriculum and lessons

| Slice | Work item | Depends on | Exit check |
|---|---|---|---|
| M4.1 | [#13 — Curriculum navigation and lesson reader](https://github.com/leenusdarnal/guitarlab/issues/13) | M1.5, M2.2, M3.1 | All 152 authored lessons load in stable order |
| M4.2 | [#14 — Checkpoints, completion and resume](https://github.com/leenusdarnal/guitarlab/issues/14) | M2.3, M4.1 | Resume works; lesson completion never implies skill mastery |

## M6–M9 — Practice and release

| Slice | Work item | Depends on | Exit check |
|---|---|---|---|
| M6.1 | [#15 — Fretboard, chord library and metronome](https://github.com/leenusdarnal/guitarlab/issues/15) | M1.3, M2.2, M2.3 | Pitch calculations, diagrams and transport controls are tested |
| M7.1 | [#16 — Practice sessions and evidence capture](https://github.com/leenusdarnal/guitarlab/issues/16) | M2.3, M3.2, M6.1 | Accurate session capture; timer never grants mastery |
| M8.1 | [#17 — Ear training, theory and repertoire](https://github.com/leenusdarnal/guitarlab/issues/17) | M4.1, M6.1, M7.1 | Accessible drills and copyright-safe song workspace |
| M9.1 | [#18 — Offline, accessibility, privacy and release hardening](https://github.com/leenusdarnal/guitarlab/issues/18) | M1–M8 core slices | Offline, recovery, security, accessibility and release checks pass |

## How progress is recorded

1. Move the corresponding GitHub Issue through its status as work starts and completes.
2. Use one pull request per small slice where practical; link it to the issue with `Closes #N`.
3. Include test/build results and any manual verification in the pull request description.
4. Update this page when a slice changes state or an acceptance criterion changes.
5. Keep the main branch buildable. Do not merge a slice with failing checks.
6. Keep personal practice history, recordings, credentials and runtime databases out of this public repository.

## Definition of done for every slice

- Acceptance criteria are met and checked in the issue.
- Relevant format, lint, type-check, unit/integration/e2e tests and production build pass.
- Mobile and desktop behaviour is verified for user-facing work.
- Loading, empty, error and offline states are handled where applicable.
- Documentation matches the actual code.
- No secrets or private learner records are committed.

## Immediate next actions

1. Finish M2.3 browser reload/offline and upgrade verification before merging PR #24.
2. Verify M2.4 export/import round-trip, failed-restore rollback and reset in a browser; keep PR #25 stacked until M2.3 is merged.
3. Keep D1 isolated to local/test use until authentication and ownership checks exist; no production database or cloud sync is enabled.
4. Add a live Cloudflare preview deployment and browser-level verification as a separate release task; no live preview URL is claimed yet.
