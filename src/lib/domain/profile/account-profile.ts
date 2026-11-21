import { z } from 'zod';

const GOOGLE_AVATAR_HOSTS = new Set([
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com'
]);
const GITHUB_AVATAR_HOST = 'avatars.githubusercontent.com';

/**
 * The only remote avatar hosts allowed by the app's restrictive img-src CSP.
 * GuitarLab does not proxy, upload or host profile images.
 */
export function isAllowedAccountAvatarUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === GITHUB_AVATAR_HOST ||
        GOOGLE_AVATAR_HOSTS.has(url.hostname))
    );
  } catch {
    return false;
  }
}

/**
 * Editable account identity fields. Email remains controlled by the OAuth
 * identity provider and is deliberately not accepted by this schema.
 */
export const accountProfileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    image: z
      .string()
      .trim()
      .url()
      .max(2048)
      .refine(
        isAllowedAccountAvatarUrl,
        'Profile images must come from an approved Google or GitHub avatar host.'
      )
      .nullable()
  })
  .strict();

export type AccountProfileUpdate = z.infer<typeof accountProfileUpdateSchema>;
