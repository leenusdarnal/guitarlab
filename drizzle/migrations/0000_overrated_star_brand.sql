CREATE TABLE `curriculum_lessons` (
	`release_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`curriculum_id` text NOT NULL,
	`curriculum_week_id` text NOT NULL,
	`week` integer NOT NULL,
	`route` text NOT NULL,
	`title` text NOT NULL,
	`focus` text NOT NULL,
	`estimated_minutes` integer NOT NULL,
	PRIMARY KEY(`release_id`, `lesson_id`),
	FOREIGN KEY (`release_id`) REFERENCES `curriculum_releases`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "curriculum_lessons_week_positive" CHECK(week > 0),
	CONSTRAINT "curriculum_lessons_estimated_minutes_range" CHECK(estimated_minutes between 1 and 180)
);
--> statement-breakpoint
CREATE INDEX `curriculum_lessons_curriculum_week_idx` ON `curriculum_lessons` (`release_id`,`curriculum_id`,`week`);--> statement-breakpoint
CREATE TABLE `curriculum_release_skills` (
	`release_id` text NOT NULL,
	`skill_id` text NOT NULL,
	PRIMARY KEY(`release_id`, `skill_id`),
	FOREIGN KEY (`release_id`) REFERENCES `curriculum_releases`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `curriculum_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`schema_version` integer NOT NULL,
	`content_hash` text NOT NULL,
	`published_at` integer NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	CONSTRAINT "curriculum_releases_schema_version_positive" CHECK(schema_version > 0),
	CONSTRAINT "curriculum_releases_content_hash_sha256" CHECK(length(content_hash) = 64)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `curriculum_releases_version_unique` ON `curriculum_releases` (`version`);--> statement-breakpoint
CREATE TABLE `learner_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`preferences_schema_version` integer DEFAULT 1 NOT NULL,
	`preferences_json` text DEFAULT '{"schemaVersion":1,"instrument":null,"handedness":null,"tuning":null,"startingPoint":null,"goals":[],"practiceMinutes":null,"availableDays":[],"lessonPresentation":null}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_active_at` integer,
	CONSTRAINT "learner_profiles_preferences_json_valid" CHECK(json_valid(preferences_json)),
	CONSTRAINT "learner_profiles_preferences_schema_positive" CHECK(preferences_schema_version > 0)
);
--> statement-breakpoint
CREATE INDEX `learner_profiles_last_active_idx` ON `learner_profiles` (`last_active_at`);--> statement-breakpoint
CREATE TABLE `lesson_completion_events` (
	`id` text PRIMARY KEY NOT NULL,
	`progress_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`curriculum_release_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`completion_source` text NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`progress_id`,`learner_id`) REFERENCES `lesson_progress`(`id`,`learner_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`curriculum_release_id`,`lesson_id`) REFERENCES `curriculum_lessons`(`release_id`,`lesson_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `lesson_completion_events_learner_completed_idx` ON `lesson_completion_events` (`learner_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`curriculum_release_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`last_block_id` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_release_id`,`lesson_id`) REFERENCES `curriculum_lessons`(`release_id`,`lesson_id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "lesson_progress_completion_timestamp_consistent" CHECK((status = 'in_progress' and completed_at is null) or (status = 'completed' and completed_at is not null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_progress_learner_release_lesson_unique` ON `lesson_progress` (`learner_id`,`curriculum_release_id`,`lesson_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_progress_id_learner_unique` ON `lesson_progress` (`id`,`learner_id`);--> statement-breakpoint
CREATE INDEX `lesson_progress_learner_status_idx` ON `lesson_progress` (`learner_id`,`status`);--> statement-breakpoint
CREATE TABLE `practice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`primary_curriculum_release_id` text,
	`primary_lesson_id` text,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`planned_minutes` integer,
	`actual_duration_seconds` integer DEFAULT 0 NOT NULL,
	`focus` text,
	`difficulty` integer,
	`reflection` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`primary_curriculum_release_id`,`primary_lesson_id`) REFERENCES `curriculum_lessons`(`release_id`,`lesson_id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "practice_sessions_planned_minutes_range" CHECK(planned_minutes is null or planned_minutes between 1 and 180),
	CONSTRAINT "practice_sessions_actual_duration_nonnegative" CHECK(actual_duration_seconds between 0 and 43200),
	CONSTRAINT "practice_sessions_difficulty_range" CHECK(difficulty is null or difficulty between 1 and 5),
	CONSTRAINT "practice_sessions_primary_lesson_pair" CHECK((primary_curriculum_release_id is null and primary_lesson_id is null) or (primary_curriculum_release_id is not null and primary_lesson_id is not null)),
	CONSTRAINT "practice_sessions_status_timestamps_consistent" CHECK((status = 'in_progress' and ended_at is null) or (status in ('completed', 'abandoned') and ended_at is not null)),
	CONSTRAINT "practice_sessions_completed_duration_positive" CHECK(status <> 'completed' or actual_duration_seconds > 0),
	CONSTRAINT "practice_sessions_reflection_length" CHECK(reflection is null or length(reflection) <= 2000)
);
--> statement-breakpoint
CREATE INDEX `practice_sessions_learner_started_idx` ON `practice_sessions` (`learner_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `skill_assessment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`curriculum_release_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`lesson_id` text,
	`assessment_kind` text NOT NULL,
	`evidence_type` text NOT NULL,
	`outcome` text NOT NULL,
	`score` integer,
	`evidence_summary` text,
	`evidence_json` text DEFAULT '{}' NOT NULL,
	`assessed_at` integer NOT NULL,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_release_id`,`skill_id`) REFERENCES `curriculum_release_skills`(`release_id`,`skill_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`curriculum_release_id`,`lesson_id`) REFERENCES `curriculum_lessons`(`release_id`,`lesson_id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "skill_assessment_attempts_score_range" CHECK(score is null or score between 0 and 100),
	CONSTRAINT "skill_assessment_attempts_summary_length" CHECK(evidence_summary is null or length(evidence_summary) <= 1000),
	CONSTRAINT "skill_assessment_attempts_evidence_json_valid" CHECK(json_valid(evidence_json))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skill_assessment_attempts_mastery_fk_unique` ON `skill_assessment_attempts` (`id`,`learner_id`,`skill_id`,`curriculum_release_id`);--> statement-breakpoint
CREATE INDEX `skill_assessment_attempts_learner_skill_time_idx` ON `skill_assessment_attempts` (`learner_id`,`skill_id`,`assessed_at`);--> statement-breakpoint
CREATE TABLE `skill_mastery` (
	`learner_id` text NOT NULL,
	`curriculum_release_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`state` text NOT NULL,
	`evidence_count` integer DEFAULT 0 NOT NULL,
	`confidence` integer,
	`last_assessment_id` text,
	`last_assessed_at` integer,
	`next_review_at` integer,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`learner_id`, `curriculum_release_id`, `skill_id`),
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_release_id`,`skill_id`) REFERENCES `curriculum_release_skills`(`release_id`,`skill_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`last_assessment_id`,`learner_id`,`skill_id`,`curriculum_release_id`) REFERENCES `skill_assessment_attempts`(`id`,`learner_id`,`skill_id`,`curriculum_release_id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "skill_mastery_evidence_count_nonnegative" CHECK(evidence_count >= 0),
	CONSTRAINT "skill_mastery_confidence_range" CHECK(confidence is null or confidence between 0 and 100),
	CONSTRAINT "skill_mastery_stable_requires_evidence" CHECK(state <> 'stable' or (evidence_count > 0 and last_assessment_id is not null))
);
--> statement-breakpoint
CREATE INDEX `skill_mastery_learner_state_idx` ON `skill_mastery` (`learner_id`,`state`);--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`display_name` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `skills_category_idx` ON `skills` (`category`);

-- GUITARLAB_CURRICULUM_SEED: 6bd7e2fc1294e28318f72428ca4f6025fae8157abefbf2ff9c591c125b074abd
-- Curriculum content remains authoritative in Git; this seeds lookup metadata only.
INSERT INTO curriculum_releases (id, version, schema_version, content_hash, published_at, status) VALUES ('curriculum-v1', '1.0.0', 1, '6bd7e2fc1294e28318f72428ca4f6025fae8157abefbf2ff9c591c125b074abd', 1794355200000, 'published') ON CONFLICT(id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('arrangement.song-form', 'arrangement', 'Song Form') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'arrangement.song-form') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('ear.intervals', 'ear', 'Intervals') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'ear.intervals') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('ear.melody-transcription', 'ear', 'Melody Transcription') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'ear.melody-transcription') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('ear.pitch', 'ear', 'Pitch') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'ear.pitch') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('ear.rhythm', 'ear', 'Rhythm') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'ear.rhythm') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('fingerstyle.patterns', 'fingerstyle', 'Patterns') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'fingerstyle.patterns') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('fingerstyle.thumb-independence', 'fingerstyle', 'Thumb Independence') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'fingerstyle.thumb-independence') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('fretboard.natural-notes', 'fretboard', 'Natural Notes') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'fretboard.natural-notes') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('fretboard.octaves', 'fretboard', 'Octaves') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'fretboard.octaves') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('fretboard.string-map', 'fretboard', 'String Map') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'fretboard.string-map') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('harmony.barre-chords', 'harmony', 'Barre Chords') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'harmony.barre-chords') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('harmony.open-chords', 'harmony', 'Open Chords') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'harmony.open-chords') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('harmony.power-chords', 'harmony', 'Power Chords') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'harmony.power-chords') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('harmony.seventh-chords', 'harmony', 'Seventh Chords') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'harmony.seventh-chords') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('harmony.transitions', 'harmony', 'Transitions') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'harmony.transitions') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('harmony.triads', 'harmony', 'Triads') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'harmony.triads') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('harmony.voice-leading', 'harmony', 'Voice Leading') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'harmony.voice-leading') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('instrument.posture', 'instrument', 'Posture') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'instrument.posture') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('instrument.tuning', 'instrument', 'Tuning') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'instrument.tuning') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('lead.major-scale', 'lead', 'Major Scale') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'lead.major-scale') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('lead.pentatonic', 'lead', 'Pentatonic') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'lead.pentatonic') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('lead.phrasing', 'lead', 'Phrasing') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'lead.phrasing') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('notation.tab', 'notation', 'Tab') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'notation.tab') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('performance.recording', 'performance', 'Recording') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'performance.recording') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('performance.recovery', 'performance', 'Recovery') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'performance.recovery') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('repertoire.song-learning', 'repertoire', 'Song Learning') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'repertoire.song-learning') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('rhythm.muting', 'rhythm', 'Muting') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'rhythm.muting') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('rhythm.pulse', 'rhythm', 'Pulse') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'rhythm.pulse') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('rhythm.strumming', 'rhythm', 'Strumming') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'rhythm.strumming') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('rhythm.subdivision', 'rhythm', 'Subdivision') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'rhythm.subdivision') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('technique.alternate-picking', 'technique', 'Alternate Picking') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'technique.alternate-picking') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('technique.bends', 'technique', 'Bends') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'technique.bends') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('technique.legato', 'technique', 'Legato') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'technique.legato') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO skills (id, category, display_name) VALUES ('technique.string-crossing', 'technique', 'String Crossing') ON CONFLICT(id) DO NOTHING;
INSERT INTO curriculum_release_skills (release_id, skill_id) VALUES ('curriculum-v1', 'technique.string-crossing') ON CONFLICT(release_id, skill_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w01-lesson', 'year-1', 'y1-w01', 1, 'core', 'Meet your guitar', 'Setup, posture, string names and tuning', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w02-lesson', 'year-1', 'y1-w02', 2, 'core', 'Clear single notes', 'Fretting-hand basics, clean tone and relaxed pressure', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w03-lesson', 'year-1', 'y1-w03', 3, 'core', 'Read guitar maps', 'Chord-box orientation, TAB lines and fret numbers', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w04-lesson', 'year-1', 'y1-w04', 4, 'core', 'First chord shapes', 'Em and G; checking each string', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w05-lesson', 'year-1', 'y1-w05', 5, 'core', 'Open chords A, D and E', 'Three essential open-chord shapes', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w06-lesson', 'year-1', 'y1-w06', 6, 'core', 'First complete chord loop', 'Chord changes with pulse and a first musical phrase', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w07-lesson', 'year-1', 'y1-w07', 7, 'core', 'Strum in time', 'Downstrokes, upstrokes and subdivisions', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w08-lesson', 'year-1', 'y1-w08', 8, 'core', 'Optional notation: strings 1 and 2', 'Parallel track: first-position notes on high E and B', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w09-lesson', 'year-1', 'y1-w09', 9, 'core', 'Add C, Am and Dm', 'Major/minor open chords and smooth transitions', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w10-lesson', 'year-1', 'y1-w10', 10, 'core', 'Make rhythm musical', 'Accents, rests and dynamics', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w11-lesson', 'year-1', 'y1-w11', 11, 'core', 'Your first music map', 'Open-string map, semitone steps and first fretboard landmarks', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w12-lesson', 'year-1', 'y1-w12', 12, 'core', 'Quarter 1 review and recording', 'Consolidate tuning, reading, open chords and pulse', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w13-lesson', 'year-1', 'y1-w13', 13, 'core', 'Optional notation: strings 3 and 4', 'Parallel track: extend staff-reading to G and D strings', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w14-lesson', 'year-1', 'y1-w14', 14, 'core', 'Optional notation: low E and A landmarks', 'Parallel track: low-string fretboard landmarks', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w15-lesson', 'year-1', 'y1-w15', 15, 'core', 'Pick control and clean tone', 'Alternate picking and string crossing', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w16-lesson', 'year-1', 'y1-w16', 16, 'core', 'Fingerstyle foundation', 'Thumb and fingers as separate roles', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w17-lesson', 'year-1', 'y1-w17', 17, 'core', 'Build the major scale', 'Whole-step/half-step formula and a small C major pattern', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w18-lesson', 'year-1', 'y1-w18', 18, 'core', 'Shell chords: roots and guide tones', 'Three-note chord grips as a bridge to movable chords', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w19-lesson', 'year-1', 'y1-w19', 19, 'core', 'Your first 12-bar blues', 'Blues form, dominant seventh colour and groove', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w20-lesson', 'year-1', 'y1-w20', 20, 'core', 'Play with expression', 'Slides, bends, dynamics and phrasing', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w21-lesson', 'year-1', 'y1-w21', 21, 'core', 'Movable power chords', 'Root-5 shapes, muting and rock rhythm', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w22-lesson', 'year-1', 'y1-w22', 22, 'core', 'Approach barre chords safely', 'Partial barre shape and efficient pressure', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w23-lesson', 'year-1', 'y1-w23', 23, 'core', 'Minor pentatonic box 1', 'Map the five notes and find the roots', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w24-lesson', 'year-1', 'y1-w24', 24, 'core', 'Half-year playing test', 'Integrate chords, rhythm, melody and recording', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w25-lesson', 'year-1', 'y1-w25', 25, 'core', 'Find roots and octaves', 'Fretboard navigation beyond open position', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w26-lesson', 'year-1', 'y1-w26', 26, 'core', 'Triads on the top strings', 'Compact voicings and inversions', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w27-lesson', 'year-1', 'y1-w27', 27, 'core', 'Chords in keys', 'Roman numerals and diatonic chord families', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w28-lesson', 'year-1', 'y1-w28', 28, 'core', 'Capo and transposition', 'Move a song to a comfortable singing key', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w29-lesson', 'year-1', 'y1-w29', 29, 'core', 'Suspended and seventh chords', 'Add colour tones without losing pulse', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w30-lesson', 'year-1', 'y1-w30', 30, 'core', 'Sixteenth-note rhythm', 'Count subdivisions and control accents', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w31-lesson', 'year-1', 'y1-w31', 31, 'core', 'Hammer-ons and pull-offs', 'Legato notes with consistent volume', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w32-lesson', 'year-1', 'y1-w32', 32, 'core', 'Quarter 2 review', 'Revisit notes, chords, fingerstyle, scales and blues', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w33-lesson', 'year-1', 'y1-w33', 33, 'core', 'Major pentatonic and phrasing', 'Contrast major and minor pentatonic colour', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w34-lesson', 'year-1', 'y1-w34', 34, 'core', 'Improvise with motifs', 'Repeat, vary and resolve short melodic ideas', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w35-lesson', 'year-1', 'y1-w35', 35, 'core', 'Arpeggios and chord tones', 'Outline harmony with notes of each chord', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w36-lesson', 'year-1', 'y1-w36', 36, 'core', 'Three notes per string', 'Extend the scale beyond first position', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w37-lesson', 'year-1', 'y1-w37', 37, 'core', 'Learn a melody by ear', 'Listen, sing, find and verify notes', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w38-lesson', 'year-1', 'y1-w38', 38, 'core', 'Songwriting and arrangement', 'Create an original 4- or 8-bar section', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w39-lesson', 'year-1', 'y1-w39', 39, 'core', 'Blues turnarounds', 'End a blues chorus and lead into the next cycle', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w40-lesson', 'year-1', 'y1-w40', 40, 'core', 'Rock rhythm and muting', 'Palm muting, power-chord changes and silence', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w41-lesson', 'year-1', 'y1-w41', 41, 'core', 'Jazz chord grips', 'Basic maj7, m7 and dominant 7 colour', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w42-lesson', 'year-1', 'y1-w42', 42, 'core', 'The ii-V-I connection', 'Connect jazz chords with voice leading', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w43-lesson', 'year-1', 'y1-w43', 43, 'core', 'Comping styles', 'Change the accompaniment rhythm without changing harmony', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w44-lesson', 'year-1', 'y1-w44', 44, 'core', 'Quarter 3 review', 'Retest barre, triads, ear skills, 16ths and lead phrasing', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w45-lesson', 'year-1', 'y1-w45', 45, 'core', 'Sight-read across strings', 'Read pitch and rhythm together', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w46-lesson', 'year-1', 'y1-w46', 46, 'core', 'Move between positions', 'Connect two scale areas using a guide tone', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w47-lesson', 'year-1', 'y1-w47', 47, 'core', 'Chord melody basics', 'Place melody notes above simple chord tones', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w48-lesson', 'year-1', 'y1-w48', 48, 'core', 'Compose a complete study', 'Write an 8-bar piece with clear form', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w49-lesson', 'year-1', 'y1-w49', 49, 'core', 'Dynamics and articulation', 'Control volume, note length and phrase endings', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w50-lesson', 'year-1', 'y1-w50', 50, 'core', 'Repertoire polishing', 'Bring one complete piece close to performance-ready', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w51-lesson', 'year-1', 'y1-w51', 51, 'core', 'Mock performance and transcription', 'Perform, listen back and reproduce one short phrase', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y1-w52-lesson', 'year-1', 'y1-w52', 52, 'core', 'Year-end playing test', 'Demonstrate rhythm, chords, reading, lead/fingerstyle and musicianship', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w01-lesson', 'year-2', 'y2-w01', 1, 'core', 'Fretboard map 1', 'Natural notes on low E and A', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w02-lesson', 'year-2', 'y2-w02', 2, 'core', 'Fretboard map 2', 'Octaves across adjacent string sets', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w03-lesson', 'year-2', 'y2-w03', 3, 'core', 'CAGED and advanced fretboard map', 'Connect open shapes, movable regions and octave landmarks', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w04-lesson', 'year-2', 'y2-w04', 4, 'core', 'Triad inversions', 'Major triads in root position and inversions', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w05-lesson', 'year-2', 'y2-w05', 5, 'core', 'Minor triad inversions', 'Minor colour across the neck', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w06-lesson', 'year-2', 'y2-w06', 6, 'core', 'Quarter review: fretboard', 'Test roots, octave links and triads', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w07-lesson', 'year-2', 'y2-w07', 7, 'core', 'Power-chord accuracy', 'Root-6 and root-5 power chords', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w08-lesson', 'year-2', 'y2-w08', 8, 'core', 'Palm-muted groove', 'Switch between open and palm-muted notes', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w09-lesson', 'year-2', 'y2-w09', 9, 'core', 'Barre chord refresh', 'E-shape major and minor forms', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w10-lesson', 'year-2', 'y2-w10', 10, 'core', 'A-shape barre chords', 'Five-string movable shapes and muting', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w11-lesson', 'year-2', 'y2-w11', 11, 'core', 'Quarter review: rhythm guitar', 'Combine power chords, barres and muting', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w12-lesson', 'year-2', 'y2-w12', 12, 'core', 'Major scale position 1', 'C major/G major scale and root awareness', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w13-lesson', 'year-2', 'y2-w13', 13, 'core', 'Scale sequences', 'Thirds and four-note sequences', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w14-lesson', 'year-2', 'y2-w14', 14, 'core', 'Position changes', 'Link positions by a shared note', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w15-lesson', 'year-2', 'y2-w15', 15, 'core', 'Major scale phrase-making', 'Build melody with chord tones', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w16-lesson', 'year-2', 'y2-w16', 16, 'core', 'Quarter review: melody', 'Assess scale accuracy, phrasing and timing', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w17-lesson', 'year-2', 'y2-w17', 17, 'core', 'Blues shuffle 1', 'Swing subdivision and shuffle feel', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w18-lesson', 'year-2', 'y2-w18', 18, 'core', 'Blues shuffle 2', 'Open seventh chords and chord changes', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w19-lesson', 'year-2', 'y2-w19', 19, 'core', 'Blues lead vocabulary', 'Mix minor pentatonic with chord tones', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w20-lesson', 'year-2', 'y2-w20', 20, 'core', 'Bends and vibrato', 'Bend to target pitch and control vibrato', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w21-lesson', 'year-2', 'y2-w21', 21, 'core', 'Blues turnaround', 'Connect bar 12 to the next chorus', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w22-lesson', 'year-2', 'y2-w22', 22, 'core', 'Quarter review: blues', 'Play a complete blues form and lead chorus', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w23-lesson', 'year-2', 'y2-w23', 23, 'core', 'Fingerstyle bass independence', 'Keep bass steady while treble notes vary', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w24-lesson', 'year-2', 'y2-w24', 24, 'core', 'Fingerstyle pattern changes', 'Shift from arpeggio to syncopated pattern', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w25-lesson', 'year-2', 'y2-w25', 25, 'core', 'Fingerstyle melody balance', 'Bring out top melody over accompaniment', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w26-lesson', 'year-2', 'y2-w26', 26, 'core', 'Percussive and muted accents', 'Add light percussive texture safely', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w27-lesson', 'year-2', 'y2-w27', 27, 'core', 'Arrange a folk piece', 'Create intro, verse and ending from one progression', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w28-lesson', 'year-2', 'y2-w28', 28, 'core', 'Quarter review: acoustic', 'Record an acoustic piece with stable dynamics', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w29-lesson', 'year-2', 'y2-w29', 29, 'core', 'Song form and sections', 'Hear verse, chorus, bridge and turnarounds', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w30-lesson', 'year-2', 'y2-w30', 30, 'core', 'Learn by ear: rhythm', 'Transcribe strumming accents and rests', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w31-lesson', 'year-2', 'y2-w31', 31, 'core', 'Learn by ear: bass', 'Find the root movement under a progression', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w32-lesson', 'year-2', 'y2-w32', 32, 'core', 'Learn by ear: melody', 'Transcribe a 5-8 note phrase', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w33-lesson', 'year-2', 'y2-w33', 33, 'core', 'Chord melody II', 'Add inner voices to a short melody', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w34-lesson', 'year-2', 'y2-w34', 34, 'core', 'Quarter review: repertoire', 'Learn a complete piece from map to performance', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w35-lesson', 'year-2', 'y2-w35', 35, 'core', 'Music theory: intervals', 'Identify intervals by sound and fretboard distance', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w36-lesson', 'year-2', 'y2-w36', 36, 'core', 'Build seventh chords', 'Construct maj7, m7 and dominant 7 from formulas', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w37-lesson', 'year-2', 'y2-w37', 37, 'core', 'Chord extensions', 'Add 9ths and suspended tones tastefully', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w38-lesson', 'year-2', 'y2-w38', 38, 'core', 'Chord substitution', 'Try one substitution and explain its function', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w39-lesson', 'year-2', 'y2-w39', 39, 'core', 'Quarter review: harmony', 'Create a progression, analyse and perform it', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w40-lesson', 'year-2', 'y2-w40', 40, 'core', 'Jazz swing comping', 'Use a relaxed swing feel and sparse voicings', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w41-lesson', 'year-2', 'y2-w41', 41, 'core', 'Jazz ii-V-I voice leading', 'Resolve guide tones with small movements', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w42-lesson', 'year-2', 'y2-w42', 42, 'core', 'Bossa nova foundation', 'Play a repeating bass/chord pattern', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w43-lesson', 'year-2', 'y2-w43', 43, 'core', 'Jazz melody phrasing', 'Play melody, comp and short solo over a form', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w44-lesson', 'year-2', 'y2-w44', 44, 'core', 'Jazz blues', 'Combine 12-bar form and seventh chords', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w45-lesson', 'year-2', 'y2-w45', 45, 'core', 'Quarter review: jazz', 'Record a short melody-comp-solo arrangement', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w46-lesson', 'year-2', 'y2-w46', 46, 'core', 'Practice architecture', 'Build a weekly practice menu by priority', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w47-lesson', 'year-2', 'y2-w47', 47, 'core', 'Transcribe a phrase', 'Copy articulation, rhythm and pitch from a reference', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w48-lesson', 'year-2', 'y2-w48', 48, 'core', 'Write a solo chorus', 'Use motifs, space and chord tones over progression', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w49-lesson', 'year-2', 'y2-w49', 49, 'core', 'Arrangement, dynamics and style comparison', 'Create contrast without losing the pulse', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w50-lesson', 'year-2', 'y2-w50', 50, 'core', 'Recording craft', 'Balance levels and capture a clean one-take performance', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w51-lesson', 'year-2', 'y2-w51', 51, 'core', 'Rehearsal, stamina and a 3-piece set', 'Prepare a short set with reliable transitions', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y2-w52-lesson', 'year-2', 'y2-w52', 52, 'core', 'Year 2 mock exam and next-path plan', 'Assess repertoire, fretboard, harmony and performance readiness', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w01-lesson', 'year-3-specialisations', 'y3-rock-blues-w01', 1, 'rock-blues', 'Technique reset', 'Technique reset — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w02-lesson', 'year-3-specialisations', 'y3-rock-blues-w02', 2, 'rock-blues', 'Pentatonic across neck', 'Pentatonic across neck — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w03-lesson', 'year-3-specialisations', 'y3-rock-blues-w03', 3, 'rock-blues', 'Bends to pitch', 'Bends to pitch — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w04-lesson', 'year-3-specialisations', 'y3-rock-blues-w04', 4, 'rock-blues', 'Legato control', 'Legato control — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w05-lesson', 'year-3-specialisations', 'y3-rock-blues-w05', 5, 'rock-blues', 'Blues shuffle arrangement', 'Blues shuffle arrangement — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w06-lesson', 'year-3-specialisations', 'y3-rock-blues-w06', 6, 'rock-blues', 'Quarter review: lead tone', 'Quarter review: lead tone — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w07-lesson', 'year-3-specialisations', 'y3-rock-blues-w07', 7, 'rock-blues', 'Chord-tone soloing', 'Chord-tone soloing — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w08-lesson', 'year-3-specialisations', 'y3-rock-blues-w08', 8, 'rock-blues', 'Riff construction', 'Riff construction — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w09-lesson', 'year-3-specialisations', 'y3-rock-blues-w09', 9, 'rock-blues', 'Modal colour', 'Modal colour — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w10-lesson', 'year-3-specialisations', 'y3-rock-blues-w10', 10, 'rock-blues', 'Phrasing and silence', 'Phrasing and silence — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w11-lesson', 'year-3-specialisations', 'y3-rock-blues-w11', 11, 'rock-blues', 'Performance arrangement', 'Performance arrangement — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-rock-blues-w12-lesson', 'year-3-specialisations', 'y3-rock-blues-w12', 12, 'rock-blues', 'Path capstone', 'Path capstone — Develop more controlled lead playing, blues vocabulary, riffs and performance arrangements.', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w01-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w01', 1, 'fingerstyle-acoustic', 'Right-hand independence', 'Right-hand independence — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w02-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w02', 2, 'fingerstyle-acoustic', 'Arpeggio consistency', 'Arpeggio consistency — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w03-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w03', 3, 'fingerstyle-acoustic', 'Alternating bass', 'Alternating bass — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w04-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w04', 4, 'fingerstyle-acoustic', 'Chord melody basics', 'Chord melody basics — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w05-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w05', 5, 'fingerstyle-acoustic', 'Sus and add9 colour', 'Sus and add9 colour — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w06-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w06', 6, 'fingerstyle-acoustic', 'Quarter review: acoustic tone', 'Quarter review: acoustic tone — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w07-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w07', 7, 'fingerstyle-acoustic', 'Percussive accompaniment', 'Percussive accompaniment — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w08-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w08', 8, 'fingerstyle-acoustic', 'Moving bass lines', 'Moving bass lines — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w09-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w09', 9, 'fingerstyle-acoustic', 'Arrange a melody', 'Arrange a melody — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w10-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w10', 10, 'fingerstyle-acoustic', 'Open-string colour', 'Open-string colour — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w11-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w11', 11, 'fingerstyle-acoustic', 'Dynamic arc', 'Dynamic arc — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-fingerstyle-acoustic-w12-lesson', 'year-3-specialisations', 'y3-fingerstyle-acoustic-w12', 12, 'fingerstyle-acoustic', 'Path capstone', 'Path capstone — Build independent fingerstyle, bass movement, chord melody and acoustic arrangement skills.', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w01-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w01', 1, 'jazz-harmony', 'Jazz chord grips', 'Jazz chord grips — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w02-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w02', 2, 'jazz-harmony', 'Swing subdivision', 'Swing subdivision — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w03-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w03', 3, 'jazz-harmony', 'Guide tones', 'Guide tones — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w04-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w04', 4, 'jazz-harmony', 'ii-V-I in two keys', 'ii-V-I in two keys — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w05-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w05', 5, 'jazz-harmony', 'Chord extensions', 'Chord extensions — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w06-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w06', 6, 'jazz-harmony', 'Quarter review: jazz comp', 'Quarter review: jazz comp — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w07-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w07', 7, 'jazz-harmony', 'Bossa pattern', 'Bossa pattern — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w08-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w08', 8, 'jazz-harmony', 'Jazz blues form', 'Jazz blues form — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w09-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w09', 9, 'jazz-harmony', 'Chord-tone soloing', 'Chord-tone soloing — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w10-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w10', 10, 'jazz-harmony', 'Tune learning workflow', 'Tune learning workflow — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w11-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w11', 11, 'jazz-harmony', 'Reharmonisation', 'Reharmonisation — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-jazz-harmony-w12-lesson', 'year-3-specialisations', 'y3-jazz-harmony-w12', 12, 'jazz-harmony', 'Path capstone', 'Path capstone — Develop jazz comping, guide-tone movement, extensions, standards and reharmonisation.', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w01-lesson', 'year-3-specialisations', 'y3-all-round-musician-w01', 1, 'all-round-musician', 'Listening journal', 'Listening journal — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w02-lesson', 'year-3-specialisations', 'y3-all-round-musician-w02', 2, 'all-round-musician', 'Ear intervals', 'Ear intervals — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w03-lesson', 'year-3-specialisations', 'y3-all-round-musician-w03', 3, 'all-round-musician', 'Sight reading routine', 'Sight reading routine — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w04-lesson', 'year-3-specialisations', 'y3-all-round-musician-w04', 4, 'all-round-musician', 'Harmony analysis', 'Harmony analysis — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w05-lesson', 'year-3-specialisations', 'y3-all-round-musician-w05', 5, 'all-round-musician', 'Transposition', 'Transposition — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w06-lesson', 'year-3-specialisations', 'y3-all-round-musician-w06', 6, 'all-round-musician', 'Quarter review: musicianship', 'Quarter review: musicianship — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w07-lesson', 'year-3-specialisations', 'y3-all-round-musician-w07', 7, 'all-round-musician', 'Arranging texture', 'Arranging texture — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w08-lesson', 'year-3-specialisations', 'y3-all-round-musician-w08', 8, 'all-round-musician', 'Recording feedback', 'Recording feedback — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w09-lesson', 'year-3-specialisations', 'y3-all-round-musician-w09', 9, 'all-round-musician', 'Songwriting form', 'Songwriting form — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w10-lesson', 'year-3-specialisations', 'y3-all-round-musician-w10', 10, 'all-round-musician', 'Ensemble preparation', 'Ensemble preparation — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w11-lesson', 'year-3-specialisations', 'y3-all-round-musician-w11', 11, 'all-round-musician', 'Teaching a skill', 'Teaching a skill — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 30) ON CONFLICT(release_id, lesson_id) DO NOTHING;
INSERT INTO curriculum_lessons (release_id, lesson_id, curriculum_id, curriculum_week_id, week, route, title, focus, estimated_minutes) VALUES ('curriculum-v1', 'y3-all-round-musician-w12-lesson', 'year-3-specialisations', 'y3-all-round-musician-w12', 12, 'all-round-musician', 'Path capstone', 'Path capstone — Integrate listening, reading, harmony, arranging, recording, songwriting and ensemble skills.', 40) ON CONFLICT(release_id, lesson_id) DO NOTHING;
-- Immutable curriculum and append-only learning evidence guards.
CREATE TRIGGER IF NOT EXISTS curriculum_releases_immutable_update BEFORE UPDATE ON curriculum_releases BEGIN SELECT RAISE(ABORT, 'curriculum releases are immutable; publish a new version'); END;
CREATE TRIGGER IF NOT EXISTS curriculum_releases_immutable_delete BEFORE DELETE ON curriculum_releases BEGIN SELECT RAISE(ABORT, 'curriculum releases are immutable'); END;
CREATE TRIGGER IF NOT EXISTS curriculum_lessons_immutable_update BEFORE UPDATE ON curriculum_lessons BEGIN SELECT RAISE(ABORT, 'curriculum lesson metadata is immutable within a release'); END;
CREATE TRIGGER IF NOT EXISTS curriculum_lessons_immutable_delete BEFORE DELETE ON curriculum_lessons BEGIN SELECT RAISE(ABORT, 'curriculum lesson metadata is immutable within a release'); END;
CREATE TRIGGER IF NOT EXISTS skills_immutable_update BEFORE UPDATE ON skills BEGIN SELECT RAISE(ABORT, 'skill identifiers are immutable'); END;
CREATE TRIGGER IF NOT EXISTS skills_immutable_delete BEFORE DELETE ON skills BEGIN SELECT RAISE(ABORT, 'skill identifiers are immutable'); END;
CREATE TRIGGER IF NOT EXISTS curriculum_release_skills_immutable_update BEFORE UPDATE ON curriculum_release_skills BEGIN SELECT RAISE(ABORT, 'released skill mappings are immutable'); END;
CREATE TRIGGER IF NOT EXISTS curriculum_release_skills_immutable_delete BEFORE DELETE ON curriculum_release_skills BEGIN SELECT RAISE(ABORT, 'released skill mappings are immutable'); END;
CREATE TRIGGER IF NOT EXISTS skill_assessment_attempts_no_update BEFORE UPDATE ON skill_assessment_attempts BEGIN SELECT RAISE(ABORT, 'assessment attempts are append-only'); END;
CREATE TRIGGER IF NOT EXISTS skill_assessment_attempts_no_delete BEFORE DELETE ON skill_assessment_attempts BEGIN SELECT RAISE(ABORT, 'assessment attempts are append-only'); END;
CREATE TRIGGER IF NOT EXISTS lesson_completion_events_no_update BEFORE UPDATE ON lesson_completion_events BEGIN SELECT RAISE(ABORT, 'lesson completion events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS lesson_completion_events_no_delete BEFORE DELETE ON lesson_completion_events BEGIN SELECT RAISE(ABORT, 'lesson completion events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS skill_mastery_passed_evidence_insert BEFORE INSERT ON skill_mastery WHEN NEW.state = 'stable' BEGIN SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM skill_assessment_attempts WHERE id = NEW.last_assessment_id AND learner_id = NEW.learner_id AND skill_id = NEW.skill_id AND curriculum_release_id = NEW.curriculum_release_id AND outcome = 'passed') THEN RAISE(ABORT, 'stable mastery requires a passed assessment for the same learner and skill') END; END;
CREATE TRIGGER IF NOT EXISTS skill_mastery_passed_evidence_update BEFORE UPDATE ON skill_mastery WHEN NEW.state = 'stable' BEGIN SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM skill_assessment_attempts WHERE id = NEW.last_assessment_id AND learner_id = NEW.learner_id AND skill_id = NEW.skill_id AND curriculum_release_id = NEW.curriculum_release_id AND outcome = 'passed') THEN RAISE(ABORT, 'stable mastery requires a passed assessment for the same learner and skill') END; END;
