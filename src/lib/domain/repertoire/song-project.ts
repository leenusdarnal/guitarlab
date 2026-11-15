import { z } from 'zod';

const uuid = z.string().uuid();
const timestamp = z.number().int().nonnegative();

export const songProjectSourceTypeSchema = z.enum([
  'original',
  'public_domain',
  'licensed',
  'reference_link'
]);

export const songProjectSectionSchema = z
  .object({
    id: uuid,
    title: z.string().trim().min(1).max(100),
    order: z.number().int().min(0).max(99),
    notes: z.string().max(2_000),
    bookmark: z.string().max(160).nullable(),
    practiceTarget: z.string().max(400).nullable()
  })
  .strict();

export const songProjectRecordSchema = z
  .object({
    id: uuid,
    learnerId: uuid,
    title: z.string().trim().min(1).max(160),
    artist: z.string().max(160).nullable(),
    sourceType: songProjectSourceTypeSchema,
    sourceUrl: z
      .string()
      .url()
      .max(2_048)
      .refine(
        (value) => value.startsWith('https://') || value.startsWith('http://'),
        'A source link must use HTTP or HTTPS.'
      )
      .nullable(),
    notes: z.string().max(5_000),
    sections: z.array(songProjectSectionSchema).max(100),
    createdAt: timestamp,
    updatedAt: timestamp
  })
  .strict()
  .superRefine((project, context) => {
    if (project.sourceType === 'reference_link' && project.sourceUrl === null) {
      context.addIssue({
        code: 'custom',
        path: ['sourceUrl'],
        message: 'A reference-link project requires an external URL.'
      });
    }
    const ids = project.sections.map((section) => section.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        path: ['sections'],
        message: 'A song project cannot contain duplicate section IDs.'
      });
    }
    const orders = project.sections.map((section) => section.order);
    if (new Set(orders).size !== orders.length) {
      context.addIssue({
        code: 'custom',
        path: ['sections'],
        message: 'Each song section must have a unique order.'
      });
    }
  });

export type SongProjectSourceType = z.infer<typeof songProjectSourceTypeSchema>;
export type SongProjectSection = z.infer<typeof songProjectSectionSchema>;
export type SongProjectRecord = z.infer<typeof songProjectRecordSchema>;

/** Create a blank, local-only song workspace without importing external material. */
export function createEmptySongProject(input: {
  id: string;
  learnerId: string;
  title: string;
  now: number;
}): SongProjectRecord {
  const { now, ...record } = input;
  return songProjectRecordSchema.parse({
    ...record,
    artist: null,
    sourceType: 'original',
    sourceUrl: null,
    notes: '',
    sections: [],
    createdAt: now,
    updatedAt: now
  });
}
