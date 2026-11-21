<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import Icon from '../../../lib/components/Icon.svelte';
  import {
    MAX_METRONOME_BPM,
    MIN_METRONOME_BPM,
    playReferenceTone,
    WebAudioMetronome
  } from '../../../lib/audio/metronome';

  type WakeLockSentinelLike = EventTarget & { release(): Promise<void> };
  type WakeLockApiLike = { request(type: 'screen'): Promise<WakeLockSentinelLike> };

  const tempoPresets = [60, 80, 100, 120];
  let tempo = $state(80);
  let beatsPerBar = $state(4);
  let metronome = $state<WebAudioMetronome | null>(null);
  let isMetronomeRunning = $state(false);
  let isStarting = $state(false);
  let isPlayingReference = $state(false);
  let audioError = $state('');
  let audioErrorAction = $state<'metronome' | 'reference' | null>(null);
  let activeBeat = $state<number | null>(null);
  let isWakeLockActive = $state(false);
  let wakeLockStatus = $state<'idle' | 'active' | 'unavailable' | 'released'>('idle');
  let wakeLock: WakeLockSentinelLike | null = null;
  let tapMessage = $state('Tap in a steady rhythm to set the tempo.');
  let tapTimes: number[] = [];

  onMount(() => {
    const requestedTempo = Number(new URLSearchParams(window.location.search).get('bpm'));
    if (Number.isInteger(requestedTempo) && requestedTempo >= MIN_METRONOME_BPM && requestedTempo <= MAX_METRONOME_BPM) {
      setTempo(requestedTempo);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  onDestroy(() => {
    releaseWakeLock();
    void metronome?.dispose();
  });

  function setTempo(nextTempo: number) {
    if (!Number.isInteger(nextTempo) || nextTempo < MIN_METRONOME_BPM || nextTempo > MAX_METRONOME_BPM) return;
    tempo = nextTempo;
    metronome?.setTempo(nextTempo);
  }

  function updateTempo(event: Event) {
    setTempo(Number((event.currentTarget as HTMLInputElement).value));
  }

  function adjustTempo(amount: number) {
    setTempo(tempo + amount);
  }

  function tapTempo() {
    const now = performance.now();
    if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2_000) tapTimes = [];
    tapTimes = [...tapTimes, now].slice(-5);
    if (tapTimes.length < 2) {
      tapMessage = 'Tap once more to calculate your tempo.';
      return;
    }
    const intervals = tapTimes.slice(1).map((tap, index) => tap - tapTimes[index]);
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const tappedTempo = Math.round(60_000 / averageInterval);
    if (tappedTempo < MIN_METRONOME_BPM || tappedTempo > MAX_METRONOME_BPM) {
      tapMessage = 'Keep tapping between ' + MIN_METRONOME_BPM + ' and ' + MAX_METRONOME_BPM + ' BPM.';
      return;
    }
    setTempo(tappedTempo);
    tapMessage = 'Tempo set to ' + tappedTempo + ' BPM.';
  }

  function updateMeter(event: Event) {
    beatsPerBar = Number((event.currentTarget as HTMLSelectElement).value);
    metronome?.setBeatsPerBar(beatsPerBar);
    activeBeat = null;
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && isMetronomeRunning && !wakeLock) {
      void requestWakeLock();
    }
  }

  async function requestWakeLock() {
    const wakeLockApi = (navigator as Navigator & { wakeLock?: WakeLockApiLike }).wakeLock;
    if (!wakeLockApi) {
      wakeLockStatus = 'unavailable';
      return;
    }
    try {
      const requestedLock = await wakeLockApi.request('screen');
      if (!isMetronomeRunning) {
        await requestedLock.release();
        return;
      }
      wakeLock = requestedLock;
      isWakeLockActive = true;
      wakeLockStatus = 'active';
      requestedLock.addEventListener('release', () => {
        if (wakeLock === requestedLock) {
          wakeLock = null;
          isWakeLockActive = false;
          wakeLockStatus = 'released';
        }
      });
    } catch {
      // Wake Lock is optional; a denied request must not interrupt audio.
      wakeLockStatus = 'unavailable';
    }
  }

  function releaseWakeLock() {
    const activeLock = wakeLock;
    wakeLock = null;
    isWakeLockActive = false;
    if (activeLock) void activeLock.release().catch(() => undefined);
  }

  async function toggleMetronome() {
    if (isStarting) return;
    audioError = '';
    audioErrorAction = null;
    if (isMetronomeRunning) {
      metronome?.stop();
      isMetronomeRunning = false;
      activeBeat = null;
      releaseWakeLock();
      return;
    }

    isStarting = true;
    const player = metronome ?? new WebAudioMetronome({
      bpm: tempo,
      beatsPerBar,
      onStateChange: (running) => {
        isMetronomeRunning = running;
        if (!running) {
          activeBeat = null;
          releaseWakeLock();
        }
      },
      onBeat: (beat) => { activeBeat = beat; }
    });
    player.setTempo(tempo);
    player.setBeatsPerBar(beatsPerBar);
    metronome = player;
    try {
      await player.start();
      isMetronomeRunning = player.isRunning;
      if (player.isRunning) await requestWakeLock();
    } catch (error) {
      await player.dispose();
      metronome = null;
      isMetronomeRunning = false;
      activeBeat = null;
      releaseWakeLock();
      audioError = error instanceof Error
        ? error.message
        : 'The metronome could not start in this browser.';
      audioErrorAction = 'metronome';
    } finally {
      isStarting = false;
    }
  }

  async function playA4Reference() {
    audioError = '';
    audioErrorAction = null;
    isPlayingReference = true;
    try {
      await playReferenceTone(440, 900);
    } catch (error) {
      audioError = error instanceof Error
        ? error.message
        : 'The reference tone could not be played.';
      audioErrorAction = 'reference';
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

<main id="main-content" tabindex="-1" class="metronome-page">
  <a class="back-link tool-page-back-link" href={resolve('/tools')}><Icon name="arrow-left" size={14} /> Tools</a>

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

    <div class="tempo-display">
      <strong>{tempo}</strong>
      <span>BPM</span>
    </div>

    <div class="tempo-adjusters" aria-label="Tempo adjustment">
      <button type="button" class="step-button" aria-label="Decrease tempo by 1 BPM" onclick={() => adjustTempo(-1)}>−</button>
      <label class="tempo-entry">
        <span>Tempo in BPM</span>
        <input
          type="number"
          min={MIN_METRONOME_BPM}
          max={MAX_METRONOME_BPM}
          step="1"
          value={tempo}
          oninput={updateTempo}
          aria-label="Enter tempo in beats per minute"
        />
      </label>
      <button type="button" class="step-button" aria-label="Increase tempo by 1 BPM" onclick={() => adjustTempo(1)}>+</button>
    </div>

    <div class="tempo-presets" aria-label="Tempo presets">
      {#each tempoPresets as preset (preset)}
        <button
          type="button"
          class:chosen={tempo === preset}
          aria-pressed={tempo === preset}
          onclick={() => setTempo(preset)}
        >{preset} BPM</button>
      {/each}
    </div>

    <div class="tap-tempo">
      <button type="button" class="secondary-button" onclick={tapTempo}>Tap tempo</button>
      <p role="status" aria-live="polite">{tapMessage}</p>
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

    <div class="beat-indicator" aria-hidden="true">
      {#each Array.from({ length: beatsPerBar }, (_, index) => index + 1) as beat (beat)}
        <span class:active={activeBeat === beat} class:downbeat={beat === 1}></span>
      {/each}
    </div>

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
        disabled={isStarting}
        onclick={toggleMetronome}
      >
        {isStarting
          ? 'Starting…'
          : isMetronomeRunning
            ? 'Stop metronome'
            : audioErrorAction === 'metronome' ? 'Try metronome again' : 'Start metronome'}
      </button>
      <button
        type="button"
        class="secondary-button"
        onclick={playA4Reference}
        disabled={isPlayingReference}
      >
        {isPlayingReference ? 'Playing A4…' : audioErrorAction === 'reference' ? 'Try A4 reference tone again' : 'Play A4 reference tone'}
      </button>
    </div>

    {#if audioError}
      <p class="input-error" role="alert">{audioError}</p>
    {/if}
    {#if isMetronomeRunning && isWakeLockActive}
      <p class="wake-lock-note" role="status">Screen stays awake while the metronome is playing.</p>
    {:else if isMetronomeRunning && wakeLockStatus === 'unavailable'}
      <p class="wake-lock-note">Your browser may dim the screen; metronome audio will continue.</p>
    {:else if isMetronomeRunning && wakeLockStatus === 'released'}
      <p class="wake-lock-note" role="status">The screen lock was released. Metronome audio is still playing.</p>
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
  .tempo-adjusters {
    display: flex;
    align-items: end;
    justify-content: center;
    gap: 12px;
    margin: 18px 0 12px;
  }
  .step-button {
    width: 48px;
    min-height: 48px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface-raised);
    color: var(--text);
    font-size: 24px;
    font-weight: 700;
  }
  .tempo-entry {
    display: grid;
    gap: 6px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    text-align: center;
  }
  .tempo-entry input {
    width: 112px;
    min-height: 48px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
    color: var(--text);
    font: 700 20px/1 system-ui, sans-serif;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .tempo-presets {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin: 12px 0 18px;
  }
  .tempo-presets button {
    min-height: 44px;
    padding: 9px 13px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface-raised);
    color: var(--text);
    font-size: 11px;
    font-weight: 700;
  }
  .tempo-presets button.chosen {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 12%, var(--surface));
    color: var(--primary);
  }
  .tap-tempo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin: 10px 0 22px;
  }
  .tap-tempo p,
  .wake-lock-note {
    margin: 0;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.5;
  }
  .beat-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    min-height: 46px;
    margin: 18px 0;
  }
  .beat-indicator span {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-strong);
    border-radius: 50%;
    background: var(--surface-raised);
    transition: transform 90ms ease, background-color 90ms ease, border-color 90ms ease;
  }
  .beat-indicator span.downbeat {
    width: 20px;
    height: 20px;
    border-color: var(--primary);
  }
  .beat-indicator span.active {
    transform: scale(1.2);
    background: var(--primary);
    border-color: var(--primary);
  }
  .beat-indicator span.active.downbeat {
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--primary) 18%, transparent);
  }
  .wake-lock-note {
    margin: 14px 0 0;
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
  @media (prefers-reduced-motion: reduce) {
    .beat-indicator span { transition: none; }
    .beat-indicator span.active { transform: none; }
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

  .page-heading p,
  .guidance-panel p,
  .guidance-panel li {
    font-size: var(--font-size-body);
    line-height: var(--line-height-body);
  }

  .audio-status,
  .privacy-note,
  .range-labels,
  .range-labels small {
    font-size: var(--font-size-supporting);
    line-height: var(--line-height-body);
  }

  .field,
  .field label {
    font-size: var(--font-size-supporting);
  }

  .step-button,
  .tempo-presets button,
  .primary-button,
  .secondary-button,
  .audio-actions > button {
    min-height: 44px;
    font-size: var(--font-size-supporting);
  }
</style>
