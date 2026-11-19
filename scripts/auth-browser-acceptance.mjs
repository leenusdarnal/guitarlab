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
const varsPath = fileURLToPath(new URL('../.dev.vars', import.meta.url));
const previousVars = await readFile(varsPath).catch(() => null);
const messages = [];
let mailSink;
let preview;
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
    'npm',
    ['run', 'preview', '--', '--ip', '127.0.0.1', '--port', String(port)],
    { stdio: 'ignore', detached: process.platform !== 'win32' }
  );
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
  throw new Error('Expected transactional email count was not delivered to the local test sink.');
}

async function waitForMessage(subject) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const message = messages.filter((item) => item.subject === subject).at(-1);
    if (message) return message;
    await delay(100);
  }
  throw new Error('Expected transactional email was not delivered to the local test sink.');
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/([?&]token=)[^&\\s]+/gi, '$1[redacted]')
    .replace(/(\\/(?:reset-password|verify-email)\\/)[^/?\\s]+/gi, '$1[redacted]');
}

function extractActionUrl(message, predicate) {
  const urls = [...message.text.matchAll(/https?:\/\/[^\s<>"']+/g)]
    .map((match) => match[0].replace(/[),.;]+$/, ''));
  const match = urls.find((value) => {
    try {
      return predicate(new URL(value));
    } catch {
      return false;
    }
  });
  assert.ok(match, 'The delivered test email must contain the expected one-time action link.');
  return match;
}

async function signIn(page, email, password) {
  await page.goto(origin + '/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
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
      `BETTER_AUTH_SECRET=${randomBytes(48).toString('base64')}`,
      `BETTER_AUTH_URL=${origin}`,
      'RESEND_API_KEY=local-test-only',
      'AUTH_FROM_EMAIL="GuitarLab <auth@example.test>"',
      `AUTH_TEST_MAIL_SINK_URL=http://127.0.0.1:${sinkAddress.port}/emails`,
      ''
    ].join('\n')
  );

  startPreview();
  await waitForPreview();
  browser = await chromium.launch({ headless: true });

  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `auth-test-${randomUUID()}@example.test`;
  const originalPassword = 'GuitarLab-Test-Password-123!';
  const replacementPassword = 'GuitarLab-New-Password-456!';

  await page.goto(origin + '/login');
  await page.getByRole('button', { name: 'Create account', exact: true }).first().click();
  await page.getByLabel('Your name').fill('GuitarLab Acceptance');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(originalPassword);
  await page.getByLabel('Confirm password').fill(originalPassword);
  await page.getByRole('button', { name: 'Create account', exact: true }).last().click();
  await page.getByText(/If the address can be registered/).waitFor();

  await page.getByRole('button', { name: 'Create account', exact: true }).first().click();
  await page.getByLabel('Your name').fill('Duplicate GuitarLab Acceptance');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(originalPassword);
  await page.getByLabel('Confirm password').fill(originalPassword);
  await page.getByRole('button', { name: 'Create account', exact: true }).last().click();
  await page.getByRole('alert').waitFor();

  await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
  await page.getByLabel('Password').fill(originalPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
  await page.getByRole('alert').waitFor();
  const priorVerificationMessages = messages.filter((message) => message.subject === 'Verify your GuitarLab email').length;
  await page.getByRole('button', { name: 'Resend verification email' }).click();
  await waitForMessageCount('Verify your GuitarLab email', priorVerificationMessages + 1);

  const verificationEmail = await waitForMessage('Verify your GuitarLab email');
  const verificationUrl = extractActionUrl(
    verificationEmail,
    (url) => url.pathname.includes('/api/auth/verify-email')
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
  assert.ok(sessionCookie, 'A successful sign-in must establish a session cookie.');
  assert.equal(sessionCookie.httpOnly, true);
  assert.equal(sessionCookie.sameSite, 'Lax');
  assert.equal(sessionCookie.path, '/');

  const secondContext = await browser.newContext();
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
      url.pathname === '/login' && url.searchParams.has('token')
  );
  await page.goto(resetUrl);
  await page.getByLabel('Password').fill(replacementPassword);
  await page.getByLabel('Confirm password').fill(replacementPassword);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page.getByText('Your password has been updated. Sign in with your new password.').waitFor();
  await page.goto(resetUrl);
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

  await secondContext.close();
  await context.close();
  console.log(
    'Authentication browser acceptance passed: verified registration, unverified sign-in rejection, password reset, session revocation, logout and guest-safe routing.'
  );
} catch (error) {
  console.error(safeErrorMessage(error));
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
