<script lang="ts">
  import { onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    createEarTrainingExercise,
    type EarTrainingAnswer,
    type EarTrainingKind
  } from '../../../lib/domain/music/ear-training';

  let kind = $state<EarTrainingKind>('pulse');
  let sequence = $state(0);
  let selectedAnswer = $state<EarTrainingAnswer | null>(null);
  let feedbackState = $state<'correct' | 'incorrect' | ''>('');
  let isPlaying = $state(false);
  let audioError = $state('');
  let correctCount = $state(0);
  let attemptCount = $state(0);
  let audioContext: AudioContext | null = null;

  const exercise = $derived(createEarTrainingExercise(kind, sequence));

  onDestroy(() => {
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close();
    }
    audioContext = null;
  });

  function selectKind(nextKind: EarTrainingKind) {
    if (isPlaying) return;
    kind = nextKind;
    sequence = 0;
    selectedAnswer = null;
    feedbackState = '';
    audioError = '';
  }

  async function playExercise() {
    if (isPlaying) return;
    audioError = '';
    isPlaying = true;
    try {
      if (typeof AudioContext === 'undefined') {
        throw new Error('Audio playback is not available in this browser. You can still read the visual instructions.');
      }
      audioContext ??= new AudioContext();
      if (audioContext.state === 'suspended') await audioContext.resume();
      if (audioContext.state !== 'running') {
        throw new Error('Audio is not ready. Press listen again to enable playback.');
      }

      const startAt = audioContext.currentTime + 0.06;
      for (const tone of exercise.tones) {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const toneStart = startAt + tone.startMilliseconds / 1_000;
        const toneEnd = toneStart + tone.durationMilliseconds / 1_000;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(tone.frequencyHz, toneStart);
        gain.gain.setValueAtTime(0.0001, toneStart);
        gain.gain.exponentialRampToValueAtTime(0.18, toneStart + 0.012);
        gain.gain.setValueAtTime(0.18, toneEnd - 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(toneStart);
        oscillator.stop(toneEnd);
      }

      const lastTone = exercise.tones[exercise.tones.length - 1];
      const totalMilliseconds =
        lastTone.startMilliseconds + lastTone.durationMilliseconds + 80;
      await new Promise<void>((resolvePromise) =>
        window.setTimeout(resolvePromise, totalMilliseconds)
      );
    } catch (error) {
      audioError =
        error instanceof Error
          ? error.message
          : 'The listening example could not be played.';
    } finally {
      isPlaying = false;
    }
  }

  function submitAnswer(answer: EarTrainingAnswer) {
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
  <title>Ear training — GuitarLab</title>
  <meta
    name="description"
    content="Practise pulse, pitch, melodic contour and interval recognition with locally generated listening exercises."
  />
</svelte:head>

<main class="ear-page">
  <a class="back-link" href={resolve('/tools')}>← Practice tools</a>

  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH · LISTENING</div>
    <h1>Train your <em>ear.</em></h1>
    <p>
      Short listening challenges build awareness of pulse, pitch, melody and intervals.
      Every example is generated in your browser when you ask to hear it.
    </p>
  </header>

  <nav class="exercise-tabs" aria-label="Ear-training exercise">
    <button type="button" class:active={kind === 'pulse'} aria-pressed={kind === 'pulse'} onclick={() => selectKind('pulse')}>Pulse</button>
    <button type="button" class:active={kind === 'pitch'} aria-pressed={kind === 'pitch'} onclick={() => selectKind('pitch')}>High / low</button>
    <button type="button" class:active={kind === 'contour'} aria-pressed={kind === 'contour'} onclick={() => selectKind('contour')}>Melodic contour</button>
    <button type="button" class:active={kind === 'interval'} aria-pressed={kind === 'interval'} onclick={() => selectKind('interval')}>Intervals</button>
  </nav>

  <section class="panel exercise-panel" aria-labelledby="exercise-title">
    <div class="exercise-meta">
      <span class="eyebrow">{kind === 'pulse' ? 'RHYTHM AND TIME' : kind === 'pitch' ? 'PITCH COMPARISON' : kind === 'contour' ? 'MELODY SHAPE' : 'INTERVAL RECOGNITION'}</span>
      <span class="score" aria-label="Session score">{correctCount} correct · {attemptCount} attempts</span>
    </div>
    <h2 id="exercise-title">{exercise.prompt}</h2>
    <p class="visual-hint">{exercise.visualHint}</p>

    <div class="listening-card">
      <div class="sound-symbol" aria-hidden="true">{kind === 'pulse' ? '♩' : kind === 'pitch' ? '♪' : '♫'}</div>
      <p>{kind === 'pulse' ? 'Four beats' : kind === 'pitch' ? 'Two notes' : kind === 'contour' ? 'Three notes' : 'Two notes · interval'}</p>
      <button type="button" class="primary-button" onclick={playExercise} disabled={isPlaying}>
        {isPlaying ? 'Playing example…' : 'Listen to example'}
      </button>
      <span class="audio-caption">Press play whenever you want to listen again.</span>
    </div>

    <fieldset class="answer-fieldset" disabled={selectedAnswer !== null}>
      <legend>{kind === 'pulse' ? 'How did the beats feel?' : kind === 'pitch' ? 'Which note was higher?' : kind === 'contour' ? 'Which way did the melody move?' : 'What was the distance between the notes?'}</legend>
      <div class="answer-options" class:three-options={exercise.choices.length === 3}>
        {#each exercise.choices as choice (choice.value)}
          <button
            type="button"
            class="answer-button"
            class:selected={selectedAnswer === choice.value}
            onclick={() => submitAnswer(choice.value)}
          >
            {choice.label}
          </button>
        {/each}
      </div>
    </fieldset>

    {#if feedbackState === 'incorrect'}
      <div class="feedback incorrect" role="status">
        <strong>Not quite — give it another listen.</strong>
        <p>Replay the example and try again. Your next attempt can use the same sound.</p>
        <button type="button" class="secondary-button" onclick={retryAnswer}>Try again</button>
      </div>
    {:else if feedbackState === 'correct'}
      <div class="feedback correct" role="status">
        <strong>That's right.</strong>
        <p>{exercise.explanation}</p>
        <button type="button" class="secondary-button" onclick={nextExercise}>Next exercise</button>
      </div>
    {/if}

    {#if audioError}
      <p class="audio-error" role="alert">{audioError}</p>
    {/if}
  </section>

  <section class="panel guidance-panel" aria-labelledby="guidance-title">
    <div class="eyebrow">A LISTENING HABIT</div>
    <h2 id="guidance-title">Listen first. Then decide.</h2>
    <ul>
      <li>Use headphones or a comfortable speaker volume if available.</li>
      <li>Listen to the whole example before choosing an answer.</li>
      <li>For intervals, compare the distance between notes rather than trying to name their absolute pitches.</li>
      <li>Replay as often as you need; this exercise is about noticing, not speed.</li>
      <li>Visual instructions and answer labels are provided, so the task is not explained by sound alone.</li>
    </ul>
  </section>

  <p class="privacy-note">
    Audio is synthesized locally with Web Audio. No microphone permission is requested,
    no recording is made, and this exercise does not change lesson progress or skill mastery.
  </p>
</main>

<style>
  .ear-page {
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
  h1 em {
    color: var(--primary);
  }
  .page-heading p,
  .visual-hint,
  .guidance-panel li,
  .privacy-note {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
  }
  .exercise-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0 16px;
  }
  .exercise-tabs button,
  .answer-button,
  .secondary-button,
  .primary-button {
    min-height: 44px;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }
  .exercise-tabs button {
    padding: 10px 14px;
    background: var(--surface);
    color: var(--muted);
  }
  .exercise-tabs button.active {
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
    justify-content: space-between;
    align-items: center;
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
  .listening-card {
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
  .listening-card p {
    margin: 0;
    font-size: 13px;
    font-weight: 750;
  }
  .audio-caption {
    color: var(--muted);
    font-size: 10px;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .answer-options.three-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .answer-button {
    padding: 12px;
    background: var(--surface-raised);
    color: var(--text);
  }
  .answer-button:hover:not(:disabled) {
    border-color: var(--primary);
  }
  .answer-fieldset:disabled .answer-button {
    cursor: default;
    opacity: 0.7;
  }
  .answer-button.selected {
    border-color: var(--primary);
  }
  button:disabled {
    cursor: wait;
    opacity: 0.6;
  }
  .feedback {
    margin-top: 18px;
    padding: 15px;
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .feedback strong {
    font-size: 13px;
  }
  .feedback p {
    margin: 6px 0 12px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.6;
  }
  .feedback.correct {
    border-color: var(--success);
  }
  .feedback.incorrect {
    border-color: var(--warning);
  }
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
  .guidance-panel {
    margin-top: 16px;
  }
  .guidance-panel h2 {
    margin-top: 7px;
  }
  .guidance-panel ul {
    display: grid;
    gap: 8px;
    margin: 12px 0 0;
    padding-left: 20px;
  }
  .privacy-note {
    margin-top: 18px;
    font-size: 10px;
  }
  a:focus-visible,
  button:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }
  @media (max-width: 560px) {
    .ear-page {
      padding-top: 22px;
    }
    .answer-options,
    .answer-options.three-options {
      grid-template-columns: 1fr;
    }
    .exercise-tabs button {
      flex: 1 1 auto;
    }
  }
</style>
