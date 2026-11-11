# GuitarLab System Diagrams

These diagrams describe the approved architecture and the implementation boundaries. Solid nodes/links describe the product design; dashed nodes/links indicate later milestones. The repository's authored curriculum and architecture document remain the sources of truth.

## 1. System context and trust boundaries

```mermaid
flowchart LR
  learner([Learner])
  subgraph device["Learner device · private boundary"]
    ui["GuitarLab SvelteKit UI"]
    prefs["Learner preferences"]
    idb[("IndexedDB · M2.3")]
    audio["Web Audio / MediaDevices"]
    ui <--> prefs
    prefs -. "persist locally · M2.3" .-> idb
    ui --> audio
  end
  subgraph public["Public application assets"]
    lessons["Versioned curriculum JSON · 152 lessons"]
    shell["SvelteKit app shell"]
  end
  subgraph edge["Cloudflare edge · optional sync boundary"]
    worker["Cloudflare Worker"]
    auth["Authentication + ownership checks · later"]
    validate["Zod request validation"]
    services["Application services"]
    d1[("D1 + Drizzle · M2")]
    worker -. "authenticated sync only" .-> auth
    auth -.-> validate
    validate -.-> services
    services -.-> d1
  end
  learner --> ui
  shell --> ui
  lessons --> ui
  ui -. "future sync only" .-> worker
```

**Privacy rule:** public curriculum and application code may be served from the edge. Learner preferences, assessments, practice notes and recordings remain private. Local persistence is added in M5; D1 is an optional authenticated sync copy, not a requirement for local practice.

## 2. Progressive teaching and evidence loop

```mermaid
flowchart TD
  A["Start with a fresh learner profile"] --> B["Choose today's lesson or practice action"]
  B --> C["Learn · clear explanation and objective"]
  C --> D["See / hear · demonstration or text fallback"]
  D --> E["Practise · guided steps and musical application"]
  E --> F["Test · recall and checkpoint"]
  F --> G{"Evidence meets this skill's criteria?"}
  G -- "Not yet" --> H["Record attempt and feedback"]
  H --> I["Repeat, slow down, split or schedule review"]
  I --> E
  G -- "Yes" --> J["Record assessment evidence"]
  J --> K["Update skill state from evidence"]
  K --> L["Record lesson-content completion separately"]
  L --> M["Recommend the next useful action"]
  M --> B
```

A lesson view, elapsed timer or completion button does not establish skill mastery. Lesson-content completion and demonstrated skill evidence are separate records. An unsuccessful checkpoint is useful feedback, not a punitive failure.

## 3. Data ownership and sync boundary

```mermaid
flowchart TB
  curriculum["Git-versioned curriculum JSON"] --> browser["Client application"]
  browser --> local["Local learner profile / preferences · M2.3"]
  browser --> practice["Practice sessions / notes / attempts"]
  local --> storage[("IndexedDB · M2.3")]
  practice --> storage
  storage -. "authenticated, explicit sync" .-> outbox["Idempotent sync outbox · later"]
  outbox -.-> worker["Cloudflare Worker"]
  worker -. "validate + authorise" .-> server["Server application services"]
  server -.-> d1[("D1 synchronised copy · M2/M5")]
  private["Microphone / audio analysis"] --> localAudio["On-device processing"]
  localAudio --> browser
```

- New profiles start empty and do not import another lesson history.
- Assessments and practice events are append-only evidence.
- Cloud sync is disabled until authentication, ownership checks and conflict rules are implemented.
- Microphone processing is opt-in and local by default.

## 4. Delivery and verification pipeline

```mermaid
flowchart TD
  change["Feature branch commit / pull request"] --> install["Install locked dependencies"]
  install --> audit["Dependency audit · block high / critical"]
  audit --> curriculum["Validate 152 authored lessons"]
  curriculum --> contrast["Validate dark / light theme contrast"]
  contrast --> format["Prettier format check"]
  format --> lint["ESLint"]
  lint --> types["Svelte + TypeScript checks"]
  types --> tests["Vitest unit tests"]
  tests --> build["Cloudflare Worker production build"]
  build --> review["PR review and merge"]
  review --> preview["Worker preview / smoke test"]
  preview --> release["Controlled production release"]
```

The CI gate validates the source and builds the Worker. A successful build is not itself proof of a live deployment; preview and production release remain separate verification steps.

## 5. Milestone sequence

```mermaid
flowchart LR
  M0["M0 · Product, curriculum and architecture"] --> M1["M1 · SvelteKit + Worker foundation"]
  M1 --> M2["M2.1–M2.2 · D1 / Drizzle + domain services"]
  M2 --> M23["M2.3 · Local IndexedDB profile and repositories"]
  M23 --> M24["M2.4 · Export / restore / safe reset"]
  M24 --> M3["M3 · Learning dashboard"]
  M3 --> M4["M4 · Curriculum and lesson engine"]
  M4 --> M5["M5 · Offline hardening + authenticated sync"]
  M5 --> M6["M6 · Music tools"]
  M6 --> M7["M7 · Practice studio"]
  M7 --> M8["M8 · Musicianship and repertoire"]
  M8 --> M9["M9 · Release hardening"]
```

## 6. M2.1 relational data model

The relational schema is split between immutable curriculum release metadata and learner-owned activity/evidence. Foreign-key ownership keys are shown where they enforce scope. Full lesson bodies remain in versioned JSON and are not stored in D1.

```mermaid
erDiagram
  CURRICULUM_RELEASES ||--o{ CURRICULUM_LESSONS : indexes
  CURRICULUM_RELEASES ||--o{ CURRICULUM_RELEASE_SKILLS : contains
  SKILLS ||--o{ CURRICULUM_RELEASE_SKILLS : versioned_in
  LEARNER_PROFILES ||--o{ LESSON_PROGRESS : owns
  CURRICULUM_LESSONS ||--o{ LESSON_PROGRESS : referenced_by
  LESSON_PROGRESS ||--o{ LESSON_COMPLETION_EVENTS : records
  LEARNER_PROFILES ||--o{ LESSON_COMPLETION_EVENTS : owns
  LEARNER_PROFILES ||--o{ SKILL_ASSESSMENT_ATTEMPTS : owns
  CURRICULUM_RELEASE_SKILLS ||--o{ SKILL_ASSESSMENT_ATTEMPTS : assesses
  CURRICULUM_LESSONS o|--o{ SKILL_ASSESSMENT_ATTEMPTS : context_for
  LEARNER_PROFILES ||--o{ SKILL_MASTERY : owns
  CURRICULUM_RELEASE_SKILLS ||--o{ SKILL_MASTERY : tracks
  SKILL_ASSESSMENT_ATTEMPTS o|--o{ SKILL_MASTERY : evidence_pointer
  LEARNER_PROFILES ||--o{ PRACTICE_SESSIONS : owns
  CURRICULUM_LESSONS o|--o{ PRACTICE_SESSIONS : optional_focus

  CURRICULUM_RELEASES {
    text id PK
    text version UK
    integer schema_version
    text content_hash
    integer published_at
    text status
  }
  CURRICULUM_LESSONS {
    text release_id PK,FK
    text lesson_id PK
    text curriculum_id
    text curriculum_week_id
    integer week
    text route
    text title
    text focus
    integer estimated_minutes
  }
  SKILLS {
    text id PK
    text category
    text display_name
  }
  CURRICULUM_RELEASE_SKILLS {
    text release_id PK,FK
    text skill_id PK,FK
  }
  LEARNER_PROFILES {
    text id PK
    integer preferences_schema_version
    text preferences_json
    integer created_at
    integer updated_at
  }
  LESSON_PROGRESS {
    text id PK
    text learner_id FK
    text curriculum_release_id FK
    text lesson_id FK
    text status
    integer started_at
    integer completed_at
  }
  LESSON_COMPLETION_EVENTS {
    text id PK
    text progress_id FK
    text learner_id FK
    text completion_source
    integer completed_at
  }
  SKILL_ASSESSMENT_ATTEMPTS {
    text id PK
    text learner_id FK
    text curriculum_release_id FK
    text skill_id FK
    text lesson_id FK
    text evidence_type
    text outcome
    integer score
    integer assessed_at
  }
  SKILL_MASTERY {
    text learner_id PK,FK
    text curriculum_release_id PK,FK
    text skill_id PK,FK
    text state
    integer evidence_count
    text last_assessment_id FK
    integer next_review_at
  }
  PRACTICE_SESSIONS {
    text id PK
    text learner_id FK
    text primary_curriculum_release_id FK
    text primary_lesson_id FK
    text status
    integer planned_minutes
    integer actual_duration_seconds
    integer started_at
    integer ended_at
  }
```

**Important distinctions:** `lesson_progress` is the current/resume state; `lesson_completion_events` is append-only completion history; `skill_assessment_attempts` is append-only evidence; `skill_mastery` is a derived snapshot that must reference a passed attempt for the same learner, release and skill. These relationships are enforced by composite foreign keys, checks and database triggers in the M2.1 migration.



## 7. M2.2 application and repository boundaries

```mermaid
flowchart TB
  UI["Svelte UI / thin route"] --> UC["Application use case"]
  UC --> ZOD["Zod input validation"]
  ZOD --> PORTS["Repository contracts"]
  PORTS --> PUBLIC["Public content ports"]
  PORTS --> PRIVATE["Private learner-state ports"]
  PUBLIC --> JSON["Versioned curriculum JSON"]
  PRIVATE --> IDB["IndexedDB adapter · M2.3"]
  PRIVATE -. "server-only, future authenticated sync" .-> D1["Drizzle / D1 adapter"]
  UC --> ERR["Typed safe application errors"]
  ERR --> UI
```

The use cases depend on interfaces, not storage libraries. Public curriculum reads cannot access learner records. Lesson completion writes progress and its immutable event through one atomic repository operation; assessment attempts are append-only; stable mastery is recalculated from scoped evidence; practice completion is a conditional transition and never grants mastery. Concrete IndexedDB and D1 adapters remain separate milestones.
