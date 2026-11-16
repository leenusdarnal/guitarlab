<script lang="ts">
  type Props = {
    size?: 'small' | 'medium';
    tagline?: boolean;
  };

  let { size = 'small', tagline = false }: Props = $props();
</script>

<span class="brand-lockup" class:medium={size === 'medium'}>
  <img
    class="brand-mark"
    src="/brand/guitarlab-mark.svg"
    alt=""
    aria-hidden="true"
    width={size === 'medium' ? 42 : 34}
    height={size === 'medium' ? 42 : 34}
  />
  <span class="brand-copy">
    <strong class="brand-name"><span>Guitar</span><span class="brand-lab">Lab</span></strong>
    {#if tagline}
      <small class="brand-tagline">LEARN · PRACTISE · MASTER</small>
    {/if}
  </span>
</span>

<style>
  .brand-lockup {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
    color: var(--text);
    text-decoration: none;
  }

  .brand-mark {
    display: block;
    flex: none;
    width: 34px;
    height: 34px;
    object-fit: contain;
  }

  .brand-copy {
    display: grid;
    gap: 3px;
    min-width: 0;
    text-align: left;
    line-height: 1.05;
  }

  .brand-name {
    display: block;
    color: var(--text);
    font-size: 15px;
    font-weight: 850;
    letter-spacing: -0.045em;
    white-space: nowrap;
  }

  .brand-lab {
    color: var(--primary);
  }

  .brand-tagline {
    display: block;
    color: var(--muted);
    font-size: 7px;
    font-weight: 750;
    letter-spacing: 0.13em;
    white-space: nowrap;
  }

  .medium .brand-mark {
    width: 42px;
    height: 42px;
  }

  .medium .brand-name {
    font-size: 16px;
  }

  .medium .brand-tagline {
    font-size: 8px;
  }
</style>
