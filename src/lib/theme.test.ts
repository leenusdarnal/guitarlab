import { describe, expect, it } from 'vitest';
import {
  applyThemePreference,
  isThemePreference,
  readThemePreference,
  resolveTheme
} from './theme';

describe('theme preference validation', () => {
  it.each(['system', 'light', 'dark'])('accepts %s', (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each(['', 'auto', 'LIGHT', 'sepia', undefined, null])(
    'rejects invalid preference %s',
    (value) => {
      expect(isThemePreference(value)).toBe(false);
    }
  );
});

describe('theme preference selection', () => {
  it('prefers the pre-hydration document preference over saved storage', () => {
    expect(readThemePreference('light', 'dark')).toBe('light');
  });

  it('uses a saved preference when the document has none', () => {
    expect(readThemePreference(undefined, 'dark')).toBe('dark');
  });

  it('falls back to system for invalid or unavailable values', () => {
    expect(readThemePreference('sepia', 'invalid')).toBe('system');
    expect(readThemePreference(undefined, null)).toBe('system');
  });
});

describe('theme resolution', () => {
  it('resolves system to the current operating-system preference', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
  });

  it('keeps explicit light and dark preferences independent of the system', () => {
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
  });

  it('applies the resolved theme and matching browser theme colour', () => {
    const root = { dataset: {} as Record<string, string> };
    const themeColor = { value: '', setAttribute(_name: string, value: string) { this.value = value; } };

    expect(applyThemePreference('light', false, root, themeColor)).toBe('light');
    expect(root.dataset).toEqual({ themePreference: 'light', theme: 'light' });
    expect(themeColor.value).toBe('#F5F4F0');

    expect(applyThemePreference('dark', true, root, themeColor)).toBe('dark');
    expect(root.dataset.theme).toBe('dark');
    expect(themeColor.value).toBe('#101318');
  });
});
