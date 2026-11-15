Drizzle migrations are generated from src/lib/server/db/schema.ts.
Apply locally with: npm run db:migrate:local

The D1 binding in wrangler.jsonc uses an all-zero local placeholder identifier.
No Cloudflare database has been provisioned. Do not use --remote in this milestone.

The finalizer seeds immutable lookup metadata from the six authored curriculum
JSON files and adds database-level guards for append-only evidence. It records
a SHA-256 content fingerprint and refuses to silently rewrite a published seed.
