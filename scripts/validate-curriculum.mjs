#!/usr/bin/env node
/**
 * Dependency-free integrity checks for GuitarLab's authored curriculum.
 * Run from repository root: node scripts/validate-curriculum.mjs
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const unique = (values) => new Set(values).size === values.length;
const isText = (value) => typeof value === "string" && value.trim().length > 0;

const [y1, y2, y3, y1Lessons, y2Lessons, y3Lessons, y1DashboardIndex] = await Promise.all([
  readJson("content/curriculum/year-1.json"),
  readJson("content/curriculum/year-2.json"),
  readJson("content/curriculum/year-3-specialisations.json"),
  readJson("content/curriculum/year-1-lessons.json"),
  readJson("content/curriculum/year-2-lessons.json"),
  readJson("content/curriculum/year-3-specialisation-lessons.json"),
  readJson("content/curriculum/year-1-dashboard-index.json")
]);

const checkOutline = (name, outline, expectedCount) => {
  check(outline.weeks?.length === expectedCount, `${name}: expected ${expectedCount} weeks`);
  const weeks = outline.weeks ?? [];
  check(unique(weeks.map((w) => w.id)), `${name}: duplicate week IDs`);
  weeks.forEach((w, i) => {
    check(w.week === i + 1, `${name}: week order mismatch at index ${i}`);
    check(isText(w.title) && isText(w.focus) && isText(w.checkpoint), `${name}: missing title/focus/checkpoint for week ${i + 1}`);
    check(outline.phases?.some((p) => p.id === w.phaseId), `${name}: invalid phase reference in ${w.id}`);
    check(w.startingTempoBpm == null || (Number.isInteger(w.startingTempoBpm) && w.startingTempoBpm >= 30 && w.startingTempoBpm <= 240), `${name}: invalid tempo in ${w.id}`);
  });
};
checkOutline("Year 1", y1, 52);
checkOutline("Year 2", y2, 52);

check(y3.paths?.length === 4, "Year 3: expected four specialisation paths");
const y3WeekIds = [];
for (const path of y3.paths ?? []) {
  check(path.weeks?.length === 12, `Year 3 ${path.id}: expected 12 titles`);
  check(path.weekRecords?.length === 12, `Year 3 ${path.id}: expected 12 stable week records`);
  for (let i = 0; i < (path.weekRecords ?? []).length; i += 1) {
    const record = path.weekRecords[i];
    check(record.week === i + 1, `Year 3 ${path.id}: week order mismatch`);
    check(record.title === path.weeks[i], `Year 3 ${path.id}: week record title mismatch`);
    y3WeekIds.push(record.id);
  }
}
check(unique(y3WeekIds), "Year 3: duplicate stable week IDs");

const requiredLessonFields = [
  "id", "curriculumId", "curriculumWeekId", "week", "route", "title", "focus",
  "estimatedMinutes", "learningObjectives", "prerequisites", "explanation",
  "demonstrationOrReference", "lessonBlocks", "exercises", "musicalApplication",
  "successCriteria", "commonMistakesAndCorrections", "accessibleAlternative",
  "retrievalPrompt", "nextReviewSuggestion", "practiceOptions", "instructorNotes",
  "checkpoint", "skillIds", "workedExamples"
];
const validateLessons = (name, dataset, outline, expectedCount, isYear3 = false) => {
  const lessons = dataset.lessons ?? [];
  check(lessons.length === expectedCount, `${name}: expected ${expectedCount} authored lessons`);
  check(dataset.schemaVersion === 1, `${name}: unsupported schemaVersion`);
  check(unique(lessons.map((l) => l.id)), `${name}: duplicate lesson IDs`);
  const exerciseIds = lessons.flatMap((l) => (l.exercises ?? []).map((e) => e.id));
  check(unique(exerciseIds), `${name}: duplicate exercise IDs`);

  for (const lesson of lessons) {
    for (const field of requiredLessonFields) check(field in lesson, `${name} ${lesson.id}: missing ${field}`);
    check(isText(lesson.title) && isText(lesson.focus) && isText(lesson.checkpoint), `${name} ${lesson.id}: blank lesson metadata`);
    check(lesson.learningObjectives?.length >= 2, `${name} ${lesson.id}: too few objectives`);
    check(lesson.lessonBlocks?.length >= 4, `${name} ${lesson.id}: lesson needs at least four blocks`);
    check(lesson.exercises?.length >= 3, `${name} ${lesson.id}: lesson needs at least three exercises`);
    check(lesson.skillIds?.length > 0 && unique(lesson.skillIds), `${name} ${lesson.id}: missing or duplicate skill IDs`);
    check(lesson.successCriteria?.length >= 3, `${name} ${lesson.id}: incomplete success criteria`);
    check(lesson.workedExamples?.length > 0 && lesson.workedExamples.every((example) => isText(example.kind) && isText(example.label) && isText(example.content)), `${name} ${lesson.id}: missing or incomplete worked examples`);
    check(isText(lesson.accessibleAlternative), `${name} ${lesson.id}: missing accessible alternative`);
    for (const exercise of lesson.exercises ?? []) {
      check(isText(exercise.id) && isText(exercise.title), `${name} ${lesson.id}: exercise has no ID/title`);
      check(Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && exercise.instructions.every(isText), `${name} ${lesson.id}: exercise instructions are incomplete`);
      check(isText(exercise.successCriterion), `${name} ${lesson.id}: exercise has no success criterion`);
      check(Number(exercise.durationMinutes) > 0, `${name} ${lesson.id}: invalid exercise duration`);
    }
    if (isYear3) {
      const route = outline.paths?.find((p) => p.id === lesson.route);
      const week = route?.weekRecords?.find((w) => w.id === lesson.curriculumWeekId);
      check(Boolean(week), `${name} ${lesson.id}: invalid specialist week reference`);
      if (week) check(week.week === lesson.week && week.title === lesson.title, `${name} ${lesson.id}: specialist week title/number mismatch`);
    } else {
      const week = outline.weeks?.find((w) => w.id === lesson.curriculumWeekId);
      check(Boolean(week), `${name} ${lesson.id}: invalid outline week reference`);
      if (week) check(week.week === lesson.week && week.title === lesson.title && week.checkpoint === lesson.checkpoint, `${name} ${lesson.id}: outline metadata mismatch`);
    }
  }
};
validateLessons("Year 1 lessons", y1Lessons, y1, 52);
validateLessons("Year 2 lessons", y2Lessons, y2, 52);
validateLessons("Year 3 lessons", y3Lessons, y3, 48, true);

const expectedDashboardLessons = y1Lessons.lessons.map((lesson) => ({
  id: lesson.id,
  week: lesson.week,
  title: lesson.title,
  focus: lesson.focus,
  estimatedMinutes: lesson.estimatedMinutes
}));
check(
  y1DashboardIndex.schemaVersion === 1 &&
    y1DashboardIndex.outlineVersion === y1.version &&
    y1DashboardIndex.contentVersion === y1Lessons.version &&
    JSON.stringify(y1DashboardIndex.phases) === JSON.stringify(y1.phases) &&
    JSON.stringify(y1DashboardIndex.lessons) ===
      JSON.stringify(expectedDashboardLessons),
  "Year 1 dashboard index is stale; run npm run curriculum:index"
);

if (failures.length) {
  console.error(`Curriculum validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Curriculum validation passed: 52 Year 1 + 52 Year 2 + 48 Year 3 lessons.");
}
