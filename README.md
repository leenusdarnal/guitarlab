# GuitarLab

**Learn. Practise. Master.**

<p align="center">
  <img src="static/brand/guitarlab-logo.svg" alt="GuitarLab — Learn, Practise, Master" width="620" />
</p>

GuitarLab is a local-first guitar-learning and practice application. It combines a structured guitar curriculum, guided lessons, evidence-aware progress, practice planning and interactive music tools in a mobile-friendly workspace.

The curriculum contains 152 lesson records: 52 weeks in Year 1, 52 weeks in Year 2 and four optional 12-week Year 3+ specialisations. The active version is recorded in `content/curriculum/release.json`; authored lesson JSON and the skill catalogue are the versioned content source. A lesson record existing or passing schema validation does not, by itself, mean that its teaching has completed human musical review.

## Product principles

- Begin with a fresh local learner profile; do not import progress from another course, chat or user.
- Keep lesson completion, practice activity and demonstrated skill evidence distinct.
- Keep learner profiles and practice history in browser-local IndexedDB.
- Process microphone input only after explicit user action and locally by default.
- Keep public curriculum separate from private learner records.
- Treat cloud learner-data synchronisation as a separate, gated capability.

## Current application capabilities

The application includes learner onboarding and local profiles, a personalised dashboard and practice planner, a curriculum catalogue and lesson reader, persisted lesson checkpoints and completion/resume, practice sessions and history, export/restore/reset, a fretboard explorer, chord tools, metronome, tuner, ear training and the initial privacy-bounded offline app shell.

Optional account code is present: email/password and opt-in Google/GitHub OAuth are supported by the authentication design. Local account lifecycle/security acceptance is automated. Preview and production account activation remains gated on environment-specific database migrations, credentials and provider configuration. Accounts do not enable cloud learner-data synchronisation.

## Architecture

| Area | Choice |
|---|---|
| Application | SvelteKit, Svelte 5, TypeScript |
| Styling | Tailwind CSS 4 with semantic CSS design tokens |
| Runtime | Cloudflare Workers |
| Identity/session store | Dedicated Cloudflare D1 database per auth environment |
| Learner state | Browser-local IndexedDB |
| ORM and migrations | Drizzle ORM / Drizzle Kit |
| Validation | Zod |
| Audio | Web Audio API and MediaDevices |
| Testing | Vitest and Playwright |
| CI/CD | GitHub Actions and Wrangler; manually triggered, exact-SHA deployment workflows |

The dedicated auth D1 databases store identity/session data only. They are not an enabled learner-data cloud-sync store. Cloud learner-data synchronisation is not enabled.

## Documentation

Start with the [documentation index](docs/README.md). It defines the single authority for product milestones, engineering/release acceptance, curriculum remediation, architecture, design, authentication and deployment decisions.

Key references:
- [Product specification](docs/PRODUCT_SPEC.md)
- [Product roadmap](docs/ROADMAP.md)
- [Engineering Quality & Release Tracker](docs/ENGINEERING_QUALITY_TRACKER.md)
- [Curriculum Audit & Remediation Tracker](docs/CURRICULUM_AUDIT_AND_REMEDIATION_TRACKER.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design Direction](docs/DESIGN_DIRECTION.md)
- [Authentication decision](docs/AUTHENTICATION_DECISION.md) · [setup runbook](docs/AUTHENTICATION_SETUP.md)
- [Production environment decision](docs/PRODUCTION_ENVIRONMENT_DECISION.md)
- [Manual acceptance runbook](docs/MANUAL_ACCEPTANCE.md)
- [System diagrams](docs/DIAGRAMS.md)

Machine-readable curriculum references:
- [Learning framework](content/curriculum/learning-framework.json)
- [Lesson schema](content/curriculum/lesson.schema.json)
- [Skill catalogue](content/curriculum/skill-catalog.json)
- [Active curriculum release](content/curriculum/release.json)
- [Curriculum validator](scripts/validate-curriculum.mjs)

## Local development

Use the Node.js version pinned in `.nvmrc`.

```sh
npm install
npm run dev
```

Quality checks and local Worker/database validation:

```sh
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

The default `wrangler.jsonc` is for local development. Local D1 commands must use Wrangler's local database only; do not use `--remote` for local checks. The auth-specific local schema has its own `npm run db:auth:migrate:local` and `npm run db:auth:test:local` commands.

Preview and production deployments are manual GitHub Actions workflows with exact-SHA CI gates and protected environment configuration. Do not bypass those workflows or use the local Wrangler config for deployment. The [Cloudflare deployment reference](docs/CLOUDFLARE_DEPLOYMENT_PLAN.md) explains environment boundaries; current release and activation gates are tracked only in the [Engineering Quality & Release Tracker](docs/ENGINEERING_QUALITY_TRACKER.md).

## Privacy and copyright

- Microphone access must be opt-in and clearly explained.
- Audio analysis happens on-device by default.
- Uploading recordings must be an explicit user action.
- Link to third-party courses and learning resources; do not redistribute copyrighted course videos, tabs or recordings without permission.
- Never commit API tokens, Cloudflare credentials, private recordings or personal learning data.

## License

No open-source license has been selected. The repository is publicly viewable, but reuse is not automatically granted.
