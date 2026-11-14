#!/usr/bin/env node
/**
 * Validate the versioned authored exercise taxonomy against source lessons.
 * Run from repository root: node scripts/validate-practice-taxonomy.mjs
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const readJson = async (path) =>
  JSON.parse(await readFile(resolve(root, path), 'utf8'));
const fail = [];
const check = (condition, message) => {
  if (!condition) fail.push(message);
};
const unique = (values) => new Set(values).size === values.length;
const isText = (value) => typeof value === 'string' && value.trim().length > 0;

const [release, taxonomy, y1, y2, y3] = await Promise.all([
  readJson('content/curriculum/release.json'),
  readJson('content/curriculum/practice-taxonomy.json'),
  readJson('content/curriculum/year-1-lessons.json'),
  readJson('content/curriculum/year-2-lessons.json'),
  readJson('content/curriculum/year-3-specialisation-lessons.json')
]);

const lessons = [
  ...(y1.lessons ?? []),
  ...(y2.lessons ?? []),
  ...(y3.lessons ?? [])
];
const exercises = new Map(
  lessons.flatMap((lesson) =>
    (lesson.exercises ?? []).map((exercise) => [
      `${lesson.id}:${exercise.id}`,
      { lesson, exercise }
    ])
  )
);
const topics = taxonomy.topics ?? [];
const techniques = taxonomy.techniques ?? [];
const positions = taxonomy.fretPositions ?? [];
const strings = taxonomy.strings ?? [];
const scopes = taxonomy.exerciseScopes ?? [];
const topicIds = topics.map((item) => item.id);
const techniqueIds = techniques.map((item) => item.id);
const positionIds = positions.map((item) => item.id);
const stringNumbers = strings.map((item) => item.number);

check(taxonomy.schemaVersion === 1, 'Practice taxonomy: unsupported schemaVersion');
check(isText(taxonomy.version), 'Practice taxonomy: missing version');
check(taxonomy.curriculumReleaseId === release.id, 'Practice taxonomy: curriculum release mismatch');
check(isText(taxonomy.authoringPolicy), 'Practice taxonomy: missing authoring policy');

for (const [name, records, ids] of [
  ['topic', topics, topicIds],
  ['technique', techniques, techniqueIds],
  ['fret position', positions, positionIds]
]) {
  check(ids.length > 0 && unique(ids), `Practice taxonomy: duplicate or missing ${name} IDs`);
  for (const record of records) {
    check(isText(record.id) && isText(record.label) && isText(record.description),
      `Practice taxonomy ${name}: incomplete metadata`);
  }
}

check(strings.length === 6 && unique(stringNumbers), 'Practice taxonomy: expected six unique string numbers');
for (const string of strings) {
  check(Number.isInteger(string.number) && string.number >= 1 && string.number <= 6 && isText(string.label),
    'Practice taxonomy: invalid string definition');
}

const scopeKeys = scopes.map((scope) => `${scope.lessonId}:${scope.exerciseId}`);
check(unique(scopeKeys), 'Practice taxonomy: duplicate exercise scope mappings');
for (const scope of scopes) {
  const key = `${scope.lessonId}:${scope.exerciseId}`;
  const source = exercises.get(key);
  check(Boolean(source), `Practice taxonomy: unknown authored exercise ${key}`);
  check(isText(scope.sourceEvidence), `Practice taxonomy ${key}: missing source evidence`);

  for (const [field, allowed] of [
    ['topicIds', topicIds],
    ['techniqueIds', techniqueIds],
    ['fretPositionIds', positionIds]
  ]) {
    const values = scope[field] ?? [];
    check(Array.isArray(values) && unique(values), `Practice taxonomy ${key}: invalid ${field}`);
    for (const value of values) {
      check(allowed.includes(value), `Practice taxonomy ${key}: unknown ${field} value ${value}`);
    }
  }

  const selectedStrings = scope.stringNumbers ?? [];
  check(Array.isArray(selectedStrings) && unique(selectedStrings),
    `Practice taxonomy ${key}: invalid or duplicate string numbers`);
  for (const number of selectedStrings) {
    check(stringNumbers.includes(number), `Practice taxonomy ${key}: unknown string number ${number}`);
  }

  const hasScope =
    (scope.topicIds?.length ?? 0) +
      (scope.techniqueIds?.length ?? 0) +
      selectedStrings.length +
      (scope.fretPositionIds?.length ?? 0) > 0 ||
    scope.fretRange != null;
  check(hasScope, `Practice taxonomy ${key}: empty practice scope`);

  if (scope.fretRange != null) {
    check(
      Number.isInteger(scope.fretRange.minFret) &&
        Number.isInteger(scope.fretRange.maxFret) &&
        scope.fretRange.minFret >= 0 &&
        scope.fretRange.maxFret <= 24 &&
        scope.fretRange.maxFret >= scope.fretRange.minFret,
      `Practice taxonomy ${key}: invalid fret range`
    );
  }
}

if (fail.length) {
  console.error(`Practice taxonomy validation failed with ${fail.length} issue(s):`);
  for (const message of fail) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log(`Practice taxonomy validation passed: ${scopes.length} authored exercise scopes.`);
}
