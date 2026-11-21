#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const files = execFileSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
  { encoding: 'utf8' }
)
  .split('\0')
  .filter(Boolean);

if (files.length > 0) {
  console.log(`Checking formatting for ${files.length} staged file(s)...`);
  execFileSync('node', ['scripts/prettier-files.mjs', ...files], { stdio: 'inherit' });
}
