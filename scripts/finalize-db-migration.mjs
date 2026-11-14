#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const migrationsDir = join(root, 'drizzle', 'migrations');
const metaDir = join(migrationsDir, 'meta');
const curriculumDir = join(root, 'content', 'curriculum');
const curriculumFileNames = [
  'year-1.json',
  'year-2.json',
  'year-3-specialisations.json',
  'year-1-lessons.json',
  'year-2-lessons.json',
  'year-3-specialisation-lessons.json'
];

const files = await Promise.all(
  curriculumFileNames.map(async (name) => ({
    name,
    bytes: await readFile(join(curriculumDir, name))
  }))
);

let releaseManifest = null;
try {
  const bytes = await readFile(join(curriculumDir, 'release.json'));
  releaseManifest = JSON.parse(bytes.toString('utf8'));
  files.push({ name: 'release.json', bytes });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const hasher = createHash('sha256');
for (const file of files) {
  hasher.update(file.name);
  hasher.update('\0');
  hasher.update(file.bytes);
}
const contentHash = hasher.digest('hex');

const migrationNames = (await readdir(migrationsDir))
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();

if (migrationNames.length === 0) {
  throw new Error(
    'Drizzle Kit did not produce a SQL migration in drizzle/migrations.'
  );
}

const existing = await Promise.all(
  migrationNames.map(async (name) => ({
    name,
    content: await readFile(join(migrationsDir, name), 'utf8')
  }))
);
const seededMigrations = existing.filter((entry) =>
  entry.content.includes('-- GUITARLAB_CURRICULUM_SEED:')
);
const latestSeed = seededMigrations.at(-1);

function parseSeedHash(sql) {
  return sql.match(/-- GUITARLAB_CURRICULUM_SEED: ([a-f0-9]{64})/)?.[1];
}

function parseRelease(sql) {
  const match = sql.match(
    /-- GUITARLAB_CURRICULUM_RELEASE: ([^|\s]+)\|([^\s]+)/
  );
  if (match) return { id: match[1], version: match[2] };
  return { id: 'curriculum-v1', version: '1.0.0' };
}

function quote(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return "'" + String(value).replaceAll("'", "''") + "'";
}

function readableName(skillId) {
  const finalPart = skillId.split('.').at(-1) || skillId;
  return finalPart
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildSeedStatements({ releaseId, version, schemaVersion, publishedAt, lessons, skillIds }) {
  const statements = [];
  statements.push(
    'INSERT INTO curriculum_releases (id, version, schema_version, content_hash, published_at, status) VALUES (' +
      [releaseId, version, schemaVersion, contentHash, publishedAt, 'published']
        .map(quote)
        .join(', ') +
      ') ON CONFLICT(id) DO NOTHING;'
  );

  for (const skillId of skillIds) {
    statements.push(
      'INSERT INTO skills (id, category, display_name) VALUES (' +
        [skillId, skillId.split('.')[0], readableName(skillId)]
          .map(quote)
          .join(', ') +
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
        ]
          .map(quote)
          .join(', ') +
        ') ON CONFLICT(release_id, lesson_id) DO NOTHING;'
    );
  }
  return statements;
}

const parsed = new Map(
  await Promise.all(
    files
      .filter((file) => file.name !== 'release.json')
      .map(async (file) => [
        file.name,
        JSON.parse(file.bytes.toString('utf8'))
      ])
  )
);

const lessons = [
  ...parsed.get('year-1-lessons.json').lessons,
  ...parsed.get('year-2-lessons.json').lessons,
  ...parsed.get('year-3-specialisation-lessons.json').lessons
];

const lessonIds = new Set();
for (const lesson of lessons) {
  if (lessonIds.has(lesson.id))
    throw new Error('Duplicate lesson ID: ' + lesson.id);
  lessonIds.add(lesson.id);
}

const skillIds = [
  ...new Set(lessons.flatMap((lesson) => lesson.skillIds))
].sort();
if (lessons.length !== 152 || skillIds.length !== 34) {
  throw new Error(
    'Expected 152 lessons and 34 skills; found ' +
      lessons.length +
      ' lessons and ' +
      skillIds.length +
      ' skills.'
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

if (latestSeed && parseSeedHash(latestSeed.content) === contentHash) {
  console.log(
    'Curriculum seed already exists and its SHA-256 fingerprint matches.'
  );
  process.exit(0);
}

const previousRelease = latestSeed
  ? parseRelease(latestSeed.content)
  : null;

if (latestSeed && !releaseManifest) {
  throw new Error(
    'Curriculum content changed after ' +
      previousRelease.id +
      ' was seeded. Add content/curriculum/release.json with a new release ID, version, parentReleaseId and publishedAt; do not rewrite an applied migration.'
  );
}

const release = releaseManifest ?? {
  id: 'curriculum-v1',
  version: '1.0.0',
  parentReleaseId: null,
  schemaVersion: 1,
  publishedAt: '2026-11-11T00:00:00.000Z'
};
const releaseTime = Date.parse(release.publishedAt);
if (
  typeof release.id !== 'string' ||
  !/^curriculum-[a-zA-Z0-9._-]+$/.test(release.id) ||
  typeof release.version !== 'string' ||
  !/^\d+\.\d+\.\d+$/.test(release.version) ||
  !Number.isInteger(release.schemaVersion) ||
  release.schemaVersion < 1 ||
  !Number.isFinite(releaseTime)
) {
  throw new Error('Invalid curriculum release manifest.');
}
if (
  latestSeed &&
  (release.parentReleaseId !== previousRelease.id ||
    release.id === previousRelease.id ||
    release.version === previousRelease.version)
) {
  throw new Error(
    'New curriculum release must reference the latest seeded release as parent and use a new ID and version.'
  );
}

const statements = buildSeedStatements({
  releaseId: release.id,
  version: release.version,
  schemaVersion: release.schemaVersion,
  publishedAt: releaseTime,
  lessons,
  skillIds
});

if (!latestSeed) {
  const migrationPath = join(migrationsDir, migrationNames.at(-1));
  const previousSql = await readFile(migrationPath, 'utf8');
  const additions = [
    '',
    '-- GUITARLAB_CURRICULUM_RELEASE: ' + release.id + '|' + release.version,
    '-- GUITARLAB_CURRICULUM_SEED: ' + contentHash,
    '-- Curriculum content remains authoritative in Git; this seeds lookup metadata only.',
    ...statements,
    '-- Immutable curriculum and append-only learning evidence guards.',
    ...triggers,
    ''
  ].join('\n');
  await writeFile(
    migrationPath,
    previousSql.trimEnd() + '\n' + additions,
    'utf8'
  );
  console.log(
    'Finalized initial curriculum seed: ' +
      lessons.length +
      ' lessons, ' +
      skillIds.length +
      ' skills, release ' +
      release.id +
      '.'
  );
  process.exit(0);
}

const journalPath = join(metaDir, '_journal.json');
const journal = JSON.parse(await readFile(journalPath, 'utf8'));
const lastEntry = journal.entries.at(-1);
if (!lastEntry) throw new Error('Drizzle migration journal has no entries.');

const nextIndex = Math.max(...journal.entries.map((entry) => entry.idx)) + 1;
const tag =
  String(nextIndex).padStart(4, '0') +
  '_curriculum_release_' +
  release.version.replaceAll('.', '_');
const migrationPath = join(migrationsDir, tag + '.sql');
const migrationSql = [
  '-- GUITARLAB_CURRICULUM_RELEASE: ' + release.id + '|' + release.version,
  '-- GUITARLAB_CURRICULUM_SEED: ' + contentHash,
  '-- Immutable content release: existing release rows and learner evidence are preserved.',
  ...statements,
  ''
].join('\n');

const previousSnapshotPath = join(metaDir, lastEntry.tag + '_snapshot.json');
const previousSnapshot = JSON.parse(
  await readFile(previousSnapshotPath, 'utf8')
);
const snapshotId = createHash('sha256')
  .update(release.id + ':' + contentHash)
  .digest('hex')
  .slice(0, 32)
  .split('');
snapshotId[12] = '5';
snapshotId[16] = 'a';
const formattedSnapshotId = [
  snapshotId.slice(0, 8).join(''),
  snapshotId.slice(8, 12).join(''),
  snapshotId.slice(12, 16).join(''),
  snapshotId.slice(16, 20).join(''),
  snapshotId.slice(20, 32).join('')
].join('-');
const nextSnapshot = {
  ...previousSnapshot,
  id: formattedSnapshotId,
  prevId: previousSnapshot.id
};
const snapshotPath = join(metaDir, tag + '_snapshot.json');
const nextJournal = {
  ...journal,
  entries: [
    ...journal.entries,
    {
      idx: nextIndex,
      version: lastEntry.version,
      when: releaseTime,
      tag,
      breakpoints: true
    }
  ]
};

await writeFile(migrationPath, migrationSql, 'utf8');
await writeFile(snapshotPath, JSON.stringify(nextSnapshot, null, 2) + '\n', 'utf8');
await writeFile(journalPath, JSON.stringify(nextJournal, null, 2) + '\n', 'utf8');

console.log(
  'Created immutable curriculum release migration ' +
    tag +
    ': ' +
    lessons.length +
    ' lessons, ' +
    skillIds.length +
    ' skills, release ' +
    release.id +
    '. Previous release ' +
    previousRelease.id +
    ' remains unchanged.'
);
