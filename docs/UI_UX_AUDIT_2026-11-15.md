# GuitarLab UI/UX audit and lesson-discovery redesign

**Review date:** 15 November 2026  
**Implementation branch:** `feat/ui-ux-lesson-discovery`  
**Baseline:** `main` at `555b27c1ba230a87a59e4d75c5f7348127f8fd28`  
**Scope:** learner-facing navigation, lesson discovery, lesson reading, responsive layout, interaction clarity and accessibility.  
**Record type:** historical source audit, not a live status tracker. Current task status and acceptance evidence live in the [Engineering Quality & Release Tracker](ENGINEERING_QUALITY_TRACKER.md), Sections 3 and 7.

## Executive finding

The curriculum already contains 152 authored lessons across six routes. The primary product problem was not missing content: it was that finding a particular lesson depended on navigating large expandable week lists, while secondary pages dropped the main navigation and the reader offered no quick way to move through a long lesson.

This change keeps the authored curriculum, stable lesson IDs, learning outcomes and local learner records intact. It redesigns the route into a lesson finder and gives the learner a consistent way to move between the major parts of the app.

## Evidence and audit method

This is a source-and-flow audit of the current `main` code, curriculum catalog, reader, roadmap, design guidelines and existing Playwright acceptance tests. It is not represented as a completed screenshot-based visual audit.

The public preview URL `https://guitarlab-preview.leenus-darnal.workers.dev/` could not be rendered by the audit browser because its connection failed with `ERR_SOCKS_CONNECTION_FAILED` on desktop and at 390×844 mobile width. As a result, visual findings about the live deployment, exact rendered spacing, and real-device touch behaviour remain unverified. The source audit and local Worker acceptance suite are the evidence used for this implementation.

## Findings

| Priority | Finding | Learner impact | Change in this PR |
|---|---|---|---|
| High | The catalogue had no text search or practical filters | Learners had to know a route and browse week-by-week to find a topic | Added title/topic/focus search, learning-path filter, duration filter, clear empty state and progressive result loading |
| High | The six paths were presented as long expandable weekly lists | The lesson title a learner needed could be several scrolls away | Put lesson results first, show useful lesson cards immediately, and move the path directory into a separate section |
| High | Secondary routes lacked the dashboard's primary navigation | A learner could enter a lesson, tool or practice page and have only a back link rather than clear app destinations | Added a shared responsive primary navigation for learner-facing routes |
| High | The dashboard did not give lesson browsing equal prominence to its single next-lesson recommendation | Learners who wanted to choose a different lesson had no obvious first action | Added a prominent “Browse all lessons” action |
| Medium | The lesson reader was a long page with no section jump navigation | Learners had to scroll repeatedly to return to exercises, musical application or review | Added a compact, horizontally scrollable lesson outline with stable section anchors |
| Medium | The reader exposed internal curriculum IDs in a learner-facing sidebar | Technical identifiers added noise without helping the learner | Replaced those identifiers with lesson length, guided-step and exercise information |
| Medium | Some instructional labels and paragraph styles were very small | Important guidance was less comfortable to scan, especially on smaller screens | Increased essential reader copy and controls while retaining small type for secondary metadata |

## Route-by-route source scan

All 16 learner-facing `+page.svelte` route components were scanned for page hierarchy, navigation landmarks, link patterns, forms/labels, responsive breakpoints and small type declarations.

| Route | Baseline pattern observed | UX treatment or follow-up |
|---|---|---|
| Today dashboard `/` | Custom desktop sidebar and mobile menu; next lesson is prominent but lesson browsing is secondary | Added a prominent Browse all lessons action; mobile bottom destinations supplement the dashboard menu |
| Curriculum `/learn` | Six phase/week lists with no text finder or duration/topic filters | Replaced with a searchable, filterable lesson catalogue and separate route directory |
| Lesson reader `/learn/[lessonId]` | Long instructional page, route sidebar and technical content IDs | Added lesson section shortcuts, improved instructional text size and replaced internal IDs with a learner summary |
| Onboarding `/onboarding` | Focused standalone preference form with skip path | Kept intentionally distraction-free; shared navigation is omitted while setup is in progress |
| Practice Studio `/practice` | Three forms and session/history states, but no primary app navigation or visible route back link in the baseline | Shared primary navigation now makes other learning areas reachable without abandoning the current flow |
| Repertoire `/repertoire` | Workspace reached from Tools with a Tools-only back link | Shared primary navigation adds Today, Learn, Practice and other destinations |
| Data & backups `/settings/data` | Separate brand header and dashboard back link around storage/export/restore/reset actions | Shared navigation now provides a consistent way out of settings |
| Skill states `/skills` | Dashboard back link and an empty state that points toward the curriculum | Shared navigation now exposes Learn and other primary sections |
| Tools hub `/tools` | Eight tools/projects, with a dashboard back link | Shared navigation now stays available across the tools area |
| Chord library `/tools/chords` | Tool-specific screen with a Tools-only back link | Shared navigation added; chord-diagram ergonomics remain a separate visual/device review |
| Ear training `/tools/ear-training` | Focused exercise screen with a Tools-only back link | Shared navigation added; audio/device behaviour remains covered by its dedicated acceptance suite |
| Fretboard explorer `/tools/fretboard` | Dense interactive diagram and small technical labels; Tools-only back link | Shared navigation added; fretboard touch targets, diagram labels and viewport controls remain a high-priority follow-up |
| Metronome `/tools/metronome` | Focused tempo control screen with a Tools-only back link | Shared navigation added; physical touch/tempo-control review remains outstanding |
| Note recognition `/tools/note-recognition` | Guided exercise with a Tools-only back link | Shared navigation added; microphone/audio acceptance remains separate |
| Theory recall `/tools/theory-recall` | Focused prompt/retrieval screen with a Tools-only back link | Shared navigation added; question clarity and accessibility need human review |
| Chromatic tuner `/tools/tuner` | Focused tuner screen with a Tools-only back link | Shared navigation added; physical microphone and tuner ergonomics remain separate acceptance work |

The source scan found that 15 of the 16 page components declare at least one font size of 11px or smaller. Some are legitimately dense instrument/diagram metadata, so this change did not apply a blanket CSS enlargement that could damage fretboard or musical readouts. The instructional reader copy was raised in this slice; remaining route-specific type and control sizing should be tuned against screenshots and real devices.

## Revised learner journey

1. **Start at Today.** The dashboard now presents “Browse all lessons” alongside learning preferences.
2. **Search the catalogue.** Search titles, topics, focus text, checkpoints, stage names and route names.
3. **Narrow the list.** Filter by one of the six learning paths and by lesson duration.
4. **Open a lesson.** Results show the lesson title, focus, route, week and estimated length with a direct open action.
5. **Move around the lesson.** A section outline jumps to overview, key idea, demonstration, walkthrough, exercises, musical application, review and saved progress.
6. **Move to another part of GuitarLab.** A responsive primary navigation stays available on secondary pages; mobile learners get five frequent destinations in a bottom bar and secondary links in a keyboard-dismissable menu.

## Preservation and safety

- Keeps all 152 authored lessons, their stable IDs and six existing learning routes.
- Does not rewrite lesson text, prerequisites, authored exercises, assessment scoring or mastery rules.
- Does not alter learner data, IndexedDB schemas, account state or authentication.
- Does not infer that lesson completion, elapsed time or a selected practice plan proves skill mastery.
- Keeps the local-first data boundary unchanged.

## Verification

The updated curriculum browser acceptance suite covers:
- all six routes and the 152-lesson count;
- first-page lesson results, text search, route filtering, duration filtering and a no-results recovery state;
- direct lesson opening in Year 1, Year 2 and a Year 3+ specialist pathway;
- shared primary navigation and mobile menu interaction;
- lesson section navigation and the existing lesson progress/checkpoint flow;
- 404 handling, responsive overflow and desktop/mobile offline behaviour.

The repository's existing axe-based accessibility suite remains the automated accessibility gate. Automated checks do not replace physical iOS/Android testing, keyboard-only review with a human, screen-reader review or the visual audit of a reachable deployed preview.

## Historical acceptance findings (current status is tracked centrally)

1. Review the PR's full CI result on the final head commit.
2. Capture real desktop and mobile screenshots from a reachable preview and compare the rendered layouts.
3. Test keyboard-only navigation, screen-reader announcements and 200% zoom/reflow.
4. Test touch target comfort and lesson navigation on a physical phone/tablet.
5. Revisit the remaining tools and Practice Studio ergonomics in separate, focused slices after the core lesson-discovery journey is accepted.
