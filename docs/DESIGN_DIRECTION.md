# GuitarLab Design Direction

## Approved product direction

- Name: **GuitarLab**
- Tagline: **Learn. Practise. Master.**
- Experience: a hybrid of a clear learning dashboard and an immersive practice studio.
- Personality: intelligent, focused, creative and encouraging.
- Overall style: modern, premium, minimal and musically warm.

The approved direction combines:
- **Modern & Interactive:** clear structure, interactive fretboard/chord tools and strong information hierarchy.
- **Classic Academy:** authentic acoustic-guitar imagery, warm instrument details and a welcoming musical atmosphere.
- **Focused Learner:** calm layouts, restrained visual noise and attention on the next useful practice action.

This hybrid is the approved direction for implementation. The generated concept images are inspiration, not a binding pixel-perfect reference. Their placeholder labels, progress figures, dates, counts or curriculum groupings are not product data. The repository's authored curriculum and specifications remain authoritative.

## Visual principles

- Use a deep graphite/charcoal foundation with a fully supported light theme.
- Use warm amber/orange as the primary action accent. Use violet/blue sparingly for supporting tools and categories.
- Use real acoustic-guitar imagery selectively; prioritise accurate diagrams, fretboard graphics and readable lesson content over decorative photos.
- Use clean, highly legible typography. A monospaced face may be used selectively for TAB, note names, fret positions and tempo readouts.
- Define semantic colour tokens for background, surface, text, muted text, border, focus, primary, secondary, success, warning and error. Test all relevant foreground/background pairings in both themes.
- Use generous spacing and strong hierarchy. Do not turn every section or item into a separate card.
- Avoid loud gradients, casino-like reward loops, excessive badges, punitive streaks and decorative music-note clutter.
- Encouragement should be calm, specific and tied to useful learning evidence.
- Practice mode should reduce navigation and visual noise so the instrument, current drill and essential controls remain central.
- Provide visible focus states, reduced-motion support and accessible contrast.

## Core screen structure

1. **Home / Today:** learner-specific next practice action, today's editable plan, current lesson, review queue and a compact progress summary.
2. **Learn:** curriculum map, lesson content, visual/audio/text demonstrations, exercises and checkpoints.
3. **Practice:** focused studio, editable routines, timer, metronome, tempo/repetition capture and short reflection.
4. **Tools:** interactive fretboard, note/interval/scale views, chord diagrams, tuner/reference tones and theory references.
5. **Songs / Library:** repertoire by level, saved songs, riffs, practice sections and permitted external resources.
6. **Progress:** skill states, assessment evidence, review schedule, practice history, recordings and export/restore.
7. **Profile / Settings:** instrument setup, handedness, schedule, goals, lesson presentation preferences, practice emphasis, accessibility and privacy.

## Personalisation in the interface

- The dashboard must be rendered from the active learner profile; never hard-code a particular guitar, session duration, goal, lesson, week, percentage or streak.
- A new profile begins at zero progress and Year 1 Week 1 unless the learner completes a new in-app placement activity.
- Show the learner why a practice task was recommended and let them edit, postpone or dismiss it.
- Offer editable lesson presentation choices: balanced, visual-first, demonstration/audio-first, text-first, interactive/drill-first and song-first.
- Offer editable session lengths (10, 20, 40 minutes and custom) and saved routine templates.
- Do not force an all-round learner to practise every skill domain in every short session. Balance skills over a longer planning window.
- Profile values and practice state are private learner data, not part of shared curriculum content.

## Layout behaviour

- **Desktop:** restrained side navigation with a wide content area. Prioritise the next action over vanity analytics.
- **Mobile:** compact navigation and a focused, full-width practice surface. Never require horizontal scrolling for a core learning flow.
- **Practice mode:** keep the active drill and essential timer/metronome controls reachable; hide nonessential dashboard elements.
- **Hands-busy use:** use large tap targets, clear transport controls and short, understandable labels.
- **Accessibility:** semantic HTML, keyboard operation, visible focus, reduced motion, readable labels for audio controls and contrast-safe theme tokens.
- **Resilience:** design saved/unsaved, offline, loading, empty, error and microphone-permission states.

## Design-system preparation

Define semantic tokens for backgrounds, surfaces, borders, text, focus, accent, success, warning and error. Define type roles, spacing scale, radii, motion durations, focus ring, minimum touch target and responsive breakpoints. Keep exact token values in the code design system and document them after contrast testing.

## Status

The hybrid visual direction is approved. Detailed token values, component styling and responsive screen specifications should be implemented from [Implementation Guidelines](IMPLEMENTATION_GUIDELINES.md). The product is ready to proceed to implementation planning; no additional Work-mode design workflow is a prerequisite.
