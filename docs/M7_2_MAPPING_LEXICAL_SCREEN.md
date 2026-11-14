# M7.2 — Advisory Lexical Evidence Screen for Lesson Mappings

**Status:** Automated screening complete; manual curriculum review remains open  
**Source:** Three authored lesson JSON datasets on `feat/m7-skill-catalog-adaptive-practice`  
**Scope:** 152 lessons, 341 lesson-to-skill associations, 34 catalogue skills

## 1. Result

A deterministic phrase scan was run across the authored lesson content (focus, objectives, explanation, lesson blocks, demonstrations, exercises, success criteria, checkpoint, practice examples and other text fields). The scan searched for a small skill-specific phrase set for each assigned skill.

- **64 of 152 lessons** have at least one mapped skill with no phrase match in the authored text.
- **74 of 341 associations** were flagged for manual inspection.
- The 74 flags are concentrated in six IDs: `harmony.open-chords` (32), `harmony.triads` (10), `harmony.voice-leading` (10), `ear.rhythm` (8), `fingerstyle.thumb-independence` (7), and `lead.pentatonic` (7).

This is a screening signal, **not a semantic judgement**. A lesson may teach a capability without using the exact phrase searched. For example, thumb independence may be taught through a steady bass pattern while treble notes vary; a limited phrase list can miss that. Therefore none of the 74 associations should be removed automatically.

## 2. Screening phrase dictionary

| Skill ID | Phrases searched |
|---|---|
| `harmony.open-chords` | open chord |
| `harmony.triads` | triad, inversion |
| `harmony.voice-leading` | voice leading, common tone, smooth voice |
| `ear.rhythm` | rhythm by ear, hear a rhythm, rhythmic pattern |
| `fingerstyle.thumb-independence` | thumb independence, independent thumb, bass notes while, thumb while |
| `lead.pentatonic` | pentatonic |

The scanner also checked vocabulary for the other 28 skill IDs; no missing-phrase flags were raised for those IDs under this dictionary. This does not certify those mappings as correct.

## 3. Highest-priority review groups

| Priority | Finding | Recommended review |
|---|---|---|
| P0 | Year 1 Week 2 and Week 20: two harmony associations each had no supporting lesson content located during full focused inspection | Resolve with curriculum-owner approval; see `M7_2_FLAGGED_MAPPING_REVIEW.md` |
| P1 | `harmony.open-chords` is used in 33 lessons; 32 associations have no explicit “open chord” phrase in the authored content | Review scope/granularity. Some lessons cover triads, barre chords, seventh chords, extensions, chord melody or reharmonisation; confirm the association is genuinely an open-position chord outcome |
| P1 | `harmony.triads` and `harmony.voice-leading` each have 10 screened associations | Check that chord tones, triad construction/inversions, or voice movement are explicitly taught or assessed; look for equivalent terminology before deciding |
| P2 | `ear.rhythm` has 8 screened associations | Distinguish rhythm transcription/listening from pitch/melody transcription |
| P2 | `fingerstyle.thumb-independence` has 7 screened associations | Inspect whether the thumb/bass role is required to remain independent as upper notes change |
| P2 | `lead.pentatonic` has 7 screened associations | Confirm a pentatonic pattern or application task appears in each lesson, especially in blues/bending contexts |

## 4. Lesson review queue

| Year | Lesson ID | Lesson title | Skill associations without a phrase match | Flag count |
|---|---|---|---|---:|
| Year 1 | `y1-w02-lesson` | Clear single notes | `harmony.triads`, `harmony.voice-leading` | Multiple associations |
| Year 1 | `y1-w04-lesson` | First chord shapes | `harmony.open-chords` | One association |
| Year 1 | `y1-w06-lesson` | First complete chord loop | `harmony.open-chords` | One association |
| Year 1 | `y1-w09-lesson` | Add C, Am and Dm | `harmony.triads`, `harmony.voice-leading` | Multiple associations |
| Year 1 | `y1-w16-lesson` | Fingerstyle foundation | `fingerstyle.thumb-independence` | One association |
| Year 1 | `y1-w18-lesson` | Shell chords: roots and guide tones | `harmony.open-chords` | One association |
| Year 1 | `y1-w19-lesson` | Your first 12-bar blues | `lead.pentatonic` | One association |
| Year 1 | `y1-w20-lesson` | Play with expression | `harmony.triads`, `harmony.voice-leading` | Multiple associations |
| Year 1 | `y1-w21-lesson` | Movable power chords | `harmony.open-chords` | One association |
| Year 1 | `y1-w22-lesson` | Approach barre chords safely | `harmony.open-chords` | One association |
| Year 1 | `y1-w26-lesson` | Triads on the top strings | `harmony.open-chords` | One association |
| Year 1 | `y1-w27-lesson` | Chords in keys | `harmony.open-chords` | One association |
| Year 1 | `y1-w29-lesson` | Suspended and seventh chords | `harmony.open-chords` | One association |
| Year 1 | `y1-w35-lesson` | Arpeggios and chord tones | `harmony.open-chords` | One association |
| Year 1 | `y1-w37-lesson` | Learn a melody by ear | `ear.rhythm` | One association |
| Year 1 | `y1-w39-lesson` | Blues turnarounds | `lead.pentatonic` | One association |
| Year 1 | `y1-w41-lesson` | Jazz chord grips | `harmony.open-chords` | One association |
| Year 1 | `y1-w42-lesson` | The ii-V-I connection | `harmony.open-chords` | One association |
| Year 1 | `y1-w47-lesson` | Chord melody basics | `harmony.open-chords` | One association |
| Year 2 | `y2-w04-lesson` | Triad inversions | `harmony.open-chords` | One association |
| Year 2 | `y2-w05-lesson` | Minor triad inversions | `harmony.open-chords` | One association |
| Year 2 | `y2-w07-lesson` | Power-chord accuracy | `harmony.open-chords` | One association |
| Year 2 | `y2-w09-lesson` | Barre chord refresh | `harmony.open-chords` | One association |
| Year 2 | `y2-w10-lesson` | A-shape barre chords | `harmony.open-chords` | One association |
| Year 2 | `y2-w20-lesson` | Bends and vibrato | `lead.pentatonic` | One association |
| Year 2 | `y2-w21-lesson` | Blues turnaround | `lead.pentatonic` | One association |
| Year 2 | `y2-w23-lesson` | Fingerstyle bass independence | `fingerstyle.thumb-independence` | One association |
| Year 2 | `y2-w24-lesson` | Fingerstyle pattern changes | `fingerstyle.thumb-independence` | One association |
| Year 2 | `y2-w25-lesson` | Fingerstyle melody balance | `fingerstyle.thumb-independence` | One association |
| Year 2 | `y2-w29-lesson` | Song form and sections | `harmony.triads`, `harmony.voice-leading` | Multiple associations |
| Year 2 | `y2-w30-lesson` | Learn by ear: rhythm | `ear.rhythm` | One association |
| Year 2 | `y2-w31-lesson` | Learn by ear: bass | `ear.rhythm` | One association |
| Year 2 | `y2-w32-lesson` | Learn by ear: melody | `ear.rhythm` | One association |
| Year 2 | `y2-w33-lesson` | Chord melody II | `harmony.open-chords` | One association |
| Year 2 | `y2-w35-lesson` | Music theory: intervals | `harmony.open-chords` | One association |
| Year 2 | `y2-w36-lesson` | Build seventh chords | `harmony.open-chords` | One association |
| Year 2 | `y2-w37-lesson` | Chord extensions | `harmony.open-chords` | One association |
| Year 2 | `y2-w38-lesson` | Chord substitution | `harmony.open-chords` | One association |
| Year 2 | `y2-w41-lesson` | Jazz ii-V-I voice leading | `harmony.open-chords` | One association |
| Year 2 | `y2-w44-lesson` | Jazz blues | `lead.pentatonic` | One association |
| Year 2 | `y2-w46-lesson` | Practice architecture | `harmony.triads`, `harmony.voice-leading` | Multiple associations |
| Year 2 | `y2-w47-lesson` | Transcribe a phrase | `ear.rhythm` | One association |
| Year 3+ | `y3-rock-blues-w03-lesson` | Bends to pitch | `lead.pentatonic` | One association |
| Year 3+ | `y3-rock-blues-w07-lesson` | Chord-tone soloing | `harmony.open-chords` | One association |
| Year 3+ | `y3-rock-blues-w10-lesson` | Phrasing and silence | `harmony.triads`, `harmony.voice-leading` | Multiple associations |
| Year 3+ | `y3-fingerstyle-acoustic-w01-lesson` | Right-hand independence | `fingerstyle.thumb-independence` | One association |
| Year 3+ | `y3-fingerstyle-acoustic-w02-lesson` | Arpeggio consistency | `fingerstyle.thumb-independence` | One association |
| Year 3+ | `y3-fingerstyle-acoustic-w03-lesson` | Alternating bass | `fingerstyle.thumb-independence` | One association |
| Year 3+ | `y3-fingerstyle-acoustic-w04-lesson` | Chord melody basics | `harmony.open-chords` | One association |
| Year 3+ | `y3-fingerstyle-acoustic-w05-lesson` | Sus and add9 colour | `harmony.triads`, `harmony.voice-leading` | Multiple associations |
| Year 3+ | `y3-fingerstyle-acoustic-w08-lesson` | Moving bass lines | `harmony.triads`, `harmony.voice-leading` | Multiple associations |
| Year 3+ | `y3-fingerstyle-acoustic-w10-lesson` | Open-string colour | `harmony.triads`, `harmony.voice-leading` | Multiple associations |
| Year 3+ | `y3-jazz-harmony-w01-lesson` | Jazz chord grips | `harmony.open-chords` | One association |
| Year 3+ | `y3-jazz-harmony-w03-lesson` | Guide tones | `harmony.open-chords` | One association |
| Year 3+ | `y3-jazz-harmony-w04-lesson` | ii-V-I in two keys | `harmony.open-chords` | One association |
| Year 3+ | `y3-jazz-harmony-w05-lesson` | Chord extensions | `harmony.open-chords` | One association |
| Year 3+ | `y3-jazz-harmony-w08-lesson` | Jazz blues form | `lead.pentatonic` | One association |
| Year 3+ | `y3-jazz-harmony-w09-lesson` | Chord-tone soloing | `harmony.open-chords` | One association |
| Year 3+ | `y3-jazz-harmony-w10-lesson` | Tune learning workflow | `ear.rhythm` | One association |
| Year 3+ | `y3-jazz-harmony-w11-lesson` | Reharmonisation | `harmony.open-chords` | One association |
| Year 3+ | `y3-all-round-musician-w01-lesson` | Listening journal | `ear.rhythm` | One association |
| Year 3+ | `y3-all-round-musician-w02-lesson` | Ear intervals | `ear.rhythm` | One association |
| Year 3+ | `y3-all-round-musician-w04-lesson` | Harmony analysis | `harmony.open-chords` | One association |
| Year 3+ | `y3-all-round-musician-w11-lesson` | Teaching a skill | `harmony.triads`, `harmony.voice-leading` | Multiple associations |

## 5. Audit handling rules

1. Read the complete lesson content before changing any association.
2. Record the exact exercise, teaching passage or checkpoint that supports each skill.
3. If the concept is taught but the title/focus omits it, consider clarifying the lesson outcome before changing the mapping.
4. If the skill is incidental, remove the association only after curriculum-owner review.
5. If no current skill describes an important outcome, document the gap separately; do not force-fit an unrelated ID.
6. Keep the current learner evidence and curriculum release stable while mappings are reviewed.

**Next action:** Start with the 32 `harmony.open-chords` flags because the high reuse suggests the greatest risk of a broad category-like skill label being used as a general harmony tag. Then resolve the remaining P1 and P2 groups through full lesson-content review.
