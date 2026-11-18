import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (process.env.CI === 'true' || !existsSync('.git')) {
  console.log('Skipping Git hook setup in CI or outside a Git working tree.');
} else {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    stdio: 'inherit'
  });
  console.log('Git hooks configured: .githooks');
}
