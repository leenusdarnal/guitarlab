<script lang="ts">
  import { navigating } from '$app/state';
</script>

{#if navigating?.to?.url.pathname.startsWith('/learn')}
  <div class="loading" role="status" aria-live="polite">Loading authored lesson content…</div>
{/if}
<slot />

<style>
  .loading{position:sticky;top:0;z-index:10;padding:10px 16px;background:var(--surface-raised);border-bottom:1px solid var(--border);color:var(--muted);font-size:11px;text-align:center}
</style>
