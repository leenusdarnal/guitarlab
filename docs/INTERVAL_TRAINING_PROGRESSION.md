# Interval Training Progression — Research, Implementation Audit and Next Decision

**Issue:** [#17 — Ear training, theory recall and repertoire workspace](https://github.com/leenusdarnal/guitarlab/issues/17)  
**Status:** Interval-class expansion shipped; follow-up design decision recorded  
**Last reviewed:** 2026-11-15  
**Implementation baseline:** PR #127, merged as \`03af0f13e5ed0115ff0f45ab1d2d56d86cfd56b6\`

## Decision

The first interval-class expansion is complete. PR #127 added every common simple-interval class represented by the current semitone-based exercise model, divided into focused choice sets. Do not schedule another M2/P4 or generic interval-class expansion as the next implementation.

The implementation is intentionally narrower than a complete interval curriculum: it currently presents two sequential tones in ascending order, uses a fixed 440 Hz first tone, and asks for the semitone-distance interval class. It does not yet vary starting pitch/register, test descending direction, present simultaneous harmonic intervals, or assess notation spelling. Those are distinct follow-up dimensions and must not be conflated in item-level evidence.

**Next bounded implementation slice:** vary the starting pitch/register deterministically while preserving the interval semitone distance, existing answer contract, local audio generation and supporting-probe evidence semantics. Direction and harmonic presentation should be separately scoped after that slice is validated.

## Shipped implementation — PR #127

The current interval sets are:

| Set | Interval classes | Current prompt behaviour |
|---|---|---|
| Foundation | Unison, minor third, major third, perfect fifth | Familiar anchor set |
| Steps & tritone | Minor second, major second, perfect fourth, tritone | Ascending step/span comparison |
| Wide leaps | Minor sixth, major sixth, minor seventh, major seventh, octave | Ascending wide-leap comparison |

All examples are generated locally; no recordings, remote assets or microphone permission are required. The exercise model keys answers by semitone count and labels the six-semitone class as a tritone. It does not claim that isolated audio distinguishes augmented fourth from diminished fifth.

PR #127 also versioned the interval supporting-probe instrument as v2. Supporting-probe outcomes remain separate from whole-skill mastery and should only be compared when their instrument definition and scoring rules match.

## Current gaps verified against the code

The current generator sets the first tone to 440 Hz for every interval item. The second tone is calculated above it using the interval's semitone count. This keeps the current exercise reproducible, but it means learners can become familiar with one absolute starting pitch and the examples do not yet test whether interval recognition transfers across registers or transpositions.

The current generator also has no independent presentation-mode or direction field: the two tones are sequential and ascending. Harmonic intervals (simultaneous notes), descending melodic intervals, and enharmonic notation answers therefore remain out of scope.

These are implementation facts, not assumptions to be inferred from the broader curriculum or the research literature.

## Research evidence and product implications

### 1. Difficulty differs by interval and presentation

Ponsatí and colleagues studied harmonic-interval identification with 25 first-year professional-grade music-theory students aged 11–13 across three groups and 20 lessons. Their observations identified particular difficulty with tritone, minor sixth, major sixth, minor seventh and major seventh. The result supports providing deliberate contrast and additional practice for those classes; it is not a universal difficulty ranking for GuitarLab's current melodic, generated-tone task.

Source: [Ponsatí et al., Aural identification of harmonic intervals: An observational study at the Girona Music Conservatory](https://doi.org/10.1177/0305735618809868). First published online in 2018; published in *Psychology of Music*, 48(3), in 2020.

### 2. Blocking and interleaving are context-dependent

Wong, Chen and Lim compared blocked and interleaved learning of six melodic ascending interval types with novices. With familiar reference songs and singing as learning aids, both schedules produced comparable classification performance. Without those aids, interleaving produced better identification than blocking. The study therefore does not justify a blanket rule that every new interval must always be taught in one schedule.

Product implication: retain focused choice sets for initial orientation, then test mixed review against focused practice using comparable GuitarLab outcomes. Any scaffold should be optional and should not become a permanent prerequisite for success.

Source: [Wong, Chen & Lim, Learning melodic musical intervals: To block or to interleave?](https://doi.org/10.1177/0305735620922595).

### 3. Practice and exposure can complement one another

Little, Cheng and Wright found that combining task practice with stimulus exposure without an answer task improved performance on their musical-interval comparison task more than continuous task practice alone. Their task and stimuli differ from GuitarLab's current single-interval identification flow, so this supports a testable design hypothesis rather than a guaranteed effect.

Product implication: a future listen-and-notice exposure mode may be worth evaluating separately from answer rounds. Exposure must be recorded as exposure, never as a correct answer or mastery evidence.

Source: [Little, Cheng & Wright, Inducing musical-interval learning by combining task practice with periods of stimulus exposure alone](https://doi.org/10.3758/s13414-018-1584-x).

### 4. Interval perception is relational; scaffolds should be managed deliberately

Kendüzler's 2026 scoping review reports a synthesis of 35 peer-reviewed studies published from 2010 to 2025, alongside historical and theoretical material. It discusses relational pitch perception, tonal context, auditory/visual/kinesthetic teaching approaches, reference melodies and gradually fading external supports. The review also describes heterogeneity in outcomes, interventions and participant profiles, and notes the predominance of Western-centric materials. It is a broad pedagogical synthesis, not a controlled evaluation of GuitarLab's interface or generated guitar timbre.

Product implication: test transfer across starting pitches and registers before introducing additional presentation modes. Visual explanations remain important, and optional anchors should be faded rather than silently assumed.

Source: [Kendüzler, Intervals as musical fingerprints: perceptual and pedagogical insights — a scoping review](https://doi.org/10.3389/fpsyg.2026.1740840).

## Implementation decision: vary starting pitch and register

The fixed A4 starting tone is replaced by a deterministic traversal of all 24 chromatic MIDI roots from C3 (48) to B4 (71) **for each interval class**. Root selection is based on the interval's position in its set and that interval's appearance cycle, rather than the global sequence alone. The four-choice sets use a stride of five; the five-choice Wide leaps set uses a stride of seven. Both strides are coprime with 24, so every interval class is heard from every root before repeating. This avoids fixing a particular starting pitch class to a particular interval answer. The second tone is derived from the selected root plus the authored interval's semitone count, so the interval class and ascending direction remain unchanged. All generated tones stay between C3 and B5 (MIDI 48–83, approximately 130.81–987.77 Hz).

This changes the stimulus distribution enough to warrant a new interval instrument version. New attempts use definition v3 / scoring rule v3 while retaining the supporting-probe-only boundary. Existing v2 attempts remain append-only and are grouped separately by the evidence read model; no backfill or score migration is performed.

### Acceptance criteria

1. Select the first pitch from a bounded, documented set of musically usable MIDI pitches/registers; ensure both notes remain inside the supported audio frequency range for every interval class, including octave.
2. Derive the second pitch only by adding the interval's semitone count. Preserve the same interval class and ascending direction.
3. Make selection deterministic from the exercise sequence (or an explicit seed) so tests and replay remain reproducible; avoid nondeterministic global randomness.
4. Ensure a useful sequence of exercises covers multiple starting pitches and registers rather than repeatedly returning to A4.
5. Keep choice labels, explanations and answer keys independent of the selected absolute pitch. Do not expose the answer through prompt text, DOM attributes or filenames.
6. Add unit tests proving that every interval class traverses all 24 roots, with bounded frequency output, semitone-distance invariance, deterministic replay and root-pitch variation in all three sets; explicitly guard against interval identity becoming fixed to a pitch class.
7. Extend browser acceptance to confirm the learner-facing prompt and feedback remain correct, playback can be stopped/cleaned up, and no permission or network dependency is introduced.
8. Preserve the supporting-probe-only boundary. Because the varied-root stimulus distribution changes the instrument definition, use definition v3 and scoring rule v3 so new attempts remain separate from historical v2 attempts.
9. Run curriculum validation, formatting, lint, Svelte/TypeScript checks, unit tests, browser acceptance, accessibility checks and production build. Fix formatting at its root cause; do not weaken checks.

### Implementation status

The current implementation branch applies the decision above. Automated verification covers deterministic traversal of all 24 roots for each interval class, every interval semitone distance, the C3–B5 frequency bounds, instrument-version separation and the learner-facing playback/answer flow. Required CI remains the merge gate.

### Separate follow-up dimensions — do not bundle into this slice

- **Descending melodic recognition:** add a direction-aware stimulus and answer contract; do not relabel ascending evidence as direction-aware evidence.
- **Harmonic intervals:** generate simultaneous tones and define separate scoring/comparability. Do not treat harmonic and melodic trials as the same instrument.
- **Notation-aware spelling:** keep audio interval class separate from diatonic spelling. An isolated semitone distance cannot tell an augmented fourth from a diminished fifth.
- **Scaffolded learning and exposure:** test reference pitch/melody, singing or listening-only exposure as distinct instructional conditions. Do not infer efficacy from completion counts or bundle scaffold use into accuracy.
- **Adaptive sequence ordering:** use comparable item outcomes before changing stages. The cited literature does not establish one universally optimal order for this product.

## Exercise and evidence invariants

- Keep interval identity (semitone count / canonical interval class) separate from notation spelling (for example, A4 versus d5).
- Keep presentation mode and melodic direction explicit if and when those modes are introduced. Harmonic intervals have no melodic direction.
- Generate tones locally; do not bundle copyrighted recordings or commercial reference-song snippets.
- Vary absolute starting pitch and register only within a tested frequency range.
- Keep feedback specific and accessible. Audio must not be the only explanation of the task.
- Keep item-level outcomes comparable only when interval class, presentation mode, direction, starting-pitch policy, audio definition and scoring rules match.
- Track exposure and accuracy separately. Listening without an answer task is exposure, not a correct response.
- Supporting probes can guide focused practice but cannot independently award whole-skill mastery.

## Content provenance and licensing decision

- Generated exercise tones and newly authored explanatory text should be original GuitarLab material.
- Do not copy commercial song snippets, recordings, tablature, notation layouts or reference-melody audio into the repository.
- An external score link is not permission to reproduce the score. Verify the individual work, edition/arrangement, recording and applicable jurisdiction before bundling any asset.
- Public-domain status of a composition does not automatically clear a modern arrangement, edition, recording or engraving.
- For any externally licensed bundled content, record the asset URL, creator/rightsholder, exact licence/version, attribution text, modification status, territory/jurisdiction review, retrieval date and consuming files/features.
- Prefer original generated tones and authored exercises over a repertoire-asset dependency. IMSLP and institutional collections may be discovery sources only; check the item-level terms and applicable jurisdiction.

Sources:
- [IMSLP licensing policy](https://imslp.org/wiki/IMSLP:Licensing_Policy_and_Guidelines)
- [Ohio State University Libraries — finding public-domain and openly licensed materials](https://library.osu.edu/copyright/public-domain)

## Research limitations

- The harmonic-interval study is observational, uses a small conservatory sample and does not directly test GuitarLab's ascending melodic exercise.
- The blocked/interleaved study tests novice melodic ascending intervals under particular scaffold conditions; it does not settle the best schedule for all learner groups or tasks.
- The practice-plus-exposure study uses an interval-comparison task and should not be treated as direct proof for a single-item identification flow.
- The scoping review maps a heterogeneous literature and should be used to generate hypotheses, not claim a causal effect for any GuitarLab feature.
- The proposed next implementation is a stimulus-validity improvement. Its effect on learner transfer or accuracy must be measured rather than assumed.
- Copyright status is jurisdiction- and asset-specific; this document is an engineering gate, not legal advice.
