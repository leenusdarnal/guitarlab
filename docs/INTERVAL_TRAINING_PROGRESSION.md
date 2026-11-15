# Interval Training Progression — Research and Implementation Decision

**Issue:** [#17 — Ear training, theory recall and repertoire workspace](https://github.com/leenusdarnal/guitarlab/issues/17)  
**Status:** Research decision for the next bounded implementation slice  
**Date:** 2026-11-15

## Decision

Extend the existing interval exercise set beyond unison, minor third, major third and perfect fifth, but do not unlock all remaining intervals as one undifferentiated quiz. Add a staged progression with separate melodic/harmonic and ascending/descending dimensions, and preserve the current four-interval beginner set as the default entry point.

The next interval batch should cover:

1. **Major second and perfect fourth** — useful early additions that expand stepwise and stable-consonance recognition without immediately introducing the most confusable categories.
2. **Octave** — a distinct register-equivalence and melodic-span outcome; teach after learners can reliably identify smaller intervals.
3. **Minor sixth and major sixth** — introduce as a paired later stage, with targeted comparison because the two qualities are easy to confuse.
4. **Minor second and major seventh** — introduce as a dissonant/semitone-related pair only after the learner has a reliable tonal anchor.
5. **Tritone** — teach as a distinct high-difficulty category; keep augmented fourth/diminished fifth spelling as theory context rather than pretending the ear can identify enharmonic spelling from isolated sound alone.

Do not add compound intervals, microtonal intervals, or interval-quality spelling as scored listening answers in this slice. They need separate learning outcomes and a suitable authored curriculum context.

## Evidence and implications

### 1. Interval size alone is not a difficulty ranking

A 2018 observational study of 25 conservatory students across 20 lessons examined harmonic interval identification from minor second through octave. It reported particular difficulty with tritone, minor sixth, major sixth, minor seventh and major seventh. This supports staging these categories deliberately and providing extra contrastive practice rather than assuming that all interval classes are equally learnable.

Source: [Ponsatí et al., Aural identification of harmonic intervals (Psychology of Music)](https://doi.org/10.1177/0305735618809868).

### 2. Blocked and interleaved practice serve different purposes

Wong, Chen and Lim's experiments with novice learners found that interleaving six melodic interval types outperformed blocking when reference songs and singing were absent; with those scaffolds present, the two schedules performed comparably. The implementation should therefore use short blocked introduction for a new interval, then gradually interleave it with already learned intervals. Do not present interleaving as universally superior independent of context.

Source: [Wong, Chen & Lim, Learning melodic musical intervals: To block or to interleave?](https://doi.org/10.1177/0305735620922595).

### 3. Exposure and task practice can be complementary

A four-day training study found that continuous task practice alone did not produce the same learning as a regimen alternating task practice with stimulus exposure without an answer task. The app can adapt this conservatively by including short listen-and-notice examples between answer rounds; this is a pedagogical experiment, not a mastery signal.

Source: [Little, Inducing musical-interval learning by combining task practice with periods of stimulus exposure alone](https://pmc.ncbi.nlm.nih.gov/articles/PMC6384134/).

### 4. Keep tonal and multimodal scaffolds, then fade them

A 2026 scoping review synthesizing 35 peer-reviewed studies describes interval perception as relational and highlights tonal context, reference melodies, vocalisation, and visual/kinesthetic supports. It also cautions against permanent dependence on reference-song mnemonics. GuitarLab should offer optional reference pitch / reference melody and visual direction cues, then allow learners to hide them. Every audio prompt must retain a visual explanation and a non-audio fallback.

Source: [Kendüzler, Intervals as musical fingerprints: perceptual and pedagogical insights — a scoping review](https://doi.org/10.3389/fpsyg.2026.1740840).

## Proposed progression

| Stage | Interval classes | Intended outcome | Entry / teaching note |
|---|---|---|---|
| Existing foundation | Unison, m3, M3, P5 | Recognise familiar relative-pitch distances | Preserve current default and saved evidence semantics |
| Stage 2 | M2, P4 | Distinguish stepwise motion and fourth-span motion | Teach separately; then mix with foundation |
| Stage 3 | P8 | Hear octave equivalence across register | Explicitly vary starting pitch and register |
| Stage 4 | m6, M6 | Distinguish two sixth qualities | Pairwise contrast and slower blocked practice first |
| Stage 5 | m2, M7 | Hear semitone proximity and leading-tone tension | Establish tonal anchor; distinguish ascending/descending |
| Stage 6 | Tritone | Recognise the six-semitone interval category | Teach as high difficulty; do not score enharmonic spelling |

The table is a proposed product sequence, not a claim that the literature proves this exact order. Difficulty should be checked against GuitarLab's own item-level outcomes before adapting the order.

## Exercise design requirements

- Represent interval identity (semitone count / canonical interval class) separately from notation spelling (e.g. A4 vs d5). Audio alone cannot disambiguate enharmonic spelling.
- Model presentation independently: melodic or harmonic; ascending or descending where direction exists. Harmonic intervals have no melodic direction.
- Generate examples locally with the existing audio path; no copyrighted recordings or reference-song recordings are bundled.
- Vary absolute starting pitch and register so learners cannot solve by memorising one fixed pitch pair.
- Keep feedback specific: interval name, heard direction, and an optional explanation. Provide retry and next-exercise paths.
- Use blocked introduction for new classes, followed by interleaved mixed review. Offer a no-scaffold mode after supported practice.
- Preserve accessible visual instructions and controls; audio must never be the only way to understand the task.
- Keep item-level outcomes comparable only when interval class, presentation mode, direction, instrument/audio definition and scoring rules match. Do not let supporting drills independently award whole-skill mastery.
- Track exposure and accuracy separately. A listened example is exposure, not a correct answer.

## Acceptance criteria for the next implementation PR

1. Add M2 and P4 as the first incremental interval batch, reusing the existing exercise generator, audio lifecycle and answer-feedback flow.
2. Ensure generated examples vary root pitch and do not accidentally reveal answers through UI state or file names.
3. Add unit tests for interval semitone mapping, direction, melodic/harmonic presentation and enharmonic spelling separation.
4. Add browser tests for blocked introduction, mixed review, retry/next flow, accessible visual instructions and audio teardown.
5. Add objectively keyed item evidence only for the exact interval/mode definitions that are scored; keep incomparable modes separate.
6. Keep existing four interval classes and historical evidence compatible.
7. Run curriculum validation, formatting, lint, Svelte/TypeScript checks, unit tests, browser acceptance and production build. Fix formatting at its configuration/root cause; do not weaken checks.

## Content provenance and licensing decision

- All generated exercise tones and newly authored explanatory text should be original GuitarLab material.
- Do not copy commercial song snippets, recordings, tablature, notation layouts or reference-melody audio into the repository.
- Linking to an external score is not a licence to reproduce it. Verify the individual work, edition/arrangement, recording and jurisdiction before bundling any asset.
- Public-domain status of a composition does not automatically clear a modern arrangement, edition, recording or engraving.
- If externally licensed content is ever bundled, record the asset URL, creator/rightsholder, exact licence/version, attribution text, modification status, territory/jurisdiction review, retrieval date and the files/features that use it.
- Prefer original generated tones and authored exercises over a repertoire asset dependency. For public-domain/open-score discovery, institutional collections and IMSLP may be starting points only; check item-level terms and applicable jurisdiction.

Sources:
- [IMSLP licensing policy](https://imslp.org/wiki/IMSLP:Licensing_Policy_and_Guidelines)
- [Ohio State University Libraries — finding public-domain and openly licensed materials](https://library.osu.edu/copyright/public-domain)

## Research limitations

- The cited conservatory studies are not direct evaluations of GuitarLab's learner population or generated guitar timbres.
- The 2026 scoping review is a synthesis, not a randomized evaluation of this exact product sequence.
- The proposed stages must be validated with GuitarLab's own comparable item outcomes; do not claim improved learning from completion or exposure counts alone.
- Copyright status is jurisdiction- and asset-specific; this document is an engineering gate, not legal advice.
