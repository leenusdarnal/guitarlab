# GuitarLab

**Learn. Practise. Master.**

GuitarLab is a personal, full-stack guitar-learning platform designed to turn structured lessons and deliberate practice into measurable musical ability.

It combines a guided curriculum, interactive music tools, focused practice sessions, skill assessments and progress history. It is designed to work locally and offline first, with optional cloud synchronisation.

## Product goals

- Preserve learning continuity and the learner's existing curriculum and progress.
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

This repository is in the foundation and specification stage. See:

- [Architecture](docs/ARCHITECTURE.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Product specification](docs/PRODUCT_SPEC.md)
- [Contributing](CONTRIBUTING.md)

## Local development

The exact bootstrap commands and configuration will be added with the first application scaffold. The intended workflow uses SvelteKit's Cloudflare integration and Wrangler local development with isolated local D1 data.

Never commit API tokens, Cloudflare credentials, private recordings or personal learning data.

## Privacy and copyright

- Microphone access must be opt-in and clearly explained.
- Audio analysis should happen on-device by default.
- Uploading recordings must be an explicit user action.
- Link to third-party courses and learning resources; do not redistribute copyrighted course videos, tabs or recordings without permission.
- Keep private learner data out of this public source repository.

## License

No open-source license has been selected yet. Until a license is added, the repository remains publicly viewable but reuse is not automatically granted.
