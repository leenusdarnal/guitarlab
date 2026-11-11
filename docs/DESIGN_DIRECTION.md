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


## Interaction and feedback refinements

- Every recommended practice task should state why it was selected and remain editable by the learner.
- Offer a short practice route as a first-class option; do not make a 40-minute session feel mandatory.
- Practice transport, timer and metronome controls should remain reachable in focused practice mode.
- Show accuracy and speed as separate measures. Use exercise-specific criteria rather than a generic score.
- Saving a session should be quick and should not force a long reflection form.
- Setup preferences must cover left/right handedness and the active guitar tuning. Mirror fretboard diagrams when appropriate while preserving pitch/string identity.
- Offline readiness and save/sync state must be understandable at a glance.

## Design-system preparation

Define semantic tokens for backgrounds, surfaces, borders, text, focus, accent, success, warning and error. Tokens must have tested contrast pairings in both themes. Define type roles, spacing scale, radii, motion durations, focus ring, minimum touch target and responsive breakpoints in the selected visual concept.

The exact token values, typography choices and component look remain unapproved until the visual-concept selection gate is completed.