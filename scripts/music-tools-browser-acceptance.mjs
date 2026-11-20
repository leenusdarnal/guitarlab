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
    window.__guitarLabMicErrorName = 'NotAllowedError';
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          window.__guitarLabMicRequests += 1;
          throw new DOMException(
            'Microphone failure for acceptance test',
            window.__guitarLabMicErrorName
          );
        }
      }
    });
  });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const assertBackIcon = async () => {
    assert.equal(
      await page.locator('.back-link [data-icon="arrow-left"]').count(),
      1,
      'Tool routes must use the shared SVG back icon.'
    );
  };

  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Tools', exact: true }).click();
  await page
    .getByRole('heading', { name: 'Tools for your practice.' })
    .waitFor();
  await assertBackIcon();

  // The chord library is independently navigable and shows one complete shape.
  await page.getByRole('link', { name: /Open chord library/ }).click();
  await page.getByRole('heading', { name: 'Chord library.' }).waitFor();
  await assertBackIcon();
  await page.getByLabel('Choose an open chord').selectOption('g-major');
  await page.getByRole('heading', { name: 'G', exact: true }).waitFor();
  const chordDiagram = page.getByRole('img', {
    name: /G chord, right-handed chord box/
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
  assert.equal(await chordDiagram.locator('.chord-svg-string').count(), 6);
  assert.equal(await chordDiagram.locator('.chord-svg-fret').count(), 5);
  assert.equal(await chordDiagram.locator('.chord-svg-finger').count(), 3);
  assert.match(
    await chordDiagram.getAttribute('aria-label'),
    /string 5: fret 2, finger 1/
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

  await page.locator('.back-link').click();
  await page.getByRole('link', { name: /Open metronome/ }).click();
  await page.getByRole('heading', { name: 'Metronome.' }).waitFor();
  await assertBackIcon();

  // Numeric, stepped, preset, tap-tempo and slider controls stay in sync.
  const tempoEntry = page.getByRole('spinbutton', {
    name: 'Enter tempo in beats per minute'
  });
  await tempoEntry.fill('112');
  await page.waitForFunction(() =>
    document.querySelector('.tempo-display')?.textContent?.includes('112')
  );
  await page.getByRole('button', { name: 'Increase tempo by 1 BPM' }).click();
  await page.waitForFunction(() =>
    document.querySelector('.tempo-display')?.textContent?.includes('113')
  );
  await page.getByRole('button', { name: '100 BPM' }).click();
  await page.getByLabel('Beats per bar').selectOption('3');
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
  await page.getByRole('button', { name: 'Tap tempo' }).click();
  await page.getByRole('status').filter({ hasText: 'Tap once more' }).waitFor();

  // A valid BPM deep link pre-fills tempo without starting audio.
  await page.goto(`${origin}/tools/metronome?bpm=96`, {
    waitUntil: 'domcontentloaded'
  });
  await page.getByRole('heading', { name: 'Metronome.' }).waitFor();
  const deepLinkTempo = page.getByRole('spinbutton', {
    name: 'Enter tempo in beats per minute'
  });
  await page.waitForFunction(() => {
    const tempo = document.querySelector('input[aria-label="Enter tempo in beats per minute"]');
    return tempo instanceof HTMLInputElement && tempo.value === '96';
  });
  assert.equal(await deepLinkTempo.inputValue(), '96');
  await page.getByRole('button', { name: 'Start metronome' }).waitFor();

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
  await page.locator('.back-link').click();
  await page.getByRole('link', { name: /Open ear training/ }).click();
  await page.getByRole('heading', { name: 'Train your ear.' }).waitFor();
  await assertBackIcon();
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
  await page
    .getByText('Pulse item evidence saved locally.', { exact: false })
    .waitFor();
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: 'Steady pulse' }).click();
  await page.getByText("That's right.").waitFor();
  await page
    .getByText('Pulse item evidence saved locally.', { exact: false })
    .waitFor();
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
  await page.getByRole('button', { name: 'Minor third' }).click();
  await page.getByText('Not quite — give it another listen.').waitFor();
  await page
    .getByText('Interval item evidence saved locally.', { exact: false })
    .waitFor();
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: 'Same note (unison)' }).click();
  await page.getByText("That's right.").waitFor();
  await page
    .getByText('Interval item evidence saved locally.', { exact: false })
    .waitFor();
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

  // Extended interval sets retain a focused answer pool and save supporting evidence.
  await page.getByRole('button', { name: 'Steps & tritone' }).click();
  await page
    .getByRole('heading', { name: 'How far apart were the two notes?' })
    .waitFor();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Minor second' }).click();
  await page.getByText("That's right.").waitFor();
  await page
    .getByText('Interval item evidence saved locally.', { exact: false })
    .waitFor();
  await page.getByRole('button', { name: 'Next exercise' }).click();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Major second' }).click();
  await page.getByText("That's right.").waitFor();

  await page.getByRole('button', { name: 'Wide leaps' }).click();
  await page
    .getByRole('heading', { name: 'How far apart were the two notes?' })
    .waitFor();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Minor sixth' }).click();
  await page.getByText("That's right.").waitFor();
  await page
    .getByText('Interval item evidence saved locally.', { exact: false })
    .waitFor();
  await page.getByRole('button', { name: 'Next exercise' }).click();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Major sixth' }).click();
  await page.getByText("That's right.").waitFor();

  // Starting pitch varies, but the learner-facing task remains interval-relative.
  await page.getByRole('button', { name: 'Next exercise' }).click();
  await page
    .getByRole('heading', { name: 'How far apart were the two notes?' })
    .waitFor();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'Minor seventh' }).click();
  await page.getByText("That's right.").waitFor();

  await page.getByRole('button', { name: 'Chord movement' }).click();
  await page
    .getByRole('heading', {
      name: 'Which chord was heard between the two C major chords?'
    })
    .waitFor();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'G major (V)' }).click();
  await page.getByText('Not quite — give it another listen.').waitFor();
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: 'F major (IV)' }).click();
  await page.getByText("That's right.").waitFor();
  await page
    .getByText('The middle chord was F major, the IV chord in C major.')
    .waitFor();
  await page.getByRole('button', { name: 'Next exercise' }).click();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await waitForEarAudio();
  await page.getByRole('button', { name: 'G major (V)' }).click();
  await page.getByText("That's right.").waitFor();
  await page
    .getByText('The middle chord was G major, the V chord in C major.')
    .waitFor();

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
  await page.locator('.back-link').click();
  await page
    .getByRole('heading', { name: 'Tools for your practice.' })
    .waitFor();
  await page.getByRole('link', { name: /Open ear training/ }).click();
  await page.getByRole('heading', { name: 'Train your ear.' }).waitFor();
  await page.getByRole('button', { name: 'Listen to example' }).waitFor();

  // Theory recall connects names, generated triad sounds and chord function.
  await page.locator('.back-link').click();
  await page
    .getByRole('heading', { name: 'Tools for your practice.' })
    .waitFor();
  await page.getByRole('link', { name: /Open theory recall/ }).click();
  await page.getByRole('heading', { name: 'Make theory musical.' }).waitFor();
  await assertBackIcon();
  await page.getByRole('button', { name: 'F major' }).click();
  await page.getByText("That's right.").waitFor();
  await page
    .getByText('F major is the IV chord in C major.', { exact: false })
    .waitFor();

  await page.getByRole('button', { name: 'Sound' }).click();
  await page
    .getByRole('heading', {
      name: 'Listen to the triad. Is its quality major or minor?'
    })
    .waitFor();
  await page.getByRole('button', { name: 'Listen to example' }).click();
  await page.getByRole('button', { name: 'Playing example…' }).waitFor();
  await page.getByRole('button', { name: 'Minor' }).click();
  await page.getByText('Not quite — review the clue and try again.').waitFor();
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: 'Major' }).click();
  await page.getByText("That's right.").waitFor();
  await page
    .getByText('This is C major: C, E and G.', { exact: false })
    .waitFor();
  await page.getByRole('button', { name: 'Next prompt' }).click();
  await page.getByRole('button', { name: 'Minor' }).click();
  await page.getByText("That's right.").waitFor();
  await page.getByRole('button', { name: 'Listen to example' }).waitFor();

  await page.getByRole('button', { name: 'Use' }).click();
  await page
    .getByRole('heading', {
      name: 'Which chord is the dominant that creates a pull back to C major?'
    })
    .waitFor();
  await page.getByRole('button', { name: 'G major' }).click();
  await page.getByText("That's right.").waitFor();
  await page
    .getByText('G major is the V chord in C major.', { exact: false })
    .waitFor();

  // The chromatic tuner must not request microphone access on page load.
  await page.locator('.back-link').click();
  await page.getByRole('link', { name: /Open chromatic tuner/ }).click();
  await page.getByRole('heading', { name: 'Find your note.' }).waitFor();
  await assertBackIcon();
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
  const tunerRetry = page.getByRole('button', { name: 'Try tuner again' });
  await tunerRetry.waitFor();
  await tunerRetry.click();
  await page
    .getByRole('alert')
    .getByText(/Microphone permission was denied/)
    .waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarLabMicRequests),
    2,
    'Tuner retry should make one new user-initiated microphone request'
  );
  // Missing devices receive a distinct, actionable message.
  await page.goto(`${origin}/tools/tuner`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Find your note.' }).waitFor();
  await page.evaluate(() => {
    window.__guitarLabMicErrorName = 'NotFoundError';
  });
  await page.getByRole('button', { name: 'Start tuner' }).click();
  await page
    .getByRole('alert')
    .getByText(/No microphone was found/)
    .waitFor();
  await page.getByRole('button', { name: 'Try tuner again' }).waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarLabMicRequests),
    1,
    'A missing device should be reported after one explicit capture request'
  );

  // Unsupported browser APIs fail safely without requesting permission.
  await page.goto(`${origin}/tools/tuner`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined
    });
  });
  await page.getByRole('button', { name: 'Start tuner' }).click();
  await page
    .getByRole('alert')
    .getByText(/not supported in this browser or context/i)
    .waitFor();
  await page.getByRole('button', { name: 'Try tuner again' }).waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarLabMicRequests),
    0,
    'Unsupported microphone APIs must not invoke getUserMedia'
  );

  // Restore the controlled device stub before checking the other microphone feature.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          window.__guitarLabMicRequests += 1;
          throw new DOMException(
            'Microphone failure for acceptance test',
            'NotAllowedError'
          );
        }
      }
    });
  });

  // The guided note-recognition exercise also defers microphone permission.
  await page.locator('.back-link').click();
  await page.getByRole('link', { name: /Open note recognition/ }).click();
  await page.getByRole('heading', { name: 'Play the right note.' }).waitFor();
  await assertBackIcon();
  assert.equal(
    await page.evaluate(() => window.__guitarLabMicRequests),
    0,
    'Note-recognition must not request microphone permission on page load'
  );
  await page.getByRole('button', { name: 'Start exercise' }).click();
  await page
    .getByRole('alert')
    .getByText(/Microphone permission was denied/)
    .waitFor();
  const noteRecognitionRetry = page.getByRole('button', {
    name: 'Try exercise again'
  });
  await noteRecognitionRetry.waitFor();
  await noteRecognitionRetry.click();
  await page
    .getByRole('alert')
    .getByText(/Microphone permission was denied/)
    .waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarLabMicRequests),
    2,
    'Note-recognition retry should make one new user-initiated microphone request'
  );

  await page.goto(`${origin}/tools/tuner`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Find your note.' }).waitFor();
  assert.equal(
    await page.locator('.note-display').getAttribute('aria-live'),
    null,
    'High-frequency tuner measurements must not be announced continuously'
  );
  await page
    .getByRole('status')
    .filter({ hasText: 'The tuner is ready' })
    .waitFor();
  await page.getByLabel('A4 reference frequency').selectOption('442');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Find your note.' }).waitFor();
  assert.equal(
    await page.getByLabel('A4 reference frequency').inputValue(),
    '442'
  );
  await page.getByText('442 Hz reference', { exact: true }).waitFor();
  const tunerReference = page.getByRole('button', {
    name: 'Hear A4 reference tone'
  });
  await tunerReference.click();
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find(
      (item) =>
        item.textContent?.includes('Hear A4 reference tone') ||
        item.textContent?.includes('Playing A4 reference')
    );
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const tunerDimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth
  }));
  assert.ok(
    tunerDimensions.page <= tunerDimensions.viewport,
    `Tuner page overflows horizontally on mobile: ${JSON.stringify(tunerDimensions)}`
  );

  await page.locator('.back-link').click();
  await page.getByRole('link', { name: /Open ear training/ }).click();
  await page.getByRole('heading', { name: 'Train your ear.' }).waitFor();
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
  await page.goto(`${origin}/tools/fretboard`, {
    waitUntil: 'domcontentloaded'
  });
  await assertBackIcon();
  await page.getByRole('button', { name: 'Find a note' }).click();
  await page.locator('.find-progress').waitFor();
  await page.locator('.fret-cell[data-string="2"][data-fret="1"]').click();
  await page.getByText('1 found', { exact: true }).waitFor();
  await page.getByText('1 first-try · 1 selections', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Next note' }).click();
  await page.getByRole('button', { name: 'Hint' }).click();
  await page.getByRole('button', { name: 'Reveal positions' }).click();
  assert.ok((await page.locator('.fret-cell.is-revealed').count()) > 0);
  await page.locator('.fret-cell[data-string="2"][data-fret="2"]').click();
  await page.getByText('2 found', { exact: true }).waitFor();
  await page.getByText('1 first-try · 2 selections', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Exit find mode' }).click();
  await page.locator('.fret-cell[data-string="2"][data-fret="3"]').click();
  await page.getByRole('button', { name: 'Hear D4' }).click();
  await page.getByRole('status').filter({ hasText: 'Played D4' }).waitFor();

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
  await page.goto(`${origin}/repertoire`, { waitUntil: 'domcontentloaded' });
  await assertBackIcon();

  assert.deepEqual(
    pageErrors,
    [],
    `Music tools browser runtime errors: ${pageErrors.join('; ')}`
  );
  console.log(
    'Music-tools browser acceptance passed: chord library and drill, metronome, reference tone, ear-training playback interruption/teardown, tuner permission deferral and failure states, tuner/ear-training mobile layout, and fretboard keyboard access.'
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
