<script lang="ts">
  import { onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    MicrophoneInput,
    MicrophoneInputError
  } from '../../../lib/audio/microphone-input';
  import { estimatePitch } from '../../../lib/audio/pitch-estimator';
  import { StableNoteTracker } from '../../../lib/audio/stable-note-tracker';
  import type { StableNoteUpdate } from '../../../lib/audio/stable-note-tracker';

  const targets = [
    { midiNote: 40, noteName: 'E2', stringName: '6th · Low E' },
    { midiNote: 45, noteName: 'A2', stringName: '5th · A' },
    { midiNote: 50, noteName: 'D3', stringName: '4th · D' },
    { midiNote: 55, noteName: 'G3', stringName: '3rd · G' },
    { midiNote: 59, noteName: 'B3', stringName: '2nd · B' },
    { midiNote: 64, noteName: 'E4', stringName: '1st · High E' }
  ] as const;
  const emptyResult: StableNoteUpdate = {
    status: 'none',
    event: null,
    note: null,
    candidateMidiNote: null,
    consecutiveFrames: 0
  };
  const tracker = new StableNoteTracker({
    confirmationFrames: 3,
    releaseFrames: 4,
    smoothingWindow: 5,
    minConfidence: 0.82
  });

  let microphone: MicrophoneInput | null = null;
  let animationFrame: number | null = null;
  let sampleBuffer = new Float32Array(4096);
  let isStarting = $state(false);
  let isRunning = $state(false);
  let roundIndex = $state(0);
  let correctCount = $state(0);
  let roundState = $state<'ready' | 'listening' | 'waiting' | 'retry' | 'correct' | 'complete'>('ready');
  let detectedNote = $state('');
  let confidence = $state<number | null>(null);
  let errorMessage = $state('');
  let awaitingRelease = false;
  let processedAt = 0;

  const target = $derived(targets[roundIndex] ?? null);
  const progressLabel = $derived(roundState === 'complete' ? 'Session complete' : `Note ${roundIndex + 1} of ${targets.length}`);

  onDestroy(() => {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    const activeMicrophone = microphone;
    microphone = null;
    if (activeMicrophone) void activeMicrophone.dispose();
  });

  async function startExercise() {
    if (isStarting || isRunning) return;
    errorMessage = '';
    detectedNote = '';
    confidence = null;
    tracker.reset();
    awaitingRelease = false;
    isStarting = true;

    const input = new MicrophoneInput({ fftSize: sampleBuffer.length });
    microphone = input;
    try {
      await input.start();
      if (microphone !== input) {
        await input.dispose();
        return;
      }
      sampleBuffer = new Float32Array(sampleBuffer.length);
      isRunning = true;
      roundState = 'listening';
      processedAt = 0;
      animationFrame = requestAnimationFrame(sampleLoop);
    } catch (error) {
      if (microphone === input) microphone = null;
      await input.dispose();
      errorMessage = error instanceof MicrophoneInputError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'The exercise could not start. Check your microphone and try again.';
    } finally {
      isStarting = false;
    }
  }

  async function stopExercise() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    const activeMicrophone = microphone;
    microphone = null;
    isRunning = false;
    isStarting = false;
    tracker.reset();
    awaitingRelease = false;
    confidence = null;
    detectedNote = '';
    roundState = 'ready';
    if (activeMicrophone) await activeMicrophone.dispose();
  }

  function sampleLoop(timestamp: number) {
    if (!isRunning || !microphone) return;
    if (timestamp - processedAt >= 100) {
      processedAt = timestamp;
      try {
        microphone.readSamples(sampleBuffer);
        const estimate = estimatePitch(sampleBuffer, microphone.sampleRate ?? 48_000);
        const update = tracker.update(estimate, timestamp);
        if (update.note) {
          detectedNote = update.note.noteName;
          confidence = update.note.confidence;
        }
        if (update.event === 'note-off') {
          awaitingRelease = false;
          if (roundState === 'retry' || roundState === 'waiting') {
            roundState = 'listening';
            detectedNote = '';
            confidence = null;
          }
        } else if (
          (update.event === 'note-on' || update.event === 'note-change') &&
          roundState === 'listening' &&
          !awaitingRelease &&
          target
        ) {
          if (update.note?.midiNote === target.midiNote) {
            correctCount += 1;
            roundState = 'correct';
            awaitingRelease = true;
          } else if (update.note) {
            roundState = 'retry';
            awaitingRelease = true;
          }
        }
      } catch (error) {
        errorMessage = error instanceof Error
          ? error.message
          : 'Microphone input stopped unexpectedly.';
        void stopExercise();
        return;
      }
    }
    animationFrame = requestAnimationFrame(sampleLoop);
  }

  function nextNote() {
    if (roundState !== 'correct') return;
    if (roundIndex + 1 >= targets.length) {
      roundState = 'complete';
      return;
    }
    roundIndex += 1;
    detectedNote = '';
    confidence = null;
    roundState = awaitingRelease ? 'waiting' : 'listening';
  }

  function restartExercise() {
    roundIndex = 0;
    correctCount = 0;
    detectedNote = '';
    confidence = null;
    awaitingRelease = false;
    tracker.reset();
    roundState = isRunning ? 'listening' : 'ready';
    errorMessage = '';
  }
</script>

<svelte:head>
  <title>Note recognition — GuitarLab</title>
  <meta
    name="description"
    content="Practise identifying and playing the six standard open guitar-string notes with local microphone pitch recognition."
  />
</svelte:head>

<main class="exercise-page">
  <a class="back-link" href={resolve('/tools')}>← Practice tools</a>
  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH · PITCH</div>
    <h1>Play the <em>right note.</em></h1>
    <p>Six focused rounds for the open strings in standard guitar tuning. Play one string clearly and let the tuner confirm the note before moving on.</p>
  </header>

  <section class="panel" aria-labelledby="exercise-title">
    <div class="exercise-meta">
      <span class="eyebrow">NOTE RECOGNITION</span>
      <span class="progress">{progressLabel}</span>
    </div>

    {#if roundState === 'complete'}
      <div class="result-state" role="status">
        <div class="target-note">Well played.</div>
        <h2 id="exercise-title">All six strings checked.</h2>
        <p>You matched {correctCount} of {targets.length} target notes.</p>
        <button type="button" class="primary-button" onclick={restartExercise}>Play again</button>
      </div>
    {:else if target}
      <div class="target-area">
        <div class="target-label">Play this open string</div>
        <div class="target-note">{target.noteName}</div>
        <div class="target-string">{target.stringName}</div>
      </div>
      <div class="feedback" aria-live="polite" aria-atomic="true">
        {#if roundState === 'correct'}
          <strong class="positive">That's the note.</strong>
          <p>Good match. Let the string settle, then continue.</p>
        {:else if roundState === 'retry'}
          <strong class="caution">Detected {detectedNote || 'a different note'}.</strong>
          <p>That's not {target.noteName}. Let the string stop ringing, then try again.</p>
        {:else if roundState === 'waiting'}
          <strong>Let the previous note ring out.</strong>
          <p>The next round will listen when the sound has settled.</p>
        {:else if roundState === 'listening'}
          <strong>Listening for {target.noteName}…</strong>
          <p>{detectedNote ? `Hearing ${detectedNote} · confidence ${Math.round((confidence ?? 0) * 100)}%` : 'Pluck the open string and hold the note.'}</p>
        {:else}
          <strong>Ready when you are.</strong>
          <p>Start the exercise to enable microphone-based note checking.</p>
        {/if}
      </div>
      {#if roundState === 'correct'}
        <button type="button" class="primary-button" onclick={nextNote}>Next note</button>
      {/if}
    {/if}

    <div class="controls">
      {#if isRunning}
        <button type="button" class="secondary-button" onclick={stopExercise}>Stop microphone</button>
        <span class="capture-state"><span class="live-dot"></span> Audio stays on this device</span>
      {:else}
        <button type="button" class="primary-button" onclick={startExercise} disabled={isStarting || roundState === 'complete'}>
          {isStarting ? 'Starting microphone…' : 'Start exercise'}
        </button>
        <span class="capture-state">Microphone access begins only after Start</span>
      {/if}
    </div>
    {#if errorMessage}
      <p class="error-message" role="alert">{errorMessage}</p>
    {/if}
  </section>

  <section class="panel guidance-panel" aria-labelledby="guide-title">
    <div class="eyebrow">HOW TO PRACTISE</div>
    <h2 id="guide-title">One string. One clear note.</h2>
    <ul>
      <li>Use standard tuning and play the open string shown above.</li>
      <li>Mute the other strings so the microphone hears one fundamental at a time.</li>
      <li>Wait for the note to settle; uncertain or quiet input is not marked as a wrong answer.</li>
      <li>If you play the wrong string, let it ring out before trying again.</li>
    </ul>
  </section>

  <p class="privacy-note">Microphone permission is requested only after you press Start. Pitch analysis runs locally; raw samples are temporary and are never uploaded, saved or logged. Stop the exercise or leave this page to release the microphone.</p>
</main>

<style>
  .exercise-page { width: min(100% - 32px, 820px); margin: 0 auto; padding: 30px 0 64px; color: var(--text); }
  .back-link { display: inline-block; margin-bottom: 28px; color: var(--muted); font-size: 12px; }
  .page-heading { max-width: 680px; padding-bottom: 22px; }
  .eyebrow { color: var(--muted); font-size: 10px; font-weight: 800; letter-spacing: 1.2px; }
  h1 { margin: 10px 0; font: 500 clamp(36px, 5vw, 54px) / 1.08 Georgia, serif; letter-spacing: -1.5px; }
  h1 em { color: var(--primary); }
  .page-heading p, .guidance-panel li, .privacy-note { color: var(--muted); font-size: 12px; line-height: 1.7; }
  .panel { padding: clamp(18px, 4vw, 30px); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
  .exercise-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; }
  .progress, .capture-state { color: var(--muted); font-size: 10px; }
  .target-area, .result-state { display: grid; justify-items: center; text-align: center; padding: 32px 0 18px; }
  .target-label { color: var(--muted); font-size: 11px; }
  .target-note { margin: 8px 0; color: var(--primary); font: 500 clamp(76px, 15vw, 112px) / 1 Georgia, serif; letter-spacing: -4px; }
  .target-string { color: var(--muted); font-size: 12px; }
  h2 { margin: 8px 0 12px; font: 500 clamp(22px, 3vw, 28px) / 1.2 Georgia, serif; }
  .feedback { min-height: 88px; padding: 16px; border-radius: 12px; background: var(--surface-raised); text-align: center; }
  .feedback strong { font-size: 13px; }
  .feedback p, .result-state p { margin: 7px 0 0; color: var(--muted); font-size: 11px; line-height: 1.6; }
  .positive { color: var(--success); }
  .caution { color: var(--warning); }
  .controls { display: grid; justify-items: center; gap: 10px; margin-top: 18px; }
  .primary-button, .secondary-button { min-height: 44px; padding: 11px 18px; border: 1px solid var(--primary); border-radius: 10px; background: var(--primary); color: var(--primary-ink); font-size: 12px; font-weight: 750; cursor: pointer; }
  .secondary-button { border-color: var(--border); background: var(--surface-raised); color: var(--text); }
  button:disabled { cursor: wait; opacity: .6; }
  .capture-state { display: flex; align-items: center; gap: 7px; }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); }
  .error-message { margin: 16px 0 0; color: var(--danger); font-size: 12px; }
  .guidance-panel { margin-top: 16px; }
  .guidance-panel ul { display: grid; gap: 7px; margin: 14px 0 0; padding-left: 19px; }
  .privacy-note { margin-top: 18px; font-size: 10px; }
  a:focus-visible, button:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
</style>
