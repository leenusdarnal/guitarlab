<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { loadActiveLearnerProfile } from '../lib/storage/indexeddb';

  let localStorageUnavailable = $state(false);

  onMount(() => {
    void loadActiveLearnerProfile().catch(() => {
      localStorageUnavailable = true;
    });
  });
</script>

{#if localStorageUnavailable}
  <div class="storage-warning" role="alert">
    GuitarLab could not open local learner storage. Your progress will not be saved in this browser until storage is available.
  </div>
{/if}

<slot />

<style>
  .storage-warning {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface-raised);
    color: var(--text);
    font-size: 0.8rem;
    line-height: 1.5;
    text-align: center;
  }
</style>
