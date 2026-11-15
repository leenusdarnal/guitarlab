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
  await page.getByRole('heading', { name: /Find your next lesson/ }).waitFor();
  await page.getByRole('navigation', { name: 'Primary navigation' }).waitFor();
  await page.getByRole('searchbox', { name: 'Search lessons' }).waitFor();

  // Start finder interaction from a fully loaded route rather than racing the SPA navigation.
  await page.goto(origin + '/learn', { waitUntil: 'networkidle' });
  await page.locator('[data-catalog-hydrated="true"]').waitFor();

  assert.equal(
    await page.locator('.route-card').count(),
    6,
    'All six learning routes should render'
  );
  assert.equal(
    await page.locator('.lesson-result').count(),
    12,
    'The finder should show a useful first page of lessons'
  );
  const initialStats = await page.locator('.stats').innerText();
  assert.match(
    initialStats,
    /152 lessons in total/,
    'The complete 152-lesson catalogue should be identified'
  );
  assert.equal(
    await page.locator('.route-jump a').count(),
    6,
    'Every learning route should have a quick-jump link'
  );
  await page.locator('.route-jump a[href="#route-year-2"]').click();
  assert.equal(
    new URL(page.url()).hash,
    '#route-year-2',
    'The Year 2 quick-jump link should navigate to its route'
  );
  assert.match(await page.locator('.stats').innerText(), /52 Year 1 lessons/);
  assert.match(await page.locator('.stats').innerText(), /52 Year 2 lessons/);
  assert.match(
    await page.locator('.stats').innerText(),
    /48 specialist lessons/
  );
  assert.match(
    await page.locator('.stats').innerText(),
    /152 lessons in total/
  );

  // Search, route and duration filters must make a specific lesson easy to find.
  const lessonSearch = page.getByRole('searchbox', { name: 'Search lessons' });
  await lessonSearch.fill('fretboard map 1');
  await page.waitForFunction(() =>
    document
      .querySelector('.result-count')
      ?.textContent?.trim()
      .startsWith('1 lesson found')
  );
  assert.equal(await page.locator('.lesson-result').count(), 1);
  assert.equal(
    await page.locator('.lesson-result h3').first().innerText(),
    'Fretboard map 1'
  );
  await page
    .getByLabel('Learning path', { exact: true })
    .selectOption('year-2');
  await page.getByLabel('Lesson length', { exact: true }).selectOption('21-30');
  assert.equal(await page.locator('.lesson-result').count(), 1);
  await page
    .getByRole('link', { name: 'Open lesson: Fretboard map 1' })
    .click();
  await page.getByRole('heading', { name: 'Fretboard map 1' }).waitFor();
  await page.goto(origin + '/learn', { waitUntil: 'networkidle' });
  await page.locator('[data-catalog-hydrated="true"]').waitFor();
  await lessonSearch.fill('zzzz-no-matching-lesson');
  await page
    .getByRole('heading', { name: 'No lessons match those filters.' })
    .waitFor();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.locator('.lesson-result').first().waitFor();

  // Year 1 content, instructional sections and stable next-lesson navigation.
  await page
    .getByRole('link', { name: 'Open lesson: Meet your guitar' })
    .click();
  await page.getByRole('heading', { name: 'Meet your guitar' }).waitFor();
  await page.getByRole('heading', { name: 'What you will learn' }).waitFor();
  await page.getByRole('navigation', { name: 'Lesson sections' }).waitFor();
  const lessonOutline = page.locator('.lesson-outline a');
  const invalidOutlineLinks = await lessonOutline.evaluateAll((links) =>
    links
      .map((link) => link.getAttribute('href'))
      .filter(
        (href) =>
          !href?.startsWith('#') || !document.getElementById(href.slice(1))
      )
  );
  assert.deepEqual(
    invalidOutlineLinks,
    [],
    'Every lesson section shortcut must target an existing section ID'
  );
  assert.equal(
    await page
      .locator('#lesson-progress')
      .evaluate((progressPanel) =>
        Boolean(
          progressPanel.compareDocumentPosition(
            document.querySelector('.lesson-layout')
          ) & Node.DOCUMENT_POSITION_PRECEDING
        )
      ),
    true,
    'Progress and completion actions should follow the learning sequence'
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('link', { name: 'Key idea', exact: true }).click();
  assert.equal(new URL(page.url()).hash, '#lesson-section-key-idea');
  assert.ok(
    await page
      .locator('.lesson-outline')
      .evaluate(
        (outline) => outline.getBoundingClientRect().width <= window.innerWidth
      ),
    'The section rail should fit the phone viewport'
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('link', { name: 'Exercises', exact: true }).click();
  await page.locator('#lesson-section-exercises').waitFor();
  await page.getByRole('heading', { name: 'Guided demonstration' }).waitFor();
  await page.getByRole('heading', { name: 'Focused exercises' }).waitFor();
  await page.locator('.lesson-adaptation').waitFor();
  await page
    .getByRole('navigation', { name: 'Tools for this lesson' })
    .waitFor();
  await page.getByRole('link', { name: /Open tuner/ }).waitFor();
  assert.match(
    await page.locator('.checkpoint').innerText(),
    /Tune all six strings/
  );

  // M7.2: objectively score standard open-string pitch recall and persist item outcomes.
  await page
    .getByRole('heading', { name: 'Standard tuning: open-string pitch check' })
    .waitFor();
  const pitchAnswers = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
  const pitchSelects = page.locator('.assessment-item select');
  assert.equal(
    await pitchSelects.count(),
    6,
    'The standard-tuning assessment should present six stable items'
  );
  for (let index = 0; index < pitchAnswers.length; index += 1) {
    await pitchSelects.nth(index).selectOption(pitchAnswers[index]);
  }
  await page.getByRole('button', { name: 'Check answers' }).click();
  await page.getByText('Check passed', { exact: true }).waitFor();
  const savedAssessment = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('guitarlab-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const [active, attempts] = await Promise.all([
      new Promise((resolve, reject) => {
        const request = database
          .transaction('metadata')
          .objectStore('metadata')
          .get('activeLearnerId');
        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = database
          .transaction('assessmentAttempts')
          .objectStore('assessmentAttempts')
          .getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
    ]);
    database.close();
    return (
      attempts.find(
        (attempt) =>
          attempt.learnerId === active &&
          attempt.assessmentInstrument?.definitionId ===
            'guitar.standard-tuning-open-pitches'
      ) ?? null
    );
  });
  assert.ok(savedAssessment, 'The objective assessment must be saved locally');
  assert.equal(savedAssessment.curriculumReleaseId, 'curriculum-v1.0.6');
  assert.equal(savedAssessment.skillId, 'instrument.tuning');
  assert.equal(savedAssessment.score, 100);
  assert.equal(savedAssessment.outcome, 'passed');
  assert.equal(savedAssessment.itemEvidence.length, 6);
  assert.ok(
    savedAssessment.itemEvidence.every((item) => item.outcome === 'correct'),
    'All six selected pitches should be stored with direct correct outcomes'
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('Check passed', { exact: true }).waitFor();
  assert.equal(
    await page.locator('.assessment-item select').count(),
    0,
    'The latest saved result should be restored instead of resetting on reload'
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
  const checkpointNote = page.locator('#checkpoint-note');
  await checkpointNote.fill(
    'A first note queued while another save is in flight.'
  );
  await page.getByRole('button', { name: 'I need more practice' }).click();
  await page.getByRole('button', { name: 'I can meet this target' }).click();
  await checkpointNote.fill('Keep the final chord change relaxed.');
  await checkpointNote.blur();
  await page.waitForFunction(
    () => !document.querySelector('.saving-message'),
    null,
    { timeout: 10000 }
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText(progressLabel).waitFor();
  await page
    .getByRole('button', { name: 'Continue from saved section' })
    .waitFor();
  assert.equal(
    await checkpointNote.inputValue(),
    'Keep the final chord change relaxed.',
    'The final checkpoint note must survive rapid queued edits'
  );
  assert.equal(
    await page
      .getByRole('button', { name: 'I can meet this target' })
      .getAttribute('aria-pressed'),
    'true',
    'The final checkpoint choice must survive earlier in-flight saves'
  );
  await page.context().setOffline(true);
  await page
    .locator('.lesson-block')
    .nth(1)
    .getByRole('button', { name: 'Mark section complete' })
    .click();
  await page.getByText(`2 of ${sectionCount} sections completed`).waitFor();
  await page.context().setOffline(false);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText(`2 of ${sectionCount} sections completed`).waitFor();
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
  await page.locator('[data-catalog-hydrated="true"]').waitFor();
  await page
    .getByRole('searchbox', { name: 'Search lessons' })
    .fill('Fretboard map 1');
  const yearTwoLessonLink = page.getByRole('link', {
    name: 'Open lesson: Fretboard map 1',
    exact: true
  });
  const yearTwoLessonHref = await yearTwoLessonLink.getAttribute('href');
  assert.equal(
    new URL(yearTwoLessonHref ?? '', origin).pathname,
    '/learn/y2-w01-lesson'
  );
  await yearTwoLessonLink.click();
  await page.waitForURL('**/learn/y2-w01-lesson');
  await page
    .getByRole('heading', { name: 'Fretboard map 1', level: 1 })
    .waitFor();
  assert.equal(new URL(page.url()).pathname, '/learn/y2-w01-lesson');

  await page.goto(origin + '/learn', { waitUntil: 'networkidle' });
  await page.locator('[data-catalog-hydrated="true"]').waitFor();
  await page
    .getByRole('searchbox', { name: 'Search lessons' })
    .fill('Right-hand independence');
  const specialistLessonLink = page.getByRole('link', {
    name: 'Open lesson: Right-hand independence',
    exact: true
  });
  const specialistLessonHref = await specialistLessonLink.getAttribute('href');
  assert.equal(
    new URL(specialistLessonHref ?? '', origin).pathname,
    '/learn/y3-fingerstyle-acoustic-w01-lesson'
  );
  await specialistLessonLink.click();
  await page.waitForURL('**/learn/y3-fingerstyle-acoustic-w01-lesson');
  await page
    .getByRole('heading', { name: 'Right-hand independence', level: 1 })
    .waitFor();
  assert.equal(
    new URL(page.url()).pathname,
    '/learn/y3-fingerstyle-acoustic-w01-lesson'
  );

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
  const openMobileMenu = page.getByRole('button', { name: 'Open menu' });
  await openMobileMenu.waitFor();
  await openMobileMenu.click();
  const mobileMenuLearn = page
    .locator('#mobile-primary-navigation')
    .getByRole('link', { name: 'Learn', exact: true });
  await mobileMenuLearn.waitFor();
  await mobileMenuLearn.click();
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
    const lessonLayout = await offlinePage.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    assert.ok(
      lessonLayout.content <= lessonLayout.viewport,
      `${device.name} lesson layout overflows horizontally: ${JSON.stringify(lessonLayout)}`
    );
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
    'Curriculum browser acceptance passed: six routes, searchable/filterable 152-lesson finder, shared navigation, lesson section outline, lesson reading, progress save/reload/resume, checkpoint self-check/completion, next-lesson navigation, 404 handling and desktop/mobile offline layout.'
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
