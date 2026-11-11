# Application services and repository contracts (M2.2)

## Boundary rules

- Svelte components and route handlers call application use cases; they do not issue SQL or call Drizzle directly.
- Application use cases depend on repository interfaces in `src/lib/repositories/contracts.ts`, never on D1, Drizzle, IndexedDB or SvelteKit.
- Curriculum and skill reads use public, version-scoped repositories. Learner profile, progress, assessment, mastery and practice repositories are private learner-state paths.
- The current product remains local-first. These interfaces do not enable cloud sync, create public learner endpoints or establish an authentication model.
- A future authenticated route must derive the learner scope from its verified session. It must never trust a client-supplied owner ID. Local-only callers may use the active local profile identifier.

## Implemented use cases

| Use case | Responsibility | Important guard |
|---|---|---|
| Create empty profile | Creates a fresh profile and empty preference set | No progress or mastery is seeded |
| Update preferences | Validates and saves the selected preference set | Missing profile is a typed not-found result |
| Read curriculum | Lists lessons and loads a lesson in a release | Public content path never reads a learner profile |
| Read skills | Lists skills attached to a curriculum release | Release scope is required |
| Start/resume lesson progress | Returns existing progress or creates an in-progress row | Learner + release + lesson scope |
| Complete lesson | Marks lesson progress and appends a completion event | Repository performs both writes atomically; no mastery repository is available to the use case |
| Record assessment | Creates a server/service-scoped ID and timestamp, then appends evidence | Owner ID is separate from the submitted payload; attempt history is insert-only |
| Update mastery | Derives evidence count and latest pointer from assessment history | Stable state requires the latest scoped attempt to pass |
| Start/finish practice | Captures planned minutes and actual elapsed seconds separately | Only an active session can finish; practice time is not assessment evidence |

## Typed errors

- `ValidationError`: input did not meet a Zod boundary schema; issue paths/messages are safe to display.
- `NotFoundError`: the requested release, lesson, skill, profile, progress row or session is not available in the requested scope.
- `ConflictError`: a one-time transition was already applied or lost a compare-and-set race.
- `InvalidStateError`: a transition violates the current learning/practice state rules.
- Unknown storage/runtime exceptions are mapped to a generic internal message. SQL text, stack traces and arbitrary exception text are not returned to the UI.

## Adapter requirements

Any future IndexedDB or Drizzle adapter must implement the contracts and preserve these guarantees:

1. Assessment attempts are append-only.
2. Lesson completion writes the progress transition and immutable event in one transaction.
3. Practice completion is a compare-and-set from `in_progress`; duplicate completion cannot overwrite the first result.
4. A stable mastery snapshot references the latest passing assessment from the same learner, release and skill.
5. Queries include the full learner/release/skill scope. An adapter must not widen a private query to a global collection.
6. Repository failures are allowed to throw internally; application boundaries convert only known domain failures to safe typed errors.

## Deliberately not included

- No D1 repository adapter is wired to a route; there is no auth/ownership subject mapping yet.
- No public learner-data endpoint or cloud synchronization.
- No IndexedDB adapter yet; that is M2.3.
- No lesson-body copy in D1; authored curriculum JSON remains the source of truth.
