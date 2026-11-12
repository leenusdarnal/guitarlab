<script lang="ts">
  import { onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    MAX_METRONOME_BPM,
    MIN_METRONOME_BPM,
    playReferenceTone,
    WebAudioMetronome
  } from '../../../lib/audio/metronome';

  let tempo = $state(80);
  let beatsPerBar = $state(4);
  let metronome = $state<WebAudioMetronome | null>(null);
  let isMetronomeRunning = $state(false);
  let isStarting = $state(false);
  let isPlayingReference = $state(false);
  let audioError = $state('');

  onDestroy(() => {
    void metronome?.dispose();
  });

  function updateTempo(event: Event) {
    tempo = Number((event.currentTarget as HTMLInputElement).value);
    metronome?.setTempo(tempo);
  }

  function updateMeter(event: Event) {
    beatsPerBar = Number((event.currentTarget as HTMLSelectElement).value);
    metronome?.setBeatsPerBar(beatsPerBar);
  }

  async function toggleMetronome() {
    if (isStarting) return;
    audioError = '';
    if (isMetronomeRunning) {
      metronome?.stop();
      isMetronomeRunning = false;
      return;
    }

    isStarting = true;
    const player =
      metronome ??
      new WebAudioMetronome({
        bpm: tempo,
        beatsPerBar,
        onStateChange: (running) => {
          isMetronomeRunning = running;
        }
      });
    player.setTempo(tempo);
    player.setBeatsPerBar(beatsPerBar);
    metronome = player;
    try {
      await player.start();
      isMetronomeRunning = player.isRunning;
    } catch (error) {
      await player.dispose();
      metronome = null;
      isMetronomeRunning = false;
      audioError =
        error instanceof Error
          ? error.message
          : 'The metronome could not start in this browser.';
    } finally {
      isStarting = false;
    }
  }

  async function playA4Reference() {
    audioError = '';
    isPlayingReference = true;
    try {
      await playReferenceTone(440, 900);
    } catch (error) {
      audioError =
        error instanceof Error
          ? error.message
          : 'The reference tone could not be played.';
    } finally {
      isPlayingReference = false;
    }
  }
</script>

<svelte:head>
  <title>Metronome — GuitarLab</title>
  <meta
    name="description"
    content="Practise with an accurate local Web Audio metronome and a user-initiated A4 reference tone."
  />
</svelte:head>

<main class="metronome-page">
  <a class="back-link" href={resolve('/tools')}>← Practice tools</a>

  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH · TIME AND PULSE</div>
    <h1>Metronome.</h1>
    <p>
      Build a steady pulse at a tempo and meter that suit today's exercise.
      Audio is generated locally and starts only after you press a control.
    </p>
  </header>

  <section class="panel" aria-labelledby="tempo-title">
    <div class="section-heading">
      <div>
        <div class="eyebrow">PRACTICE TEMPO</div>
        <h2 id="tempo-title">Set your pulse.</h2>
      </div>
      <span class="audio-status" class:running={isMetronomeRunning}>
        {isMetronomeRunning ? 'Playing' : 'Stopped'}
      </span>
    </div>

    <div class="tempo-display" aria-live="polite">
      <strong>{tempo}</strong>
      <span>BPM</span>
    </div>

    <label class="tempo-slider">
      <span>Tempo <strong>{tempo} BPM</strong></span>
      <input
        type="range"
        min={MIN_METRONOME_BPM}
        max={MAX_METRONOME_BPM}
        step="1"
        value={tempo}
        oninput={updateTempo}
        aria-label="Tempo in beats per minute"
      />
      <span class="range-labels">
        <small>{MIN_METRONOME_BPM} BPM</small>
        <small>{MAX_METRONOME_BPM} BPM</small>
      </span>
    </label>

    <label class="field meter-field">
      <span>Beats per bar</span>
      <select value={String(beatsPerBar)} onchange={updateMeter} aria-label="Beats per bar">
        <option value="3">3 beats · 3/4</option>
        <option value="4">4 beats · 4/4</option>
        <option value="6">6 beats · 6/4</option>
      </select>
    </label>

    <div class="audio-actions">
      <button
        type="button"
        class="primary-button"
        aria-pressed={isMetronomeRunning}
        disabled={isStarting}
        onclick={toggleMetronome}
      >
        {isStarting
          ? 'Starting…'
          : isMetronomeRunning
            ? 'Stop metronome'
            : 'Start metronome'}
      </button>
      <button
        type="button"
        class="secondary-button"
        onclick={playA4Reference}
        disabled={isPlayingReference}
      >
        {isPlayingReference ? 'Playing A4…' : 'Play A4 reference tone'}
      </button>
    </div>

    {#if audioError}
      <p class="input-error" role="alert">{audioError}</p>
    {/if}
  </section>

  <section class="panel guidance-panel" aria-labelledby="guidance-title">
    <div class="eyebrow">A STEADY PRACTICE ROUTINE</div>
    <h2 id="guidance-title">Make the pulse feel natural.</h2>
    <p>
      Start comfortably, listen for the stronger first beat in each bar,
      then increase tempo gradually only when the movement remains relaxed.
    </p>
    <ul>
      <li>Choose a slow tempo before beginning a new movement.</li>
      <li>Keep the beat even rather than chasing the next click.</li>
      <li>Stop the metronome when switching exercises or leaving the page.</li>
    </ul>
  </section>

  <p class="privacy-note">
    No microphone permission is requested. The metronome stops when this tab
    is hidden, and its audio resources are released when you leave the page.
  </p>
</main>

<style>
  .metronome-page {
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
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.2px;
  }
  h1 {
    margin: 10px 0;
    font: 500 clamp(34px, 5vw, 54px) / 1.08 Georgia, serif;
    letter-spacing: -1.5px;
  }
  .page-heading p,
  .guidance-panel p,
  .guidance-panel li,
  .privacy-note {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
  }
  .panel {
    margin-top: 16px;
    padding: clamp(18px, 4vw, 30px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  h2 {
    margin: 6px 0 0;
    font: 500 23px / 1.2 Georgia, serif;
  }
  .audio-status {
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: 99px;
    color: var(--muted);
    font-size: 10px;
  }
  .audio-status.running {
    border-color: var(--success);
    color: var(--success);
  }
  .tempo-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 10px;
    margin: 28px 0 18px;
    padding: 24px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface-raised);
  }
  .tempo-display strong {
    font: 500 clamp(58px, 12vw, 84px) / 1 Georgia, serif;
    letter-spacing: -3px;
    font-variant-numeric: tabular-nums;
  }
  .tempo-display span {
    color: var(--muted);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1px;
  }
  .tempo-slider {
    display: grid;
    gap: 10px;
    margin: 20px 0;
    color: var(--muted);
    font-size: 11px;
  }
  .tempo-slider > span:first-child,
  .range-labels {
    display: flex;
    justify-content: space-between;
  }
  .tempo-slider strong {
    color: var(--text);
  }
  .tempo-slider input {
    width: 100%;
    accent-color: var(--primary);
  }
  .range-labels small {
    font-size: 9px;
  }
  .field {
    display: grid;
    width: min(100%, 240px);
    gap: 7px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
  }
  .field select {
    min-height: 42px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface-raised);
    color: var(--text);
    font-size: 12px;
  }
  .audio-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 24px;
  }
  .primary-button,
  .secondary-button {
    min-height: 44px;
    padding: 11px 17px;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }
  .primary-button {
    border-color: var(--primary);
    background: var(--primary);
    color: var(--primary-ink);
  }
  .secondary-button {
    background: var(--surface-raised);
    color: var(--text);
  }
  button:disabled {
    cursor: wait;
    opacity: 0.6;
  }
  .input-error {
    margin: 14px 0 0;
    color: var(--danger);
    font-size: 11px;
  }
  .guidance-panel h2 {
    margin-bottom: 8px;
  }
  .guidance-panel p {
    margin: 0;
  }
  .guidance-panel ul {
    display: grid;
    gap: 8px;
    margin: 16px 0 0;
    padding-left: 20px;
  }
  .privacy-note {
    margin-top: 18px;
    font-size: 10px;
  }
  a:focus-visible,
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }
  @media (max-width: 600px) {
    .metronome-page {
      padding-top: 22px;
    }
    .section-heading {
      align-items: flex-start;
      flex-direction: column;
    }
    .audio-actions > button {
      flex: 1 1 100%;
    }
  }
</style>
