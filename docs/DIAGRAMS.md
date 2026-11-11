# GuitarLab System Diagrams

These diagrams describe the approved architecture and the implementation boundaries. Solid nodes/links describe the product design; dashed nodes/links indicate later milestones. The repository's authored curriculum and architecture document remain the sources of truth.

## 1. System context and trust boundaries

```mermaid
flowchart LR
  learner([Learner])
  subgraph device["Learner device · private boundary"]
    ui["GuitarLab SvelteKit UI"]
    prefs["Learner preferences"]
    idb[("IndexedDB · M5")]
    audio["Web Audio / MediaDevices"]
    ui <--> prefs
    prefs -. "persist locally · M5" .-> idb
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
  browser --> local["Local learner profile / preferences"]
  browser --> practice["Practice sessions / notes / attempts"]
  local --> storage[("IndexedDB · M5")]
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
  M1 --> M2["M2 · D1 / Drizzle + domain services"]
  M2 --> M3["M3 · Learning dashboard"]
  M3 --> M4["M4 · Curriculum and lesson engine"]
  M4 --> M5["M5 · IndexedDB + offline + sync"]
  M5 --> M6["M6 · Music tools"]
  M6 --> M7["M7 · Practice studio"]
  M7 --> M8["M8 · Musicianship and repertoire"]
  M8 --> M9["M9 · Release hardening"]
```

