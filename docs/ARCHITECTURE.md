# GuitarLab — Final Architecture Decision

**Status:** Accepted for implementation  
**Decision date:** 2026-11-11  
**Scope:** Personal, single-learner product with a public source repository and private runtime data.

This is the implementation authority for M1–M9. It resolves earlier planning options. The chosen architecture is a modular SvelteKit application on Cloudflare Workers, with IndexedDB as the local-first store and D1 as the optional authenticated cloud-sync store.

## 1. Final technology decisions

| Concern | Decision | Boundary |
|---|---|---|
| Application | SvelteKit, Svelte 5, TypeScript | Single modular application |
| Styling | Tailwind CSS 4 via Vite plugin | Design tokens in CSS |
| Runtime | Cloudflare Workers | Full-stack SSR and server endpoints; not static-only |
| Adapter | @sveltejs/adapter-cloudflare | Worker deployment output |
| Static assets | Workers Static Assets | App build and public assets |
| Cloud database | Cloudflare D1 | Authenticated sync copy, not a requirement for local practice |
| ORM/migrations | Drizzle ORM and Drizzle Kit | Versioned schema and reviewed SQL migrations |
| Validation | Zod | All external inputs and import/export payloads |
| Local persistence | IndexedDB | Primary learner state for offline-first use |
| Offline assets | Service worker and Cache Storage | App shell and selected public curriculum only |
| Audio | Web Audio API and MediaDevices | Opt-in microphone, local processing by default |
| Tests | Vitest and Playwright | Domain, integration and browser journeys |
| Quality | TypeScript, ESLint, Prettier | Required CI gates |
| CI/CD | GitHub Actions and Wrangler | Deploy after checks, with environment-specific secrets |

**Product posture:** local-first single-player application. Cloud sync is optional and must not be enabled before authentication, authorisation and conflict handling are implemented and tested. Public source code does not mean public learner data or a public application profile.

## 2. System context and trust boundaries

~~~mermaid
flowchart TB
  subgraph DEVICE["Learner device — private boundary"]
    UI["SvelteKit UI / Svelte 5"]
    DOMAIN["Client domain services"]
    IDB[("IndexedDB: profile, progress, practice, outbox")]
    CACHE[("Cache Storage: app shell and public lessons")]
    AUDIO["Web Audio API: tuner, metronome, ear training"]
    SW["Service worker"]
    UI --> DOMAIN
    DOMAIN <--> IDB
    UI --> AUDIO
    SW <--> CACHE
  end
  subgraph EDGE["Cloudflare edge — optional sync boundary"]
    WORKER["Cloudflare Worker: SvelteKit SSR and routes"]
    AUTH["Authentication and authorisation"]
    VALIDATE["Zod validation"]
    APP["Application services"]
    DATA["Drizzle data-access layer"]
    D1[("Cloudflare D1")]
    WORKER --> AUTH --> VALIDATE --> APP --> DATA --> D1
  end
  DOMAIN <-->|"HTTPS sync when enabled"| WORKER
  CONTENT["Versioned public curriculum JSON"] --> UI
~~~

- Device data remains available if the network, Worker or cloud database is unavailable.
- The Worker is a trust boundary. Cloud data access is authenticated and authorised server-side.
- The browser never receives D1 credentials or privileged service bindings.
- Public curriculum is separate from private progress and may be cached.
- Microphone samples are processed locally and are not uploaded by default.

## 3. Application structure

~~~text
src/
  routes/                  # SvelteKit pages and thin server endpoints
  lib/
    components/            # accessible reusable UI
    features/
      dashboard/
      curriculum/
      lesson-player/
      practice-studio/
      fretboard/
      chord-lab/
      tuner/
      metronome/
      ear-training/
      progress/
    domain/
      curriculum/           # content contracts and progression rules
      learning/             # skill state, mastery and review rules
      practice/              # session and exercise rules
      music/                 # notes, intervals, chords, scales, tempo
    application/             # use cases and orchestration
    repositories/            # repository interfaces
    adapters/
      indexeddb/             # browser-local implementation
      cloudflare-d1/         # server-only Drizzle implementation
    validation/              # Zod schemas
    sync/                    # outbox, idempotency, conflict handling
    audio/                   # browser-only audio services
  service-worker.ts
content/curriculum/          # versioned public curriculum JSON
drizzle/migrations/          # committed SQL migrations
tests/
  unit/
  integration/
  e2e/
~~~

Keep Svelte components focused on presentation and interaction. Put music calculations and learning-state transitions in framework-independent domain modules. Feature code depends on repository interfaces, never directly on IndexedDB or Drizzle.

Rendering rules:
- Use SvelteKit SSR for the application shell and content where it improves first load.
- Treat private learner state as client-local unless authenticated cloud sync is explicitly enabled.
- Never put private profile data in prerendered HTML, public endpoints, static JSON, analytics events or repository fixtures.
- Keep endpoints thin: validate, authenticate/authorise, call a use case and return a typed result.
- Core practice logging must remain usable offline.

## 4. Data architecture and source-of-truth rules

1. **Curriculum:** versioned JSON in Git, reviewed and released with the application.
2. **Local learner state:** IndexedDB is primary for the offline-first personal experience.
3. **Cloud-synchronised state:** D1 stores the authenticated synchronised copy only after sync is enabled.
4. **Audio recordings:** device-local by default. R2 is considered only for deliberate user-initiated backup/upload.
5. **Derived analytics:** calculated from practice and assessment evidence; never replace source records.

Initial relational domains:

| Domain | Tables / records | Rule |
|---|---|---|
| Identity | users, sessions, linked accounts | Add only when cloud authentication is enabled |
| Curriculum | curriculum_versions, learning_paths, phases, lessons | Released content versions are immutable |
| Progress | lesson_progress, skill_mastery, skill_assessments | Lesson completion is independent from skill evidence; new profiles start empty |
| Skills | skills, skill_mastery, skill_assessments | Assessment evidence is append-only |
| Practice | practice_sessions, practice_exercises, practice_notes | Store actual activity, not assumed timer completion |
| Music reference | chords, scales, intervals, songs, bookmarks | Metadata separate from copyrighted source material |
| Preferences | user_settings, instrument_settings, practice_goals | User-scoped and exportable |
| Sync | devices, sync_operations, sync_cursors | Idempotent operation IDs and explicit conflicts |

Use stable client-generated IDs for offline-created records. Include created/updated timestamps, schema/content version and ownership where applicable. Avoid storing redundant derived totals.

Repository interfaces should include CurriculumRepository, ProgressRepository, PracticeSessionRepository and AssessmentRepository. Implement IndexedDB adapters in the browser and Drizzle/D1 adapters on the server.

## 5. Offline-first synchronisation

Sync is a later milestone, not a prerequisite for the first useful local release.

1. Every local record receives a stable ID and local revision.
2. A transaction writes the record and its outbox operation atomically in IndexedDB.
3. When online and authenticated, the client sends a bounded batch over HTTPS.
4. The server validates payloads, checks ownership and deduplicates by operation ID.
5. The server commits accepted changes and returns acknowledgements, versions and conflicts.
6. The client marks acknowledged operations and updates its sync cursor.
7. Conflicts are handled by data type, never by blanket last-write-wins.

Conflict policy:
- Append-only assessments and practice events: preserve both.
- Lesson completion and skill mastery remain separate; assessment evidence is append-only.
- Editable notes/preferences: version check; offer resolution if both sides changed.
- Curriculum content: application release version is authoritative; progress references a content version.
- Delete/reset: explicit tombstone and confirmation; never infer deletion from a missing record.

Export/restore works without cloud sync. Restore validates schema version, previews the import and is idempotent.

## 6. Authentication and privacy

- Initial mode: local-only, no registration required.
- Cloud sync mode: verified authentication required before creating or reading user-owned D1 records.
- Use secure, HTTP-only, SameSite session cookies and CSRF protection for state-changing requests.
- Enforce ownership in every server use case, not only in the UI.
- Never rely on an obscure URL or Cloudflare Access alone as data-level authorisation.
- Keep secrets in Cloudflare/GitHub secret stores, never in Git.
- Do not log journal text, recordings, session tokens or raw microphone data.
- Microphone permission follows explicit user action. Process audio locally; no upload by default.
- Provide export and account/data deletion flows before cloud accounts are enabled.

The repository is public, but the production application and learner profile remain private. No legacy personal lesson baseline, practice journal, recording or profile data belongs in Git; initialize new profiles empty.

## 7. Cloudflare service decisions

| Service | Decision | Activation rule |
|---|---|---|
| Workers | Use now | SvelteKit full-stack runtime and API |
| D1 | Configure in M2 | Relational cloud sync store; migrations from first schema |
| Workers Static Assets | Use now | Serve application build and public assets |
| R2 | Defer | Only for explicit remote recording/file backup |
| KV | Defer | Cache/rate-limit/config only; never authoritative learner state |
| Queues | Defer | Add only for a measured background workload |
| Durable Objects | Defer | Not needed for single-user, non-collaborative product |
| Workers AI | Defer | No paid AI dependency in initial release |

### Environment isolation

- **Local:** Wrangler local Worker and local D1; dummy data; no production bindings.
- **Preview:** isolated Worker and preview D1 database per branch where practical.
- **Production:** separate Worker and D1; migrations are a controlled release step after backup/verification.

Use wrangler.jsonc with explicit environment-specific bindings. Local and preview environments must never inherit production database IDs. Generate Drizzle SQL migrations, review them, test against disposable D1 and apply to the target environment in a controlled step.

## 8. Audio capability boundaries

The current ownership inventory and migration sequence are recorded in [AUDIO_ARCHITECTURE_AUDIT.md](AUDIO_ARCHITECTURE_AUDIT.md).

- Metronome, reference tones and ear-training examples use the Web Audio API and remain locally generated.
- Reuse a shared browser audio-session lifecycle where it removes duplicated AudioContext creation, scheduling, stop and disposal logic; keep feature-specific exercise logic in its domain module.
- Microphone input is opt-in. Request permission only after a clear learner action and only for a feature that needs capture.
- Process microphone samples locally by default. Do not upload, persist or log raw audio or microphone-derived personal data.
- Single-note pitch detection must expose confidence, reject silence/noisy input, and track stable notes to avoid repeated detections from one sustained note.
- Unsupported APIs and denied permissions must produce safe, accessible fallback states; they must not block non-microphone learning tools.
- Validate pitch detection against deterministic synthetic signals and representative real guitar recordings. Document device/environment limits and avoid unsupported accuracy claims.
- Automatic polyphonic chord recognition and objective performance grading remain out of scope until validated on representative instruments, devices and environments.

## 9. Quality, observability and delivery

Required CI gates:
1. Install from the committed lockfile.
2. Format check and ESLint.
3. TypeScript/Svelte checks.
4. Unit tests for music theory, curriculum validation and progression rules.
5. Integration tests for IndexedDB repositories, Drizzle queries and D1 migrations.
6. Playwright journeys for resume lesson, log practice, offline capture and export/restore.
7. Production build using the Cloudflare adapter.
8. Preview deployment smoke test before production promotion.

Use structured, privacy-safe logs with request IDs and error categories. Never log personal notes, recordings, auth tokens or microphone data. Track application errors, sync failure rates, migration status and performance without behavioural surveillance. Keep migrations and content versions under source control. Maintain Worker rollback and tested learner-data export/restore procedures.

## 10. Delivery sequence and gates

| Milestone | Architecture deliverable | Exit gate |
|---|---|---|
| M1 | SvelteKit, Svelte 5, Tailwind 4, Cloudflare adapter, Wrangler, CI | Local app builds and runs in Worker-compatible runtime |
| M2 | D1, Drizzle, migrations, validation, repository interfaces | Fresh DB migration and repository tests pass |
| M3–M4 | Dashboard, curriculum and lesson engine | Resume and progress flows work with local persistence |
| M5 | IndexedDB, outbox, export/restore, optional auth/sync | Offline/reconnect and idempotent import tests pass |
| M6–M8 | Audio and music feature modules | Accuracy, accessibility, permission, content-rights and cross-browser tests pass |
| M9 | PWA, security, performance and production deployment | Release checklist and smoke tests pass |

## 11. Explicit non-goals and accepted trade-offs

No microservices, Kubernetes, separate API server, Redis, mandatory account, public learner profiles, social graph, real-time collaboration, AI provider dependency or server-side audio processing.

IndexedDB-first means cloud sync is not immediate; this is intentional for offline reliability and privacy. D1 is the chosen cloud relational store, but local repositories isolate the app from D1 availability. A service worker adds cache-versioning complexity, so it is limited to app shell and selected public learning content. Full-stack Workers is chosen over static Pages because the product requires server routes, D1 and future authenticated sync.

**Architecture is considered final for M1.** Revisit a decision only when an implementation constraint, security review or measured product need provides evidence for changing it.
