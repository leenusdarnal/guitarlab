# Production client asset baseline

**Captured:** 23 November 2026  
**Source commit:** `46bc18d63d70e1929ce4d4072190eedfeeb1b070`  
**CI evidence:** [GuitarLab CI run #45119905770](https://github.com/leenusdarnal/guitarlab/actions/runs/45119905770) — all required jobs passed, including Node.js 26, production build, browser acceptance, accessibility, curriculum, and WebKit responsive acceptance.  
**Machine-readable report:** [Download the CI asset report artifact](https://github.com/leenusdarnal/guitarlab/actions/runs/45119905770/artifacts/14793033735) (30-day retention; expires 23 December 2026).

## Emitted client assets

The production build emitted 48 JavaScript assets and 23 CSS assets under `.svelte-kit/output/client/_app/immutable/`. Gzip is measured independently per file at level 9; Brotli uses Node.js `brotliCompressSync` defaults.

| Asset type | Files | Raw | Gzip | Brotli |
|---|---:|---:|---:|---:|
| JavaScript | 48 | 2.17 MiB | 370.9 KiB | 278.8 KiB |
| CSS | 23 | 190.8 KiB | 38.8 KiB | 33.0 KiB |
| **Total** | **71** | **2.35 MiB** | **409.8 KiB** | **311.8 KiB** |

### Largest emitted assets

| Asset | Raw | Gzip | Brotli |
|---|---:|---:|---:|
| `chunks/ByQETK3x.js` | 1.62 MiB | 180.0 KiB | 112.9 KiB |
| `chunks/B8BFZlkW.js` | 90.2 KiB | 25.2 KiB | 22.4 KiB |
| `chunks/CD_dCmgr.js` | 50.2 KiB | 19.2 KiB | 17.4 KiB |
| `nodes/10.DKWziDa5.js` | 48.9 KiB | 14.6 KiB | 12.5 KiB |
| `chunks/Cx5XCXlN.js` | 43.0 KiB | 15.7 KiB | 14.2 KiB |

The largest shared chunk is the main investigation target. Its hashed filename does not identify its module composition, so no dependency or route is blamed from this report alone.

## Initial static route graphs

The report resolves SvelteKit's server manifest to the corresponding client route nodes, then includes the common client bootstrap, root layout, route-specific layouts, page node, associated CSS and transitive static imports. Shared assets are counted once within each route graph. Deferred dynamic imports are excluded.

| Route | Assets | Raw | Gzip | Brotli |
|---|---:|---:|---:|---:|
| `/` | 21 | 1.90 MiB | 270.4 KiB | 192.9 KiB |
| `/account` | 21 | 1.89 MiB | 271.8 KiB | 194.4 KiB |
| `/learn` | 23 | 1.87 MiB | 262.7 KiB | 186.2 KiB |
| `/learn/[lessonId]` | 26 | 1.91 MiB | 272.2 KiB | 194.4 KiB |
| `/login` | 21 | 1.88 MiB | 269.3 KiB | 192.3 KiB |
| `/onboarding` | 21 | 1.87 MiB | 262.1 KiB | 185.6 KiB |
| `/practice` | 20 | 1.91 MiB | 273.8 KiB | 195.9 KiB |
| `/repertoire` | 20 | 1.87 MiB | 262.2 KiB | 185.8 KiB |
| `/settings/data` | 21 | 1.88 MiB | 266.4 KiB | 189.6 KiB |
| `/skills` | 20 | 1.87 MiB | 263.4 KiB | 186.9 KiB |
| `/tools` | 21 | 1.86 MiB | 259.6 KiB | 183.5 KiB |
| `/tools/chords` | 21 | 1.87 MiB | 263.6 KiB | 187.2 KiB |
| `/tools/ear-training` | 23 | 1.88 MiB | 266.2 KiB | 189.2 KiB |
| `/tools/fretboard` | 22 | 1.88 MiB | 267.5 KiB | 190.6 KiB |
| `/tools/metronome` | 22 | 1.87 MiB | 263.2 KiB | 186.8 KiB |
| `/tools/note-recognition` | 22 | 1.87 MiB | 264.8 KiB | 188.2 KiB |
| `/tools/theory-recall` | 22 | 1.86 MiB | 262.0 KiB | 185.6 KiB |
| `/tools/tuner` | 23 | 1.88 MiB | 267.3 KiB | 190.5 KiB |

All 18 page routes resolved with zero missing node references.

## Measurement limits

This is a reproducible build-output baseline, not a measured browser page transfer or field-performance result. Per-file compression does not reproduce HTTP content negotiation, response headers, caching, request prioritization, runtime conditionals or actual navigation behavior. Route graph totals are static-import estimates, not network traces. The report does not attribute minified bytes to individual npm dependencies.

No bundle budgets are set from this single baseline. Core Web Vitals (LCP, INP and CLS), actual route transfers under repeatable desktop/mobile network profiles, and field data remain separate work under PERF-02. Re-measure after each optimization and compare like-for-like commits and build conditions.
