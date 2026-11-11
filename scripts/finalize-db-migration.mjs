#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const migrationsDir = join(root, 'drizzle', 'migrations');
const curriculumDir = join(root, 'content', 'curriculum');
const curriculumFiles = [
  'year-1.json',
  'year-2.json',
  'year-3-specialisations.json',
  'year-1-lessons.json',
  'year-2-lessons.json',
  'year-3-specialisation-lessons.json'
];

const files = await Promise.all(
  curriculumFiles.map(async (name) => ({
    name,
    bytes: await readFile(join(curriculumDir, name))
  }))
);

const hasher = createHash('sha256');
for (const file of files) {
  hasher.update(file.name);
  hasher.update('\0');
  hasher.update(file.bytes);
}
const contentHash = hasher.digest('hex');

const migrationNames = (await readdir(migrationsDir))
  .filter((name) => /^\\d+_[\\w-]+\\.sql$/.test(name))
  .sort();

if (migrationNames.length === 0) {
  throw new Error('Drizzle Kit did not produce a SQL migration in drizzle/migrations.');
}

const existing = await Promise.all(
  migrationNames.map(async (name) => ({
    name,
    content: await readFile(join(migrationsDir, name), 'utf8')
  }))
);
const seeded = existing.find((entry) => entry.content.includes('-- GUITARLAB_CURRICULUM_SEED:'));

if (seeded) {
  const recordedHash = seeded.content.match(/-- GUITARLAB_CURRICULUM_SEED: ([a-f0-9]{64})/)?.[1];
  if (recordedHash !== contentHash) {
    throw new Error(
      'Curriculum content changed after curriculum-v1 was seeded. Create an explicit new curriculum-release migration; do not rewrite an applied migration.'
    );
  }
  console.log('Curriculum seed already exists and its SHA-256 fingerprint matches.');
  process.exit(0);
}

const parsed = new Map(
  await Promise.all(files.map(async (file) => [
    file.name,
    JSON.parse(file.bytes.toString('utf8'))
  ]))
);

const lessons = [
  ...parsed.get('year-1-lessons.json').lessons,
  ...parsed.get('year-2-lessons.json').lessons,
  ...parsed.get('year-3-specialisation-lessons.json').lessons
];

const lessonIds = new Set();
for (const lesson of lessons) {
  if (lessonIds.has(lesson.id)) throw new Error('Duplicate lesson ID: ' + lesson.id);
  lessonIds.add(lesson.id);
}

const skillIds = [...new Set(lessons.flatMap((lesson) => lesson.skillIds))].sort();
if (lessons.length !== 152 || skillIds.length !== 34) {
  throw new Error('Expected 152 lessons and 34 skills; found ' + lessons.length + ' lessons and ' + skillIds.length + ' skills.');
}

function quote(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return "'" + String(value).replaceAll("'", "''") + "'";
}

function readableName(skillId) {
  const finalPart = skillId.split('.').at(-1) || skillId;
  return finalPart.split(/[-_]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

const releaseId = 'curriculum-v1';
const releasedAt = Date.parse('2026-11-11T00:00:00.000Z');
const statements = [];

statements.push(
  'INSERT INTO curriculum_releases (id, version, schema_version, content_hash, published_at, status) VALUES (' +
  [releaseId, '1.0.0', 1, contentHash, releasedAt, 'published'].map(quote).join(', ') +
  ') ON CONFLICT(id) DO NOTHING;'
);

for (const skillId of skillIds) {
  statements.push(
    'INSERT INTO skills (id, category, display_name) VALUES (' +
    [skillId, skillId.split('.')[0], readableName(skillId)].map(quote).join(', ') +
    ') ON CONFLICT(id) DO NOTHING;'
  );
  statements.push(
    'INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES (' +
    [releaseId, skillId].map(quote).join(', ') +
    ') ON CONFLICT(release_id, skill_id) DO NOTHING;'
  );
}

for (const lesson of lessons) {
  statements.push(
    'INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES (' +
    [
      releaseId,
      lesson.id,
      lesson.curriculumId,
      lesson.curriculumWeekId,
      lesson.week,
      lesson.route,
      lesson.title,
      lesson.focus,
      lesson.estimatedMinutes
    ].map(quote).join(', ') +
    ') ON CONFLICT(release_id, lesson_id) DO NOTHING;'
  );
}

const triggers = [
  "CREATE TRIGGER IF NOT EXISTS curriculum_releases_immutable_update BEFORE UPDATE ON curriculum_releases BEGIN SELECT RAISE(ABORT, 'curriculum releases are immutable; publish a new version'); END;",
  "CREATE TRIGGER IF NOT EXISTS curriculum_releases_immutable_delete BEFORE DELETE ON curriculum_releases BEGIN SELECT RAISE(ABORT, 'curriculum releases are immutable'); END;",
  "CREATE TRIGGER IF NOT EXISTS curriculum_lessons_immutable_update BEFORE UPDATE ON curriculum_lessons BEGIN SELECT RAISE(ABORT, 'curriculum lesson metadata is immutable within a release'); END;",
  "CREATE TRIGGER IF NOT EXISTS curriculum_lessons_immutable_delete BEFORE DELETE ON curriculum_lessons BEGIN SELECT RAISE(ABORT, 'curriculum lesson metadata is immutable within a release'); END;",
  "CREATE TRIGGER IF NOT EXISTS skills_immutable_update BEFORE UPDATE ON skills BEGIN SELECT RAISE(ABORT, 'skill identifiers are immutable'); END;",
  "CREATE TRIGGER IF NOT EXISTS skills_immutable_delete BEFORE DELETE ON skills BEGIN SELECT RAISE(ABORT, 'skill identifiers are immutable'); END;",
  "CREATE TRIGGER IF NOT EXISTS curriculum_release_skills_immutable_update BEFORE UPDATE ON curriculum_release_skills BEGIN SELECT RAISE(ABORT, 'released skill mappings are immutable'); END;",
  "CREATE TRIGGER IF NOT EXISTS curriculum_release_skills_immutable_delete BEFORE DELETE ON curriculum_release_skills BEGIN SELECT RAISE(ABORT, 'released skill mappings are immutable'); END;",
  "CREATE TRIGGER IF NOT EXISTS skill_assessment_attempts_no_update BEFORE UPDATE ON skill_assessment_attempts BEGIN SELECT RAISE(ABORT, 'assessment attempts are append-only'); END;",
  "CREATE TRIGGER IF NOT EXISTS skill_assessment_attempts_no_delete BEFORE DELETE ON skill_assessment_attempts BEGIN SELECT RAISE(ABORT, 'assessment attempts are append-only'); END;",
  "CREATE TRIGGER IF NOT EXISTS lesson_completion_events_no_update BEFORE UPDATE ON lesson_completion_events BEGIN SELECT RAISE(ABORT, 'lesson completion events are append-only'); END;",
  "CREATE TRIGGER IF NOT EXISTS lesson_completion_events_no_delete BEFORE DELETE ON lesson_completion_events BEGIN SELECT RAISE(ABORT, 'lesson completion events are append-only'); END;",
  "CREATE TRIGGER IF NOT EXISTS skill_mastery_passed_evidence_insert BEFORE INSERT ON skill_mastery WHEN NEW.state = 'stable' BEGIN SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM skill_assessment_attempts WHERE id = NEW.last_assessment_id AND learner_id = NEW.learner_id AND skill_id = NEW.skill_id AND curriculum_release_id = NEW.curriculum_release_id AND outcome = 'passed') THEN RAISE(ABORT, 'stable mastery requires a passed assessment for the same learner and skill') END; END;",
  "CREATE TRIGGER IF NOT EXISTS skill_mastery_passed_evidence_update BEFORE UPDATE ON skill_mastery WHEN NEW.state = 'stable' BEGIN SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM skill_assessment_attempts WHERE id = NEW.last_assessment_id AND learner_id = NEW.learner_id AND skill_id = NEW.skill_id AND curriculum_release_id = NEW.curriculum_release_id AND outcome = 'passed') THEN RAISE(ABORT, 'stable mastery requires a passed assessment for the same learner and skill') END; END;"
];

const migrationPath = join(migrationsDir, migrationNames.at(-1));
const previousSql = await readFile(migrationPath, 'utf8');
const additions = [
  '',
  '-- GUITARLAB_CURRICULUM_SEED: ' + contentHash,
  '-- Curriculum content remains authoritative in Git; this seeds lookup metadata only.',
  ...statements,
  '-- Immutable curriculum and append-only learning evidence guards.',
  ...triggers,
  ''
].join('\n');

await writeFile(migrationPath, previousSql.trimEnd() + '\n' + additions, 'utf8');
console.log('Finalized ' + migrationNames.at(-1) + ': ' + lessons.length + ' lessons, ' + skillIds.length + ' skills.');
