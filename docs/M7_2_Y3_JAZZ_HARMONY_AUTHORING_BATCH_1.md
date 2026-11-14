# M7.2 — Jazz & Harmony Authoring Batch 1 (Weeks 1–4)

**Status:** Draft implementation; release migration and full validation pending  
**Dataset:** `year-3-specialisation-lessons.json` version `1.0.4`  
**Scope:** Jazz & Harmony Weeks 1–4; stable lesson and week IDs preserved  
**Skill catalogue:** Existing 34 identifiers only

## Outcomes

| Week | Lesson | Musical task and evidence |
|---:|---|---|
| 1 | Jazz chord grips | Compact Dm7–G7–Cmaj7 voicings; identify chord tones, control excluded strings, then transfer to Gm7–C7–Fmaj7 |
| 2 | Swing subdivision | Maintain an even quarter-note pulse while creating a flexible long–short eighth-note feel; transfer between tempos and contexts |
| 3 | Guide tones | Connect thirds and sevenths through Dm7–G7–Cmaj7, including common-tone and semitone movement; transfer to F |
| 4 | ii–V–I in two keys | Spell and comp Dm7–G7–Cmaj7 and Gm7–C7–Fmaj7 with clear chord qualities and guide-tone movement |

## Authoring changes

Each lesson now has three task-specific objectives, a focused explanation and worked example, step-by-step demonstration, five lesson blocks, four practice stages, task-matched musical application, observable success criteria, common-error corrections, an accessible alternative and retrieval prompts.

## Mapping decisions

- Week 1: `harmony.seventh-chords`, `harmony.voice-leading`
- Week 2: `rhythm.pulse`, `rhythm.subdivision`
- Week 3: `harmony.voice-leading`, `harmony.seventh-chords`
- Week 4: `harmony.seventh-chords`, `harmony.voice-leading`

The prior generic `harmony.open-chords` associations were removed because the lessons assess seventh-chord quality and functional voice leading, not open-chord formation. No new skill identifier or assessment profile was created.

## Accuracy notes

- Dm7 = D–F–A–C; G7 = G–B–D–F; Cmaj7 = C–E–G–B.
- Gm7–C7–Fmaj7 is the corresponding ii–V–I in F.
- The swing lesson explicitly treats swing ratio as context- and tempo-dependent rather than prescribing a universal fixed ratio.
- Guide-tone examples identify the thirds and sevenths and distinguish common tones from semitone resolutions.

## Remaining before merge

- [ ] Add immutable `curriculum-v1.0.5` release manifest and migration seed.
- [ ] Run curriculum validator, format, type checks, unit tests and full CI.
- [ ] Review chord voicings and voice-leading against the standard tuning/fretboard.
- [ ] Continue with Jazz & Harmony Weeks 5–8 in a separate batch.

No learner progress is migrated or rewritten. Existing release records remain immutable.
