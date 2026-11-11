# GuitarLab

**Learn. Practise. Master.**

GuitarLab is a local-first guitar-learning application under active development, built around a self-contained, authored three-year curriculum and deliberate practice.

The curriculum contains 152 authored lessons across a 52-week Year 1 route, a 52-week Year 2 route and four optional 12-week specialisations. The current application includes learner onboarding and local profiles, a personalised dashboard and practice planner, local backup/restore, and a curriculum navigation and lesson reader. Interactive music tools, full lesson-progress capture, complete offline app-shell support and optional cloud synchronisation are later delivery slices. Every new learner starts fresh.

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
| CI/CD | GitHub Actions CI; manually triggered Cloudflare preview deployment; production deployment not configured |

The application uses the Cloudflare adapter and a full-stack Worker runtime. It is not a static-only Pages application.

## Development status

The current `main` branch includes the application foundation ([PR #21](https://github.com/leenusdarnal/guitarlab/pull/21)), the versioned D1/Drizzle schema and repository/application boundaries ([PRs #22–23](https://github.com/leenusdarnal/guitarlab/pulls?q=is%3Apr+is%3Amerged)), IndexedDB learner persistence and local backup/restore ([PRs #24–25](https://github.com/leenusdarnal/guitarlab/pulls?q=is%3Apr+is%3Amerged)), the learner dashboard and explainable practice planner ([PRs #26 and #28](https://github.com/leenusdarnal/guitarlab/pulls?q=is%3Apr+is%3Amerged)), and the six-route curriculum reader ([PR #29](https://github.com/leenusdarnal/guitarlab/pull/29)). The post-merge CI run for PR #29 passed, including local D1 migration/invariant checks, curriculum and design-token validation, format/lint/type checks, unit tests, Worker build/smoke tests and Chromium acceptance. **Still pending:** browser verification of backup/restore and offline recovery, M4.2 interactive checkpoints/completion/resume, explicit Cloudflare preview/production environment configuration, a live deployment workflow, production D1 provisioning (only when required), and authentication/cloud sync. No live Cloudflare deployment is claimed. See the [implementation tracker](docs/IMPLEMENTATION_TRACKER.md), [data model](docs/DATA_MODEL.md) and [system diagrams](docs/DIAGRAMS.md).

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

### Cloudflare preview deployment

A manually triggered preview deployment is provided by `.github/workflows/deploy-preview.yml`. It deploys the current `main` branch to the public Worker URL `https://guitarlab-preview.leenus-darnal.workers.dev`.

Before running it, configure these GitHub repository settings:

- **Actions secret:** `CLOUDFLARE_API_TOKEN` — a Cloudflare API token permitted to deploy Workers scripts.
- **Actions variable:** `CLOUDFLARE_ACCOUNT_ID` — the 32-character Cloudflare account ID.

Then open **GitHub → Actions → Deploy GuitarLab preview → Run workflow**, select `main`, and confirm the `deploy_preview` input. The workflow builds the app, validates the preview Wrangler configuration, deploys the Worker and smoke-tests the public URL.

The preview configuration intentionally has **no D1 binding**: current learner-facing routes read authored curriculum bundled with the app, and no server-side code currently calls the D1 client. Learner preferences and practice data remain local in the browser. Do not put real private learner data or recordings into this public preview. Production hosting, custom-domain routing, authentication and cloud sync remain separate release decisions.
