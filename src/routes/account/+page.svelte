<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';
  import { authClient } from '../../lib/auth-client';

  let { data }: PageProps = $props();

  let signingOut = $state(false);
  let errorMessage = $state('');

  async function signOut() {
    if (signingOut) return;

    signingOut = true;
    errorMessage = '';

    try {
      const result = await authClient.signOut();
      if (result.error) {
        errorMessage = 'We could not sign you out. Please try again.';
        return;
      }

      await goto(resolve('/'), { invalidateAll: true });
    } catch {
      errorMessage = 'We could not sign you out. Please try again.';
    } finally {
      signingOut = false;
    }
  }
</script>

<svelte:head>
  <title>Your account · GuitarLab</title>
  <meta name="description" content="Manage your GuitarLab account and sign out securely." />
</svelte:head>

<main id="main-content" tabindex="-1" class="account-page">
  <section class="account-card" aria-labelledby="account-title">
    <p class="eyebrow">YOUR GUITARLAB ACCOUNT</p>
    <h1 id="account-title">Account</h1>
    <p class="intro">
      Your account controls sign-in only. Your existing lessons, practice history and learner profile remain on this device.
    </p>

    <div class="account-detail">
      <span class="detail-label">Name</span>
      <strong>{data.account.name}</strong>
    </div>
    <div class="account-detail">
      <span class="detail-label">Email address</span>
      <strong>{data.account.email}</strong>
      <span class="verification-status">
        {data.account.emailVerified ? 'Email verified' : 'Email verification required'}
      </span>
    </div>
    <div class="session-status" role="status">
      Your sign-in session is active on this device.
    </div>

    {#if errorMessage}
      <p class="error-message" role="alert">{errorMessage}</p>
    {/if}

    <button class="signout-action" type="button" onclick={signOut} disabled={signingOut}>
      {signingOut ? 'Signing out…' : 'Sign out'}
    </button>
    <a class="guest-action" href={resolve('/')}>Return to GuitarLab</a>

    <p class="privacy-note">
      Signing out does not delete local learner data or change the guest learning experience.
    </p>
  </section>
</main>

<style>
  .account-page{min-height:calc(100svh - 140px);display:grid;place-items:center;padding:clamp(24px,5vw,64px) 16px 96px;background:var(--bg)}
  .account-card{width:min(100%,520px);padding:clamp(24px,5vw,40px);border:1px solid var(--border);border-radius:22px;background:var(--surface);box-shadow:0 18px 55px #00000012}
  .eyebrow{margin:0 0 12px;color:var(--primary);font-size:11px;font-weight:800;letter-spacing:.12em}
  h1{margin:0;color:var(--text);font-size:clamp(26px,5vw,34px);line-height:1.15;letter-spacing:-.035em}
  .intro{margin:12px 0 25px;color:var(--muted);font-size:14px;line-height:1.65}
  .account-detail{display:grid;gap:6px;padding:16px 0;border-top:1px solid var(--border);color:var(--text)}
  .detail-label{color:var(--muted);font-size:12px;font-weight:700}
  .account-detail strong{font-size:15px;overflow-wrap:anywhere}
  .verification-status{width:max-content;max-width:100%;padding:4px 8px;border-radius:6px;background:color-mix(in srgb,#25865b 10%,var(--surface));color:var(--text);font-size:11px;font-weight:750}
  .session-status{margin:18px 0;padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--surface-raised);color:var(--text);font-size:13px;line-height:1.5}
  .error-message{margin:14px 0;padding:12px 14px;border:1px solid color-mix(in srgb,#c44848 45%,var(--border));border-radius:10px;background:color-mix(in srgb,#c44848 8%,var(--surface));color:var(--text);font-size:13px;line-height:1.55}
  .signout-action,.guest-action{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;margin-top:12px;padding:12px 16px;border-radius:10px;font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer}
  .signout-action{border:1px solid var(--primary);background:var(--primary);color:var(--primary-ink)}
  .signout-action:disabled{opacity:.65;cursor:wait}
  .guest-action{border:1px solid var(--border-strong);background:var(--surface);color:var(--text)}
  .signout-action:focus-visible,.guest-action:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  .privacy-note{margin:15px 0 0;color:var(--muted);font-size:11px;line-height:1.55;text-align:center}
</style>
