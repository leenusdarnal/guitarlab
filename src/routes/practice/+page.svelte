<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    finishActivePracticeSession,
    listActivePracticeSessions,
    pauseActivePracticeSession,
    resumeActivePracticeSession,
    startActivePracticeSession
  } from '../../lib/storage/practice';
  import type { PracticeSessionRecord } from '../../lib/repositories/contracts';

  let sessions = $state<PracticeSessionRecord[]>([]);
  let plannedMinutes = $state<number | undefined>(20);
  let focus = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let notice = $state('');
  let now = $state(Date.now());

  const activeSession = $derived(
    sessions.find((session) => session.status === 'in_progress' || session.status === 'paused') ?? null
  );

  async function refresh() {
    sessions = await listActivePracticeSessions();
  }

  onMount(() => {
    const clock = window.setInterval(() => (now = Date.now()), 1000);
    void refresh()
      .catch(() => {
        error = 'Your local practice history could not be loaded. Check browser storage and try again.';
      })
      .finally(() => (loading = false));
    return () => window.clearInterval(clock);
  });

  async function startSession() {
    error = '';
    notice = '';
    // Svelte number inputs bind as number | undefined, not strings.
    const minutes = plannedMinutes ?? null;
    if (
      minutes !== null &&
      (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 180)
    ) {
      error = 'Choose a whole-number plan between 1 and 180 minutes, or leave it blank.';
      return;
    }
    saving = true;
    try {
      await startActivePracticeSession({
        plannedMinutes: minutes,
        focus: focus.trim() || null
      });
      focus = '';
      await refresh();
      notice = 'Practice session started. Elapsed session time is tracked locally.';
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
        notice = 'Session resumed. Paused time is excluded from active-session time.';
      } else {
        await pauseActivePracticeSession(activeSession.id);
        notice = 'Session paused. Your accumulated active time has been saved.';
      }
      await refresh();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not update the practice session.';
    } finally { saving = false; }
  }

  async function finishSession() {
    if (!activeSession) return;
    error = '';
    saving = true;
    try {
      await finishActivePracticeSession(activeSession.id);
      await refresh();
      notice = 'Session saved. Elapsed session time is activity history, not verified active practice or a skill assessment.';
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
    return minutes > 0 ? `${minutes} min ${remaining} sec` : `${remaining} sec`;
  }

  function dateLabel(timestamp: number) {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
</script>

<svelte:head>
  <title>Practice Studio — GuitarLab</title>
  <meta
    name="description"
    content="Start and save private, device-local guitar practice sessions."
  />
</svelte:head>

<main class="practice-page">
  <header class="top">
    <a href={resolve('/')} aria-label="Back to GuitarLab dashboard">← Dashboard</a>
    <span>YOUR PERSONAL PRACTICE SPACE</span>
  </header>

  <section class="intro">
    <p class="eyebrow">MILESTONE M7 · PRACTICE STUDIO</p>
    <h1>Make practice <em>count.</em></h1>
    <p>
      Start a focused session, then save its elapsed duration. Your record stays
      on this device.
    </p>
  </section>

  {#if error}<p class="message error" role="alert">{error}</p>{/if}
  {#if notice}<p class="message" role="status">{notice}</p>{/if}

  {#if loading}
    <p class="panel" role="status">Loading your practice history…</p>
  {:else}
    <section class="panel" aria-labelledby="session-heading">
      <p class="eyebrow">SESSION</p>
      {#if activeSession}
        <h2 id="session-heading">{activeSession.status === 'paused' ? 'Your session is paused' : 'Your session is in progress'}</h2>
        <p class="muted">Started {dateLabel(activeSession.startedAt)}. Paused intervals are excluded from the active-time total.</p>
        <p class="elapsed" aria-live="off">{durationLabel(activeSession.actualDurationSeconds + (activeSession.status === 'in_progress' ? Math.max(0, Math.floor((now - (activeSession.activeStartedAt ?? activeSession.startedAt)) / 1000)) : 0))}</p>
        {#if activeSession.focus}<p><strong>Focus:</strong> {activeSession.focus}</p>{/if}
        {#if activeSession.plannedMinutes}
          <p><strong>Plan:</strong> {activeSession.plannedMinutes} minutes</p>
        {/if}
        <div class="session-actions">
          <button class="primary" onclick={togglePauseResume} disabled={saving}>{saving ? 'Saving…' : activeSession.status === 'paused' ? 'Resume session' : 'Pause session'}</button>
          <button class="primary secondary" onclick={finishSession} disabled={saving}>{saving ? 'Saving…' : 'Finish and save session'}</button>
        </div>
      {:else}
        <h2 id="session-heading">Start a practice session</h2>
        <form
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
          <label for="focus">What will you focus on? <span>(optional)</span></label>
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
        <div><p class="eyebrow">YOUR RECORD</p><h2 id="history-heading">Practice history</h2></div>
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
        <ul>
          {#each sessions as session (session.id)}
            <li>
              <div>
                <strong>{session.focus || 'Practice session'}</strong>
                <p>{dateLabel(session.startedAt)}</p>
              </div>
              <div class="session-meta">
                <span class:active={session.status === 'in_progress'}>
                  {session.status === 'in_progress' ? 'In progress' : session.status === 'paused' ? 'Paused' : session.status}
                </span>
                <strong>
                  {session.status === 'completed'
                    ? durationLabel(session.actualDurationSeconds)
                    : 'Not yet saved'}
                </strong>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}

  <aside class="principle">
    <strong>Practice time is not mastery.</strong>
    <p>
      Active-time totals include only intervals between starting/resuming and pausing/finishing. They are self-reported session timing, not proof of playing. The app does not award skill levels,
      infer accuracy or claim that an exercise was performed correctly.
      Exercise-level evidence and review scheduling will be added in subsequent
      M7 slices.
    </p>
  </aside>
</main>

<style>
  .practice-page { max-width: 900px; margin: 0 auto; padding: 32px 24px 72px; color: var(--text, #f4f0e8); }
  .top { display: flex; justify-content: space-between; gap: 16px; align-items: center; border-bottom: 1px solid var(--border, #444); padding-bottom: 18px; font-size: .8rem; }
  .top a { color: inherit; text-decoration: none; }
  .top span, .eyebrow { font-size: .72rem; letter-spacing: .12em; color: var(--muted, #aaa); }
  .intro { padding: 56px 0 28px; max-width: 660px; }
  .intro h1 { font-size: clamp(2.5rem, 7vw, 4.5rem); line-height: 1.02; margin: 12px 0; }
  .intro h1 em { color: var(--accent, #d5a65b); font-family: Georgia, serif; font-weight: 400; }
  .intro > p:last-child, .muted { color: var(--muted, #aaa); line-height: 1.65; }
  .elapsed { font-size: clamp(2rem, 6vw, 3rem); font-variant-numeric: tabular-nums; font-weight: 700; margin: 18px 0; }
  .panel, .empty, .principle { border: 1px solid var(--border, #444); border-radius: 18px; padding: 24px; background: var(--surface, #222); }
  h2 { font-size: 1.45rem; margin: 8px 0 14px; }
  h3 { margin: 0 0 8px; }
  form { display: grid; gap: 10px; max-width: 520px; }
  label { font-size: .9rem; font-weight: 600; margin-top: 10px; }
  label span { font-weight: 400; color: var(--muted, #aaa); }
  input { width: 100%; padding: 12px 14px; border: 1px solid var(--border, #666); border-radius: 9px; background: var(--background, #171715); color: inherit; font: inherit; }
  button { font: inherit; cursor: pointer; }
  .primary { margin-top: 12px; padding: 12px 18px; border: 0; border-radius: 9px; background: var(--accent, #d5a65b); color: #171715; font-weight: 700; width: fit-content; }
  .primary:disabled { opacity: .6; cursor: wait; }
  .session-actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .secondary { background: transparent; border: 1px solid var(--border, #666); color: inherit; }
  .history { margin-top: 38px; }
  .history-heading { display: flex; justify-content: space-between; align-items: end; margin-bottom: 14px; }
  .history-heading h2 { margin-bottom: 0; }
  .history-heading > span, .session-meta { color: var(--muted, #aaa); font-size: .85rem; }
  ul { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--border, #444); }
  li { display: flex; justify-content: space-between; gap: 18px; padding: 18px 4px; border-bottom: 1px solid var(--border, #444); }
  li p, .empty p, .principle p { color: var(--muted, #aaa); margin: 6px 0 0; line-height: 1.55; }
  .session-meta { display: grid; justify-items: end; gap: 6px; text-align: right; }
  .session-meta .active { color: var(--accent, #d5a65b); }
  .principle { margin-top: 28px; }
  .principle p { max-width: 700px; }
  .message { padding: 12px 16px; border-radius: 10px; background: var(--surface, #222); border: 1px solid var(--border, #555); }
  .error { border-color: #a65c52; color: #ffb5a9; }
  a:focus-visible, button:focus-visible, input:focus-visible { outline: 3px solid var(--accent, #d5a65b); outline-offset: 3px; }
  @media (max-width: 600px) {
    .practice-page { padding: 20px 16px 48px; }
    .top span { max-width: 130px; text-align: right; }
    .intro { padding: 40px 0 22px; }
    .panel, .empty, .principle { padding: 18px; }
    li { align-items: start; }
    .session-meta { min-width: 100px; }
  }
</style>
