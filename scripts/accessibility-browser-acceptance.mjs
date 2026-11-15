import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const axeSource = await readFile(
  require.resolve('axe-core/axe.min.js'),
  'utf8'
);
const port = Number(process.env.GUITARLAB_ACCESSIBILITY_PREVIEW_PORT ?? 8789);
const origin = 'http://127.0.0.1:' + port;
const themes = ['dark', 'light'];
const routes = [
  '/',
  '/learn',
  '/learn/y1-w01-lesson',
  '/onboarding',
  '/practice',
  '/settings/data',
  '/tools',
  '/tools/fretboard',
  '/tools/chords',
  '/tools/metronome',
  '/tools/ear-training'
];
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
  browser = await chromium.launch({ headless: true });

  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 }
    });
    await context.addInitScript({ content: axeSource });
    await context.addInitScript((savedTheme) => {
      try {
        window.localStorage.setItem('guitarlab-theme', savedTheme);
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

      if (route === '/') {
        assertResponseSecurityHeaders(mobileResponse);
      }
      await page.locator('main').first().waitFor({ state: 'visible' });
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

      await scanPage(page, route, theme, '320px');

      await page.setViewportSize({ width: 1440, height: 1000 });
      await scanPage(page, route, theme, 'desktop');
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
    }

    assert.deepEqual(
      pageErrors,
      [],
      'Browser runtime errors in ' + theme + ' theme: ' + pageErrors.join('; ')
    );
    await context.close();
  }

  console.log(
    'Accessibility checks passed: 11 routes in dark ' +
      'and light themes, WCAG A/AA axe scans at desktop and 320px, ' +
      'narrow-screen reflow, and keyboard skip-link focus.'
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
