# Modern Theme Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Implement the first Modern Music Studio foundation in GuitarLab: semantic dark/light theme tokens, readable global typography defaults, contrast validation, and reliable theme selection before first paint.

**Architecture:** Keep the existing SvelteKit application shell and CSS entry point. Make \`src/app.css\` the single semantic token source, strengthen the existing design-token validator to check required roles and real text/control pairings, and initialise the selected theme in the HTML shell using SvelteKit's CSP-compatible nonce placeholder. Keep the learner's theme preference in the existing localStorage key, adding System as a first-class option without changing learner profile data.

**Tech Stack:** Svelte 5, SvelteKit 3, CSS custom properties, Node.js validation script, Vitest/browser acceptance already configured in the repository.

**Spec:** \`docs/DESIGN_DIRECTION.md\`, sections 3, 9, 10, 13 and 14; \`docs/UI_UX_IMPLEMENTATION_TRACKER.md\`, UX-02/03/04.

## Global Constraints

- Preserve all 152 authored lessons, six learning routes, stable identifiers, ordering and authored learning outcomes.
- Preserve the existing private local learner-data boundary; theme preference is a presentation setting only.
- Keep both themes readable and validate normal text at 4.5:1, large text at 3:1, and meaningful UI boundaries/focus at 3:1.
- Mobile form controls use at least 16px computed text size.
- No page-level horizontal overflow at 320px and wider.
- Respect \`prefers-reduced-motion\`; do not introduce a remote font dependency.
- Do not loosen accessibility or contrast checks to make the new palette pass.
- Inline pre-paint JavaScript must remain compatible with the existing SvelteKit CSP auto/nonce configuration; do not enable unsafe-inline scripts.

## Review Focus

- A saved System preference must follow OS light/dark changes without overwriting the preference.
- A blocked or unavailable localStorage must not prevent the app from rendering or changing theme for the current session.
- An invalid stored preference must safely fall back to System.
- A first-load theme must be applied before first paint without a flash and without weakening CSP.
- New token roles must have contrast checks on their intended surfaces, not only against the page canvas.

---

### Task 1: Strengthen the design-token validator

**Files:**
- Modify: \`scripts/validate-design-tokens.mjs\`
- Test: existing \`npm run design:validate\` command

**Interfaces:**
- Consumes: semantic CSS variables in \`src/app.css\`.
- Produces: a validator that fails for missing required semantic roles or insufficient contrast on documented pairings.

- [ ] **Step 1: Add required-role and pairing assertions first.** Require dark and light token blocks to define \`bg\`, \`surface\`, \`surface-raised\`, \`surface-overlay\`, \`text\`, \`muted\`, \`text-subtle\`, \`border\`, \`border-strong\`, \`primary\`, \`primary-ink\`, \`secondary\`, \`success\`, \`warning\`, \`danger\`, and \`focus\`. Add checks for primary text on surface, muted text on surface, subtle text on surface, primary ink on primary, and border-strong against surface using a 3:1 non-text minimum. Preserve existing checks.
- [ ] **Step 2: Run \`npm run design:validate\` on the unchanged CSS.** Expected: FAIL naming the missing semantic roles and/or failing pairings; this confirms the new validation is active before CSS implementation.
- [ ] **Step 3: Keep the validator deterministic and explicit.** Report theme, foreground/background role, measured ratio and minimum. Do not infer or skip missing values.
- [ ] **Step 4: Run \`npm run design:validate\` again before moving to Task 2.** Expected: it still fails against the old CSS for the expected missing-token reasons.

### Task 2: Implement the Modern Music Studio CSS foundation

**Files:**
- Modify: \`src/app.css\`
- Test: \`npm run design:validate\`

**Interfaces:**
- Consumes: semantic roles and contrast pairings from Task 1.
- Produces: one dark and one light semantic token set, consistent global type roles, spacing and content-width variables.

- [ ] **Step 1: Replace the old dark and light palette with the exact target values from Design Direction §3.1.** Include all required semantic roles; keep \`--radius\` and \`--content\` as documented layout variables.
- [ ] **Step 2: Add global type, spacing and shape variables.** Define the documented 4px spacing scale, type roles, line-height roles, content/reading widths and control/panel radii. Keep existing route-specific styles working; do not globally resize every heading in this slice.
- [ ] **Step 3: Set safe global defaults.** Apply 16px minimum font size to input/select/textarea (including textarea), readable body line height, neutral page/surface defaults and shared focus treatment. Keep existing reduced-motion rules.
- [ ] **Step 4: Run \`npm run design:validate\`.** Expected: PASS for both themes and all required text/control pairings.
- [ ] **Step 5: Run \`npm run check && npm run lint && npm run test:run\`.** Expected: no type, lint or unit-test regressions.

### Task 3: Apply theme before first paint and support System/Light/Dark

**Files:**
- Modify: \`src/app.html\`
- Modify: \`src/routes/+layout.svelte\`
- Test: \`npm run check\`, \`npm run test:accessibility\`, and the full CI browser acceptance workflow

**Interfaces:**
- Consumes: CSS selectors \`:root\` and \`:root[data-theme='light']\`; storage key \`guitarlab-theme\`.
- Produces: stored preference type \`'system' | 'light' | 'dark'\`, applied theme type \`'light' | 'dark'\`, and a theme control that clearly exposes the current preference.

- [ ] **Step 1: Add a focused pre-paint theme initializer to \`src/app.html\`.** Read only \`guitarlab-theme\`; accept \`system\`, \`light\`, \`dark\`; use \`matchMedia('(prefers-color-scheme: light)')\` for System; fall back to System when storage is blocked or invalid. Use SvelteKit's \`%sveltekit.nonce%\` on the inline script so CSP remains enforced.
- [ ] **Step 2: Refactor the layout theme state.** Track the preference separately from the resolved theme. Initialise it from the pre-applied document state and localStorage safely. Keep the existing \`guitarlab-theme\` key and allow System, Light and Dark. System follows OS changes only while the stored preference is System.
- [ ] **Step 3: Update the theme control.** Replace the binary toggle with an accessible select/menu labelled “Appearance” and options System, Light and Dark. Announce the selected preference; update \`document.documentElement.dataset.theme\` and \`meta[name="theme-color"]\` whenever the resolved theme changes. Keep the current-session choice working if storage throws.
- [ ] **Step 4: Update \`src/app.html\` theme-color fallback to the dark target canvas and keep runtime metadata synchronised with the active theme.**
- [ ] **Step 5: Run \`npm run check && npm run lint && npm run test:run && npm run design:validate\`.** Expected: all commands pass.
- [ ] **Step 6: Run the full browser accessibility acceptance.** Expected: 11 routes load in both themes, axe serious/critical findings remain zero, 320px reflow passes, skip-link and security headers remain intact. Confirm no CSP violation in browser console and test first paint with saved Light, Dark and System preferences.

---

## Plan self-review

- Spec coverage: palette, semantic roles, typography/spacing base, contrast, theme reliability, CSP, reduced motion and mobile form sizing are covered. Page-level layout and component redesign intentionally remain for later UX-04/05/06/07 slices.
- TDD: validator requirements are added before CSS, and CI's design validation is the red/green proof. No production CSS or theme code is written before the validator test.
- Interface consistency: Tasks 1 and 2 share semantic role names and contrast pairings; Task 3 consumes the same \`data-theme\` attribute and existing storage key.
- Review focus: System changes, blocked storage, invalid preference, CSP and contrast pairings are explicitly addressed.
- Proportion: this plan covers one cohesive foundation slice; navigation and route redesign are intentionally excluded.
