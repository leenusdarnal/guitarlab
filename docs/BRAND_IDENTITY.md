# GuitarLab brand identity

The GuitarLab identity combines a recognizable acoustic guitar silhouette with an equalizer waveform. The sound hole, six-string neck and tuning pegs keep the instrument unmistakably acoustic; the waveform connects the mark to deliberate, measurable practice.

## Brand palette

| Role | Dark UI | Light UI | Usage |
|---|---|---|---|
| Emerald primary | `#42D6A0` | `#176B4B` | Primary actions, active states and the wordmark accent |
| Teal secondary | `#58CDB1` | `#176B68` | Rare supporting emphasis and secondary brand details |
| Champagne gold | `#E0BD78` | `#E0BD78` | Decorative guitar outline and warm brand accent only |
| Ivory | `#F1F4EF` | `#F1F4EF` | Light logo text and neutral highlights |
| Deep navy | `#0B1723` | `#0B1723` | App-icon and brand-art background |
| Graphite / paper | `#101318` | `#F5F4F0` | Application canvas |

Champagne gold is decorative artwork, not the application's warning or success colour. The semantic token `--secondary` uses teal so it remains distinct from the warning token. Semantic text and controls must use the contrast-checked values in `src/app.css`; decorative artwork colours are not a replacement for accessible contrast.

## Asset inventory

- `static/brand/guitarlab-mark.svg` — transparent acoustic-guitar symbol for in-app use.
- `static/brand/guitarlab-logo.svg` — dark lettering for light backgrounds.
- `static/brand/guitarlab-logo-dark.svg` — ivory lettering for dark backgrounds.
- `static/favicon.svg` — simplified 64px vector mark designed to remain legible at browser-tab sizes.
- `static/icons/guitarlab-192.png` and `static/icons/guitarlab-512.png` — PNG installation fallbacks.
- `static/icons/guitarlab-192.svg` and `static/icons/guitarlab-512.svg` — scalable vector equivalents.
- `static/icons/guitarlab-maskable.svg` — full-bleed background with the guitar artwork centered inside the maskable safe area.
- `static/apple-touch-icon.png` — 180px full-bleed icon for Apple home-screen installation.
- `static/manifest.webmanifest` — application name, display mode, theme colors and preferred/fallback icon declarations.
- `src/lib/components/Brand.svelte` — reusable theme-aware wordmark and mark component used by the website shell and onboarding.

## Usage guidance

Use the horizontal logo on documentation and wider brand placements. Choose the light or dark wordmark variant to suit the surface. Use the transparent mark in navigation and compact app surfaces, and use the square icon only where a tile is expected. Keep the guitar's headstock, sound hole and waveform intact.

When a wordmark is linked to the home page, let its visible text provide the accessible link name. The logo image is decorative beside that text and uses an empty alt attribute. Do not override the visible wordmark with a conflicting `aria-label`.

The ordinary app icons may have rounded artwork; the maskable icon must instead provide a full-bleed background and keep essential details within the central safe area. The service worker precaches the static assets through SvelteKit's asset manifest.

## Authentication screen branding

The shared `Brand.svelte` component is used by the application shell and account surfaces. Authentication behaviour, provider support and environment activation are specified in [Authentication Decision](AUTHENTICATION_DECISION.md) and [Authentication Setup](AUTHENTICATION_SETUP.md); implementation and release status belongs in the [Engineering Quality & Release Tracker](ENGINEERING_QUALITY_TRACKER.md). This brand inventory is not an account-availability statement.

## PWA acceptance

The manifest includes PNG fallbacks as well as SVG artwork, and the document head declares the Apple touch icon. The manifest and icon files should still be checked on deployed origins and on target browsers/OS versions. This brand change does not claim to complete the broader offline/synchronisation roadmap.
