#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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

function commitExists(sha) {
  try {
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
}

// actions/checkout uses a shallow fetch by default. Pull-request formatting
// checks compare against the base SHA, which may not exist in that checkout.
if (!commitExists(baseSha)) {
  console.log(
    `Base commit ${baseSha.slice(0, 12)} is not in the checkout; fetching it.`
  );
  try {
    execFileSync(
      'git',
      ['fetch', '--no-tags', '--depth=1', 'origin', baseSha],
      { stdio: 'inherit' }
    );
  } catch {
    console.error(
      `Unable to fetch the formatting base commit ${baseSha}. Check repository fetch permissions and the supplied base SHA.`
    );
    process.exit(1);
  }
}

if (!commitExists(baseSha)) {
  console.error(
    `Formatting base commit ${baseSha} is still unavailable after fetch.`
  );
  process.exit(1);
}

const targetSha = process.env.GITHUB_SHA || 'HEAD';
const changedFiles = execFileSync(
  'git',
  ['diff', '--name-only', '--diff-filter=ACMR', '-z', baseSha, targetSha],
  { encoding: 'buffer' }
)
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

console.log(
  `Checking formatting for ${changedFiles.length} changed file(s) against ${baseSha.slice(0, 12)}.`
);
if (changedFiles.length > 0) {
  execFileSync('node', ['scripts/prettier-files.mjs', ...changedFiles], {
    stdio: 'inherit'
  });
}
