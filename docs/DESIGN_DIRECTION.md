# GuitarLab Design Direction

## Established product direction

- Name: **GuitarLab**
- Tagline: **Learn. Practise. Master.**
- Experience: a hybrid of a clear learning dashboard and an immersive practice studio.
- Personality: intelligent, focused, creative.
- Overall style: modern, premium and minimal.

## Visual principles

- Use a dark charcoal/graphite foundation with restrained violet accents as the working theme direction.
- Keep typography clean and highly legible; use a monospaced face selectively for TAB, fretboard labels, note names and tempo readouts.
- Use generous spacing and strong visual hierarchy; avoid dense panels and dashboard clutter.
- When a practice session starts, reduce navigation and visual noise so the instrument and exercise remain central.
- Use high-contrast labels and visible focus states; dark mode must not reduce accessibility.
- Avoid punitive streaks, casino-like gamification, loud gradients and decorative music-note clutter.
- Design mobile controls for hands-busy use: large tap targets, clear transport controls and a compact practice view.

## Core screen structure

1. **Dashboard:** today's practice, current target, next lesson, review queue and progress overview.
2. **Learning path:** year/phase/week navigation, prerequisites and checkpoint state.
3. **Lesson view:** concept, visual reference, guided exercise, practice piece and self-check.
4. **Practice studio:** focused timer, metronome, current drill, tempo/repetition capture and session notes.
5. **Music tools:** fretboard, chord diagrams, tuner and theory references.

## Layout behaviour

- Desktop: restrained side navigation with a wide content area; dashboard modules should prioritise the next action over vanity analytics.
- Mobile: compact navigation and a focused, full-width practice surface; never require horizontal scrolling for the core flow.
- Practice mode: hide nonessential dashboard elements and keep timer/metronome controls accessible.
- Use semantic HTML, keyboard operation, reduced-motion support and contrast-safe theme tokens.

## Status

The product-level direction and screen priorities are documented. The exact visual concept, component styling and final design tokens remain a visual-design decision before detailed UI implementation. The working palette above is a default, not a claim that a visual mockup has been approved.
