#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const baseSha = process.env.GITHUB_BASE_SHA || (() => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return '';
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  return event.pull_request?.base?.sha || event.before || '';
})();

if (!baseSha || /^0+$/.test(baseSha)) {
  console.error('Cannot determine the base commit for the formatting operation.');
  process.exit(1);
}

const changedFiles = execFileSync(
  'git',
  ['diff', '--name-only', '--diff-filter=ACMR', '-z', baseSha, process.env.GITHUB_SHA || 'HEAD'],
  { encoding: 'buffer' }
).toString('utf8').split('\0').filter(Boolean);

const managed = changedFiles.filter((path) => {
  const name = path.split('/').at(-1) ?? '';
  return ['.js', '.json', '.ts'].some((extension) => name.endsWith(extension)) ||
    (!path.includes('/') && name.startsWith('wrangler') && name.endsWith('.jsonc')) ||
    (path.startsWith('scripts/') && !path.slice('scripts/'.length).includes('/') && name.endsWith('.mjs'));
});

if (managed.length === 0) {
  console.log('No Prettier-managed changed files.');
  process.exit(0);
}

execFileSync('npx', ['prettier', '--write', '--ignore-path', '.prettierignore', ...managed], {
  stdio: 'inherit'
});
