import { writable } from 'svelte/store';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'guitarlab-theme';
export const themePreferenceStore = writable<ThemePreference>('system');

type ThemeRoot = {
  dataset: Record<string, string>;
};

type ThemeColorMeta = {
  setAttribute(name: string, value: string): void;
};

export function isThemePreference(
  value: string | undefined | null
): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function readThemePreference(
  documentPreference: string | undefined,
  storedPreference: string | null
): ThemePreference {
  if (isThemePreference(documentPreference)) return documentPreference;
  return isThemePreference(storedPreference) ? storedPreference : 'system';
}

export function resolveTheme(
  preference: ThemePreference,
  prefersLight: boolean
): ResolvedTheme {
  if (preference === 'system') return prefersLight ? 'light' : 'dark';
  return preference;
}

export function applyThemePreference(
  preference: ThemePreference,
  prefersLight: boolean,
  root: ThemeRoot,
  themeColor: ThemeColorMeta | null
): ResolvedTheme {
  const resolved = resolveTheme(preference, prefersLight);
  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  themeColor?.setAttribute(
    'content',
    resolved === 'light' ? '#F5F4F0' : '#101318'
  );
  return resolved;
}

/**
 * Initialise the shared client-side preference from the pre-hydration
 * document state first, then localStorage. The inline app.html bootstrap
 * deliberately remains responsible for applying a theme before hydration.
 */
export function initializeThemePreference(): () => void {
  const root = document.documentElement;
  let storedPreference: string | null = null;

  try {
    storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // The pre-hydration document value or system preference remains usable.
  }

  const preference = readThemePreference(
    root.dataset.themePreference,
    storedPreference
  );
  const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  let currentPreference = preference;

  const unsubscribe = themePreferenceStore.subscribe((value) => {
    currentPreference = value;
  });
  themePreferenceStore.set(preference);
  applyThemePreference(preference, mediaQuery.matches, root, themeColor);

  const handleSystemThemeChange = () => {
    if (currentPreference === 'system') {
      applyThemePreference('system', mediaQuery.matches, root, themeColor);
    }
  };
  mediaQuery.addEventListener('change', handleSystemThemeChange);

  return () => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange);
    unsubscribe();
  };
}

/** Update all mounted theme controls and persist the preference locally. */
export function updateThemePreference(preference: ThemePreference): void {
  themePreferenceStore.set(preference);
  applyThemePreference(
    preference,
    window.matchMedia('(prefers-color-scheme: light)').matches,
    document.documentElement,
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  );

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Keep the selected theme active for this session when storage is blocked.
  }
}
