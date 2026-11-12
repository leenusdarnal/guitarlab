<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { loadActiveLearnerProfile } from '../../lib/storage/indexeddb';
  import {
    getFretboardRows,
    NOTE_NAMES,
    type GuitarNote,
    type HandednessView,
    type NoteName
  } from '../../lib/domain/music/pitch';
  import {
    createChordTransitionObservation,
    getCleanChangeRate,
    OPEN_CHORDS
  } from '../../lib/domain/music/chords';
  import {
    playReferenceTone,
    WebAudioMetronome
  } from '../../lib/audio/metronome';

  const fretNumbers = Array.from({ length: 13 }, (_, fret) => fret);
  const chordOptions = OPEN_CHORDS;
  let mirrored = $state(false);
  let selectedNote = $state<NoteName>('C');
  let selectedFretNote = $state<GuitarNote | null>(null);
  let selectedChordId = $state(OPEN_CHORDS[0].id);
  let cleanChanges = $state('0');
  let totalAttempts = $state('0');
  let elapsedSeconds = $state('0');
  let tempo = $state(80);
  let beatsPerBar = $state(4);
  let metronome = $state<WebAudioMetronome | null>(null);
  let isMetronomeRunning = $state(false);
  let isPlayingReference = $state(false);
  let audioError = $state('');

  const fretboardRows = $derived(
    getFretboardRows({
      fretCount: 12,
      handedness: mirrored ? ('left' as HandednessView) : ('right' as HandednessView)
    })
  );
  const selectedChord = $derived(
    chordOptions.find((chord) => chord.id === selectedChordId) ?? chordOptions[0]
  );
  const cleanChangeObservation = $derived.by(() => {
    try {
      return createChordTransitionObservation({
        cleanChanges: Number(cleanChanges),
        totalAttempts: Number(totalAttempts),
        elapsedSeconds: Number(elapsedSeconds)
      });
    } catch {
      return null;
    }
  });
  const cleanChangeRate = $derived(
    cleanChangeObservation ? getCleanChangeRate(cleanChangeObservation) : null
  );

  onMount(() => {
    let active = true;
    void loadActiveLearnerProfile()
      .then((profile) => {
        if (active) mirrored = profile.preferences.handedness === 'left';
      })
      .catch(() => {
        // The tools remain usable without learner storage or profile preferences.
      });
    return () => {
      active = false;
    };
  });

  onDestroy(() => {
    void metronome?.dispose();
  });

  function selectFretNote(note: GuitarNote) {
    selectedFretNote = note;
  }

  function updateTempo(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    tempo = Number(input.value);
    metronome?.setTempo(tempo);
  }

  function updateMeter(event: Event) {
    const input = event.currentTarget as HTMLSelectElement;
    beatsPerBar = Number(input.value);
    metronome?.setBeatsPerBar(beatsPerBar);
  }

  async function toggleMetronome() {
    audioError = '';
    if (isMetronomeRunning) {
      metronome?.stop();
      isMetronomeRunning = false;
      return;
    }

    const player = metronome ?? new WebAudioMetronome({ bpm: tempo, beatsPerBar });
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
  <title>Music tools — GuitarLab</title>
  <meta
    name="description"
    content="Explore the standard-tuning guitar fretboard, open chord shapes, and an accurate Web Audio metronome."
  />
</svelte:head>

<main class="tools-page">
  <header class="tools-header">
    <a class="back-link" href={resolve('/')}>← Back to dashboard</a>
    <div class="eyebrow">TOOLS FOR EVERY PRACTICE SESSION</div>
    <h1>Make the fretboard <em>familiar.</em></h1>
    <p>
      Practical, instrument-aware tools that work without a microphone. Your
      learner profile and practice history stay on this device.
    </p>
  </header>

  <section class="tool-panel fretboard-panel" aria-labelledby="fretboard-title">
    <div class="panel-heading">
      <div>
        <div class="eyebrow">01 · NOTE FINDER</div>
        <h2 id="fretboard-title">Standard tuning fretboard</h2>
        <p>Choose a note to highlight every matching position across the first twelve frets.</p>
      </div>
      <label class="field compact-field">
        <span>Find note</span>
        <select bind:value={selectedNote} aria-label="Note to find">
          {#each NOTE_NAMES as name (name)}
            <option value={name}>{name}</option>
          {/each}
        </select>
      </label>
    </div>

    <label class="mirror-control">
      <input type="checkbox" bind:checked={mirrored} />
      <span>Mirror string layout for left-handed playing</span>
    </label>

    <div class="fretboard-scroll" tabindex="0" aria-label="Scrollable guitar fretboard">
      <div class="fretboard" style="--fret-count: 13">
        <div class="fret-heading string-heading">String</div>
        {#each fretNumbers as fret (fret)}
          <div class="fret-heading">{fret}</div>
        {/each}
        {#each fretboardRows as row (row.string.stringNumber)}
          <div class="string-heading">
            <strong>{row.string.label}</strong>
            <small>{row.string.stringNumber}</small>
          </div>
          {#each row.notes as note (note.fret)}
            <button
              type="button"
              class="fret-cell"
              class:target-note={note.name === selectedNote}
              class:chosen-note={selectedFretNote?.stringNumber === note.stringNumber && selectedFretNote?.fret === note.fret}
              aria-pressed={selectedFretNote?.stringNumber === note.stringNumber && selectedFretNote?.fret === note.fret}
              aria-label={`String ${note.stringNumber}, fret ${note.fret}: ${note.name}${note.octave}`}
              onclick={() => selectFretNote(note)}
            >
              <span>{note.name}</span>
              {#if note.fret === 0}
                <small>open</small>
              {/if}
            </button>
          {/each}
        {/each}
      </div>
    </div>

    {#if selectedFretNote}
      <div class="selected-note" role="status" aria-live="polite">
        **Selected:** {selectedFretNote.name}{selectedFretNote.octave}
        · String {selectedFretNote.stringNumber}
        · Fret {selectedFretNote.fret}
        · {selectedFretNote.frequencyHz.toFixed(1)} Hz
      </div>
    {:else}
      <p class="helper-text">Tap any fret to see its note name, octave and reference frequency.</p>
    {/if}
    <p class="helper-text">
      Standard E–A–D–G–B–E tuning is used here. Mirroring changes only the display order;
      string numbers and pitches remain attached to the same strings.
    </p>
  </section>

  <section class="tool-panel" aria-labelledby="chords-title">
    <div class="eyebrow">02 · CHORD LAB</div>
    <div class="panel-heading chord-heading">
      <div>
        <h2 id="chords-title">Open chord shapes</h2>
        <p>Open circles, muted strings and fretted positions are identified separately.</p>
      </div>
      <label class="field compact-field">
        <span>Choose chord</span>
        <select bind:value={selectedChordId} aria-label="Choose an open chord">
          {#each chordOptions as chord (chord.id)}
            <option value={chord.id}>{chord.name} · {chord.quality}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="chord-card">
      <div class="chord-title">
        <div><h3>{selectedChord.name}</h3><span>{selectedChord.quality}</span></div>
        <p>{selectedChord.description}</p>
      </div>
      <div
        class="chord-diagram"
        role="img"
        aria-label={`${selectedChord.name} chord: ${selectedChord.strings.map((string) => string.state === 'muted' ? 'muted' : string.state === 'open' ? 'open' : `fret ${string.fret}, finger ${string.finger}`).join(', ')}`}
      >
        {#each selectedChord.strings as string (string.stringNumber)}
          <div class="chord-string">
            <span class="string-name">{string.stringNumber === 1 ? 'e' : string.stringNumber === 2 ? 'B' : string.stringNumber === 3 ? 'G' : string.stringNumber === 4 ? 'D' : string.stringNumber === 5 ? 'A' : 'E'}</span>
            {#if string.state === 'muted'}
              <span class="string-marker muted" aria-hidden="true">×</span>
              <small>Mute</small>
            {:else if string.state === 'open'}
              <span class="string-marker open" aria-hidden="true">○</span>
              <small>Open</small>
            {:else}
              <span class="string-marker fretted" aria-hidden="true">{string.finger}</span>
              <small>Fret {string.fret}</small>
            {/if}
          </div>
        {/each}
      </div>
      <div class="chord-legend" aria-label="Chord diagram legend">
        <span><i class="legend-open">○</i> Open string</span>
        <span><i class="legend-muted">×</i> Muted string</span>
        <span><i class="legend-fretted">1</i> Finger number</span>
      </div>
    </div>

    <div class="transition-observation">
      <div>
        <h3>Chord-change observation</h3>
        <p>Keep clean changes and elapsed time as separate observations. No speed score is inferred.</p>
      </div>
      <div class="observation-fields">
        <label class="field">
          <span>Clean changes</span>
          <input type="number" min="0" max="10000" step="1" bind:value={cleanChanges} />
        </label>
        <label class="field">
          <span>Total attempts</span>
          <input type="number" min="0" max="10000" step="1" bind:value={totalAttempts} />
        </label>
        <label class="field">
          <span>Elapsed seconds</span>
          <input type="number" min="0" max="86400" step="1" bind:value={elapsedSeconds} />
        </label>
      </div>
      {#if cleanChangeObservation}
        <p class="observation-result" role="status">
          {cleanChangeObservation.cleanChanges} clean of {cleanChangeObservation.totalAttempts} attempts
          · {cleanChangeRate === null ? 'No attempts yet' : `${cleanChangeRate}% clean`}
          · {cleanChangeObservation.elapsedSeconds} seconds elapsed
        </p>
      {:else}
        <p class="input-error" role="alert">Enter whole-number values. Clean changes cannot exceed total attempts.</p>
      {/if}
    </div>
  </section>

  <section class="tool-panel" aria-labelledby="metronome-title">
    <div class="eyebrow">03 · TIME AND PULSE</div>
    <div class="panel-heading">
      <div>
        <h2 id="metronome-title">Metronome</h2>
        <p>Audio clicks are scheduled on the Web Audio clock, not played directly from timer callbacks.</p>
      </div>
      <span class="audio-status" class:running={isMetronomeRunning}>
        {isMetronomeRunning ? 'Playing' : 'Stopped'}
      </span>
    </div>

    <div class="tempo-readout">
      <div><strong>{tempo}</strong><span>BPM</span></div>
      <label class="field meter-field">
        <span>Beats per bar</span>
        <select value={String(beatsPerBar)} onchange={updateMeter}>
          <option value="3">3 beats</option>
          <option value="4">4 beats</option>
          <option value="6">6 beats</option>
        </select>
      </label>
    </div>
    <label class="tempo-slider">
      <span>Tempo <strong>{tempo} BPM</strong></span>
      <input type="range" min="40" max="240" step="1" value={tempo} oninput={updateTempo} />
      <span class="range-labels"><small>40 BPM</small><small>240 BPM</small></span>
    </label>
    <div class="audio-actions">
      <button
        type="button"
        class="primary-button"
        aria-pressed={isMetronomeRunning}
        onclick={toggleMetronome}
      >
        {isMetronomeRunning ? 'Stop metronome' : 'Start metronome'}
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
    <p class="helper-text">
      Audio starts only after you press a control. No microphone permission is requested,
      and the metronome stops when this tab is hidden.
    </p>
  </section>

  <footer class="tools-footer">
    <a href={resolve('/')}>← Return to your learning dashboard</a>
    <span>GuitarLab · Local-first music tools</span>
  </footer>
</main>

<style>
  .tools-page {
    width: min(1120px, calc(100% - 32px));
    margin: 0 auto;
    padding: 28px 0 64px;
    color: var(--text);
  }
  .tools-header { max-width: 760px; padding: 10px 0 28px; }
  .back-link { display: inline-block; color: var(--muted); font-size: 12px; margin-bottom: 24px; }
  .eyebrow { color: var(--muted); font-size: 10px; font-weight: 800; letter-spacing: 1.3px; }
  h1 { font: 500 clamp(36px, 6vw, 58px)/1.08 Georgia, serif; letter-spacing: -1.7px; margin: 12px 0; }
  h1 em { color: var(--primary); }
  .tools-header > p,.panel-heading p,.transition-observation p,.helper-text {
    color: var(--muted); font-size: 12px; line-height: 1.7;
  }
  .tool-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: clamp(17px, 3vw, 28px); margin: 16px 0; }
  .panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin: 0 0 18px; }
  .panel-heading h2 { font: 500 25px/1.2 Georgia, serif; margin: 8px 0 5px; }
  .panel-heading p { max-width: 560px; margin: 0; }
  .field { display: grid; gap: 7px; min-width: 0; color: var(--muted); font-size: 11px; }
  .field input,.field select {
    min-height: 42px; border: 1px solid var(--border); border-radius: 9px; padding: 9px 11px;
    background: var(--surface-raised); color: var(--text); font-size: 12px; min-width: 0;
  }
  .compact-field { min-width: 130px; max-width: 200px; }
  .mirror-control { display: flex; gap: 9px; align-items: center; color: var(--muted); font-size: 11px; margin: 4px 0 14px; }
  .mirror-control input { width: 18px; height: 18px; accent-color: var(--primary); }
  .fretboard-scroll { max-width: 100%; overflow-x: auto; border: 1px solid var(--border); border-radius: 12px; }
  .fretboard { display: grid; grid-template-columns: 44px repeat(13, minmax(38px, 1fr)); min-width: 650px; background: var(--surface-raised); }
  .fret-heading,.string-heading,.fret-cell { min-height: 42px; display: grid; place-items: center; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .fret-heading { color: var(--muted); font-size: 10px; font-weight: 750; }
  .string-heading { background: var(--surface); color: var(--text); font-size: 12px; }
  .string-heading strong { font-size: 14px; }
  .string-heading small { color: var(--muted); font-size: 9px; margin-top: -8px; }
  .fret-cell { position: relative; border-top: 0; border-left: 0; background: transparent; color: var(--muted); cursor: pointer; font-size: 10px; gap: 1px; }
  .fret-cell small { font-size: 8px; color: var(--muted); }
  .fret-cell.target-note { background: color-mix(in srgb, var(--primary) 16%, transparent); color: var(--text); font-weight: 800; }
  .fret-cell.chosen-note { outline: 2px solid var(--primary); outline-offset: -3px; }
  .fret-cell:focus-visible { z-index: 1; }
  .selected-note { background: var(--surface-raised); border-radius: 9px; padding: 11px 13px; margin-top: 14px; font-size: 12px; }
  .helper-text { margin: 12px 0 0; }
  .chord-heading { align-items: end; }
  .chord-card { border: 1px solid var(--border); background: var(--surface-raised); border-radius: 13px; padding: 18px; }
  .chord-title { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .chord-title h3 { font: 500 28px/1 Georgia, serif; margin: 0 0 5px; }
  .chord-title span { color: var(--muted); font-size: 10px; }
  .chord-title p { color: var(--muted); font-size: 11px; line-height: 1.6; max-width: 420px; margin: 0; }
  .chord-diagram { display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 8px; margin: 20px auto 14px; max-width: 540px; }
  .chord-string { display: grid; place-items: center; gap: 6px; min-height: 78px; border-left: 1px solid var(--border); }
  .chord-string:first-child { border-left: 0; }
  .string-name { color: var(--muted); font-weight: 750; font-size: 11px; }
  .string-marker { width: 34px; height: 34px; display: grid; place-items: center; font-size: 21px; line-height: 1; }
  .string-marker.open { color: var(--success); }
  .string-marker.muted { color: var(--danger); font-weight: 800; }
  .string-marker.fretted { border-radius: 50%; background: var(--primary); color: var(--primary-ink); font-size: 13px; font-weight: 850; }
  .chord-string small { color: var(--muted); font-size: 9px; }
  .chord-legend { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; border-top: 1px solid var(--border); padding-top: 13px; color: var(--muted); font-size: 10px; }
  .chord-legend i { font-style: normal; font-weight: 850; margin-right: 3px; }
  .legend-open { color: var(--success); }.legend-muted { color: var(--danger); }.legend-fretted { display: inline-grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; background: var(--primary); color: var(--primary-ink); }
  .transition-observation { margin-top: 18px; padding: 18px; border: 1px solid var(--border); border-radius: 12px; }
  .transition-observation h3 { font-size: 14px; margin: 0 0 5px; }
  .transition-observation p { margin: 0; }
  .observation-fields { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; margin: 15px 0; }
  .observation-result { border-radius: 9px; padding: 11px 12px; background: var(--surface-raised); color: var(--text) !important; font-size: 11px !important; }
  .input-error { color: var(--danger); font-size: 11px; }
  .audio-status { padding: 7px 10px; border: 1px solid var(--border); border-radius: 99px; font-size: 10px; color: var(--muted); }
  .audio-status.running { border-color: var(--success); color: var(--success); }
  .tempo-readout { display: flex; align-items: end; justify-content: space-between; gap: 20px; border: 1px solid var(--border); border-radius: 12px; padding: 18px; background: var(--surface-raised); }
  .tempo-readout > div { display: flex; align-items: baseline; gap: 9px; }
  .tempo-readout strong { font: 500 48px/1 Georgia, serif; letter-spacing: -1px; }
  .tempo-readout span { color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: 1px; }
  .meter-field { min-width: 130px; }
  .tempo-slider { display: grid; gap: 9px; margin: 18px 0; color: var(--muted); font-size: 11px; }
  .tempo-slider > span:first-child { display: flex; justify-content: space-between; }
  .tempo-slider strong { color: var(--text); }
  .tempo-slider input { width: 100%; accent-color: var(--primary); }
  .range-labels { display: flex; justify-content: space-between; }
  .audio-actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .primary-button,.secondary-button { min-height: 44px; padding: 11px 17px; border-radius: 10px; font-size: 12px; font-weight: 750; cursor: pointer; }
  .primary-button { background: var(--primary); border: 1px solid var(--primary); color: var(--primary-ink); }
  .secondary-button { background: var(--surface-raised); border: 1px solid var(--border); color: var(--text); }
  .primary-button:disabled,.secondary-button:disabled { opacity: .5; cursor: not-allowed; }
  .tools-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; padding: 20px 2px; color: var(--muted); font-size: 11px; }
  .tools-footer a { color: var(--primary); }
  @media (max-width: 680px) {
    .panel-heading,.chord-title { flex-direction: column; align-items: stretch; }
    .compact-field { width: 100%; max-width: none; }
    .observation-fields { grid-template-columns: 1fr; }
    .chord-card { padding: 14px; }
    .tempo-readout { align-items: flex-start; flex-direction: column; }
    .audio-actions > button { flex: 1 1 100%; }
  }
</style>
