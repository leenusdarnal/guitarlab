# GuitarLab — External Practice Tools Evaluation

**Reviewed:** 2026-11-11  
**Directory:** [NoSignups](https://nosignups.net/)  
**Decision:** Add selected companion-tool launch links only after the relevant GuitarLab screens exist. Keep core learning, progress and practice records native to GuitarLab.

## Recommendation

The strongest candidate is **ComposeYogi** as an optional backing-track and composition companion in the Practice Studio. It is useful when a guitar exercise needs a drum, bass or chord accompaniment. It is free to open without an account, works in the browser, advertises offline operation and local project storage, and exports WAV or MIDI. Its repository carries the MIT licence.

- Product: https://composeyogi.com/compose
- Source and licence: https://github.com/AppsYogi-com/ComposeYogi
- Suitable GuitarLab placement: Practice Studio → Backing-track tools
- First integration: a clearly labelled external launch link, opening in a new tab. Provide a short GuitarLab guide on creating a simple loop (tempo, time signature, drums/bass/chords) and exporting WAV for practice.
- Do not embed or merge its full DAW as part of M1. It is a separate Next.js application with its own audio engine and local project state; an external link is lower-risk and avoids a second app competing with GuitarLab's focused practice UI.

## Additional candidates

| Tool | Useful GuitarLab role | Access / privacy notes | Licence / integration decision |
|---|---|---|---|
| [Midee](https://midee.app/) | Optional MIDI visualiser for seeing melody, timing and chord shapes in a MIDI file; its Learn mode offers wait-for-notes, speed control and section looping. | No account; MIDI is processed in the browser and not uploaded. It is primarily a piano-roll/piano-keyboard visualiser, not a guitar TAB or fretboard trainer. | The website describes it as open source, but no root LICENSE file was present in the inspected repository. Link to the hosted tool only; do not copy, fork or bundle its code until explicit licensing is confirmed. |
| [Drumhaus](https://drumha.us/) | Optional rhythm companion for building grooves, experimenting with swing and exporting a drum loop. | Browser-based drum sequencer; supports offline PWA use and WAV export. | Source is CC BY-NC-SA 4.0. Keep as an external link; do not adapt or redistribute its code/assets without checking the non-commercial and share-alike obligations. |
| [AudioMass](https://audiomass.co/) | Optional later utility for trimming, slowing or inspecting a learner-recorded audio clip. | Browser-based editor; the page says audio processing runs locally without a backend. | Not needed for the first useful release. Reassess licence and mobile usability before any code reuse. |
| [openDAW](https://opendaw.studio/) | Advanced music-production environment for learners who later want to arrange and record complete backing tracks. | No account; projects are stored on-device according to its privacy page. | Too broad for the beginner practice flow. Keep as an external advanced resource, not a GuitarLab dependency. |

## Integration rules

1. Third-party resources are optional; GuitarLab's lessons, timer, metronome, tuner, progress and journal must work without them.
2. Use an external-link indicator and open the provider in a separate tab. Do not assume iframe embedding is permitted or supported.
3. Do not send learner profile data, journal entries, recordings or private curriculum state to an external tool.
4. Do not auto-upload recordings or MIDI files. The learner should choose and transfer a file explicitly.
5. Recheck availability, privacy statements, licence and mobile usability before each release that includes a link.
6. If GuitarLab later adopts third-party source code, audit the full dependency tree and preserve all required notices. An open GitHub repository is not automatically reusable without a licence.

## Decision summary

- **Recommended first companion link:** ComposeYogi.
- **Useful secondary link:** Midee, with the licensing caveat above.
- **Rhythm alternative:** Drumhaus, external-link only.
- **Not a core dependency:** all of the above.

The NoSignups directory is a discovery catalogue, not an endorsement or service-level guarantee. A provider disappearing or changing its terms must never break GuitarLab's core learning flow.
