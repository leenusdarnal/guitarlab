# M7.2 — Authored Practice Taxonomy Expansion Review 1

**Status:** Source-evidence review completed; curriculum-owner review remains a manual follow-up  
**Curriculum release:** `curriculum-v1.0.6`  
**Taxonomy:** `0.2.0` (retains the immutable `0.1.0` scope snapshot)  
**Scope:** Five exact Year 1 / Year 2 exercises; five new topics and one new technique

## Review rules

- Read the exact authored exercise instructions and success criterion, not only the lesson title or skill mapping.
- Attach each tag to the exact lesson/exercise ID used by Practice Studio.
- Use topic tags for musical content and technique tags for a described physical/coordination approach.
- Add string numbers only when the exercise explicitly names a string.
- Add fret positions/ranges only when the exercise explicitly names a position or numeric fret area.
- Do not infer misconception labels, correctness, mastery or competence from the task text.

## Exercise decisions

| Exact exercise | Added scope | Direct source evidence | Deliberately omitted |
|---|---|---|---|
| `y1-w16-lesson-music` — Fingerstyle foundation | Technique: fingerstyle thumb independence; string 6 (Low E) | The instructions assign the low E bass note to the thumb and treble notes to i–m–a, then vary treble order while preserving the bass pulse. | Treble string numbers, fret position and numeric fret range are not stated. |
| `y1-w17-lesson-focus` — Build the major scale | Topics: major-scale construction; A minor pentatonic note set | The task plays and names one octave of C major, identifies A–C–D–E–G, and creates a phrase ending on A; its success criterion includes the major-scale formula. | No specific string, fingering, box or fret position is prescribed. |
| `y1-w37-lesson-focus` — Learn a melody by ear | Topic: melody transcription by ear | The learner separates rhythm from pitch, uses a reference pitch, records note order and interval movement, and checks the independent transcription against the source. | No fixed melody notes, string set or fretboard position is specified. |
| `y2-w04-lesson-focus` — Triad inversions | Topic: triad inversions | The task plays root position, first inversion and second inversion, naming the lowest chord tone in each while preserving triad quality. | The lesson focus names a top-string set, but the focused exercise does not enumerate the actual strings or frets; no numeric location is added. |
| `y2-w30-lesson-focus` — Learn by ear: rhythm | Topic: rhythm transcription | The task records attacks, accents and rests across four bars and checks the transcription against the heard groove. | No specific strumming hand motion, string contact or fretted position is prescribed. |

## Taxonomy additions

New topics:
- `theory.major-scale-construction`
- `lead.a-minor-pentatonic-note-set`
- `ear.melody-transcription`
- `harmony.triad-inversions`
- `rhythm.groove-transcription`

New technique:
- `technique.fingerstyle-thumb-independence`

The existing `lead.a-minor-pentatonic-box-1` topic is intentionally not reused for the Week 17 note-set task. The note collection does not establish a box shape or position.

## Version compatibility

Taxonomy `0.2.0` is additive. The exact `0.1.0` dimensions and ten exercise scopes are retained as an immutable read-only snapshot. New sessions use `0.2.0`; historical observations carrying `0.1.0` are matched only against that snapshot. Coverage aggregates the same stable exercise identity across supported versions and unions the available exercise denominator per stable dimension. It never relabels an old observation with a new tag.

An unsupported taxonomy version, wrong curriculum release, unmatched lesson/exercise pair, unlinked legacy observation or other learner's record remains excluded. No learner data is migrated or rewritten.

## Acceptance and remaining review

- [x] Five exact lesson/exercise pairs are linked to direct instruction/success-criterion evidence.
- [x] No unsupported string or fret-position values are added.
- [x] Current taxonomy is versioned `0.2.0`; `0.1.0` is retained for historical matching.
- [x] Exposure read model covers old and current snapshots without treating old records as if they had new tags.
- [x] Unit tests and curriculum validation cover exact IDs, supported versions and version-specific dimensions.
- [ ] Curriculum owner / guitar educator review of musical correctness, terminology and level appropriateness.
- [ ] Broader Year 1–3 scope expansion remains a separate, evidence-reviewed batch.

**Boundary:** Exposure means at least one exact linked observation for an authored exercise. It does not mean that the learner completed the exercise, performed it correctly, retained it, or achieved proficiency.
