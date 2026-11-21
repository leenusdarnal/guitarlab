import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const auth = await readFile(new URL('../src/lib/server/auth.ts', import.meta.url), 'utf8');
const login = await readFile(new URL('../src/routes/login/+page.svelte', import.meta.url), 'utf8');
const account = await readFile(new URL('../src/routes/account/+page.svelte', import.meta.url), 'utf8');
const learnerProfile = await readFile(new URL('../src/routes/onboarding/+page.svelte', import.meta.url), 'utf8');
const learnerStorage = await readFile(new URL('../src/lib/storage/indexeddb.ts', import.meta.url), 'utf8');
const accountProfileEndpoint = await readFile(new URL('../src/routes/api/account/profile/+server.ts', import.meta.url), 'utf8');

assert.match(auth, /socialProviders/);
assert.match(auth, /google:/);
assert.match(auth, /github:/);
assert.doesNotMatch(auth, /RESEND|emailAndPassword|emailVerification|sendTransactionalEmail|request-password-reset/i);
assert.match(login, /Continue with Google/);
assert.match(login, /Continue with GitHub/);
assert.match(login, /Continue as guest/);
assert.doesNotMatch(login, /email address|password|verification email|reset link/i);

console.log('OAuth-only authentication contract passed: Google, GitHub and guest access; no email/password flow.');

assert.match(account, /authClient\.updateUser/);
assert.match(account, /Save account profile/);
assert.match(account, /Open learner profile/);
assert.match(account, /Your email address is managed by the Google or GitHub identity provider/);
assert.doesNotMatch(account, /type="password"|changeEmail|signUp\.email|signIn\.email/i);
assert.match(learnerProfile, /Save learner profile/);
assert.match(learnerProfile, /Local storage|learner profile/);
assert.match(learnerStorage, /saveActiveLearnerPreferences/);
assert.match(learnerStorage, /updateLearnerPreferences/);

console.log('Account and learner profile contract passed: OAuth-managed identity, editable account presentation and device-local learner preferences.');

assert.match(account, /fetch\('\/api\/account\/profile'/);
assert.match(accountProfileEndpoint, /locals\.authUser/);
assert.match(accountProfileEndpoint, /request\.headers\.get\('origin'\)/);
assert.match(accountProfileEndpoint, /accountProfileUpdateSchema\.safeParse/);
assert.match(accountProfileEndpoint, /auth\.api\.updateUser/);
assert.match(accountProfileEndpoint, /headers: request\.headers/);
assert.match(accountProfileEndpoint, /private, no-store/);
