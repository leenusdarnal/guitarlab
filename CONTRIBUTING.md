# Contributing to GuitarLab

Thanks for helping improve GuitarLab.

## Before making changes

- Read the [product specification](docs/PRODUCT_SPEC.md), [architecture](docs/ARCHITECTURE.md) and [roadmap](docs/ROADMAP.md).
- Keep the local-first learning experience intact.
- Do not commit personal learner data, recordings, secrets or credentials.
- Do not add copyrighted course material or song tabs without permission.

## Engineering expectations

- Use TypeScript and Svelte 5 conventions.
- Keep curriculum content separate from UI components.
- Validate external input at server boundaries.
- Keep user-owned data authorised on the server.
- Add tests for music theory calculations, progress transitions and sync behaviour.
- Preserve assessment history and completed learning records.
- Ensure new practice flows are usable on mobile and keyboard accessible.

## Before submitting

Run the available checks for the affected code:
- Type checking
- Linting and formatting
- Unit/integration tests
- Production build
- End-to-end tests for changed user journeys

Document any checks that cannot be run and why.
