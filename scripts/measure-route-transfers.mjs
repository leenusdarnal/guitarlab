#!/usr/bin/env node
import assert from 'node:assert/strict';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import {
  formatRouteTransferReport,
  normalizeResourceTiming,
  summarizeRequests
} from './route-transfer-report.mjs';

const port = Number(process.env.GUITARLAB_PERF_PORT ?? 8788);
assert.ok(Number.isInteger(port) && port > 0 && port < 65536, 'GUITARLAB_PERF_PORT must be a valid TCP port.');

const configuredBaseUrl = process.env.GUITARLAB_PERF_BASE_URL;
const origin = configuredBaseUrl
  ? new URL(configuredBaseUrl).origin
  : `http://127.0.0.1:${port}`;

const routes = [
  '/',
  '/learn',
  '/learn/y1-w01-lesson',
  '/practice',
  '/tools'
];

const profiles = [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'mobile-viewport', width: 390, height: 844 }
];

const reportPath = fileURLToPath(
  new URL('../.svelte-kit/output/client/route-transfer-report.json', import.meta.url)
);

let previewProcess;
let previewOutput = '';

function startPreviewServer() {
  previewProcess = spawn(
    'npm',
    ['run', 'preview', '--', '--ip', '127.0.0.1', '--port', String(port)],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32'
    }
  );

  previewProcess.stdout.on('data', (chunk) => {
    previewOutput += chunk.toString();
  });
  previewProcess.stderr.on('data', (chunk) => {
    previewOutput += chunk.toString();
  });
  previewProcess.on('error', (error) => {
    previewOutput += `\nPreview process error: ${error.message}`;
  });
}

async function waitForPreviewServer() {
  let ready = false;

  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (
      !previewProcess ||
      previewProcess.exitCode !== null ||
      previewProcess.signalCode !== null
    ) {
      throw new Error(`Wrangler preview exited early.\n${previewOutput}`);
    }

    try {
      const response = await fetch(origin);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Wrangler is still starting.
    }

    await delay(1000);
  }

  assert.equal(
    ready,
    true,
    `Wrangler preview did not become ready.\n${previewOutput}`
  );
}

async function stopPreviewServer() {
  const current = previewProcess;
  if (!current) return;

  const exited = new Promise((resolve) => {
    if (current.exitCode !== null || current.signalCode !== null) {
      resolve();
    } else {
      current.once('exit', resolve);
    }
  });

  if (current.pid && process.platform !== 'win32') {
    try {
      process.kill(-current.pid, 'SIGTERM');
    } catch {
      // Wrangler may already have stopped.
    }
  } else {
    current.kill('SIGTERM');
  }

  await Promise.race([exited, delay(5000)]);
  previewProcess = null;
}

async function captureRoute(browser, path, profile) {
  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    deviceScaleFactor: 1,
    serviceWorkers: 'block'
  });

  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(45000);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.addInitScript(() => {
      performance.setResourceTimingBufferSize(2000);
    });

    const statuses = new Map();
    page.on('response', (response) => {
      try {
        const responseUrl = new URL(response.url());
        if (responseUrl.origin === origin) {
          statuses.set(response.url(), response.status());
        }
      } catch {
        // Ignore malformed or non-HTTP response URLs.
      }
    });

    const targetUrl = new URL(path, origin).toString();
    const response = await page.goto(targetUrl, { waitUntil: 'load' });
    assert.ok(response, `No document response was recorded for ${path}.`);
    assert.ok(
      response.ok(),
      `Route ${path} returned HTTP ${response.status()} in ${profile.name} profile.`
    );

    await page.evaluate(async () => {
      await document.fonts.ready;
      return true;
    });
    await delay(500);

    const timingEntries = await page.evaluate(() => {
      const readEntry = (entry) => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        transferSize: entry.transferSize,
        duration: entry.duration
      });

      return [
        ...performance.getEntriesByType('navigation').map(readEntry),
        ...performance.getEntriesByType('resource').map(readEntry)
      ];
    });

    const requests = timingEntries
      .map((entry) => normalizeResourceTiming(entry, origin, statuses))
      .filter(Boolean);

    const summary = summarizeRequests(requests);
    assert.ok(
      summary.requestCount > 0 && summary.transferBytes > 0,
      `No measurable same-origin transfer was captured for ${path} (${profile.name}).`
    );

    const finalUrl = new URL(page.url());
    assert.equal(
      finalUrl.origin,
      origin,
      `Route ${path} unexpectedly navigated away from the local application origin.`
    );

    return {
      path,
      profile: profile.name,
      viewport: { width: profile.width, height: profile.height },
      status: response.status(),
      ...summary
    };
  } finally {
    await context.close();
  }
}

let browser;

try {
  if (!configuredBaseUrl) {
    startPreviewServer();
    await waitForPreviewServer();
  }

  browser = await chromium.launch({ headless: true });

  const measuredRoutes = [];
  for (const profile of profiles) {
    for (const path of routes) {
      const result = await captureRoute(browser, path, profile);
      measuredRoutes.push(result);
      console.log(
        `${profile.name} ${path}: ${result.requestCount} requests, ${result.encodedBodyBytes} encoded body bytes, ${result.transferBytes} transferred bytes (${result.unmeasuredTransferCount} unmeasured).`
      );
    }
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    commitSha:
      process.env.GUITARLAB_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      null,
    environment: 'CI local Wrangler Worker preview',
    browser: 'Chromium',
    browserVersion: browser.version(),
    cachePolicy: 'fresh context per route; HTTP cache disabled; service workers blocked',
    routes: measuredRoutes
  };

  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const markdown = formatRouteTransferReport(report);
  console.log(`\n${markdown}`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, 'utf8');
  }

  console.log(
    `\nJSON browser route-transfer report: ${relative(process.cwd(), reportPath)}`
  );
} finally {
  await browser?.close();
  await stopPreviewServer();
}
