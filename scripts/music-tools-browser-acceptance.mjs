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
  await page.addInitScript(() => {
    window.__guitarLabMicRequests = 0;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          window.__guitarLabMicRequests += 1;
          throw new DOMException(
            'Permission denied for acceptance test',
            'NotAllowedError'
          );
        }
      }
    });
  });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Tools', exact: true }).click();
  await page
    .getByRole('heading', { name: 'Tools for your practice.' })
    .waitFor();

  // The chord library is independently navigable and shows one complete shape.
  await page.getByRole('link', { name: /Open chord library/ }).click();
  await page.getByRole('heading', { name: 'Chord library.' }).waitFor();
  await page.getByLabel('Choose an open chord').selectOption('g-major');
  await page.getByRole('heading', { name: 'G', exact: true }).waitFor();
  const chordDiagram = page.getByRole('img', {
    name: /G chord, right-handed view/
  });
  await chordDiagram.waitFor();
  assert.match(
    await chordDiagram.getAttribute('aria-label'),
    /string 6: fret 3, finger 3/
  );
  assert.match(await chordDiagram.getAttribute('aria-label'), /string 4: open/);
  assert.match(
    await chordDiagram.getAttribute('aria-label'),
    /string 1: fret 3, finger 4/
  );

  // The two-chord drill alternates targets and records outcomes separately.
  await page.getByLabel('First drill chord').selectOption('c-major');
  await page.getByLabel('Second drill chord').selectOption('g-major');
  await page.getByRole('button', { name: 'Start / reset drill' }).click();
  await page
    .locator('.drill-target strong')
    .getByText('C', { exact: true })
    .waitFor();
  await page.getByRole('button', { name: 'Record clean change' }).click();
  await page
    .locator('.drill-target strong')
    .getByText('G', { exact: true })
    .waitFor();
  await page.getByRole('button', { name: 'Record correction needed' }).click();
  await page
    .locator('.drill-target strong')
    .getByText('C', { exact: true })
    .waitFor();
  await page.waitForTimeout(1100);
  await page.getByRole('button', { name: 'Finish drill' }).click();
  assert.equal(await page.getByLabel('Clean changes').inputValue(), '1');
  assert.equal(await page.getByLabel('Total attempts').inputValue(), '2');
  assert.ok(Number(await page.getByLabel('Elapsed seconds').inputValue()) >= 1);
  await page.getByText('50%', { exact: true }).waitFor();

  // Manual observations remain editable after a drill is finished.
  // Increase attempts first so the intermediate observation remains valid.
  await page.getByLabel('Total attempts').fill('10');
  await page.getByLabel('Clean changes').fill('7');
  await page.getByLabel('Elapsed seconds').fill('24');
  await page.getByText('70%', { exact: true }).waitFor();
  await page.getByText('24s', { exact: true }).waitFor();
  await page.getByLabel('Clean changes').fill('11');
  await page.getByRole('alert').waitFor();

  await page.getByRole('link', { name: 'Practice tools' }).click();
  await page.getByRole('link', { name: /Open metronome/ }).click();
  await page.getByRole('heading', { name: 'Metronome.' }).waitFor();

  // Tempo and meter can be changed before audio begins.
  const tempoSlider = page.getByRole('slider', {
    name: 'Tempo in beats per minute'
  });
  await tempoSlider.evaluate((input) => {
    input.value = '112';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() =>
    document.querySelector('.tempo-display')?.textContent?.includes('112')
  );
  await page.getByLabel('Beats per bar').selectOption('3');

  // Audio starts only from an explicit user action and can be stopped.
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await page.getByText('Playing', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Stop metronome' }).click();
  await page.getByText('Stopped', { exact: true }).waitFor();

  // Reference tone is a separate user-initiated action; no microphone is requested.
  await page.getByRole('button', { name: 'Play A4 reference tone' }).click();
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Play A4 reference tone')
    );
    return button instanceof HTMLButtonElement && !button.disabled;
  });

  // Ear-training challenges generate their examples locally and provide retry feedback.
  await page.getByRole('link', { name: 'Practice tools' }).click();
  await page.getByRole('link', { name: /Open ear training/ }).click();
  await page.getByRole('heading', { name: 'Train your ear.' }).waitFor();
  const waitForEarAudio = () =>
    page.waitForFunction(() => {
      const button = [...document.querySelectorAll('button')].find((item) =>
        item.textContent?.includes('Listen to example')
      );
      return button instanceof HTMLButtonElement && !button.disabled;
    });
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page
    .getByRole('button', { name: 'Listen to example' })
    .waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Uneven pulse' }).click();
  await page.getByText('Not quite — give it another listen.').waitFor();
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: 'Steady pulse' }).click();
  await page.getByText("That's right.").waitFor();
  await page.getByRole('button', { name: 'Next exercise' }).click();

  await page.getByRole('button', { name: 'High / low' }).click();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'First note' }).click();
  await page.getByText("That's right.").waitFor();
  await page.getByRole('button', { name: 'Next exercise' }).click();

  await page.getByRole('button', { name: 'Melodic contour' }).click();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Falling' }).click();
  await page.getByText('Not quite — give it another listen.').waitFor();
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: 'Rising' }).click();
  await page.getByText("That's right.").waitFor();

  await page.getByRole('button', { name: 'Intervals' }).click();
  await page
    .getByRole('heading', { name: 'How far apart were the two notes?' })
    .waitFor();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Same note (unison)' }).click();
  await page.getByText("That's right.").waitFor();
  await page.getByRole('button', { name: 'Next exercise' }).click();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Minor third' }).click();
  await page.getByText("That's right.").waitFor();
  await page.getByRole('button', { name: 'Next exercise' }).click();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Major third' }).click();
  await page.getByText("That's right.").waitFor();
  await page.getByRole('button', { name: 'Next exercise' }).click();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Perfect fifth' }).click();
  await page.getByText("That's right.").waitFor();

  // Hiding the tab stops the exercise and releases its page-owned audio context.
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await page.getByRole('button', { name: 'Playing example…' }).waitFor();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() =>
    [...document.querySelectorAll('button')].some(
      (button) =>
        button.textContent?.includes('Listen to example') &&
        button instanceof HTMLButtonElement &&
        !button.disabled
    )
  );
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  // Navigating away during playback aborts the completion timer and closes the context.
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await page.getByRole('button', { name: 'Playing example…' }).waitFor();
  await page.getByRole('link', { name: 'Practice tools' }).click();
  await page
    .getByRole('heading', { name: 'Tools for your practice.' })
    .waitFor();
  await page.getByRole('link', { name: /Open ear training/ }).click();
  await page.getByRole('heading', { name: 'Train your ear.' }).waitFor();
  await page.getByRole('button', { name: 'Listen to example' }).waitFor();

  // The chromatic tuner must not request microphone access on page load.
  await page.getByRole('link', { name: 'Practice tools' }).click();
  await page.getByRole('link', { name: /Open tuner/ }).click();
  await page.getByRole('heading', { name: 'Find your note.' }).waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarLabMicRequests),
    0,
    'Tuner must defer microphone permission until the learner presses Start'
  );
  await page.getByRole('button', { name: 'Start tuner' }).click();
  await page
    .getByRole('alert')
    .getByText(/Microphone permission was denied/)
    .waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarLabMicRequests),
    1,
    'Tuner should request microphone permission once after explicit Start'
  );
  // The guided note-recognition exercise also defers microphone permission.
  await page.getByRole('link', { name: 'Practice tools' }).click();
  await page.getByRole('link', { name: /Open exercise/ }).click();
  await page.getByRole('heading', { name: 'Play the right note.' }).waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarLabMicRequests),
    1,
    'Note-recognition must not request microphone permission on page load'
  );
  await page.getByRole('button', { name: 'Start exercise' }).click();
  await page
    .getByRole('alert')
    .getByText(/Microphone permission was denied/)
    .waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarLabMicRequests),
    2,
    'Note-recognition should request microphone permission once after explicit Start'
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const tunerDimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth
  }));
  assert.ok(
    tunerDimensions.page <= tunerDimensions.viewport,
    `Tuner page overflows horizontally on mobile: ${JSON.stringify(tunerDimensions)}`
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const earTrainingDimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth
  }));
  assert.ok(
    earTrainingDimensions.page <= earTrainingDimensions.viewport,
    `Ear-training page overflows horizontally on mobile: ${JSON.stringify(earTrainingDimensions)}`
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/tools/fretboard`, { waitUntil: 'networkidle' });
  const firstFretCell = page.locator('.fret-cell').first();
  await firstFretCell.waitFor();
  const fretCellSize = await firstFretCell.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  assert.ok(
    fretCellSize.width >= 24 && fretCellSize.height >= 40,
    `Fretboard touch target is too small on mobile: ${JSON.stringify(fretCellSize)}`
  );
  await firstFretCell.focus();
  await firstFretCell.press('ArrowRight');
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('data-fret')
    ),
    '1',
    'Fretboard arrow-key navigation should move to the adjacent fret'
  );
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth
  }));
  assert.ok(
    dimensions.page <= dimensions.viewport,
    `Music tool page overflows horizontally on mobile: ${JSON.stringify(dimensions)}`
  );
  assert.deepEqual(
    pageErrors,
    [],
    `Music tools browser runtime errors: ${pageErrors.join('; ')}`
  );
  console.log(
    'Music-tools browser acceptance passed: chord library and drill, metronome, reference tone, ear-training playback interruption/teardown, tuner permission deferral/denial, fretboard keyboard access and mobile layout.'
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
