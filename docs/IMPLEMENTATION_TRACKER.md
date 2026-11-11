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
| Cloudflare runtime | Configured in PR #21 | Wrangler and adapter configured; preview/runtime smoke test still required |
| CI quality gates | Passing | Latest merged commit passed curriculum, theme contrast, formatting, lint, Svelte/type-check, unit tests and Cloudflare Worker build. Audit reported no high/critical advisories; moderate/low dev-tool advisories remain |
| Cloud data and local persistence | Not started | M2 D1/Drizzle; M5 IndexedDB and offline-first learner records |
| Full curriculum reader and progress engine | Not started | M3–M5; preserve all authored lesson IDs and separate lesson completion from demonstrated mastery |

**Important:** PR #21 is still subject to passing CI and runtime verification. The dashboard is an initial shell. Learner setup validates preferences in memory only; it does not yet persist them. No production deployment or cloud learner-data endpoint is claimed.

## M1 — Application foundation

| Slice | Work item | Current status | Evidence / exit check |
|---|---|---|---|
| M1.0 | [#1 — Select visual concept and freeze design tokens](https://github.com/leenusdarnal/guitarlab/issues/1) | Direction approved; contrast validation added | Hybrid direction documented; both themes must pass automated contrast checks |
| M1.1 | [#2 — Bootstrap SvelteKit, Svelte 5 and TypeScript](https://github.com/leenusdarnal/guitarlab/issues/2) | Merged | Install, Svelte/type check, unit tests and production build passed in GitHub Actions |
| M1.2 | [#3 — Configure Cloudflare Worker and Wrangler](https://github.com/leenusdarnal/guitarlab/issues/3) | Build passed; preview pending | Worker-compatible production build passed; live preview and browser smoke test remain |
| M1.3 | [#4 — Implement approved visual system and responsive shell](https://github.com/leenusdarnal/guitarlab/issues/4) | Initial shell merged | Browser QA on desktop/mobile, keyboard and reduced motion remains |
| M1.4 | [#5 — Add quality tooling and CI](https://github.com/leenusdarnal/guitarlab/issues/5) | Merged; core validation passed | Formatting, lint, Svelte/type-check, unit tests and Worker build passed. Audit job is informational/continue-on-error and reports moderate/low dev-tool advisories |
| M1.5 | [#6 — Integrate curriculum integrity checks](https://github.com/leenusdarnal/guitarlab/issues/6) | Added to CI; validator passed | 52 Year 1 + 52 Year 2 + 48 Year 3 lessons validate |

Merged: [#21 — GuitarLab M1 application foundation](https://github.com/leenusdarnal/guitarlab/pull/21)

## M2 — Data foundation

| Slice | Work item | Depends on | Exit check |
|---|---|---|---|
| M2.1 | [#7 — Versioned domain model and D1/Drizzle migrations](https://github.com/leenusdarnal/guitarlab/issues/7) | M1.2, M1.4 | Fresh local D1 migrates; ownership and append-only evidence constraints tested |
| M2.2 | [#8 — Repository interfaces and application services](https://github.com/leenusdarnal/guitarlab/issues/8) | M2.1 | Storage-independent contracts and validation tests |
| M2.3 | [#9 — Empty learner profile and IndexedDB](https://github.com/leenusdarnal/guitarlab/issues/9) | M2.2 | New profile is empty, persists locally and survives offline reload |
| M2.4 | [#10 — Export, restore preview and safe reset](https://github.com/leenusdarnal/guitarlab/issues/10) | M2.3 | Validated round-trip; failed restore leaves existing data intact |

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

1. Add a preview deployment path and complete a browser/Worker smoke test; no live preview URL is claimed yet.
2. Start M2.1 ([issue #7](https://github.com/leenusdarnal/guitarlab/issues/7)) with D1/Drizzle migrations and versioned domain tables.
