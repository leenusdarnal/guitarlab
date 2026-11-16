import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, webkit } from 'playwright';

const require = createRequire(import.meta.url);
const axeSource = await readFile(
  require.resolve('axe-core/axe.min.js'),
  'utf8'
);
const port = Number(process.env.GUITARLAB_ACCESSIBILITY_PREVIEW_PORT ?? 8789);
const origin = 'http://127.0.0.1:' + port;
const themes = ['dark', 'light'];
const browserEngine =
  process.env.GUITARLAB_BROWSER_ENGINE === 'webkit' ? webkit : chromium;
const baseRoutes = [
  '/',
  '/learn',
  '/learn/y1-w01-lesson',
  '/onboarding',
  '/practice',
  '/settings/data',
  '/tools',
  '/skills',
  '/tools/fretboard',
  '/tools/chords',
  '/tools/metronome',
  '/tools/ear-training',
  '/tools/note-recognition',
  '/tools/theory-recall',
  '/tools/tuner',
  '/repertoire'
];
const routes =
  process.env.GUITARLAB_BROWSER_ENGINE === 'webkit'
    ? [
        '/',
        '/learn',
        '/learn/y1-w01-lesson',
        '/practice',
        '/settings/data',
        '/tools',
        '/tools/tuner',
        '/skills',
        '/repertoire'
      ]
    : baseRoutes;
const wcagTags = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice'
];
const blockingImpacts = new Set(['critical', 'serious']);
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

async function waitForPreview() {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error('Wrangler preview exited early.\n' + serverOutput);
    }
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The local Worker is still starting.
    }
    await delay(1000);
  }
  throw new Error('Wrangler preview did not become ready.\n' + serverOutput);
}

function assertResponseSecurityHeaders(response) {
  const headers = response?.headers() ?? {};

  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.equal(headers['cross-origin-opener-policy'], 'same-origin');
  assert.match(headers['permissions-policy'] ?? '', /camera=\(\)/);
  assert.match(headers['permissions-policy'] ?? '', /microphone=\(self\)/);
  assert.match(headers['permissions-policy'] ?? '', /geolocation=\(\)/);

  const policy = headers['content-security-policy'];
  assert.ok(
    policy,
    'HTML responses must include an enforced Content-Security-Policy header.'
  );

  const directives = new Map(
    policy
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...values] = part.split(/\s+/);
        return [name, values];
      })
  );
  const requireSource = (directive, source) => {
    assert.ok(
      directives.get(directive)?.includes(source),
      'CSP directive ' + directive + ' must include ' + source
    );
  };

  requireSource('default-src', "'self'");
  requireSource('base-uri', "'self'");
  requireSource('connect-src', "'self'");
  requireSource('form-action', "'self'");
  requireSource('img-src', "'self'");
  requireSource('object-src', "'none'");
  requireSource('frame-ancestors', "'none'");
  requireSource('script-src', "'self'");

  const scriptSources = directives.get('script-src') ?? [];
  assert.ok(
    !scriptSources.includes("'unsafe-inline'"),
    'CSP must not allow inline JavaScript.'
  );
  assert.ok(
    !scriptSources.includes("'unsafe-eval'"),
    'CSP must not allow eval-based JavaScript.'
  );
}

async function assertDashboardTypography(page, viewport) {
  const result = await page.evaluate(() => {
    const bodyCopySelectors = [
      '.welcome p',
      '.target-card > p',
      '.practice-target > p',
      '.fresh-copy p',
      '.planner-heading p',
      '.practice-task p',
      '.duration-context',
      '.planner-footer > p',
      '.planner-guardrail',
      '.planner-notice',
      '.error-panel p',
      '.empty-state p',
      '.backup-reminder p',
      '.section-heading p',
      '.phase-card > p',
      '.path-note'
    ];
    const headings = [
      '.fresh-copy h2',
      '.practice-task h3',
      '.panel-heading h2',
      '.backup-reminder h2'
    ];
    const measure = (selectors) =>
      Array.from(document.querySelectorAll(selectors.join(',')))
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => ({
          text: element.textContent?.trim().slice(0, 80) ?? '',
          fontSize: Number.parseFloat(getComputedStyle(element).fontSize)
        }));
    return {
      bodyCopy: measure(bodyCopySelectors),
      headings: measure(headings)
    };
  });

  assert.ok(
    result.bodyCopy.length > 0,
    'Today should expose learner-facing explanatory copy at ' + viewport
  );
  assert.deepEqual(
    result.bodyCopy.filter((item) => item.fontSize < 14),
    [],
    'Today has learner-facing copy below 14px at ' +
      viewport +
      ': ' +
      JSON.stringify(result.bodyCopy.filter((item) => item.fontSize < 14))
  );
  assert.ok(
    result.headings.every((item) => item.fontSize >= 16),
    'Dashboard task and panel headings must be at least 16px at ' + viewport
  );
}

async function scanPage(page, route, theme, viewport) {
  const results = await page.evaluate(async (tags) => {
    return window.axe.run(document, {
      runOnly: { type: 'tag', values: tags }
    });
  }, wcagTags);

  const violations = results.violations;
  const blockers = violations.filter((violation) =>
    blockingImpacts.has(violation.impact)
  );
  const warnings = violations.filter(
    (violation) => !blockingImpacts.has(violation.impact)
  );

  console.log(
    '[axe] ' +
      theme +
      ' ' +
      viewport +
      ' ' +
      route +
      ': ' +
      violations.length +
      ' violations, ' +
      results.incomplete.length +
      ' items requiring manual review'
  );

  for (const violation of violations) {
    console.log(
      '  ' +
        (violation.impact ?? 'unknown') +
        ' ' +
        violation.id +
        ': ' +
        violation.help +
        ' (' +
        violation.nodes.length +
        ' affected nodes)'
    );
    for (const node of violation.nodes.slice(0, 5)) {
      console.log(
        '    ' + node.target.join(', ') + ' — ' + node.failureSummary
      );
    }
  }

  if (warnings.length > 0) {
    console.warn(
      '[axe] ' +
        warnings.length +
        ' moderate/minor findings are reported for follow-up; ' +
        'serious and critical findings block CI.'
    );
  }
  assert.equal(
    blockers.length,
    0,
    'Serious or critical accessibility violations on ' +
      route +
      ' (' +
      theme +
      ', ' +
      viewport +
      '): ' +
      blockers.map((violation) => violation.id).join(', ')
  );
}

try {
  await waitForPreview();
  browser = await browserEngine.launch({ headless: true });

  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 }
    });
    await context.addInitScript({ content: axeSource });
    await context.addInitScript((savedTheme) => {
      try {
        const storedTheme = window.localStorage.getItem('guitarlab-theme');
        if (
          storedTheme !== 'system' &&
          storedTheme !== 'light' &&
          storedTheme !== 'dark'
        ) {
          window.localStorage.setItem('guitarlab-theme', savedTheme);
        }
      } catch {
        // Theme persistence is optional in restricted browser contexts.
      }
    }, theme);
    await context.addInitScript(() => {
      window.__guitarlabThemeAtFirstFrame = null;
      requestAnimationFrame(() => {
        window.__guitarlabThemeAtFirstFrame =
          document.documentElement.dataset.theme ?? null;
      });
    });

    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    for (const route of routes) {
      await page.setViewportSize({ width: 320, height: 900 });
      const mobileResponse = await page.goto(origin + route, {
        waitUntil: 'networkidle'
      });
      assert.equal(
        mobileResponse?.status(),
        200,
        'Expected ' + route + ' to load at 320px in ' + theme + ' theme'
      );

      if (route === '/' || route === '/practice') {
        const moreTrigger = page.locator('.mobile-nav-trigger');
        await moreTrigger.click();
        assert.equal(await moreTrigger.getAttribute('aria-expanded'), 'true');
        const moreNavigation = page.locator('#mobile-more-navigation');
        await moreNavigation.waitFor({ state: 'visible' });
        assert.equal(
          await moreNavigation
            .locator('a')
            .first()
            .evaluate((element) => document.activeElement === element),
          true,
          'Opening More navigation must move focus to its first destination.'
        );
        assert.ok(
          (await moreNavigation.locator('a').count()) >= 3,
          'Secondary navigation must retain Songs, preferences and data ' +
            'backups.'
        );
        await page.keyboard.press('Escape');
        assert.equal(await moreTrigger.getAttribute('aria-expanded'), 'false');
        assert.equal(
          await moreTrigger.evaluate(
            (element) => document.activeElement === element
          ),
          true,
          'Escape must close More navigation and restore focus to its trigger.'
        );
      }

      if (route !== '/onboarding') {
        const mobileTabs = page.locator('.mobile-tab-bar');
        await mobileTabs.waitFor({ state: 'visible' });
        assert.deepEqual(
          await mobileTabs.locator('a span').allTextContents(),
          ['Today', 'Learn', 'Practice', 'Tools', 'Progress'],
          'Mobile primary navigation must expose five labelled destinations.'
        );
        const expectedTab =
          route === '/'
            ? 'Today'
            : route.startsWith('/learn')
              ? 'Learn'
              : route.startsWith('/practice')
                ? 'Practice'
                : route.startsWith('/tools')
                  ? 'Tools'
                  : route.startsWith('/skills')
                    ? 'Progress'
                    : null;
        const selectedTabs = mobileTabs.locator('a[aria-current="page"] span');
        if (expectedTab) {
          assert.equal(await selectedTabs.count(), 1);
          assert.equal((await selectedTabs.textContent())?.trim(), expectedTab);
        } else {
          assert.equal(
            await selectedTabs.count(),
            0,
            route +
              ' must not falsely mark an unrelated primary destination current.'
          );
        }
        const tabTargetHeights = await mobileTabs
          .locator('a')
          .evaluateAll((links) =>
            links.map((link) => link.getBoundingClientRect().height)
          );
        assert.ok(
          tabTargetHeights.every((height) => height >= 44),
          'Every mobile tab must provide at least a 44px touch target.'
        );
      } else {
        assert.equal(
          await page.locator('.mobile-tab-bar').count(),
          0,
          'The focused onboarding flow should not display primary navigation.'
        );
      }
      let routeBackIconSelector = null;
      if (route === '/learn') {
        routeBackIconSelector =
          '.catalog-header .back [data-icon="arrow-left"]';
      } else if (route === '/onboarding') {
        routeBackIconSelector =
          '.setup-page header .skip [data-icon="arrow-left"]';
      } else if (route === '/practice') {
        routeBackIconSelector =
          '.practice-page .top > a [data-icon="arrow-left"]';
      } else if (route === '/settings/data') {
        routeBackIconSelector =
          '.data-page header .back-link [data-icon="arrow-left"]';
      } else if (route === '/skills') {
        routeBackIconSelector = '.skill-page > .back [data-icon="arrow-left"]';
      } else if (
        route === '/tools' ||
        route.startsWith('/tools/') ||
        route === '/repertoire'
      ) {
        routeBackIconSelector = '.back-link [data-icon="arrow-left"]';
      }
      if (routeBackIconSelector) {
        assert.equal(
          await page.locator(routeBackIconSelector).count(),
          1,
          route + ' must render the shared SVG back icon.'
        );
      }
      const viewportMeta = await page
        .locator('meta[name="viewport"]')
        .getAttribute('content');
      assert.match(
        viewportMeta ?? '',
        /viewport-fit=cover/,
        'The page must allow the browser to expose device safe-area insets'
      );
      const mobileViewportHeight = await page.evaluate(() => ({
        minHeight: getComputedStyle(document.body).minHeight,
        viewportHeight: window.innerHeight
      }));
      assert.equal(
        Number.parseFloat(mobileViewportHeight.minHeight),
        mobileViewportHeight.viewportHeight,
        'The app body must follow the current mobile viewport height'
      );
      if (route === '/learn/y1-w01-lesson') {
        const outline = await page
          .locator('.lesson-outline')
          .evaluate((element) => ({
            position: getComputedStyle(element).position,
            top: getComputedStyle(element).top
          }));
        assert.equal(outline.position, 'sticky');
        assert.equal(outline.top, '60px');
      }

      if (route === '/') {
        assertResponseSecurityHeaders(mobileResponse);
      }
      await page.locator('main').first().waitFor({ state: 'visible' });
      await page.waitForFunction(() => {
        const main = document.querySelector('main');
        return (
          main?.id === 'main-content' &&
          document.querySelectorAll('#main-content').length === 1
        );
      });
      assert.equal(
        await page
          .locator('#main-content')
          .evaluate((element) => element.tagName),
        'MAIN',
        route + ' must expose one unique main-content landmark in ' + theme
      );
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
      });

      const mobileLayout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth
      }));
      assert.ok(
        mobileLayout.content <= mobileLayout.viewport,
        route +
          ' has horizontal page overflow at 320px in ' +
          theme +
          ' theme: ' +
          JSON.stringify(mobileLayout)
      );

      const undersizedTextControls = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll(
            'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]), select, textarea'
          )
        )
          .map((control) => ({
            element: control.tagName.toLowerCase(),
            type: control.getAttribute('type'),
            fontSize: Number.parseFloat(getComputedStyle(control).fontSize)
          }))
          .filter((control) => control.fontSize < 16)
      );
      assert.deepEqual(
        undersizedTextControls,
        [],
        route + ' has text controls below 16px in ' + theme + ' theme'
      );

      if (route === '/onboarding') {
        const onboardingCopySizes = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll(
              '.intro, .custom-practice, .custom-practice-help, .preference-effect, .privacy-note'
            )
          ).map((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize)
          )
        );
        assert.ok(
          onboardingCopySizes.length > 0 &&
            onboardingCopySizes[0] >= 16 &&
            onboardingCopySizes.every((fontSize) => fontSize >= 15),
          'Onboarding explanations must use 16px body text and readable supporting text.'
        );
      }
      if (route === '/settings/data') {
        const settingsCopySizes = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll(
              '.intro, .section-copy, .backup-panel p, .reset-label, .privacy-note'
            )
          ).map((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize)
          )
        );
        assert.ok(
          settingsCopySizes.length > 0 &&
            settingsCopySizes.slice(0, 3).every((fontSize) => fontSize >= 16) &&
            settingsCopySizes.every((fontSize) => fontSize >= 15),
          'Backup, reset and privacy instructions must remain readable.'
        );
      }

      if (route.startsWith('/tools/')) {
        const toolInstructions = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll(
              '.page-heading p, .guidance-panel p, .guidance-panel li, .visual-hint, .tuning-guidance p'
            )
          )
            .map((element) =>
              Number.parseFloat(getComputedStyle(element).fontSize)
            )
            .filter(Number.isFinite)
        );
        assert.ok(
          toolInstructions.length > 0 &&
            toolInstructions.every((fontSize) => fontSize >= 16),
          route + ' must use 16px body text for tool instructions.'
        );
      }
      if (route === '/repertoire') {
        const repertoireCopy = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll(
              '.page-heading p, .empty-copy, .rights-note'
            )
          ).map((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize)
          )
        );
        assert.ok(
          repertoireCopy.length > 0 &&
            repertoireCopy.every((fontSize) => fontSize >= 15),
          'Repertoire guidance and rights copy must remain readable.'
        );
      }

      if (route === '/tools') {
        const smallestToolCopy = await page.evaluate(() =>
          Math.min(
            ...Array.from(
              document.querySelectorAll('.page-heading > p, .tool-copy > p')
            ).map((element) =>
              Number.parseFloat(getComputedStyle(element).fontSize)
            )
          )
        );
        assert.ok(
          smallestToolCopy >= 16,
          'Tools instructions and descriptions must use readable 16px body copy.'
        );
      }
      if (route === '/skills') {
        const smallestSkillCopy = await page.evaluate(() =>
          Math.min(
            ...Array.from(
              document.querySelectorAll('header > p, .guide-item p')
            ).map((element) =>
              Number.parseFloat(getComputedStyle(element).fontSize)
            )
          )
        );
        assert.ok(
          smallestSkillCopy >= 13,
          'Skills guidance and supporting copy must not use tiny metadata sizing.'
        );
      }

      if (route === '/learn/y1-w01-lesson') {
        const metronomeLink = page.locator(
          '.lesson-tool-links a[href*="/tools/metronome"]'
        );
        assert.match(
          await metronomeLink.innerText(),
          /Open metronome at 50 BPM/,
          'The lesson should announce its starting tempo in the metronome action.'
        );
        const metronomeHref = await metronomeLink.getAttribute('href');
        assert.ok(
          metronomeHref,
          'The lesson should link to its metronome tool.'
        );
        assert.equal(
          new URL(metronomeHref, origin).searchParams.get('bpm'),
          '50',
          'The lesson starting tempo should be carried into the metronome URL.'
        );
        const metronomePage = await context.newPage();
        await metronomePage.goto(new URL(metronomeHref, origin).toString(), {
          waitUntil: 'networkidle'
        });
        assert.equal(
          await metronomePage
            .getByRole('spinbutton', {
              name: 'Enter tempo in beats per minute'
            })
            .inputValue(),
          '50',
          'The metronome should initialize from the lesson starting tempo.'
        );
        await metronomePage.close();

        const lessonCopySizes = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll(
              '.content-section p, .content-section li, .sidebar-card p, .practice-options li, .mastery-note'
            )
          )
            .map((element) =>
              Number.parseFloat(getComputedStyle(element).fontSize)
            )
            .filter(Number.isFinite)
        );
        assert.ok(
          lessonCopySizes.length > 0 && Math.min(...lessonCopySizes) >= 15,
          'Lesson instructions, supporting explanations and sidebar guidance must stay readable.'
        );
        const undersizedLessonActions = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll(
              '.resume-button, .checkpoint-actions button, .completion-actions button, .block-complete'
            )
          )
            .map((element) => ({
              text: element.textContent?.trim(),
              height: element.getBoundingClientRect().height
            }))
            .filter((element) => element.height < 44)
        );
        assert.deepEqual(
          undersizedLessonActions,
          [],
          'Lesson progress and completion actions must meet the 44px target height.'
        );
      }

      await scanPage(page, route, theme, '320px');
      if (route === '/') {
        await assertDashboardTypography(page, '320px');
      }

      await page.setViewportSize({ width: 1440, height: 1000 });
      if (route === '/onboarding') {
        assert.equal(
          await page.locator('.mobile-tab-bar').count(),
          0,
          'The focused onboarding flow must remain free of mobile primary navigation.'
        );
      } else {
        assert.equal(
          await page
            .locator('.mobile-tab-bar')
            .evaluate((element) => getComputedStyle(element).display),
          'none',
          'Mobile primary tabs must not replace desktop navigation.'
        );
      }
      await scanPage(page, route, theme, 'desktop');
      if (route === '/') {
        await assertDashboardTypography(page, 'desktop');
      }
      for (const width of [360, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 1000 });
        const responsiveTabVisibility = await page.evaluate(() => {
          const tabBar = document.querySelector('.mobile-tab-bar');
          return tabBar ? getComputedStyle(tabBar).display !== 'none' : false;
        });
        assert.equal(
          responsiveTabVisibility,
          width <= 760 && route !== '/onboarding',
          route + ' must show mobile tabs only at mobile widths.'
        );
        const responsiveLayout = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
          undersizedControls: Array.from(
            document.querySelectorAll(
              'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]), select, textarea'
            )
          )
            .map((control) =>
              Number.parseFloat(getComputedStyle(control).fontSize)
            )
            .filter((fontSize) => fontSize < 16)
        }));
        assert.ok(
          responsiveLayout.content <= responsiveLayout.viewport,
          route + ' has horizontal overflow at ' + width + 'px in ' + theme
        );
        assert.deepEqual(
          responsiveLayout.undersizedControls,
          [],
          route + ' has text controls below 16px at ' + width + 'px in ' + theme
        );
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + '/learn', { waitUntil: 'networkidle' });
    const firstFrameTheme = await page.evaluate(() => ({
      applied: document.documentElement.dataset.theme,
      firstFrame: window.__guitarlabThemeAtFirstFrame,
      preference: document.documentElement.dataset.themePreference
    }));
    assert.equal(firstFrameTheme.applied, theme);
    assert.equal(
      firstFrameTheme.firstFrame,
      theme,
      'The selected theme must be applied before the first rendered frame'
    );
    assert.equal(firstFrameTheme.preference, theme);

    const appearance = page.locator('select[aria-label="Appearance"]');
    assert.equal(await appearance.inputValue(), theme);
    await appearance.selectOption('system');
    assert.equal(
      await page.evaluate(() => localStorage.getItem('guitarlab-theme')),
      'system'
    );

    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === 'light'
    );
    assert.equal(
      await page.locator('meta[name="theme-color"]').getAttribute('content'),
      '#F5F4F0'
    );
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === 'dark'
    );
    assert.equal(
      await page.locator('meta[name="theme-color"]').getAttribute('content'),
      '#101318'
    );

    await appearance.selectOption('light');
    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.theme),
      'light'
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem('guitarlab-theme')),
      'light'
    );
    await appearance.selectOption('dark');
    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.theme),
      'dark'
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem('guitarlab-theme')),
      'dark'
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin, { waitUntil: 'networkidle' });
    const dashboardAppearance = page.locator('select[aria-label="Appearance"]');
    assert.equal(await dashboardAppearance.inputValue(), 'dark');
    await dashboardAppearance.selectOption('light');
    assert.deepEqual(
      await page.evaluate(() => ({
        preference: document.documentElement.dataset.themePreference,
        theme: document.documentElement.dataset.theme,
        stored: localStorage.getItem('guitarlab-theme'),
        themeColor: document
          .querySelector('meta[name="theme-color"]')
          ?.getAttribute('content')
      })),
      {
        preference: 'light',
        theme: 'light',
        stored: 'light',
        themeColor: '#F5F4F0'
      }
    );
    await page.goto(origin + '/practice', { waitUntil: 'networkidle' });
    const sharedAppearance = page.locator('select[aria-label="Appearance"]');
    assert.equal(
      await sharedAppearance.inputValue(),
      'light',
      'Shared navigation must reflect the appearance selected on Today'
    );
    await sharedAppearance.selectOption('system');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === 'dark'
    );
    assert.equal(
      await page.locator('meta[name="theme-color"]').getAttribute('content'),
      '#101318'
    );
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === 'light'
    );
    assert.equal(
      await page.locator('meta[name="theme-color"]').getAttribute('content'),
      '#F5F4F0'
    );

    if (theme === 'dark') {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.keyboard.press('Tab');
      const firstFocus = await page.evaluate(() => ({
        text: document.activeElement?.textContent?.trim() ?? '',
        visible:
          document.activeElement instanceof HTMLElement &&
          document.activeElement.getBoundingClientRect().width > 0
      }));
      assert.match(
        firstFocus.text,
        /Skip to main content/,
        'The first keyboard stop should be the global skip link'
      );
      assert.equal(
        firstFocus.visible,
        true,
        'The skip link should be visible on focus'
      );
      await page.keyboard.press('Enter');
      await page.waitForFunction(
        () => document.activeElement?.id === 'main-content'
      );
      assert.equal(
        await page.evaluate(() => document.activeElement?.tagName),
        'MAIN',
        'Skip navigation must focus the actual page main landmark'
      );
    }

    await page.goto(origin + '/settings/data', { waitUntil: 'networkidle' });
    const restorePicker = page
      .locator('label.file-picker')
      .filter({ has: page.locator('input[type="file"]') });
    const restoreInput = page.locator('input[type="file"]');
    await restoreInput.focus();
    const restorePickerFocus = await restorePicker.evaluate((label) => ({
      outlineStyle: getComputedStyle(label).outlineStyle,
      outlineWidth: Number.parseFloat(getComputedStyle(label).outlineWidth),
      height: label.getBoundingClientRect().height
    }));
    assert.equal(restorePickerFocus.outlineStyle, 'solid');
    assert.ok(restorePickerFocus.outlineWidth >= 3);
    assert.ok(restorePickerFocus.height >= 44);

    assert.deepEqual(
      pageErrors,
      [],
      'Browser runtime errors in ' + theme + ' theme: ' + pageErrors.join('; ')
    );
    await context.close();
  }

  console.log(
    'Accessibility checks passed with ' +
      (process.env.GUITARLAB_BROWSER_ENGINE ?? 'chromium') +
      ': ' +
      routes.length +
      ' routes in dark ' +
      'and light themes, WCAG A/AA axe scans at desktop and 320px, ' +
      'narrow-screen reflow, real-main skip navigation, restore-picker ' +
      'focus, and mobile control sizing.'
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
      // The preview process may already have exited.
    }
  } else {
    server.kill('SIGTERM');
  }
}
