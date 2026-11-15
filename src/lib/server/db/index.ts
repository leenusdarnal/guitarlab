import { drizzle } from 'drizzle-orm/d1';
import { databaseSchema } from './schema';

/**
 * Create a request-scoped Drizzle client from the Cloudflare D1 binding.
 * Keep this module server-only. Cloud sync endpoints must authenticate and
 * authorise a learner before reading or writing their D1-owned records.
 */
export function createDatabase(binding: D1Database) {
  return drizzle(binding, { schema: databaseSchema });
}

export type AppDatabase = ReturnType<typeof createDatabase>;
