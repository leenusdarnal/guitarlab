import { describe, expect, it } from 'vitest';
import { accountProfileUpdateSchema } from './account-profile';

describe('account profile update contract', () => {
  it('trims and accepts a display name with an optional HTTPS image', () => {
    expect(
      accountProfileUpdateSchema.parse({
        name: '  Guitar Learner  ',
        image: 'https://cdn.example.test/avatar.png'
      })
    ).toEqual({
      name: 'Guitar Learner',
      image: 'https://cdn.example.test/avatar.png'
    });
  });

  it('accepts clearing a previously configured avatar', () => {
    expect(
      accountProfileUpdateSchema.parse({ name: 'Learner', image: null })
    ).toEqual({ name: 'Learner', image: null });
  });

  it('rejects blank or oversized display names', () => {
    expect(
      accountProfileUpdateSchema.safeParse({ name: '   ', image: null }).success
    ).toBe(false);
    expect(
      accountProfileUpdateSchema.safeParse({
        name: 'x'.repeat(81),
        image: null
      }).success
    ).toBe(false);
  });

  it('rejects insecure, malformed and non-HTTPS avatar URLs', () => {
    for (const image of [
      'http://example.test/avatar.png',
      'javascript:alert(1)',
      'not a URL'
    ]) {
      expect(
        accountProfileUpdateSchema.safeParse({ name: 'Learner', image }).success
      ).toBe(false);
    }
  });

  it('does not allow account email to be changed through profile editing', () => {
    expect(
      accountProfileUpdateSchema.safeParse({
        name: 'Learner',
        image: null,
        email: 'changed@example.test'
      }).success
    ).toBe(false);
  });
});
