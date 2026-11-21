#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const paths = process.argv.slice(2).filter(Boolean);
const managed = paths.filter((path) =>
  /\\.(?:js|json|ts)$/.test(path) ||
  /^wrangler[^/]*\\.jsonc$/.test(path) ||
  /^scripts\\/[^/]+\\.mjs$/.test(path)
);

if (managed.length === 0) {
  console.log('No Prettier-managed files supplied.');
  process.exit(0);
}

execFileSync('npx', ['prettier', '--check', ...managed], {
  stdio: 'inherit'
});
