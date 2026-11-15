# Content Provenance and Licensing Audit — Issue #17

**Audit date:** 2026-11-15  
**Repository baseline:** \`main\` at \`03af0f13e5ed0115ff0f45ab1d2d56d86cfd56b6\` (PR #127 merged)  
**Scope:** bundled TAB, notation, repertoire and audio content; learner-entered repertoire notes; external references.

## Decision

No bundled TAB, score, music-notation, repertoire recording or other standalone media asset was found in the tracked repository tree at the audited baseline. The repertoire feature is a learner-owned notes and bookmarks workspace; it does not download, cache, embed or redistribute the referenced source material.

**Current built-in content risk: low.** This finding is limited to the audited repository version and tracked files. It is not a legal opinion, does not prove the rights status of arbitrary external URLs, and does not inspect or validate future learner-entered text.

Keep the rule that future built-in TAB, notation, lyrics, repertoire excerpts, recordings or sample files must be original, public-domain with the specific edition/arrangement cleared, or covered by an appropriate licence before they are added.

## Repository inventory

The recursive Git tree at the audited commit contained 265 path entries. The file inventory found:

| Asset category | Tracked standalone files found |
|---|---:|
| Image/diagram files (\`.svg\`, \`.png\`, \`.jpg\`, \`.jpeg\`, \`.webp\`) | 0 |
| Audio files (\`.mp3\`, \`.wav\`, \`.ogg\`, \`.m4a\`, \`.flac\`) | 0 |
| MIDI files (\`.mid\`, \`.midi\`) | 0 |
| Common notation/tablature interchange files (\`.musicxml\`, \`.mxl\`, \`.gp3\`, \`.gp4\`, \`.gp5\`, \`.gpx\`) | 0 |

The application generates ear-training tones locally using Web Audio. The current interval exercise does not embed recordings or reference-song audio. Fretboard and chord views are generated from GuitarLab's authored music-domain data rather than loaded score-image assets.

This inventory describes standalone tracked files with the listed extensions. It is not a general-purpose copyright scanner and does not establish rights for content pasted into free-text fields.

## Repertoire feature inspection

The reviewed source files are:

- \`src/lib/domain/repertoire/song-project.ts\`
- \`src/routes/repertoire/+page.svelte\`

The domain model stores a project title, optional artist/composer, a source type, optional HTTP(S) source URL, learner notes, section names, bookmarks and practice targets. It has no file-upload, binary-asset, score-import or audio-recording field.

The source-type values are \`original\`, \`public_domain\`, \`licensed\` and \`reference_link\`. A reference-link project requires a URL. These values are learner-entered descriptions; the application does not independently verify public-domain status, permissions, copyright ownership or licence terms.

The repertoire page creates a blank original-work project, offers editable notes and section metadata, and presents this rights notice:

> Store only notes and notation you created yourself or are permitted to use. GuitarLab does not bundle or redistribute copyrighted tabs, lyrics or audio. External references remain links; GuitarLab does not fetch their content or send your private project notes to those sites.

The code inspection found no control that fetches external score/tablature content or forwards project notes to the external source. Backups may contain learner-entered notes, so the notice remains important: a local note field is not a licence to reproduce or share copyrighted material.

## Boundaries and residual risks

1. **External links are not a licence.** A URL may point to material with restrictive terms. GuitarLab does not reproduce that material, and the presence of a link must not be represented as rights clearance.
2. **Public-domain status is asset-specific.** The composition, arrangement, edition, engraving, performance and recording may have different rights holders and terms. Review the exact item and relevant jurisdiction.
3. **Self-declared source types are not verification.** Selecting \`public_domain\` or \`licensed\` does not prove that the user has permission. Do not treat those values as a rights assertion by GuitarLab.
4. **Free-text fields are not content moderation.** The user may type or paste material into notes. The application does not analyse those notes for copyright, and this audit does not certify arbitrary learner content.
5. **No bundled-content licence register is needed for the audited baseline because no standalone third-party TAB/notation/repertoire media asset was found.** If a bundled asset is introduced, create the register entry and complete review before merging that asset.

## Required gate before adding any bundled asset

Record at minimum:

| Field | Required evidence |
|---|---|
| Asset identity | Stable repository path or asset ID; exact title/version |
| Work and creator | Composer/author, arranger, performer and other relevant contributors |
| Source | Canonical source URL, source institution and retrieval date |
| Rights basis | Original authorship evidence, public-domain analysis or exact licence/permission |
| Licence detail | Licence name/version and link; permitted redistribution, adaptation and commercial-use scope |
| Attribution | Exact credit text and any notice that must accompany the asset |
| Modifications | Whether transcribed, arranged, edited, cropped, converted or otherwise adapted |
| Jurisdiction | Territory and date of the rights review; unresolved questions explicitly noted |
| Usage | Product surface, files and features that consume the asset; removal/contact process |

For public-domain works, check the actual edition and arrangement, not only the underlying composition. For licensed material, ensure the grant permits the intended distribution format and downstream use. Keep proof of permission where applicable.

## Ongoing controls

- Prefer original generated tones and original authored examples.
- Do not bundle commercial recording clips, song lyrics, TAB or score images without a documented rights basis.
- Keep optional external resources as plain links and do not attach learner-private notes to outbound requests.
- Re-run this inventory when the repository adds repertoire/media files or a score/tablature import feature.
- Require provenance review in the pull request before any new asset is merged.
- Do not close a future asset-specific review merely because the composition itself is old or widely available online.

## Evidence and limitations

This audit was performed against the recursive tracked-file tree at \`03af0f13e5ed0115ff0f45ab1d2d56d86cfd56b6\` and direct inspection of the two repertoire source files above. It is a bounded engineering inventory, not legal advice, a complete dependency-licence audit, or a certification of user-supplied content.

The current Issue #17 condition is satisfied for the built-in application content because no TAB/notation/repertoire media is bundled or redistributed. Any future asset requires item-level review before implementation.
