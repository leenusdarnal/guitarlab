<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';
  import { accountProfileUpdateSchema } from '../../lib/domain/profile/account-profile';
  import { authClient } from '../../lib/auth-client';

  let { data }: PageProps = $props();

  let displayName = $state(data.account.name);
  let avatarUrl = $state(data.account.image ?? '');
  let savingProfile = $state(false);
  let signingOut = $state(false);
  let avatarLoadFailed = $state(false);
  let profileMessage = $state('');
  let profileError = $state('');
  let signOutError = $state('');

  function getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'GL';
  }

  function getAvatarPreviewUrl(): string | null {
    const candidate = avatarUrl.trim();
    if (candidate) {
      try {
        const url = new URL(candidate);
        if (url.protocol === 'https:' && !url.username && !url.password) {
          return url.href;
        }
      } catch {
        // Keep the current provider image visible while an invalid URL is edited.
      }
    }

    return data.account.image ?? null;
  }

  async function saveProfile(event: SubmitEvent) {
    event.preventDefault();
    if (savingProfile) return;

    const parsed = accountProfileUpdateSchema.safeParse({
      name: displayName,
      image: avatarUrl.trim() ? avatarUrl.trim() : null
    });

    if (!parsed.success) {
      profileError = 'Enter a display name (up to 80 characters) and, optionally, a valid HTTPS image URL.';
      profileMessage = '';
      return;
    }

    savingProfile = true;
    profileError = '';
    profileMessage = '';

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });
      if (!response.ok) {
        profileError = 'We could not update your account profile. Please try again.';
        return;
      }

      displayName = parsed.data.name;
      avatarUrl = parsed.data.image ?? '';
      avatarLoadFailed = false;
      await invalidateAll();
      profileMessage = 'Your account profile has been updated.';
    } catch {
      profileError = 'We could not update your account profile. Please try again.';
    } finally {
      savingProfile = false;
    }
  }

  async function signOut() {
    if (signingOut) return;

    signingOut = true;
    signOutError = '';

    try {
      const result = await authClient.signOut();
      if (result.error) {
        signOutError = 'We could not sign you out. Please try again.';
        return;
      }

      await goto(resolve('/'), { invalidateAll: true });
    } catch {
      signOutError = 'We could not sign you out. Please try again.';
    } finally {
      signingOut = false;
    }
  }
</script>

<svelte:head>
  <title>Your account · GuitarLab</title>
  <meta name="description" content="Manage your GuitarLab account profile, session and sign-in." />
</svelte:head>

<main id="main-content" tabindex="-1" class="account-page">
  <header class="page-heading">
    <p class="eyebrow">YOUR GUITARLAB ACCOUNT</p>
    <h1>Account settings</h1>
    <p class="intro">Your account manages sign-in and account identity. Your learner profile and practice history remain separate and local to this device.</p>
  </header>

  <div class="account-layout">
    <section class="account-card profile-card" aria-labelledby="profile-title">
      <div class="profile-heading">
        <div class="avatar" aria-label="Profile image preview">
          {#if getAvatarPreviewUrl() && !avatarLoadFailed}
            <img
              src={data.account.image}
              alt={`${data.account.name} profile`}
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
              onerror={() => (avatarLoadFailed = true)}
            />
          {:else}
            <span aria-hidden="true">{getInitials(data.account.name)}</span>
          {/if}
        </div>
        <div>
          <h2 id="profile-title">Account profile</h2>
          <p>Choose how your account appears in GuitarLab.</p>
        </div>
      </div>

      <form class="profile-form" onsubmit={saveProfile}>
        <label for="account-name">Display name</label>
        <input
          id="account-name"
          name="name"
          type="text"
          autocomplete="name"
          minlength="1"
          maxlength="80"
          required
          bind:value={displayName}
          disabled={savingProfile}
        />

        <label for="account-image">Profile image URL <span>(optional)</span></label>
        <input
          id="account-image"
          name="image"
          type="url"
          inputmode="url"
          autocomplete="url"
          maxlength="2048"
          placeholder="https://example.com/your-image.png"
          bind:value={avatarUrl}
          disabled={savingProfile}
          aria-describedby="account-image-help"
        />
        <p id="account-image-help" class="field-help">Use an HTTPS image URL. GuitarLab does not upload or host profile pictures; your browser loads the image from that address. Leave it blank to remove your custom image.</p>

        {#if profileError}
          <p class="feedback error" role="alert">{profileError}</p>
        {:else if profileMessage}
          <p class="feedback success" role="status">{profileMessage}</p>
        {/if}

        <button class="primary-action" type="submit" disabled={savingProfile}>
          {savingProfile ? 'Saving profile…' : 'Save account profile'}
        </button>
      </form>
    </section>

    <div class="account-secondary">
      <section class="account-card" aria-labelledby="identity-title">
        <h2 id="identity-title">Sign-in identity</h2>
        <div class="account-detail">
          <span class="detail-label">Email address</span>
          <strong>{data.account.email}</strong>
          <span class="verification-status">
            {data.account.emailVerified ? 'Verified by your identity provider' : 'Not marked verified by your identity provider'}
          </span>
        </div>
        <p class="field-help">Your email address is managed by the Google or GitHub identity provider and cannot be changed here. GuitarLab does not offer email/password sign-up.</p>
      </section>

      <section class="account-card" aria-labelledby="session-title">
        <h2 id="session-title">Current session</h2>
        <div class="session-status" role="status">You are signed in on this device.</div>
        <div class="account-detail">
          <span class="detail-label">Session expires</span>
          <strong>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.session.expiresAt))}</strong>
        </div>
      </section>

      <section class="account-card links-card" aria-labelledby="learning-title">
        <h2 id="learning-title">Your learning space</h2>
        <p>Your learner profile describes your guitar experience, goals and practice preferences. It stays available when you use GuitarLab as a guest.</p>
        <a class="secondary-action" href={resolve('/onboarding')}>Open learner profile</a>
        <a class="text-action" href={resolve('/settings/data')}>Manage local data &amp; backups</a>
      </section>
    </div>
  </div>

  <section class="signout-card" aria-label="Sign out">
    <div>
      <h2>Finished for now?</h2>
      <p>Signing out ends this account session. It does not delete your learner profile or practice data from this device.</p>
      {#if signOutError}
        <p class="feedback error" role="alert">{signOutError}</p>
      {/if}
    </div>
    <button class="signout-action" type="button" onclick={signOut} disabled={signingOut}>
      {signingOut ? 'Signing out…' : 'Sign out'}
    </button>
  </section>
</main>

<style>
  .account-page{width:min(100% - 32px,1040px);margin:0 auto;padding:clamp(30px,5vw,64px) 0 100px}
  .page-heading{max-width:700px;margin:0 0 28px}
  .eyebrow{margin:0 0 10px;color:var(--primary);font-size:11px;font-weight:800;letter-spacing:.12em}
  h1{margin:0;color:var(--text);font-size:clamp(28px,5vw,40px);line-height:1.12;letter-spacing:-.035em}
  .intro{max-width:650px;margin:12px 0 0;color:var(--muted);font-size:14px;line-height:1.65}
  h2{margin:0;color:var(--text);font-size:17px;letter-spacing:-.02em}
  .account-layout{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(280px,.92fr);align-items:start;gap:18px}
  .account-secondary{display:grid;gap:16px}
  .account-card{min-width:0;padding:clamp(20px,3vw,28px);border:1px solid var(--border);border-radius:18px;background:var(--surface);box-shadow:0 12px 38px #0000000b}
  .profile-heading{display:flex;align-items:center;gap:15px;margin-bottom:24px}
  .profile-heading p,.links-card p{margin:6px 0 0;color:var(--muted);font-size:13px;line-height:1.55}
  .avatar{display:grid;place-items:center;width:64px;height:64px;flex:none;overflow:hidden;border:1px solid var(--border);border-radius:50%;background:var(--surface-raised);color:var(--primary);font-size:20px;font-weight:800}
  .avatar img{width:100%;height:100%;object-fit:cover}
  .profile-form{display:grid;gap:9px}
  .profile-form label{margin-top:7px;color:var(--text);font-size:13px;font-weight:750}
  .profile-form label span{color:var(--muted);font-weight:500}
  .profile-form input{width:100%;min-height:46px;padding:10px 12px;border:1px solid var(--border-strong);border-radius:9px;background:var(--surface-raised);color:var(--text);font:inherit;font-size:14px}
  .profile-form input:focus-visible,.primary-action:focus-visible,.signout-action:focus-visible,.secondary-action:focus-visible,.text-action:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  .profile-form input:disabled{opacity:.65}
  .field-help{margin:2px 0 8px;color:var(--muted);font-size:12px;line-height:1.6}
  .primary-action,.signout-action,.secondary-action{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 15px;border-radius:9px;font:inherit;font-size:13px;font-weight:800;text-decoration:none;cursor:pointer}
  .primary-action{margin-top:8px;border:1px solid var(--primary);background:var(--primary);color:var(--primary-ink)}
  .primary-action:disabled,.signout-action:disabled{opacity:.6;cursor:wait}
  .account-detail{display:grid;gap:7px;padding:16px 0;border-top:1px solid var(--border);color:var(--text)}
  .detail-label{color:var(--muted);font-size:12px;font-weight:700}
  .account-detail strong{font-size:14px;overflow-wrap:anywhere}
  .verification-status{width:max-content;max-width:100%;padding:4px 8px;border-radius:6px;background:var(--surface-raised);color:var(--muted);font-size:11px;font-weight:700}
  .session-status{margin:17px 0 0;padding:12px 13px;border:1px solid var(--border);border-radius:9px;background:var(--surface-raised);color:var(--text);font-size:13px;line-height:1.5}
  .links-card p{margin-bottom:14px}
  .secondary-action{width:100%;border:1px solid var(--border-strong);background:var(--surface-raised);color:var(--text)}
  .text-action{display:inline-flex;min-height:42px;align-items:center;margin-top:8px;color:var(--primary);font-size:13px;font-weight:750}
  .feedback{margin:8px 0;padding:11px 12px;border-radius:8px;font-size:12px;line-height:1.55}
  .feedback.error{border:1px solid color-mix(in srgb,#c44848 45%,var(--border));background:color-mix(in srgb,#c44848 8%,var(--surface));color:var(--text)}
  .feedback.success{border:1px solid color-mix(in srgb,#25865b 40%,var(--border));background:color-mix(in srgb,#25865b 8%,var(--surface));color:var(--text)}
  .signout-card{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:18px;padding:20px 24px;border:1px solid var(--border);border-radius:16px;background:var(--surface)}
  .signout-card p{max-width:650px;margin:6px 0 0;color:var(--muted);font-size:12px;line-height:1.55}
  .signout-action{flex:none;border:1px solid var(--border-strong);background:var(--surface);color:var(--text)}
  @media(max-width:760px){.account-layout{grid-template-columns:minmax(0,1fr)}.signout-card{align-items:stretch;flex-direction:column}.signout-action{width:100%}}
</style>
