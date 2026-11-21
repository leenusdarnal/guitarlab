#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const paths = process.argv.slice(2).filter(Boolean);
const managed = paths.filter((path) => {
  const name = path.split('/').at(-1) ?? '';
  const standardExtension = ['.js', '.json', '.ts'].some((extension) =>
    name.endsWith(extension)
  );
  const rootWranglerConfig =
    !path.includes('/') && name.startsWith('wrangler') && name.endsWith('.jsonc');
  const topLevelScript =
    path.startsWith('scripts/') &&
    !path.slice('scripts/'.length).includes('/') &&
    name.endsWith('.mjs');

  return standardExtension || rootWranglerConfig || topLevelScript;
});

if (managed.length === 0) {
  console.log('No Prettier-managed files supplied.');
  process.exit(0);
}

execFileSync('npx', ['prettier', '--check', '--ignore-path', '.prettierignore', ...managed], {
  stdio: 'inherit'
});
