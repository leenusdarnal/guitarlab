#!/usr/bin/env node
/**
 * Validate versioned authored exercise taxonomies against source lessons.
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

check(taxonomy.schemaVersion === 1, 'Practice taxonomy: unsupported schemaVersion');
check(isText(taxonomy.version), 'Practice taxonomy: missing version');
check(taxonomy.curriculumReleaseId === release.id, 'Practice taxonomy: curriculum release mismatch');
check(isText(taxonomy.authoringPolicy), 'Practice taxonomy: missing authoring policy');

const current = {
  version: taxonomy.version,
  topics: taxonomy.topics ?? [],
  techniques: taxonomy.techniques ?? [],
  fretPositions: taxonomy.fretPositions ?? [],
  strings: taxonomy.strings ?? [],
  exerciseScopes: taxonomy.exerciseScopes ?? []
};
const snapshots = [...(taxonomy.previousVersions ?? []), current];
check(
  unique(snapshots.map((snapshot) => snapshot.version)),
  'Practice taxonomy: duplicate current or historical version'
);

function validateDimensionRecords(version, name, records) {
  check(Array.isArray(records), `Practice taxonomy ${version}: missing ${name} definitions`);
  if (!Array.isArray(records)) return [];
  const ids = records.map((item) => item.id);
  check(
    ids.length > 0 && unique(ids),
    `Practice taxonomy ${version}: duplicate or missing ${name} IDs`
  );
  for (const record of records) {
    check(
      isText(record.id) && isText(record.label) && isText(record.description),
      `Practice taxonomy ${version} ${name}: incomplete metadata`
    );
  }
  return ids;
}

function validateSnapshot(snapshot) {
  check(isText(snapshot.version), 'Practice taxonomy: snapshot missing version');
  const version = snapshot.version || 'unknown';
  const topicIds = validateDimensionRecords(version, 'topic', snapshot.topics);
  const techniqueIds = validateDimensionRecords(version, 'technique', snapshot.techniques);
  const positionIds = validateDimensionRecords(version, 'fret position', snapshot.fretPositions);
  const strings = snapshot.strings;
  check(Array.isArray(strings) && strings.length === 6, `Practice taxonomy ${version}: expected six strings`);
  const stringNumbers = Array.isArray(strings) ? strings.map((item) => item.number) : [];
  check(
    stringNumbers.length === 6 && unique(stringNumbers),
    `Practice taxonomy ${version}: expected six unique string numbers`
  );
  for (const string of Array.isArray(strings) ? strings : []) {
    check(
      Number.isInteger(string.number) &&
        string.number >= 1 &&
        string.number <= 6 &&
        isText(string.label),
      `Practice taxonomy ${version}: invalid string definition`
    );
  }

  const scopes = snapshot.exerciseScopes;
  check(Array.isArray(scopes), `Practice taxonomy ${version}: missing exercise scopes`);
  if (!Array.isArray(scopes)) return;
  const scopeKeys = scopes.map((scope) => `${scope.lessonId}:${scope.exerciseId}`);
  check(unique(scopeKeys), `Practice taxonomy ${version}: duplicate exercise scope mappings`);

  for (const scope of scopes) {
    const key = `${scope.lessonId}:${scope.exerciseId}`;
    check(exercises.has(key), `Practice taxonomy ${version}: unknown authored exercise ${key}`);
    check(isText(scope.sourceEvidence), `Practice taxonomy ${key}: missing source evidence`);

    for (const [field, allowed] of [
      ['topicIds', topicIds],
      ['techniqueIds', techniqueIds],
      ['fretPositionIds', positionIds]
    ]) {
      const values = scope[field] ?? [];
      check(
        Array.isArray(values) && unique(values),
        `Practice taxonomy ${version} ${key}: invalid ${field}`
      );
      if (Array.isArray(values)) {
        for (const value of values) {
          check(
            allowed.includes(value),
            `Practice taxonomy ${version} ${key}: unknown ${field} value ${value}`
          );
        }
      }
    }

    const selectedStrings = scope.stringNumbers ?? [];
    check(
      Array.isArray(selectedStrings) && unique(selectedStrings),
      `Practice taxonomy ${version} ${key}: invalid or duplicate string numbers`
    );
    if (Array.isArray(selectedStrings)) {
      for (const number of selectedStrings) {
        check(
          stringNumbers.includes(number),
          `Practice taxonomy ${version} ${key}: unknown string number ${number}`
        );
      }
    }

    const hasScope =
      (Array.isArray(scope.topicIds) ? scope.topicIds.length : 0) +
        (Array.isArray(scope.techniqueIds) ? scope.techniqueIds.length : 0) +
        selectedStrings.length +
        (Array.isArray(scope.fretPositionIds) ? scope.fretPositionIds.length : 0) >
        0 ||
      scope.fretRange != null;
    check(hasScope, `Practice taxonomy ${version} ${key}: empty practice scope`);

    if (scope.fretRange != null) {
      check(
        Number.isInteger(scope.fretRange.minFret) &&
          Number.isInteger(scope.fretRange.maxFret) &&
          scope.fretRange.minFret >= 0 &&
          scope.fretRange.maxFret <= 24 &&
          scope.fretRange.maxFret >= scope.fretRange.minFret,
        `Practice taxonomy ${version} ${key}: invalid fret range`
      );
    }
  }
}

for (const snapshot of snapshots) validateSnapshot(snapshot);

const historicalVersions = taxonomy.previousVersions ?? [];
for (const historical of historicalVersions) {
  for (const [name, oldRecords, currentRecords] of [
    ['topics', historical.topics ?? [], current.topics],
    ['techniques', historical.techniques ?? [], current.techniques],
    ['fretPositions', historical.fretPositions ?? [], current.fretPositions],
    ['strings', historical.strings ?? [], current.strings]
  ]) {
    const currentById = new Map(currentRecords.map((record) => [
      name === 'strings' ? String(record.number) : record.id,
      record
    ]));
    for (const oldRecord of oldRecords) {
      const id = name === 'strings' ? String(oldRecord.number) : oldRecord.id;
      const activeRecord = currentById.get(id);
      check(
        Boolean(activeRecord) &&
          activeRecord.label === oldRecord.label &&
          (name === 'strings' ||
            activeRecord.description === oldRecord.description),
        `Practice taxonomy: historical ${name} definition changed for ${id}`
      );
    }
  }
}

if (fail.length) {
  console.error(`Practice taxonomy validation failed with ${fail.length} issue(s):`);
  for (const message of fail) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log(
    `Practice taxonomy validation passed: ${current.exerciseScopes.length} current exercise scopes and ${historicalVersions.length} retained historical version(s).`
  );
}
