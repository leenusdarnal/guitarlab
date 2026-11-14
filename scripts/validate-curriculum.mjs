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

const [y1, y2, y3, y1Lessons, y2Lessons, y3Lessons, y1DashboardIndex, skillCatalog, skillAssessmentProfiles] = await Promise.all([
  readJson("content/curriculum/year-1.json"),
  readJson("content/curriculum/year-2.json"),
  readJson("content/curriculum/year-3-specialisations.json"),
  readJson("content/curriculum/year-1-lessons.json"),
  readJson("content/curriculum/year-2-lessons.json"),
  readJson("content/curriculum/year-3-specialisation-lessons.json"),
  readJson("content/curriculum/year-1-dashboard-index.json"),
  readJson("content/curriculum/skill-catalog.json"),
  readJson("content/curriculum/skill-assessment-profiles.json")
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


const categoryIds = (skillCatalog.categories ?? []).map((category) => category.id);
const catalogSkills = skillCatalog.skills ?? [];
const catalogSkillIds = catalogSkills.map((skill) => skill.id);
const authoredLessons = [
  ...(y1Lessons.lessons ?? []),
  ...(y2Lessons.lessons ?? []),
  ...(y3Lessons.lessons ?? [])
];
const authoredSkillIds = new Set(
  authoredLessons.flatMap((lesson) => lesson.skillIds ?? [])
);
check(skillCatalog.schemaVersion === 1, "Skill catalogue: unsupported schemaVersion");
check(isText(skillCatalog.version), "Skill catalogue: missing version");
check(skillCatalog.curriculumReleaseId === "curriculum-v1", "Skill catalogue: unexpected curriculum release key");
check(unique(categoryIds), "Skill catalogue: duplicate category IDs");
check(unique(catalogSkillIds), "Skill catalogue: duplicate skill IDs");
for (const category of skillCatalog.categories ?? []) {
  check(isText(category.displayName) && isText(category.description), `Skill category ${category.id}: missing display metadata`);
}
for (const skill of catalogSkills) {
  check(isText(skill.id) && isText(skill.displayName) && isText(skill.description), `Skill ${skill.id}: missing canonical metadata`);
  check(categoryIds.includes(skill.category), `Skill ${skill.id}: unknown category ${skill.category}`);
  check(skill.id.split(".")[0] === skill.category, `Skill ${skill.id}: category must match the ID namespace`);
  check(authoredSkillIds.has(skill.id), `Skill ${skill.id}: catalogue entry is not referenced by an authored lesson`);
}
for (const skillId of authoredSkillIds) {
  check(catalogSkillIds.includes(skillId), `Authored lesson skill ID ${skillId}: missing from canonical skill catalogue`);
}

const assessmentProfiles = skillAssessmentProfiles.profiles ?? [];
const assessmentProfileIds = assessmentProfiles.map((profile) => profile.skillId);
const assessmentModes = new Set([
  "creation_and_performance", "aural_recognition", "aural_transcription",
  "aural_and_pitch_response", "aural_rhythm_response", "performance",
  "fretboard_response", "recognition_and_performance", "observed_setup",
  "instrument_tuning", "performance_and_theory_response",
  "performance_and_musical_application", "expressive_performance",
  "notation_reading", "recording_and_reflection", "repertoire_performance",
  "timed_performance", "performance_and_harmonic_explanation",
  "rhythm_response_and_performance", "expressive_pitch_performance",
  "aural_response"
]);
const evidenceTypes = new Set([
  "performance_recording", "arrangement_artifact", "learner_explanation",
  "aural_response", "instrument_or_voice_response", "transcription_artifact",
  "measured_pitch_if_validated", "clapped_or_played_performance",
  "teacher_observation", "fretboard_task", "written_or_spoken_response",
  "notation_response", "performance_video", "teacher_or_peer_review",
  "learner_reflection", "timing_measurement_if_validated",
  "spoken_or_clapped_response", "pitch_measurement_if_validated"
]);
check(skillAssessmentProfiles.schemaVersion === 1, "Skill assessment profiles: unsupported schemaVersion");
check(isText(skillAssessmentProfiles.version), "Skill assessment profiles: missing version");
check(skillAssessmentProfiles.status === "draft", "Skill assessment profiles must remain draft until approved");
check(skillAssessmentProfiles.curriculumReleaseId === skillCatalog.curriculumReleaseId, "Skill assessment profiles: curriculum release mismatch");
check(skillAssessmentProfiles.skillCatalogVersion === skillCatalog.version, "Skill assessment profiles: skill catalogue version mismatch");
check(isText(skillAssessmentProfiles.scoringPolicy) && isText(skillAssessmentProfiles.feedbackPolicy), "Skill assessment profiles: missing policy guidance");
check(assessmentProfiles.length === catalogSkills.length, "Skill assessment profiles: expected one profile for every canonical skill");
check(unique(assessmentProfileIds), "Skill assessment profiles: duplicate skill profile IDs");
for (const profile of assessmentProfiles) {
  check(catalogSkillIds.includes(profile.skillId), `Skill assessment profile ${profile.skillId}: unknown catalogue skill`);
  check(profile.status === "draft", `Skill assessment profile ${profile.skillId}: profile must remain draft until reviewed`);
  check(assessmentModes.has(profile.assessmentMode), `Skill assessment profile ${profile.skillId}: unknown assessment mode`);
  check(Array.isArray(profile.criteria) && profile.criteria.length >= 2 && unique(profile.criteria.map((criterion) => criterion.id)), `Skill assessment profile ${profile.skillId}: needs at least two uniquely identified criteria`);
  for (const criterion of profile.criteria ?? []) {
    check(isText(criterion.id) && isText(criterion.descriptor), `Skill assessment profile ${profile.skillId}: incomplete criterion`);
  }
  check(Array.isArray(profile.evidenceTypes) && profile.evidenceTypes.length > 0 && unique(profile.evidenceTypes), `Skill assessment profile ${profile.skillId}: missing or duplicate evidence types`);
  for (const type of profile.evidenceTypes ?? []) {
    check(evidenceTypes.has(type), `Skill assessment profile ${profile.skillId}: unsupported evidence type ${type}`);
  }
  check(isText(profile.retentionProbe) && isText(profile.transferProbe), `Skill assessment profile ${profile.skillId}: missing retention or transfer probe`);
  check(typeof profile.humanReviewRequired === "boolean", `Skill assessment profile ${profile.skillId}: missing human-review flag`);
  check(profile.automatedDecisionStatus === "not_approved", `Skill assessment profile ${profile.skillId}: automated decisions are not approved`);
  check(isText(profile.cautions), `Skill assessment profile ${profile.skillId}: missing assessment caution`);
}
for (const skillId of catalogSkillIds) {
  check(assessmentProfileIds.includes(skillId), `Skill ${skillId}: missing draft assessment profile`);
}

const expectedDashboardLessons = y1Lessons.lessons.map((lesson) => ({
  id: lesson.id,
  week: lesson.week,
  title: lesson.title,
  focus: lesson.focus,
  estimatedMinutes: lesson.estimatedMinutes,
  skillIds: [...lesson.skillIds]
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

const countText = (values) => {
  const counts = new Map();
  for (const value of values) {
    if (isText(value)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
};
const lessonCount = authoredLessons.length;
const qualityAdvisories = [];
const secondObjective = countText(authoredLessons.map((lesson) => lesson.learningObjectives?.[1]))[0];
const thirdObjective = countText(authoredLessons.map((lesson) => lesson.learningObjectives?.[2]))[0];
const repeatedCriterion = countText(
  authoredLessons.flatMap((lesson) => (lesson.successCriteria ?? []).map((criterion) => criterion.criterion))
)[0];
const keyIdeaCount = new Set(authoredLessons.map((lesson) => lesson.explanation?.keyIdea).filter(isText)).size;

if (secondObjective && secondObjective[1] >= Math.ceil(lessonCount * 0.8)) {
  qualityAdvisories.push(`learning objective 2 repeats in ${secondObjective[1]}/${lessonCount} lessons`);
}
if (thirdObjective && thirdObjective[1] >= Math.ceil(lessonCount * 0.8)) {
  qualityAdvisories.push(`learning objective 3 repeats in ${thirdObjective[1]}/${lessonCount} lessons`);
}
if (repeatedCriterion && repeatedCriterion[1] >= Math.ceil(lessonCount * 0.8)) {
  qualityAdvisories.push(`one success criterion is shared by ${repeatedCriterion[1]}/${lessonCount} lessons`);
}
if (keyIdeaCount <= Math.ceil(lessonCount * 0.2)) {
  qualityAdvisories.push(`only ${keyIdeaCount} distinct key-idea explanations exist across ${lessonCount} lessons`);
}
const specialistLessons = y3Lessons.lessons ?? [];
const genericSpecialistCheckpointCount = specialistLessons.filter((lesson) =>
  /^Demonstrate .+ in a short musical example, explain the key choice and identify one next improvement\.$/i.test(lesson.checkpoint ?? "")
).length;
const genericSpecialistWorkedExampleCount = specialistLessons.filter((lesson) =>
  (lesson.workedExamples ?? []).some((example) =>
    /^Create or perform an original 4- to 8-bar example demonstrating .+\.$/i.test(example.content ?? "")
  )
).length;
if (specialistLessons.length > 0 && genericSpecialistCheckpointCount >= Math.ceil(specialistLessons.length * 0.8)) {
  qualityAdvisories.push(`generic specialist capstone checkpoint template appears in ${genericSpecialistCheckpointCount}/${specialistLessons.length} Year 3+ lessons`);
}
if (specialistLessons.length > 0 && genericSpecialistWorkedExampleCount >= Math.ceil(specialistLessons.length * 0.8)) {
  qualityAdvisories.push(`generic 4–8 bar worked-example template appears in ${genericSpecialistWorkedExampleCount}/${specialistLessons.length} Year 3+ lessons`);
}
if (qualityAdvisories.length) {
  console.warn("Curriculum quality advisory (non-blocking):");
  for (const advisory of qualityAdvisories) console.warn(`- ${advisory}`);
  console.warn("These signals require human review; they do not fail curriculum validation.");
}
