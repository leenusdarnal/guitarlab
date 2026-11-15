# M7.2 — Jazz & Harmony Authoring Batch 2 (Weeks 5–8)

**Status:** Authored on `curriculum/jazz-harmony-weeks-05-08`; curriculum release candidate `curriculum-v1.0.6`; CI and reviewer validation pending  
**Parent release:** `curriculum-v1.0.5`  
**Scope:** Jazz & Harmony Weeks 5–8; stable lesson and week IDs preserved  
**Catalogue:** Existing 34 stable skill IDs only

## Outcomes

| Week | Lesson | Musical task and evidence |
|---:|---|---|
| 5 | Chord extensions | Spell Dm9, G13 and Cmaj9; distinguish 9 from add9; play compact partial voicings and explain intentional omissions and guide-tone movement |
| 6 | Quarter review: jazz comp | Record an uninterrupted eight-bar C-to-F ii–V–I comping study; preserve swing pulse/form, recover after slips and review one strength plus one action |
| 7 | Bossa pattern | Coordinate a steady thumb bass with selected syncopated upper-chord attacks in an explicitly labelled GuitarLab starter cell; transfer over Am7–Dm7–G7–Cmaj7 |
| 8 | Jazz blues form | Perform a basic quick-change 12-bar A blues, compare one jazz variation with applied ii–V motion and create a short A minor-pentatonic call-and-response chorus |

## Instructional and accuracy decisions

### Chord extensions

- A lead-sheet `9` chord includes the seventh; `add9` adds the ninth to a triad without implying a seventh.
- `maj9` uses a major seventh; a dominant 13 retains a minor seventh.
- Guitar voicings are partial by design. The Week 5 G13 example keeps root, third, flat seventh and 13th rather than attempting to sound a complete seven-note stack.
- The natural 11th is not added indiscriminately over a major third; the lesson identifies the potential clash and notes that omission is a common voicing choice.
- Week 5 mapping changes from `harmony.open-chords` to `harmony.seventh-chords` and `harmony.voice-leading`; no new skill is created.

### Quarter review

- Eight-bar sequence: `Dm9 | G13 | Cmaj9 | Cmaj9 | Gm7 | C13 | Fmaj9 | Fmaj9`.
- Evidence is split into form/pulse continuity, harmonic clarity, use of an extension, recording review and recovery strategy.
- A recording or a successful take is not presented as proof of long-term mastery.

### Bossa-inspired starter pattern

- The practice cell is labelled as an original GuitarLab teaching simplification, not a definitive bossa pattern or a transcription of João Gilberto.
- The exercise isolates thumb bass from the upper chord block and uses a steady even subdivision; syncopation comes from attack placement, not from turning the pulse into shuffle.
- Scholarly analysis of João Gilberto-derived patterns describes two-measure fragments, separate thumb and finger-block events, and anticipations. Those observations inform the layered design without being flattened into a universal pattern (Dahia et al., *Generating Rhythmic Accompaniment for Guitar: The Cyber-João Case Study*, 2003).

### Jazz blues

- The basic quick-change A map is `A7 | D7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7`.
- One jazz variation adds a bar-4 ii–V, a #iv diminished passing chord, applied ii–V motion in bar 8, and a ii–V turnaround. The variation remains 12 bars even where a bar contains two chords.
- The lesson explicitly identifies this as one useful variation; substitutions vary by tune and arranger.

## Research references

1. Open Music Theory 2e, “Jazz Chord Basics” — extension numbering, seventh inclusion in 9 symbols, add9 distinction and 13th-chord omissions: https://musictheory.pugetsound.edu/mt21c/JazzChordBasics.html
2. Berklee Online, “Voice Leading for Guitar” — tensions as colour tones and their contextual behaviour in ii–V–I progressions: https://online.berklee.edu/takenote/voice-leading-for-guitar/
3. Dahia, Santana, Trajano, Sandroni & Ramalho (2003), “Generating Rhythmic Accompaniment for Guitar: The Cyber-João Case Study” — two-measure bossa fragments, separate thumb and finger-block events, and anticipations: https://compmus.ime.usp.br/sbcm/2003/researchpapers/sbcm-researchpaper-2003-9.pdf
4. Open Music Theory 2e, “Blues Harmony” — basic 12-bar form and common quick changes/turnarounds: https://human.libretexts.org/Bookshelves/Music/Music_Theory/Open_Music_Theory_2e_(Gotham_et_al.)/06:_Jazz/6.08:_Blues_Harmony
5. Mark Steedman, “The Jazz Blues as a Language” — examples of varied 12-bar blues harmonisations: https://homepages.inf.ed.ac.uk/steedman/papers/music/slides5.pdf

## Release and data safeguards

- Release candidate: `curriculum-v1.0.6`, parent `curriculum-v1.0.5`.
- All 152 lesson IDs and 34 canonical skill IDs are preserved.
- Expected mapping associations: 391, a net increase of two from 389.
- No assessment profile is promoted from draft; no universal pass score or automatic mastery decision is introduced.
- Learner progress/evidence remains tied to its original immutable curriculum release. New progress uses v1.0.6; no carry-forward or rewrite is performed.

## Validation checklist

- [ ] Curriculum validator and quality advisories reviewed
- [ ] Prettier formatting passes
- [ ] Node 26 compatibility, type/Svelte checks, lint and unit tests pass
- [ ] Migration finalizer fingerprint matches the exact curriculum inputs
- [ ] Local D1 migration replay and invariant tests pass for seven immutable releases
- [ ] Browser, music-tool, accessibility and curriculum acceptance pass
- [ ] PR reviewed for mapping, chord spelling, rhythm and form accuracy before merge
