<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import Icon from './Icon.svelte';

  const pathname = $derived(page.url.pathname);
</script>

<nav class="mobile-tab-bar" aria-label="Primary navigation">
  <a href={resolve('/')} class:active={pathname === '/'} aria-current={pathname === '/' ? 'page' : undefined}>
    <Icon name="home" size={19} />
    <span>Today</span>
  </a>
  <a href={resolve('/learn')} class:active={pathname.startsWith('/learn')} aria-current={pathname.startsWith('/learn') ? 'page' : undefined}>
    <Icon name="book-open" size={19} />
    <span>Learn</span>
  </a>
  <a href={resolve('/practice')} class:active={pathname.startsWith('/practice')} aria-current={pathname.startsWith('/practice') ? 'page' : undefined}>
    <Icon name="metronome" size={19} />
    <span>Practice</span>
  </a>
  <a href={resolve('/tools')} class:active={pathname.startsWith('/tools')} aria-current={pathname.startsWith('/tools') ? 'page' : undefined}>
    <Icon name="toolbox" size={19} />
    <span>Tools</span>
  </a>
  <a href={resolve('/skills')} class:active={pathname.startsWith('/skills')} aria-current={pathname.startsWith('/skills') ? 'page' : undefined}>
    <Icon name="target" size={19} />
    <span>Progress</span>
  </a>
</nav>

<style>
  .mobile-tab-bar {
    position: fixed;
    z-index: 250;
    inset: auto 0 0;
    display: none;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
    padding: 6px max(6px, env(safe-area-inset-left, 0px))
      calc(6px + env(safe-area-inset-bottom, 0px))
      max(6px, env(safe-area-inset-right, 0px));
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 96%, transparent);
    backdrop-filter: blur(16px);
  }

  .mobile-tab-bar a {
    display: flex;
    min-width: 0;
    min-height: 52px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    border-radius: 9px;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-tab-bar a.active {
    background: color-mix(in srgb, var(--primary) 12%, var(--surface));
    color: var(--primary);
  }

  .mobile-tab-bar a:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: -3px;
  }

  @media (max-width: 760px) {
    .mobile-tab-bar {
      display: grid;
    }
  }
</style>
