<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    getLocalStoragePersistenceStatus,
    requestLocalStoragePersistence,
    type LocalStoragePersistenceStatus
  } from '../../../lib/storage/persistence';
  import { exportActiveLearnerBackup } from '../../../lib/storage/backup-storage';
  import {
    resetActiveLearnerData,
    restoreLearnerBackup,
    reviewLearnerBackup,
    type RestoreReview
  } from '../../../lib/storage/restore-storage';

  let isExporting = $state(false);
  let isReviewing = $state(false);
  let isRestoring = $state(false);
  let isResetting = $state(false);
  let message = $state('');
  let messageIsError = $state(false);
  let review = $state<Extract<RestoreReview, { success: true }> | null>(null);
  let selectedFileName = $state('');
  let restoreConfirmed = $state(false);
  let resetPhrase = $state('');
  let storageStatus = $state<LocalStoragePersistenceStatus | null>(null);
  let isCheckingStorage = $state(true);
  let isRequestingPersistence = $state(false);

  onMount(() => {
    void refreshStorageStatus();
  });

  async function refreshStorageStatus() {
    isCheckingStorage = true;
    try {
      storageStatus = await getLocalStoragePersistenceStatus();
    } finally {
      isCheckingStorage = false;
    }
  }

  async function requestPersistentStorage() {
    isRequestingPersistence = true;
    try {
      storageStatus = await requestLocalStoragePersistence();
      if (storageStatus.persisted) {
        showMessage('This browser has granted persistent storage. Keep exporting backups for recovery.');
      } else if (storageStatus.canRequest) {
        showMessage('The browser did not grant persistent storage. Your data remains best-effort; keep a downloaded backup.', true);
      } else {
        showMessage('This browser does not support a persistent-storage request. Keep a downloaded backup.', true);
      }
    } finally {
      isRequestingPersistence = false;
    }
  }

  function formatStorageBytes(bytes: number): string {
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
  }

  function showMessage(value: string, error = false) {
    message = value;
    messageIsError = error;
  }

  async function downloadBackup() {
    isExporting = true;
    showMessage('');
    try {
      const backup = await exportActiveLearnerBackup();
      const file = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `guitarlab-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showMessage('Your learner backup has been prepared and downloaded to this device.');
    } catch {
      showMessage(
        'GuitarLab could not create a backup. Your existing learner data has not been changed.',
        true
      );
    } finally {
      isExporting = false;
    }
  }

  async function selectBackup(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    review = null;
    restoreConfirmed = false;
    showMessage('');
    if (!file) {
      selectedFileName = '';
      return;
    }

    selectedFileName = file.name;
    if (file.size > 10_000_000) {
      showMessage('This file is too large. Choose a backup smaller than 10 MB.', true);
      input.value = '';
      return;
    }

    isReviewing = true;
    try {
      const result = await reviewLearnerBackup(await file.text());
      if (!result.success) {
        showMessage(result.message, true);
        return;
      }
      review = result;
      showMessage('Backup validated. Review the replacement preview before restoring.');
    } catch {
      showMessage('GuitarLab could not read this backup from the selected file.', true);
    } finally {
      isReviewing = false;
    }
  }

  async function applyRestore() {
    if (!review || !restoreConfirmed) return;
    isRestoring = true;
    showMessage('');
    try {
      await restoreLearnerBackup(review.backup, true);
      review = null;
      restoreConfirmed = false;
      selectedFileName = '';
      showMessage('Restore completed. Your learner profile and local learning records have been replaced.');
    } catch {
      showMessage(
        'Restore failed. The database transaction was rolled back and the existing learner data was preserved.',
        true
      );
    } finally {
      isRestoring = false;
    }
  }

  async function resetLearner() {
    if (resetPhrase !== 'RESET') return;
    const confirmed = window.confirm(
      'Reset GuitarLab learner data on this device? This deletes the active profile and its learning history, then creates a fresh empty profile.'
    );
    if (!confirmed) return;

    isResetting = true;
    showMessage('');
    try {
      await resetActiveLearnerData(true);
      review = null;
      restoreConfirmed = false;
      selectedFileName = '';
      resetPhrase = '';
      showMessage('Your active learner data has been reset. A fresh empty profile is ready.');
    } catch {
      showMessage(
        'Reset failed. The database transaction was rolled back and your existing learner data was preserved.',
        true
      );
    } finally {
      isResetting = false;
    }
  }
</script>

<svelte:head>
  <title>Data & backups — GuitarLab</title>
  <meta
    name="description"
    content="Export, restore and safely reset your private GuitarLab learner data."
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
      Export a portable copy of your learner profile, preferences, lesson progress,
      assessment evidence, skill snapshots and practice sessions.
    </p>
    <section class="backup-panel" aria-labelledby="storage-protection-title">
      <div class="backup-icon" aria-hidden="true">◈</div>
      <div>
        <h2 id="storage-protection-title">Browser storage protection</h2>
        {#if isCheckingStorage}
          <p role="status">Checking this browser's storage status…</p>
        {:else if storageStatus?.persisted === true}
          <p>Your browser has granted persistent storage, which reduces automatic eviction risk. Browser settings can still remove site data, so keep a backup.</p>
        {:else if storageStatus?.persisted === false}
          <p>Storage is currently best-effort and may be cleared by the browser under storage pressure. You can ask the browser to preserve this site's data.</p>
        {:else}
          <p>This browser does not report whether storage is persistent. Export a backup regularly and keep it somewhere private.</p>
        {/if}
        {#if storageStatus?.usageBytes !== null && storageStatus?.usageBytes !== undefined && storageStatus.quotaBytes !== null && storageStatus.quotaBytes !== undefined}
          <p>Estimated storage used: {formatStorageBytes(storageStatus.usageBytes)} of {formatStorageBytes(storageStatus.quotaBytes)}.</p>
        {/if}
        <div class="planner-actions">
          {#if storageStatus?.persisted !== true && storageStatus?.canRequest}
            <button class="primary-button" type="button" onclick={requestPersistentStorage} disabled={isRequestingPersistence}>
              {isRequestingPersistence ? 'Requesting…' : 'Request persistent storage'}
            </button>
          {/if}
          <button class="planner-secondary" type="button" onclick={refreshStorageStatus} disabled={isCheckingStorage || isRequestingPersistence}>
            Refresh status
          </button>
        </div>
      </div>
    </section>

    <section class="backup-panel" aria-labelledby="export-title">
      <div class="backup-icon" aria-hidden="true">↓</div>
      <div>
        <h2 id="export-title">Export learner backup</h2>
        <p>
          Create a versioned JSON file from your active learner profile. The export
          stays on this device; nothing is uploaded to a server.
        </p>
        <button class="primary-button" type="button" onclick={downloadBackup} disabled={isExporting}>
          {isExporting ? 'Preparing backup…' : 'Download backup'} <span>→</span>
        </button>
      </div>
    </section>

    <section class="section" aria-labelledby="restore-title">
      <div class="eyebrow">RECOVERY</div>
      <h2 id="restore-title">Restore from a backup</h2>
      <p class="section-copy">
        Select a GuitarLab backup file. It will be validated and previewed before any
        local data is changed.
      </p>
      <label class="file-picker">
        <span>{isReviewing ? 'Checking backup…' : 'Choose backup JSON file'}</span>
        <input
          type="file"
          accept=".json,application/json"
          onchange={selectBackup}
          disabled={isReviewing || isRestoring}
        />
      </label>
      {#if selectedFileName}
        <p class="file-name">Selected: {selectedFileName}</p>
      {/if}

      {#if review}
        <div class="preview" aria-live="polite">
          <h3>Restore preview</h3>
          <p class="section-copy">
            {review.preview.replacesActiveProfile
              ? 'This backup belongs to a different learner profile and will replace the active profile.'
              : 'This backup will replace the records for the active learner profile.'}
          </p>
          <table>
            <thead><tr><th>Data</th><th>Add</th><th>Replace</th><th>Remove</th></tr></thead>
            <tbody>
              {#each Object.entries(review.preview.records) as entry (entry[0])}
                <tr>
                  <td>{entry[0].replace(/([A-Z])/g, ' $1')}</td>
                  <td>{entry[1].add}</td>
                  <td>{entry[1].replace}</td>
                  <td>{entry[1].remove}</td>
                </tr>
              {/each}
              <tr class="total-row">
                <th>Total</th>
                <th>{review.preview.totals.add}</th>
                <th>{review.preview.totals.replace}</th>
                <th>{review.preview.totals.remove}</th>
              </tr>
            </tbody>
          </table>
          <label class="confirm-choice">
            <input type="checkbox" bind:checked={restoreConfirmed} />
            <span>I understand this replaces my current active learner data with the selected backup.</span>
          </label>
          <button
            class="primary-button"
            type="button"
            onclick={applyRestore}
            disabled={!restoreConfirmed || isRestoring}
          >
            {isRestoring ? 'Restoring…' : 'Restore this backup'}
          </button>
        </div>
      {/if}
    </section>

    <section class="section danger-zone" aria-labelledby="reset-title">
      <div class="eyebrow">DESTRUCTIVE ACTION</div>
      <h2 id="reset-title">Reset learner data</h2>
      <p class="section-copy">
        This permanently deletes the active learner profile and its progress, assessments,
        mastery records and practice history from this browser. A new empty profile will
        be created. Export a backup first.
      </p>
      <label class="reset-label" for="reset-confirm">Type RESET to enable reset</label>
      <input
        id="reset-confirm"
        class="reset-input"
        type="text"
        autocomplete="off"
        spellcheck="false"
        bind:value={resetPhrase}
        placeholder="RESET"
      />
      <button
        class="danger-button"
        type="button"
        onclick={resetLearner}
        disabled={resetPhrase !== 'RESET' || isResetting}
      >
        {isResetting ? 'Resetting…' : 'Reset active learner data'}
      </button>
    </section>

    {#if message}
      <p class:error={messageIsError} class="status-message" role="status">{message}</p>
    {/if}

    <p class="privacy-note">
      Your backup contains learner-owned records only. Audio recordings and media files
      are not included. Keep the downloaded file somewhere private and safe. This
      application does not sync learner data to a server.
    </p>
  </section>
</main>

<style>
  .data-page{max-width:820px;margin:0 auto;padding:28px 22px 70px}
  header{display:flex;justify-content:space-between;align-items:center;margin-bottom:52px}
  .brand{display:flex;align-items:center;gap:10px}.mark{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:var(--primary);color:var(--primary-ink);font:700 22px Georgia,serif}.brand strong{font-size:15px}.back-link{font-size:12px;color:var(--muted)}
  .data-card{border:1px solid var(--border);border-radius:22px;background:var(--surface);padding:clamp(22px,5vw,48px)}
  .eyebrow{font-size:10px;letter-spacing:1.3px;color:var(--muted);font-weight:750}
  h1{font:500 clamp(34px,6vw,48px)/1.1 Georgia,serif;letter-spacing:-1.5px;margin:13px 0}h1 em{color:var(--primary)}
  .intro,.section-copy{color:var(--muted);font-size:13px;line-height:1.7;max-width:620px;margin:0 0 20px}
  .backup-panel{display:flex;align-items:flex-start;gap:16px;padding:20px;border:1px solid var(--border);border-radius:14px;background:var(--surface-raised);margin:28px 0}
  .backup-icon{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--primary) 16%,transparent);color:var(--primary);font-size:22px}
  h2{font-size:15px;margin:2px 0 7px}.backup-panel p{font-size:12px;line-height:1.7;color:var(--muted);margin:0 0 14px}
  .primary-button,.danger-button{border:0;border-radius:10px;padding:13px 17px;font-weight:750;font-size:12px;cursor:pointer}.primary-button{background:var(--primary);color:var(--primary-ink)}.primary-button:disabled,.danger-button:disabled{opacity:.45;cursor:not-allowed}.primary-button span{padding-left:12px}
  .section{border-top:1px solid var(--border);padding-top:25px;margin-top:30px}.file-picker{display:inline-flex;align-items:center;position:relative;overflow:hidden;border:1px solid var(--border);border-radius:10px;padding:12px 15px;font-size:12px;font-weight:650;cursor:pointer;background:var(--surface-raised)}.file-picker input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.file-name{font-size:11px;color:var(--muted);margin:10px 0}
  .preview{border:1px solid var(--border);border-radius:13px;padding:18px;margin-top:18px}.preview h3{font-size:14px;margin:0 0 8px}.preview .section-copy{font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:11px;margin:15px 0}th,td{padding:9px 7px;border-bottom:1px solid var(--border);text-align:right}th:first-child,td:first-child{text-align:left;text-transform:capitalize}thead{color:var(--muted)}.total-row{font-weight:750}
  .confirm-choice{display:flex;gap:10px;align-items:flex-start;font-size:11px;line-height:1.6;margin:16px 0}.confirm-choice input{accent-color:var(--primary);margin-top:2px}
  .danger-zone{border:1px solid color-mix(in srgb,var(--danger) 45%,var(--border));border-radius:13px;padding:18px;margin-top:30px}.danger-zone h2{margin-top:9px}.danger-zone .section-copy{margin-bottom:15px}
  .reset-label{display:block;font-size:11px;font-weight:650;margin-bottom:7px}.reset-input{display:block;width:100%;max-width:260px;border:1px solid var(--border);border-radius:9px;padding:11px 12px;background:var(--surface-raised);color:var(--text);font:inherit;font-size:12px;margin-bottom:12px}.danger-button{background:var(--danger);color:#fff}
  .status-message{padding:12px;background:var(--surface-raised);border-radius:9px;font-size:12px;line-height:1.6;margin:16px 0 0}.status-message.error{border:1px solid var(--danger)}
  .privacy-note{border-top:1px solid var(--border);padding-top:18px;margin:24px 0 0;color:var(--muted);font-size:11px;line-height:1.7}
  @media(max-width:520px){header{margin-bottom:28px}.backup-panel{flex-direction:column}.primary-button,.danger-button{width:100%}.preview{padding:12px}th,td{padding:8px 4px;font-size:10px}}
</style>
