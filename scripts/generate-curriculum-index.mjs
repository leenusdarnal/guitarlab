#!/usr/bin/env node
/**
 * Generate the lightweight Year 1 dashboard curriculum index.
 *
 * Keep the dashboard index derived from authored curriculum source data so
 * lesson summaries cannot silently drift from their complete lesson records.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const readJson = async (path) =>
  JSON.parse(await readFile(resolve(root, path), 'utf8'));

const [outline, authored] = await Promise.all([
  readJson('content/curriculum/year-1.json'),
  readJson('content/curriculum/year-1-lessons.json')
]);

const index = {
  schemaVersion: 1,
  outlineVersion: outline.version,
  contentVersion: authored.version,
  phases: outline.phases,
  lessons: authored.lessons.map((lesson) => ({
    id: lesson.id,
    week: lesson.week,
    title: lesson.title,
    focus: lesson.focus,
    estimatedMinutes: lesson.estimatedMinutes,
    skillIds: [...lesson.skillIds]
  }))
};

const serializedIndex = JSON.stringify(index, null, 2).replace(
  /("skillIds": )\[\n([\s\S]*?)\n\s+\]/g,
  (_match, property, values) =>
    property +
    '[' +
    values
      .split('\n')
      .map((value) => value.trim().replace(/,$/, ''))
      .filter(Boolean)
      .join(', ') +
    ']'
);

await writeFile(
  resolve(root, 'content/curriculum/year-1-dashboard-index.json'),
  serializedIndex + String.fromCharCode(10),
  'utf8'
);
console.log(
  `Generated dashboard index for ${index.lessons.length} Year 1 lessons.`
);
