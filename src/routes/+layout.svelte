<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import '../app.css';
  import { loadActiveLearnerProfile } from '../lib/storage/indexeddb';
  import Icon from '../lib/components/Icon.svelte';
  import Brand from '../lib/components/Brand.svelte';
  import MobileTabBar from '../lib/components/MobileTabBar.svelte';
  import type { LayoutProps } from './$types';

  let { data }: LayoutProps = $props();

  let localStorageUnavailable = $state(false);
  let mobileMenuOpen = $state(false);
  let mobileMenuTrigger = $state<HTMLButtonElement | null>(null);
  type ThemePreference = 'system' | 'light' | 'dark';
  type ResolvedTheme = 'dark' | 'light';
  let themePreference = $state<ThemePreference>('system');
  let themeMediaQuery: MediaQueryList | null = null;
  let currentPath = $derived(page.url.pathname);
  let activeSection = $derived(
    currentPath.startsWith('/learn') ? 'learn' :
    currentPath.startsWith('/practice') ? 'practice' :
    currentPath.startsWith('/tools') ? 'tools' :
    currentPath.startsWith('/repertoire') ? 'songs' :
    currentPath.startsWith('/skills') ? 'progress' :
    currentPath.startsWith('/onboarding') || currentPath.startsWith('/settings') ? 'preferences' :
    'today'
  );
  let showPrimaryNavigation = $derived(currentPath !== '/onboarding');

  function isThemePreference(value: string | undefined): value is ThemePreference {
    return value === 'system' || value === 'light' || value === 'dark';
  }

  function applyResolvedTheme(preference: ThemePreference) {
    const resolved: ResolvedTheme =
      preference === 'system'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : preference;

    document.documentElement.dataset.theme = resolved;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', resolved === 'light' ? '#F5F4F0' : '#101318');
  }

  function setThemePreference(preference: ThemePreference) {
    themePreference = preference;
    document.documentElement.dataset.themePreference = preference;
    applyResolvedTheme(preference);
    try {
      window.localStorage.setItem('guitarlab-theme', preference);
    } catch {
      // The visible theme remains available for this session if storage is blocked.
    }
  }

  function accountInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'GL';
  }

  function handleThemePreferenceChange(event: Event) {
    const selected = event.currentTarget as HTMLSelectElement;
    if (isThemePreference(selected.value)) {
      setThemePreference(selected.value);
    }
  }

  afterNavigate(({ type }) => {
    mobileMenuOpen = false;
    const savedPreference = document.documentElement.dataset.themePreference;
    if (isThemePreference(savedPreference)) themePreference = savedPreference;
    void tick().then(() => {
      const mainContent = document.querySelector<HTMLElement>('main');
      if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.tabIndex = -1;
        // Preserve the skip link as the first keyboard stop on initial page load.
        if (type !== 'enter') mainContent.focus({ preventScroll: true });
      }
    });
  });

  onMount(() => {
    // Mark the layout as ready only after Svelte has hydrated and mounted its
    // event handlers. Browser acceptance tests use this to avoid racing SSR.
    document.documentElement.dataset.guitarlabReady = 'true';

    const initialPreference = document.documentElement.dataset.themePreference;
    themePreference = isThemePreference(initialPreference) ? initialPreference : 'system';
    applyResolvedTheme(themePreference);

    themeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = () => {
      if (themePreference === 'system') applyResolvedTheme('system');
    };
    themeMediaQuery.addEventListener('change', handleSystemThemeChange);

    void retryLocalStorage();

    return () => {
      themeMediaQuery?.removeEventListener('change', handleSystemThemeChange);
    };
  });

  async function retryLocalStorage() {
    try {
      await loadActiveLearnerProfile();
      localStorageUnavailable = false;
    } catch {
      localStorageUnavailable = true;
    }
  }

  async function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    if (mobileMenuOpen) {
      await tick();
      document.querySelector<HTMLAnchorElement>('#mobile-more-navigation a')?.focus();
    } else {
      mobileMenuTrigger?.focus();
    }
  }

  function openLearningPath() {
    const progressDetails = document.querySelector<HTMLDetailsElement>('#progress-overview');
    if (progressDetails) progressDetails.open = true;
    closeMobileMenu();
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
    mobileMenuTrigger?.focus();
  }

  function handleNavigationKeydown(event: KeyboardEvent) {
    if (!mobileMenuOpen || event.key !== 'Escape') return;
    event.preventDefault();
    closeMobileMenu();
  }
</script>

<svelte:window onkeydown={handleNavigationKeydown} />

<a class="skip-link" href="#main-content">Skip to main content</a>

{#if localStorageUnavailable}
  <div class="storage-warning" role="alert">
    <span>
      GuitarLab could not open local learner storage. Your progress will not be saved in this browser until storage is available.
    </span>
    <button type="button" onclick={() => void retryLocalStorage()}>Try again</button>
  </div>
{/if}

{#if showPrimaryNavigation}
  <header class="global-nav" class:dashboard-mobile-only={currentPath === '/'}>
    <div class="global-nav-inner">
      <a class="global-brand" href={resolve('/')}>
        <Brand size="small" />
      </a>

      <nav class="desktop-primary-navigation" aria-label="Primary navigation">
        <a class:active={activeSection === 'today'} aria-current={activeSection === 'today' ? 'page' : undefined} href={resolve('/')}>Today</a>
        <a class:active={activeSection === 'learn'} aria-current={activeSection === 'learn' ? 'page' : undefined} href={resolve('/learn')}>Learn</a>
        <a class:active={activeSection === 'practice'} aria-current={activeSection === 'practice' ? 'page' : undefined} href={resolve('/practice')}>Practice</a>
        <a class:active={activeSection === 'tools'} aria-current={activeSection === 'tools' ? 'page' : undefined} href={resolve('/tools')}>Tools</a>
        <a class:active={activeSection === 'songs'} aria-current={activeSection === 'songs' ? 'page' : undefined} href={resolve('/repertoire')}>Songs</a>
        <a class:active={activeSection === 'progress'} aria-current={activeSection === 'progress' ? 'page' : undefined} href={resolve('/skills')}>Progress</a>
        <a class:active={activeSection === 'preferences'} aria-current={activeSection === 'preferences' ? 'page' : undefined} href={resolve('/onboarding')}>Learner profile</a>
      </nav>

      <div class="global-nav-actions">
        <a class="account-link" href={resolve(data.account ? '/account' : '/login')} aria-label={data.account ? 'Account settings for ' + data.account.name : 'Sign in'}>
          {#if data.account}
            <span class="account-initials" aria-hidden="true">{accountInitials(data.account.name)}</span>
            <span>Account</span>
          {:else}
            Sign in
          {/if}
        </a>
        <label class="theme-control">
          <span class="sr-only">Appearance</span>
          <select aria-label="Appearance" value={themePreference} onchange={handleThemePreferenceChange}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <button class="mobile-nav-trigger" type="button" bind:this={mobileMenuTrigger} onclick={toggleMobileMenu} aria-expanded={mobileMenuOpen} aria-controls="mobile-more-navigation" aria-label={mobileMenuOpen ? 'More — close navigation' : 'More — open navigation'}>
          <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={18} /><span>More</span>
        </button>
      </div>
    </div>

    <nav
      class="mobile-more-navigation"
      id="mobile-more-navigation"
      aria-label="More navigation"
      hidden={!mobileMenuOpen}
    >
      <a
        href={resolve('/repertoire')}
        aria-current={activeSection === 'songs' ? 'page' : undefined}
        onclick={closeMobileMenu}
      ><span class="nav-icon" aria-hidden="true"><Icon name="song" size={18} /></span>Songs</a>
      {#if currentPath === '/'}
        <a href="#learning-path" onclick={openLearningPath}><span class="nav-icon" aria-hidden="true"><Icon name="route" size={18} /></span>Learning path</a>
      {/if}
      <a
        href={resolve('/onboarding')}
        aria-current={currentPath.startsWith('/onboarding') ? 'page' : undefined}
        onclick={closeMobileMenu}
      ><span class="nav-icon" aria-hidden="true"><Icon name="settings" size={18} /></span>Learner profile</a>
      <a
        href={resolve('/settings/data')}
        aria-current={currentPath.startsWith('/settings/data') ? 'page' : undefined}
        onclick={closeMobileMenu}
      ><span class="nav-icon" aria-hidden="true"><Icon name="download" size={18} /></span>Data &amp; backups</a>
      <a href={resolve(data.account ? '/account' : '/login')} onclick={closeMobileMenu}>
        <span class="nav-icon" aria-hidden="true"><Icon name="shield-check" size={18} /></span>
        {data.account ? 'Account' : 'Sign in'}
      </a>
      <label class="mobile-theme-control">
        <span>Appearance</span>
        <select aria-label="Appearance" value={themePreference} onchange={handleThemePreferenceChange}>
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </nav>
  </header>
{/if}

<slot />

{#if currentPath !== '/onboarding'}
  <MobileTabBar />
{/if}

<style>
  .skip-link{position:fixed;z-index:1000;top:.75rem;left:.75rem;padding:.75rem 1rem;transform:translateY(calc(-100% - 1rem));border:1px solid var(--primary);border-radius:.75rem;background:var(--primary);color:var(--primary-ink);font-size:.875rem;font-weight:700;box-shadow:0 6px 24px #0004;transition:transform 140ms ease-out}
  .skip-link:focus{transform:translateY(0)}
  #main-content:focus{outline:none}
  .storage-warning{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 16px;padding:.75rem 1rem;border-bottom:1px solid var(--border);background:var(--surface-raised);color:var(--text);font-size:.875rem;line-height:1.5;text-align:center}
  .storage-warning button{min-height:44px;padding:8px 12px;border:1px solid var(--border-strong);border-radius:var(--radius-control);background:var(--surface);color:var(--text);font:inherit;font-size:.8125rem;font-weight:700;cursor:pointer}
  .storage-warning button:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  .global-nav{position:sticky;top:0;z-index:200;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(16px)}
  .global-nav-inner{max-width:1440px;min-height:66px;margin:0 auto;padding:8px clamp(15px,3vw,38px);display:flex;align-items:center;gap:24px}
  .global-brand{display:inline-flex;align-items:center;flex:none}
  .desktop-primary-navigation{display:flex;align-items:center;justify-content:center;gap:4px;flex:1;min-width:0}
  .desktop-primary-navigation a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 11px;border-radius:9px;color:var(--muted);font-size:13px;font-weight:700;white-space:nowrap}
  .desktop-primary-navigation a:hover{background:var(--surface);color:var(--text)}
  .desktop-primary-navigation a.active{background:color-mix(in srgb,var(--primary) 13%,var(--surface));color:var(--primary)}
  .global-nav-actions{display:flex;align-items:center;gap:8px;flex:none}
  .account-link{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:8px 13px;border:1px solid var(--border-strong);border-radius:var(--radius-control);background:var(--surface);color:var(--text);font-size:13px;font-weight:750;white-space:nowrap}
  .account-initials{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:color-mix(in srgb,var(--primary) 14%,var(--surface-raised));color:var(--primary);font-size:10px;font-weight:850}
  .account-link:hover{border-color:var(--primary);color:var(--primary)}
  .account-link:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  .theme-control select{min-height:44px;max-width:132px;padding:8px 28px 8px 10px;border:1px solid var(--border-strong);border-radius:var(--radius-control);background:var(--surface);color:var(--text);font-size:13px;font-weight:700;cursor:pointer}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .mobile-nav-trigger{display:none;align-items:center;gap:8px;min-height:44px;padding:8px 12px;border:1px solid var(--border-strong);border-radius:var(--radius-control);background:var(--surface);color:var(--text);font-size:12px;font-weight:750;cursor:pointer}
  .mobile-more-navigation[hidden]{display:none!important}
  .mobile-nav-trigger :global(svg){flex:none}
  .mobile-more-navigation{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:8px 16px 16px;border-top:1px solid var(--border);background:var(--surface)}
  .mobile-more-navigation a{display:flex;align-items:center;gap:10px;min-height:44px;padding:10px 12px;border-radius:8px;font-size:14px;font-weight:700;color:var(--text)}
  .mobile-more-navigation .nav-icon{display:grid;place-items:center;width:20px;flex:none;color:var(--muted)}
  .mobile-more-navigation a:hover,.mobile-more-navigation a:focus-visible{background:var(--surface-raised)}
  .theme-control select:focus-visible,.mobile-theme-control select:focus-visible,.mobile-nav-trigger:focus-visible,.mobile-more-navigation a:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  @media(max-width:920px){.global-nav-inner{gap:12px}.desktop-primary-navigation{gap:0}.desktop-primary-navigation a{padding-inline:8px;font-size:12px}}
  .mobile-theme-control{display:none}
  .mobile-theme-control select{min-width:112px;min-height:44px;padding:7px 28px 7px 10px;border:1px solid var(--border-strong);border-radius:var(--radius-control);background:var(--surface);color:var(--text);font:inherit;font-size:13px}
  @media(max-width:760px){.desktop-primary-navigation{display:none}.global-nav-inner{justify-content:space-between;gap:8px;min-height:60px;padding-inline:12px}.global-nav-actions{gap:6px}.account-link{min-height:44px;padding:6px 9px;font-size:11px}.account-initials{width:22px;height:22px}.mobile-nav-trigger{display:inline-flex;gap:6px;padding-inline:9px}.theme-control{display:none}.mobile-theme-control{display:flex;grid-column:1/-1;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;color:var(--muted);font-size:13px;font-weight:700}}
  @media(prefers-reduced-motion:reduce){.skip-link{transition:none}}
  @media (min-width: 761px) {
    .global-nav.dashboard-mobile-only {
      display: none;
    }
  }

</style>
