#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const learnerId = randomUUID();
const progressId = randomUUID();
const assessmentId = randomUUID();
const now = Date.now();

function quote(value) {
  return "'" + String(value).replaceAll("'", "''") + "'";
}

function runSql(statement, shouldFail = false) {
  const result = spawnSync(
    executable,
    [
      'wrangler',
      'd1',
      'execute',
      'guitarlab-local',
      '--local',
      '--json',
      '--command',
      statement
    ],
    { encoding: 'utf8', timeout: 30000 }
  );

  if (shouldFail) {
    assert.notEqual(result.status, 0, 'Expected SQL to fail but it succeeded: ' + statement + '\n' + result.stdout);
    return result;
  }

  assert.equal(result.status, 0, 'SQL failed: ' + statement + '\n' + result.stderr + '\n' + result.stdout);
  return result;
}

function parseOutput(output) {
  const candidates = [...output.matchAll(/(?:^|\n)(\{[\s\S]*\}|\[[\s\S]*\])\s*$/g)];
  for (const candidate of candidates.reverse()) {
    try {
      return JSON.parse(candidate[1]);
    } catch {
      // Try other JSON sections after Wrangler diagnostic text.
    }
  }
  throw new Error('Could not parse Wrangler JSON output:\n' + output);
}

function findValue(value, key) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValue(item, key);
      if (found !== undefined) return found;
    }
  } else if (value && typeof value === 'object') {
    if (Object.hasOwn(value, key)) return value[key];
    for (const nested of Object.values(value)) {
      const found = findValue(nested, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

const learner = quote(learnerId);
const progress = quote(progressId);
const attempt = quote(assessmentId);
const release = quote('curriculum-v1');
const lesson = quote('y1-w01-lesson');
const skill = quote('instrument.tuning');

runSql(
  'INSERT INTO learner_profiles (id, created_at, updated_at) VALUES (' +
  [learner, now, now].join(', ') + ');'
);

runSql(
  'INSERT INTO lesson_progress (id, learner_id, curriculum_release_id, lesson_id, status, started_at, completed_at, updated_at) VALUES (' +
  [progress, learner, release, lesson, quote('completed'), now, now, now].join(', ') + ');'
);

const result = runSql(
  'SELECT COUNT(*) AS masteryCount FROM skill_mastery WHERE learner_id = ' + learner + ';'
);
const masteryCount = findValue(parseOutput(result.stdout), 'masteryCount');
assert.equal(Number(masteryCount), 0, 'Lesson completion must not create skill mastery.');

runSql(
  'INSERT INTO lesson_completion_events (id, progress_id, learner_id, curriculum_release_id, lesson_id, completion_source, completed_at) VALUES (' +
  [quote(randomUUID()), progress, learner, release, lesson, quote('checkpoint'), now].join(', ') + ');'
);

runSql(
  'INSERT INTO lesson_progress (id, learner_id, curriculum_release_id, lesson_id, status, started_at, updated_at) VALUES (' +
  [quote(randomUUID()), learner, release, lesson, quote('in_progress'), now, now].join(', ') + ');',
  true
);

runSql(
  'INSERT INTO lesson_progress (id, learner_id, curriculum_release_id, lesson_id, status, started_at, updated_at) VALUES (' +
  [quote(randomUUID()), quote(randomUUID()), release, lesson, quote('in_progress'), now, now].join(', ') + ');',
  true
);

runSql(
  'INSERT INTO skill_assessment_attempts (id, learner_id, curriculum_release_id, skill_id, lesson_id, assessment_kind, evidence_type, outcome, evidence_json, assessed_at, recorded_at) VALUES (' +
  [
    attempt,
    learner,
    release,
    skill,
    lesson,
    quote('checkpoint'),
    quote('observed_or_self_checked'),
    quote('passed'),
    quote('{"itemsCorrect":6}'),
    now,
    now
  ].join(', ') + ');'
);

runSql(
  'UPDATE skill_assessment_attempts SET outcome = ' + quote('needs_practice') + ' WHERE id = ' + attempt + ';',
  true
);
runSql('DELETE FROM skill_assessment_attempts WHERE id = ' + attempt + ';', true);

runSql(
  'INSERT INTO skill_mastery (learner_id, curriculum_release_id, skill_id, state, evidence_count, updated_at) VALUES (' +
  [learner, release, skill, quote('stable'), 1, now].join(', ') + ');',
  true
);

runSql(
  'INSERT INTO skill_mastery (learner_id, curriculum_release_id, skill_id, state, evidence_count, last_assessment_id, last_assessed_at, updated_at) VALUES (' +
  [learner, release, skill, quote('stable'), 1, attempt, now, now].join(', ') + ');'
);

runSql(
  'UPDATE lesson_completion_events SET completion_source = ' + quote('learner_confirmed') + ' WHERE progress_id = ' + progress + ';',
  true
);

console.log('Local D1 invariant tests passed: foreign keys, unique progress, append-only evidence, and the mastery evidence gate.');
