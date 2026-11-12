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
  '/tools/metronome'
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

async function scanPage(page, route, theme, viewport) {
  await page.addScriptTag({ content: axeSource });
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
    await context.addInitScript((savedTheme) => {
      try {
        window.localStorage.setItem('guitarlab-theme', savedTheme);
      } catch {
        // Theme persistence is optional in restricted browser contexts.
      }
    }, theme);

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

      await scanPage(page, route, theme, '320px');

      await page.setViewportSize({ width: 1440, height: 1000 });
      await scanPage(page, route, theme, 'desktop');
    }

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
    'Accessibility browser acceptance passed: 10 representative routes in dark ' +
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
