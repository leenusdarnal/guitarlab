import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const port = Number(process.env.GUITARLAB_AUTH_PREVIEW_PORT ?? 8788);
const origin = `http://127.0.0.1:${port}`;
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const varsPath = fileURLToPath(new URL('../.dev.vars', import.meta.url));
const previousVars = await readFile(varsPath).catch(() => null);
const messages = [];
let mailSink;
let preview;
let previewOutput = '';
let browser;

function startMailSink() {
  mailSink = createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/emails') {
      response.writeHead(404).end();
      return;
    }

    let body = '';
    for await (const chunk of request) body += chunk;
    try {
      messages.push(JSON.parse(body));
      response.writeHead(202).end();
    } catch {
      response.writeHead(400).end();
    }
  });
  return new Promise((resolve, reject) => {
    mailSink.once('error', reject);
    mailSink.listen(0, '127.0.0.1', resolve);
  });
}

function startPreview() {
  preview = spawn(
    'npx',
    [
      'wrangler',
      'dev',
      '--config',
      'wrangler.jsonc',
      '--ip',
      '127.0.0.1',
      '--port',
      String(port)
    ],
    {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32'
    }
  );
  preview.stdout.on('data', (chunk) => {
    previewOutput += chunk.toString();
  });
  preview.stderr.on('data', (chunk) => {
    previewOutput += chunk.toString();
  });
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (preview.exitCode !== null) {
      throw new Error('The local authentication Worker exited during startup.');
    }
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // Wrangler is still starting.
    }
    await delay(1000);
  }
  throw new Error('The local authentication Worker did not become ready.');
}

async function waitForMessageCount(subject, count) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (messages.filter((item) => item.subject === subject).length >= count) {
      return;
    }
    await delay(100);
  }
  throw new Error(
    'Expected transactional email count was not delivered to the local test sink.'
  );
}

async function waitForMessage(subject) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const message = messages.filter((item) => item.subject === subject).at(-1);
    if (message) return message;
    await delay(100);
  }
  throw new Error(
    'Expected transactional email was not delivered to the local test sink.'
  );
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/([?&]token=)[^&\s]+/gi, '$1[redacted]')
    .replace(/(\/(?:reset-password|verify-email)\/)[^/?\s]+/gi, '$1[redacted]');
}

function extractActionUrl(message, predicate) {
  const urls = [...message.text.matchAll(/https?:\/\/[^\s<>"']+/g)].map(
    (match) => match[0].replace(/[),.;]+$/, '')
  );
  const match = urls.find((value) => {
    try {
      return predicate(new URL(value));
    } catch {
      return false;
    }
  });
  assert.ok(
    match,
    'The delivered test email must contain the expected one-time action link.'
  );
  return match;
}

async function signIn(page, email, password) {
  await page.goto(origin + '/login');
  await page.getByLabel('Email address').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page
    .getByRole('button', { name: 'Sign in', exact: true })
    .last()
    .click();
}

async function stopPreview() {
  if (!preview) return;
  const current = preview;
  if (current.exitCode === null) {
    if (current.pid && process.platform !== 'win32') {
      try {
        process.kill(-current.pid, 'SIGTERM');
      } catch {
        // The preview process may already have exited.
      }
    } else {
      current.kill('SIGTERM');
    }
    await Promise.race([
      new Promise((resolve) => current.once('exit', resolve)),
      delay(5000)
    ]);
  }
  preview = null;
}

try {
  await startMailSink();
  const sinkAddress = mailSink.address();
  assert.ok(sinkAddress && typeof sinkAddress === 'object');
  await writeFile(
    varsPath,
    [
      `BETTER_AUTH_SECRET=${randomBytes(32).toString('hex')}`,
      `BETTER_AUTH_URL=${origin}`,
      'RESEND_API_KEY=local-test-only',
      'AUTH_FROM_EMAIL=auth@example.test',
      `AUTH_TEST_MAIL_SINK_URL=http://127.0.0.1:${sinkAddress.port}/emails`,
      ''
    ].join('\n')
  );

  startPreview();
  await waitForPreview();

  const crossOriginResponse = await fetch(origin + '/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://attacker.example',
        'cf-connecting-ip': '192.0.2.20'
      },
      body: JSON.stringify({
        email: 'cross-origin@example.test',
        password: 'not-a-real-password'
      })
    }
  );
  assert.equal(
    crossOriginResponse.status,
    403,
    'The authentication Worker must reject state-changing requests from an untrusted Origin.'
  );
  assert.equal(
    crossOriginResponse.headers.get('set-cookie'),
    null,
    'A rejected cross-origin request must not create a session cookie.'
  );

  browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    extraHTTPHeaders: { 'cf-connecting-ip': '192.0.2.21' }
  });
  const page = await context.newPage();
  const email = `auth-test-${randomUUID()}@example.test`;
  const originalPassword = 'GuitarLab-Test-Password-123!';
  const replacementPassword = 'GuitarLab-New-Password-456!';

  await page.goto(origin + '/login');
  if (await page.getByText('Account access is not enabled here yet.').count()) {
    throw new Error('Local Wrangler authentication bindings were not loaded.');
  }
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .first()
    .click();
  await page.getByLabel('Your name').fill('GuitarLab Acceptance');
  await page.getByLabel('Email address').fill(email);
  await page.locator('input[name="password"]').fill(originalPassword);
  await page.locator('input[name="confirmPassword"]').fill(originalPassword);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .last()
    .click();
  await page.getByText(/If the address can be registered/).waitFor();

  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .first()
    .click();
  await page.getByLabel('Your name').fill('Duplicate GuitarLab Acceptance');
  await page.getByLabel('Email address').fill(email);
  await page.locator('input[name="password"]').fill(originalPassword);
  await page.locator('input[name="confirmPassword"]').fill(originalPassword);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .last()
    .click();
  await page.getByText(/If the address can be registered/).waitFor();

  await page
    .getByRole('button', { name: 'Sign in', exact: true })
    .first()
    .click();
  await page.locator('input[name="password"]').fill(originalPassword);
  await page
    .getByRole('button', { name: 'Sign in', exact: true })
    .last()
    .click();
  await page.getByRole('alert').waitFor();
  await waitForMessageCount('Verify your GuitarLab email', 2);
  const priorVerificationMessages = messages.filter(
    (message) => message.subject === 'Verify your GuitarLab email'
  ).length;
  await page.getByRole('button', { name: 'Resend verification email' }).click();
  await waitForMessageCount(
    'Verify your GuitarLab email',
    priorVerificationMessages + 1
  );

  const verificationEmail = await waitForMessage('Verify your GuitarLab email');
  const verificationUrl = extractActionUrl(verificationEmail, (url) =>
    url.pathname.includes('/api/auth/verify-email')
  );
  await page.goto(verificationUrl);
  await page.waitForURL((url) => url.searchParams.get('verified') === '1');

  await signIn(page, email, originalPassword);
  await page.waitForURL(origin + '/');
  await page.goto(origin + '/account');
  await page.getByRole('heading', { name: 'Account' }).waitFor();
  const sessionCookie = (await context.cookies(origin)).find((cookie) =>
    cookie.name.includes('session_token')
  );
  assert.ok(
    sessionCookie,
    'A successful sign-in must establish a session cookie.'
  );
  assert.equal(sessionCookie.httpOnly, true);
  assert.equal(sessionCookie.sameSite, 'Lax');
  assert.equal(sessionCookie.path, '/');

  const secondContext = await browser.newContext({
    extraHTTPHeaders: { 'cf-connecting-ip': '192.0.2.22' }
  });
  const secondPage = await secondContext.newPage();
  await signIn(secondPage, email, originalPassword);
  await secondPage.waitForURL(origin + '/');
  await secondPage.goto(origin + '/account');
  await secondPage.getByRole('heading', { name: 'Account' }).waitFor();

  await page.goto(origin + '/login');
  await page.getByRole('button', { name: 'Forgot your password?' }).click();
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await page.getByText(/If an account matches that address/).waitFor();

  const resetEmail = await waitForMessage('Reset your GuitarLab password');
  const deliveredEmailCount = messages.length;
  await page.goto(origin + '/login');
  await page.getByRole('button', { name: 'Forgot your password?' }).click();
  await page.getByLabel('Email address').fill('unknown-account@example.test');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await page.getByText(/If an account matches that address/).waitFor();
  await delay(300);
  assert.equal(
    messages.length,
    deliveredEmailCount,
    'A password-reset request for an unknown address must not send a message.'
  );

  const resetUrl = extractActionUrl(
    resetEmail,
    (url) =>
      url.pathname === '/login' &&
      url.searchParams.get('mode') === 'reset' &&
      url.searchParams.has('token')
  );
  await page.goto(resetUrl);
  await page.locator('input[name="password"]').fill(replacementPassword);
  await page.locator('input[name="confirmPassword"]').fill(replacementPassword);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page
    .getByText(
      'Your password has been updated. Sign in with your new password.'
    )
    .waitFor();
  await page.goto(resetUrl);
  await page.locator('input[name="password"]').fill(replacementPassword);
  await page.locator('input[name="confirmPassword"]').fill(replacementPassword);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page.getByRole('alert').waitFor();

  await secondPage.goto(origin + '/account');
  await secondPage.waitForURL(/\/login(?:$|\?)/);

  await signIn(page, email, originalPassword);
  await page.getByRole('alert').waitFor();
  await signIn(page, email, replacementPassword);
  await page.waitForURL(origin + '/');
  await page.goto(origin + '/account');
  await page.getByRole('heading', { name: 'Account' }).waitFor();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL(origin + '/');
  await page.goto(origin + '/account');
  await page.waitForURL(/\/login(?:$|\?)/);

  const rateLimitStatuses = [];
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(origin + '/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        'cf-connecting-ip': '192.0.2.23'
      },
      body: JSON.stringify({
        email: 'rate-limit-probe@example.test',
        password: 'deliberately-invalid-password'
      })
    });
    rateLimitStatuses.push(response.status);
    if (response.status === 429) break;
  }
  assert.ok(
    rateLimitStatuses.includes(429),
    `Repeated invalid sign-in attempts must reach the configured rate limit (received HTTP statuses: ${rateLimitStatuses.join(', ')}).`
  );

  await secondContext.close();
  await context.close();
  console.log(
    'Authentication browser acceptance passed: verified registration, unverified sign-in rejection, password reset, session revocation, logout and guest-safe routing.'
  );
} catch (error) {
  console.error(safeErrorMessage(error));
  if (previewOutput) {
    const safeOutput = previewOutput
      .replace(/BETTER_AUTH_SECRET=[^\s]+/g, 'BETTER_AUTH_SECRET=[redacted]')
      .replace(/RESEND_API_KEY=[^\s]+/g, 'RESEND_API_KEY=[redacted]')
      .replace(/AUTH_FROM_EMAIL=[^\s]+/g, 'AUTH_FROM_EMAIL=[redacted]')
      .replace(/([?&]token=)[^&\s]+/gi, '$1[redacted]');
    console.error(safeOutput.split('\n').slice(-80).join('\n'));
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  await stopPreview();
  if (mailSink) {
    await new Promise((resolve) => mailSink.close(resolve));
  }
  if (previousVars) {
    await writeFile(varsPath, previousVars);
  } else {
    await unlink(varsPath).catch(() => {});
  }
}
