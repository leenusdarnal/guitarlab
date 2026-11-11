# GuitarLab data model (M2.1)

## Authority and boundaries

- Authored lesson bodies remain versioned JSON in content/curriculum.
- D1 stores a release fingerprint plus lightweight lesson/skill lookup metadata.
- Learner preferences, progress, completions, assessment attempts, mastery snapshots and practice sessions are learner-owned records.
- No users, sessions, authentication, public progress endpoints or production D1 database are created by this milestone.
- A future cloud-sync route must authenticate and authorise a learner before it accesses their D1 rows. The current app has no such route.

## Tables

| Table | Purpose | Write rule |
|---|---|---|
| curriculum_releases | Immutable content/schema fingerprint | Publish a new release; never edit in place |
| curriculum_lessons | Versioned lookup metadata for authored lessons | Immutable |
| skills | Stable skill identifiers and display labels | Immutable identifiers |
| curriculum_release_skills | Skills belonging to a content release | Immutable |
| learner_profiles | Private learner preferences and profile schema version | Learner-owned |
| lesson_progress | Resume/current state for one learner and lesson | One row per learner/release/lesson |
| lesson_completion_events | Append-only completion history | Insert only |
| skill_assessment_attempts | Append-only, structured skill evidence | Insert only |
| skill_mastery | Derived skill-state snapshot with evidence pointer | Update only from a validated use case |
| practice_sessions | Planned vs actual practice activity and reflection | Learner-owned |

## Progression guarantees

1. Lesson completion is stored in lesson_progress and lesson_completion_events. It does not create or update a mastery row.
2. Assessment attempts are immutable. Corrections are represented by a new attempt, never by overwriting evidence.
3. A stable mastery row must point to a passed attempt for the same learner, skill and curriculum release. This is checked in the application contract and SQLite triggers/foreign keys.
4. An absent mastery row means the skill has not yet been assessed in that release. A timer or completed lesson does not create mastery.
5. Practice stores planned minutes separately from actual duration. Completing a timer is not evidence of skill.

## Local development

Node.js 22.18+ is required.

```bash
npm install
npm run db:generate
npm run db:finalize
npm run db:migrate:local
npm run db:test:local
```

The migration finalizer seeds the current 152 lesson references and 34 stable skill IDs from authored JSON. It stores metadata only, never lesson bodies.

Wrangler local mode is isolated from remote D1. The D1 binding uses an all-zero local placeholder. No production database is provisioned.

## Versioning and curriculum changes

The first release is curriculum-v1 / semantic version 1.0.0. The migration records a SHA-256 fingerprint over the six outline/lesson JSON files. If any source file changes, the finalizer fails and requires an explicit new curriculum release migration; it will not rewrite an already applied migration.

## Deliberately deferred

- Authentication and owner-subject mapping
- Cloud sync endpoints, devices and sync cursors
- IndexedDB adapters and offline outbox (M5)
- Practice exercise breakdown and audio storage
- Profile editing/use cases and repository adapters
- Import/restore workflow
