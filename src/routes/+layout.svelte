<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import '../app.css';
  import { loadActiveLearnerProfile } from '../lib/storage/indexeddb';

  let localStorageUnavailable = $state(false);
  let mobileMenuOpen = $state(false);
  let mobileMenuTrigger: HTMLButtonElement | null = null;
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
  let showPrimaryNavigation = $derived(currentPath !== '/' && currentPath !== '/onboarding');

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

  function handleThemePreferenceChange(event: Event) {
    const selected = event.currentTarget as HTMLSelectElement;
    if (isThemePreference(selected.value)) {
      setThemePreference(selected.value);
    }
  }

  onMount(() => {
    const initialPreference = document.documentElement.dataset.themePreference;
    themePreference = isThemePreference(initialPreference) ? initialPreference : 'system';
    applyResolvedTheme(themePreference);

    themeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = () => {
      if (themePreference === 'system') applyResolvedTheme('system');
    };
    themeMediaQuery.addEventListener('change', handleSystemThemeChange);

    void loadActiveLearnerProfile().catch(() => {
      localStorageUnavailable = true;
    });

    return () => {
      themeMediaQuery?.removeEventListener('change', handleSystemThemeChange);
    };
  });

  async function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    if (mobileMenuOpen) {
      await tick();
      document.querySelector<HTMLAnchorElement>('#mobile-primary-navigation a')?.focus();
    } else {
      mobileMenuTrigger?.focus();
    }
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
    GuitarLab could not open local learner storage. Your progress will not be saved in this browser until storage is available.
  </div>
{/if}

{#if showPrimaryNavigation}
  <header class="global-nav">
    <div class="global-nav-inner">
      <a class="global-brand" href={resolve('/')} aria-label="GuitarLab home">
        <span class="global-brand-mark" aria-hidden="true">G</span>
        <span>GuitarLab</span>
      </a>

      <nav class="desktop-primary-navigation" aria-label="Primary navigation">
        <a class:active={activeSection === 'today'} aria-current={activeSection === 'today' ? 'page' : undefined} href={resolve('/')}>Today</a>
        <a class:active={activeSection === 'learn'} aria-current={activeSection === 'learn' ? 'page' : undefined} href={resolve('/learn')}>Learn</a>
        <a class:active={activeSection === 'practice'} aria-current={activeSection === 'practice' ? 'page' : undefined} href={resolve('/practice')}>Practice</a>
        <a class:active={activeSection === 'tools'} aria-current={activeSection === 'tools' ? 'page' : undefined} href={resolve('/tools')}>Tools</a>
        <a class:active={activeSection === 'songs'} aria-current={activeSection === 'songs' ? 'page' : undefined} href={resolve('/repertoire')}>Songs</a>
        <a class:active={activeSection === 'progress'} aria-current={activeSection === 'progress' ? 'page' : undefined} href={resolve('/skills')}>Progress</a>
        <a class:active={activeSection === 'preferences'} aria-current={activeSection === 'preferences' ? 'page' : undefined} href={resolve('/onboarding')}>Preferences</a>
      </nav>

      <div class="global-nav-actions">
        <label class="theme-control">
          <span class="sr-only">Appearance</span>
          <select aria-label="Appearance" value={themePreference} onchange={handleThemePreferenceChange}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <button class="mobile-nav-trigger" type="button" bind:this={mobileMenuTrigger} onclick={toggleMobileMenu} aria-expanded={mobileMenuOpen} aria-controls="mobile-primary-navigation" aria-label="Open navigation">
          <span aria-hidden="true">☰</span><span>Menu</span>
        </button>
      </div>
    </div>

    {#if mobileMenuOpen}
      <nav class="mobile-primary-navigation" id="mobile-primary-navigation" aria-label="Primary navigation">
        <a href={resolve('/')} onclick={closeMobileMenu}>Today</a>
        <a href={resolve('/learn')} onclick={closeMobileMenu}>Learn</a>
        <a href={resolve('/practice')} onclick={closeMobileMenu}>Practice</a>
        <a href={resolve('/tools')} onclick={closeMobileMenu}>Tools</a>
        <a href={resolve('/repertoire')} onclick={closeMobileMenu}>Songs</a>
        <a href={resolve('/skills')} onclick={closeMobileMenu}>Progress</a>
        <a href={resolve('/onboarding')} onclick={closeMobileMenu}>Preferences</a>
        <a href={resolve('/settings/data')} onclick={closeMobileMenu}>Data &amp; backups</a>
      </nav>
    {/if}
  </header>
{/if}

<div id="main-content" tabindex="-1">
  <slot />
</div>

<style>
  .skip-link{position:fixed;z-index:1000;top:.75rem;left:.75rem;padding:.75rem 1rem;transform:translateY(calc(-100% - 1rem));border:1px solid var(--primary);border-radius:.75rem;background:var(--primary);color:var(--primary-ink);font-size:.875rem;font-weight:700;box-shadow:0 6px 24px #0004;transition:transform 140ms ease-out}
  .skip-link:focus{transform:translateY(0)}
  #main-content:focus{outline:none}
  .storage-warning{padding:.75rem 1rem;border-bottom:1px solid var(--border);background:var(--surface-raised);color:var(--text);font-size:.875rem;line-height:1.5;text-align:center}
  .global-nav{position:sticky;top:0;z-index:200;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(16px)}
  .global-nav-inner{max-width:1440px;min-height:66px;margin:0 auto;padding:8px clamp(15px,3vw,38px);display:flex;align-items:center;gap:24px}
  .global-brand{display:inline-flex;align-items:center;gap:9px;flex:none;font-size:17px;font-weight:850;letter-spacing:-.35px}
  .global-brand-mark{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--primary);color:var(--primary-ink);font:800 17px Georgia,serif}
  .desktop-primary-navigation{display:flex;align-items:center;justify-content:center;gap:4px;flex:1;min-width:0}
  .desktop-primary-navigation a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:8px 11px;border-radius:9px;color:var(--muted);font-size:13px;font-weight:700;white-space:nowrap}
  .desktop-primary-navigation a:hover{background:var(--surface);color:var(--text)}
  .desktop-primary-navigation a.active{background:color-mix(in srgb,var(--primary) 13%,var(--surface));color:var(--primary)}
  .global-nav-actions{display:flex;align-items:center;gap:8px;flex:none}
  .theme-control select{min-height:42px;max-width:132px;padding:8px 28px 8px 10px;border:1px solid var(--border-strong);border-radius:var(--radius-control);background:var(--surface);color:var(--text);font-size:13px;font-weight:700;cursor:pointer}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .mobile-nav-trigger{display:none;align-items:center;gap:8px;min-height:42px;padding:8px 12px;border:1px solid var(--border-strong);border-radius:var(--radius-control);background:var(--surface);color:var(--text);font-size:12px;font-weight:750;cursor:pointer}
  .mobile-primary-navigation{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:8px 16px 16px;border-top:1px solid var(--border);background:var(--surface)}
  .mobile-primary-navigation a{display:flex;align-items:center;min-height:44px;padding:10px 12px;border-radius:8px;font-size:14px;font-weight:700;color:var(--text)}
  .mobile-primary-navigation a:hover,.mobile-primary-navigation a:focus-visible{background:var(--surface-raised)}
  .theme-control select:focus-visible,.mobile-nav-trigger:focus-visible,.mobile-primary-navigation a:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  @media(max-width:920px){.global-nav-inner{gap:12px}.desktop-primary-navigation{gap:0}.desktop-primary-navigation a{padding-inline:8px;font-size:12px}}
  @media(max-width:760px){.desktop-primary-navigation{display:none}.global-nav-inner{justify-content:space-between;min-height:60px}.mobile-nav-trigger{display:inline-flex}.theme-control select{min-height:42px}}
  @media(prefers-reduced-motion:reduce){.skip-link{transition:none}}
</style>
