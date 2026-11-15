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

  const tracker = new StableNoteTracker({
    confirmationFrames: 3,
    releaseFrames: 4,
    smoothingWindow: 5,
    minConfidence: 0.82
  });
  const emptyResult: StableNoteUpdate = {
    status: 'none',
    event: null,
    note: null,
    candidateMidiNote: null,
    consecutiveFrames: 0
  };

  let microphone: MicrophoneInput | null = null;
  let animationFrame: number | null = null;
  let sampleBuffer = new Float32Array(4096);
  let isStarting = $state(false);
  let isRunning = $state(false);
  let result = $state<StableNoteUpdate>(emptyResult);
  let errorMessage = $state('');
  let processedAt = 0;
  let calibration = $state(440);

  const centsOff = $derived(
    result.note
      ? 1200 * Math.log2(
          result.note.frequencyHz /
            (calibration * Math.pow(2, (result.note.midiNote - 69) / 12))
        )
      : 0
  );
  const needleAngle = $derived(Math.max(-50, Math.min(50, centsOff)) * 1.35);

  onDestroy(() => {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    const activeMicrophone = microphone;
    microphone = null;
    if (activeMicrophone) void activeMicrophone.dispose();
  });

  async function startTuner() {
    if (isStarting || isRunning) return;
    errorMessage = '';
    result = emptyResult;
    tracker.reset();
    isStarting = true;

    const input = new MicrophoneInput({ fftSize: sampleBuffer.length });
    microphone = input;
    try {
      // start() is called directly by this click handler so permission remains
      // tied to the learner's explicit action.
      await input.start();
      if (microphone !== input) {
        await input.dispose();
        return;
      }
      sampleBuffer = new Float32Array(sampleBuffer.length);
      isRunning = true;
      processedAt = 0;
      animationFrame = requestAnimationFrame(sampleLoop);
    } catch (error) {
      if (microphone === input) microphone = null;
      await input.dispose();
      errorMessage = describeMicrophoneError(error);
    } finally {
      isStarting = false;
    }
  }

  async function stopTuner() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    const activeMicrophone = microphone;
    microphone = null;
    isRunning = false;
    isStarting = false;
    tracker.reset();
    result = emptyResult;
    if (activeMicrophone) await activeMicrophone.dispose();
  }

  function sampleLoop(timestamp: number) {
    if (!isRunning || !microphone) return;
    // Ten pitch windows per second are sufficient for a responsive tuner and
    // keep the YIN-style estimator's CPU cost bounded on mobile devices.
    if (timestamp - processedAt >= 100) {
      processedAt = timestamp;
      try {
        microphone.readSamples(sampleBuffer);
        const estimate = estimatePitch(
          sampleBuffer,
          microphone.sampleRate ?? 48_000
        );
        result = tracker.update(estimate, timestamp);
      } catch (error) {
        errorMessage =
          error instanceof Error
            ? error.message
            : 'Microphone input stopped unexpectedly.';
        void stopTuner();
        return;
      }
    }
    animationFrame = requestAnimationFrame(sampleLoop);
  }

  function describeMicrophoneError(error: unknown): string {
    if (error instanceof MicrophoneInputError) return error.message;
    return error instanceof Error
      ? error.message
      : 'The tuner could not start. Check your microphone and try again.';
  }
</script>

<svelte:head>
  <title>Chromatic tuner — GuitarLab</title>
  <meta
    name="description"
    content="Tune one guitar string at a time with local, confidence-aware microphone pitch detection."
  />
</svelte:head>

<main class="tuner-page">
  <a class="back-link" href={resolve('/tools')}>← Practice tools</a>

  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH · PITCH</div>
    <h1>Find your <em>note.</em></h1>
    <p>
      A chromatic tuner for one string at a time. Play a clear note, let it ring,
      and adjust until the needle settles in the centre.
    </p>
  </header>

  <section class="panel tuner-panel" aria-labelledby="tuner-title">
    <div class="panel-meta">
      <span class="eyebrow">CHROMATIC TUNER</span>
      <label class="calibration">
        A4 reference
        <select bind:value={calibration} aria-label="A4 reference frequency">
          <option value={440}>440 Hz</option>
          <option value={442}>442 Hz</option>
          <option value={432}>432 Hz</option>
        </select>
      </label>
    </div>

    <div class="note-display" aria-live="polite" aria-atomic="true">
      {#if result.note}
        <div class="note-name">{result.note.noteName}</div>
        <div class="frequency">{result.note.frequencyHz.toFixed(1)} <span>Hz</span></div>
        <div class="cents-value" class:in-tune={Math.abs(centsOff) <= 5}>
          {centsOff > 0 ? '+' : ''}{centsOff.toFixed(1)} cents
          <span>{Math.abs(centsOff) <= 5 ? 'In tune' : centsOff < 0 ? 'Tune up' : 'Tune down'}</span>
        </div>
      {:else}
        <div class="note-placeholder">—</div>
        <div class="frequency">Waiting for a clear note</div>
        <div class="cents-value muted">Play one string and hold it</div>
      {/if}
    </div>

    <div
      class="tuning-meter"
      role="img"
      aria-label={result.note
        ? 'Tuning deviation ' + centsOff.toFixed(1) + ' cents'
        : 'Tuning meter waiting for a detected note'}
    >
      <div class="meter-scale">
        <span class="tick tick-left">−50</span>
        <span class="tick tick-mid">0</span>
        <span class="tick tick-right">+50</span>
        <div class="meter-centre"></div>
        <div class="needle" style:transform={'translateX(-50%) rotate(' + needleAngle + 'deg)'}></div>
      </div>
      <div class="meter-labels"><span>Flat</span><span>In tune</span><span>Sharp</span></div>
    </div>

    <div class="capture-controls">
      {#if isRunning}
        <button type="button" class="stop-button" onclick={stopTuner}>Stop microphone</button>
        <span class="capture-state"><span class="live-dot"></span> Listening on this device</span>
      {:else}
        <button type="button" class="start-button" onclick={startTuner} disabled={isStarting}>
          {isStarting ? 'Starting microphone…' : 'Start tuner'}
        </button>
        <span class="capture-state">Microphone starts only when you press Start</span>
      {/if}
    </div>

    {#if errorMessage}
      <p class="error-message" role="alert">{errorMessage}</p>
    {/if}
  </section>

  <section class="panel guidance-panel" aria-labelledby="guidance-title">
    <div class="eyebrow">STANDARD GUITAR TUNING</div>
    <h2 id="guidance-title">Tune one string at a time.</h2>
    <div class="string-list" aria-label="Standard tuning from lowest to highest">
      <div><strong>E2</strong><span>6th · Low E</span><small>82.4 Hz</small></div>
      <div><strong>A2</strong><span>5th · A</span><small>110.0 Hz</small></div>
      <div><strong>D3</strong><span>4th · D</span><small>146.8 Hz</small></div>
      <div><strong>G3</strong><span>3rd · G</span><small>196.0 Hz</small></div>
      <div><strong>B3</strong><span>2nd · B</span><small>246.9 Hz</small></div>
      <div><strong>E4</strong><span>1st · High E</span><small>329.6 Hz</small></div>
    </div>
    <ul>
      <li>Mute the other strings and pluck a single open string.</li>
      <li>Let the note ring steadily; avoid touching the string while it vibrates.</li>
      <li>Adjust the tuning peg in small movements. Stop when the needle is centred.</li>
      <li>If the reading is uncertain, pluck again closer to the guitar and reduce background noise.</li>
    </ul>
  </section>

  <p class="privacy-note">
    Microphone permission is requested only after you press Start. Pitch analysis runs locally
    in your browser; raw audio samples are temporary and are never uploaded, saved or logged.
    Stop the tuner or leave this page to release the microphone.
  </p>
</main>

<style>
  .tuner-page {
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
  .page-heading { max-width: 680px; padding-bottom: 22px; }
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
  .page-heading p, .privacy-note, .guidance-panel li {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
  }
  .panel {
    padding: clamp(18px, 4vw, 30px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .panel-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .calibration {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 11px;
  }
  select {
    min-height: 36px;
    padding: 6px 9px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface-raised);
    color: var(--text);
    font: inherit;
  }
  .note-display {
    min-height: 190px;
    display: grid;
    align-content: center;
    justify-items: center;
    padding: 20px 0 8px;
    text-align: center;
  }
  .note-name, .note-placeholder {
    font: 500 clamp(76px, 15vw, 116px) / 0.95 Georgia, serif;
    letter-spacing: -5px;
  }
  .note-name { color: var(--primary); }
  .note-placeholder { color: var(--muted); }
  .frequency { margin-top: 12px; font-size: 17px; font-variant-numeric: tabular-nums; }
  .frequency span { color: var(--muted); font-size: 11px; }
  .cents-value {
    display: grid;
    gap: 3px;
    margin-top: 8px;
    color: var(--text);
    font-size: 13px;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }
  .cents-value span { color: var(--muted); font-size: 10px; font-weight: 500; }
  .cents-value.in-tune { color: var(--success); }
  .cents-value.muted { color: var(--muted); font-weight: 500; }
  .tuning-meter { max-width: 540px; margin: 18px auto 24px; }
  .meter-scale {
    position: relative;
    height: 112px;
    overflow: hidden;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(to top, var(--surface-raised), transparent);
  }
  .meter-scale::before {
    position: absolute;
    right: 50%;
    bottom: 0;
    width: 1px;
    height: 100%;
    background: var(--success);
    content: '';
  }
  .tick { position: absolute; bottom: 5px; color: var(--muted); font-size: 10px; }
  .tick-left { left: 0; }
  .tick-mid { left: 50%; transform: translateX(-50%); }
  .tick-right { right: 0; }
  .meter-centre {
    position: absolute;
    left: 50%;
    bottom: 0;
    height: 100%;
    border-left: 1px dashed var(--success);
  }
  .needle {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 3px;
    height: 92px;
    border-radius: 4px 4px 0 0;
    background: var(--primary);
    transform-origin: center bottom;
    transition: transform 120ms ease-out;
  }
  .meter-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    color: var(--muted);
    font-size: 10px;
  }
  .capture-controls {
    display: grid;
    justify-items: center;
    gap: 10px;
    padding-top: 6px;
  }
  .start-button, .stop-button {
    min-height: 46px;
    padding: 11px 22px;
    border: 1px solid var(--primary);
    border-radius: 10px;
    background: var(--primary);
    color: var(--primary-ink);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }
  .stop-button {
    border-color: var(--border);
    background: var(--surface-raised);
    color: var(--text);
  }
  button:disabled { cursor: wait; opacity: 0.6; }
  .capture-state { display: flex; align-items: center; gap: 7px; color: var(--muted); font-size: 10px; }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); }
  .error-message { margin: 16px 0 0; color: var(--danger); font-size: 12px; }
  .guidance-panel { margin-top: 16px; }
  h2 { margin: 8px 0 16px; font: 500 clamp(22px, 3vw, 28px) / 1.2 Georgia, serif; }
  .string-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 18px;
  }
  .string-list div {
    display: grid;
    gap: 3px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
  }
  .string-list strong { color: var(--primary); font: 500 22px Georgia, serif; }
  .string-list span, .string-list small { color: var(--muted); font-size: 10px; }
  .guidance-panel ul { display: grid; gap: 7px; margin: 0; padding-left: 19px; }
  .privacy-note { margin-top: 18px; font-size: 10px; }
  a:focus-visible, button:focus-visible, select:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }
  @media (max-width: 560px) {
    .tuner-page { padding-top: 22px; }
    .string-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .note-display { min-height: 160px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .needle { transition: none; }
  }
</style>
