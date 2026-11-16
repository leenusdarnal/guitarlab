# GuitarLab UI/UX Implementation Tracker

**Status:** Active  
**Created:** 15 November 2026  
**Last reviewed:** 16 November 2026  
**Implementation source:** UX_REVIEW.md (advisory review supplied for this work) and the source audit in [UI/UX audit](UI_UX_AUDIT_2026-11-15.md)  
**Design authority:** [DESIGN_DIRECTION.md](DESIGN_DIRECTION.md) and [IMPLEMENTATION_GUIDELINES.md](IMPLEMENTATION_GUIDELINES.md)  
**Component research:** [UI component source audit](research/UI_COMPONENT_SOURCE_AUDIT_2026-11-15.md) — research only; no external UI dependency is approved by this document.  
**Product roadmap:** [ROADMAP.md](ROADMAP.md), especially M1, M4, M6, M7 and M9  
**Active implementation:** UX-02 / UX-14 — approved five-destination mobile primary navigation (`feat/ux-mobile-primary-tab-navigation`, PR #166)

---

## 1. Purpose

This is the durable, change-tracked checklist for implementing the GuitarLab UI/UX audit. Keep task status, validation evidence and linked PRs current here as work is delivered.

The audit identified a structural usability problem: important learning actions and lesson content are difficult to find, while small type, inconsistent navigation and hands-busy control ergonomics make the app harder to use on real devices. This tracker converts those findings into ordered, reviewable implementation slices.

This is an implementation plan, not a declaration that every advisory recommendation is already an approved product decision. Where the audit proposes a new interaction pattern that is not settled by the approved design direction, validate it before standardising it.

## 2. Source hierarchy and decision rules

1. **DESIGN_DIRECTION.md** is the approved product and visual direction.
2. **IMPLEMENTATION_GUIDELINES.md** defines implementation guidance and acceptance expectations.
3. **UX_REVIEW.md** supplies the detailed advisory findings and recommendations for this work.
4. **UI_UX_AUDIT_2026-11-15.md** records the repository-specific audit and the first lesson-discovery implementation.
5. **UI_COMPONENT_SOURCE_AUDIT_2026-11-15.md** records external Svelte/Tailwind component options and adoption guidance. It is informational research, not an approval to add a dependency or override the design authority.  
6. **ROADMAP.md** remains the master product roadmap. This document tracks the UI/UX work; it does not replace or silently rewrite the milestone roadmap.

When recommendations conflict, follow the approved design direction or record a decision here before coding. In particular, the audit's five-item mobile bottom-tab proposal was not user-tested. The current PR implements an expandable mobile menu. Do not mark the navigation design final until it has been checked against the approved compact-mobile-navigation direction and tested with learners.

## 3. Non-negotiable preservation rules

- Preserve the 152 authored lessons, six learning routes, stable lesson identifiers, ordering, authored instructional text and learning outcomes.
- Do not change the curriculum, skill taxonomy, evidence model, assessment semantics or mastery rules as a side effect of visual redesign.
- Lesson completion, practice time, repetitions and user-entered observations must not be presented as proof of skill mastery.
- Do not fabricate learner history, progress, assessment scores, recommendations or backup dates.
- Keep learner profile and practice data private and in the existing local-data boundary unless a separately reviewed architecture change is approved.
- Keep the dark and light themes functional. Do not fix one theme by hard-coding colours that break the other.
- Retain keyboard access, visible focus, reduced-motion support, meaningful empty/error states and user control over microphone access.
- Do not weaken an accessibility or responsive acceptance test to make a failing change pass. Fix the interface or document a justified exception with evidence.

## 4. Status definitions

| Status | Meaning |
|---|---|
| NOT STARTED | Planned, no implementation work merged |
| READY | Acceptance criteria and dependencies are clear; ready to pick up |
| IN PROGRESS | Implementation is underway in an identified branch or PR |
| BLOCKED | Cannot progress until a named defect, decision or dependency is resolved |
| IN REVIEW | Code is implemented and awaiting required review or acceptance |
| DONE | Merged and all stated automated acceptance checks pass |
| VERIFIED | DONE plus required manual/device/usability checks have been completed and evidence recorded |
| DEFERRED | Deliberately moved out of the current release, with a reason recorded |

A task is not DONE because code exists in an open PR. Manual-only acceptance is not VERIFIED until the device, browser, assistive technology or learner check is recorded. Within task lists, [x] means the implementation is present in the current working branch/PR; it does not mean the parent task is DONE or VERIFIED until the merge and acceptance rules above are met.

Priority definitions: **P1** = learner-critical or an accessibility barrier; **P2** = meaningful usability improvement after P1; **P3** = polish or lower-risk enhancement.

---

## 5. Current implementation baseline

### Latest completed UX implementation — lesson discovery

| Item | Current state |
|---|---|
| PR | [#138 — feat(ui): make lessons easy to find and navigate](https://github.com/leenusdarnal/guitarlab/pull/138) — merged |
| Branch | feat/ui-ux-lesson-discovery |
| Previous UI code head with overflow | 214f1f4fd67755ea11093f5fc1092ccc827679e4 |
| Responsive overflow fix commit | ca0059cbcc79e6dca761165788ffcd19fda0bbbb |
| Base | main at 555b27c1ba230a87a59e4d75c5f7348127f8fd28 |
| PR state | Merged; automated CI green |
| Final CI run | [GuitarLab CI run 43707602085](https://github.com/leenusdarnal/guitarlab/actions/runs/43707602085) — all required jobs passed |
| Earlier CI failures | Resolved before merge; numeric token matching, regex escaping and exact accessible-label selectors corrected |
| Blocking failure | None outstanding in final automated run; /learn 320px overflow was fixed and revalidated |
| Merge commit | `98c0f7267ce2192594267670889cb4ee37fdfb14` |
| Manual acceptance | Finder search coverage, device/browser and screen-reader checks remain open; do not mark UX-01 VERIFIED |
| Final validation | CI run #1349 passed Node 26 compatibility, application/curriculum validation and required legacy status |

The current PR already introduces a searchable lesson finder, route and duration filters, no-results recovery, a route directory, a dashboard browse action, shared navigation on secondary routes, reader section shortcuts and learner-facing lesson summary information.

**Important implementation detail:** the current PR branch has a desktop navigation row and a two-column expandable mobile menu. It does not currently implement a five-item bottom tab bar. The dashboard still has its own navigation treatment; onboarding intentionally remains a focused setup flow. Reconcile these differences during the navigation acceptance task rather than assuming the PR description proves the pattern is complete.

The revised `docs/DESIGN_DIRECTION.md` now defines the Modern Music Studio target system, including palette, type scale, layout, navigation, components and screen direction. These are design targets only; the app CSS and route layouts still need implementation and validation.

The audit browser could not render the public preview because of a connection failure. No screenshot-based production visual audit, physical-device test or screen-reader test has been completed. Those remain open acceptance work and must not be described as passed.

---

## 6. Ordered implementation plan

Work in this order unless a newly discovered P1 defect justifies reprioritisation. Keep PRs small enough to review and validate independently. Update the status, branch/PR link and evidence as each slice progresses.

### UX-01 — Make every lesson easy to find

**Priority:** P1  
**Status:** DONE — merged in PR #138; automated CI green, manual/device acceptance remains open  
**Depends on:** None  
**Related findings:** lesson discovery, curriculum navigation, X2, C1/C2  
**Implementation:** [PR #138](https://github.com/leenusdarnal/guitarlab/pull/138)

- [x] Add a searchable lesson catalogue across the authored curriculum.
- [x] Add learning-route and estimated-duration filters.
- [x] Add visible result count, progressive result loading and no-results recovery.
- [x] Separate route exploration from the lesson results.
- [x] Add a prominent dashboard entry point to browse all lessons.
- [x] Fix the narrow-screen route-card footer wrapping that caused the 320px /learn horizontal overflow; CI must still confirm the fix.
- [x] Re-run the full CI suite, including axe and responsive browser acceptance, on the final PR head.
- [ ] Verify that search can find lessons by title, focus/topic, checkpoint, route and stage.
- [ ] Verify all 152 lessons remain available in the correct six routes and original order.
- [ ] Test the finder in dark and light themes at 320, 360, 390, 768 and 1280px.
- [ ] Check keyboard operation, search labels, result announcements, filter reset and direct lesson links.
- [ ] Confirm the mobile navigation pattern against the approved design direction; test the current expandable menu before deciding whether a bottom tab bar is justified.
- [ ] Merge only after required CI is green and the preservation checks pass.

**Acceptance:** a learner can locate and open a lesson by topic or title without navigating week-by-week; all authored lessons remain represented; no horizontal page overflow occurs at supported viewport widths.

### UX-02 — Fix global accessibility and mobile interaction blockers

**Priority:** P1  
**Status:** IN PROGRESS — global focus/control improvements are merged in PRs #141 and #159; PR #166 implements the approved five-destination mobile tab bar and secondary More menu. Keyboard-only, 200% zoom, physical-device and learner thumb-reach acceptance remain open under UX-14  
**Depends on:** UX-01 automated acceptance is complete; manual finder/device acceptance remains open  
**Related findings:** X3, X4, X6, X7, X9, B2

- [x] Set and retain a global minimum computed font size of 16px for input, select and textarea controls, including component-level overrides; existing mobile browser acceptance verifies computed sizes.
- [x] Move the skip-link target to the actual page `main` landmark after navigation; browser acceptance asserts that keyboard activation focuses `MAIN`.
- [x] Set 44px minimum height for buttons and text-entry controls, 44px minimum button width, and 44px desktop primary-navigation links.
- [x] Add dedicated higher-contrast control-border tokens for dark and light themes and apply them to form controls.
- [x] Add a visible `:focus-within` treatment to the backup restore file picker and an automated keyboard-focus assertion.
- [x] Queue lesson-progress writes and keep section/checkpoint/note controls enabled while an ordinary save is in flight; avoid disabling the learner's current control (PR #141, automated rapid-edit regression added).
- [x] Preserve focus during normal saves by removing save-time control disabling; focus after explicit view/route replacement remains subject to manual keyboard review.
- [ ] Review icon-only controls for accessible names, hit area and visible focus.
- [ ] Test keyboard-only operation and browser zoom at 200% without disabling user zoom.

**Acceptance:** no field triggers iOS-style focus zoom due to sub-16px text; skip navigation reaches the page content; all essential controls remain keyboard accessible and visually identifiable in both themes.

### UX-03 — Make theme behaviour reliable

**Priority:** P1  
**Status:** IN PROGRESS — pre-paint theme setup and shared selector existed in the shell; PR #141 brings Today into the same three-state preference model  
**Depends on:** UX-02  
**Related findings:** X5

- [x] Document the target dark/light palette and semantic colour roles in `docs/DESIGN_DIRECTION.md`.
- [x] Apply the saved or system-selected theme before first paint to prevent a flash of the wrong theme (inline bootstrap in `src/app.html`).
- [x] Support System, Light and Dark preferences, with a safe fallback when storage is unavailable (PR #141 removes the dashboard's separate two-state model).
- [x] Provide correct browser theme-colour metadata for both themes and update it when the theme changes (shared shell + dashboard selection, automated assertions in PR #141).
- [ ] Replace hard-coded component colours with semantic tokens.
- [ ] Add and consistently use semantic text tokens for danger, primary and other coloured surfaces.
- [ ] Fix the dark-theme reset-button contrast and the light-theme practice error-text contrast.
- [x] Make the theme control announce its purpose and expose the selected System / Light / Dark preference through a labelled select.
- [x] Run the axe/responsive browser suite on the configured learner routes in both themes; manual visual/device review remains part of UX-14.

**Acceptance:** no wrong-theme flash on first load; theme selection survives reload when storage is available; key text and controls remain readable on every route in dark and light modes.

### UX-04 — Establish readable type, spacing and shared UI patterns

**Priority:** P1 for learning text; P2 for broader consistency  
**Status:** IN PROGRESS — PR #141 starts the lesson-reader readability migration; the shared component and other-route sweep remains open  
**Depends on:** UX-02 and UX-03  
**Related findings:** X1, X6, X9, X11, X12

- [x] Document the target type scale, spacing, radii, content widths and surface/component treatments in `docs/DESIGN_DIRECTION.md`.
- [ ] Implement a consistent rem-based type scale using the approved design direction.
- [ ] Bring learner-facing body copy to a comfortable readable size; lesson paragraphs must not be small muted metadata.
- [ ] Reserve muted colour and the smallest type roles for secondary metadata, not instructions or success criteria.
- [ ] Define consistent reading and app container widths, spacing and page-header patterns.
- [ ] Extract shared implementations for buttons, chips, fields, panels, banners, empty states and status messages where repeated patterns currently drift.
- [ ] Remove duplicate per-route styles as components are adopted; avoid a risky all-at-once rewrite of large pages.
- [ ] Preserve readable code, note, fret and tempo typography where a monospaced role is useful.
- [ ] Verify text resizing and wrapping on narrow phones and at 200% zoom.

**Acceptance:** essential instructional content is readable and consistently styled across dashboard, lesson, practice, progress and tools; shared controls have one implementation and theme-safe tokens.

### UX-05 — Make the Today dashboard actionable

**Priority:** P1  
**Status:** IN PROGRESS — actionable task destinations and a real Practice Studio hand-off implemented on the feature branch  
**Depends on:** UX-01; merge after UX-02 / UX-03 prerequisite PR #141  
**Related findings:** D1, D2, D3, D4, D6, D7

- [x] Replace the notice-only plan CTA with a Practice Studio review hand-off that pre-fills duration and focus without automatically starting or recording a session.
- [x] Make lesson tasks open their lesson, skill reviews open the selected skill, and general tasks open a pre-filled Practice Studio task.
- [x] Make due-review rows open the selected skill and Year 1 phase cards open the full Year 1 route.
- [x] Unify the saved practice duration contract to whole minutes from 5 to 180 across onboarding, dashboard planning and Practice Studio; expose 10, 20, 40 and 60-minute presets plus custom entry.
- [x] Keep a clearly labelled one-day override separate from the saved profile preference; the dashboard override is not written back to onboarding.
- [ ] Put the next useful learning action and today's plan first on mobile after onboarding.
- [ ] Reduce the first-run welcome content once it is no longer useful; keep preferences discoverable without dominating the first screen.
- [x] Validate custom-duration input on blur; keep the value editable while the learner is typing.
- [x] Add a direct Practice Studio history link beside the recent three-session summary.
- [ ] Ensure all task cards and review rows have clear interactive semantics and visible focus.

**Acceptance:** every item that looks actionable performs a meaningful action; the plan starts the intended flow; one duration preference has predictable behaviour across screens.

### UX-06 — Rework Practice Studio around the next useful action

**Priority:** P1  
**Status:** IN PROGRESS — session start now precedes analytics, recommendation actions and one-tap observations added; longer-running ergonomic work remains open  
**Depends on:** UX-05; preserve existing session lifecycle and evidence boundaries  
**Related findings:** P1/P2 practice, X10, P8

- [x] Move session start and duration controls ahead of long recommendation/analytics content.
- [x] Add a primary “Practise this” hand-off that pre-fills the current recommendation as the session focus; feedback actions remain available.
- [ ] Keep correction actions available but visually secondary to practising a relevant skill.
- [x] Replace the internal milestone label and catalogue-version badge; hide raw release/taxonomy identifiers from the active-session learner view.
- [ ] Remove repeated mastery disclaimers while preserving one clear explanation of how progress is measured.
- [ ] Make the active session surface focus on the current task, timer, pause/finish and the next useful control.
- [x] Add large one-tap clean-attempt and needs-correction observation controls; retain detailed count entry as an optional form.
- [ ] Provide access to a compact metronome and tuner without forcing the learner to leave the session.
- [ ] Add wake-lock support only while an active session needs it; handle unsupported, rejected and automatically released states.
- [ ] Review idle-gap handling and session recovery so elapsed wall-clock time is not mistaken for active practice.
- [ ] Preserve provenance and the existing separation between observations, assessment outcomes and skill mastery.

**Acceptance:** a learner can start practising quickly, act on a recommendation, log an observation with one hand and finish/recover a session without losing data or receiving inflated mastery claims.

### UX-07 — Make lessons comfortable to read and easy to resume

**Priority:** P1  
**Status:** IN PROGRESS — PR #141 save sequencing merged; reader navigation, retry and lesson-action improvements added on this branch  
**Depends on:** UX-02 and UX-04  
**Related findings:** L1–L6, X7, X10

- [x] Raise lesson-reader instructional paragraphs and lists to 16px minimum (17px on wider screens), keep primary instructional colour, and improve the learner-facing focus text in PR #141; other route typography remains open.
- [x] Add lesson section shortcuts in PR #138.
- [x] Verify every section shortcut targets a real section ID; add desktop and narrow-phone browser acceptance. The section rail scrolls horizontally on small screens.
- [x] Move the lesson checkpoint and completion panel after the instructional sequence, before previous/next lesson navigation.
- [x] Place the accessible alternative next to the focused exercises where learners may need it.
- [x] Add separate-tab metronome and tuner launchers beside the exercise section; starting-tempo deep-link hand-off is tracked with UX-08.
- [x] Serialise checkpoint/note/section progress writes with revision-aware queued snapshots so a later action cannot be dropped by an earlier in-flight save (PR #141).
- [x] Keep the active control enabled during ordinary save operations and expose a concise saving status without putting the entire progress panel in a live region (PR #141).
- [x] Reduce duplicate completion/mastery warnings to one page-level explanation while keeping progress counts and status clear.
- [x] Remove the content-version badge, unavailable prerequisite raw IDs and internal evidence enum from the learner-facing reader.
- [x] Add explicit retry actions for load/save/complete failures; persisted resume and rapid writes are covered by existing browser tests. Human network interruption, mobile and screen-reader review remain open.

**Acceptance:** learners can read, navigate, practise and resume a lesson without excessive scrolling, lost checkpoints, focus jumps or developer-facing copy.

### UX-08 — Improve musical tool ergonomics and feedback

**Priority:** P1 for assistive/essential interactions; P2 for enhancements  
**Status:** IN REVIEW — implementation complete; required automated CI checks passed on the PR head. Physical-device, keyboard-only, screen-reader and wake-lock lifecycle checks remain in UX-14  
**Depends on:** UX-02, UX-03 and UX-04  
**Related findings:** M1–M3, TU1–TU3, N1–N3

- [x] Add a visual beat pulse with a distinct downbeat; respect reduced-motion settings.
- [x] Request Screen Wake Lock while running, retry after visibility changes, and release on stop/destroy.
- [x] Report denied, unsupported and automatically released wake locks without interrupting audio playback.
- [x] Add tempo step buttons, direct numeric entry, tap tempo and presets while retaining the accessible slider.
- [x] Use a stable metronome control label with an explicit pressed state.
- [x] Announce stable note changes only; keep high-frequency tuner readings visual.
- [x] Persist calibration and add target-string, reference-tone, input-level and microphone-permission guidance.
- [x] Show first-try matches separately from total detected attempts; retries do not become first-try successes.
- [x] Keep next-note advancement learner-controlled and raise primary hands-busy controls to 48px.
- [x] Replace raw confidence percentages with a plain-language stable-note message.

**Acceptance:** tools work with keyboard and touch; assistive technology receives concise state changes; the metronome has a non-audio cue; note-recognition results reflect first-attempt performance rather than eventual success.

### UX-09 — Turn fretboard and chord views into recognisable musical diagrams

**Priority:** P1 for core diagram usability; P2 for drill enhancements  
**Status:** IN REVIEW — fretboard/chord interaction and browser acceptance implementation complete; automated CI is being rerun after branch synchronization. Physical-device and assistive-technology checks remain under UX-14  
**Depends on:** UX-04 and existing music-tool model  
**Related findings:** F1–F4, CH1–CH4

- [x] Replace the tiny fretboard grid presentation with an instrument-like fretboard: string lines, fret wires, a nut and standard single/double inlay landmarks; keep the note positions keyboard operable.
- [x] Keep the 12-fret learning view touch-sized on phones and contain the 24-fret view in its own horizontal scroller; verify no page-level overflow in browser acceptance.
- [x] Move secondary fretboard settings below the instrument diagram.
- [x] Add an explicit Hear note action using the selected fretboard pitch; playback does not begin until the learner activates it.
- [x] Turn Find a note into a prompted exercise with found count, hints, reveal, total attempts and first-try scoring.
- [x] Replace the six-column string list with a chord-box diagram showing six strings, fret wires, nut, finger dots, open/muted markers and barre shapes.
- [x] Preserve the chord's written description and expose string/fret/finger details through the diagram's accessible name.
- [ ] Add clear tap/strum audio only after playback and audio-lifecycle acceptance are defined.
- [x] Increase drill action hit areas to 48px and retain the selected chord label and native chord selector.
- [ ] Add “Save to session” only through the existing observation/provenance model; do not silently convert drill actions into mastery.

**Acceptance:** learners recognise the diagrams immediately, can use them on a phone without page overflow, and have equivalent text descriptions and predictable audio behaviour.

### UX-10 — Make Progress useful to new and returning learners

**Priority:** P1/P2  
**Status:** COMPLETE — PR #146 merged; required CI passed. Manual learner testing remains tracked under UX-14  
**Depends on:** existing skill catalogue and learner-state model  
**Related findings:** K1, K2, D7, X10

- [x] Replace the empty-first Skills experience with the full canonical catalogue so a new learner can explore before any evidence exists.
- [x] Show all 34 canonical skills with “Not assessed yet” where no qualifying assessment or mastery evidence exists.
- [x] Explain not assessed, insufficient/inconclusive evidence, needs practice, demonstrated and review due in learner language.
- [x] Preserve the domain distinction: missing evidence is `not_started`, inconclusive evidence is `learning`, and needs-practice is `practising`.
- [x] Add mobile master/detail navigation with an explicit All skills return action.
- [x] Link skills only to lessons explicitly associated in the canonical curriculum index and provide Practice Studio/history destinations without treating activity as mastery.
- [x] Keep the practice-history destination visible beside the linked lesson and Practice Studio actions.

**Acceptance:** a new learner sees a useful starting map without fabricated progress; every displayed state follows the canonical skill and evidence model.

### UX-11 — Make backups discoverable and trustworthy

**Priority:** P1 for focus/contrast; P2 for recency and presentation  
**Status:** COMPLETE — PR #147 merged; required CI and browser acceptance passed. Web Share remains deferred pending physical-device consent/fallback testing  
**Depends on:** UX-02 and existing backup/restore implementation  
**Related findings:** B1–B4

- [x] Verify visible focus styling on the restore file-picker with the existing 3px focus outline and 44px target; accessibility browser acceptance covers desktop and 320px layouts in both themes.
- [x] Verify reset-button text/background contrast in both themes with the existing semantic danger tokens and design-token contrast validation.
- [x] Put export before storage-protection details and replace storage jargon with direct language about browser site data and backups.
- [x] Place success/error feedback beside the export, restore, reset or storage action that produced it.
- [x] Store a local timestamp only after the backup snapshot is created and the browser download is triggered; label it as “download started” because the browser does not confirm the final save location.
- [x] Show the latest known download start in Data & backups and a restrained dashboard reminder for active learners; a recent download suppresses the reminder.
- [x] Evaluate Web Share; defer enabling it until physical-device and platform-consent testing is available. Keep the explicit JSON download as the predictable fallback for this private learner data.
- [x] Extend automated coverage for recency validation, storage failures, reminder timing, export, preview, replacement, rollback, restore and reset. Successful restore/reset clears stale local backup metadata; failed replacement preserves existing data and its metadata.

**Acceptance:** learners can export and restore with keyboard or touch, see action-specific outcomes, understand browser storage risk and never see a fabricated backup date. The displayed date describes a download request, not confirmed file retention.

### UX-12 — Clarify the Tools hub and onboarding/preferences

**Priority:** P2  
**Status:** DONE — PR #148 merged; tool grouping, microphone permission guidance and effective preference cleanup are on `main`  
**Depends on:** UX-04 and product decision for preference behaviour  
**Related findings:** T1, O1–O3

- [x] Group tools by learner intent: explore notes/chords, listen/recognise, keep time/tune and organise music.
- [x] Explain before Start that only the tuner and note-recognition tools request microphone access, with permission recovery steps and local-audio privacy guidance.
- [x] Remove repeated “Available now” labels from every tool card.
- [x] Audit app consumers: goals tailor the Today musical-application suggestion; saved practice duration drives Today and Practice Studio. `lessonPresentation` has no consumer in lesson, dashboard or practice routes inspected.
- [x] Keep the setup UI to the two preferences with visible effects (goals and daily practice duration). Remove unused instrument, fretting-hand, starting-level and lesson-presentation choices while retaining their existing schema fields for backward-compatible profiles and backups.
- [x] Show an explicit “Go to Today” action after preferences save successfully; retain skip/back navigation.
- [x] Use “Today” for the dashboard destination and “Tools” for the tool hub/back links; rename card actions to match their named destination.

**Acceptance:** tools are easy to choose by task; settings have a visible purpose; no setup choice promises personalisation that the product does not actually use.

### UX-13 — Finish lower-priority resilience and polish

**Priority:** P3  
**Status:** IN PROGRESS — shared SVG migration merged in PR #162; remaining UX-13 work is focused on loading stability and recoverable local-data failures in `ux/13-loading-recovery-states`  
**Depends on:** UX-04  
**Related findings:** X13–X15 and earlier-snapshot ear-training notes

- [ ] Add layout-stable loading placeholders for large dashboard and progress surfaces where measured layout shift warrants it.
  - [x] Reserve the Repertoire two-column workspace and Skills list/detail layout while local IndexedDB data loads; responsive skeletons preserve the expected desktop/mobile structure.
  - [ ] Measure loading layout shift on the Today dashboard and other large progress surfaces before adding further placeholders.
- [ ] Ensure recoverable errors have a retry action and a useful next destination.
  - [x] Application storage warnings can retry the local database probe and clear once storage recovers.
  - [x] Today dashboard IndexedDB load failures provide an in-place retry and a preferences destination; browser acceptance verifies recovery after storage becomes available.
  - [x] Skill map IndexedDB load failures provide an in-place retry and a direct route to browse lessons; browser acceptance verifies recovery.
  - [x] Repertoire initial local-project load failure now offers an in-place retry and a return-to-Today destination; browser acceptance covers recovery after IndexedDB becomes available.
  - [x] Practice history, active-session observations, adaptive suggestions and historical observations now use separate read-error states with context-specific retry actions; Practice history also offers a return-to-Today destination.
  - [ ] Audit remaining learner-facing recoverable errors and add context-specific retry/next actions.
  - [x] Tuner and note-recognition microphone failures change the primary control into an explicit retry action; browser acceptance verifies a retry makes a fresh user-initiated permission request.
  - [x] Metronome start and A4 reference-tone failures label the matching control with a specific retry action; the unrelated audio action remains independently available.
- [x] Replace inconsistent Unicode navigation/tool glyphs with a consistent accessible icon set (merged in PR #162).
  - [x] Replace the eight decorative Tools hub glyphs with a single local SVG icon component; the adjacent card headings provide the accessible names.
  - [x] Replace decorative pictograms in the Today sidebar and global mobile menu/navigation with the shared local SVG component; visible link text remains the accessible name.
  - [x] Audit and replace navigation, action, search and backup glyphs across individual tool pages and route-level controls with the shared local SVG component; retain intentional musical notation such as open-string markers and accidentals (PR #162).
- [ ] Apply safe-area insets and dynamic viewport sizing to fixed/sticky mobile controls where needed.
  - [x] Enable `viewport-fit=cover` and apply safe-area insets to the sticky global navigation and lesson outline offsets.
  - [x] Add `svh` and `dvh` fallbacks for the app body's minimum height and test it against changing mobile viewport heights.
  - [ ] Confirm notch, landscape and browser-chrome behaviour on physical iOS and Android devices.
- [ ] Re-check ear-training answer order and accessible visual alternatives; the advisory finding came from an earlier snapshot and must be re-verified before implementation.
  - [x] Confirm all five exercise types render a visible listening hint as well as text-labelled answer options.
  - [x] Rotate answer-option order deterministically by exercise sequence so correct answers do not remain tied to a fixed option position; unit tests cover all option positions for each exercise type and interval set.
- [ ] Remove or revise any stale tool disclaimers that no longer match the current implementation.

**Acceptance:** loading and error states guide recovery, icons render consistently and fixed controls do not collide with mobile browser chrome or device safe areas.

### UX-14 — Cross-browser, device and learner acceptance

**Priority:** P1 release gate  
**Status:** IN PROGRESS — browser acceptance covers both themes, narrow responsive layouts, keyboard focus and recovery. Physical iOS/Android, VoiceOver/TalkBack and learner think-aloud evidence remain blocked on real devices and participants  
**Depends on:** all P1 tasks; selected P2 tasks before wider release  
**Related findings:** audit methodology and acceptance plan

- [ ] Keep automated axe checks running in both themes and at 320, 390, 768 and 1280px.
- [ ] Extend responsive acceptance to include 360px and retain a hard no-horizontal-overflow assertion for core learner routes.
- [ ] Add a WebKit browser project alongside Chromium where the app's supported browser matrix permits it.
- [ ] Add an automated assertion that input, select and textarea computed font sizes are at least 16px at phone widths.
- [ ] Add contrast checks for interactive control boundaries and semantic danger/action colours.
- [ ] Test keyboard-only navigation, skip links, Escape behaviour, focus after save and focus after route/view changes.
- [ ] Test VoiceOver on iOS and TalkBack on Android for Today, Learn, a lesson, Practice and the tuner.
- [ ] Test on a physical 360px-class phone in both themes, including one-handed use while holding a guitar.
- [ ] Test offline reload, learner progress persistence and backup/restore on physical devices.
- [ ] Complete a live preview screenshot pass on desktop and mobile when preview access works; record browser, viewport, theme and date.
- [ ] Run five learner think-aloud tasks: start a 10-minute practice; find where a lesson left off; find a lesson by topic; tune the guitar; start a 60 BPM metronome; back up progress.
- [ ] Record completion, time, taps, confusion points and resulting follow-up actions. Do not claim usability validation from source inspection alone.

**Acceptance:** the automated suite is green and the outstanding manual checks have dated evidence, named device/browser/assistive-technology context and recorded outcomes.

---

## 7. Product decisions to resolve before locking patterns

| Decision | Current position | Required evidence / next action |
|---|---|---|
| Mobile primary navigation | Five labelled tabs are the approved primary mobile pattern: Today, Learn, Practice, Tools and Progress; Songs, Preferences and Data & backups remain in More | PR #166 implements the pattern; physical-device thumb reach and learner discoverability remain UX-14 acceptance |
| Practice plan action | UX review proposes starting a plan-based session | Confirm whether it starts immediately or first shows a concise session review; preserve learner control |
| Lesson presentation preferences | Current usage is not fully established by the source audit | Trace all consumers; implement visible effects or remove unsupported promise |
| Lesson reading density | UX review recommends a more prominent reading surface | Check long lesson usability at phone width and text zoom; preserve authored content |
| Vertical fretboard on phones | Suggested in UX review, not validated with learners | Prototype and compare with a responsive horizontal diagram before selecting |
| First-attempt scoring | UX review identifies a scoring flaw in note recognition | Confirm intended assessment semantics and event model before changing summaries |

Record each decision here with its date, rationale and linked PR before treating the decision as settled.

## 8. Definition of complete for a UI/UX PR

A UI/UX implementation PR is ready to merge only when:

- [ ] Its tracker task IDs and scope are named in the PR description.
- [ ] It preserves the non-negotiable curriculum, learner-data and assessment boundaries.
- [ ] Formatting, lint, type/Svelte checks, unit tests and production build pass.
- [ ] Relevant browser acceptance and axe tests pass in both themes.
- [ ] It introduces no page-level horizontal overflow at the tested phone widths.
- [ ] It includes keyboard and focus behaviour for new interactions.
- [ ] It has a useful empty, loading or error state where relevant.
- [ ] Learner-facing copy contains no unexplained internal IDs, raw enums or misleading status claims.
- [ ] Any unverified physical-device or assistive-technology acceptance is explicitly listed as still open.
- [ ] After merge, the tracker status and PR reference are updated.

A task is **VERIFIED** only after its manual acceptance steps are complete and the evidence is recorded here.

## 9. Change log

| Date | Change |
|---|---|
| 2026-11-16 | Opened PR #166 for UX-02/UX-14: five labelled mobile primary tabs, secondary More navigation, device safe-area handling, bottom content clearance and automated keyboard/active-state/touch-target coverage. WebKit acceptance is configured for the core learner routes, subject to PR CI confirmation. Physical-device and learner testing remain open. |
| 2026-11-16 | Opened PR #167 for UX-04: increased Today dashboard explanatory/task copy to shared readable type tokens and added browser size assertions. CI in progress; no merge until formatting, browser and accessibility checks pass. |
| 2026-11-16 | PR #147 (UX-11) merged as `857560b`; run #1434 passed required CI, including backup, accessibility, music-tool and curriculum browser acceptance. Backup recency is local-only and describes download start, not confirmed file retention. Web Share is deferred pending device/consent tests. |
| 2026-11-16 | UX-13 adds explicit, action-specific retry labels after tuner, note-recognition, metronome and A4 reference-tone failures. Browser acceptance verifies microphone retries remain user-initiated; remaining mutation-error audit and CI validation stay open. |
| 2026-11-16 | UX-12 groups all eight tools by task, explains microphone access before Start on tuner and note recognition, removes generic availability badges, and limits setup to effective goals/practice-duration preferences while preserving unused legacy schema fields. CI pending. |
| 2026-11-16 | PR #146 (UX-10) merged after the canonical skill fixture was corrected to seed catalogue IDs and the active curriculum release. Final required CI passed; manual learner acceptance remains under UX-14. |
| 2026-11-15 | PR #145 implements fretboard structure/inlays, prompted note-finding, selected-pitch playback and chord-box diagrams. CI rerun after synchronization is pending; manual device and assistive-technology checks remain under UX-14. |
| 2026-11-15 | PR #144 implementation and automated CI validation complete for UX-08; physical-device, keyboard-only, screen-reader and wake-lock lifecycle acceptance remain open under UX-14. |
| 2026-11-15 | Started UX-07 reader workflow pass: moved completion to the end of the lesson, placed alternatives and practice tools beside exercises, added retry actions and prepared section-link/mobile acceptance. Metronome BPM deep-link and full CI validation remain pending. |
| 2026-11-15 | Standardised practice duration to 5–180 minutes, with 10/20/40/60 presets and blur-committed custom preference entry in onboarding; dashboard overrides remain day-only. |
| 2026-11-15 | Started UX-05/UX-06 on `feat/ux-05-actionable-practice-plans`: real plan-to-session review hand-off, task/review/phase/history links, blur-based custom-duration validation, session-first practice layout, positive recommendation action and quick observation logging. Automated validation pending; full wake-lock/idle recovery and physical-device acceptance remain open. |
| 2026-11-15 | Opened PR #141 for UX-02/03/04/07: unified dashboard and shared-shell System/Light/Dark preference, queued lesson progress writes with rapid-edit regression coverage, removed save-time focus-disrupting disabled states, and raised lesson instruction typography to 16–17px. Automated CI and manual acceptance remain pending. |
| 2026-11-15 | Created the UI/UX implementation tracker from the advisory UX review, repository source audit, approved design direction and current PR #138/CI state. |
| 2026-11-15 | UX-01 merged as PR #138 (`98c0f72`); final CI run #1349 passed. Finder/device/screen-reader manual acceptance remains open. |
| 2026-11-15 | Started UX-02: strengthened 44px control targets and theme-safe control borders, made skip navigation focus the actual page main landmark, exposed restore-picker keyboard focus and added browser acceptance assertions. Save sequencing, full icon-control audit, 200% zoom and physical-device/assistive-technology checks remain open. |
| 2026-11-15 | Committed a narrow-screen lesson-catalogue footer wrapping fix after CI identified /learn overflow at 320px; validation remains pending. |
| 2026-11-15 | Reworked `docs/DESIGN_DIRECTION.md` into the Modern Music Studio target system and aligned `docs/IMPLEMENTATION_GUIDELINES.md`; the design is documented but not yet implemented in the application. |
| 2026-11-15 | Added `docs/research/UI_COMPONENT_SOURCE_AUDIT_2026-11-15.md`, comparing the supplied Tailwind sources and Svelte-native options. No component dependency was added; adoption is deferred to a specific UX task and compatibility/accessibility gate. |
