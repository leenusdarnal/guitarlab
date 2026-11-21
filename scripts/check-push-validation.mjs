#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const gitBuffer = (args) => execFileSync('git', args);

const remoteRefs = git(['for-each-ref', '--format=%(refname)', 'refs/remotes'])
  .split('\n')
  .filter(Boolean);
const upstream = (() => {
  try {
    return git(['rev-parse', '--abbrev-ref', '@{upstream}']);
  } catch {
    return '';
  }
})();
const baseRefs = remoteRefs.filter((ref) => /\/(main|master)$/.test(ref));
const baseRef = [upstream, ...baseRefs].find((ref) => remoteRefs.includes(ref));

if (!baseRef) {
  console.error('Could not identify the remote base branch. Run `git fetch origin` and retry.');
  process.exit(1);
}

const baseSha = git(['merge-base', 'HEAD', baseRef]);
const changedFiles = gitBuffer([
  'diff', '--name-only', '--diff-filter=ACMR', '-z', `${baseSha}...HEAD`
])
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

console.log(`Pre-push validation against ${baseRef} (${baseSha.slice(0, 12)}).`);

if (changedFiles.length > 0) {
  console.log(`Checking Prettier for ${changedFiles.length} changed file(s)...`);
  execFileSync('node', ['scripts/prettier-files.mjs', ...changedFiles], { stdio: 'inherit' });
}

const run = (script) => {
  console.log(`\n> npm run ${script}`);
  execFileSync('npm', ['run', script], { stdio: 'inherit' });
};

for (const script of ['lint', 'check', 'test:run', 'build']) run(script);

const changed = (patterns) => changedFiles.some((file) =>
  patterns.some((pattern) => (pattern.endsWith('/') ? file.startsWith(pattern) : file === pattern))
);

if (changed([
  'scripts/auth-browser-acceptance.mjs',
  'src/lib/server/auth.ts',
  'src/lib/server/auth.test.ts',
  'src/routes/login/',
  'src/routes/account/',
  'src/hooks.server.ts'
])) run('test:auth-browser');

if (changed(['src/routes/', 'src/lib/', 'src/hooks.server.ts', 'src/app.css', 'src/app.html', 'static/', 'vite.config.ts', 'svelte.config.js'])) run('test:browser');
if (changed(['src/lib/audio/', 'src/routes/tools/'])) run('test:music-tools-browser');
if (changed(['content/curriculum/', 'src/routes/learn/'])) run('test:curriculum-browser');
if (changed(['src/routes/', 'src/app.css', 'src/app.html'])) {
  run('test:accessibility');
  console.log('The pre-push gate runs the browser accessibility suite in its configured default engine. CI remains authoritative for the additional WebKit matrix.');
}

const status = git(['status', '--porcelain', '--untracked-files=all']);
if (status) {
  console.error('\nValidation modified or generated working-tree files. Review intended changes before pushing:');
  console.error(status);
  process.exit(1);
}

console.log('\nPre-push validation passed.');
