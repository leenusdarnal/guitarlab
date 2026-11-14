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
      database.version === 5 &&
      database
        .transaction('practiceSessions')
        .objectStore('practiceSessions')
        .indexNames.contains('byLearnerStatusStartedAt') &&
      database
        .transaction('practiceSessions')
        .objectStore('practiceSessions')
        .indexNames.contains('byLearnerStatus') &&
      database.objectStoreNames.contains('practiceEvidence') &&
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
        practiceEvidence.indexNames.contains('byLearnerId')
    };
    database.close();
    return result;
  });
  assert.equal(
    upgradeResult.version,
    5,
    'The existing v1 database should upgrade to v5'
  );
  assert.equal(upgradeResult.activeLearnerId, 'legacy-learner-001');
  assert.equal(upgradeResult.practiceMinutes, 20);
  assert.equal(upgradeResult.instrument, 'acoustic');
  assert.equal(upgradeResult.migratedSessionId, 'legacy-session-001');
  assert.equal(upgradeResult.sessionIndex, true);
  assert.equal(upgradeResult.learnerStatusIndex, true);
  assert.equal(upgradeResult.assessmentReleaseIndex, true);
  assert.equal(upgradeResult.practiceEvidenceLearnerIndex, true);
  assert.deepEqual(upgradeResult.stores.sort(), [
    'assessmentAttempts',
    'learnerProfiles',
    'lessonCompletionEvents',
    'lessonProgress',
    'metadata',
    'practiceEvidence',
    'practiceSessions',
    'skillMastery'
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
    .getByRole('button', { name: 'Toggle colour theme' })
    .click();
  assert.equal(
    await restrictedStoragePage.locator('html').getAttribute('data-theme'),
    'light',
    'The theme should still change in memory when localStorage is blocked'
  );
  assert.deepEqual(
    restrictedStorageErrors,
    [],
    `Blocked localStorage caused browser errors: ${restrictedStorageErrors.join('; ')}`
  );
  await restrictedStorageContext.close();

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
  assert.equal(
    await page
      .locator('#main-content')
      .evaluate((element) => element === document.activeElement),
    true,
    'The skip link should move focus to the main content container'
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

  // Theme selection persists across a full reload.
  await page.getByRole('button', { name: 'Toggle colour theme' }).click();
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
  await page.getByRole('radio', { name: 'Acoustic guitar' }).check();
  await page.getByRole('checkbox', { name: 'Acoustic & fingerstyle' }).check();
  await page.getByRole('radio', { name: '20 min' }).check();
  await page.getByRole('button', { name: /Save my preferences/ }).click();
  await page
    .getByRole('status')
    .filter({ hasText: 'saved privately on this device' })
    .waitFor();
  await page.goto(origin, { waitUntil: 'networkidle' });
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
  await planner.getByRole('button', { name: 'Use this plan' }).click();
  await planner
    .getByRole('status')
    .filter({ hasText: 'does not record practice' })
    .waitFor();

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
  assert.equal(
    await planner.locator('.planner-heading .neutral-tag').innerText(),
    '15 / 15 min planned'
  );
  await customDuration.fill('4');
  await planner
    .getByText('Enter a whole number from 5 to 180 minutes.')
    .waitFor();
  assert.equal(
    await planner.getByRole('button', { name: 'Use this plan' }).isDisabled(),
    true
  );
  await customDuration.fill('15');
  assert.equal(
    await planner.getByRole('button', { name: 'Use this plan' }).isDisabled(),
    false
  );

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

  // Backup navigation and export remain available from the learner dashboard.
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await mobileNavigation.getByRole('link', { name: 'Data & backups' }).click();
  await page
    .getByRole('heading', { name: 'Keep your learning safe.' })
    .waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download backup/ }).click();
  const download = await downloadPromise;
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
  assert.equal(backup.format, 'guitarlab-learner-backup');
  assert.equal(backup.version, 1);
  assert.equal(backup.records.profile.preferences.practiceMinutes, 20);

  // Invalid JSON and unsupported backup versions must be rejected without preview.
  const backupInput = page.locator('input[type="file"]');
  await backupInput.setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{')
  });
  await page
    .getByRole('status')
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
    .getByRole('status')
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
  await page.getByRole('button', { name: 'Reset active learner data' }).click();
  assert.match(acceptedDialogMessage, /Reset GuitarLab learner data/);
  await page
    .getByRole('status')
    .filter({
      hasText:
        'Your active learner data has been reset. A fresh empty profile is ready.'
    })
    .waitFor();

  // Restore the downloaded backup into a new, empty learner profile.
  await page.goto(`${origin}/onboarding`, { waitUntil: 'networkidle' });
  assert.equal(
    await page.getByRole('radio', { name: '20 min' }).isChecked(),
    false,
    'Reset should create a fresh profile with no assumed practice duration'
  );
  await page.goto(`${origin}/settings/data`, { waitUntil: 'networkidle' });
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

  await page.goto(`${origin}/onboarding`, { waitUntil: 'networkidle' });
  assert.equal(
    await page.getByRole('radio', { name: '20 min' }).isChecked(),
    true,
    'Restoring the exported backup into a clean profile should recover preferences'
  );
  assert.equal(
    await page.getByRole('radio', { name: 'Acoustic guitar' }).isChecked(),
    true,
    'Restoring the exported backup should recover the instrument preference'
  );
  assert.equal(
    await page
      .getByRole('checkbox', { name: 'Acoustic & fingerstyle' })
      .isChecked(),
    true,
    'Restoring the exported backup should recover the learner goals'
  );

  // M6.1 fretboard explorer: navigation, note mapping, find mode and handedness.
  // Restore the desktop viewport after the earlier mobile navigation acceptance.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Tools', exact: true }).click();
  await page
    .getByRole('heading', { name: 'Tools for your practice.' })
    .waitFor();
  await page.getByRole('link', { name: /Open explorer/ }).click();
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
  await page.locator('.note-detail').getByText('C3').waitFor();

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
  await page.locator('#duration').fill('2');
  await page.locator('#focus').fill('Browser acceptance scale drill');
  await page.getByRole('button', { name: 'Start practice' }).click();
  await page
    .getByRole('heading', { name: 'Your session is in progress' })
    .waitFor();

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
  assert.equal(
    await page.locator('.elapsed').innerText(),
    pausedElapsed,
    'Paused state and time must survive reload'
  );
  await page.getByRole('button', { name: 'Resume session' }).click();
  await page
    .getByRole('heading', { name: 'Your session is in progress' })
    .waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: 'Your session is in progress' })
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
    page.locator('#duration').fill('2'),
    competingPage.locator('#duration').fill('2')
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
      .getByRole('heading', { name: 'Your session is in progress' })
      .waitFor({ timeout: 5_000 })
      .then(() => true)
      .catch(() => false),
    competingPage
      .getByRole('heading', { name: 'Your session is in progress' })
      .waitFor({ timeout: 5_000 })
      .then(() => true)
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
    page
      .getByRole('heading', { name: 'Your session is in progress' })
      .waitFor(),
    competingPage
      .getByRole('heading', { name: 'Your session is in progress' })
      .waitFor()
  ]);
  await competingPage.close();

  // M7.2 adaptive recommendation feedback is local, append-only and evidence-aware.
  await page.goto(`${origin}/practice`, { waitUntil: 'networkidle' });
  const adaptiveRecommendation = page
    .locator('.adaptive-list li[data-target-type="skill"]')
    .first();
  await adaptiveRecommendation.waitFor();
  const recommendationId = await adaptiveRecommendation.getAttribute(
    'data-recommendation-id'
  );
  assert.ok(recommendationId, 'A suggested skill needs a stable recommendation ID');

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

  await persistedRecommendation.getByRole('button', { name: 'Dismiss' }).click();
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
      .map((record) => record.action),
    ['correct', 'dismiss'],
    'Feedback is persisted as a new record for each learner action'
  );

  // M7 skill-state transparency: explanations and learner corrections persist locally.
  const skillFixture = await page.evaluate(async () => {
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
      curriculumReleaseId: 'curriculum-v1',
      skillId: 'alternate-picking',
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
      curriculumReleaseId: 'curriculum-v1',
      skillId: 'alternate-picking',
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
      curriculumReleaseId: 'curriculum-v1',
      skillId: 'chord-transition',
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
  });
  assert.ok(
    skillFixture.active,
    'The skill-state fixture needs an active learner'
  );
  await page.goto(`${origin}/skills`, { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: 'Skill states, explained.' })
    .waitFor();
  const chordTransitionChoice = page.getByRole('button', {
    name: /Chord Transition/
  });
  await chordTransitionChoice.waitFor();
  await chordTransitionChoice.click();
  await page
    .getByText(/No assessment has been recorded for this skill yet/)
    .waitFor();
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
  const correctedSnapshot = await page.evaluate(async () => {
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
        .get([learnerId, 'curriculum-v1', 'chord-transition']);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return row;
  });
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
