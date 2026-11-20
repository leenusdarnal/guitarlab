<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { authClient } from '../../lib/auth-client';

  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  type Mode = 'sign-in' | 'sign-up' | 'request-reset' | 'reset-password';

  let mode = $state<Mode>(
    page.url.searchParams.get('mode') === 'reset' ? 'reset-password' : 'sign-in'
  );
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let busy = $state(false);
  let errorMessage = $state('');
  let statusMessage = $state('');

  const resetToken = $derived(page.url.searchParams.get('token'));
  const verificationComplete = $derived(page.url.searchParams.get('verified') === '1');
  const invalidResetToken = $derived(page.url.searchParams.get('error') === 'INVALID_TOKEN');

  function selectMode(nextMode: Mode) {
    mode = nextMode;
    errorMessage = '';
    statusMessage = '';
    password = '';
    confirmPassword = '';
  }

  async function signInSocial(provider: 'google' | 'github') {
    if (busy) return;
    busy = true;
    errorMessage = '';
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin + '/'
      });
      if (result.error) errorMessage = 'We could not start social sign-in. Please try again.';
    } catch {
      errorMessage = 'Something went wrong. Please try again.';
    } finally {
      busy = false;
    }
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;

    errorMessage = '';
    statusMessage = '';
    busy = true;

    try {
      if (mode === 'sign-in') {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: window.location.origin + '/'
        });

        if (result.error) {
          errorMessage = 'We could not sign you in. Check your details, and make sure your email address is verified.';
          return;
        }

        await goto(resolve('/'));
        return;
      }

      if (mode === 'sign-up') {
        if (password !== confirmPassword) {
          errorMessage = 'Your passwords do not match.';
          return;
        }

        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
          callbackURL: window.location.origin + '/login?verified=1'
        });

        if (result.error) {
          errorMessage = 'We could not create the account. Check your details and try again.';
          return;
        }

        statusMessage = 'If the address can be registered, a verification link will arrive by email. Verify the address before signing in.';
        mode = 'sign-in';
        password = '';
        confirmPassword = '';
        return;
      }

      if (mode === 'request-reset') {
        const result = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: window.location.origin + '/login?mode=reset'
        });

        if (result.error) {
          errorMessage = 'We could not process that request. Please try again later.';
          return;
        }

        statusMessage = 'If an account matches that address, a password-reset link will be sent. Check your inbox.';
        return;
      }

      if (!resetToken) {
        errorMessage = 'This reset link is missing its token. Request a new reset link.';
        return;
      }

      if (password !== confirmPassword) {
        errorMessage = 'Your passwords do not match.';
        return;
      }

      const result = await authClient.resetPassword({
        newPassword: password,
        token: resetToken
      });

      if (result.error) {
        errorMessage = 'This reset link is invalid or expired. Request a new one.';
        return;
      }

      selectMode('sign-in');
      statusMessage = 'Your password has been updated. Sign in with your new password.';
      password = '';
      confirmPassword = '';
    } catch {
      errorMessage = 'Something went wrong. Please try again.';
    } finally {
      busy = false;
    }
  }

  async function resendVerification() {
    if (busy || !email.trim()) {
      errorMessage = 'Enter your email address first.';
      return;
    }

    busy = true;
    errorMessage = '';
    statusMessage = '';

    try {
      const result = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: window.location.origin + '/login?verified=1'
      });

      if (result.error) {
        statusMessage = 'If the address needs verification, a new link will be sent.';
      } else {
        statusMessage = 'If the address needs verification, a new link will be sent.';
      }
    } catch {
      statusMessage = 'If the address needs verification, a new link will be sent.';
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in · GuitarLab</title>
  <meta
    name="description"
    content="Sign in or create an optional GuitarLab account. You can always keep learning as a guest."
  />
</svelte:head>

<main class="auth-page">
  <section class="auth-card" aria-labelledby="auth-title">
    <p class="eyebrow">YOUR LEARNING, YOUR CHOICE</p>
    <h1 id="auth-title">
      {mode === 'sign-up'
        ? 'Create your account'
        : mode === 'request-reset'
          ? 'Reset your password'
          : mode === 'reset-password'
            ? 'Choose a new password'
            : 'Welcome back'}
    </h1>
    <p class="intro">
      An account is optional. Your lessons and local progress remain available without signing in.
    </p>

    {#if !data.authAvailable}
      <div class="configuration-notice" role="status">
        <strong>Account access is not enabled here yet.</strong>
        <span>
          GuitarLab is still available in guest mode. Account access requires its own database, secure server configuration and verified email delivery.
        </span>
      </div>
    {:else}
      {#if verificationComplete}
        <div class="notice success" role="status">
          Your email has been verified. You can now sign in.
        </div>
      {/if}
      {#if invalidResetToken}
        <div class="notice warning" role="alert">
          That password-reset link is invalid or has expired. Request a new one below.
        </div>
      {/if}

      {#if mode === 'sign-in' || mode === 'sign-up'}
        <div class="mode-switch" role="group" aria-label="Account action">
          <button
            type="button"
            class:active={mode === 'sign-in'}
            aria-pressed={mode === 'sign-in'}
            onclick={() => selectMode('sign-in')}
          >Sign in</button>
          <button
            type="button"
            class:active={mode === 'sign-up'}
            aria-pressed={mode === 'sign-up'}
            onclick={() => selectMode('sign-up')}
          >Create account</button>
        </div>
      {/if}

      <div class="social-actions" aria-label="Sign in with a social account">
        <button class="social-action" type="button" onclick={() => signInSocial('google')} disabled={busy}>
          Continue with Google
        </button>
        <button class="social-action" type="button" onclick={() => signInSocial('github')} disabled={busy}>
          Continue with GitHub
        </button>
      </div>
      <p class="social-caption">Use an existing account. No email service is needed for social sign-in.</p>

      <form onsubmit={submit}>
        {#if mode === 'sign-up'}
          <label>
            <span>Your name</span>
            <input
              type="text"
              name="name"
              autocomplete="name"
              bind:value={name}
              minlength="2"
              maxlength="80"
              required
            />
          </label>
        {/if}

        {#if mode !== 'reset-password'}
          <label>
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autocomplete="email"
              bind:value={email}
              maxlength="254"
              required
            />
          </label>
        {/if}

        {#if mode === 'sign-in' || mode === 'sign-up' || (mode === 'reset-password' && resetToken)}
          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              autocomplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              bind:value={password}
              minlength={mode === 'sign-in' ? 1 : 12}
              maxlength="128"
              required
            />
            {#if mode !== 'sign-in'}
              <small>Use at least 12 characters.</small>
            {/if}
          </label>
        {/if}

        {#if mode === 'sign-up' || (mode === 'reset-password' && resetToken)}
          <label>
            <span>Confirm password</span>
            <input
              type="password"
              name="confirmPassword"
              autocomplete="new-password"
              bind:value={confirmPassword}
              minlength="12"
              maxlength="128"
              required
            />
          </label>
        {/if}

        {#if errorMessage}
          <p class="notice error" role="alert">{errorMessage}</p>
        {/if}
        {#if statusMessage}
          <p class="notice success" role="status">{statusMessage}</p>
        {/if}

        {#if mode === 'reset-password' && !resetToken}
          <p class="notice warning" role="status">
            Open the password-reset link from your email, or request a fresh link.
          </p>
          <button type="button" class="secondary-action" onclick={() => selectMode('request-reset')}>
            Request a new reset link
          </button>
        {:else}
          <button class="primary-action" type="submit" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'sign-in'
                ? 'Sign in'
                : mode === 'sign-up'
                  ? 'Create account'
                  : mode === 'request-reset'
                    ? 'Send reset link'
                    : 'Save new password'}
          </button>
        {/if}
      </form>

      {#if mode === 'sign-in'}
        <div class="account-links">
          <button type="button" class="text-action" onclick={() => selectMode('request-reset')}>
            Forgot your password?
          </button>
          <button type="button" class="text-action" onclick={resendVerification} disabled={busy}>
            Resend verification email
          </button>
        </div>
      {:else if mode !== 'sign-up'}
        <button type="button" class="text-action back-link" onclick={() => selectMode('sign-in')}>
          Back to sign in
        </button>
      {/if}
    {/if}

    <div class="guest-divider"><span>OR</span></div>
    <a class="guest-action" href={resolve('/')}>Continue as guest</a>
    <p class="privacy-note">
      Creating an account does not upload your existing practice history or local learner profile.
    </p>
  </section>
</main>

<style>
  .auth-page{min-height:calc(100svh - 140px);display:grid;place-items:center;padding:clamp(24px,5vw,64px) 16px 96px;background:var(--bg)}
  .auth-card{width:min(100%,480px);padding:clamp(24px,5vw,40px);border:1px solid var(--border);border-radius:22px;background:var(--surface);box-shadow:0 18px 55px #00000012}
  .eyebrow{margin:0 0 12px;color:var(--primary);font-size:11px;font-weight:800;letter-spacing:.12em}
  h1{margin:0;color:var(--text);font-size:clamp(26px,5vw,34px);line-height:1.15;letter-spacing:-.035em}
  .intro{margin:12px 0 24px;color:var(--muted);font-size:14px;line-height:1.65}
  .social-actions{display:grid;gap:10px;margin:18px 0 0}
  .social-action{min-height:48px;padding:12px 16px;border:1px solid var(--border-strong);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;font-size:14px;font-weight:800;cursor:pointer}
  .social-action:disabled{opacity:.6;cursor:wait}
  .social-action:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  .social-caption{margin:8px 0 18px;color:var(--muted);font-size:11px;text-align:center}
  form{display:grid;gap:16px}
  label{display:grid;gap:7px;color:var(--text);font-size:13px;font-weight:700}
  input{width:100%;min-height:48px;padding:11px 13px;border:1px solid var(--border-strong);border-radius:10px;background:var(--bg);color:var(--text);font:inherit;font-size:15px}
  input:focus-visible{outline:3px solid var(--focus);outline-offset:2px;border-color:var(--primary)}
  small{color:var(--muted);font-size:12px;font-weight:500}
  .mode-switch{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:18px;padding:4px;border:1px solid var(--border);border-radius:12px;background:var(--bg)}
  .mode-switch button{min-height:42px;border:0;border-radius:9px;background:transparent;color:var(--muted);font:inherit;font-size:13px;font-weight:750;cursor:pointer}
  .mode-switch button.active{background:var(--surface);color:var(--text);box-shadow:0 1px 4px #00000012}
  .mode-switch button:focus-visible,.text-action:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
  .primary-action,.secondary-action,.guest-action{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:12px 16px;border-radius:10px;font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer}
  .primary-action{border:1px solid var(--primary);background:var(--primary);color:var(--primary-ink)}
  .primary-action:disabled{opacity:.65;cursor:wait}
  .secondary-action{border:1px solid var(--border-strong);background:var(--surface);color:var(--text)}
  .guest-action{border:1px solid var(--border-strong);background:var(--surface);color:var(--text)}
  .primary-action:focus-visible,.secondary-action:focus-visible,.guest-action:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  .account-links{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px}
  .text-action{padding:6px 0;border:0;background:transparent;color:var(--primary);font:inherit;font-size:12px;font-weight:750;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
  .text-action:disabled{opacity:.6}
  .back-link{margin-top:14px}
  .notice,.configuration-notice{display:grid;gap:5px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;font-size:13px;line-height:1.55}
  .notice.success{border-color:color-mix(in srgb,#25865b 40%,var(--border));background:color-mix(in srgb,#25865b 8%,var(--surface));color:var(--text)}
  .notice.warning{background:var(--surface-raised);color:var(--text)}
  .notice.error{border-color:color-mix(in srgb,#c44848 45%,var(--border));background:color-mix(in srgb,#c44848 8%,var(--surface));color:var(--text)}
  .configuration-notice{margin:22px 0;border-color:var(--border-strong);background:var(--surface-raised);color:var(--text)}
  .configuration-notice span{color:var(--muted)}
  .guest-divider{display:flex;align-items:center;gap:12px;margin:24px 0 14px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.12em}
  .guest-divider::before,.guest-divider::after{height:1px;flex:1;background:var(--border);content:''}
  .privacy-note{margin:14px 0 0;color:var(--muted);font-size:11px;line-height:1.55;text-align:center}
  @media(max-width:480px){.auth-page{padding-inline:12px}.auth-card{padding:22px 18px;border-radius:16px}.account-links{display:grid;justify-items:start}}
</style>
