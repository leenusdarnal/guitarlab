import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = Number(process.env.GUITARLAB_PREVIEW_PORT ?? 8787);
const origin = `http://127.0.0.1:${port}`;
const skillCatalog = JSON.parse(
  await readFile(
    new URL('../content/curriculum/skill-catalog.json', import.meta.url),
    'utf8'
  )
);
const activeCurriculumReleaseId = skillCatalog.curriculumReleaseId;
const skillIdFor = (displayName) => {
  const skill = skillCatalog.skills.find(
    (item) => item.displayName === displayName
  );
  assert.ok(skill, `The curriculum catalogue must include ${displayName}.`);
  return skill.id;
};
const alternatePickingSkillId = skillIdFor('Alternate picking');
const chordTransitionsSkillId = skillIdFor('Chord transitions');
const server = spawn(
  'npm',
  ['run', 'preview', '--', '--ip', '127.0.0.1', '--port', String(port)],
  { stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' }
);

let serverOutput = '';
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString();
});

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
  assert.equal(
    ready,
    true,
    `Wrangler preview did not become ready.\n${serverOutput}`
  );

  browser = await chromium.launch({ headless: true });

  // Upgrade a real v1 learner database to v2 without losing learner-owned records.
  const upgradeContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 }
  });
  const upgradePage = await upgradeContext.newPage();
  await upgradePage.goto(origin, { waitUntil: 'networkidle' });
  await upgradePage
    .getByRole('heading', { name: 'Your journey begins with the foundations.' })
    .waitFor();
  await upgradePage.getByText('Your first session is still ahead').waitFor();
  await upgradePage.setViewportSize({ width: 390, height: 844 });
  const mobileDashboardOrder = await upgradePage.evaluate(() => {
    const plan = document.querySelector('.practice-planner');
    const nextLesson = document.querySelector('.hero-grid');
    const overview = document.querySelector('.dashboard-grid');
    return {
      planTop: plan?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
      nextLessonTop:
        nextLesson?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
      overviewTop:
        overview?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth
    };
  });
  assert.ok(
    mobileDashboardOrder.planTop < mobileDashboardOrder.nextLessonTop,
    'Mobile Today must present the editable practice plan before the lesson overview.'
  );
  assert.ok(
    mobileDashboardOrder.nextLessonTop < mobileDashboardOrder.overviewTop,
    'Mobile Today must present the next lesson before historical progress panels.'
  );
  assert.equal(
    mobileDashboardOrder.documentWidth,
    mobileDashboardOrder.viewportWidth,
    'Mobile Today must not introduce horizontal page overflow.'
  );
  await upgradePage.setViewportSize({ width: 1440, height: 1000 });
  const desktopDashboardOrder = await upgradePage.evaluate(() => ({
    planTop: document
      .querySelector('.practice-planner')
      ?.getBoundingClientRect().top,
    nextLessonTop: document.querySelector('.hero-grid')?.getBoundingClientRect()
      .top,
    overviewTop: document
      .querySelector('.dashboard-grid')
      ?.getBoundingClientRect().top
  }));
  assert.ok(
    desktopDashboardOrder.planTop < desktopDashboardOrder.nextLessonTop &&
      desktopDashboardOrder.nextLessonTop < desktopDashboardOrder.overviewTop,
    'Desktop Today should retain the same action-first content order.'
  );
  await upgradePage.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const deletion = indexedDB.deleteDatabase('guitarlab-local');
      deletion.onsuccess = () => resolve(true);
      deletion.onerror = () =>
        reject(
          deletion.error ?? new Error('Could not reset IndexedDB fixture.')
        );
      deletion.onblocked = () =>
        reject(
          new Error('IndexedDB fixture deletion was blocked by another tab.')
        );
    });
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('guitarlab-local', 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        database.createObjectStore('metadata', { keyPath: 'key' });
        const profiles = database.createObjectStore('learnerProfiles', {
          keyPath: 'id'
        });
        profiles.createIndex('byUpdatedAt', 'updatedAt');
        const progress = database.createObjectStore('lessonProgress', {
          keyPath: 'id'
        });
        progress.createIndex('byLearnerId', 'learnerId');
        progress.createIndex(
          'byLearnerReleaseLesson',
          ['learnerId', 'curriculumReleaseId', 'lessonId'],
          { unique: true }
        );
        const events = database.createObjectStore('lessonCompletionEvents', {
          keyPath: 'id'
        });
        events.createIndex('byProgressId', 'progressId');
        events.createIndex('byLearnerCompletedAt', [
          'learnerId',
          'completedAt'
        ]);
        const attempts = database.createObjectStore('assessmentAttempts', {
          keyPath: 'id'
        });
        attempts.createIndex('byLearnerReleaseSkill', [
          'learnerId',
          'curriculumReleaseId',
          'skillId'
        ]);
        const mastery = database.createObjectStore('skillMastery', {
          keyPath: ['learnerId', 'curriculumReleaseId', 'skillId']
        });
        mastery.createIndex('byLearnerId', 'learnerId');
        const sessions = database.createObjectStore('practiceSessions', {
          keyPath: 'id'
        });
        sessions.createIndex('byLearnerId', 'learnerId');
        sessions.createIndex('byStatus', 'status');

        request.transaction.objectStore('metadata').add({
          key: 'activeLearnerId',
          value: 'legacy-learner-001'
        });
        profiles.add({
          id: 'legacy-learner-001',
          preferencesSchemaVersion: 1,
          preferences: {
            schemaVersion: 1,
            instrument: 'acoustic',
            handedness: 'right',
            tuning: 'Standard E',
            startingPoint: 'fresh-beginner',
            goals: ['acoustic-fingerstyle'],
            practiceMinutes: 20,
            availableDays: [1, 3, 5],
            lessonPresentation: 'balanced'
          },
          createdAt: 100,
          updatedAt: 200,
          lastActiveAt: null
        });
        sessions.add({
          id: 'legacy-session-001',
          learnerId: 'legacy-learner-001',
          primaryCurriculumReleaseId: 'curriculum-v1',
          primaryLessonId: 'y1-w01-lesson',
          status: 'in_progress',
          plannedMinutes: 20,
          actualDurationSeconds: 0,
          focus: 'fingerstyle basics',
          difficulty: null,
          reflection: null,
          startedAt: 150,
          endedAt: null,
          createdAt: 150,
          updatedAt: 150
        });
      };
      request.onsuccess = () => {
        request.result.close();
        resolve(true);
      };
      request.onerror = () =>
        reject(
          request.error ?? new Error('Could not create v1 IndexedDB fixture.')
        );
    });
  });
  await upgradePage.reload({ waitUntil: 'networkidle' });
  await upgradePage
    .getByRole('heading', { name: 'Your journey begins with the foundations.' })
    .waitFor();
  await upgradePage.waitForFunction(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('guitarlab-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          request.error ?? new Error('Could not inspect IndexedDB version.')
        );
    });
    const upgraded =
      database.version === 7 &&
      database
        .transaction('practiceSessions')
        .objectStore('practiceSessions')
        .indexNames.contains('byLearnerStatusStartedAt') &&
      database
        .transaction('practiceSessions')
        .objectStore('practiceSessions')
        .indexNames.contains('byLearnerStatus') &&
      database.objectStoreNames.contains('practiceEvidence') &&
      database.objectStoreNames.contains('adaptiveRecommendationFeedback') &&
      database.objectStoreNames.contains('songProjects') &&
      database
        .transaction('songProjects')
        .objectStore('songProjects')
        .indexNames.contains('byLearnerId') &&
      database
        .transaction('adaptiveRecommendationFeedback')
        .objectStore('adaptiveRecommendationFeedback')
        .indexNames.contains('byLearnerRelease') &&
      database
        .transaction('assessmentAttempts')
        .objectStore('assessmentAttempts')
        .indexNames.contains('byLearnerRelease') &&
      database
        .transaction('practiceEvidence')
        .objectStore('practiceEvidence')
        .indexNames.contains('byLearnerId');
    database.close();
    return upgraded;
  });
  const upgradeResult = await upgradePage.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('guitarlab-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          request.error ?? new Error('Could not reopen upgraded IndexedDB.')
        );
    });
    const transaction = database.transaction(
      ['metadata', 'learnerProfiles', 'practiceSessions'],
      'readonly'
    );
    const read = (request) =>
      new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error('IndexedDB read failed.'));
      });
    const sessions = transaction.objectStore('practiceSessions');
    const assessmentAttempts = database
      .transaction('assessmentAttempts')
      .objectStore('assessmentAttempts');
    const practiceEvidence = database
      .transaction('practiceEvidence')
      .objectStore('practiceEvidence');
    const [active, profile, migratedSession] = await Promise.all([
      read(transaction.objectStore('metadata').get('activeLearnerId')),
      read(
        transaction.objectStore('learnerProfiles').get('legacy-learner-001')
      ),
      read(
        sessions
          .index('byLearnerStatusStartedAt')
          .get(['legacy-learner-001', 'in_progress', 150])
      )
    ]);
    const result = {
      version: database.version,
      stores: Array.from(database.objectStoreNames),
      activeLearnerId: active?.value ?? null,
      practiceMinutes: profile?.preferences?.practiceMinutes ?? null,
      instrument: profile?.preferences?.instrument ?? null,
      migratedSessionId: migratedSession?.id ?? null,
      sessionIndex: sessions.indexNames.contains('byLearnerStatusStartedAt'),
      learnerStatusIndex: sessions.indexNames.contains('byLearnerStatus'),
      assessmentReleaseIndex:
        assessmentAttempts.indexNames.contains('byLearnerRelease'),
      practiceEvidenceLearnerIndex:
        practiceEvidence.indexNames.contains('byLearnerId'),
      adaptiveFeedbackStore: database.objectStoreNames.contains(
        'adaptiveRecommendationFeedback'
      ),
      adaptiveFeedbackReleaseIndex: database
        .transaction('adaptiveRecommendationFeedback')
        .objectStore('adaptiveRecommendationFeedback')
        .indexNames.contains('byLearnerRelease'),
      songProjectsStore: database.objectStoreNames.contains('songProjects'),
      songProjectsLearnerIndex: database
        .transaction('songProjects')
        .objectStore('songProjects')
        .indexNames.contains('byLearnerId')
    };
    database.close();
    return result;
  });
  assert.equal(
    upgradeResult.version,
    7,
    'The existing v1 database should upgrade to v7'
  );
  assert.equal(upgradeResult.activeLearnerId, 'legacy-learner-001');
  assert.equal(upgradeResult.practiceMinutes, 20);
  assert.equal(upgradeResult.instrument, 'acoustic');
  assert.equal(upgradeResult.migratedSessionId, 'legacy-session-001');
  assert.equal(upgradeResult.sessionIndex, true);
  assert.equal(upgradeResult.learnerStatusIndex, true);
  assert.equal(upgradeResult.assessmentReleaseIndex, true);
  assert.equal(upgradeResult.practiceEvidenceLearnerIndex, true);
  assert.equal(upgradeResult.adaptiveFeedbackStore, true);
  assert.equal(upgradeResult.adaptiveFeedbackReleaseIndex, true);
  assert.equal(upgradeResult.songProjectsStore, true);
  assert.equal(upgradeResult.songProjectsLearnerIndex, true);
  assert.deepEqual(upgradeResult.stores.sort(), [
    'adaptiveRecommendationFeedback',
    'assessmentAttempts',
    'learnerProfiles',
    'lessonCompletionEvents',
    'lessonProgress',
    'metadata',
    'practiceEvidence',
    'practiceSessions',
    'skillMastery',
    'songProjects'
  ]);
  await upgradeContext.close();

  // Theme storage is optional: a blocked localStorage API must not block the dashboard.
  const restrictedStorageContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 }
  });
  await restrictedStorageContext.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: false,
      get() {
        throw new DOMException('Storage access is disabled', 'SecurityError');
      }
    });
  });
  const restrictedStoragePage = await restrictedStorageContext.newPage();
  const restrictedStorageErrors = [];
  restrictedStoragePage.on('pageerror', (error) =>
    restrictedStorageErrors.push(error.message)
  );
  await restrictedStoragePage.goto(origin, { waitUntil: 'networkidle' });
  await restrictedStoragePage
    .getByRole('heading', { name: 'Your journey begins with the foundations.' })
    .waitFor();
  await restrictedStoragePage
    .getByRole('combobox', { name: 'Appearance' })
    .selectOption('dark');
  assert.equal(
    await restrictedStoragePage.locator('html').getAttribute('data-theme'),
    'dark',
    'The theme should still change in memory when localStorage is blocked'
  );
  assert.deepEqual(
    restrictedStorageErrors,
    [],
    `Blocked localStorage caused browser errors: ${restrictedStorageErrors.join('; ')}`
  );
  await restrictedStorageContext.close();

  // Storage errors offer an in-place retry and a useful next destination.
  const recoveryContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  await recoveryContext.addInitScript(() => {
    const factory = window.indexedDB;
    const originalOpen = factory.open.bind(factory);
    let databaseAvailable = false;
    Object.defineProperty(factory, 'open', {
      configurable: true,
      value: (...args) => {
        if (!databaseAvailable) {
          throw new DOMException(
            'Local database is temporarily unavailable',
            'UnknownError'
          );
        }
        return originalOpen(...args);
      }
    });
    Object.defineProperty(window, '__guitarlabSetDatabaseAvailable', {
      configurable: true,
      value: (available) => {
        databaseAvailable = available;
      }
    });
  });
  const recoveryPage = await recoveryContext.newPage();
  await recoveryPage.goto(origin, { waitUntil: 'networkidle' });
  await recoveryPage
    .getByText('Dashboard unavailable', { exact: true })
    .waitFor();
  assert.equal(
    await recoveryPage
      .locator('.error-panel')
      .getByRole('button', { name: 'Try again' })
      .count(),
    1,
    'The dashboard storage error must provide a retry action'
  );
  await recoveryPage.evaluate(() =>
    window.__guitarlabSetDatabaseAvailable(true)
  );
  await recoveryPage
    .locator('.error-panel')
    .getByRole('button', { name: 'Try again' })
    .click();
  await recoveryPage
    .getByRole('heading', { name: 'Your journey begins with the foundations.' })
    .waitFor();
  await recoveryPage
    .locator('.storage-warning')
    .getByRole('button', { name: 'Try again' })
    .click();
  await recoveryPage.locator('.storage-warning').waitFor({ state: 'detached' });
  await recoveryPage.evaluate(() =>
    window.__guitarlabSetDatabaseAvailable(false)
  );
  await recoveryPage.goto(origin + '/skills', { waitUntil: 'networkidle' });
  await recoveryPage
    .getByText(
      'Your local skill map could not be loaded. Check browser storage and try again.',
      { exact: true }
    )
    .waitFor();
  assert.equal(
    await recoveryPage
      .locator('.status.error')
      .getByRole('button', { name: 'Try again' })
      .count(),
    1,
    'The skill map storage error must provide a retry action'
  );
  assert.equal(
    await recoveryPage
      .getByRole('link', { name: 'Browse lessons' })
      .getAttribute('href'),
    '/learn',
    'The skill map storage error must provide a useful next destination'
  );
  await recoveryPage.evaluate(() =>
    window.__guitarlabSetDatabaseAvailable(true)
  );
  await recoveryPage
    .locator('.status.error')
    .getByRole('button', { name: 'Try again' })
    .click();
  await recoveryPage
    .getByText('Showing 34 of 34 skills', { exact: true })
    .waitFor();
  await recoveryPage
    .locator('.storage-warning')
    .getByRole('button', { name: 'Try again' })
    .click();
  await recoveryPage.locator('.storage-warning').waitFor({ state: 'detached' });

  // Practice history and Repertoire recover from a temporary local database outage.
  await recoveryPage.evaluate(() =>
    window.__guitarlabSetDatabaseAvailable(false)
  );
  await recoveryPage.goto(origin + '/practice', {
    waitUntil: 'networkidle'
  });
  const practiceHistoryRecovery = recoveryPage.locator('.recovery-message');
  await practiceHistoryRecovery.waitFor();
  assert.equal(
    await practiceHistoryRecovery
      .getByRole('button', { name: 'Try again' })
      .count(),
    1,
    'Practice history failures must expose an in-place retry'
  );
  assert.equal(
    await practiceHistoryRecovery
      .getByRole('link', { name: 'Return to Today' })
      .getAttribute('href'),
    '/',
    'Practice history failures must provide a useful next destination'
  );
  await recoveryPage.evaluate(() =>
    window.__guitarlabSetDatabaseAvailable(true)
  );
  await practiceHistoryRecovery
    .getByRole('button', { name: 'Try again' })
    .click();
  await practiceHistoryRecovery.waitFor({ state: 'detached' });

  await recoveryPage.evaluate(() =>
    window.__guitarlabSetDatabaseAvailable(false)
  );
  await recoveryPage.goto(origin + '/repertoire', {
    waitUntil: 'networkidle'
  });
  const repertoireRecovery = recoveryPage.locator('.load-error');
  await repertoireRecovery.waitFor();
  assert.equal(
    await repertoireRecovery.getByRole('button', { name: 'Try again' }).count(),
    1,
    'Repertoire load failures must expose an in-place retry'
  );
  assert.equal(
    await repertoireRecovery
      .getByRole('link', { name: 'Return to Today' })
      .getAttribute('href'),
    '/',
    'Repertoire load failures must provide a useful next destination'
  );
  await recoveryPage.evaluate(() =>
    window.__guitarlabSetDatabaseAvailable(true)
  );
  await repertoireRecovery.getByRole('button', { name: 'Try again' }).click();
  await recoveryPage.locator('.workspace').waitFor();
  assert.equal(
    await recoveryPage.locator('.load-error').count(),
    0,
    'A recovered local database must clear the Repertoire load error'
  );
  await recoveryContext.close();

  // Saved theme preferences apply when a learner opens a nested route directly.
  const savedThemeContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  await savedThemeContext.addInitScript(() => {
    window.localStorage.setItem('guitarlab-theme', 'light');
  });
  const savedThemePage = await savedThemeContext.newPage();
  await savedThemePage.goto(origin + '/tools/fretboard', {
    waitUntil: 'networkidle'
  });
  await savedThemePage.waitForFunction(
    () => document.documentElement.dataset.theme === 'light'
  );
  await savedThemeContext.close();

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }
  });
  const page = await context.newPage();
  await context.addInitScript(() => {
    window.__guitarlabGetUserMediaCalls = 0;
    const devices = navigator.mediaDevices;
    if (!devices || typeof devices.getUserMedia !== 'function') return;
    const request = devices.getUserMedia.bind(devices);
    Object.defineProperty(devices, 'getUserMedia', {
      configurable: true,
      value: (...args) => {
        window.__guitarlabGetUserMediaCalls += 1;
        return request(...args);
      }
    });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  // Keyboard users can skip persistent notices and move directly to page content.
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  assert.equal(
    await skipLink.evaluate((element) => element === document.activeElement),
    true,
    'The skip link should be the first keyboard stop'
  );
  await page.keyboard.press('Enter');
  const mainContent = page.locator('main#main-content');
  assert.equal(
    await mainContent.count(),
    1,
    'The skip link target must be one unique main landmark'
  );
  assert.equal(
    await mainContent.evaluate((element) => element === document.activeElement),
    true,
    'The skip link should move focus to the main content landmark'
  );

  // Fresh learner: dashboard, curriculum phases and truthful empty states.
  const response = await page.request.get(origin);
  const securityHeaders = response.headers();
  assert.equal(securityHeaders['x-content-type-options'], 'nosniff');
  assert.equal(
    securityHeaders['referrer-policy'],
    'strict-origin-when-cross-origin'
  );
  assert.equal(securityHeaders['x-frame-options'], 'DENY');
  assert.equal(
    securityHeaders['permissions-policy'],
    'camera=(), microphone=(self), geolocation=()'
  );

  // The Tools hub groups all eight destinations by learner task and avoids repeated availability badges.
  await page.goto(`${origin}/tools`, { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: 'Tools for your practice.' })
    .waitFor();
  assert.equal(await page.locator('.tool-group').count(), 4);
  assert.equal(await page.locator('.tool-row').count(), 8);
  assert.equal(
    await page.locator('.tool-symbol svg[aria-hidden="true"]').count(),
    8,
    'Each tool card must use a decorative accessible SVG icon'
  );
  assert.deepEqual(
    await page
      .locator('.tool-symbol svg')
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-icon'))
      ),
    [
      'fretboard',
      'chord',
      'theory',
      'ear',
      'microphone',
      'metronome',
      'tuner',
      'song'
    ]
  );

  assert.equal(
    await page.getByText('Available now', { exact: true }).count(),
    0
  );
  assert.match(
    await page.locator('.page-heading p').innerText(),
    /The tuner and note recognition use your microphone only after you press Start/
  );

  // Microphone tools explain capture and permission before any Start action.
  await page.goto(`${origin}/tools/tuner`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Find your note.' }).waitFor();
  await page
    .locator('.microphone-permission-note')
    .getByText(/only after you press Start tuner/)
    .waitFor();
  await page.getByRole('button', { name: 'Start tuner' }).waitFor();
  await page.locator('.back-link [data-icon="arrow-left"]').waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarlabGetUserMediaCalls),
    0,
    'Opening the tuner must not request microphone access'
  );
  await page.goto(`${origin}/tools/note-recognition`, {
    waitUntil: 'networkidle'
  });
  await page.getByRole('heading', { name: 'Play the right note.' }).waitFor();
  await page
    .locator('.microphone-permission-note')
    .getByText(/only after you press Start exercise/)
    .waitFor();
  await page.getByRole('button', { name: 'Start exercise' }).waitFor();
  await page.locator('.back-link [data-icon="arrow-left"]').waitFor();
  assert.equal(
    await page.evaluate(() => window.__guitarlabGetUserMediaCalls),
    0,
    'Opening note recognition must not request microphone access'
  );

  await page.goto(origin, { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: 'Your journey begins with the foundations.' })
    .waitFor();
  await page.getByRole('heading', { name: 'Year 1 learning path' }).waitFor();
  assert.equal(
    await page.locator('.phase-card').count(),
    4,
    'Year 1 should show four curriculum phases'
  );
  await page.getByText('No reviews due right now').waitFor();
  await page.getByText('Your first session is still ahead').waitFor();
  await page
    .getByText('A fresh profile has no assumed practice-time preference.')
    .waitFor();
  assert.equal(
    await page.locator('.practice-task').count(),
    0,
    'A fresh profile should choose a duration before receiving a plan'
  );
  assert.equal(
    await page.locator('.storage-warning').count(),
    0,
    'IndexedDB should be available in the browser'
  );

  // Appearance preference persists across a full reload.
  await page
    .getByRole('combobox', { name: 'Appearance' })
    .selectOption('light');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.equal(
    await page.evaluate(() => localStorage.getItem('guitarlab-theme')),
    'light'
  );
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');

  // Learner preferences persist in IndexedDB and feed the dashboard.
  await page
    .getByRole('link', { name: /Learning preferences/ })
    .first()
    .click();
  await page.getByRole('heading', { name: 'Make GuitarLab yours.' }).waitFor();
  assert.equal(
    await page.getByRole('radio', { name: 'Acoustic guitar' }).count(),
    0,
    'Setup should not offer an instrument choice until it changes the learning experience'
  );
  assert.equal(
    await page.getByLabel('Preferred lesson presentation').count(),
    0,
    'Setup should not promise a lesson-presentation effect that is not implemented'
  );
  await page.getByRole('checkbox', { name: 'Acoustic & fingerstyle' }).check();
  await page.getByRole('radio', { name: '20 min' }).check();
  await page.getByRole('button', { name: /Save my preferences/ }).click();
  await page
    .getByRole('status')
    .filter({ hasText: 'saved privately on this device' })
    .waitFor();
  await page.getByRole('link', { name: 'Go to Today' }).click();
  await page.waitForURL((url) => url.pathname === '/');
  assert.match(await page.locator('.practice-number').innerText(), /20/);
  await page.reload({ waitUntil: 'networkidle' });
  assert.match(await page.locator('.practice-number').innerText(), /20/);
  const personalizedReasons = await page
    .locator('.practice-task p')
    .allTextContents();
  assert.ok(
    personalizedReasons.some((reason) =>
      reason.includes('acoustic and fingerstyle playing')
    ),
    'Learner goals should inform musical application recommendations'
  );

  // The planner responds to the selected duration and explains each task.
  await page
    .getByRole('heading', { name: 'A focused plan for today' })
    .waitFor();
  const planner = page.locator('.practice-planner');
  const taskCards = planner.locator('.practice-task');
  assert.ok(
    (await taskCards.count()) > 0,
    'A fresh learner should receive a useful warm-up/lesson plan'
  );
  const reasons = await taskCards.locator('p').allTextContents();
  assert.ok(
    reasons.every((reason) => reason.trim().length > 20),
    'Each suggested task must explain why it is included'
  );

  await planner
    .locator('.duration-controls')
    .getByRole('button', { name: '10 min' })
    .click();
  assert.match(
    await planner.locator('.planner-heading .neutral-tag').innerText(),
    /\/ 10 min planned/
  );
  await planner
    .getByRole('button', { name: 'Review in Practice Studio' })
    .click();
  await page.waitForURL(/\/practice\?minutes=10/);
  await page
    .getByRole('heading', { name: 'Start a practice session' })
    .waitFor();
  assert.equal(await page.locator('#duration').inputValue(), '10');
  assert.equal(
    await page.locator('#duration').getAttribute('min'),
    '5',
    'Practice Studio must use the shared 5–180 minute duration range'
  );
  assert.ok((await page.locator('#focus').inputValue()).length > 0);
  await page.getByText(/No session has started yet/).waitFor();
  assert.equal(
    await page
      .getByRole('heading', { name: 'Your session is in progress' })
      .count(),
    0,
    'The dashboard plan should prefill a session, not silently start it'
  );
  assert.ok(
    await page.locator('#practice-history').count(),
    'Practice history has a stable destination'
  );
  await page.goto(origin, { waitUntil: 'networkidle' });
  const actionLinks = await planner
    .locator('.practice-task .task-action')
    .count();
  assert.ok(
    actionLinks > 0,
    'Every suggested task should expose a useful action'
  );

  // Dismiss and restore suggestions without touching learner progress.
  await planner.getByRole('button', { name: 'Dismiss' }).click();
  assert.equal(await taskCards.count(), 0, 'Dismiss should hide suggestions');
  await planner.getByRole('button', { name: 'Show suggestions' }).click();
  assert.ok(
    (await taskCards.count()) > 0,
    'Dismissed suggestions can be restored'
  );

  // Custom durations are validated and reflected in the plan budget.
  await planner
    .locator('.duration-controls')
    .getByRole('button', { name: 'Custom' })
    .click();
  const customDuration = page.getByLabel('Custom duration (5–180 minutes)');
  await customDuration.fill('15');
  await customDuration.blur();
  assert.equal(
    await planner.locator('.planner-heading .neutral-tag').innerText(),
    '15 / 15 min planned'
  );
  await customDuration.fill('4');
  await customDuration.blur();
  await planner
    .getByText('Enter a whole number from 5 to 180 minutes.')
    .waitFor();
  assert.equal(
    await planner
      .getByRole('button', { name: 'Review in Practice Studio' })
      .isDisabled(),
    true
  );
  await customDuration.fill('15');
  await customDuration.blur();
  assert.equal(
    await planner
      .getByRole('button', { name: 'Review in Practice Studio' })
      .isDisabled(),
    false
  );

  assert.equal(
    await page.locator('.phase-card .phase-action').count(),
    await page.locator('.phase-card').count(),
    'Every phase card should expose a route destination'
  );
  await page.getByRole('link', { name: 'View all sessions' }).click();
  await page
    .getByRole('heading', { name: 'Practice history', exact: true })
    .waitFor();
  await page.goto(origin, { waitUntil: 'networkidle' });

  // Mobile navigation and planner cards remain usable at a narrow viewport.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  const mobileMenuButton = page.getByRole('button', {
    name: 'Toggle navigation'
  });
  await mobileMenuButton.click();
  let mobileNavigation = page.getByRole('navigation', {
    name: 'Mobile navigation'
  });
  const todayLink = mobileNavigation.getByRole('link', { name: 'Today' });
  await todayLink.waitFor();
  assert.equal(
    await todayLink.evaluate((element) => element === document.activeElement),
    true,
    'Opening mobile navigation should focus its first link'
  );
  await page.keyboard.press('Escape');
  await mobileNavigation.waitFor({ state: 'detached' });
  assert.equal(
    await mobileMenuButton.evaluate(
      (element) => element === document.activeElement
    ),
    true,
    'Escape should close mobile navigation and restore focus to its trigger'
  );
  await mobileMenuButton.click();
  mobileNavigation = page.getByRole('navigation', {
    name: 'Mobile navigation'
  });
  await mobileNavigation.getByRole('link', { name: 'Learning path' }).click();
  assert.equal(new URL(page.url()).hash, '#learning-path');
  await page.locator('#learning-path').waitFor();
  assert.ok(
    await page.locator('.practice-task').first().isVisible(),
    'Practice recommendations should remain visible on mobile'
  );

  // M7.2 adaptive recommendation feedback is local, append-only and evidence-aware.
  await page.goto(`${origin}/practice`, { waitUntil: 'networkidle' });
  const adaptiveRecommendation = page
    .locator('.adaptive-list li[data-target-type="skill"]')
    .first();
  await adaptiveRecommendation.waitFor();
  const recommendationId = await adaptiveRecommendation.getAttribute(
    'data-recommendation-id'
  );
  assert.ok(
    recommendationId,
    'A suggested skill needs a stable recommendation ID'
  );

  await adaptiveRecommendation
    .getByRole('button', { name: 'Make it easier' })
    .click();
  await adaptiveRecommendation
    .getByText(/You asked for an easier starting step/)
    .waitFor();

  await page.reload({ waitUntil: 'networkidle' });
  const persistedRecommendation = page.locator(
    `.adaptive-list li[data-recommendation-id="${recommendationId}"]`
  );
  await persistedRecommendation
    .getByText(/You asked for an easier starting step/)
    .waitFor();

  await persistedRecommendation
    .getByRole('button', { name: 'Dismiss' })
    .click();
  await page
    .locator(`.adaptive-list li[data-recommendation-id="${recommendationId}"]`)
    .waitFor({ state: 'detached' });

  const adaptiveFeedbackSnapshot = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('guitarlab-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const learnerId = await new Promise((resolve, reject) => {
      const request = database
        .transaction('metadata')
        .objectStore('metadata')
        .get('activeLearnerId');
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
    const rows = await new Promise((resolve, reject) => {
      const request = database
        .transaction('adaptiveRecommendationFeedback')
        .objectStore('adaptiveRecommendationFeedback')
        .index('byLearnerRelease')
        .getAll([learnerId, 'curriculum-v1.0.6']);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const hasFeedbackStore = database.objectStoreNames.contains(
      'adaptiveRecommendationFeedback'
    );
    database.close();
    return { rows, hasFeedbackStore };
  });
  assert.equal(adaptiveFeedbackSnapshot.hasFeedbackStore, true);
  assert.deepEqual(
    adaptiveFeedbackSnapshot.rows
      .filter((record) => record.recommendationId === recommendationId)
      .map((record) => record.action)
      .sort(),
    ['correct', 'dismiss'],
    'Feedback is persisted as a new record for each learner action'
  );

  // M8 repertoire workspace: create, edit and reload learner-authored song notes.
  await page.goto(`${origin}/repertoire`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Build your repertoire.' }).waitFor();
  await page
    .getByLabel('New song or study project')
    .fill('My Guitar Arrangement');
  await page.getByRole('button', { name: 'Create project' }).click();
  await page.getByRole('heading', { name: 'My Guitar Arrangement' }).waitFor();
  await page.getByRole('button', { name: 'Add section' }).click();
  await page.getByLabel('Section 1 title').fill('Verse');
  await page
    .getByLabel('Your notes')
    .fill('Keep the bass note relaxed and even.');
  await page
    .getByLabel('Bookmark / reference position')
    .fill('Reference at 0:42');
  await page
    .getByLabel('Practice target')
    .fill('Play four clean changes without pausing.');
  await page.getByRole('button', { name: 'Save project' }).click();
  const saveSuccess = page
    .getByRole('status')
    .filter({ hasText: 'Changes saved on this device.' });
  const saveFailure = page.locator('.status.error[role="alert"]');
  await Promise.race([saveSuccess.waitFor(), saveFailure.waitFor()]);
  const saveFailureCount = await saveFailure.count();
  const saveFailureMessage =
    saveFailureCount > 0 ? await saveFailure.first().textContent() : null;
  assert.equal(
    saveFailureCount,
    0,
    saveFailureMessage ?? 'The song project did not save.'
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByLabel('Section 1 title').waitFor();
  assert.equal(await page.getByLabel('Section 1 title').inputValue(), 'Verse');
  assert.equal(
    await page.getByLabel('Bookmark / reference position').inputValue(),
    'Reference at 0:42'
  );
  assert.equal(
    await page.getByLabel('Practice target').inputValue(),
    'Play four clean changes without pausing.'
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin, { waitUntil: 'networkidle' });

  // Active learners see a quiet backup reminder until a recent download is started.
  await page.locator('#backup-reminder').waitFor({ state: 'visible' });

  // Backup navigation and export remain available from the learner dashboard.
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await mobileNavigation.getByRole('link', { name: 'Data & backups' }).click();
  await page
    .getByRole('heading', { name: 'Keep your learning safe.' })
    .waitFor();
  await page
    .getByText('No backup download has been started from this browser yet.')
    .waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download backup/ }).click();
  const download = await downloadPromise;
  await page.getByText(/Last backup download started:/).waitFor();
  await page
    .getByRole('status')
    .filter({
      hasText:
        'Backup download started. Your browser decides where the file is saved.'
    })
    .waitFor();
  assert.match(
    download.suggestedFilename(),
    /^guitarlab-backup-\d{4}-\d{2}-\d{2}\.json$/
  );
  const downloadPath = await download.path();
  assert.ok(
    downloadPath,
    'Backup download should be available to the browser test'
  );
  const backup = JSON.parse(await readFile(downloadPath, 'utf8'));
  assert.equal(
    await page.evaluate(() =>
      Number(localStorage.getItem('guitarlab.last-backup-export-at'))
    ),
    backup.exportedAt,
    'The last-download date matches the exported backup timestamp'
  );
  assert.equal(backup.format, 'guitarlab-learner-backup');
  assert.equal(backup.version, 1);
  assert.equal(backup.records.profile.preferences.practiceMinutes, 20);
  assert.ok(
    Array.isArray(backup.records.adaptiveRecommendationFeedback),
    'Learner backups include the feedback history collection'
  );
  assert.ok(
    Array.isArray(backup.records.songProjects),
    'Learner backups include the local repertoire collection'
  );
  assert.deepEqual(
    backup.records.songProjects
      .filter((project) => project.title === 'My Guitar Arrangement')
      .map((project) => ({
        section: project.sections[0]?.title,
        bookmark: project.sections[0]?.bookmark,
        practiceTarget: project.sections[0]?.practiceTarget
      })),
    [
      {
        section: 'Verse',
        bookmark: 'Reference at 0:42',
        practiceTarget: 'Play four clean changes without pausing.'
      }
    ],
    'Backup retains learner-authored song section notes and practice targets'
  );
  assert.deepEqual(
    backup.records.adaptiveRecommendationFeedback
      .filter((record) => record.recommendationId === recommendationId)
      .map((record) => record.action)
      .sort(),
    ['correct', 'dismiss'],
    "Export retains the learner's append-only feedback history"
  );

  // A recent download removes the reminder from Today without changing learner data.
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => document.querySelector('#backup-reminder') === null
  );
  await page.goto(origin + '/settings/data', { waitUntil: 'networkidle' });

  // Invalid JSON and unsupported backup versions must be rejected without preview.
  const backupInput = page.locator('input[type="file"]');
  await backupInput.setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{')
  });
  await page
    .getByRole('alert')
    .filter({ hasText: 'The selected file is not valid JSON.' })
    .waitFor();

  await backupInput.setInputFiles({
    name: 'unsupported-version.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...backup, version: 99 }))
  });
  const unsupportedBackupMessage = page.locator('.status-message');
  await unsupportedBackupMessage.waitFor({ state: 'visible' });
  assert.match(
    await unsupportedBackupMessage.innerText(),
    /version/i,
    'Unsupported backup versions should have an actionable validation message'
  );
  assert.equal(
    await page.getByRole('heading', { name: 'Restore preview' }).count(),
    0,
    'Invalid backups must not display a restore confirmation'
  );

  // Change the profile after export so rollback and restore have observable outcomes.
  await page.goto(`${origin}/onboarding`, { waitUntil: 'networkidle' });
  await page.getByRole('radio', { name: '40 min' }).check();
  await page.getByRole('button', { name: /Save my preferences/ }).click();
  await page
    .getByRole('status')
    .filter({ hasText: 'saved privately on this device' })
    .waitFor();

  // Force a unique IndexedDB index violation after the restore transaction has begun.
  // The whole replacement must roll back, leaving the current 40-minute profile intact.
  const rollbackProbe = {
    learnerId: backup.learnerId,
    curriculumReleaseId: 'curriculum-v1',
    lessonId: 'restore-transaction-rollback-probe',
    status: 'in_progress',
    lastBlockId: null,
    startedAt: Date.now(),
    completedAt: null,
    updatedAt: Date.now()
  };
  const rollbackBackup = {
    ...backup,
    records: {
      ...backup.records,
      lessonProgress: [
        {
          ...rollbackProbe,
          id: '11111111-1111-4111-8111-111111111111'
        },
        {
          ...rollbackProbe,
          id: '22222222-2222-4222-8222-222222222222'
        }
      ]
    }
  };
  await page.goto(`${origin}/settings/data`, { waitUntil: 'networkidle' });
  await page.locator('input[type="file"]').setInputFiles({
    name: 'transaction-rollback.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(rollbackBackup))
  });
  await page.getByRole('heading', { name: 'Restore preview' }).waitFor();
  const restoreButton = page.getByRole('button', {
    name: 'Restore this backup'
  });
  assert.equal(
    await restoreButton.isDisabled(),
    true,
    'Restore must remain disabled until the learner confirms replacement'
  );
  await page.locator('.confirm-choice input').check();
  await restoreButton.click();
  await page
    .getByRole('alert')
    .filter({
      hasText:
        'Restore failed. The database transaction was rolled back and the existing learner data was preserved.'
    })
    .waitFor();

  await page.goto(`${origin}/onboarding`, { waitUntil: 'networkidle' });
  assert.equal(
    await page.getByRole('radio', { name: '40 min' }).isChecked(),
    true,
    'A failed restore must preserve the existing learner profile'
  );

  // Reset is gated by both the typed phrase and the browser confirmation dialog.
  await page.goto(`${origin}/settings/data`, { waitUntil: 'networkidle' });
  const resetInput = page.locator('#reset-confirm');
  const resetButton = page.getByRole('button', {
    name: 'Reset active learner data'
  });
  assert.equal(await resetButton.isDisabled(), true);
  await resetInput.fill('RESET');
  await resetButton.scrollIntoViewIfNeeded();
  let cancelledDialogMessage = '';
  page.once('dialog', async (dialog) => {
    cancelledDialogMessage = dialog.message();
    await dialog.dismiss();
  });
  await resetButton.click();
  assert.match(cancelledDialogMessage, /Reset GuitarLab learner data/);

  await page.goto(`${origin}/onboarding`, { waitUntil: 'networkidle' });
  assert.equal(
    await page.getByRole('radio', { name: '40 min' }).isChecked(),
    true,
    'Dismissing the reset confirmation must preserve learner data'
  );

  await page.goto(`${origin}/settings/data`, { waitUntil: 'networkidle' });
  await page.locator('#reset-confirm').fill('RESET');
  await resetButton.scrollIntoViewIfNeeded();
  let acceptedDialogMessage = '';
  page.once('dialog', async (dialog) => {
    acceptedDialogMessage = dialog.message();
    await dialog.accept();
  });
  await page.evaluate(() =>
    localStorage.setItem('guitarlab.last-backup-export-at', String(Date.now()))
  );
  await page.getByRole('button', { name: 'Reset active learner data' }).click();
  assert.match(acceptedDialogMessage, /Reset GuitarLab learner data/);
  await page
    .getByRole('status')
    .filter({
      hasText:
        'Your active learner data has been reset. A fresh empty profile is ready.'
    })
    .waitFor();
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem('guitarlab.last-backup-export-at')
    ),
    null,
    'A successful reset clears the previous backup date'
  );
  const feedbackAfterReset = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('guitarlab-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const learnerId = await new Promise((resolve, reject) => {
      const request = database
        .transaction('metadata')
        .objectStore('metadata')
        .get('activeLearnerId');
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
    const rows = await new Promise((resolve, reject) => {
      const request = database
        .transaction('adaptiveRecommendationFeedback')
        .objectStore('adaptiveRecommendationFeedback')
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const songProjects = await new Promise((resolve, reject) => {
      const request = database
        .transaction('songProjects')
        .objectStore('songProjects')
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return {
      feedback: rows.filter((record) => record.learnerId === learnerId),
      songProjects: songProjects.filter(
        (record) => record.learnerId === learnerId
      )
    };
  });
  assert.deepEqual(
    feedbackAfterReset.feedback,
    [],
    'Reset removes feedback owned by the active learner'
  );
  assert.deepEqual(
    feedbackAfterReset.songProjects,
    [],
    'Reset removes song projects owned by the active learner'
  );

  // Restore the downloaded backup into a new, empty learner profile.
  await page.goto(`${origin}/onboarding`, { waitUntil: 'networkidle' });
  assert.equal(
    await page.getByRole('radio', { name: '20 min' }).isChecked(),
    false,
    'Reset should create a fresh profile with no assumed practice duration'
  );
  await page.goto(`${origin}/settings/data`, { waitUntil: 'networkidle' });
  await page.evaluate(() =>
    localStorage.setItem('guitarlab.last-backup-export-at', String(Date.now()))
  );
  await page.locator('input[type="file"]').setInputFiles(downloadPath);
  await page.getByRole('heading', { name: 'Restore preview' }).waitFor();
  await page
    .getByText(
      'This backup belongs to a different learner profile and will replace the active profile.'
    )
    .waitFor();
  await page.locator('.confirm-choice input').check();
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await page
    .getByRole('status')
    .filter({
      hasText:
        'Restore completed. Your learner profile and local learning records have been replaced.'
    })
    .waitFor();
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem('guitarlab.last-backup-export-at')
    ),
    null,
    'A successful restore clears the previous backup date for the replaced profile'
  );

  await page.goto(`${origin}/onboarding`, { waitUntil: 'networkidle' });
  assert.equal(
    await page.getByRole('radio', { name: '20 min' }).isChecked(),
    true,
    'Restoring the exported backup into a clean profile should recover preferences'
  );
  assert.equal(
    await page
      .getByRole('checkbox', { name: 'Acoustic & fingerstyle' })
      .isChecked(),
    true,
    'Restoring the exported backup should recover the learner goals'
  );
  const restoredFeedback = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('guitarlab-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const learnerId = await new Promise((resolve, reject) => {
      const request = database
        .transaction('metadata')
        .objectStore('metadata')
        .get('activeLearnerId');
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
    const rows = await new Promise((resolve, reject) => {
      const request = database
        .transaction('adaptiveRecommendationFeedback')
        .objectStore('adaptiveRecommendationFeedback')
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return rows.filter((record) => record.learnerId === learnerId);
  });
  assert.deepEqual(
    restoredFeedback
      .filter((record) => record.recommendationId === recommendationId)
      .map((record) => record.action)
      .sort(),
    ['correct', 'dismiss'],
    "Restore reinstates the learner's full adaptive recommendation feedback history"
  );

  // M6.1 fretboard explorer: navigation, note mapping, find mode and handedness.

  // Global navigation: keyboard open, active-section semantics, Escape and route focus.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/tools`, { waitUntil: 'networkidle' });
  const globalMenuButton = page.locator('.mobile-nav-trigger');
  const globalMobileNavigation = page.locator('#mobile-primary-navigation');
  assert.equal(
    await globalMenuButton.getAttribute('aria-expanded'),
    'false',
    'The global menu should start collapsed.'
  );
  assert.equal(
    await globalMenuButton.getAttribute('aria-controls'),
    'mobile-primary-navigation'
  );
  assert.equal(
    await globalMobileNavigation.count(),
    1,
    'The controlled mobile navigation target should remain in the DOM while closed.'
  );
  assert.equal(
    await globalMobileNavigation.isHidden(),
    true,
    'The collapsed mobile navigation target should be hidden from interaction.'
  );
  const globalMenuButtonHeight = await globalMenuButton.evaluate(
    (button) => button.getBoundingClientRect().height
  );
  assert.ok(
    globalMenuButtonHeight >= 44,
    'The global menu trigger should meet the 44px touch target.'
  );
  await globalMenuButton.focus();
  await page.keyboard.press('Enter');
  await globalMobileNavigation.waitFor();
  const globalTodayLink = globalMobileNavigation.getByRole('link', {
    name: 'Today'
  });
  assert.equal(
    await globalTodayLink.evaluate((link) => document.activeElement === link),
    true,
    'Opening the global menu should move focus to its first link.'
  );
  assert.equal(
    await globalMobileNavigation
      .getByRole('link', { name: 'Tools' })
      .getAttribute('aria-current'),
    'page',
    'The current global section should be announced in the mobile menu.'
  );
  await page.keyboard.press('Escape');
  await globalMobileNavigation.waitFor({ state: 'hidden' });
  assert.equal(
    await globalMenuButton.getAttribute('aria-expanded'),
    'false',
    'Escape should collapse the global navigation.'
  );
  assert.equal(
    await globalMenuButton.evaluate(
      (button) => document.activeElement === button
    ),
    true,
    'Escape should return focus to the global menu trigger.'
  );
  await globalMenuButton.focus();
  await page.keyboard.press('Enter');
  await globalMobileNavigation.waitFor();
  await globalMobileNavigation.getByRole('link', { name: 'Practice' }).click();
  await page.waitForURL((url) => url.pathname === '/practice');
  await page.waitForFunction(
    () => document.activeElement?.id === 'main-content'
  );
  await globalMobileNavigation.waitFor({ state: 'hidden' });

  // Restore the desktop viewport after the earlier mobile navigation acceptance.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Tools', exact: true }).click();
  await page
    .getByRole('heading', { name: 'Tools for your practice.' })
    .waitFor();
  await page.getByRole('link', { name: /Open fretboard explorer/ }).click();
  await page.getByRole('heading', { name: 'Fretboard explorer.' }).waitFor();
  assert.equal(
    await page.locator('.fret-cell').count(),
    78,
    'The 12-fret explorer should show six strings and thirteen positions per string'
  );
  const highEOpen = page.getByRole('button', {
    name: 'String 1, fret 0, E4'
  });
  await highEOpen.focus();
  await highEOpen.press('ArrowRight');
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('aria-label')
    ),
    'String 1, fret 1, F4',
    'Arrow-key navigation should move one fret while preserving the string'
  );
  await page.getByRole('button', { name: 'String 6, fret 8, C3' }).click();
  await page.locator('.note-detail').getByText('C3', { exact: true }).waitFor();

  await page.getByRole('button', { name: 'Find a note' }).click();
  await page.locator('#target-note').selectOption('0');
  assert.equal(
    await page.locator('.fret-cell > span:not(.visually-hidden)').count(),
    0,
    'Find mode must hide every note label before the learner answers'
  );
  await page
    .getByRole('button', { name: 'String 6, fret 0, position' })
    .click();
  assert.equal(
    await page.locator('.fret-cell.is-target').count(),
    0,
    'An incorrect answer must not reveal any matching note positions'
  );
  await page.getByRole('status').filter({ hasText: 'Not quite.' }).waitFor();
  await page
    .getByRole('button', { name: 'String 6, fret 8, position' })
    .click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Correct — C is at string 6, fret 8.' })
    .waitFor();
  assert.equal(
    await page.locator('.fret-cell > span:not(.visually-hidden)').count(),
    1,
    'Only the correctly selected answer should reveal its note label'
  );

  await page.locator('.controls select').nth(0).selectOption('left');
  const leftHandedOpenString = page.locator(
    '.fret-cell[data-string="6"][data-fret="0"]'
  );
  assert.equal(
    await leftHandedOpenString.getAttribute('data-display-column'),
    '13',
    'Left-handed orientation should mirror the nut to the opposite side'
  );
  await page
    .getByRole('button', { name: 'Save this orientation to my profile' })
    .click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Saved left-handed diagram orientation' })
    .waitFor();

  // Shared harmony overlays resolve scale degrees and chord tones on the fretboard.
  await page.locator('#harmony-layer').selectOption('c-major-scale');
  const scaleHighlightCount = await page
    .locator('.fret-cell.is-harmony-note')
    .count();
  assert.ok(
    scaleHighlightCount > 0,
    'C-major scale should highlight fretboard positions'
  );
  await page.locator('#harmony-layer').selectOption('c-major-triad');
  const triadHighlightCount = await page
    .locator('.fret-cell.is-harmony-note')
    .count();
  assert.ok(
    triadHighlightCount > 0 && triadHighlightCount < scaleHighlightCount,
    'A triad overlay should highlight fewer positions than its parent scale'
  );
  await page.locator('#harmony-layer').selectOption('c-major-first-inversion');
  assert.ok(
    (await page.locator('.fret-cell.is-harmony-note').count()) > 0,
    'First inversion should resolve to fretboard positions'
  );
  await page.locator('#harmony-layer').selectOption('c-major-second-inversion');
  assert.ok(
    (await page.locator('.fret-cell.is-harmony-note').count()) > 0,
    'Second inversion should resolve to fretboard positions'
  );
  await page.locator('#harmony-layer').selectOption('caged');
  assert.equal(await page.locator('.caged-shape').count(), 5);
  await page.getByText('xx10121312', { exact: true }).waitFor();

  const fretboardMobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const fretboardMobilePage = await fretboardMobileContext.newPage();
  await fretboardMobilePage.goto(`${origin}/tools/fretboard`, {
    waitUntil: 'networkidle'
  });
  await fretboardMobilePage
    .getByRole('heading', { name: 'Fretboard explorer.' })
    .waitFor();
  const fretboardMobileLayout = await fretboardMobilePage.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  assert.ok(
    fretboardMobileLayout.content <= fretboardMobileLayout.viewport,
    `Mobile fretboard page overflows horizontally: ${JSON.stringify(fretboardMobileLayout)}`
  );
  await fretboardMobileContext.close();

  // M7.2 Practice Studio: start, pause, resume, reload recovery and active-time save.
  await page.goto(`${origin}/practice`, { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: 'Start a practice session' })
    .waitFor();
  await page.locator('#duration').fill('5');
  await page
    .locator('#authored-exercise')
    .selectOption('y1-w01-lesson::y1-w01-lesson-focus');
  await page.locator('#focus').fill('Browser acceptance scale drill');
  await page.getByRole('button', { name: 'Start practice' }).click();
  try {
    await page
      .getByRole('heading', {
        name: 'Browser acceptance scale drill',
        exact: true
      })
      .waitFor({ timeout: 10_000 });
  } catch {
    const startFailure = await page.getByRole('alert').allTextContents();
    throw new Error(
      'Practice session did not start. Visible validation: ' +
        startFailure.join(' | ')
    );
  }
  const authoredSessionLabel = await page
    .locator('.authored-session-link')
    .innerText();
  assert.equal(
    await page.locator('.principle').count(),
    1,
    'Practice Studio should keep one clear explanation of how time and observations relate to mastery.'
  );
  assert.equal(
    await page.locator('.adaptive-footnote').count(),
    0,
    'Recommendation panels should not repeat the page-level mastery explanation.'
  );
  assert.doesNotMatch(
    await page.locator('.quick-log').innerText(),
    /mastery|accuracy score|grade/i,
    'Quick logging should give a brief action hint instead of repeating the mastery disclaimer.'
  );
  assert.doesNotMatch(
    await page.locator('.exercise-log > .muted').innerText(),
    /mastery|accuracy score/i,
    'The detailed observation form should describe its fields without repeating the mastery disclaimer.'
  );
  const quickLogVisualHierarchy = await page.evaluate(() => {
    const clean = getComputedStyle(document.querySelector('.quick-log-clean'));
    const correction = getComputedStyle(
      document.querySelector('.quick-log-correction')
    );
    return {
      cleanBackground: clean.backgroundColor,
      correctionBackground: correction.backgroundColor,
      correctionWeight: correction.fontWeight
    };
  });
  assert.notEqual(
    quickLogVisualHierarchy.cleanBackground,
    quickLogVisualHierarchy.correctionBackground,
    'The correction action should remain available but look secondary to the positive quick-log action.'
  );
  assert.equal(quickLogVisualHierarchy.correctionWeight, '600');
  console.log('Practice session authored link:', authoredSessionLabel);
  assert.match(
    authoredSessionLabel,
    /Linked exercise: Meet your guitar.*Focused skill drill/
  );

  // Reject impossible learner-entered counts before any observation is saved.
  await page.locator('#exercise-name').fill('G major scale');
  await page.locator('#repetitions').fill('8');
  await page.locator('#clean-repetitions').fill('9');
  await page.getByRole('button', { name: 'Save exercise observation' }).click();
  await page
    .getByRole('alert')
    .filter({ hasText: 'Clean repetitions cannot exceed total repetitions.' })
    .waitFor();

  await page.locator('#clean-repetitions').fill('6');
  await page.locator('#tempo-bpm').fill('72');
  await page.locator('#exercise-difficulty').fill('3');
  await page.getByRole('button', { name: 'Save exercise observation' }).click();
  await page
    .locator('.active-evidence-list')
    .getByText('G major scale', { exact: true })
    .waitFor();
  const authoredObservationLink = page.locator(
    '.active-evidence-list .authored-observation-link'
  );
  await authoredObservationLink.waitFor();
  assert.match(
    await authoredObservationLink.innerText(),
    /y1-w01-lesson[\s\S]*y1-w01-lesson-focus[\s\S]*curriculum-v1\.0\.6[\s\S]*0\.3\.0/
  );
  await delay(1_200);
  await page.getByRole('button', { name: 'Pause session' }).click();
  await page.getByRole('heading', { name: 'Your session is paused' }).waitFor();
  const pausedElapsed = await page.locator('.elapsed').innerText();
  await delay(1_200);
  assert.equal(
    await page.locator('.elapsed').innerText(),
    pausedElapsed,
    'Paused time must not increase active time'
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Your session is paused' }).waitFor();
  await page
    .locator('.active-evidence-list')
    .getByText('G major scale', { exact: true })
    .waitFor();
  const reloadedAuthoredObservationLink = page.locator(
    '.active-evidence-list .authored-observation-link'
  );
  await reloadedAuthoredObservationLink.waitFor();
  assert.match(
    await reloadedAuthoredObservationLink.innerText(),
    /y1-w01-lesson[\s\S]*y1-w01-lesson-focus[\s\S]*curriculum-v1\.0\.6[\s\S]*0\.3\.0/
  );
  const authoredExposure = page
    .locator('details.adaptive-analytics')
    .filter({ hasText: 'Authored exercise exposure coverage' });
  await authoredExposure.locator('summary').click();
  await authoredExposure
    .getByText('Standard tuning', { exact: false })
    .waitFor();
  await authoredExposure
    .getByText('1 of 1 tagged exercises observed', { exact: false })
    .waitFor();
  assert.equal(
    await page.locator('.elapsed').innerText(),
    pausedElapsed,
    'Paused state and time must survive reload'
  );
  await page.getByRole('button', { name: 'Resume session' }).click();
  await page
    .getByRole('heading', {
      name: 'Browser acceptance scale drill',
      exact: true
    })
    .waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .getByRole('heading', {
      name: 'Browser acceptance scale drill',
      exact: true
    })
    .waitFor();
  await page.getByText('Browser acceptance scale drill').first().waitFor();
  await delay(1_200);
  await page
    .locator('#session-reflection')
    .fill('The scale felt steadier when I kept my wrist relaxed.');
  await page
    .locator('#next-target')
    .fill('Repeat the G major scale at 72 BPM for three minutes.');
  await page.getByRole('button', { name: 'Finish and save session' }).click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Elapsed session time is activity history' })
    .waitFor();
  await page.getByText('completed', { exact: true }).waitFor();
  await page
    .getByText('The scale felt steadier when I kept my wrist relaxed.')
    .waitFor();
  await page
    .getByText('Repeat the G major scale at 72 BPM for three minutes.')
    .waitFor();

  // Screen wake lock follows the active-session lifecycle, including visibility.
  const wakeLockContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  await wakeLockContext.addInitScript(() => {
    window.__wakeLockState = {
      requests: 0,
      releases: 0,
      lastType: '',
      visibility: 'visible'
    };
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get() {
        return window.__wakeLockState.visibility;
      }
    });
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        async request(type) {
          window.__wakeLockState.requests += 1;
          window.__wakeLockState.lastType = type;
          let released = false;
          const listeners = [];
          return {
            get released() {
              return released;
            },
            async release() {
              if (released) return;
              released = true;
              window.__wakeLockState.releases += 1;
              for (const listener of listeners) listener();
            },
            addEventListener(eventType, listener) {
              if (eventType === 'release') listeners.push(listener);
            }
          };
        }
      }
    });
  });
  const wakeLockPage = await wakeLockContext.newPage();
  await wakeLockPage.goto(`${origin}/practice`, { waitUntil: 'networkidle' });
  await wakeLockPage.locator('#duration').fill('5');
  await wakeLockPage.locator('#focus').fill('Wake lock lifecycle test');
  await wakeLockPage.getByRole('button', { name: 'Start practice' }).click();
  await wakeLockPage
    .getByRole('heading', { name: 'Wake lock lifecycle test', exact: true })
    .waitFor();
  await wakeLockPage.waitForFunction(
    () => window.__wakeLockState.requests === 1
  );
  assert.equal(
    await wakeLockPage
      .locator('#session-heading')
      .evaluate((heading) => document.activeElement === heading),
    true,
    'Starting a session should move focus to its active heading.'
  );
  assert.equal(
    await wakeLockPage.evaluate(() => window.__wakeLockState.lastType),
    'screen',
    'An active practice session should request a screen wake lock.'
  );

  await wakeLockPage.getByRole('button', { name: 'Pause session' }).click();
  await wakeLockPage
    .getByRole('heading', { name: 'Your session is paused' })
    .waitFor();
  assert.equal(
    await wakeLockPage
      .locator('#session-heading')
      .evaluate((heading) => document.activeElement === heading),
    true,
    'Pausing a session should keep focus on the current session heading.'
  );
  await wakeLockPage.waitForFunction(
    () => window.__wakeLockState.releases === 1
  );

  await wakeLockPage.getByRole('button', { name: 'Resume session' }).click();
  await wakeLockPage
    .getByRole('heading', { name: 'Wake lock lifecycle test', exact: true })
    .waitFor();
  assert.equal(
    await wakeLockPage
      .locator('#session-heading')
      .evaluate((heading) => document.activeElement === heading),
    true,
    'Resuming a session should move focus back to its active heading.'
  );
  await wakeLockPage.waitForFunction(
    () => window.__wakeLockState.requests === 2
  );

  await wakeLockPage.evaluate(() => {
    window.__wakeLockState.visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await wakeLockPage.waitForFunction(
    () => window.__wakeLockState.releases === 2
  );
  await wakeLockPage.evaluate(() => {
    window.__wakeLockState.visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await wakeLockPage.waitForFunction(
    () => window.__wakeLockState.requests === 3
  );
  // Session storage intentionally rejects sessions shorter than one second.
  await wakeLockPage.waitForTimeout(1100);

  await wakeLockPage
    .getByRole('button', { name: 'Finish and save session' })
    .click();
  const finishNotice = wakeLockPage.locator('.message[role="status"]');
  const finishError = wakeLockPage.getByRole('alert');
  await Promise.race([
    finishNotice.filter({ hasText: /^Session saved\./ }).waitFor(),
    finishError.waitFor()
  ]);
  assert.equal(
    await finishError.count(),
    0,
    'Wake-lock cleanup must not prevent session completion: ' +
      (await finishError.allTextContents()).join(' | ')
  );
  assert.match(await finishNotice.innerText(), /^Session saved\./);
  assert.equal(
    await finishNotice.evaluate((notice) => document.activeElement === notice),
    true,
    'Finishing a session should move focus to the save confirmation.'
  );
  await wakeLockPage.waitForFunction(
    () => window.__wakeLockState.releases === 3
  );
  await wakeLockContext.close();

  // Practice history filters search only learner-authored focus and notes.
  const historySearch = page.locator('#history-search');
  await historySearch.fill('Browser acceptance scale drill');
  await page
    .getByText('Browser acceptance scale drill', { exact: true })
    .waitFor();
  await historySearch.fill('wrist relaxed');
  await page
    .getByText('The scale felt steadier when I kept my wrist relaxed.')
    .waitFor();
  await historySearch.fill('Repeat the G major scale');
  await page
    .getByText('Repeat the G major scale at 72 BPM for three minutes.')
    .waitFor();
  await historySearch.fill('no matching session text');
  await page
    .getByRole('heading', { name: 'No sessions match these filters.' })
    .waitFor();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.locator('#history-status').selectOption('paused');
  await page
    .getByRole('heading', { name: 'No sessions match these filters.' })
    .waitFor();
  await page.locator('#history-status').selectOption('completed');
  await page.locator('#history-date-range').selectOption('7');
  await page
    .getByText('Browser acceptance scale drill', { exact: true })
    .waitFor();
  await page.locator('#history-date-range').selectOption('30');
  await page
    .getByText('Browser acceptance scale drill', { exact: true })
    .waitFor();
  await page.locator('#history-date-range').selectOption('90');
  await page
    .getByText('Browser acceptance scale drill', { exact: true })
    .waitFor();
  await page.locator('#history-date-range').selectOption('all');

  await page
    .getByRole('button', { name: 'Show exercise observations' })
    .first()
    .click();
  await page
    .locator('.history-evidence')
    .getByText('G major scale', { exact: true })
    .waitFor();
  await page.getByText(/\d+ sec/).waitFor();

  // Two tabs share the same IndexedDB database. Concurrent starts must
  // serialize so exactly one tab can create the learner's active session.
  const competingPage = await page.context().newPage();
  await Promise.all([
    page.goto(`${origin}/practice`, { waitUntil: 'networkidle' }),
    competingPage.goto(`${origin}/practice`, { waitUntil: 'networkidle' })
  ]);
  await Promise.all([
    page.getByRole('heading', { name: 'Start a practice session' }).waitFor(),
    competingPage
      .getByRole('heading', { name: 'Start a practice session' })
      .waitFor()
  ]);
  await Promise.all([
    page.locator('#duration').fill('5'),
    competingPage.locator('#duration').fill('5')
  ]);
  await Promise.all([
    page.locator('#focus').fill('Concurrent tab A'),
    competingPage.locator('#focus').fill('Concurrent tab B')
  ]);
  await Promise.all([
    page.getByRole('button', { name: 'Start practice' }).click(),
    competingPage.getByRole('button', { name: 'Start practice' }).click()
  ]);
  const activeTabResults = await Promise.all([
    page
      .getByRole('heading', { name: 'Concurrent tab A', exact: true })
      .waitFor({ timeout: 5_000 })
      .then(() => 'A')
      .catch(() => false),
    competingPage
      .getByRole('heading', { name: 'Concurrent tab B', exact: true })
      .waitFor({ timeout: 5_000 })
      .then(() => 'B')
      .catch(() => false)
  ]);
  assert.equal(
    activeTabResults.filter(Boolean).length,
    1,
    'Exactly one tab may start an active practice session'
  );
  await Promise.all([
    page.reload({ waitUntil: 'networkidle' }),
    competingPage.reload({ waitUntil: 'networkidle' })
  ]);
  await Promise.all([
    page.getByRole('heading', { name: /Concurrent tab [AB]/ }).waitFor(),
    competingPage
      .getByRole('heading', { name: /Concurrent tab [AB]/ })
      .waitFor()
  ]);
  await competingPage.close();

  // M7 skill-state transparency: explanations and learner corrections persist locally.
  const skillFixture = await page.evaluate(
    async ({
      activeCurriculumReleaseId,
      alternatePickingSkillId,
      chordTransitionsSkillId
    }) => {
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open('guitarlab-local');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const active = await new Promise((resolve, reject) => {
        const request = database
          .transaction('metadata')
          .objectStore('metadata')
          .get('activeLearnerId');
        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
      });
      const now = Date.now();
      const passedAttemptId = 'aaaaaaaa-1111-4111-8111-111111111111';
      const transaction = database.transaction(
        ['assessmentAttempts', 'skillMastery'],
        'readwrite'
      );
      transaction.objectStore('assessmentAttempts').add({
        id: passedAttemptId,
        learnerId: active,
        curriculumReleaseId: activeCurriculumReleaseId,
        skillId: alternatePickingSkillId,
        lessonId: null,
        assessmentKind: 'guided_self_check',
        evidenceType: 'observed_or_self_checked',
        outcome: 'passed',
        score: 85,
        evidenceSummary: 'Consistent alternate picking at target tempo.',
        evidence: {},
        assessedAt: now,
        recordedAt: now
      });
      transaction.objectStore('skillMastery').put({
        learnerId: active,
        curriculumReleaseId: activeCurriculumReleaseId,
        skillId: alternatePickingSkillId,
        state: 'stable',
        evidenceCount: 1,
        confidence: 85,
        lastAssessmentId: passedAttemptId,
        lastAssessedAt: now,
        nextReviewAt: now + 86400000,
        decisionSource: 'evidence',
        correctionNote: null,
        updatedAt: now
      });
      transaction.objectStore('skillMastery').put({
        learnerId: active,
        curriculumReleaseId: activeCurriculumReleaseId,
        skillId: chordTransitionsSkillId,
        state: 'not_started',
        evidenceCount: 0,
        confidence: null,
        lastAssessmentId: null,
        lastAssessedAt: null,
        nextReviewAt: null,
        decisionSource: 'evidence',
        correctionNote: null,
        updatedAt: now
      });
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      database.close();
      return { active };
    },
    {
      activeCurriculumReleaseId,
      alternatePickingSkillId,
      chordTransitionsSkillId
    }
  );
  assert.ok(
    skillFixture.active,
    'The skill-state fixture needs an active learner'
  );
  await page.goto(`${origin}/skills`, { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: 'See the skills behind the music.' })
    .waitFor();
  await page.getByText('Showing 34 of 34 skills', { exact: true }).waitFor();
  await page.getByLabel('Find a skill').fill('chord transition');
  await page.getByText('Showing 1 of 34 skills', { exact: true }).waitFor();
  const chordTransitionChoice = page.getByRole('button', {
    name: /Chord transitions/i
  });
  await chordTransitionChoice.waitFor();
  await chordTransitionChoice.click();
  await page
    .getByText(/No assessment has been recorded for this skill yet/)
    .waitFor();
  await page.getByLabel('Find a skill').fill('');
  await page.locator('#corrected-state').selectOption('stable');
  await page
    .locator('#correction-note')
    .fill('I feel confident, but this is not assessed.');
  await page.getByRole('button', { name: 'Save correction' }).click();
  const stableGuardAlert = page.getByRole('alert');
  await stableGuardAlert.waitFor();
  const stableGuardMessage = await stableGuardAlert.textContent();
  assert.match(
    stableGuardMessage ?? '',
    /Stable mastery requires the latest assessment/,
    `Expected the stable-mastery safety message, received: ${stableGuardMessage}`
  );
  await page.locator('#corrected-state').selectOption('practising');
  await page
    .locator('#correction-note')
    .fill(
      'I can change between these chords slowly, but not reliably at tempo.'
    );
  await page.getByRole('button', { name: 'Save correction' }).click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Your correction has been saved on this device.' })
    .waitFor();
  const correctedSnapshot = await page.evaluate(
    async ({ activeCurriculumReleaseId, chordTransitionsSkillId }) => {
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open('guitarlab-local');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const learnerId = await new Promise((resolve, reject) => {
        const request = database
          .transaction('metadata')
          .objectStore('metadata')
          .get('activeLearnerId');
        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
      });
      const row = await new Promise((resolve, reject) => {
        const request = database
          .transaction('skillMastery')
          .objectStore('skillMastery')
          .get([learnerId, activeCurriculumReleaseId, chordTransitionsSkillId]);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      database.close();
      return row;
    },
    { activeCurriculumReleaseId, chordTransitionsSkillId }
  );
  assert.equal(correctedSnapshot.state, 'practising');
  assert.equal(correctedSnapshot.decisionSource, 'learner');
  assert.equal(
    correctedSnapshot.correctionNote,
    'I can change between these chords slowly, but not reliably at tempo.'
  );
  await page.getByRole('button', { name: 'Alternate Picking' }).click();
  await page.getByText('The latest assessment was passed.').waitFor();

  assert.deepEqual(
    pageErrors,
    [],
    `Browser runtime errors: ${pageErrors.join('; ')}`
  );
  console.log(
    'Browser acceptance passed: learner preferences, practice evidence validation/persistence, reflection/next target, music tools and zero uncaught page errors.'
  );
} catch (error) {
  console.error(error);
  console.error('Wrangler preview output:\n' + serverOutput);
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
