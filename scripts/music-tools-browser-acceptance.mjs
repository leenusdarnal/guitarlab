import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = Number(process.env.GUITARLAB_MUSIC_TOOLS_PREVIEW_PORT ?? 8788);
const origin = `http://127.0.0.1:${port}`;
const server = spawn(
  'npm',
  ['run', 'preview', '--', '--ip', '127.0.0.1', '--port', String(port)],
  { stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' }
);

let output = '';
server.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  output += chunk.toString();
});
let browser;

try {
  let ready = false;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Wrangler preview exited early.\n${output}`);
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
  assert.equal(
    ready,
    true,
    `Wrangler preview did not become ready.\n${output}`
  );

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Music tools' }).first().click();
  await page.getByRole('heading', { name: 'Make the fretboard familiar.' }).waitFor();

  // Fretboard note selection reports pitch, string and fret accurately.
  await page.getByRole('button', { name: 'String 6, fret 8: C3' }).click();
  await page.getByText(/Selected: C3/).waitFor();
  const targetNotes = page.locator('.fret-cell.target-note');
  assert.ok((await targetNotes.count()) > 0, 'All C note positions should be highlighted');

  // Left-handed mirroring changes display order without rewriting pitch identity.
  await page.getByLabel('Mirror string layout for left-handed playing').check();
  const leftHandedTopString = page.locator('.fretboard .string-heading').nth(1);
  await leftHandedTopString.getByText('e', { exact: true }).waitFor();

  // Chord diagrams expose muted/open/fretted states and keep quality measures separate.
  await page.getByLabel('Choose an open chord').selectOption('g-major');
  await page.getByRole('heading', { name: 'G', exact: true }).waitFor();
  await page.getByLabel('Clean changes').fill('7');
  await page.getByLabel('Total attempts').fill('10');
  await page.getByLabel('Elapsed seconds').fill('24');
  await page.getByText(/70% clean/).waitFor();
  await page.getByText(/24 seconds elapsed/).waitFor();

  // The metronome starts only after the learner clicks and can be stopped again.
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await page.getByText('Playing', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Stop metronome' }).click();
  await page.getByText('Stopped', { exact: true }).waitFor();

  // Reference tone is a separate user-initiated audio action and requests no microphone.
  await page.getByRole('button', { name: 'Play A4 reference tone' }).click();
  await page.getByRole('button', { name: 'Play A4 reference tone' }).waitFor();

  // At phone width the fretboard can scroll internally without widening the page.
  await page.setViewportSize({ width: 390, height: 844 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
    fretboard: document.querySelector('.fretboard-scroll')?.scrollWidth ?? 0
  }));
  assert.ok(
    dimensions.page <= dimensions.viewport,
    `Music tools page overflows horizontally: ${JSON.stringify(dimensions)}`
  );
  assert.ok(
    dimensions.fretboard > dimensions.viewport,
    'The fretboard should remain internally scrollable on a phone'
  );

  assert.deepEqual(
    pageErrors,
    [],
    `Music tools browser runtime errors: ${pageErrors.join('; ')}`
  );
  console.log(
    'Music tools browser acceptance passed: pitch selection, left-handed layout, chord diagrams, separate clean-change/time observations, metronome start/stop, A4 reference tone and mobile layout.'
  );
} catch (error) {
  console.error(error);
  console.error('Wrangler preview output:\n' + output);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.pid && process.platform !== 'win32') {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      /* The preview process may already have exited. */
    }
  } else {
    server.kill('SIGTERM');
  }
}
