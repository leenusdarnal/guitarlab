<script lang="ts">
  import { authClient } from '../../lib/auth-client';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let busy = $state(false);
  let errorMessage = $state('');

  async function signIn(provider: 'google' | 'github') {
    if (busy) return;
    busy = true;
    errorMessage = '';
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin + '/'
      });
      if (result.error) errorMessage = 'We could not start sign-in. Please try again.';
    } catch {
      errorMessage = 'Something went wrong. Please try again.';
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in · GuitarLab</title>
  <meta name="description" content="Sign in with Google or GitHub, or continue learning as a guest." />
</svelte:head>

<main class="auth-page">
  <section class="auth-card" aria-labelledby="auth-title">
    <p class="eyebrow">YOUR LEARNING, YOUR CHOICE</p>
    <h1 id="auth-title">Welcome to GuitarLab</h1>
    <p class="intro">An account is optional. Your lessons and local progress remain available without signing in.</p>

    {#if !data.authAvailable}
      <div class="notice" role="status">
        <strong>Account access is not enabled here yet.</strong>
        <span>Guest mode is available. Account access requires a database, secure server configuration and at least one configured OAuth provider.</span>
      </div>
    {:else}
      <div class="social-actions" aria-label="Sign in with an account">
        {#if data.googleAvailable}
          <button type="button" onclick={() => signIn('google')} disabled={busy}>Continue with Google</button>
        {/if}
        {#if data.githubAvailable}
          <button type="button" onclick={() => signIn('github')} disabled={busy}>Continue with GitHub</button>
        {/if}
      </div>
      {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}
    {/if}

    <div class="divider"><span>OR</span></div>
    <a class="guest" href="/">Continue as guest</a>
    <p class="privacy">Your local learner profile and practice history stay on this device.</p>
  </section>
</main>

<style>
  .auth-page{min-height:calc(100svh - 140px);display:grid;place-items:center;padding:clamp(24px,5vw,64px) 16px 96px;background:var(--bg)}
  .auth-card{width:min(100%,480px);padding:clamp(24px,5vw,40px);border:1px solid var(--border);border-radius:22px;background:var(--surface);box-shadow:0 18px 55px #00000012}
  .eyebrow{margin:0 0 12px;color:var(--primary);font-size:11px;font-weight:800;letter-spacing:.12em}
  h1{margin:0;color:var(--text);font-size:clamp(26px,5vw,34px);line-height:1.15;letter-spacing:-.035em}
  .intro{margin:12px 0 24px;color:var(--muted);font-size:14px;line-height:1.65}
  .social-actions{display:grid;gap:10px}
  button,.guest{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:12px 16px;border:1px solid var(--border-strong);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer}
  button:disabled{opacity:.6;cursor:wait}
  button:focus-visible,.guest:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  .notice,.error{display:grid;gap:5px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;font-size:13px;line-height:1.55}
  .notice span{color:var(--muted)}
  .error{color:var(--text)}
  .divider{display:flex;align-items:center;gap:12px;margin:24px 0 14px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.12em}
  .divider:before,.divider:after{height:1px;flex:1;background:var(--border);content:''}
  .privacy{margin:14px 0 0;color:var(--muted);font-size:11px;line-height:1.55;text-align:center}
</style>
