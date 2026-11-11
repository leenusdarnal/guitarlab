# Local learner storage (M2.3)

## Scope

GuitarLab creates one active learner profile on the first client-side application visit. The profile and learner-owned activity remain in the browser's IndexedDB database named `guitarlab-local`. Nothing in this milestone uploads profile data, practice notes, assessments or progress to Cloudflare D1 or another server.

The initial profile starts empty. Instrument, handedness, tuning, starting point, goals, practice duration, availability and lesson-presentation preferences remain unset until the learner chooses them in onboarding. No lesson completion, assessment, mastery or practice session is created by first launch.

## Database version 1

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

Indexes support lookup by learner, learner/release/lesson, learner/release/skill, progress and practice status. Completion writes are kept in one IndexedDB transaction with their event. Practice updates use a read/write transaction and only replace a record still marked `in_progress`.

## Application boundary

The adapter implements the repository ports in `src/lib/repositories/contracts.ts`; it does not change the application use cases or couple them to browser APIs. The onboarding page calls the existing validated preference-update use case. The root layout creates/retrieves the active profile after client mount, so server rendering never accesses IndexedDB.

Stored preferences are validated again when read. If the browser does not provide IndexedDB, the application shows a local-storage warning and does not claim that preferences were saved.

## Migrations and recovery

- Database upgrades are additive through IndexedDB's `onupgradeneeded` lifecycle.
- Existing stores are preserved when a later schema version is introduced.
- The adapter closes connections on `versionchange` so another tab can perform an upgrade.
- A blocked upgrade asks the learner to close other GuitarLab tabs.
- Storage errors are surfaced; the application does not silently reset or overwrite the existing profile.

M2.4 will add the learner-facing export, restore preview and safe-reset workflow. Until that work is complete, clearing browser site data or uninstalling a browser profile can remove local learner data. Learners should not treat local storage as a backup.

## Privacy and deployment

The local database is not bound to D1, and no cloud sync route is introduced. Do not put learner data into public curriculum JSON, source control, analytics, logs or static build artifacts. A future sync feature requires authentication, owner-scoped access checks, explicit conflict rules and a separate security review.

## Verification

The M2.3 tests cover fresh-profile defaults, reuse of the active profile, validated preference updates and the absence of any automatic mastery record. CI remains responsible for formatting, lint, Svelte/TypeScript checks, unit tests, curriculum validation and the Cloudflare Worker build.
