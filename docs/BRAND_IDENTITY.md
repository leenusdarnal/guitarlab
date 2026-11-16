# GuitarLab brand identity

The GuitarLab identity combines an acoustic guitar silhouette with an equalizer waveform. It communicates instrumental learning and measurable practice without relying on a literal pick, play button, or generic music note.

## Core palette

| Token | Dark UI | Light UI | Use |
|---|---|---|---|
| Emerald | `#42D6A0` | `#176B4B` | Primary actions, wordmark accent, focusable brand details |
| Teal | `#22B98F` | `#147F70` | Waveform and secondary brand details |
| Champagne gold | `#E0BD78` | `#76520A` | Guitar outline and warm accent |
| Ivory | `#F1F4EF` | `#F1F4EF` | Light wordmark and neutral highlights |
| Deep navy | `#0B1723` | `#0B1723` | App-icon and brand-art background |
| Graphite | `#101318` | `#F5F4F0` | Application theme surfaces |

The semantic design tokens in `src/app.css` are selected to retain readable contrast in both application themes. Decorative gold and teal in the artwork are not substitutes for text or control contrast.

## Asset inventory

- `static/brand/guitarlab-mark.svg` — transparent acoustic-guitar symbol for app UI and product surfaces.
- `static/brand/guitarlab-logo.svg` — horizontal logo lockup for documentation, project pages, and brand previews.
- `static/favicon.svg` — compact browser-tab mark.
- `static/icons/guitarlab-192.svg` and `static/icons/guitarlab-512.svg` — scalable PWA icons.
- `static/icons/guitarlab-maskable.svg` — app icon with inset symbol and safe-area padding for maskable surfaces.
- `static/manifest.webmanifest` — application name, display mode, theme colors, and icon declarations.
- `src/lib/components/Brand.svelte` — shared, theme-aware wordmark and icon component used by the website shell and onboarding.

## Usage guidance

Use the horizontal logo on documentation and wider brand placements. Use the mark-only artwork in navigation, compact controls, favicons, and app icons. Keep the mark's proportions; do not crop the guitar headstock, sound hole, or waveform. Prefer the transparent mark on theme-aware surfaces and the square app-icon artwork only where a tile is expected.

The mark is decorative when paired with the visible GuitarLab wordmark. Use an empty image alt text in that case. When displayed alone as an actionable home link, provide an accessible name such as “GuitarLab home”.

Use the existing app theme rather than placing a dark icon tile inside every navigation control. The icon files have their own navy tile for browser/app surfaces; the transparent mark is intended for the in-app brand component.

## Authentication screen status

The repository currently has learner onboarding but does not contain a login route or an implemented authentication flow. The shared `Brand.svelte` component is ready to be placed in the future sign-in/sign-up shell. This change does not add a placeholder login screen or imply that accounts are available.

## PWA and offline behavior

The web app manifest references the 192px, 512px, and maskable SVG icons. The existing service worker precaches static assets from SvelteKit's asset manifest, so the brand artwork and manifest are included with the static app assets. Browser installation behavior should still be checked against the deployed origin and target browsers; this change does not claim to complete the broader offline/synchronisation roadmap.
