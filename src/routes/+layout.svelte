<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { loadActiveLearnerProfile } from '../lib/storage/indexeddb';

  let localStorageUnavailable = $state(false);

  onMount(() => {
    // Apply the saved theme for every route, including direct deep links.
    // Theme persistence is optional and must never block learner storage.
    try {
      document.documentElement.dataset.theme =
        window.localStorage.getItem('guitarlab-theme') === 'light' ? 'light' : 'dark';
    } catch {
      document.documentElement.dataset.theme = 'dark';
    }

    void loadActiveLearnerProfile().catch(() => {
      localStorageUnavailable = true;
    });
  });
</script>

<a class="skip-link" href="#main-content">Skip to main content</a>

{#if localStorageUnavailable}
  <div class="storage-warning" role="alert">
    GuitarLab could not open local learner storage. Your progress will not be saved in this browser until storage is available.
  </div>
{/if}

<div id="main-content" tabindex="-1">
  <slot />
</div>

<style>
  .skip-link {
    position: fixed;
    z-index: 1000;
    top: 0.75rem;
    left: 0.75rem;
    padding: 0.75rem 1rem;
    transform: translateY(calc(-100% - 1rem));
    border: 1px solid var(--primary);
    border-radius: 0.75rem;
    background: var(--primary);
    color: var(--primary-ink);
    font-size: 0.875rem;
    font-weight: 700;
    box-shadow: 0 6px 24px #0004;
    transition: transform 140ms ease-out;
  }

  .skip-link:focus {
    transform: translateY(0);
  }

  #main-content:focus {
    outline: none;
  }

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
