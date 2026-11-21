#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const buffer = (args) => execFileSync('git', args);

const baseSha = process.env.GITHUB_BASE_SHA || (() => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return '';
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  return event.pull_request?.base?.sha || event.before || '';
})();

if (!baseSha || /^0+$/.test(baseSha)) {
  console.error('Cannot determine the base commit for the formatting check.');
  process.exit(1);
}

const changedFiles = buffer([
  'diff',
  '--name-only',
  '--diff-filter=ACMR',
  '-z',
  baseSha,
  process.env.GITHUB_SHA || 'HEAD'
])
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

console.log(`Checking formatting for ${changedFiles.length} changed file(s) against ${baseSha.slice(0, 12)}.`);
if (changedFiles.length > 0) {
  execFileSync('node', ['scripts/prettier-files.mjs', ...changedFiles], {
    stdio: 'inherit'
  });
}
