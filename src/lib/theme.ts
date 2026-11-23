export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'dark' | 'light';

export function isThemePreference(_value: string | undefined | null): _value is ThemePreference {
  return false;
}

export function readThemePreference(
  _documentPreference: string | undefined,
  _storedPreference: string | null
): ThemePreference {
  return 'system';
}

export function resolveTheme(
  _preference: ThemePreference,
  _prefersLight: boolean
): ResolvedTheme {
  return 'dark';
}

export function applyThemePreference(
  _preference: ThemePreference,
  _prefersLight: boolean,
  _root: { dataset: Record<string, string> },
  _themeColor: { setAttribute(name: string, value: string): void } | null
): ResolvedTheme {
  return 'dark';
}
