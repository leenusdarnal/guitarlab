# GuitarLab

**Learn. Practise. Master.**

GuitarLab is a self-contained, full-stack guitar-learning platform with an authored three-year curriculum, interactive music tools and deliberate practice.

It combines 152 authored lessons across a 52-week Year 1 route, a 52-week Year 2 route and four optional 12-week specialisations, alongside interactive music tools, focused practice sessions, skill assessments and progress history. Every new learner starts fresh. It is designed to work locally and offline first, with optional cloud synchronisation.

## Product goals

- Provide a complete learning route that starts with a fresh learner profile.
- Teach practical playing alongside music theory, listening and musicianship.
- Make practice sessions purposeful, measurable and easy to resume.
- Adapt review to demonstrated skill, not just lesson completion.
- Work reliably on mobile and desktop, including offline.
- Keep recordings private and local by default.

## Planned capabilities

- Personal learning dashboard and guided curriculum
- Lesson player with objectives, exercises and checkpoints
- Interactive fretboard and note-finding practice
- Chord library, chord diagrams and chord-transition drills
- Tuner, metronome and practice timer
- Practice journal and session history
- Music theory and ear-training exercises
- Song library and legally sourced learning references
- Assessments, skill mastery and spaced review
- Progress analytics, export and restore
- Optional account and cloud synchronisation

## Technology

| Area | Choice |
|---|---|
| Application | SvelteKit, Svelte 5, TypeScript |
| Styling | Tailwind CSS 4 |
| Runtime and hosting | Cloudflare Workers |
| Database | Cloudflare D1 |
| ORM and migrations | Drizzle ORM / Drizzle Kit |
| Validation | Zod |
| Offline data | IndexedDB |
| Audio | Web Audio API and MediaDevices |
| Testing | Vitest and Playwright |
| Quality | ESLint and Prettier |
| CI/CD | GitHub Actions; Cloudflare deployment |

The application uses the Cloudflare adapter and a full-stack Worker runtime. It is not a static-only Pages application.

## Development status

The product definition, authored curriculum, final architecture and approved visual direction are in place. **M1 application foundation is merged** ([PR #21](https://github.com/leenusdarnal/guitarlab/pull/21)): SvelteKit/TypeScript, Tailwind CSS, Cloudflare Workers, the first responsive dashboard and learner setup. **M2.1 data foundation is also merged** ([PR #22](https://github.com/leenusdarnal/guitarlab/pull/22)): versioned Drizzle schema, local-only D1 migrations, 152 lesson metadata references, 34 stable skill IDs and database integrity tests. The D1 schema is not yet connected to learner-facing routes; authentication, cloud sync, production D1 and IndexedDB remain deferred. The merged workflows pass curriculum, contrast, format, lint, type, unit, local D1 migration/invariant, production Worker build and local Worker smoke tests. See the [implementation tracker](docs/IMPLEMENTATION_TRACKER.md), [data model](docs/DATA_MODEL.md) and [system diagrams](docs/DIAGRAMS.md).

- [System diagrams — architecture, learning loop, database and delivery](docs/DIAGRAMS.md)
- [Data model and D1 migrations](docs/DATA_MODEL.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Product specification](docs/PRODUCT_SPEC.md)
- [Learning curriculum](docs/CURRICULUM.md)
- [Curriculum research and revision](docs/CURRICULUM_RESEARCH.md)
- [Machine-readable spiral learning framework](content/curriculum/learning-framework.json)
- [Authored lesson JSON Schema](content/curriculum/lesson.schema.json)
- [Curriculum validation script](scripts/validate-curriculum.mjs)
- [Year 1 curriculum data](content/curriculum/year-1.json)
- [Year 1 authored lessons — 52 lessons](content/curriculum/year-1-lessons.json)
- [Year 2 curriculum data](content/curriculum/year-2.json)
- [Year 2 authored lessons — 52 lessons](content/curriculum/year-2-lessons.json)
- [Year 3+ specialisation outlines](content/curriculum/year-3-specialisations.json)
- [Year 3+ authored lessons — 48 lessons](content/curriculum/year-3-specialisation-lessons.json)
- [Curriculum content model and skill taxonomy](docs/CURRICULUM_CONTENT_MODEL.md)
- [First-release scope](docs/RELEASE_SCOPE.md)
- [Design direction](docs/DESIGN_DIRECTION.md)
- [Implementation guidelines — design, personalisation and delivery](docs/IMPLEMENTATION_GUIDELINES.md)
- [Fresh learner profile policy](docs/LEARNING_PROGRESS_MIGRATION.md)
- [M0 acceptance criteria](docs/ACCEPTANCE_CRITERIA.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Pre-implementation readiness review](docs/PRE_IMPLEMENTATION_READINESS.md)
- [External practice tools evaluation](docs/EXTERNAL_TOOLS.md)
- [Contributing](CONTRIBUTING.md)

## Local development

Requires Node.js 22.18 or newer.

```bash
npm install
npm run dev
```

Quality checks and Worker build:

```bash
npm run curriculum:validate
npm run design:validate
npm run db:setup:local
npm run format:check
npm run lint
npm run check
npm run test:run
npm run build
npm run preview
```

M2.1 adds the D1 schema and Wrangler local binding, but no learner-facing data route or cloud sync is enabled. Run `npm run db:setup:local` to generate/verify the versioned migration, apply it to Wrangler's local D1 and run the database invariant tests. The all-zero database ID in `wrangler.jsonc` is a local placeholder. Never use `--remote` or a production database for these checks.

Never commit API tokens, Cloudflare credentials, private recordings or personal learning data.

## Privacy and copyright

- Microphone access must be opt-in and clearly explained.
- Audio analysis should happen on-device by default.
- Uploading recordings must be an explicit user action.
- Link to third-party courses and learning resources; do not redistribute copyrighted course videos, tabs or recordings without permission.
- Keep private learner data out of this public source repository.

## License

No open-source license has been selected yet. Until a license is added, the repository remains publicly viewable but reuse is not automatically granted.
