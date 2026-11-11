<script lang="ts">
  import { resolve } from '$app/paths';
  import { exportActiveLearnerBackup } from '$lib/storage/backup-storage';

  let isExporting = $state(false);
  let message = $state('');
  let messageIsError = $state(false);

  async function downloadBackup() {
    isExporting = true;
    message = '';
    messageIsError = false;

    try {
      const backup = await exportActiveLearnerBackup();
      const contents = JSON.stringify(backup, null, 2);
      const file = new Blob([contents], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `guitarlab-backup-${date}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      message = 'Your learner backup has been prepared and downloaded to this device.';
    } catch {
      message = 'GuitarLab could not create a backup. Your existing learner data has not been changed.';
      messageIsError = true;
    } finally {
      isExporting = false;
    }
  }
</script>

<svelte:head>
  <title>Data & backups — GuitarLab</title>
  <meta
    name="description"
    content="Export a private, versioned copy of your GuitarLab learner data."
  />
</svelte:head>

<main class="data-page">
  <header>
    <a class="brand" href={resolve('/')}><span class="mark">G</span><strong>GuitarLab</strong></a>
    <a class="back-link" href={resolve('/')}>← Back to dashboard</a>
  </header>

  <section class="data-card">
    <div class="eyebrow">YOUR DATA · STORED ON THIS DEVICE</div>
    <h1>Keep your learning <em>safe.</em></h1>
    <p class="intro">
      Create a portable copy of your learner profile, preferences, lesson progress,
      assessment evidence, skill snapshots and practice sessions.
    </p>

    <div class="backup-panel">
      <div class="backup-icon" aria-hidden="true">↓</div>
      <div>
        <h2>Export learner backup</h2>
        <p>
          GuitarLab validates the backup before downloading it as a versioned JSON file.
          The export stays on your device; nothing is uploaded to a server.
        </p>
      </div>
    </div>

    <button class="primary-button" type="button" onclick={downloadBackup} disabled={isExporting}>
      {isExporting ? 'Preparing backup…' : 'Download backup'} <span>→</span>
    </button>

    {#if message}
      <p class:error={messageIsError} class="status-message" role="status">{message}</p>
    {/if}

    <div class="notice">
      <strong>Restore and reset are not available yet.</strong>
      <p>
        The backup format and restore preview are being implemented first. Do not clear
        browser data or rely on this download as a verified restore until the restore
        workflow is released and tested.
      </p>
    </div>

    <p class="privacy-note">
      Your backup contains learner-owned records only. Audio recordings and media files
      are not included. Keep the downloaded file somewhere private and safe.
    </p>
  </section>
</main>

<style>
  .data-page{max-width:820px;margin:0 auto;padding:28px 22px 70px}
  header{display:flex;justify-content:space-between;align-items:center;margin-bottom:52px}
  .brand{display:flex;align-items:center;gap:10px}
  .mark{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:var(--primary);color:var(--primary-ink);font:700 22px Georgia,serif}
  .brand strong{font-size:15px}
  .back-link{font-size:12px;color:var(--muted)}
  .data-card{border:1px solid var(--border);border-radius:22px;background:var(--surface);padding:clamp(22px,5vw,48px)}
  .eyebrow{font-size:10px;letter-spacing:1.3px;color:var(--muted);font-weight:750}
  h1{font:500 clamp(34px,6vw,48px)/1.1 Georgia,serif;letter-spacing:-1.5px;margin:13px 0}
  h1 em{color:var(--primary)}
  .intro{color:var(--muted);font-size:13px;line-height:1.7;max-width:620px;margin:0 0 32px}
  .backup-panel{display:flex;align-items:flex-start;gap:16px;padding:20px;border:1px solid var(--border);border-radius:14px;background:var(--surface-raised);margin-bottom:20px}
  .backup-icon{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--primary) 16%,transparent);color:var(--primary);font-size:22px}
  h2{font-size:15px;margin:2px 0 7px}
  .backup-panel p,.notice p{font-size:12px;line-height:1.7;color:var(--muted);margin:0}
  .primary-button{border:0;border-radius:10px;padding:13px 17px;background:var(--primary);color:var(--primary-ink);font-weight:750;font-size:12px;cursor:pointer}
  .primary-button:disabled{opacity:.65;cursor:wait}
  .primary-button span{padding-left:12px}
  .status-message{padding:12px;background:var(--surface-raised);border-radius:9px;font-size:12px;line-height:1.6;margin:16px 0 0}
  .status-message.error{border:1px solid var(--danger);color:var(--text)}
  .notice{border:1px solid var(--border);border-radius:12px;padding:16px;margin-top:26px}
  .notice strong{display:block;font-size:12px;margin-bottom:6px}
  .privacy-note{border-top:1px solid var(--border);padding-top:18px;margin:24px 0 0;color:var(--muted);font-size:11px;line-height:1.7}
  @media(max-width:520px){header{margin-bottom:28px}.primary-button{width:100%}}
</style>
