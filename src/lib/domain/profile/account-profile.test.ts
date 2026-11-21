import { describe, expect, it } from 'vitest';
import { accountProfileUpdateSchema } from './account-profile';

describe('account profile update contract', () => {
  it('trims and accepts Google and GitHub provider avatar URLs', () => {
    expect(
      accountProfileUpdateSchema.parse({
        name: '  Guitar Learner  ',
        image: 'https://lh3.googleusercontent.com/a/avatar.png'
      })
    ).toEqual({
      name: 'Guitar Learner',
      image: 'https://lh3.googleusercontent.com/a/avatar.png'
    });

    expect(
      accountProfileUpdateSchema.parse({
        name: 'GitHub Learner',
        image: 'https://avatars.githubusercontent.com/u/12345?v=4'
      }).image
    ).toBe('https://avatars.githubusercontent.com/u/12345?v=4');
  });

  it('accepts clearing a previously configured avatar', () => {
    expect(
      accountProfileUpdateSchema.parse({
        name: 'Learner',
        image: null
      })
    ).toEqual({ name: 'Learner', image: null });
  });

  it('rejects blank or oversized display names', () => {
    const blankName = accountProfileUpdateSchema.safeParse({
      name: '   ',
      image: null
    });
    const oversizedName = accountProfileUpdateSchema.safeParse({
      name: 'x'.repeat(81),
      image: null
    });

    expect(blankName.success).toBe(false);
    expect(oversizedName.success).toBe(false);
  });

  it('rejects unapproved, insecure, malformed and credential-bearing avatar URLs', () => {
    for (const image of [
      'http://avatars.githubusercontent.com/u/12345',
      'https://cdn.example.test/avatar.png',
      'https://user:secret@avatars.githubusercontent.com/u/12345',
      'https://avatars.githubusercontent.com:8443/u/12345',
      'javascript:alert(1)',
      'not a URL'
    ]) {
      expect(
        accountProfileUpdateSchema.safeParse({
          name: 'Learner',
          image
        }).success
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
