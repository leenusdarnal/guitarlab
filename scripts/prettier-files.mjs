#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const paths = process.argv.slice(2).filter(Boolean);
const managed = paths.filter((path) => {
  const normalized = path.replaceAll('\\\\', '/');
  const name = normalized.split('/').at(-1) ?? '';
  return (
    ['.js', '.json', '.ts'].some((extension) => name.endsWith(extension)) ||
    (/^wrangler[^/]*\\.jsonc$/.test(normalized) && !normalized.includes('/')) ||
    (normalized.startsWith('scripts/') && name.endsWith('.mjs') && !normalized.slice('scripts/'.length).includes('/'))
  );
});

if (managed.length === 0) {
  console.log('No Prettier-managed files supplied.');
  process.exit(0);
}

execFileSync('npx', ['prettier', '--check', ...managed], {
  stdio: 'inherit'
});
