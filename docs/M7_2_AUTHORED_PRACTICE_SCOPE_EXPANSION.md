# M7.2 — Authored practice taxonomy expansion

**Date:** 2026-11-14  
**Curriculum release:** `curriculum-v1.0.6`  
**Taxonomy:** `0.3.0`  
**Baseline:** taxonomy `0.2.0` contains 15 reviewed exercise scopes.

## Decision rule

A scope is added only when the exact exercise instructions or success criterion directly name the topic, technique, string numbers, fret range or position. Lesson titles, generic exercise templates and adjacent context are not used to infer tags. Unknown lower bounds, strings and fret positions remain unassigned.

## Added exercise scopes

Nine new scopes are added to the 15-scope v0.2.0 catalogue. Fingerstyle thumb independence on `y1-w16-lesson-music` was already included in v0.2.0 and is retained unchanged.

| Lesson / exercise | Authored evidence | Scope added |
|---|---|---|
| `y1-w13-lesson-music` | “G-D string answer melody (TAB core; staff optional)”; success criterion names G- and D-string notes | TAB reading; strings 3 and 4 |

| `y1-w45-lesson-music` | Success criterion: “Read a short melody on strings 1-4 with rests and repeated notes.” | Strings 1–4; no TAB or position tag inferred |
| `y2-w01-lesson-music` | “Low E/A note map”; success criterion: “Find and name every natural note to fret 5” | Natural-note landmarks; strings 5 and 6; no minimum fret inferred |
| `y3-rock-blues-w03-lesson-focus` | “Fret B-string fret 8”; bend until it matches fretted A at fret 10 | Target-pitch bending; string 2; fret range 8–10 |
| `y3-rock-blues-w04-lesson-focus` | D-string and G-string frets 5–7 with D-U-D-U; B-string 5–7–5–7 with hammer-ons and pull-offs | Alternate picking, string crossing and legato; strings 2–4; frets 5–7 |
| `y3-rock-blues-w08-lesson-focus` | Explicit A minor pentatonic box-1 map across low E, A, D, G, B and high E; frets 5–8 | A minor pentatonic box 1; position box 1; strings 1–6; frets 5–8 |
| `y3-rock-blues-w02-lesson-focus` | Explicitly names A minor pentatonic box 1 and adjacent box 2 and asks learner to connect them | A minor pentatonic box 1 topic; positions box 1 and box 2; no string/fret range inferred |
| `y3-fingerstyle-acoustic-w02-lesson-focus` | Names C `x32010`, Am `x02210`, and p–i–m–a on strings 5–3–2–1 | P–I–M–A fingerstyle; open position; strings 1, 2, 3 and 5; fret range 0–3 |
| `y3-jazz-harmony-w05-lesson-focus` | Gives Dm9 `x5355xx`, G13 `3x345x`, Cmaj9 `x3243x` and identifies chord extensions | Extended chord voicings; strings 2–6; frets 2–5 |

## New dimensions

- Topic: `harmony.extended-chord-voicings`.
- Techniques: `technique.pitch-bending` and `technique.pima-fingerstyle` (fingerstyle thumb independence was already present in v0.2.0).
- Position: `position.pentatonic-box-2`.

Existing dimensions are reused only when the exercise evidence directly supports them. The new box-2 position does not create a numeric fret-range claim by itself.

## Observation-version compatibility

The taxonomy increments from `0.1.0` to `0.3.0`. The original ten scope definitions are retained unchanged and explicitly declare `compatibleObservationVersions: ["0.1.0"]`. This keeps linked observations recorded under the original mapping for those exact pairs visible.

The ten newly added scopes accept only `0.3.0` observations. An old-version record cannot be reinterpreted under a newly added scope. This compatibility is per exercise pair, not global. If an existing scope's topic, technique, string, fret or position meaning changes in a future release, remove its older compatible version unless a reviewed migration proves the mapping is equivalent.

## Explicit exclusions

- Generic “form each chord or voicing in the lesson” instructions are not used to infer chord, string or fret tags.
- “Low-string” wording without exact string names does not create string-number tags.
- A fret upper bound without an authored lower bound does not create a fabricated minimum.
- Sight-reading is not automatically treated as TAB reading.
- Repetitions, free-text learner labels and lesson titles are not taxonomy evidence.

## Coverage boundary

The catalog now has 24 reviewed authored exercise scopes across three immutable taxonomy snapshots. Exposure counts remain activity coverage for those explicitly mapped scopes only. They are not full-curriculum coverage, correctness, completion or mastery.
