# M7.2 Curriculum Integrity Audit & Tracking Plan

**Status:** Planned — audit not yet completed  
**Scope:** Existing GuitarLab curriculum skill catalogue and lesson-to-skill mappings  
**Related work:** M7.2 versioned skill catalogue and adaptive practice  
**Baseline:** 34 distinct skill identifiers across 152 lessons

## 1. Purpose

Establish a reliable, reviewable source of truth for the skills already present in the curriculum. This work validates and documents the existing curriculum model; it is not a project to invent a larger skill taxonomy.

The outcome should make it possible to trust that:
- every skill identifier has a clear, assessable meaning;
- every lesson-to-skill mapping is intentional and defensible;
- skill progression is coherent across the curriculum;
- assessment evidence refers to stable skill definitions;
- catalogue changes are versioned and do not silently invalidate learner history.

## 2. Curriculum model — keep these concepts distinct

| Concept | Meaning | Treatment |
|---|---|---|
| Learning framework strand | Broad learning area or organizing dimension | Do not treat as an assessable skill record |
| Skill identifier | A specific capability that can be practised and assessed | Canonical catalogue entry |
| Lesson | A learning unit that teaches or practises capabilities | Maps to one or more existing skill identifiers |
| Assessment/evidence | A learner attempt or observation related to learning | Must retain stable skill identity and provenance |

The current baseline is **34 distinct skill identifiers mapped across 152 lessons**. The catalogue is the canonical, versioned registry for those existing identifiers. It should validate the curriculum mappings rather than replace them with an invented taxonomy.

## 3. Scope and non-goals

### In scope
- Audit all 34 existing skill identifiers and their definitions.
- Review all 152 lesson-to-skill mappings.
- Identify ambiguous, duplicate, overly broad, or questionable skill definitions.
- Check whether mappings accurately represent each lesson's learning outcomes.
- Review progression, prerequisites, and repeated practice opportunities where the curriculum provides enough evidence.
- Define assessment intent and observable success criteria for each skill.
- Define catalogue versioning, compatibility, and migration rules.
- Record curriculum-owner decisions and unresolved questions.

### Out of scope unless the audit demonstrates a concrete need
- Creating new skill identifiers merely to increase taxonomy granularity.
- Renaming or deleting stable identifiers for cosmetic consistency.
- Treating broad learning strands as skill records.
- Rewriting lessons or changing their learning objectives as part of a data-only validation.
- Changing learner mastery, assessment history, or historical evidence.
- Building a new recommendation algorithm before catalogue integrity is established.
- Extensive general external research. Use targeted research only for specific unresolved pedagogical or technical questions.

## 4. Audit workstreams and checklist

### A. Catalogue definition audit

- [ ] Export/list all 34 current skill identifiers.
- [ ] Confirm each identifier is unique and stable.
- [ ] Confirm each has a concise, specific definition.
- [ ] Confirm each describes an observable learner capability, not a topic, activity, instrument, or broad strand.
- [ ] Identify duplicates, synonyms, and overlapping definitions.
- [ ] Identify skills that are too broad to assess consistently.
- [ ] Define observable evidence or success criteria for each skill.
- [ ] Record any proposed definition changes without changing identifiers prematurely.

**Deliverable:** Reviewed catalogue with definition, category, observable outcome, assessment intent, and audit disposition for every existing identifier.

### B. Lesson mapping audit

- [ ] Produce a complete inventory of all 152 lessons and their current skill mappings.
- [ ] Check every referenced identifier exists in the canonical catalogue.
- [ ] Check that each mapping is supported by the lesson objective and learner activity.
- [ ] Flag mappings that appear incidental, misleading, or too broad.
- [ ] Check whether important lesson outcomes are unmapped.
- [ ] Check for inconsistent mappings between similar lessons.
- [ ] Record evidence and rationale for every proposed mapping change.

**Deliverable:** Mapping review register covering all 152 lessons, including an explicit disposition for each mapping.

### C. Progression and coverage audit

- [ ] Review how each skill is introduced, practised, revisited, and extended.
- [ ] Check for plausible sequencing across levels/years.
- [ ] Identify skills that appear too early, too late, or without sufficient preparation.
- [ ] Identify skills with no meaningful follow-up practice.
- [ ] Identify apparent progression gaps and repeated content that does not increase difficulty.
- [ ] Distinguish genuine prerequisites from convenient teaching order.

**Deliverable:** Skill progression and coverage findings, with evidence from lesson order and objectives.

### D. Assessment-readiness audit

- [ ] Define what a learner must demonstrate for each skill.
- [ ] Distinguish knowledge recognition, physical technique, musical performance, and creative application where relevant.
- [ ] Identify which skills can be assessed automatically, through structured self-report, or only through teacher/human judgement.
- [ ] Document limitations of self-reported practice observations.
- [ ] Ensure assessment coverage is not presented as mastery.
- [ ] Ensure recommendation signals do not claim correctness where evidence is unverified.

**Deliverable:** Assessment-readiness matrix for all catalogue entries.

### E. Versioning and learner-data safety

- [ ] Confirm the catalogue has an explicit version and release identity.
- [ ] Define which changes are non-breaking (for example, clarifying descriptive text).
- [ ] Define which changes require a new catalogue version.
- [ ] Define deprecation and replacement rules for identifiers.
- [ ] Define how historical evidence remains interpretable after catalogue updates.
- [ ] Define migration requirements before any identifier is removed or replaced.
- [ ] Ensure learner assessment and practice history is never silently rewritten.

**Deliverable:** Catalogue change policy and compatibility/migration rules.

### F. Validation and automation

- [ ] Validate catalogue schema and unique identifiers.
- [ ] Validate every lesson mapping against the catalogue.
- [ ] Validate required metadata and assessment intent.
- [ ] Add regression tests for catalogue stability and mapping integrity.
- [ ] Add tests for deprecated/replaced identifiers if that mechanism is introduced.
- [ ] Ensure generated curriculum indexes use the same canonical mapping source.
- [ ] Ensure adaptive practice reads the active learner and curriculum release correctly.

**Deliverable:** Automated curriculum-integrity checks in CI.

### G. Review and sign-off

- [ ] Review findings with the curriculum owner/subject-matter reviewer.
- [ ] Resolve or explicitly defer disputed mappings.
- [ ] Approve any identifier or mapping changes with written rationale.
- [ ] Publish the final audit report and decision log.
- [ ] Mark the audit complete only when all 34 skills and all 152 lessons have a recorded disposition.

**Deliverable:** Approved audit report and signed-off catalogue/mapping baseline.

## 5. Initial review queue

The following are review candidates surfaced during the initial catalogue/mapping review. They are **questions to validate**, not confirmed errors. Do not change them without checking lesson objectives and expected learner outcomes.

| Lesson / area | Mapping concern to investigate | Status |
|---|---|---|
| Y1 W2 — Clear single notes | Includes `harmony.triads` and `harmony.voice-leading`; verify that these are genuinely taught or assessed in this lesson | Open |
| Y1 W17 — Build major scale | Includes `lead.major-scale` and `lead.pentatonic`; verify both are supported by the lesson outcomes | Open |
| Y1 W20 — Play with expression | Includes `harmony.triads` and `harmony.voice-leading`; verify relevance to the expressive-performance objective | Open |
| Y1 W31 — Hammer-ons/pull-offs | Includes alternate-picking and string-crossing alongside legato; verify whether these are taught/assessed or incidental | Open |
| Year 3 Rock & Blues W4 — Legato control | Includes alternate-picking and string-crossing alongside legato; verify mapping precision | Open |
| Open-chord lessons | `harmony.open-chords` is reused across varied chord lessons; verify whether one skill definition is sufficiently precise for all mapped outcomes | Open |

For each candidate, record:
1. lesson identifier and title;
2. current mapped skill identifier(s);
3. relevant lesson objective/activity;
4. evidence supporting or contradicting the mapping;
5. proposed disposition: keep, clarify definition, add/remove mapping, or escalate;
6. reviewer and decision date.

## 6. Tracking register

Use this register as the single high-level progress view. Update it as work is completed.

| Workstream | Coverage / target | Status | Evidence / notes |
|---|---:|---|---|
| Catalogue definition audit | 34 skills | In progress | Preliminary definition review documented in `docs/M7_2_SKILL_DEFINITION_AUDIT.md`; curriculum-owner approval pending |
| Lesson mapping audit | 152 lessons | In progress | Register created; five flagged lessons reviewed in `docs/M7_2_FLAGGED_MAPPING_REVIEW.md` (3 provisionally supported, 2 decisions pending); 147 remaining rows need review |
| Progression and coverage | All 34 skills across curriculum | Not started | |
| Assessment-readiness | 34 skills | In progress | Separate draft machine-readable profiles created for all 34 skills (102 criteria) with evidence, retention, transfer and human-review guidance; no score thresholds or automated pass/fail approved |
| Versioning and learner-data safety | Catalogue policy | In progress | Versioned catalogue exists; policy review remains |
| Automated validation | Catalogue + mappings + profiles | In progress | Curriculum validator now checks draft profile coverage, catalogue/release version match, criteria/evidence, retention/transfer probes and automation guardrails; CI rerun pending |
| Curriculum-owner review | All findings | Not started | |
| Final sign-off | All workstreams | Not started | |

### Status definitions
- **Not started:** No systematic review has been completed.
- **In progress:** Review is underway; coverage or decisions remain incomplete.
- **Blocked:** Cannot proceed without a named dependency or reviewer decision.
- **Complete:** Evidence and disposition are recorded for the full stated scope.
- **Deferred:** Explicitly postponed with rationale and owner.

## 7. Decision log

Record every decision that changes catalogue meaning, mappings, or compatibility.

| Date | Item | Decision | Rationale / evidence | Approved by |
|---|---|---|---|---|
| TBD | Baseline | Retain the existing 34 skill identifiers as the audit baseline | Existing identifiers are already used across 152 lessons; avoid unnecessary identity churn | Pending |
| TBD | Learning strands | Keep broad learning framework strands distinct from assessable skill records | They represent different levels of the curriculum model | Pending |
| TBD | Mapping changes | Require lesson-level evidence before changing mappings | Prevent speculative taxonomy or mapping changes | Pending |

## 8. Acceptance criteria

The audit is complete only when all of the following are true:

1. All 34 existing identifiers have a reviewed definition and recorded disposition.
2. All 152 lessons have had their skill mappings reviewed and recorded.
3. Every mapping points to a valid catalogue identifier.
4. Ambiguous, duplicate, overly broad, and questionable entries have a documented decision or explicit deferral.
5. Progression and coverage findings are documented.
6. Each skill has an assessment intent and observable evidence criteria, or a documented reason why it cannot yet be assessed reliably.
7. Catalogue versioning and historical learner-data compatibility rules are documented.
8. Automated validation protects the approved catalogue and lesson mappings.
9. Curriculum-owner review and final sign-off are recorded.

## 9. Research approach

Do not begin with a broad external research project. Start with the repository's curriculum source data, lesson objectives, existing mappings, catalogue, generated curriculum data, and tests.

Use targeted external research only when a specific question cannot be resolved from the curriculum itself—for example, a disputed pedagogical progression, a specialist technique definition, or an assessment-validity question. Record the question, source, finding, and how it affects a decision. External convention alone is not sufficient reason to rename an established skill identifier.

## 10. Working rules

- Preserve existing skill identifiers unless a documented, reviewed reason requires change.
- Do not infer that a lesson teaches a skill solely because the skill is in the same broad category.
- Do not infer mastery from lesson completion, assessment coverage, or self-reported practice.
- Do not silently rewrite learner history when catalogue definitions or mappings change.
- Prefer explicit, evidence-backed corrections over broad curriculum restructuring.
- Keep unresolved questions visible; do not hide uncertainty behind automated validation.
- Update this document as the audit progresses and link detailed evidence from the relevant sections.

## 11. Related repository artefacts

- `content/curriculum/skill-catalog.json` — canonical versioned skill catalogue.
- `docs/M7_2_SKILL_CATALOG_AUDIT.md` — initial skill catalogue and mapping audit.\n- `docs/M7_2_SKILL_DEFINITION_AUDIT.md` — preliminary review of all 34 skill definitions and proposed observable evidence.\n- `docs/M7_2_LESSON_SKILL_MAPPING_REGISTER.md` — source-derived register covering all 152 lessons, current mappings, focus, and checkpoint evidence cues.\n- `docs/M7_2_FLAGGED_MAPPING_REVIEW.md` — evidence-based review of five initially flagged lessons.
- `src/lib/application/skill-catalog.ts` — application-level catalogue access.
- Curriculum validation scripts/tests — automated integrity enforcement.
- M7.2 adaptive practice implementation — downstream consumer of skill and learner evidence.

---

**Next action:** Verify CI for the new assessment-profile validator, then continue the mapping audit with the high-reuse `harmony.open-chords` and repeated capstone skill mappings as priority review groups. Obtain curriculum-owner decisions for Year 1 Weeks 2 and 20. The preliminary 34-skill definition review is documented, but curriculum-owner approval and assessment rubric design remain open. Do not change curriculum identifiers or mappings until the evidence and proposed disposition are recorded.
