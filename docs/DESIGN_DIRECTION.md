# GuitarLab Design Direction

**Status:** Proposed visual-system refresh; application implementation pending  
**Last reviewed:** 15 November 2026  
**Product:** GuitarLab — personal guitar-learning and practice environment  
**Design authority:** This document defines the visual and interaction direction.  
**Related guidance:** [Implementation Guidelines](IMPLEMENTATION_GUIDELINES.md), [UI/UX Implementation Tracker](UI_UX_IMPLEMENTATION_TRACKER.md), [UI/UX Audit](UI_UX_AUDIT_2026-11-15.md)

---

## 1. Design decision

### Recommended direction: Modern Music Studio

GuitarLab should feel like a focused, modern music workspace: calm and precise enough for deliberate learning, warm enough to feel connected to an instrument, and responsive enough to work naturally beside a guitar.

This is a refinement of the existing approved hybrid, not a new product identity. Keep its useful ingredients:

- the structural clarity and interactive tools of **Modern & Interactive**;
- the material warmth and musical character of **Classic Academy**;
- the low-distraction hierarchy of **Focused Learner**.

The refresh makes those ingredients more consistent and more explicit. The interface should feel current through excellent typography, deliberate spacing, useful hierarchy, coherent navigation, carefully layered surfaces and responsive controls—not through decorative effects.

### Approaches considered

| Direction | Strength | Trade-off | Decision |
|---|---|---|---|
| **Modern Music Studio** — graphite and warm-paper surfaces, emerald primary actions, restrained teal support, champagne-gold instrument detailing, precise typography and a calm practice surface | Balances contemporary product clarity with the warmth of learning a physical instrument | Requires a disciplined token and component system across existing routes | **Recommended** |
| Bright creator platform — vivid colour, expressive gradients, large promotional artwork and energetic motion | Distinctive and immediately lively | Adds visual noise to long lessons and hands-busy practice; competes with musical content and the approved calm direction | Not recommended |
| Boutique instrument showroom — dark wood textures, full-bleed guitar photography and decorative material effects | Strong acoustic atmosphere and premium character | Makes the product feel like a shop or editorial site; photographs cannot replace accurate teaching diagrams and can slow the learning journey | Not recommended |

**Design call for this revision:** use Modern Music Studio with the GuitarLab acoustic identity. Emerald is the primary action colour, teal is the rare supporting accent, and champagne gold is reserved for decorative guitar detailing. Retain blue-neutral graphite and warm paper surfaces. Use photography as occasional atmosphere, never as a substitute for a lesson visualisation or instrument diagram.

### What success looks like

A learner should be able to answer these questions at a glance:

1. Where am I in GuitarLab?
2. What is the most useful next action?
3. What do I need to do on the guitar now?
4. Has my work been saved?
5. How do I pause, resume or leave this activity?

The interface succeeds when the learner spends attention on playing, listening and understanding—not on decoding the application.

---

## 2. Product character and experience principles

**Personality:** considered, intelligent, warm, confident, encouraging and quietly expressive.

**Never:** childish, clinical, sales-led, aggressively gamified, cluttered, intimidating or falsely celebratory.

Apply these principles to every route:

- **Action before analytics.** Put the next useful learning action ahead of charts, totals and historical summaries.
- **The instrument is the hero.** A lesson idea, chord, fretboard, rhythm or practice task should receive more visual attention than decorative UI.
- **One clear primary action.** Each page or focused panel should have one visually dominant action. Secondary actions should not compete with it.
- **Progress is evidence-led.** A completed lesson, elapsed timer or practice streak is not proof of skill mastery.
- **Reveal complexity gradually.** Keep beginner tasks approachable; expose advanced theory and controls when relevant.
- **Respect concentration.** Practice mode should remove distractions and keep essential controls reachable.
- **Make state visible.** Saving, saved, offline, unavailable, microphone permission and error states must be understandable.
- **Use the brand with restraint.** Emerald and teal identify actions and supporting emphasis; champagne gold stays in the acoustic artwork. Do not decorate every region.

---

## 3. Visual system

### 3.1 Colour palette

The implemented palette uses deep, slightly blue-neutral graphite for dark mode and warm paper for light mode. Emerald is the primary action colour, teal is a rare secondary emphasis, and champagne gold is decorative artwork only. Supporting colours remain semantic and do not become a rainbow category system.

These values are the shared semantic theme tokens shipped in `src/app.css`. Keep them centralised, use semantic CSS variables in route/component styles, and run `npm run design:validate` when changing them. Do not copy colours ad hoc into route styles.

| Semantic token | Dark target | Light target | Intended use |
|---|---|---|---|
| `--bg` | `#101318` | `#F5F4F0` | App canvas |
| `--surface` | `#171C24` | `#FFFFFF` | Main panels and navigation |
| `--surface-raised` | `#202733` | `#ECEAE3` | Nested panels, selected rows and controls |
| `--surface-overlay` | `#283241` | `#FFFFFF` | Menus, popovers and dialogs |
| `--text` | `#F1F4F7` | `#20252C` | Primary text |
| `--muted` | `#AAB4C0` | `#566170` | Supporting text that still needs to be readable |
| `--text-subtle` | `#8592A2` | `#626E7C` | Non-essential metadata only |
| `--border` | `#303A48` | `#D7DCE1` | Dividers and quiet grouping |
| `--border-strong` | `#6B7888` | `#7A8795` | Input outlines and meaningful control boundaries |
| `--primary` | `#42D6A0` | `#176B4B` | Main actions, links and active state |
| `--primary-ink` | `#20160A` | `#FFFFFF` | Text/icons on primary surfaces |
| `--secondary` | `#58CDB1` | `#176B68` | Rare supporting emphasis, theory or tool state |
| `--success` | `#8CCF76` | `#2F733F` | Successful save, completion and positive feedback |
| `--warning` | `#E9BC68` | `#805400` | Caution and recoverable attention |
| `--danger` | `#F08A80` | `#A5352B` | Destructive actions and error text |
| `--focus` | `#E7C77F` | `#16694D` | Keyboard focus indicator |

Colour rules:

- Use `--primary` for the primary action and meaningful active states, not as a general decoration.
- Keep large surfaces neutral. Do not fill every card, tab or badge with an accent colour.
- Use semantic colours with text, iconography or explanatory copy; never communicate a state by colour alone.
- Use `--border` for quiet separators only. Inputs, toggles and other controls need a boundary that remains distinguishable from the surface behind them.
- `--text-subtle` is for non-essential metadata. Never use it for lesson instructions, success criteria, form labels or important feedback.
- Avoid gradients as a default surface treatment. A subtle tonal shift may be used for a single hero or active practice surface only when it improves hierarchy.
- Maintain separate dark and light values; do not invert colours mechanically.

### 3.2 Typography

Use one dependable interface family throughout the product. Continue with the existing Inter/system sans-serif stack unless a bundled, licensed alternative is deliberately selected. Do not introduce remote font dependencies for visual polish.

Use a restrained, consistent scale:

| Role | Target size | Line height | Use |
|---|---:|---:|---|
| Display | 36–44px | 1.08–1.15 | Occasional page hero, not every route |
| Page title | 30–36px | 1.15–1.25 | Main page heading |
| Section title | 22–26px | 1.2–1.3 | Major page sections |
| Card/panel title | 17–20px | 1.3 | Group headings |
| Body / lesson copy | 16–18px | 1.55–1.75 | Instructions, explanations and learner-facing prose |
| Supporting copy | 14–16px | 1.45–1.6 | Hints, descriptions and secondary controls |
| Metadata | 12–13px | 1.4 | Dates, durations and non-essential labels |
| Musical readout | 16px minimum where practical | 1.2 | Tempo, note names and selected fret positions |

Rules:

- Essential copy must never be styled as tiny muted metadata.
- Lesson body text should default to 17px on wider reading surfaces and never fall below 16px for normal instructional text.
- Form fields must use at least 16px computed text size on mobile.
- Use weight and spacing—not all caps or constant bold—to establish hierarchy.
- Reserve letter spacing and uppercase labels for short section eyebrows, not long headings or instructions.
- Use tabular numerals for timers, BPM, durations and changing numeric values to prevent layout jitter.
- Use a monospaced face only for TAB, note names, fret positions, chord symbols where helpful and technical readouts.
- Avoid mixing decorative serif headings into some routes while the rest of the app uses unrelated heading styles. If an editorial/display face is used, reserve it for the same limited role everywhere.

### 3.3 Spacing, grid and shape

Use a predictable 4px base spacing scale:

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`

- 8px is the standard gap between tightly related controls.
- 16px is the standard internal spacing for compact panels.
- 24px separates related sections.
- 32–48px separates major page regions.
- 64px is reserved for spacious desktop transitions, not mobile content.

Layout:

- Main application content: target max width 1280px, with responsive side gutters.
- Reading surfaces: target 640–720px text measure; do not stretch lesson paragraphs across a full desktop monitor.
- Tool canvases: allow wider layouts when the instrument visualisation genuinely needs it.
- Desktop content: use a consistent 12-column grid or equivalent reusable layout primitives.
- Tablet: collapse multi-column content before controls or text become cramped.
- Mobile: one column for primary learning flows; no horizontal page scrolling at 320px and above.

Shape:

- Small controls: 8–10px corner radius.
- Inputs and compact panels: 10–12px.
- Major panels: 14–18px.
- Floating dialogs: 18–22px.
- Use pill shapes only for filters, compact status labels and segmented controls.

Do not place every heading, paragraph and row in its own rounded card. Use spacing, typography and quiet dividers to group related content. Cards are for a meaningful, bounded task or piece of information.

### 3.4 Elevation and surface treatment

Use a two-level surface model:

1. Base surface for the page and primary panels.
2. Raised surface for nested groups, selected states and interactive regions.

Reserve shadows for overlays, menus and a small number of genuinely elevated surfaces. Prefer a subtle border and tonal contrast for normal panels. Avoid permanent glassmorphism, heavy blur, bright glows, thick outlines and stacked shadows.

---

## 4. Application shell and navigation

### Desktop

- Use a restrained left navigation rail with clear text labels and a stable active state.
- Keep the primary content area wide, aligned and consistently padded.
- Keep the profile/settings entry separate from the main learning destinations.
- Use a compact top utility area only for context-specific actions, global search if implemented, and profile/theme controls.
- Avoid duplicating navigation in both a large top bar and a full sidebar.

### Mobile

Use a compact bottom navigation for the five frequent destinations:

1. Today
2. Learn
3. Practice
4. Tools
5. Progress

Songs/Library and Profile/Settings should remain reachable through a clearly labelled secondary navigation or More entry. Do not hide a core destination behind an unlabeled icon or gesture.

Mobile navigation rules:

- Respect device safe areas.
- Keep labels visible; do not make icon-only navigation the default.
- Give each destination a comfortable touch area, targeting 44–48px or more.
- Use a small, calm active indicator with the primary accent.
- Keep the active label and page title consistent.
- Ensure opening and closing secondary navigation works with keyboard, Escape and touch, with focus returned to its trigger when dismissed.

### Navigation language

Use the same learner-facing names across navigation, page headings, breadcrumbs and links:

- **Today** — the next useful action and daily plan.
- **Learn** — curriculum, lessons and guided instruction.
- **Practice** — the focused practice session.
- **Tools** — instrument, timing, tuning and musicianship tools.
- **Songs** or **Library** — repertoire and saved musical material.
- **Progress** — skill evidence, review and history.
- **Profile / Settings** — personal preferences, accessibility, privacy and backups.

Do not show internal route names, milestone IDs, raw database enums or curriculum release identifiers to learners.

---

## 5. Component design language

### Buttons

Provide a consistent button set:

- **Primary:** one dominant action per region; solid primary fill and high-contrast text.
- **Secondary:** neutral surface with a clear border.
- **Tertiary:** text or quiet icon button for low-priority actions.
- **Destructive:** explicit danger treatment, separated from routine actions and never styled like a normal primary CTA.
- **Icon button:** only for universally recognisable actions; must have an accessible name, visible focus and a generous hit area.

Primary controls should be at least 48px high where practical. Essential touch controls target 44–48px or more. Disabled states must remain legible and explain why an action is unavailable when that is not obvious.

### Inputs and selection

- Labels stay visible above or beside fields; placeholders are examples, not labels.
- Mobile input text is at least 16px.
- Selects, text inputs and sliders use the same height, radius, border, focus and disabled-state rules.
- Validation appears next to the relevant field in plain language.
- Do not interrupt typing with premature validation; validate on blur or submit when appropriate.
- Keep the currently selected option visibly selected and programmatically exposed.
- Controls used while holding a guitar need generous spacing and large hit areas.

### Panels, cards and lists

Use a panel when content forms a meaningful group, a task or a distinct state. Use plain rows for navigation, history and compact metadata. Each card should answer: what is this, why does it matter, and what can I do next?

Do not make an entire non-interactive panel look clickable. If the whole panel is interactive, provide one clear link/button target and visible hover/focus feedback.

### Tabs, filters and chips

- Use tabs only for mutually exclusive views at the same information level.
- Use filters for narrowing a result set; show active filter state and offer a clear reset.
- Use status chips sparingly and pair them with understandable text.
- Do not display a badge for information already stated in the same component.

### Feedback and overlays

- Place save/error feedback near the action that caused it.
- Use non-blocking status messages for routine saves.
- Reserve dialogs for decisions that require focus or explicit confirmation.
- Every dialog has a clear title, close/cancel action, focus handling and keyboard dismissal where appropriate.
- Do not interrupt a playing or listening task with decorative toast messages.

---

## 6. Screen-level design direction

### Today dashboard

The dashboard is a launchpad, not an analytics wall.

Order the content by immediate usefulness:

1. A concise welcome and current learner goal when known.
2. One recommended next action with a short, honest reason.
3. Today's editable plan and an obvious start/resume action.
4. Current lesson continuation or a route to browse lessons.
5. A compact review-due summary.
6. Progress context and recent history below the active work.

A new learner needs a helpful first action and a clear route into the curriculum—not empty charts, zero-filled widgets or unexplained progress terminology. Do not fabricate a current goal, streak, recommendation, duration or percentage.

### Learn and lesson discovery

- Keep lesson search prominent and easy to reach.
- Let learners search by title, topic/focus, checkpoint and route/stage.
- Make route and duration filters understandable and easy to clear.
- Show useful result counts and a clear no-results recovery action.
- Result rows/cards should prioritise lesson title, what it teaches, route/stage and estimated time.
- Make the Open lesson action visually clear without making every metadata item look like a button.
- Preserve the full authored curriculum and its ordering.

### Lesson reader

- Use a comfortable reading column with clear section hierarchy.
- Put the learning objective and musical purpose near the top.
- Distinguish explanation, demonstration, guided steps, exercise, application, correction and checkpoint visually but consistently.
- Place the main practice task close to its instructions.
- Keep the accessible alternative near the task it modifies.
- Provide compact section navigation on long lessons; on mobile it must wrap or scroll intentionally without widening the page.
- Put completion and next-step actions at the natural end of the learning sequence.
- Keep save state visible but unobtrusive. Never discard a checkpoint because another save is in flight.
- Do not replace authored lesson content with decorative filler or generic AI copy.

### Practice Studio

Practice is a focused working surface, visually distinct from browsing and settings.

- Put the current task, session state and start/pause/finish controls first.
- During an active session, de-emphasise global navigation, recommendation lists and analytics.
- Use large transport controls and clear elapsed/remaining time.
- Keep the current drill and the next useful action visible.
- Provide quick, one-handed ways to log an attempt, correction or tempo change.
- Make metronome/tuner access available in context without forcing an unnecessary route change.
- Show a clear saved/unsaved state and preserve session data during errors or reloads.
- Do not turn practice into a streak chase or reward animation loop.

### Tools

Group tools around learner intent, not internal technical architecture:

- Fretboard and notes
- Chords and harmony
- Timing and rhythm
- Tuning and reference tones
- Listening and ear training

Let the instrument diagram or active exercise lead the page. Put configuration and advanced options nearby but secondary. Explain microphone use before requesting permission; the learner initiates audio capture explicitly.

### Songs / Library

Treat repertoire as a learning resource, not a generic media feed. Prioritise level, musical goal, saved status, practice section and permitted learning references. Use real artwork only when it is legally available and genuinely useful. Do not imply that copyrighted tabs, recordings or course media are included when they are not.

### Progress

Show understandable learning evidence, not vanity metrics. Distinguish not started, insufficient evidence, practising, demonstrated/stable and review due according to the canonical skill model. Make clear what evidence supports a displayed state. A new learner should see a useful skill map without fabricated activity or mastery.

### Profile and settings

Group settings by purpose: instrument, learning preferences, practice schedule, accessibility, appearance, privacy and data/backups. Make each preference's effect clear. Avoid choices that appear configurable but are not consumed by the application.

---

## 7. Guitar-specific visualisation and media

Instrument content is a core product asset.

- Use accurate, responsive fretboard and chord-box diagrams. A decorative guitar photograph is not an instructional visualisation.
- Keep string order, pitch identity, tuning, handedness and fret numbering musically correct.
- Provide text alternatives for instrument diagrams and important visual states.
- Use readable note/fret labels; do not shrink musical labels until they become ornamental.
- Use a consistent visual grammar for root notes, other chord tones, scale degrees, muted/open strings and finger positions.
- Audio playback must be explicitly user-initiated, explain its state and release resources cleanly.
- Use real acoustic/electric guitar photography selectively for an occasional welcome or editorial surface. Avoid generic stock photos of people holding guitars.
- Do not use random music-note patterns, waveforms or instrument illustrations as decoration without a clear information purpose.

---

## 8. Motion and interaction feedback

Motion should confirm an action or explain a state change—not entertain the learner.

- Use short transitions, generally 120–180ms, for hover, focus, selection and small panel changes.
- Use slightly longer transitions only when a layout change needs explanation.
- Avoid bouncing, elastic overshoot, parallax and continuously animated decoration.
- Beat pulses and tuning feedback must communicate musical state and remain usable with reduced motion.
- Respect `prefers-reduced-motion`; never rely on motion alone to communicate state.
- Keep focus stable after save, list update, menu dismissal and route transition.
- Avoid layout shifts when values change, especially BPM, timers, note names and result counts.

---

## 9. Accessibility and hands-busy use

Accessibility is part of the design system, not a final polish pass.

- Meet WCAG 2.2 AA for applicable text, interaction, focus, reflow and non-text contrast criteria.
- Normal text needs at least 4.5:1 contrast; large text needs at least 3:1.
- Meaningful control boundaries and focus indicators need sufficient non-text contrast; target at least 3:1 against adjacent colours.
- Provide visible keyboard focus, logical focus order, skip navigation and semantic landmarks.
- Use at least 16px text in mobile form controls.
- Target 44–48px or more for primary and hands-busy touch controls; never fall below applicable WCAG target-size requirements without a documented exception.
- Do not rely on colour, sound, position or motion alone to convey an important result.
- Provide accessible names and concise state announcements for audio controls, tuner results, metronome controls and dynamic feedback.
- Keep high-frequency audio readings visual; announce meaningful state changes rather than every analyser update.
- Support browser zoom and text resizing without clipping or horizontal page scroll.
- Ensure controls can be used with one hand while the other holds a guitar where the task allows it.
- Provide captions, written demonstrations or text fallbacks when audio/video is unavailable.

---

## 10. Responsive behaviour

Treat 320px as a hard lower-width acceptance target for the core app.

| Range | Layout expectation |
|---|---|
| 320–389px | Single-column learning flow; compact headers; filters stack; controls remain reachable |
| 390–767px | Mobile layout with comfortable reading width and bottom navigation |
| 768–1023px | Tablet layout; collapse the desktop rail and multi-column panels before they become cramped |
| 1024px and wider | Full desktop navigation and wider multi-column layouts where they improve scanning |

Responsive rules:

- No page-level horizontal overflow at 320, 360, 390, 768 or 1280px.
- Only deliberately horizontal content (for example, a labelled fretboard range or chip list) may scroll within its own bounded region, with an accessible alternative.
- Never solve overflow by clipping important text or hiding content.
- Use safe-area insets for fixed mobile navigation and transport controls.
- Sticky controls must not cover the current lesson instruction, form field or focused item.
- Test both themes at the same viewport widths.

---

## 11. Content and microcopy

Use plain, direct, encouraging language. Be specific about what the learner can do next.

Prefer:
- “Practise this”
- “Resume lesson”
- “Saved on this device”
- “Try a slower tempo”
- “Not assessed yet”
- “Review suggested because…”

Avoid:
- raw IDs and enums;
- internal milestone, build or catalogue version labels;
- generic “Success!” messages with no explanation;
- unexplained confidence percentages;
- claims that a learner has mastered something solely because a task was completed;
- shame, pressure, punitive streak language or guilt-driven reminders.

Use **Practise** consistently in learner-facing copy, matching the product's established language.

---

## 12. Data integrity and product boundaries

Visual design must never create a false product promise.

- Preserve all 152 authored lessons across the existing six routes, their stable IDs, ordering, prerequisites, authored text and learning outcomes.
- Do not create placeholder progress, invented recommendations, fake percentages, sample learner histories or fabricated backup timestamps.
- Keep lesson completion, practice observations, assessment results and skill mastery visibly and technically distinct.
- Do not imply cloud sync or account protection while data is stored only on the current device.
- Keep learner data inside the existing private local-data boundary unless a separately reviewed architecture change is approved.
- Microphone and recording access remains opt-in and user initiated.
- Do not copy copyrighted course videos, tabs, books or recordings into the interface without permission.
- Any visual mockup or sample data must be explicitly labelled as illustrative and must not be copied into production content.

---

## 13. Implementation guidance and migration

This document defines the current visual system and implementation guidance. The semantic theme values in `src/app.css` follow the palette in section 3.1; route-level refinements remain tracked in the UI/UX implementation tracker.

Implement the refresh incrementally, using the ordered work in the [UI/UX Implementation Tracker](UI_UX_IMPLEMENTATION_TRACKER.md):

1. Establish semantic tokens, theme behaviour, type roles, spacing and control boundaries.
2. Standardise the application shell, desktop rail, mobile navigation and shared controls.
3. Apply the design system to Today, Learn and the lesson reader.
4. Rework Practice Studio around the active task and session controls.
5. Apply the same patterns to Tools, Songs, Progress and Settings.
6. Run responsive, accessibility, keyboard, offline and learner acceptance checks before declaring a task complete.

Do not rewrite all routes in one large change. Each implementation slice should preserve existing behaviour and be independently testable. If a proposed visual treatment conflicts with curriculum correctness, learner privacy, audio permission or accessibility, preserve the product boundary and revise the treatment.

### Token migration requirements

- Implement semantic tokens in one shared theme source.
- Keep component styles dependent on semantic tokens, not raw hex values.
- Add explicit tokens for control boundaries, subtle text and overlay surfaces.
- Validate text and control contrast in both themes with `npm run design:validate`.
- Update the checker when new semantic roles are introduced; do not loosen existing thresholds to make a palette pass.
- Verify real component pairings, not only isolated token pairs.

---

## 14. Acceptance checklist

A design-system implementation is ready for review only when:

- [ ] Dark and light themes use the approved semantic token names consistently.
- [ ] Normal text, muted text, primary actions and interactive control boundaries meet contrast requirements.
- [ ] The app uses a consistent type scale and readable lesson copy.
- [ ] Mobile form controls use at least 16px text.
- [ ] Spacing, content widths, radii and panel treatments are consistent across routes.
- [ ] Desktop and mobile navigation expose the same product destinations coherently.
- [ ] Every page has one clear primary action or an intentional focused state.
- [ ] Practice mode reduces distraction and keeps essential controls reachable.
- [ ] Instrument diagrams remain accurate, responsive and understandable without colour alone.
- [ ] Keyboard focus, screen-reader names, reduced motion and save/error states are included.
- [ ] No core route has horizontal page overflow at 320px or wider.
- [ ] The 152 lessons, six routes, stable identifiers and learning evidence semantics remain unchanged.
- [ ] Automated checks pass and outstanding physical-device/screen-reader checks are recorded honestly.

**A visual refresh is not complete because the screens look consistent in a mockup. It is complete when learners can find, understand and use the next learning action on real screen sizes without losing data or musical meaning.**

---

## 15. Change log

| Date | Change |
|---|---|
| 2026-11-15 | Replaced the broad hybrid direction with a detailed Modern Music Studio visual and interaction system, including theme tokens, typography, layout, navigation, component patterns, screen guidance, accessibility and migration acceptance. |
| 2026-11-16 | Adopted the GuitarLab acoustic brand palette: emerald primary, teal supporting accent and champagne-gold decorative instrument detailing. Reconciled the semantic token table with `src/app.css`. |
