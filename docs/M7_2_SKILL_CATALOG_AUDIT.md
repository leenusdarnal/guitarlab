# M7.2 — Skill catalogue source and mapping audit

## Source of truth

The authored lesson datasets already require a non-empty `skillIds` array through `content/curriculum/lesson.schema.json`. The registry in `content/curriculum/skill-catalog.json` supplies canonical display metadata for those identifiers; it does not generate or infer lesson-to-skill relationships.

The current authored datasets contain:

- Year 1: 52 lessons, content version 1.0.0
- Year 2: 52 lessons, content version 1.0.0
- Year 3+: 48 lessons across four specialisations, content version 1.0.0
- 152 lessons total and 34 distinct skill IDs

The registry version is 1.0.0 and its local curriculum release key remains `curriculum-v1` to match existing assessment and mastery records. The category is the stable ID namespace before the first dot; display labels and descriptions are metadata only.

## Active recommendation scope

The dashboard currently advances through the Year 1 core route and the learner profile has no selected active route. Practice Studio therefore limits its skill recommendations and category coverage to skill IDs explicitly attached to Year 1 lessons that are already in progress/completed, plus the current next lesson. This avoids presenting every Year 2 and specialist skill as an immediate beginner priority.

Assessment attempts and mastery snapshots are filtered by both active learner ID and `curriculum-v1`. Practice observations are filtered by active learner ID. Exercise observation IDs are never interpreted as skill IDs, and repetitions or clean repetitions are not treated as correctness.

## Mapping quality caveats

The registry preserves authored IDs and associations; catalogue validation proves referential integrity, not pedagogical correctness. A small review sample contains apparent mismatches that need curriculum-owner confirmation before mapping changes:

| Lesson | Authored skill IDs | Why it needs review |
| --- | --- | --- |
| Year 1 Week 2 — Clear single notes | `harmony.triads`, `harmony.voice-leading` | The focus is fretting-hand basics and clean single-note tone. |
| Year 1 Week 17 — Build the major scale | `lead.major-scale`, `lead.pentatonic` | The checkpoint describes a C major scale fragment; the pentatonic association may be premature. |
| Year 1 Week 20 — Play with expression | `harmony.triads`, `harmony.voice-leading` | The focus is slides, bends, dynamics and phrasing. |
| Year 1 Week 31 — Hammer-ons and pull-offs | `technique.alternate-picking`, `technique.string-crossing`, `technique.legato` | The focus and checkpoint describe legato articulation. |
| Year 3 Rock & Blues Week 4 — Legato control | `technique.alternate-picking`, `technique.string-crossing`, `technique.legato` | The lesson focus is legato control. |

The broad `harmony.open-chords` identifier is also reused on some shell, jazz and other chord lessons. This registry does not silently reclassify those lessons or claim that every association is fully granular.

## Interpretation limits

- A catalogue entry means the curriculum names a skill; it does not mean the learner has demonstrated it.
- Category coverage counts in-scope catalogued skills with assessment history. It is not a measure of mastery.
- Measured score summaries remain unavailable when the source evidence is not explicitly measured.
- Learner-entered difficulty can suggest revisiting an exercise but cannot verify accuracy.
- Future route selection must be made explicit before recommendations expand beyond the current Year 1 route scope.
