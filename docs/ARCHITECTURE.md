# GuitarLab Architecture

## 1. Architecture principles

1. **Local-first learning:** lesson access, practice logging and progress capture should work without a network connection.
2. **Optional cloud sync:** the server is an additional durable copy and sync point, not a prerequisite for daily practice.
3. **Progress integrity:** retain assessment history and completed lesson records; corrections should be auditable.
4. **Modular content:** curriculum content is separate from presentation components.
5. **Honest measurement:** distinguish user-reported practice from measurements produced by a validated tool.
6. **Privacy by default:** microphone processing stays on-device unless the learner explicitly chooses otherwise.
7. **Incremental infrastructure:** introduce Cloudflare services only when a real feature requires them.

## 2. Application stack

- SvelteKit with Svelte 5 and TypeScript.
- Tailwind CSS 4 using its supported Vite integration.
- `@sveltejs/adapter-cloudflare` for the Cloudflare Workers runtime.
- Cloudflare Workers for server-rendered pages and API endpoints.
- Cloudflare D1 as the relational system of record for synchronised data.
- Drizzle ORM and Drizzle Kit for typed queries and versioned migrations.
- Zod for validation at external boundaries.
- IndexedDB for local lessons, practice sessions and pending sync operations.
- Cache Storage/service-worker support for app shell and selected learning content.
- Web Audio API and MediaDevices for tuner, metronome and opt-in audio exercises.
- Vitest for unit/integration tests and Playwright for end-to-end tests.

## 3. High-level system

```text
Browser / PWA
  ├── SvelteKit UI
  ├── Learning and practice modules
  ├── IndexedDB (local progress and outbox)
  ├── Cache Storage (app shell / offline assets)
  └── Web Audio API (local audio tools)
          │ optional sync over HTTPS
          ▼
Cloudflare Worker (SvelteKit server)
  ├── Request validation (Zod)
  ├── Authentication / authorisation boundary
  ├── Application services
  └── Data access layer (Drizzle)
          │
          ▼
Cloudflare D1
```

The client must remain useful when the Worker or network is unavailable. The sync layer reconciles local operations when connectivity returns.

## 4. Cloudflare services

| Service | Role | Initial decision |
|---|---|---|
| Workers | Full-stack runtime and API | Core |
| D1 | Relational cloud data | Core |
| R2 | Optional user-selected recordings/assets | Defer |
| KV | Non-authoritative cache/configuration | Defer |
| Queues | Background processing | Defer |
| Durable Objects | Real-time shared state | Defer |
| Workers AI | Optional future experiments | Not required |

Do not use KV as the authoritative store for learner progress.

## 5. Environments

Maintain isolated local, preview and production resources:

- **Local:** Wrangler local runtime and local D1; no accidental writes to production.
- **Preview:** branch/PR Worker and isolated preview database where practical.
- **Production:** production Worker and production D1, deployed only after checks pass.

Use `wrangler.jsonc` for bindings and environment configuration. Keep credentials in GitHub/Cloudflare secrets, never in source control. Use migrations from the beginning and test them against a disposable database before production.

## 6. Data domains

Initial logical domains:

- Curriculum: learning paths, phases, lessons, lesson content.
- Learning state: lesson progress, skill definitions, mastery state and review schedule.
- Practice: sessions, exercises, targets, tempo observations and journal notes.
- Assessment: quizzes, questions, attempts and skill evidence.
- Music reference: chords, scales, intervals, songs and bookmarks.
- Preferences: instrument setup, handedness, tuning, goals and accessibility.
- Sync: device registry, operation outbox and sync checkpoints.
- Identity: users, accounts and sessions, when cloud identity is introduced.

Preserve immutable assessment attempts; store current mastery as a derived/current state with references to supporting evidence.

## 7. Local-first sync

- Assign stable IDs to local records.
- Record local changes as operations in an outbox.
- Make server sync endpoints idempotent.
- Use per-record versions or updated timestamps plus explicit conflict handling.
- Avoid silent last-write-wins for assessment history or completed lesson records.
- Surface meaningful conflicts for user resolution.
- Support export and restore independently of cloud sync.

The local repository interface should isolate UI modules from IndexedDB and D1 implementation details.

## 8. Authentication and privacy

The initial personal-use experience may operate locally without requiring registration. Add account authentication when cloud sync is introduced. Enforce authorisation on the server for every user-owned record. Use secure, HTTP-only session cookies and appropriate CSRF protections.

Microphone permission is requested only after an explicit user action. Tuner and single-note pitch analysis run locally by default. Do not upload raw audio unless the user explicitly requests a recording backup or sharing feature.

## 9. Audio capability boundaries

Start with dependable tools:
- Metronome and reference tone generation.
- Chromatic tuner using single-note pitch detection.
- Ear-training playback and response capture.

Single-note pitch estimation is a realistic first audio-feedback feature. Automatic grading of polyphonic chords is substantially harder and must not be presented as reliable until tested against real instruments and environments.

## 10. Quality and operations

- Type-check and lint every change.
- Unit-test music theory utilities and learning-state transitions.
- Integration-test data access and migrations.
- End-to-end test core learning and practice journeys.
- Test offline capture and reconnect/sync behaviour.
- Verify keyboard access, responsive layouts and reduced-motion preferences.
- Run a production build and deployment smoke test before release.
- Provide backup/export and restore tests before treating cloud sync as dependable.
