#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const paths = process.argv.slice(2).filter(Boolean);
if (paths.length === 0) {
  console.log('No files supplied to Prettier check.');
  process.exit(0);
}

execFileSync('npx', ['prettier', '--check', '--ignore-unknown', ...paths], {
  stdio: 'inherit'
});
