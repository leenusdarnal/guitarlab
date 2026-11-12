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

  let sessions = $state<PracticeSessionRecord[]>([]);
  let activeEvidence = $state<PracticeEvidenceRecord[]>([]);
  let historyEvidenceSessionId = $state<string | null>(null);
  let historyEvidence = $state<PracticeEvidenceRecord[]>([]);
  let historyEvidenceLoadingSessionId = $state<string | null>(null);

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

  const activeSession = $derived(
    sessions.find(
      (session) =>
        session.status === 'in_progress' || session.status === 'paused'
    ) ?? null
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
        <ul class="history-list">
          {#each sessions as session (session.id)}
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

    .panel,
    .empty,
    .principle {
      padding: 18px;
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
