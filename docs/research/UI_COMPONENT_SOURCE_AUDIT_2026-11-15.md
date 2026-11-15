# GuitarLab UI Component Source Audit and Shortlist

**Reviewed:** 15 November 2026  
**Status:** Research complete; no UI package has been added  
**Scope:** User-supplied Tailwind component sources, Made with Svelte, and Svelte-native alternatives required to make the comparison useful for this repository  
**Related tracker:** [UI/UX Implementation Tracker](../UI_UX_IMPLEMENTATION_TRACKER.md)  
**Design authority:** [Modern Music Studio direction](../DESIGN_DIRECTION.md)

---

## 1. Decision summary

GuitarLab should **not adopt one large component library as the visual foundation**. Its current design direction already defines a distinctive semantic token system, graphite-dark and warm-paper themes, type scale, spacing, reading widths and interaction principles. A second opinionated design system would create competing defaults and increase migration work.

Recommended approach:

1. Use **Bits UI** as the first choice for complex, accessibility-sensitive interaction primitives where native Svelte markup would otherwise require custom focus, keyboard or ARIA logic.
2. Use **shadcn-svelte** selectively when a ready-to-edit Svelte component is more efficient than composing Bits UI primitives directly. It is a community Svelte port, not the original React shadcn/ui project.
3. Use **Float UI, HyperUI, Meraki UI and PrebuiltUI** as pattern libraries for static HTML/Tailwind structures. Convert selected markup into semantic Svelte components and replace visual classes with GuitarLab tokens.
4. Evaluate **Skeleton** as the best alternative if the project later decides it needs a unified Svelte/Tailwind design system. Do not add it alongside the existing theme system without a deliberate architecture decision.
5. Keep **Flowbite Svelte** as a possible component-coverage option, and **Svelte UX** as a specialist library to evaluate for complex data-heavy views. Neither is required for the current UI/UX implementation slices.
6. Treat React-first registries and animation libraries as visual/interaction references only. Do not install React packages or port framework-specific internals into SvelteKit.

**Immediate recommendation: no new dependency in the current lesson-discovery/theme PR.** First finish and validate the design-token foundation, then adopt only the smallest primitive needed by a specific tracker task. Every introduced component must pass the existing responsive, keyboard, theme, reduced-motion and accessibility checks.

## 2. Repository compatibility baseline

The repository branch reviewed uses:

- Svelte 5 (package manifest range: ^5.57.3).
- SvelteKit 3.
- Tailwind CSS 4 (manifest range: ^4.0.0, through @tailwindcss/vite).
- TypeScript and Vite.
- No installed third-party UI component system in package.json.
- A local Modern Music Studio token system in src/app.css, including semantic colours, type roles, spacing, radii, reading widths and dark/light theme values.

This baseline makes native Svelte components and plain HTML/Tailwind markup the lowest-friction options. A React component does not become a Svelte component merely because it uses Tailwind classes. Copying the markup of an HTML component is generally straightforward; copying its React state, hooks, event handlers, animation runtime or accessibility primitives is not.

Before adding a library, inspect the lockfile's resolved Tailwind version and the proposed package's peer dependencies. The manifest's ^4.0.0 range alone does not prove that every package requiring a newer Tailwind 4 minor is satisfied.

## 3. Evaluation criteria

Sources were evaluated for:

| Criterion | What matters to GuitarLab |
|---|---|
| Svelte compatibility | Native Svelte/SvelteKit components are preferred; HTML-only patterns are acceptable after conversion |
| Tailwind compatibility | Tailwind 4 support, CSS-first configuration and no dependency on a removed Tailwind 3 config |
| Accessibility | Keyboard support, focus management, semantic markup, ARIA patterns and reduced-motion handling; marketing claims still require our own tests |
| Theme integration | Ability to use the existing CSS variables without importing an unrelated visual identity |
| Lifecycle fit | Svelte owns state and DOM updates; DOM-scanning JavaScript that must be manually initialized/destroyed is a cost |
| Maintenance | Current documentation, releases, supported Svelte version and clear upgrade path |
| Licensing | Confirm the exact license for the copied component, paid block, icon or template; don't infer a whole-site license from a free tier |
| Product fit | Helps learners find lessons, read instructions and use musical tools; avoids distracting marketing-page effects |

No source was treated as independently WCAG-certified simply because its website describes it as accessible. GuitarLab's own browser, keyboard and assistive-technology acceptance remains authoritative.

---

## 4. Recommended shortlist

### A. Bits UI — preferred interaction foundation

**Fit: first choice for complex Svelte interaction primitives.**

Bits UI is a headless Svelte component system. Its documentation describes built-in WAI-ARIA support, keyboard navigation, focus management and screen-reader support, while leaving most styling to the application. Its current setup documentation targets Svelte 5. The repository is MIT licensed.

Use it selectively for controls that are difficult to get right with ad hoc markup: dialogs, popovers, comboboxes, listboxes, menus, tabs and other composite widgets. Keep GuitarLab-owned labels, state, classes and behaviour at the application layer.

Do not use it to wrap every native button, field, card or link. Native HTML remains simpler for ordinary controls.

Sources: [Bits UI introduction](https://bits-ui.com/docs/introduction), [Svelte 5 setup](https://bits-ui.com/docs/getting-started), [MIT repository](https://github.com/huntabyte/bits-ui).

### B. shadcn-svelte — preferred copy-in component source

**Fit: strong second choice where an editable component is more practical than building from primitives.**

shadcn-svelte is an unofficial, community-led Svelte port of shadcn/ui. It is designed for Svelte/SvelteKit, uses Bits UI and Tailwind CSS, and provides components as source files to copy into the application rather than as a conventional component package. Its repository is MIT licensed.

This model suits GuitarLab's existing token strategy: copy only the needed component, replace its default styling with semantic tokens, retain a clear local owner and test it in both themes. The cost is that copied code becomes GuitarLab code to maintain; upstream changes will not automatically update the local copy.

It is important not to confuse it with the original shadcn/ui React components. Do not run the React shadcn setup or install React/Radix packages into this Svelte repository.

Sources: [shadcn-svelte introduction](https://www.shadcn-svelte.com/docs), [project repository and license](https://github.com/huntabyte/shadcn-svelte), [original shadcn/ui documentation](https://ui.shadcn.com/docs).

### C. Skeleton — strongest full design-system alternative

**Fit: evaluate, but do not adopt wholesale at this stage.**

Skeleton is built around Tailwind and offers Svelte and React framework components, CSS-variable themes, semantic Tailwind components and interactive components built on Zag.js. Its current repository and project documentation describe Svelte 5/Tailwind 4 support and an MIT license.

Its strengths are close to GuitarLab's needs: theme tokens, responsive patterns, reusable components and a Svelte-native implementation. Its main cost is that Skeleton is an opinionated design system, not just a set of neutral primitives. Introducing it beside GuitarLab's existing semantic variables could create two parallel theme and spacing systems.

Use its documentation and theme tooling as a reference. Reconsider direct adoption only if the project chooses to standardise most shared controls on a full external system.

Sources: [Skeleton](https://www.skeleton.dev/), [Svelte fundamentals](https://www.skeleton.dev/docs/svelte/get-started/fundamentals), [theme system](https://v4.skeleton.dev/docs/svelte/design/themes), [repository](https://github.com/skeletonlabs/skeleton).

### D. Float UI — strongest direct source from the supplied list

**Fit: good for copy/adapt patterns; verify each component's Svelte variant.**

Float UI explicitly lists React, Vue, Svelte, HTML and Alpine variants, and identifies Radix Svelte among the interaction foundations. It describes the collection as free and open source. Although its overview presents much of the catalogue as React/Next-oriented, the framework list makes it more directly useful to GuitarLab than a React-only registry.

Use its Svelte or static HTML variants for navigation, forms, panels and responsive layout patterns. Do not assume every template has an equivalent Svelte version. Check the component's implementation and dependency status before reusing interactive code.

Source: [Float UI framework and component overview](https://floatui.com/components).

### E. HyperUI — strongest static app-pattern catalogue

**Fit: good for HTML/Tailwind structures.**

HyperUI supplies copy-and-paste HTML components and describes them as framework-neutral. Its repository is MIT licensed. Its FAQ currently states Tailwind CSS v4.2 compatibility, commercial use and that many—but not all—components include dark-mode variants. Most components are static HTML/CSS; any vanilla JavaScript needs to be replaced with Svelte-owned behaviour.

Useful areas include application cards, empty states, forms, filters, buttons, lists and simple dashboard structures. Audit contrast and dark/light variants for each chosen example rather than assuming the entire catalogue meets GuitarLab's standards.

Sources: [HyperUI FAQ](https://hyperui.dev/blog/faqs/), [HyperUI components](https://hyperui.dev/), [MIT repository](https://github.com/markmead/hyperui).

### F. PrebuiltUI — useful framework-neutral copy source

**Fit: good for static patterns; less direct than Float UI for Svelte.**

PrebuiltUI says its components use pure Tailwind classes, can be customised and are free for personal and commercial use. Its docs list Next.js, React, Vue and plain HTML. They do not present a native Svelte component package, but the HTML patterns can be adapted into Svelte templates.

Use it for simple cards, banners, navigation and layout ideas. Rebuild interactive behaviour in Svelte and check each component's semantic markup, keyboard operation and theme contrast.

Sources: [PrebuiltUI documentation](https://prebuiltui.com/docs), [quick start](https://prebuiltui.com/docs/quick-start).

### G. Svelte UX — specialist Svelte library discovered through Made with Svelte

**Fit: keep on the evaluation list for data-heavy or highly interactive screens.**

Svelte UX describes a collection of more than 200 Svelte components, actions, stores and utilities, with Tailwind-based styling, themes, variants, granular class overrides and slots. Its public repository is MIT licensed and actively developed. It also points to LayerChart for chart components.

This could be relevant if future Progress or analytics work needs sophisticated tables, charts or interactive visualisations. It is not necessary for lesson discovery or the shared design-system migration. Before adoption, check its current Svelte 5 and Tailwind 4 peer requirements and compare its component model with the smaller Bits UI approach.

Sources: [Svelte UX on Made with Svelte](https://madewithsvelte.com/svelte-ux), [Svelte UX repository](https://github.com/techniq/svelte-ux).

### H. Flowbite Svelte — viable, but not the default

**Fit: possible native component source after targeted testing.**

Flowbite Svelte is a native Svelte component library with a large set of common controls, sidebars, dialogs, tables and navigation components. It is MIT licensed. Its current package metadata advertises Svelte 5 and Tailwind 4 peer requirements.

It is a more complete styled system than Bits UI, so it can accelerate common controls but may bring visual defaults and Tailwind plugin/source configuration that must be reconciled with GuitarLab's tokens. Test an isolated component in both themes and at 320px before adopting it. Do not replace the application shell with Flowbite defaults.

Sources: [Flowbite Svelte documentation](https://flowbite-svelte.com/docs/pages/introduction), [current package metadata](https://github.com/themesberg/flowbite-svelte/blob/main/package.json), [MIT license](https://github.com/themesberg/flowbite-svelte/blob/main/LICENSE).

---

## 5. Source-by-source comparison

The following table covers the sites supplied for this audit. “Adapt” means use markup or ideas and rewrite behaviour in Svelte; it does not mean importing a React component.

| Source | Actual fit for this SvelteKit app | Best use | Decision |
|---|---|---|---|
| HyperUI | Framework-neutral HTML/Tailwind; v4.2; MIT; some dark variants are absent | Cards, empty states, forms, lists, application layout patterns | **Shortlist — adapt** |
| Creative Tim | Mixed templates and UI kits across frameworks; its catalogue includes only a small Svelte subset among its Tailwind offerings; licence depends on product and tier | Compare dashboard composition and visual hierarchy; assess a specific Svelte template only if needed | **Reference only** |
| Meraki UI | Static Tailwind components; MIT; RTL and dark-mode support are advertised; exact Tailwind minor compatibility was not confirmed in this review | Simple navigation, cards, forms and responsive structures | **Shortlist — adapt and verify** |
| Float UI | Explicit React, Vue, Svelte, HTML and Alpine variants; uses Radix Svelte for some Svelte interactions; free/open-source positioning | Svelte-first patterns and responsive component structures | **Shortlist — inspect each variant** |
| PrebuiltUI | Pure Tailwind/HTML, React, Vue and Next.js documented; free for personal and commercial use | Static application patterns and page sections | **Shortlist — adapt HTML** |
| Tailkits UI | HTML and React/TSX; Tailwind v4; 237 sections with 34 free MIT sections; paid code has separate commercial terms | Marketing, onboarding or public landing-page sections; reduced-motion CSS examples | **Reference only — mostly marketing-focused** |
| shadcn/ui | Original project is React-oriented; open-code model and MIT licence | Component API/design patterns; use the Svelte port instead of React files | **Reference only** |
| Aceternity UI | React/Next.js, Tailwind and Motion; free elements plus paid blocks/templates | Occasional animation or visual concept reference | **Reference only — motion-heavy for core learning UI** |
| Magic UI | React/TypeScript/Tailwind/Motion; open-source animated components | Subtle progress or feedback ideas, if they remain useful with reduced motion | **Reference only** |
| ReUI | shadcn registry for React 19 and Tailwind v4 using Base UI or Radix; free items and paid blocks/icons | Dense application component patterns and data-grid ideas | **Reference only** |
| HeroUI | React + React Aria + Tailwind v4; Apache 2.0; strong focus and keyboard patterns | Accessibility and visual interaction reference | **Reference only** |
| daisyUI | Framework-agnostic Tailwind plugin with semantic classes, 35 themes and MIT licence | Rapid theme/class experiments only | **Do not add now** — duplicates token and surface decisions |
| Flowbite | Native Flowbite Svelte package exists; MIT; current metadata supports Svelte 5 and Tailwind 4 | Standard interactive controls if Bits UI plus local styles is too time-consuming | **Secondary candidate** |
| Preline UI | Can be used with Svelte, but is a DOM-driven JavaScript plugin system that requires scans after navigation and careful instance cleanup | A specific isolated plugin where lifecycle cost is justified | **Avoid for general app components** |
| FlyonUI | Svelte setup exists, but interactive plugins use DOM initialisation/reinitialisation; some optional plugins bring additional globals and dependencies | Static patterns or a narrowly scoped plugin after lifecycle testing | **Reference only** |
| Headless UI | Official library targets React and Vue, not Svelte | Interaction design ideas | **Do not install; use Bits UI** |
| TW Elements | Large Tailwind catalogue; Svelte integration is listed; free package is MIT, but its standard quick-start still shows older Tailwind configuration conventions | Static examples; verify current Svelte and Tailwind 4 integration per component | **Reference only** |
| TailGrids | React-only component library; MIT; Tailwind app patterns | Dashboard, table, filters and card layout inspiration | **Reference only** |
| Tailwind Plus | Premium Tailwind source; HTML interactive snippets use the Tailwind Plus Elements library; a commercial licence is required for Elements | High-quality reference for HTML layouts and interaction anatomy | **Reference only; not needed** |
| Untitled UI React | React 19 + React Aria + Tailwind v4.3; open-source base components plus paid tiers; no Svelte version; terms restrict making framework ports | Visual quality and accessibility reference, not copied/ported assets | **Reference only; do not port** |
| Tailkit | Separate product from Tailkits UI; paid, Tailwind v4; HTML/React/Vue/Alpine snippets and Svelte starter kits | A possible ready-made Svelte starter if the whole project shell ever needs replacement | **Not needed for current app** |
| Made with Svelte | Directory/showcase, not a component library | Discover Svelte applications, UI kits and specialist packages such as Skeleton and Svelte UX | **Keep as a discovery source** |

### Licensing and compatibility cautions

- A provider's free examples, premium blocks, icons, Figma assets and templates can have different licences. Check the individual asset.
- Creative Tim uses product- and seat-dependent EULA tiers. Its licence allows certain commercial end products but does not permit redistribution of its source files or building competing templates/UI kits from them.
- Untitled UI React's MIT-labelled open-source components are distinct from its paid product assets. Its current licence specifically restricts publishing ports or versions for other frameworks. Do not convert or distribute those assets as Svelte components.
- Tailkits UI advertises 34 free MIT sections; its paid section code is governed by a separate commercial licence. Tailkit is a different vendor and product.
- Copying static HTML is not the same as importing an accessible component. Re-check labels, landmarks, focus order, keyboard interaction, contrast, reduced motion and responsive overflow in GuitarLab.
- Accessibility claims on marketing pages are not a substitute for our own axe/browser tests or manual keyboard and screen-reader acceptance.

---

## 6. What to use for each GuitarLab workstream

| GuitarLab area | Recommended source or implementation | Reason |
|---|---|---|
| Shared buttons, labels, plain inputs and status text | Existing local Svelte components and semantic CSS tokens | These are simple; another library would add little value |
| Dialogs, comboboxes, listboxes, popovers, menus and tabs | Bits UI, styled locally; shadcn-svelte only where a copy-in implementation saves time | Native Svelte behaviour and complex focus/keyboard handling matter more than pre-styled defaults |
| Lesson finder, filters, route cards and empty states | Local Svelte components informed by HyperUI, Float UI and PrebuiltUI | Product logic and URL/state behaviour must remain GuitarLab-owned |
| Today dashboard and Practice Studio | Local composition; use Tailwind/HTML references from HyperUI, Meraki UI and Tailkit | Preserve action-first information hierarchy rather than importing generic dashboard templates |
| Theme, surface, text and control styling | Existing Modern Music Studio semantic tokens | Avoid a competing daisyUI/Skeleton/Flowbite theme layer |
| Progress charts and large data views | First evaluate current data model and a small Svelte-native chart option; Svelte UX/LayerChart can be assessed if needed | A chart dependency should be justified by the actual visualisation, not by component catalogue size |
| Fretboard and chord diagrams | Custom SVG/Svelte components | UI kits do not encode string/fret geometry, fingering, tuning, note labels or musical accessibility correctly |
| Tuner, metronome and note recognition | Existing custom Svelte/audio modules | Preserve audio lifecycle, real-time state, permissions and assessment semantics |
| Marketing/launch visuals | Tailkits UI, Tailkit, Tailwind Plus or Creative Tim as optional references | Not a core learner workflow and not a reason to change the application shell |
| Decorative motion | CSS or Svelte-native motion, guided by reduced-motion; review Magic UI/Aceternity sparingly | Practice and lesson reading should stay calm and distraction-free |

## 7. Adoption gate for any future component

Before adding a library or copying a component into the repository:

1. Identify the specific UX tracker task it unblocks. “The library has many components” is not sufficient.
2. Confirm Svelte 5 and Tailwind 4 compatibility from current package metadata, not only a marketing page.
3. Record the component-level licence and preserve required notices.
4. Check SSR/hydration behaviour and ensure Svelte owns component state and cleanup.
5. Replace hard-coded palette values, radii and spacing with the existing Modern Music Studio variables.
6. Confirm semantic labels, keyboard operation, focus entry/return, Escape handling and screen-reader announcements.
7. Test 320, 360, 390, 768 and 1280px in both themes; include reduced-motion.
8. Keep the dependency/component only if it reduces maintenance or accessibility risk compared with native Svelte.

## 8. Research conclusion

The strongest result is not a new design library. It is a **small compositional stack**: native Svelte for product behaviour, Bits UI for difficult interaction primitives, selectively copied shadcn-svelte components where useful, and static Tailwind examples from Float UI/HyperUI/PrebuiltUI for visual patterns. The Modern Music Studio token system remains the only visual authority.

No dependency installation, UI replacement, or design-system migration was performed as part of this research. The next implementation decision should be tied to a concrete UX task and validated in a small PR after the current lesson-discovery PR's responsive acceptance blocker is resolved.

---

## 9. Primary sources reviewed

- [Bits UI](https://bits-ui.com/docs/introduction) · [Bits UI repository](https://github.com/huntabyte/bits-ui)
- [shadcn-svelte](https://www.shadcn-svelte.com/docs) · [repository](https://github.com/huntabyte/shadcn-svelte)
- [Skeleton](https://www.skeleton.dev/) · [Svelte fundamentals](https://www.skeleton.dev/docs/svelte/get-started/fundamentals)
- [Flowbite Svelte](https://flowbite-svelte.com/docs/pages/introduction) · [package metadata](https://github.com/themesberg/flowbite-svelte/blob/main/package.json)
- [Float UI](https://floatui.com/components)
- [HyperUI FAQ](https://hyperui.dev/blog/faqs/) · [repository](https://github.com/markmead/hyperui)
- [Meraki UI repository](https://github.com/merakiuilabs/merakiui)
- [PrebuiltUI](https://prebuiltui.com/docs)
- [Tailkits UI](https://tailkits.com/ui/) · [terms](https://tailkits.com/ui/terms-of-use/)
- [Tailkit](https://tailkit.com/) · [documentation](https://tailkit.com/docs)
- [Creative Tim Tailwind catalogue](https://www.creative-tim.com/templates/tailwind) · [licence](https://www.creative-tim.com/license)
- [Original shadcn/ui](https://ui.shadcn.com/docs)
- [Aceternity UI](https://ui.aceternity.com/)
- [Magic UI](https://magicui.design/docs)
- [ReUI](https://reui.io/docs)
- [HeroUI](https://heroui.co/docs)
- [daisyUI](https://daisyui.com/docs/intro/) · [themes](https://daisyui.com/docs/themes/)
- [Preline Svelte guide](https://preline.co/docs/guides/svelte.html)
- [FlyonUI Svelte integration](https://flyonui.com/docs/framework-integrations/svelte/)
- [Headless UI](https://headlessui.com/)
- [TW Elements](https://tw-elements.com/) · [licence](https://tw-elements.com/license/)
- [TailGrids](https://tailgrids.com/docs)
- [Tailwind Plus HTML documentation](https://tailwindcss.com/plus/ui-blocks/documentation/using-html)
- [Untitled UI React](https://www.untitledui.com/react) · [licence](https://www.untitledui.com/license)
- [Made with Svelte](https://madewithsvelte.com/) · [Skeleton listing](https://madewithsvelte.com/skeleton) · [Svelte UX listing](https://madewithsvelte.com/svelte-ux)
