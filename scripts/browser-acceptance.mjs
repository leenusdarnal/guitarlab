import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = Number(process.env.GUITARLAB_PREVIEW_PORT ?? 8787);
const origin = `http://127.0.0.1:${port}`;
const server = spawn(
  'npm',
  ['run', 'preview', '--', '--ip', '127.0.0.1', '--port', String(port)],
  { stdio: ['ignore', 'pipe', 'pipe'] }
);

let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Wrangler preview exited early.\n${serverOutput}`);
    }
    try {
      const response = await fetch(origin);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // The local Worker is still starting.
    }
    await delay(1000);
  }
  assert.equal(ready, true, `Wrangler preview did not become ready.\n${serverOutput}`);

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  // Fresh learner: dashboard, curriculum phases and truthful empty states.
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Your journey begins with the foundations.' }).waitFor();
  await page.getByRole('heading', { name: 'Year 1 learning path' }).waitFor();
  assert.equal(await page.locator('.phase-card').count(), 4, 'Year 1 should show four curriculum phases');
  await page.getByText('No reviews due right now').waitFor();
  await page.getByText('Your first session is still ahead').waitFor();
  assert.equal(await page.locator('.storage-warning').count(), 0, 'IndexedDB should be available in the browser');

  // Theme selection persists across a full reload.
  await page.getByRole('button', { name: 'Toggle colour theme' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.equal(await page.evaluate(() => localStorage.getItem('guitarlab-theme')), 'light');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');

  // Learner preferences persist in IndexedDB and feed the dashboard.
  await page.getByRole('link', { name: /Learning preferences/ }).first().click();
  await page.getByRole('heading', { name: 'Make GuitarLab yours.' }).waitFor();
  await page.getByRole('radio', { name: 'Acoustic guitar' }).check();
  await page.getByRole('radio', { name: '20 min' }).check();
  await page.getByRole('button', { name: /Save my preferences/ }).click();
  await page.getByRole('status').filter({ hasText: 'saved privately on this device' }).waitFor();
  await page.goto(origin, { waitUntil: 'networkidle' });
  assert.match(await page.locator('.practice-number').innerText(), /20/);
  await page.reload({ waitUntil: 'networkidle' });
  assert.match(await page.locator('.practice-number').innerText(), /20/);

  // Mobile navigation and curriculum anchor remain usable at a narrow viewport.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  const mobileNavigation = page.getByRole('navigation', { name: 'Mobile navigation' });
  await mobileNavigation.getByRole('link', { name: 'Learning path' }).click();
  assert.equal(new URL(page.url()).hash, '#learning-path');
  await page.locator('#learning-path').waitFor();

  // The M2.4 backup route remains reachable from the dashboard on mobile,
  // and its download contains only the active learner's profile data.
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await mobileNavigation.getByRole('link', { name: 'Data & backups' }).click();
  await page.getByRole('heading', { name: 'Keep your learning safe.' }).waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download backup/ }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^guitarlab-backup-\\d{4}-\\d{2}-\\d{2}\\.json$/);
  const downloadPath = await download.path();
  assert.ok(downloadPath, 'Backup download should be available to the browser test');
  const backup = JSON.parse(await readFile(downloadPath, 'utf8'));
  assert.equal(backup.format, 'guitarlab-learner-backup');
  assert.equal(backup.version, 1);
  assert.equal(backup.records.profile.preferences.practiceMinutes, 20);
  assert.equal(backup.records.lessonProgress.length, 0);

  assert.deepEqual(pageErrors, [], `Browser runtime errors: ${pageErrors.join('; ')}`);
  console.log('Browser acceptance passed: fresh dashboard, four phases, honest empty states, theme persistence, IndexedDB preference persistence, mobile navigation and zero uncaught page errors.');
} catch (error) {
  console.error(error);
  console.error('Wrangler preview output:\n' + serverOutput);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
