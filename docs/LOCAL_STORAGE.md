# Local learner storage (M2.3)

## Scope

GuitarLab creates one active learner profile on the first client-side application visit. The profile and learner-owned activity remain in the browser's IndexedDB database named `guitarlab-local`. Nothing in this milestone uploads profile data, practice notes, assessments or progress to Cloudflare D1 or another server.

The initial profile starts empty. Instrument, handedness, tuning, starting point, goals, practice duration, availability and lesson-presentation preferences remain unset until the learner chooses them in onboarding. No lesson completion, assessment, mastery or practice session is created by first launch.

## Database version 2

The database is opened by `src/lib/storage/indexeddb.ts`. Its schema version is explicit and must be increased when a later release adds or changes stores or indexes.

| Object store | Primary key | Purpose |
|---|---|---|
| `metadata` | `key` | Active learner ID and local database metadata |
| `learnerProfiles` | `id` | Versioned preferences and profile timestamps |
| `lessonProgress` | `id` | Current state and resume position per learner, release and lesson |
| `lessonCompletionEvents` | `id` | Append-only completion events |
| `assessmentAttempts` | `id` | Append-only skill evidence |
| `skillMastery` | learner + release + skill | Derived evidence-based mastery snapshot |
| `practiceSessions` | `id` | Planned and actual practice activity |

Indexes support lookup by learner, learner/release/lesson, learner/release/skill, progress, practice status, and the composite learner/status/start-time session history query. Version 2 adds `byLearnerStatusStartedAt` to the existing `practiceSessions` store for the upcoming M7 session-history workflow. The v1-to-v2 upgrade is additive: it preserves the existing stores, active learner, preferences and practice-session records while adding the index. Completion writes are kept in one IndexedDB transaction with their event. Practice updates use a read/write transaction and only replace a record still marked `in_progress`.

## Application boundary

The adapter implements the repository ports in `src/lib/repositories/contracts.ts`; it does not change the application use cases or couple them to browser APIs. The onboarding page calls the existing validated preference-update use case. The root layout creates/retrieves the active profile after client mount, so server rendering never accesses IndexedDB.

Stored preferences are validated again when read. If the browser does not provide IndexedDB, the application shows a local-storage warning and does not claim that preferences were saved.

## Migrations and recovery

- Database upgrades are additive through IndexedDB's `onupgradeneeded` lifecycle.
- The v1-to-v2 migration adds the practice-session composite index without replacing existing stores or records.
- Existing stores are preserved when a later schema version is introduced.
- The adapter closes connections on `versionchange` so another tab can perform an upgrade.
- A blocked upgrade asks the learner to close other GuitarLab tabs.
- Storage errors are surfaced; the application does not silently reset or overwrite the existing profile.

The M2.4 implementation is merged in PR #25, with expanded Chromium recovery coverage merged in PR #42: versioned local JSON export, strict import validation and preview, transactional replacement restore, reset cancel/confirm, and restore into a clean profile. The browser suite also forces a unique-index violation to verify transaction rollback preserves the existing profile. Physical-device backup/restore acceptance remains a release check. Clearing browser site data or uninstalling a browser profile can still remove local learner data; keep a downloaded backup in a private safe location.

## Browser storage durability

The Data & backups screen reports the browser's `navigator.storage.persisted()` result when available and displays an approximate usage/quota estimate from `navigator.storage.estimate()`. A learner can explicitly request persistent origin storage through `navigator.storage.persist()`; GuitarLab does not make this request automatically.

A successful persistence grant reduces automatic eviction risk, but it is not a backup and does not prevent the learner, browser settings, device management or a device failure from removing local data. Some browsers do not expose the request API or may decline the request. The UI must describe these states honestly and keep export/restore available.

Storage estimates are advisory and may be unavailable. Quota-exceeded and IndexedDB errors must remain visible and must never silently reset or overwrite existing learner data.

## Privacy and deployment

The local database is not bound to D1, and no cloud sync route is introduced. Do not put learner data into public curriculum JSON, source control, analytics, logs or static build artifacts. A future sync feature requires authentication, owner-scoped access checks, explicit conflict rules and a separate security review.

## Verification

- Unit tests cover fresh-profile defaults, reuse of the active profile, validated preference updates and the absence of any automatic mastery record.
- Chromium CI seeds a real v1 IndexedDB database, launches the app to trigger the v2 upgrade, and verifies that the active learner, preferences and existing practice-session record survive while the new composite index and all stores are present.
- Curriculum browser CI verifies cached-lesson offline reload and the unvisited-page fallback at desktop (1440px) and mobile (390px) viewport sizes.
- Physical desktop/mobile browser checks, including iOS Safari and Android Chrome where available, remain manual acceptance tasks. Use the [manual acceptance runbook](MANUAL_ACCEPTANCE.md).
- CI also runs formatting, lint, Svelte/TypeScript checks, unit tests, curriculum validation and the Cloudflare Worker build.
