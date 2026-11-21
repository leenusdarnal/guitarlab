import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const auth = await readFile(new URL('../src/lib/server/auth.ts', import.meta.url), 'utf8');
const login = await readFile(new URL('../src/routes/login/+page.svelte', import.meta.url), 'utf8');

assert.match(auth, /socialProviders/);
assert.match(auth, /google:/);
assert.match(auth, /github:/);
assert.doesNotMatch(auth, /RESEND|emailAndPassword|emailVerification|sendTransactionalEmail|request-password-reset/i);
assert.match(login, /Continue with Google/);
assert.match(login, /Continue with GitHub/);
assert.match(login, /Continue as guest/);
assert.doesNotMatch(login, /email address|password|verification email|reset link/i);

console.log('OAuth-only authentication contract passed: Google, GitHub and guest access; no email/password flow.');
