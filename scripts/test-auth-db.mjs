import { spawnSync } from 'node:child_process';

const tables = ['user', 'session', 'account', 'verification', 'rateLimit'];

for (const table of tables) {
  const result = spawnSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      'guitarlab-auth-local',
      '--local',
      '--command',
      `SELECT 1 FROM "${table}" LIMIT 1`
    ],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}

console.log('Auth D1 migration passed: all Better Auth tables are present.');
