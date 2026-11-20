# Documentation index and authority

This index defines which document owns each kind of decision or status. Its purpose is to prevent parallel task lists, contradictory snapshots and repeated specifications.

## Live sources of truth

| Concern | Canonical authority | What it owns |
|---|---|---|
| Product requirements and learner behaviour | [Product specification](PRODUCT_SPEC.md) | Product promise, learner journey, learning model, privacy and first-release behaviour |
| Product milestone delivery | [Implementation roadmap](ROADMAP.md) | M0–M9 milestone scope and milestone-level state; not task-level engineering evidence |
| Engineering quality and release gates | [Engineering Quality & Release Tracker](ENGINEERING_QUALITY_TRACKER.md) | Current engineering, offline/privacy, UX, accessibility, performance, CI, security, deployment and release-gate status |
| Curriculum remediation | [Curriculum Audit & Remediation Tracker](CURRICULUM_AUDIT_AND_REMEDIATION_TRACKER.md) | Current curriculum authoring, mapping, assessment, taxonomy and progression work |
| Machine-readable curriculum release | `content/curriculum/release.json` and versioned lesson/catalogue files | Active curriculum release, lesson records, stable identifiers and skill definitions |
| System architecture | [Architecture decision](ARCHITECTURE.md) | Runtime, trust boundaries, data ownership, persistence, sync and technology decisions |
| Application service boundaries | [Application services](APPLICATION_SERVICES.md) | Use-case, repository and domain-service contracts |\n| Learner-data persistence model | [Data model](DATA_MODEL.md) | Learner-owned records, local persistence and future sync constraints |
| Product implementation behaviour | [Implementation guidelines](IMPLEMENTATION_GUIDELINES.md) | Personalisation, lesson delivery, practice, mastery and privacy implementation rules |
| Visual and interaction design | [Design Direction](DESIGN_DIRECTION.md) | Visual system, tokens, navigation, components, responsive behaviour and accessibility principles |
| Brand assets and usage | [Brand identity](BRAND_IDENTITY.md) | Logo/icon inventory and brand-asset usage |
| Authentication design | [Authentication decision](AUTHENTICATION_DECISION.md) | Accepted account methods, security requirements and non-goals |
| Authentication environment setup | [Authentication setup](AUTHENTICATION_SETUP.md) | Local/preview/production auth bindings, credentials, callbacks and migration procedure |
| First production release record | [Production environment decision](PRODUCTION_ENVIRONMENT_DECISION.md) | Evidence for the first release and future production change boundaries |
| Security headers and CSP | [Security response policy](SECURITY_RESPONSE_POLICY.md) | Required response headers and policy |
| Automated browser procedure | [Browser acceptance](BROWSER_ACCEPTANCE.md) | How to run and interpret automated browser acceptance |
| Curriculum reader procedure | [Curriculum reader acceptance](CURRICULUM_READER_ACCEPTANCE.md) | Curriculum reader-specific automated checks |
| Manual/device procedure | [Manual acceptance](MANUAL_ACCEPTANCE.md) | Repeatable physical-browser, accessibility and recovery test steps |

## Supporting references — not status trackers

These preserve technical detail, research, decisions or dated audit evidence. Their statuses, counts and checklists describe the named snapshot or work batch only; they must not be used as current project status.

- [Curriculum overview](CURRICULUM.md), [content model](CURRICULUM_CONTENT_MODEL.md) and [curriculum research](CURRICULUM_RESEARCH.md).
- [Pre-implementation readiness](PRE_IMPLEMENTATION_READINESS.md), [M1 implementation report](M1_IMPLEMENTATION_STATUS.md), [research integration plan](RESEARCH_INTEGRATION_PLAN.md) and [interval training progression report](INTERVAL_TRAINING_PROGRESSION.md).
- [Audio architecture audit](AUDIO_ARCHITECTURE_AUDIT.md), [synthetic pitch benchmarks](AUDIO_PITCH_BENCHMARKS.md), [real-recording evaluation protocol](AUDIO_REAL_RECORDING_EVALUATION.md) and [content provenance audit](CONTENT_PROVENANCE_AUDIT.md).
- Dated UI/UX audits, component-source research and M7.2 curriculum reports are evidence snapshots. Current task status belongs only in the Engineering or Curriculum tracker above.
- [CI failure/recovery runbook](CI_FAILURE_RECOVERY.md) is a procedure; execution evidence belongs in the Engineering tracker.

## Superseded compatibility pointers

The following filenames remain for existing links. They do not own current task lists and must not be expanded into parallel trackers:

- [Implementation tracker](IMPLEMENTATION_TRACKER.md)
- [Execution priority](EXECUTION_PRIORITY.md)
- [Optimization roadmap](OPTIMIZATION_ROADMAP.md)
- [UI/UX implementation tracker](UI_UX_IMPLEMENTATION_TRACKER.md)
- [CI improvement tracker](CI_IMPROVEMENT_TRACKER.md)
- [Real-device validation matrix](REAL_DEVICE_VALIDATION_MATRIX.md)
- [M7.2 curriculum integrity plan](M7_2_CURRICULUM_INTEGRITY_PLAN.md)
- [First-release scope snapshot](RELEASE_SCOPE.md)
- [M0 acceptance snapshot](ACCEPTANCE_CRITERIA.md)

## Update rules

1. Change a live task's state only in its canonical tracker. Do not copy task tables or status checklists into specifications, research reports, README or deployment runbooks.
2. Change product milestone state only in `ROADMAP.md`; link to the detailed Engineering or Curriculum tracker rather than repeating its tasks.
3. Machine-readable curriculum release files are authoritative for current curriculum facts. Reports tied to earlier release IDs remain historical evidence.
4. GitHub Issues and pull requests are the live record for issue/PR state, review and merge outcomes. Trackers link to evidence; they do not replace GitHub.
5. Each decision/specification document owns only its defined subject. Where implementation or verification state matters, link to the canonical tracker.
6. A historical report is not silently rewritten to make its original findings appear current. Correct its scope/date and point to the current authority instead.
