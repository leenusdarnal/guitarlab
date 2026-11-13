import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('.git')) {
  console.log('Skipping Git hook setup: this is not a Git working tree.');
} else {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    stdio: 'inherit'
  });
  console.log('Git hooks configured: .githooks');
}
