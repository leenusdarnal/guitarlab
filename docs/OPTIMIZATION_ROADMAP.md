# GuitarLab optimization roadmap

**Baseline:** `main` at `256971c3190949439369f018bd6fb7057dcbcbfd` (12 November 2026).  
**Scope:** incorporate findings from the targeted architecture, music-technology, UX and offline-readiness audit.

This roadmap is intentionally incremental. Preserve the current SvelteKit / Svelte 5 / TypeScript / Cloudflare Workers architecture and local-first data model; do not replace the framework or introduce microservices.

## Phase 1 — Quick wins and risk reduction

- [x] Replace the dashboard's full Year 1 authored-lesson import with a generated compact index.
- [x] Add a generator and curriculum validation so dashboard metadata cannot drift from authored lesson source.
- [x] Query active and paused practice sessions through a compound IndexedDB index instead of scanning all history.
- [x] Add the additive IndexedDB v2-to-v3 migration and browser acceptance coverage.
- [x] Increase fretboard cell hit areas and add mobile touch/keyboard acceptance checks.
- [x] Remove duplicate Svelte parser configuration from ESLint.
- [ ] Capture a production bundle baseline and add a visual bundle report.
- [ ] Add automated axe-core checks for dashboard, lesson reader and music tools.
- [ ] Extend formatting checks to Svelte route components after normalizing existing Svelte file formatting.

### Curriculum payload result

The Year 1 dashboard index contains only the phase metadata and the fields the dashboard needs for its 52 lesson summaries. At audit time, the authored Year 1 lesson JSON was approximately 632 KB and the generated index approximately 11 KB (about 98% smaller by raw source bytes). This is a source-payload comparison, not a measured JavaScript bundle or network-transfer reduction; verify actual output with a production build and bundle analysis.

The full authored lesson content remains the source of truth. Regenerate the index with `npm run curriculum:index`; `npm run curriculum:validate` checks that it is current.

## Phase 2 — Core refactors

- [ ] Split large route-level screens into feature components (dashboard, lesson reader, fretboard, chord library, data/backup screens).
- [ ] Split application orchestration and IndexedDB adapters into smaller use-case/repository modules.
- [ ] Complete the music domain: notes, intervals, keys, scales, modes, tunings, arpeggios, movable chord voicings and tablature structures.
- [ ] Build reusable SVG renderers for fretboards, scale patterns, chord diagrams and tablature.
- [ ] Add a shared audio context lifecycle service and reusable scheduler/instrument abstractions while preserving the metronome's lookahead scheduling.
- [ ] Expand tests for custom tunings, theoretical edge cases, music rendering, storage migration and audio lifecycle.
- [ ] Load server-side lesson bodies by route/content pack rather than keeping every authored lesson body in the curriculum catalogue's eager dependency graph.
- [ ] Add mobile-focused fretboard navigation (visible fret window, larger selection affordances and clearer orientation controls).

## Phase 3 — Advanced product capabilities

- [ ] Deliver a complete installable PWA manifest, icon set and install experience.
- [ ] Add learner-selected offline curriculum packs with explicit cache versioning and storage quota UX.
- [ ] Implement a chromatic tuner and opt-in local microphone pitch analysis.
- [ ] Add ear-training, interval recognition, scale practice, rhythm exercises and assessment flows.
- [ ] Add optional audio samples / instrument playback only after audio lifecycle, memory, latency and licensing are specified.
- [ ] Add evidence-linked practice analytics without treating elapsed time as proof of skill mastery.
- [ ] Introduce optional authenticated cloud sync only with ownership checks, idempotency, conflict handling and tested recovery.

## Release gates

- [ ] Production bundle analysis and agreed budgets.
- [ ] Mobile performance and accessibility checks at 320px, 390px, tablet and desktop breakpoints.
- [ ] Physical iOS Safari and Android Chrome acceptance, including offline reload and backup/restore.
- [ ] Audio lifecycle and scheduling checks on representative mobile devices.
- [ ] CSP, privacy, storage durability, backup/restore and Worker rollback verification.
- [ ] Isolated preview verification followed by an explicitly approved production deployment.

## Engineering guardrails

1. Keep music calculations and learning rules framework-independent.
2. Treat IndexedDB as the local authority; cloud sync stays optional.
3. Never put private learner data, recordings or practice notes into public curriculum assets or cache entries.
4. Preserve the distinction between lesson completion, practice activity and verified skill mastery.
5. Measure bundle size, performance and audio latency before claiming improvement.
6. Land work in small pull requests with migration tests and data-preservation checks.
