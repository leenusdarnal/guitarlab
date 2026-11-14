<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    finishActivePracticeSession,
    listActivePracticeEvidence,
    listActivePracticeSessions,
    pauseActivePracticeSession,
    recordActivePracticeEvidence,
    resumeActivePracticeSession,
    startActivePracticeSession
  } from '../../lib/storage/practice';
  import type {
    PracticeEvidenceRecord,
    PracticeSessionRecord
  } from '../../lib/repositories/contracts';
  import { filterPracticeSessions } from '../../lib/application/practice-history';
  import { getSkillCategoryDisplayName } from '../../lib/application/skill-catalog';
  import {
    resolveAdaptiveRecommendationFeedback,
    type AdaptivePracticeRecommendation,
    type AdaptivePracticeSnapshot
  } from '../../lib/application/adaptive-practice';
  import type { AdaptiveRecommendationFeedbackRecord } from '../../lib/repositories/contracts';
  import {
    loadActiveAdaptivePracticeSnapshot,
    loadActiveAdaptiveRecommendationFeedback,
    recordActiveAdaptiveRecommendationFeedback
  } from '../../lib/storage/indexeddb';

  let sessions = $state<PracticeSessionRecord[]>([]);
  let historyQuery = $state('');
  let historyStatus = $state<'all' | PracticeSessionRecord['status']>('all');
  let historyDateRange = $state<'all' | '7' | '30' | '90'>('all');
  let activeEvidence = $state<PracticeEvidenceRecord[]>([]);
  let historyEvidenceSessionId = $state<string | null>(null);
  let historyEvidence = $state<PracticeEvidenceRecord[]>([]);
  let historyEvidenceLoadingSessionId = $state<string | null>(null);
  let adaptiveSnapshot = $state<AdaptivePracticeSnapshot | null>(null);
  let adaptiveFeedbackRecords = $state<AdaptiveRecommendationFeedbackRecord[]>([]);
  let adaptiveFeedbackSavingId = $state<string | null>(null);
  let adaptiveLoading = $state(true);
  let adaptiveError = $state('');

  let plannedMinutes = $state<number | undefined>(20);
  let focus = $state('');
  let exerciseName = $state('');
  let repetitions = $state<number | undefined>();
  let cleanRepetitions = $state<number | undefined>();
  let tempoBpm = $state<number | undefined>();
  let exerciseDifficulty = $state<number | undefined>();
  let reflection = $state('');
  let nextTarget = $state('');

  let loading = $state(true);
  let saving = $state(false);
  let evidenceSaving = $state(false);
  let activeEvidenceLoading = $state(false);
  let error = $state('');
  let notice = $state('');
  let evidenceError = $state('');
  let evidenceNotice = $state('');
  let now = $state(Date.now());

  const filteredSessions = $derived(
    filterPracticeSessions(sessions, {
      query: historyQuery,
      status: historyStatus,
      dateRange: historyDateRange,
      now
    })
  );

  const activeSession = $derived(
    sessions.find(
      (session) =>
        session.status === 'in_progress' || session.status === 'paused'
    ) ?? null
  );
  const adaptiveRecommendationViews = $derived(
    resolveAdaptiveRecommendationFeedback({
      recommendations: adaptiveSnapshot?.recommendations ?? [],
      feedback: adaptiveFeedbackRecords
    })
  );
  const adaptiveRecommendations = $derived(
    adaptiveRecommendationViews.slice(0, 6)
  );

  async function loadActiveEvidence(sessionId: string) {
    activeEvidenceLoading = true;
    evidenceError = '';
    try {
      activeEvidence = await listActivePracticeEvidence(sessionId);
    } catch (cause) {
      evidenceError =
        cause instanceof Error
          ? cause.message
          : 'Could not load this session’s exercise observations.';
    } finally {
      activeEvidenceLoading = false;
    }
  }

  async function refreshAdaptivePractice() {
    adaptiveLoading = true;
    adaptiveError = '';
    try {
      const [snapshot, feedback] = await Promise.all([
        loadActiveAdaptivePracticeSnapshot(),
        loadActiveAdaptiveRecommendationFeedback()
      ]);
      adaptiveSnapshot = snapshot;
      adaptiveFeedbackRecords = feedback;
    } catch {
      adaptiveSnapshot = null;
      adaptiveError =
        'Adaptive practice suggestions could not be loaded from local learner records.';
    } finally {
      adaptiveLoading = false;
    }
  }

  async function refresh() {
    sessions = await listActivePracticeSessions();
    const current = sessions.find(
      (session) =>
        session.status === 'in_progress' || session.status === 'paused'
    );
    if (current) {
      await loadActiveEvidence(current.id);
    } else {
      activeEvidence = [];
    }
    await refreshAdaptivePractice();
  }

  onMount(() => {
    const clock = window.setInterval(() => (now = Date.now()), 1000);
    void refresh()
      .catch(() => {
        error =
          'Your local practice history could not be loaded. Check browser storage and try again.';
      })
      .finally(() => (loading = false));
    return () => window.clearInterval(clock);
  });

  function clearHistoryFilters() {
    historyQuery = '';
    historyStatus = 'all';
    historyDateRange = 'all';
  }

  async function startSession() {
    error = '';
    notice = '';
    const minutes = plannedMinutes ?? null;
    if (
      minutes !== null &&
      (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 180)
    ) {
      error =
        'Choose a whole-number plan between 1 and 180 minutes, or leave it blank.';
      return;
    }

    saving = true;
    try {
      await startActivePracticeSession({
        plannedMinutes: minutes,
        focus: focus.trim() || null
      });
      focus = '';
      reflection = '';
      nextTarget = '';
      await refresh();
      notice =
        'Practice session started. Elapsed session time is tracked locally.';
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'Could not start the practice session.';
    } finally {
      saving = false;
    }
  }

  async function togglePauseResume() {
    if (!activeSession) return;
    error = '';
    saving = true;
    try {
      if (activeSession.status === 'paused') {
        await resumeActivePracticeSession(activeSession.id);
        notice =
          'Session resumed. Paused time is excluded from active-session time.';
      } else {
        await pauseActivePracticeSession(activeSession.id);
        notice =
          'Session paused. Your accumulated active time has been saved.';
      }
      await refresh();
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'Could not update the practice session.';
    } finally {
      saving = false;
    }
  }

  async function saveExerciseObservation() {
    if (!activeSession) return;
    evidenceError = '';
    evidenceNotice = '';

    const name = exerciseName.trim();
    if (!name || name.length > 160) {
      evidenceError = 'Enter an exercise or drill name (up to 160 characters).';
      return;
    }
    if (
      typeof repetitions !== 'number' ||
      !Number.isSafeInteger(repetitions) ||
      repetitions < 0 ||
      repetitions > 100_000
    ) {
      evidenceError = 'Enter total repetitions as a whole number from 0 to 100,000.';
      return;
    }
    if (
      typeof cleanRepetitions !== 'number' ||
      !Number.isSafeInteger(cleanRepetitions) ||
      cleanRepetitions < 0 ||
      cleanRepetitions > 100_000
    ) {
      evidenceError = 'Enter clean repetitions as a whole number from 0 to 100,000.';
      return;
    }
    if (cleanRepetitions > repetitions) {
      evidenceError = 'Clean repetitions cannot exceed total repetitions.';
      return;
    }
    if (
      tempoBpm !== undefined &&
      (!Number.isSafeInteger(tempoBpm) || tempoBpm < 20 || tempoBpm > 300)
    ) {
      evidenceError = 'Tempo must be a whole number between 20 and 300 BPM.';
      return;
    }
    if (
      exerciseDifficulty !== undefined &&
      (!Number.isSafeInteger(exerciseDifficulty) ||
        exerciseDifficulty < 1 ||
        exerciseDifficulty > 5)
    ) {
      evidenceError = 'Difficulty must be a whole number from 1 to 5.';
      return;
    }

    evidenceSaving = true;
    try {
      await recordActivePracticeEvidence({
        sessionId: activeSession.id,
        exerciseId: name,
        repetitions,
        cleanRepetitions,
        tempoBpm: tempoBpm ?? null,
        difficulty: exerciseDifficulty ?? null
      });
      exerciseName = '';
      repetitions = undefined;
      cleanRepetitions = undefined;
      tempoBpm = undefined;
      exerciseDifficulty = undefined;
      await loadActiveEvidence(activeSession.id);
      await refreshAdaptivePractice();
      evidenceNotice = 'Exercise observation saved on this device.';
    } catch (cause) {
      evidenceError =
        cause instanceof Error
          ? cause.message
          : 'Could not save this exercise observation.';
    } finally {
      evidenceSaving = false;
    }
  }

  async function toggleHistoryEvidence(sessionId: string) {
    if (historyEvidenceSessionId === sessionId) {
      historyEvidenceSessionId = null;
      historyEvidence = [];
      return;
    }

    historyEvidenceSessionId = sessionId;
    historyEvidence = [];
    historyEvidenceLoadingSessionId = sessionId;
    try {
      const observations = await listActivePracticeEvidence(sessionId);
      if (historyEvidenceSessionId === sessionId) {
        historyEvidence = observations;
      }
    } catch (cause) {
      if (historyEvidenceSessionId === sessionId) {
        error =
          cause instanceof Error
            ? cause.message
            : 'Could not load this session’s exercise observations.';
        historyEvidence = [];
      }
    } finally {
      if (historyEvidenceLoadingSessionId === sessionId) {
        historyEvidenceLoadingSessionId = null;
      }
    }
  }

  async function finishSession() {
    if (!activeSession) return;
    error = '';
    saving = true;
    try {
      await finishActivePracticeSession(activeSession.id, {
        reflection: reflection.trim() || null,
        nextTarget: nextTarget.trim() || null
      });
      await refresh();
      notice =
        'Session saved. Elapsed session time is activity history, not verified active practice or a skill assessment.';
      reflection = '';
      nextTarget = '';
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'Could not save the practice session.';
    } finally {
      saving = false;
    }
  }


  async function saveAdaptiveRecommendationFeedback(
    recommendation: AdaptivePracticeRecommendation,
    action: AdaptiveRecommendationFeedbackRecord['action'],
    correction: AdaptiveRecommendationFeedbackRecord['correction'] = null
  ) {
    adaptiveError = '';
    adaptiveFeedbackSavingId = recommendation.id;
    try {
      await recordActiveAdaptiveRecommendationFeedback({
        recommendationId: recommendation.id,
        targetType: recommendation.targetType,
        targetId: recommendation.targetId,
        reasonCodes: recommendation.reasonCodes,
        action,
        correction
      });
      await refreshAdaptivePractice();
      notice = 'Your recommendation feedback was saved on this device.';
    } catch (cause) {
      adaptiveError =
        cause instanceof Error
          ? cause.message
          : 'Could not save your recommendation feedback.';
    } finally {
      adaptiveFeedbackSavingId = null;
    }
  }

  function adaptiveEvidenceLabel(
    recommendation: AdaptivePracticeRecommendation
  ) {
    if (recommendation.evidenceType === 'assessment') {
      return `${recommendation.evidenceCount} assessment(s)`;
    }
    if (recommendation.evidenceType === 'supporting_probe') {
      return `${recommendation.evidenceCount} supporting probe attempt(s)`;
    }
    if (recommendation.evidenceType === 'learner_observation') {
      return `${recommendation.evidenceCount} learner notes`;
    }
    return 'No whole-skill assessment yet';
  }

  function durationLabel(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return minutes > 0
      ? `${minutes} min ${remaining} sec`
      : `${remaining} sec`;
  }

  function dateLabel(timestamp: number) {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  function observationTempoLabel(observation: PracticeEvidenceRecord) {
    return observation.tempoBpm === null
      ? 'Tempo not recorded'
      : `${observation.tempoBpm} BPM`;
  }
</script>

<svelte:head>
  <title>Practice Studio — GuitarLab</title>
  <meta
    name="description"
    content="Start and save private, device-local guitar practice sessions and exercise observations."
  />
</svelte:head>

<main class="practice-page">
  <header class="top">
    <a href={resolve('/')} aria-label="Back to GuitarLab dashboard">
      ← Dashboard
    </a>
    <span>YOUR PERSONAL PRACTICE SPACE</span>
  </header>

  <section class="intro">
    <p class="eyebrow">MILESTONE M7 · PRACTICE STUDIO</p>
    <h1>Make practice <em>count.</em></h1>
    <p>
      Track a session, record what you worked on and choose one useful next
      target. Your private practice record stays on this device.
    </p>
  </section>

  <section class="adaptive-panel" aria-labelledby="adaptive-heading">
    <div class="adaptive-heading">
      <div>
        <p class="eyebrow">EVIDENCE-AWARE GUIDANCE</p>
        <h2 id="adaptive-heading">Suggested focus</h2>
        <p class="muted">
          Suggestions use the skills introduced by your current Year 1 learning
          route, whole-skill assessments, directly scored item outcomes and
          repeated learner-entered exercise difficulty. Item probes can guide a
          focused drill, but they do not change your skill states.
        </p>
      </div>
      <span class="catalog-version">Skill catalogue v1.0.0</span>
    </div>

    {#if adaptiveLoading}
      <p class="muted" role="status">Loading your learning evidence…</p>
    {:else if adaptiveError}
      <p class="message error" role="alert">{adaptiveError}</p>
    {:else if adaptiveRecommendations.length > 0}
      <ol class="adaptive-list">
        {#each adaptiveRecommendations as item (item.recommendation.id)}
          {@const recommendation = item.recommendation}
          <li
            data-recommendation-id={item.recommendation.id}
            data-target-type={item.recommendation.targetType}
            data-target-id={item.recommendation.targetId}
          >
            <div class="recommendation-main">
              <span class="recommendation-type">
                {recommendation.targetType === 'skill' ? 'SKILL' : 'EXERCISE'}
              </span>
              <strong>{recommendation.title}</strong>
              <p>{recommendation.explanation}</p>
              {#if item.feedback?.correction === 'too_difficult'}
                <p class="feedback-guidance" role="status">
                  You asked for an easier starting step. Keep this focus, but
                  reduce the tempo, simplify the shape or practise a smaller part.
                </p>
              {/if}
              <div class="recommendation-actions" aria-label={`Feedback for ${recommendation.title}`}>
                <button
                  class="text-button"
                  type="button"
                  disabled={adaptiveFeedbackSavingId === recommendation.id}
                  onclick={() => void saveAdaptiveRecommendationFeedback(recommendation, 'dismiss')}
                >
                  Dismiss
                </button>
                <button
                  class="text-button"
                  type="button"
                  disabled={adaptiveFeedbackSavingId === recommendation.id}
                  onclick={() => void saveAdaptiveRecommendationFeedback(recommendation, 'correct', 'already_confident')}
                >
                  I’m confident
                </button>
                <button
                  class="text-button"
                  type="button"
                  disabled={adaptiveFeedbackSavingId === recommendation.id}
                  onclick={() => void saveAdaptiveRecommendationFeedback(recommendation, 'correct', 'too_difficult')}
                >
                  Make it easier
                </button>
                <button
                  class="text-button"
                  type="button"
                  disabled={adaptiveFeedbackSavingId === recommendation.id}
                  onclick={() => void saveAdaptiveRecommendationFeedback(recommendation, 'correct', 'not_relevant')}
                >
                  Not relevant
                </button>
              </div>
            </div>
            <span class="recommendation-evidence">
              {adaptiveEvidenceLabel(recommendation)}
            </span>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="empty-inline">
        {adaptiveSnapshot?.recommendations.length
          ? 'No active suggestions remain after your feedback. New assessment or exercise evidence can bring a focus back.'
          : 'No current priority has been identified. Continue your next lesson or record an assessment when you are ready.'}
      </p>
    {/if}

    {#if !adaptiveLoading && adaptiveSnapshot && adaptiveSnapshot.categoryCoverage.length > 0}
      <div class="adaptive-coverage">
        <p class="eyebrow">ASSESSMENT COVERAGE FOR SKILLS REACHED SO FAR</p>
        <div class="coverage-list">
          {#each adaptiveSnapshot.categoryCoverage as category (category.category)}
            <span>
              <strong>{getSkillCategoryDisplayName(category.category)}</strong>
              {category.assessedSkills} of {category.totalSkills} assessed
            </span>
          {/each}
        </div>
      </div>
    {/if}
    {#if !adaptiveLoading && adaptiveSnapshot && adaptiveSnapshot.skillAnalytics.length > 0}
      <details class="adaptive-analytics">
        <summary>Measured scores and item outcomes by skill</summary>
        <p class="adaptive-analytics-note">
          Whole-skill score summaries use measured assessment scores (0–100);
          supporting-probe scores are not mixed into them. Item outcomes are
          summarised separately within the same instrument definition, version and
          scoring rule. Inconclusive responses are counted but excluded from item
          accuracy. Supporting probes can guide targeted practice, but cannot
          establish or change whole-skill mastery. Score spread is standard
          deviation; a trend requires four comparable scores from the same
          assessment kind.
        </p>
        <ul class="analytics-list">
          {#each adaptiveSnapshot.skillAnalytics as skill (skill.skillId)}
            <li>
              <div class="analytics-skill">
                <strong>{skill.displayName}</strong>
                <span>{getSkillCategoryDisplayName(skill.category)}</span>
              </div>
              {#if skill.measuredScoreMean === null}
                <p>No measured score evidence yet.</p>
              {:else}
                <p>
                  {skill.measuredScoreCount} comparable measured score(s) ·
                  mean {skill.measuredScoreMean.toFixed(1)}/100 ·
                  spread {skill.measuredScoreSpread?.toFixed(1) ?? '—'} points
                  (standard deviation) · latest {skill.latestMeasuredScore}/100
                </p>
              {/if}
              <p class="analytics-trend">
                {#if skill.measuredScoreTrend === 'improving'}
                  Improving: +{Math.round(skill.measuredScoreTrendDelta ?? 0)} points
                  between the earlier and recent score pairs.
                {:else if skill.measuredScoreTrend === 'declining'}
                  Declining: {Math.round(skill.measuredScoreTrendDelta ?? 0)} points
                  between the earlier and recent score pairs.
                {:else if skill.measuredScoreTrend === 'stable'}
                  Broadly steady: {Math.round(skill.measuredScoreTrendDelta ?? 0)} points
                  between the earlier and recent score pairs.
                {:else}
                  Trend unavailable; four comparable measured scores are needed.
                {/if}
              </p>
              {#if skill.itemEvidenceGroups.length > 0}
                {#each skill.itemEvidenceGroups as group (group.definitionId + ':' + group.definitionVersion + ':' + group.scoringRuleVersion + ':' + group.decisionScope)}
                  <p class="analytics-item-evidence">
                    {group.definitionId} v{group.definitionVersion} ·
                    {group.correctItemCount} correct / {group.answeredItemCount} scored item response(s) ·
                    {group.accuracyPercent === null ? 'Item accuracy unavailable' : `${group.accuracyPercent.toFixed(1)}% item accuracy`} ·
                    {group.inconclusiveItemCount} inconclusive excluded
                  </p>
                  {#if group.decisionScope === 'supporting_probe'}
                    <p class="analytics-item-evidence">
                      Supporting probe only; this evidence cannot establish or change whole-skill mastery.
                    </p>
                  {/if}
                  {#each group.items as item (group.definitionId + ':' + group.definitionVersion + ':' + item.itemId)}
                    {#if item.consecutiveIncorrectCount >= 2}
                      <p class="analytics-item-evidence" role="status">
                        Same item answered incorrectly {item.consecutiveIncorrectCount} times consecutively. This raises the focused-practice priority.
                      </p>
                    {/if}
                  {/each}
                {/each}
              {:else}
                <p class="analytics-item-evidence">
                  Item-level accuracy unavailable; no structured item outcomes have been recorded.
                </p>
              {/if}
            </li>
          {/each}
        </ul>
      </details>
    {/if}
    <p class="adaptive-footnote">
      Assessment coverage is not a mastery score. Exercise difficulty is
      self-reported; repetitions are never treated as verified accuracy.
    </p>
  </section>

  {#if error}
    <p class="message error" role="alert">{error}</p>
  {/if}
  {#if notice}
    <p class="message" role="status">{notice}</p>
  {/if}

  {#if loading}
    <p class="panel" role="status">Loading your practice history…</p>
  {:else}
    <section class="panel" aria-labelledby="session-heading">
      <p class="eyebrow">SESSION</p>
      {#if activeSession}
        <h2 id="session-heading">
          {activeSession.status === 'paused'
            ? 'Your session is paused'
            : 'Your session is in progress'}
        </h2>
        <p class="muted">
          Started {dateLabel(activeSession.startedAt)}. Paused intervals are
          excluded from the active-time total.
        </p>
        <p class="elapsed" aria-live="off">
          {durationLabel(
            activeSession.actualDurationSeconds +
              (activeSession.status === 'in_progress'
                ? Math.max(
                    0,
                    Math.floor(
                      (now -
                        (activeSession.activeStartedAt ??
                          activeSession.startedAt)) /
                        1000
                    )
                  )
                : 0)
          )}
        </p>
        {#if activeSession.focus}
          <p><strong>Focus:</strong> {activeSession.focus}</p>
        {/if}
        {#if activeSession.plannedMinutes}
          <p><strong>Plan:</strong> {activeSession.plannedMinutes} minutes</p>
        {/if}

        <div class="session-actions">
          <button
            class="primary"
            type="button"
            onclick={togglePauseResume}
            disabled={saving || evidenceSaving}
          >
            {saving
              ? 'Saving…'
              : activeSession.status === 'paused'
                ? 'Resume session'
                : 'Pause session'}
          </button>
        </div>

        <section class="exercise-log" aria-labelledby="exercise-log-heading">
          <div class="section-heading">
            <div>
              <p class="eyebrow">EXERCISE LOG</p>
              <h3 id="exercise-log-heading">What did you work on?</h3>
            </div>
            <span class="count">{activeEvidence.length} observations</span>
          </div>
          <p class="muted">
            Record your own repetitions, clean repetitions, tempo and perceived
            difficulty. These are separate observations, not an automatic
            accuracy score or mastery result.
          </p>

          {#if evidenceError}
            <p class="message error" role="alert">{evidenceError}</p>
          {/if}
          {#if evidenceNotice}
            <p class="message" role="status">{evidenceNotice}</p>
          {/if}

          <form
            class="evidence-form"
            onsubmit={(event) => {
              event.preventDefault();
              void saveExerciseObservation();
            }}
          >
            <label for="exercise-name">Exercise or drill</label>
            <input
              id="exercise-name"
              type="text"
              maxlength="160"
              bind:value={exerciseName}
              placeholder="e.g. G major scale, alternate picking"
              required
            />

            <div class="field-grid">
              <div>
                <label for="repetitions">Total repetitions</label>
                <input
                  id="repetitions"
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  bind:value={repetitions}
                  required
                />
              </div>
              <div>
                <label for="clean-repetitions">Clean repetitions</label>
                <input
                  id="clean-repetitions"
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  bind:value={cleanRepetitions}
                  required
                />
              </div>
              <div>
                <label for="tempo-bpm">Tempo (BPM) <span>optional</span></label>
                <input
                  id="tempo-bpm"
                  type="number"
                  min="20"
                  max="300"
                  step="1"
                  bind:value={tempoBpm}
                  placeholder="Not recorded"
                />
              </div>
              <div>
                <label for="exercise-difficulty">
                  Difficulty (1–5) <span>optional</span>
                </label>
                <input
                  id="exercise-difficulty"
                  type="number"
                  min="1"
                  max="5"
                  step="1"
                  bind:value={exerciseDifficulty}
                  placeholder="Not recorded"
                />
              </div>
            </div>
            <button
              class="primary"
              type="submit"
              disabled={evidenceSaving || saving}
            >
              {evidenceSaving ? 'Saving observation…' : 'Save exercise observation'}
            </button>
          </form>

          {#if activeEvidenceLoading}
            <p class="muted" role="status">Loading saved observations…</p>
          {:else if activeEvidence.length > 0}
            <ul class="evidence-list active-evidence-list">
              {#each activeEvidence as observation (observation.id)}
                <li class="evidence-row">
                  <div>
                    <strong>{observation.exerciseId}</strong>
                    <p>
                      {observation.cleanRepetitions} clean /
                      {observation.repetitions} total repetitions
                    </p>
                  </div>
                  <div class="evidence-meta">
                    <span>{observationTempoLabel(observation)}</span>
                    <span>
                      {observation.difficulty === null
                        ? 'Difficulty not recorded'
                        : `Difficulty ${observation.difficulty}/5`}
                    </span>
                    <span>{dateLabel(observation.recordedAt)}</span>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="empty-inline">
              No exercise observations yet. Add one when you finish a drill.
            </p>
          {/if}
        </section>

        <form
          class="finish-form"
          onsubmit={(event) => {
            event.preventDefault();
            void finishSession();
          }}
        >
          <div class="section-heading">
            <div>
              <p class="eyebrow">SESSION REVIEW</p>
              <h3>Leave yourself a useful note</h3>
            </div>
            <span class="count">Optional</span>
          </div>
          <label for="session-reflection">What felt better, or needs work?</label>
          <textarea
            id="session-reflection"
            rows="2"
            maxlength="2000"
            bind:value={reflection}
            placeholder="e.g. Chord changes were smoother when I relaxed my wrist."
          ></textarea>
          <label for="next-target">One next practice target</label>
          <textarea
            id="next-target"
            rows="2"
            maxlength="1000"
            bind:value={nextTarget}
            placeholder="e.g. Repeat G–C–D at 60 BPM for three minutes."
          ></textarea>
          <p class="muted">
            Both notes are optional. You can finish with one tap and add neither.
          </p>
          <button
            class="primary secondary"
            type="submit"
            disabled={saving || evidenceSaving}
          >
            {saving ? 'Saving…' : 'Finish and save session'}
          </button>
        </form>
      {:else}
        <h2 id="session-heading">Start a practice session</h2>
        <form
          class="start-form"
          onsubmit={(event) => {
            event.preventDefault();
            void startSession();
          }}
        >
          <label for="duration">Planned duration (minutes)</label>
          <input
            id="duration"
            type="number"
            min="1"
            max="180"
            step="1"
            bind:value={plannedMinutes}
          />
          <label for="focus">What will you focus on? <span>optional</span></label>
          <input
            id="focus"
            maxlength="180"
            bind:value={focus}
            placeholder="e.g. Steady chord changes"
          />
          <button class="primary" type="submit" disabled={saving}>
            {saving ? 'Starting…' : 'Start practice'}
          </button>
        </form>
      {/if}
    </section>

    <section class="history" aria-labelledby="history-heading">
      <div class="history-heading">
        <div>
          <p class="eyebrow">YOUR RECORD</p>
          <h2 id="history-heading">Practice history</h2>
        </div>
        <span>{sessions.length} sessions</span>
      </div>
      {#if sessions.length === 0}
        <div class="empty">
          <h3>Your practice history starts here.</h3>
          <p>
            Completed sessions will appear here. A planned duration is not
            counted as actual practice.
          </p>
        </div>
      {:else}
        <div class="history-filters" aria-label="Filter practice history">
          <div class="history-search">
            <label for="history-search">Search your notes</label>
            <input
              id="history-search"
              type="search"
              bind:value={historyQuery}
              placeholder="Focus, reflection or next target"
            />
          </div>
          <div>
            <label for="history-status">Session status</label>
            <select id="history-status" bind:value={historyStatus}>
              <option value="all">All statuses</option>
              <option value="in_progress">In progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <div>
            <label for="history-date-range">Date range</label>
            <select id="history-date-range" bind:value={historyDateRange}>
              <option value="all">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
        <div class="history-result-count" role="status" aria-live="polite">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </div>
        {#if filteredSessions.length === 0}
          <div class="empty" role="status">
            <h3>No sessions match these filters.</h3>
            <p>Try another search or clear the filters to see your full history.</p>
            <button class="text-button" type="button" onclick={clearHistoryFilters}>
              Clear filters
            </button>
          </div>
        {:else}
        <ul class="history-list">
          {#each filteredSessions as session (session.id)}
            <li class="history-item">
              <div class="history-main">
                <strong>{session.focus || 'Practice session'}</strong>
                <p>{dateLabel(session.startedAt)}</p>
                {#if session.reflection}
                  <p class="session-note">
                    <strong>Reflection:</strong> {session.reflection}
                  </p>
                {/if}
                {#if session.nextTarget}
                  <p class="session-note">
                    <strong>Next target:</strong> {session.nextTarget}
                  </p>
                {/if}
              </div>
              <div class="session-meta">
                <span
                  class:active={session.status === 'in_progress'}
                  class:paused={session.status === 'paused'}
                >
                  {session.status}
                </span>
                <strong>
                  {session.status === 'completed'
                    ? durationLabel(session.actualDurationSeconds)
                    : 'Not yet saved'}
                </strong>
                <button
                  class="text-button"
                  type="button"
                  aria-expanded={historyEvidenceSessionId === session.id}
                  onclick={() => void toggleHistoryEvidence(session.id)}
                >
                  {historyEvidenceSessionId === session.id
                    ? 'Hide exercise observations'
                    : 'Show exercise observations'}
                </button>
              </div>

              {#if historyEvidenceSessionId === session.id}
                <div class="history-evidence">
                  {#if historyEvidenceLoadingSessionId === session.id}
                    <p class="muted" role="status">Loading observations…</p>
                  {:else if historyEvidence.length > 0}
                    <ul class="evidence-list">
                      {#each historyEvidence as observation (observation.id)}
                        <li class="evidence-row">
                          <div>
                            <strong>{observation.exerciseId}</strong>
                            <p>
                              {observation.cleanRepetitions} clean /
                              {observation.repetitions} total repetitions
                            </p>
                          </div>
                          <div class="evidence-meta">
                            <span>{observationTempoLabel(observation)}</span>
                            <span>
                              {observation.difficulty === null
                                ? 'Difficulty not recorded'
                                : `Difficulty ${observation.difficulty}/5`}
                            </span>
                            <span>{dateLabel(observation.recordedAt)}</span>
                          </div>
                        </li>
                      {/each}
                    </ul>
                  {:else}
                    <p class="empty-inline">
                      No exercise observations were recorded for this session.
                    </p>
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
        {/if}
      {/if}
    </section>
  {/if}

  <aside class="principle">
    <strong>Practice time is not mastery.</strong>
    <p>
      Active-time totals include only intervals between starting/resuming and
      pausing/finishing. Repetitions, clean repetitions, tempo and difficulty
      are learner-entered observations; the app does not infer accuracy or
      award skill levels from time or speed alone. Review scheduling and
      evidence-based mastery remain separate M7 steps.
    </p>
  </aside>
</main>

<style>
  .practice-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 24px 72px;
    color: var(--text, #f4f0e8);
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    border-bottom: 1px solid var(--border, #444);
    padding-bottom: 18px;
    font-size: 0.8rem;
  }

  .top a {
    color: inherit;
    text-decoration: none;
  }

  .top span,
  .eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    color: var(--muted, #aaa);
  }

  .intro {
    padding: 56px 0 28px;
    max-width: 660px;
  }

  .intro h1 {
    font-size: clamp(2.5rem, 7vw, 4.5rem);
    line-height: 1.02;
    margin: 12px 0;
  }

  .intro h1 em {
    color: var(--primary, #96580f);
    font-family: Georgia, serif;
    font-weight: 400;
  }

  .intro > p:last-child,
  .muted {
    color: var(--muted, #aaa);
    line-height: 1.65;
  }

  .elapsed {
    font-size: clamp(2rem, 6vw, 3rem);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    margin: 18px 0;
  }

  .adaptive-panel {
    margin: 18px 0 24px;
    border: 1px solid var(--border, #444);
    border-radius: 18px;
    padding: 22px 24px;
    background: var(--surface, #222);
  }

  .adaptive-heading {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 18px;
  }

  .adaptive-heading h2 {
    margin: 7px 0;
  }

  .adaptive-heading .muted,
  .adaptive-footnote {
    max-width: 720px;
    color: var(--muted, #aaa);
    font-size: 0.88rem;
    line-height: 1.6;
  }

  .catalog-version,
  .recommendation-type,
  .recommendation-evidence {
    color: var(--muted, #aaa);
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .adaptive-list {
    display: grid;
    gap: 0;
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
  }

  .adaptive-list li {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 16px;
    border-top: 1px solid var(--border, #444);
    padding: 13px 0;
  }

  .adaptive-list li > div {
    min-width: 0;
  }

  .recommendation-main {
    flex: 1;
  }

  .recommendation-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-top: 12px;
  }

  .recommendation-actions button:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  .feedback-guidance {
    padding: 9px 11px;
    border-left: 2px solid var(--primary, #96580f);
    background: var(--surface-raised, #2b2b2b);
  }

  .adaptive-list strong {
    display: block;
    margin: 3px 0;
    font-size: 0.95rem;
  }

  .adaptive-list p {
    margin: 4px 0 0;
    color: var(--muted, #aaa);
    font-size: 0.85rem;
    line-height: 1.55;
  }

  .recommendation-type {
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .recommendation-evidence {
    padding-top: 4px;
    text-align: right;
  }

  .adaptive-coverage {
    border-top: 1px solid var(--border, #444);
    padding-top: 15px;
    margin-top: 6px;
  }

  .coverage-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .coverage-list span {
    padding: 8px 10px;
    border: 1px solid var(--border, #444);
    border-radius: 9px;
    color: var(--muted, #aaa);
    font-size: 0.8rem;
  }

  .coverage-list strong {
    color: var(--text, #fff);
    margin-right: 5px;
  }

  .adaptive-footnote {
    margin: 15px 0 0;
    font-size: 0.78rem;
  }

  .adaptive-analytics {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--border, #444);
  }

  .adaptive-analytics summary {
    width: fit-content;
    cursor: pointer;
    font-weight: 700;
    text-underline-offset: 3px;
  }

  .adaptive-analytics summary:focus-visible {
    outline: 3px solid var(--focus, #80510b);
    outline-offset: 4px;
    border-radius: 3px;
  }

  .adaptive-analytics-note {
    max-width: 720px;
    color: var(--muted, #aaa);
    font-size: 0.82rem;
    line-height: 1.55;
  }

  .analytics-list {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
  }

  .analytics-list li {
    display: grid;
    gap: 4px;
    padding: 11px 0;
    border-top: 1px solid var(--border, #444);
  }

  .analytics-skill {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 12px;
  }

  .analytics-skill span,
  .analytics-list p {
    color: var(--muted, #aaa);
    font-size: 0.82rem;
  }

  .analytics-list p {
    margin: 0;
    line-height: 1.5;
  }

  .analytics-trend {
    font-weight: 600;
  }

  .panel,
  .empty,
  .principle {
    border: 1px solid var(--border, #444);
    border-radius: 18px;
    padding: 24px;
    background: var(--surface, #222);
  }

  h2 {
    font-size: 1.45rem;
    margin: 8px 0 14px;
  }

  h3 {
    font-size: 1.12rem;
    margin: 4px 0 8px;
  }

  .start-form,
  .evidence-form,
  .finish-form {
    display: grid;
    gap: 10px;
    max-width: 640px;
  }

  label {
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 10px;
  }

  label span {
    font-weight: 400;
    color: var(--muted, #aaa);
  }

  input,
  textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--border, #666);
    border-radius: 9px;
    background: var(--surface, #fffefa);
    color: var(--text, #24231f);
    font: inherit;
  }

  textarea {
    resize: vertical;
    min-height: 76px;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  .primary {
    margin-top: 12px;
    padding: 12px 18px;
    border: 0;
    border-radius: 9px;
    background: var(--primary, #96580f);
    color: var(--primary-ink, #fffaf0);
    font-weight: 700;
    width: fit-content;
  }

  .primary:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .secondary {
    background: transparent;
    border: 1px solid var(--border, #666);
    color: inherit;
  }

  .session-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .exercise-log,
  .finish-form {
    margin-top: 28px;
    padding-top: 22px;
    border-top: 1px solid var(--border, #444);
  }

  .section-heading,
  .history-heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 16px;
    margin-bottom: 12px;
  }

  .section-heading h3,
  .history-heading h2 {
    margin-bottom: 0;
  }

  .count,
  .history-heading > span,
  .session-meta {
    color: var(--muted, #aaa);
    font-size: 0.85rem;
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .field-grid > div {
    display: grid;
    gap: 8px;
  }

  .field-grid label {
    margin-top: 6px;
  }

  .evidence-list,
  .history-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .active-evidence-list {
    margin-top: 20px;
    border-top: 1px solid var(--border, #444);
  }

  .evidence-row {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 16px;
    padding: 14px 2px;
    border-bottom: 1px solid var(--border, #444);
  }

  .evidence-row p,
  .history-main > p {
    color: var(--muted, #aaa);
    margin: 5px 0 0;
    line-height: 1.5;
  }

  .evidence-meta {
    display: grid;
    gap: 4px;
    text-align: right;
    color: var(--muted, #aaa);
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .empty-inline {
    color: var(--muted, #aaa);
    padding: 12px 0;
    line-height: 1.5;
  }

  .history {
    margin-top: 38px;
  }

  .history-heading {
    margin-bottom: 14px;
  }

  .history-filters {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(150px, 1fr) minmax(150px, 1fr);
    gap: 12px;
    margin: 18px 0 10px;
  }

  .history-filters > div {
    display: grid;
    align-content: start;
    gap: 7px;
  }

  .history-filters label {
    margin-top: 0;
    font-size: 0.82rem;
  }

  .history-filters input,
  .history-filters select {
    min-width: 0;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border, #666);
    border-radius: 9px;
    background: var(--surface, #fffefa);
    color: var(--text, #24231f);
    font: inherit;
  }

  .history-result-count {
    color: var(--muted, #aaa);
    font-size: 0.82rem;
    margin: 8px 0 12px;
  }


  .history-heading h2 {
    margin-top: 8px;
  }

  .history-list {
    border-top: 1px solid var(--border, #444);
  }

  .history-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px 18px;
    padding: 18px 4px;
    border-bottom: 1px solid var(--border, #444);
  }

  .history-main {
    min-width: 0;
  }

  .session-note {
    margin-top: 8px !important;
    overflow-wrap: anywhere;
  }

  .session-meta {
    display: grid;
    justify-items: end;
    align-content: start;
    gap: 6px;
    text-align: right;
  }

  .session-meta .active {
    color: var(--primary, #96580f);
  }

  .session-meta .paused {
    color: var(--muted, #aaa);
  }

  .text-button {
    border: 0;
    padding: 4px 0;
    color: var(--primary, #b77b32);
    background: transparent;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-align: right;
  }

  .history-evidence {
    grid-column: 1 / -1;
    padding: 12px 16px;
    background: var(--surface, #222);
    border: 1px solid var(--border, #444);
    border-radius: 12px;
  }

  .principle {
    margin-top: 28px;
  }

  .principle p,
  .empty p {
    color: var(--muted, #aaa);
    margin: 6px 0 0;
    line-height: 1.55;
    max-width: 700px;
  }

  .message {
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--surface, #222);
    border: 1px solid var(--border, #555);
  }

  .error {
    border-color: #a65c52;
    color: #ffb5a9;
  }

  a:focus-visible,
  button:focus-visible,
  input:focus-visible,
  textarea:focus-visible {
    outline: 3px solid var(--focus, #80510b);
    outline-offset: 3px;
  }

  @media (max-width: 600px) {
    .practice-page {
      padding: 20px 16px 48px;
    }

    .top span {
      max-width: 130px;
      text-align: right;
    }

    .intro {
      padding: 40px 0 22px;
    }

    .adaptive-panel,
    .panel,
    .empty,
    .principle {
      padding: 18px;
    }

    .adaptive-heading,
    .adaptive-list li {
      display: grid;
    }

    .recommendation-evidence {
      text-align: left;
    }

    .field-grid {
      grid-template-columns: 1fr;
    }

    .evidence-row {
      display: grid;
    }

    .evidence-meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: start;
      text-align: left;
      white-space: normal;
    }

    .history-filters {
      grid-template-columns: minmax(0, 1fr);
    }

    .history-item {
      grid-template-columns: minmax(0, 1fr);
    }

    .session-meta {
      justify-items: start;
      text-align: left;
    }

    .text-button {
      text-align: left;
    }
  }
</style>
