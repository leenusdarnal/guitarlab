import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = Number(process.env.GUITARLAB_PREVIEW_PORT ?? 8787);
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
    if (server.exitCode !== null)
      throw new Error(`Wrangler preview exited early.\n${output}`);
    try {
      const response = await fetch(origin);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // The Worker is still starting.
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
  await page.getByRole('link', { name: 'Curriculum' }).first().click();
  await page
    .getByRole('heading', { name: /Choose your next chapter/ })
    .waitFor();

  assert.equal(
    await page.locator('.route-card').count(),
    6,
    'All six learning routes should render'
  );
  assert.equal(
    await page.locator('.week-link').count(),
    152,
    'Every authored lesson should have a stable navigation link'
  );
  assert.match(await page.locator('.stats').innerText(), /52 Year 1 lessons/);
  assert.match(await page.locator('.stats').innerText(), /52 Year 2 lessons/);
  assert.match(
    await page.locator('.stats').innerText(),
    /48 specialist lessons/
  );
  assert.match(await page.locator('.stats').innerText(), /152 total lessons/);

  // Year 1 content, instructional sections and stable next-lesson navigation.
  await page.locator('#route-year-1 .week-link').first().click();
  await page.getByRole('heading', { name: 'Meet your guitar' }).waitFor();
  await page.getByRole('heading', { name: 'What you will learn' }).waitFor();
  await page.getByRole('heading', { name: 'Guided demonstration' }).waitFor();
  await page.getByRole('heading', { name: 'Focused exercises' }).waitFor();
  await page
    .getByRole('heading', { name: 'Make the task manageable' })
    .waitFor();
  assert.match(
    await page.locator('.checkpoint').innerText(),
    /Tune all six strings/
  );

  // M4.2: section progress and checkpoint self-check survive reload.
  const sectionCount = await page.locator('.lesson-block').count();
  const progressLabel = `1 of ${sectionCount} sections completed`;
  await page
    .locator('.lesson-block')
    .first()
    .getByRole('button', { name: 'Mark section complete' })
    .click();
  await page.getByText(progressLabel).waitFor();
  await page.getByRole('button', { name: 'I need more practice' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText(progressLabel).waitFor();
  await page
    .getByRole('button', { name: 'Continue from saved section' })
    .waitFor();
  await page.getByRole('button', { name: 'I can meet this target' }).click();
  await page.getByRole('button', { name: 'Mark lesson complete' }).click();
  await page.getByText('Lesson completed', { exact: true }).waitFor();
  await page.goto(origin + '/learn/y1-w01-lesson', {
    waitUntil: 'networkidle'
  });
  await page.getByText('Lesson completed', { exact: true }).waitFor();
  await page.getByText(progressLabel).waitFor();
  await page.getByRole('link', { name: /Next lesson/ }).click();
  await page.getByRole('heading', { name: 'Clear single notes' }).waitFor();
  assert.match(page.url(), /y1-w02-lesson/);
  const secondLessonSections = await page.locator('.lesson-block').count();
  await page
    .getByText(`0 of ${secondLessonSections} sections completed`)
    .waitFor();
  await page.getByRole('link', { name: /Previous lesson/ }).click();
  await page.getByText('Lesson completed', { exact: true }).waitFor();
  await page.getByRole('link', { name: /Next lesson/ }).click();
  await page.getByRole('heading', { name: 'Clear single notes' }).waitFor();
  await page
    .getByText(`0 of ${secondLessonSections} sections completed`)
    .waitFor();

  // Year 2 route and an optional specialist route use the same reader contract.
  await page.goto(origin + '/learn', { waitUntil: 'networkidle' });
  await page.locator('#route-year-2 .phase summary').first().click();
  await page.locator('#route-year-2 .week-link').first().click();
  await page.getByRole('heading', { name: 'Fretboard map 1' }).waitFor();
  assert.match(page.url(), /y2-w01-lesson/);

  await page.goto(origin + '/learn', { waitUntil: 'networkidle' });
  await page
    .locator('#route-fingerstyle-acoustic .phase summary')
    .first()
    .click();
  await page.locator('#route-fingerstyle-acoustic .week-link').first().click();
  await page
    .getByRole('heading', { name: 'Right-hand independence' })
    .waitFor();
  assert.match(page.url(), /y3-fingerstyle-acoustic-w01-lesson/);

  // Invalid IDs render the explicit not-found state rather than a blank page.
  await page.goto(origin + '/learn/not-a-real-lesson', {
    waitUntil: 'networkidle'
  });
  await page
    .getByRole('heading', { name: "We couldn't open that lesson." })
    .waitFor();
  await page.getByText('Error 404').waitFor();

  // The route index remains within the mobile viewport.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/learn', { waitUntil: 'networkidle' });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  assert.ok(
    dimensions.content <= dimensions.viewport,
    `Curriculum page overflows horizontally: ${JSON.stringify(dimensions)}`
  );

  // Offline app-shell acceptance at desktop and mobile viewport sizes.
  for (const device of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    const offlineContext = await browser.newContext({
      viewport: { width: device.width, height: device.height }
    });
    const offlinePage = await offlineContext.newPage();
    const offlineErrors = [];
    offlinePage.on('pageerror', (error) => offlineErrors.push(error.message));
    await offlinePage.goto(origin, { waitUntil: 'networkidle' });
    await offlinePage.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) {
        throw new Error('GuitarLab service worker is not active.');
      }
    });
    await offlinePage.waitForFunction(
      () => navigator.serviceWorker.controller !== null
    );

    await offlinePage.goto(`${origin}/learn`, { waitUntil: 'networkidle' });
    const layout = await offlinePage.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    assert.ok(
      layout.content <= layout.viewport,
      `${device.name} curriculum layout overflows horizontally: ${JSON.stringify(layout)}`
    );

    const cachedLessonUrl = `${origin}/learn/y1-w01-lesson`;
    await offlinePage.goto(cachedLessonUrl, { waitUntil: 'networkidle' });
    await offlinePage
      .getByRole('heading', { name: 'Meet your guitar' })
      .waitFor();
    await offlineContext.setOffline(true);
    assert.equal(
      await offlinePage.evaluate(() => navigator.onLine),
      false,
      `${device.name} browser context should report that it is offline`
    );
    const cachedLessonResponse = await offlinePage.goto(cachedLessonUrl, {
      waitUntil: 'networkidle'
    });
    assert.equal(
      cachedLessonResponse?.status(),
      200,
      `${device.name}: a previously visited lesson should load offline`
    );
    await offlinePage
      .getByRole('heading', { name: 'Meet your guitar' })
      .waitFor();
    const uncachedLessonResponse = await offlinePage.goto(
      `${origin}/learn/y1-w03-lesson`,
      {
        waitUntil: 'networkidle'
      }
    );
    assert.equal(
      uncachedLessonResponse?.status(),
      503,
      `${device.name}: an unvisited lesson should receive the explicit offline fallback`
    );
    await offlinePage
      .getByRole('heading', { name: 'Keep your practice going.' })
      .waitFor();
    assert.deepEqual(
      offlineErrors,
      [],
      `${device.name} offline browser runtime errors: ${offlineErrors.join('; ')}`
    );
    await offlineContext.close();
  }

  assert.deepEqual(
    pageErrors,
    [],
    `Browser runtime errors: ${pageErrors.join('; ')}`
  );
  console.log(
    'Curriculum browser acceptance passed: six routes, 152 stable lesson links, lesson reading, progress save/reload/resume, checkpoint self-check/completion, next-lesson navigation, 404 handling and mobile layout.'
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
