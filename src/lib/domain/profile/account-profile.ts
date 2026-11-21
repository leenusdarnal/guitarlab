import { z } from 'zod';

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
      .refine((value) => {
        try {
          const url = new URL(value);
          return (
            url.protocol === 'https:' && !url.username && !url.password
          );
        } catch {
          return false;
        }
      }, 'Profile images must use HTTPS.')
      .nullable()
  })
  .strict();

export type AccountProfileUpdate = z.infer<typeof accountProfileUpdateSchema>;
