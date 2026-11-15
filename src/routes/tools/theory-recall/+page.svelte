<script lang="ts">
  import { onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import { AudioContextSession } from '../../../lib/audio/audio-context-session';
  import { waitForPlaybackCompletion } from '../../../lib/audio/playback-lifecycle';
  import {
    createTheoryRecallExercise,
    type TheoryRecallAnswer,
    type TheoryRecallKind
  } from '../../../lib/domain/music/theory-recall';

  let kind = $state<TheoryRecallKind>('name');
  let sequence = $state(0);
  let selectedAnswer = $state<TheoryRecallAnswer | null>(null);
  let feedbackState = $state<'correct' | 'incorrect' | ''>('');
  let isPlaying = $state(false);
  let audioError = $state('');
  let correctCount = $state(0);
  let attemptCount = $state(0);
  let playbackAbortController: AbortController | null = null;
  let activeOscillators: OscillatorNode[] = [];

  function stopPlayback() {
    playbackAbortController?.abort();
    playbackAbortController = null;
    for (const oscillator of activeOscillators) {
      try {
        oscillator.stop();
      } catch {
        // The oscillator may already have ended.
      }
    }
    activeOscillators = [];
    isPlaying = false;
    void audioSession.close();
  }
  const audioSession = new AudioContextSession(() => {
    if (typeof AudioContext === 'undefined') {
      throw new Error(
        'Audio playback is not available in this browser. The written theory prompts remain available.'
      );
    }
    return new AudioContext();
  });

  const exercise = $derived(createTheoryRecallExercise(kind, sequence));

  onDestroy(stopPlayback);

  function selectKind(nextKind: TheoryRecallKind) {
    if (isPlaying) return;
    kind = nextKind;
    sequence = 0;
    selectedAnswer = null;
    feedbackState = '';
    audioError = '';
  }

  async function playExample() {
    if (isPlaying || exercise.tones.length === 0) return;
    audioError = '';
    isPlaying = true;
    const controller = new AbortController();
    playbackAbortController = controller;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stopPlayback();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    try {
      const context = await audioSession.resume(
        'Audio is not ready. Press listen again to enable playback.'
      );
      if (controller.signal.aborted) return;
      const startAt = context.currentTime + 0.06;
      for (const tone of exercise.tones) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const toneStart = startAt + tone.startMilliseconds / 1_000;
        const toneEnd = toneStart + tone.durationMilliseconds / 1_000;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(tone.frequencyHz, toneStart);
        gain.gain.setValueAtTime(0.0001, toneStart);
        gain.gain.exponentialRampToValueAtTime(0.16, toneStart + 0.018);
        gain.gain.setValueAtTime(0.16, toneEnd - 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);
        oscillator.connect(gain);
        gain.connect(context.destination);
        activeOscillators.push(oscillator);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
          activeOscillators = activeOscillators.filter(
            (active) => active !== oscillator
          );
        };
        oscillator.start(toneStart);
        oscillator.stop(toneEnd);
      }

      const lastTone = exercise.tones[exercise.tones.length - 1];
      await waitForPlaybackCompletion(
        lastTone.startMilliseconds + lastTone.durationMilliseconds + 100,
        controller.signal
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        audioError =
          error instanceof Error
            ? error.message
            : 'The theory example could not be played.';
      }
    } finally {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (playbackAbortController === controller) {
        playbackAbortController = null;
      }
      isPlaying = false;
    }
  }

  function submitAnswer(answer: TheoryRecallAnswer) {
    if (selectedAnswer !== null) return;
    selectedAnswer = answer;
    attemptCount += 1;
    if (answer === exercise.answer) {
      feedbackState = 'correct';
      correctCount += 1;
    } else {
      feedbackState = 'incorrect';
    }
  }

  function retryAnswer() {
    selectedAnswer = null;
    feedbackState = '';
  }

  function nextExercise() {
    sequence += 1;
    selectedAnswer = null;
    feedbackState = '';
    audioError = '';
  }
</script>

<svelte:head>
  <title>Theory recall — GuitarLab</title>
  <meta
    name="description"
    content="Connect chord names, locally generated sounds and musical function with short guitar theory recall prompts."
  />
</svelte:head>

<main class="theory-page">
  <a class="back-link" href={resolve('/tools')}>← Tools</a>

  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH · MUSICAL UNDERSTANDING</div>
    <h1>Make theory <em>musical.</em></h1>
    <p>
      Connect a chord's name to its sound and role in a key. These short prompts
      use explicit C-major examples and locally generated tones; they do not
      change lesson progress or skill mastery.
    </p>
  </header>

  <nav class="mode-tabs" aria-label="Theory recall mode">
    <button type="button" class:active={kind === 'name'} aria-pressed={kind === 'name'} onclick={() => selectKind('name')}>Name</button>
    <button type="button" class:active={kind === 'sound'} aria-pressed={kind === 'sound'} onclick={() => selectKind('sound')}>Sound</button>
    <button type="button" class:active={kind === 'use'} aria-pressed={kind === 'use'} onclick={() => selectKind('use')}>Use</button>
  </nav>

  <section class="panel exercise-panel" aria-labelledby="exercise-title">
    <div class="exercise-meta">
      <span class="eyebrow">{kind === 'name' ? 'NAME THE CHORD' : kind === 'sound' ? 'RECOGNISE THE SOUND' : 'UNDERSTAND THE FUNCTION'}</span>
      <span class="score" aria-label="Session score">{correctCount} correct · {attemptCount} attempts</span>
    </div>
    <h2 id="exercise-title">{exercise.prompt}</h2>
    <p class="visual-hint">{exercise.visualHint}</p>

    {#if exercise.tones.length > 0}
      <div class="sound-card">
        <div class="sound-symbol" aria-hidden="true">♫</div>
        <p>Three notes played together</p>
        <button type="button" class="primary-button" onclick={playExample} disabled={isPlaying}>
          {isPlaying ? 'Playing example…' : 'Listen to example'}
        </button>
        <span class="audio-caption">Playback begins only when you press listen. Replay as needed.</span>
      </div>
    {:else}
      <div class="theory-card">
        <span class="theory-card-label">KEY CONTEXT</span>
        <strong>C major</strong>
        <p>C · D · E · F · G · A · B</p>
      </div>
    {/if}

    <fieldset class="answer-fieldset" disabled={selectedAnswer !== null}>
      <legend>{kind === 'name' ? 'Which chord is it?' : kind === 'sound' ? 'What is the chord quality?' : 'Which chord fulfils this role?'}</legend>
      <div class="answer-options">
        {#each exercise.choices as choice (choice.value)}
          <button type="button" class="answer-button" class:selected={selectedAnswer === choice.value} onclick={() => submitAnswer(choice.value)}>
            {choice.label}
          </button>
        {/each}
      </div>
    </fieldset>

    {#if feedbackState === 'incorrect'}
      <div class="feedback incorrect" role="status">
        <strong>Not quite — review the clue and try again.</strong>
        <p>The same prompt stays in place so you can reconsider without changing the example.</p>
        <button type="button" class="secondary-button" onclick={retryAnswer}>Try again</button>
      </div>
    {:else if feedbackState === 'correct'}
      <div class="feedback correct" role="status">
        <strong>That's right.</strong>
        <p>{exercise.explanation}</p>
        <button type="button" class="secondary-button" onclick={nextExercise}>Next prompt</button>
      </div>
    {/if}

    {#if audioError}
      <p class="audio-error" role="alert">{audioError}</p>
    {/if}
  </section>

  <section class="panel guidance-panel" aria-labelledby="guidance-title">
    <div class="eyebrow">THREE WAYS TO RECALL</div>
    <h2 id="guidance-title">Name. Hear. Use.</h2>
    <ul>
      <li><strong>Name:</strong> connect the chord symbol and its scale-degree position.</li>
      <li><strong>Sound:</strong> compare the quality of locally synthesized triads.</li>
      <li><strong>Use:</strong> connect a chord's function to the musical movement it supports.</li>
    </ul>
  </section>

  <p class="privacy-note">
    Sound examples are synthesized locally with Web Audio. No microphone permission
    is requested, no recording is made, and responses are not saved as learner
    assessment or mastery evidence.
  </p>
</main>

<style>
  .theory-page {
    width: min(100% - 32px, 820px);
    margin: 0 auto;
    padding: 30px 0 64px;
    color: var(--text);
  }
  .back-link {
    display: inline-block;
    margin-bottom: 28px;
    color: var(--muted);
    font-size: 12px;
  }
  .page-heading {
    max-width: 680px;
    padding-bottom: 22px;
  }
  .eyebrow {
    color: var(--muted);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.2px;
  }
  h1 {
    margin: 10px 0;
    font: 500 clamp(36px, 5vw, 54px) / 1.08 Georgia, serif;
    letter-spacing: -1.5px;
  }
  h1 em { color: var(--primary); }
  .page-heading p, .visual-hint, .guidance-panel li, .privacy-note {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
  }
  .mode-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0 16px;
  }
  .mode-tabs button, .answer-button, .secondary-button, .primary-button {
    min-height: 44px;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }
  .mode-tabs button {
    padding: 10px 16px;
    background: var(--surface);
    color: var(--muted);
  }
  .mode-tabs button.active {
    border-color: var(--primary);
    color: var(--primary);
    background: var(--surface-raised);
  }
  .panel {
    padding: clamp(18px, 4vw, 30px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .exercise-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .score {
    color: var(--muted);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
  }
  h2 {
    margin: 12px 0 8px;
    font: 500 clamp(22px, 3vw, 28px) / 1.2 Georgia, serif;
  }
  .visual-hint {
    margin: 0;
  }
  .sound-card, .theory-card {
    display: grid;
    justify-items: center;
    gap: 9px;
    margin: 24px 0;
    padding: 24px 16px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface-raised);
    text-align: center;
  }
  .sound-symbol {
    color: var(--primary);
    font: 500 48px / 1 Georgia, serif;
  }
  .sound-card p, .theory-card p {
    margin: 0;
    font-size: 13px;
    font-weight: 750;
  }
  .theory-card-label, .audio-caption {
    color: var(--muted);
    font-size: 10px;
  }
  .theory-card strong {
    font: 500 30px / 1 Georgia, serif;
  }
  .primary-button {
    padding: 11px 18px;
    border-color: var(--primary);
    background: var(--primary);
    color: var(--primary-ink);
  }
  .answer-fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .answer-fieldset legend {
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 750;
  }
  .answer-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .answer-button {
    padding: 12px;
    background: var(--surface-raised);
    color: var(--text);
  }
  .answer-button.selected { border-color: var(--primary); }
  .answer-fieldset:disabled .answer-button { cursor: default; opacity: 0.7; }
  button:disabled { cursor: wait; opacity: 0.6; }
  .feedback {
    margin-top: 18px;
    padding: 15px;
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .feedback strong { font-size: 13px; }
  .feedback p {
    margin: 6px 0 12px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.6;
  }
  .feedback.correct { border-color: var(--success); }
  .feedback.incorrect { border-color: var(--warning); }
  .secondary-button {
    padding: 10px 14px;
    background: var(--surface-raised);
    color: var(--text);
  }
  .audio-error {
    margin: 14px 0 0;
    color: var(--danger);
    font-size: 12px;
  }
  .guidance-panel { margin-top: 16px; }
  .guidance-panel ul {
    display: grid;
    gap: 8px;
    margin: 12px 0 0;
    padding-left: 20px;
  }
  .privacy-note { margin-top: 18px; font-size: 10px; }
  a:focus-visible, button:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }
  @media (max-width: 560px) {
    .theory-page { padding-top: 22px; }
    .answer-options { grid-template-columns: 1fr; }
    .mode-tabs button { flex: 1 1 auto; }
  }
</style>
