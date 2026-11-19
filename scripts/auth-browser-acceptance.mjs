import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium, request } from 'playwright';

const port = Number(process.env.GUITARLAB_AUTH_PREVIEW_PORT ?? 8788);
const origin = `https://localhost:${port}`;
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const wranglerConfigPath = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url));
const testWranglerConfigPath = fileURLToPath(
  new URL(`../.wrangler.auth-test-${randomUUID()}.jsonc`, import.meta.url)
);
const varsPath = fileURLToPath(new URL('../.dev.vars', import.meta.url));
const previousVars = await readFile(varsPath).catch(() => null);
const messages = [];
const sensitiveValues = [];
let mailSink;
let api;
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

async function createHttpsTestConfig() {
  const config = JSON.parse(await readFile(wranglerConfigPath, 'utf8'));
  config.dev = {
    ...config.dev,
    ip: '127.0.0.1',
    port,
    local_protocol: 'https'
  };
  await writeFile(testWranglerConfigPath, JSON.stringify(config, null, 2) + '\n');
}

function startPreview() {
  preview = spawn(
    'npx',
    [
      'wrangler',
      'dev',
      '--config',
      testWranglerConfigPath,
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
      const response = await api.get(origin);
      if (response.ok()) return;
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

function rememberSensitive(value) {
  if (typeof value === 'string' && value.length > 0) {
    sensitiveValues.push(value);
  }
}

function redactSensitiveValues(value) {
  return [...new Set(sensitiveValues)]
    .sort((left, right) => right.length - left.length)
    .reduce((result, secret) => result.split(secret).join('[redacted]'), value)
    .replace(/([?&]token=)[^&\s]+/gi, '$1[redacted]')
    .replace(/(\/(?:reset-password|verify-email)\/)[^/?\s]+/gi, '$1[redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]');
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return redactSensitiveValues(message);
}

async function assertAuthAccessibility(page, routeLabel) {
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () =>
    window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
      }
    })
  );
  const blockers = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact)
  );
  assert.equal(
    blockers.length,
    0,
    'Serious or critical accessibility violations on ' +
      routeLabel +
      ': ' +
      blockers.map((violation) => violation.id).join(', ')
  );
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
  api = await request.newContext({ ignoreHTTPSErrors: true });
  await writeFile(
    varsPath,
    [
      `BETTER_AUTH_SECRET=${randomBytes(32).toString('hex')}`,
      `BETTER_AUTH_URL=${origin}`,
      'RESEND_API_KEY=local-test-only',
      'AUTH_FROM_EMAIL=auth@example.test',
      `AUTH_TEST_MAIL_SINK_URL=http://127.0.0.1:${sinkAddress.port}/emails`,
      'AUTH_TEST_SESSION_EXPIRES_IN_SECONDS=20',
      'AUTH_TEST_SESSION_UPDATE_AGE_SECONDS=3',
      'AUTH_TEST_RESET_TOKEN_EXPIRES_IN_SECONDS=5',
      ''
    ].join('\\n')
  );
  await createHttpsTestConfig();

  startPreview();
  await waitForPreview();

  const crossOriginResponse = await api.post(origin + '/api/auth/sign-in/email', {
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://attacker.example',
      'cf-connecting-ip': '192.0.2.20'
    },
    data: {
      email: 'cross-origin@example.test',
      password: 'not-a-real-password'
    }
  });
  assert.equal(
    crossOriginResponse.status(),
    403,
    'The authentication Worker must reject state-changing requests from an untrusted Origin.'
  );
  assert.equal(
    crossOriginResponse.headers()['set-cookie'] ?? null,
    null,
    'A rejected cross-origin request must not create a session cookie.'
  );

  browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: { 'cf-connecting-ip': '192.0.2.21' }
  });
  const page = await context.newPage();
  const email = `auth-test-${randomUUID()}@example.test`;
  const originalPassword = 'GuitarLab-Test-Password-123!';
  const replacementPassword = 'GuitarLab-New-Password-456!';
  rememberSensitive(email);
  rememberSensitive('cross-origin@example.test');
  rememberSensitive('rate-limit-probe@example.test');
  rememberSensitive('not-a-real-password');
  rememberSensitive('deliberately-invalid-password');
  rememberSensitive(originalPassword);
  rememberSensitive(replacementPassword);

  const loginResponse = await page.goto(origin + '/login');
  assert.equal(
    loginResponse?.headers()['strict-transport-security'],
    'max-age=31536000; includeSubDomains'
  );
  await assertAuthAccessibility(page, '/login (guest)');
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
  rememberSensitive(new URL(verificationUrl).searchParams.get('token') ?? '');
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
  assert.equal(sessionCookie.secure, true);
  assert.equal(sessionCookie.sameSite, 'Lax');
  assert.equal(sessionCookie.path, '/');
  rememberSensitive(sessionCookie.value);
  await assertAuthAccessibility(page, '/account (authenticated)');

  const secondContext = await browser.newContext({
    ignoreHTTPSErrors: true,
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

  const expiredResetEmail = await waitForMessage('Reset your GuitarLab password');
  const expiredResetUrl = extractActionUrl(
    expiredResetEmail,
    (url) =>
      url.pathname === '/login' &&
      url.searchParams.get('mode') === 'reset' &&
      url.searchParams.has('token')
  );
  rememberSensitive(new URL(expiredResetUrl).searchParams.get('token') ?? '');
  await delay(6000);
  await page.goto(expiredResetUrl);
  await assertAuthAccessibility(page, '/login (expired reset token)');
  await page.locator('input[name="password"]').fill(replacementPassword);
  await page.locator('input[name="confirmPassword"]').fill(replacementPassword);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page
    .getByText('This reset link is invalid or expired. Request a new one.')
    .waitFor();

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

  const resetMessageCountBeforeRenewal = messages.filter(
    (message) => message.subject === 'Reset your GuitarLab password'
  ).length;
  await page.goto(origin + '/login');
  await page.getByRole('button', { name: 'Forgot your password?' }).click();
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await page.getByText(/If an account matches that address/).waitFor();
  await waitForMessageCount(
    'Reset your GuitarLab password',
    resetMessageCountBeforeRenewal + 1
  );
  const resetEmail = await waitForMessage('Reset your GuitarLab password');
  const resetUrl = extractActionUrl(
    resetEmail,
    (url) =>
      url.pathname === '/login' &&
      url.searchParams.get('mode') === 'reset' &&
      url.searchParams.has('token')
  );
  rememberSensitive(new URL(resetUrl).searchParams.get('token') ?? '');
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

  const expiryContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: { 'cf-connecting-ip': '192.0.2.24' }
  });
  const expiryPage = await expiryContext.newPage();
  await signIn(expiryPage, email, replacementPassword);
  await expiryPage.waitForURL(origin + '/');
  await expiryPage.goto(origin + '/account');
  const initialExpiryCookie = (await expiryContext.cookies(origin)).find((cookie) =>
    cookie.name.includes('session_token')
  );
  assert.ok(initialExpiryCookie, 'A new session must establish a session cookie.');
  const initialCookieExpiry = initialExpiryCookie.expires;
  rememberSensitive(initialExpiryCookie.value);
  await delay(4000);
  await expiryPage.goto(origin + '/account');
  const refreshedExpiryCookie = (await expiryContext.cookies(origin)).find((cookie) =>
    cookie.name.includes('session_token')
  );
  assert.ok(refreshedExpiryCookie, 'The active session cookie must remain present after refresh.');
  assert.ok(
    refreshedExpiryCookie.expires > initialCookieExpiry + 1,
    'Using a session after updateAge must extend its cookie expiry.'
  );
  rememberSensitive(refreshedExpiryCookie.value);
  await delay(21000);
  await expiryPage.goto(origin + '/account');
  await expiryPage.waitForURL(/\/login(?:$|\?)/);
  await expiryContext.close();

  const rateLimitStatuses = [];
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await api.post(origin + '/api/auth/sign-in/email', {
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        'cf-connecting-ip': '192.0.2.23'
      },
      data: {
        email: 'rate-limit-probe@example.test',
        password: 'deliberately-invalid-password'
      }
    });
    rateLimitStatuses.push(response.status());
    if (response.status() === 429) break;
  }
  assert.ok(
    rateLimitStatuses.includes(429),
    `Repeated invalid sign-in attempts must reach the configured rate limit (received HTTP statuses: ${rateLimitStatuses.join(', ')}).`
  );
  assert.equal(
    sensitiveValues.some((value) => previewOutput.includes(value)),
    false,
    'Worker diagnostics must not contain test email addresses, credentials, cookies or one-time tokens.'
  );

  await secondContext.close();
  await context.close();
  console.log(
    'Authentication browser acceptance passed: verified registration, unverified sign-in rejection, password reset, session revocation, logout and guest-safe routing.'
  );
} catch (error) {
  console.error(safeErrorMessage(error));
  if (previewOutput) {
    const safeOutput = redactSensitiveValues(
      previewOutput
        .replace(/BETTER_AUTH_SECRET=[^\s]+/g, 'BETTER_AUTH_SECRET=[redacted]')
        .replace(/RESEND_API_KEY=[^\s]+/g, 'RESEND_API_KEY=[redacted]')
        .replace(/AUTH_FROM_EMAIL=[^\s]+/g, 'AUTH_FROM_EMAIL=[redacted]')
    );
    console.error(safeOutput.split('\n').slice(-80).join('\n'));
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  await stopPreview();
  if (mailSink) {
    await new Promise((resolve) => mailSink.close(resolve));
  }
  await api?.dispose();
  await unlink(testWranglerConfigPath).catch(() => {});
  if (previousVars) {
    await writeFile(varsPath, previousVars);
  } else {
    await unlink(varsPath).catch(() => {});
  }
}
