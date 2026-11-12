# GuitarLab UI/UX audit and implementation notes

**Reviewed baseline:** `main` at `42c109180a41cd6f6694db15bad18c7018fdaa65` (12 November 2026).  
**Implementation branch:** `chore/ui-ux-audit-improvements`  
**Scope:** learner-facing interface, navigation, interaction feedback, responsive behaviour and accessibility. No backend, storage model, music-domain or deployment changes are included.

## Summary

GuitarLab already has a coherent visual direction: graphite/dark surfaces with a supported light theme, semantic design tokens, an amber primary action, reduced-motion handling and visible focus styling. The strongest next UX improvements are consistency and interaction quality rather than a new visual identity.

This first slice addresses three shared interaction issues and one curriculum-navigation issue:
- Apply the saved light/dark theme from the application layout, so deep links to tools and lessons honour the learner's preference.
- Add a global keyboard skip link to bypass persistent notices and navigation.
- Make the dashboard's mobile navigation focus-aware, close it with Escape, restore focus to the trigger when dismissed, and keep the menu scrollable on short screens.
- Render the already-styled curriculum quick-jump navigation so learners can move between the six routes without repeatedly scrolling through the long curriculum.

## Findings

### Addressed in this slice

| Finding | UX impact | Change |
|---|---|---|
| Theme was read only by the dashboard route | Opening a tool or lesson directly could show the default dark theme even when light theme was saved | Shared layout applies saved theme on mount, with a safe dark fallback when storage is unavailable |
| No site-wide skip-to-content affordance | Keyboard users had to traverse notices and route navigation before reaching the page | Global Skip to main content link focuses the main content wrapper |
| Mobile navigation lacked keyboard focus management and Escape dismissal | Keyboard and switch users could open a menu without a predictable focus destination or easy dismissal | Opening focuses the first link; Escape closes and restores focus; all links close the menu; the panel can scroll within short viewports |
| Curriculum contained six long route sections without quick-jump links | Moving between core and specialist curricula required extended scrolling | Added one in-page jump link per route using the existing responsive chip styling |

### Remaining design and usability backlog

1. **Consistent application navigation.** The dashboard has a persistent sidebar/header, while most secondary screens use a back link. Define a shared responsive app shell for dashboard, curriculum, lesson, practice and tools pages, with clear current-section state and a consistent home route. Preserve focused practice surfaces where a reduced chrome mode is useful.
2. **Theme control beyond the dashboard.** Theme persistence now works on every route, but the visible theme toggle still lives only in the dashboard top bar. Move the control into the shared shell when that shell is implemented; do not duplicate multiple inconsistent toggles across every page.
3. **Typography and information hierarchy.** Several screens use 8–10px eyebrow/meta labels and 10–12px supporting copy. Review the actual rendered component contexts and raise essential labels, helper text and dense lesson metadata to comfortable sizes, retaining small type only for genuinely secondary metadata.
4. **Lesson reader orientation.** Add a compact sticky lesson outline/progress navigation for long lessons, with current-section indication and clear previous/next actions. Ensure it does not obscure the lesson content on mobile or when browser zoom is increased.
5. **Practice Studio focus.** Keep session state, timer and primary transport actions prominent; visually distinguish pause, resume and finish. Consider an optional low-distraction practice view without removing access to essential controls or status.
6. **Music-tool ergonomics.** Continue mobile work on fretboard navigation (a movable visible fret window, explicit string/fret selection feedback and comfortable controls). Keep the 24-fret diagram's horizontal scrolling contained within the diagram, not the whole page.
7. **Feedback consistency.** Standardise saved, saving, offline, error and disabled states across onboarding, data/backup, lesson progress, practice and tools. Messages should explain what was saved and whether learner progress changed.
8. **Accessibility verification.** Add automated axe checks to representative dashboard, curriculum, lesson, onboarding, practice and tool pages; include keyboard-only, zoom/reflow, screen-reader landmark and colour-theme checks. The existing token contrast script is useful but does not prove component-level accessibility.
9. **Small-screen and touch testing.** Expand browser checks to 320px, 390px, tablet, landscape and 200% zoom. Conduct physical iOS Safari and Android Chrome testing before release sign-off.

## Validation plan

- Browser acceptance verifies the skip link, direct-link theme application, mobile menu focus/Escape behaviour, and curriculum route jumping.
- Existing dashboard, lesson, backup/restore, music-tool and curriculum browser acceptance suites remain in place.
- Run formatting, lint, Svelte/TypeScript checks, unit tests, curriculum and design-token validation, and production Worker build in CI.
- These browser checks are Chromium automation. They do not replace assistive-technology testing or physical-device acceptance.

## Guardrails

- Keep the approved GuitarLab visual direction; no wholesale rebrand or decorative redesign.
- Maintain dark and light themes, keyboard access, reduced motion, readable contrast and 44px-class primary touch affordances where practical.
- Keep local-first and privacy explanations visible and accurate.
- Never represent a selected plan, elapsed time or lesson completion as proof of skill mastery.
- Make small, independently testable UI changes and do not bundle unrelated backend, curriculum-domain or deployment work into UI/UX changes.
