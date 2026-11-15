<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    createChordTransitionObservation,
    getCleanChangeRate,
    OPEN_CHORDS
  } from '../../../lib/domain/music/chords';
  import type { ChordString } from '../../../lib/domain/music/chords';
  import { loadActiveLearnerProfile } from '../../../lib/storage/indexeddb';

  let selectedChordId = $state(OPEN_CHORDS[0].id);
  let handedness = $state<'right' | 'left'>('right');
  let cleanChanges = $state('0');
  let totalAttempts = $state('0');
  let elapsedSeconds = $state('0');
  let profileStatus = $state('');
  let fromChordId = $state('c-major');
  let toChordId = $state('g-major');
  let drillTarget = $state<'from' | 'to'>('from');
  let drillActive = $state(false);
  let drillStartedAt: number | null = null;
  let drillTimer: ReturnType<typeof setInterval> | null = null;

  const fromChord = $derived(
    OPEN_CHORDS.find((chord) => chord.id === fromChordId) ?? OPEN_CHORDS[0]
  );
  const toChord = $derived(
    OPEN_CHORDS.find((chord) => chord.id === toChordId) ?? OPEN_CHORDS[1]
  );
  const nextDrillChord = $derived(drillTarget === 'from' ? fromChord : toChord);

  const selectedChord = $derived(
    OPEN_CHORDS.find((chord) => chord.id === selectedChordId) ?? OPEN_CHORDS[0]
  );
  const displayStrings = $derived(
    handedness === 'left'
      ? [...selectedChord.strings].reverse()
      : [...selectedChord.strings]
  );
  const cleanChangeObservation = $derived.by(() => {
    // Svelte coerces values from type="number" inputs to numbers. Normalize
    // before trimming so editing one field cannot break the derived view.
    const cleanChangesValue = String(cleanChanges ?? '').trim();
    const totalAttemptsValue = String(totalAttempts ?? '').trim();
    const elapsedSecondsValue = String(elapsedSeconds ?? '').trim();
    if (
      cleanChangesValue === '' ||
      totalAttemptsValue === '' ||
      elapsedSecondsValue === ''
    ) {
      return null;
    }
    try {
      return createChordTransitionObservation({
        cleanChanges: Number(cleanChangesValue),
        totalAttempts: Number(totalAttemptsValue),
        elapsedSeconds: Number(elapsedSecondsValue)
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
        if (!active) return;
        if (profile.preferences.handedness === 'left') {
          handedness = 'left';
        }
      })
      .catch(() => {
        if (active) {
          profileStatus =
            'Saved hand preference is unavailable. The chord library remains usable in right-handed view.';
        }
      });
    return () => {
      active = false;
    };
  });


  function startDrill() {
    if (fromChordId === toChordId) return;
    if (drillTimer !== null) clearInterval(drillTimer);
    cleanChanges = '0';
    totalAttempts = '0';
    elapsedSeconds = '0';
    drillTarget = 'from';
    selectedChordId = fromChordId;
    drillStartedAt = Date.now();
    drillActive = true;
    drillTimer = setInterval(() => {
      if (drillStartedAt !== null) {
        elapsedSeconds = String(Math.floor((Date.now() - drillStartedAt) / 1000));
      }
    }, 250);
  }

  function recordChange(clean: boolean) {
    if (!drillActive) return;
    totalAttempts = String(Number(totalAttempts) + 1);
    if (clean) cleanChanges = String(Number(cleanChanges) + 1);
    drillTarget = drillTarget === 'from' ? 'to' : 'from';
    selectedChordId = drillTarget === 'from' ? fromChordId : toChordId;
  }

  function finishDrill() {
    if (drillStartedAt !== null) {
      elapsedSeconds = String(Math.floor((Date.now() - drillStartedAt) / 1000));
    }
    if (drillTimer !== null) {
      clearInterval(drillTimer);
      drillTimer = null;
    }
    drillStartedAt = null;
    drillActive = false;
  }

  onDestroy(() => {
    if (drillTimer !== null) clearInterval(drillTimer);
  });

  function stringDescription(string: ChordString): string {
    if (string.state === 'muted') return 'muted';
    if (string.state === 'open') return 'open';
    return `fret ${string.fret}, finger ${string.finger}`;
  }
</script>

<svelte:head>
  <title>Chord library — GuitarLab</title>
  <meta
    name="description"
    content="Explore beginner-friendly open guitar chords and keep clean chord changes separate from elapsed practice time."
  />
</svelte:head>

<main class="chords-page">
  <a class="back-link" href={resolve('/tools')}>← Practice tools</a>

  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH · HARMONY</div>
    <h1>Chord library.</h1>
    <p>
      Learn five foundational open shapes. Every string is labelled as open,
      muted or fretted, and the diagram follows the handedness saved to your
      learner profile.
    </p>
  </header>

  <section class="panel" aria-labelledby="library-title">
    <div class="section-heading">
      <div>
        <div class="eyebrow">OPEN CHORDS</div>
        <h2 id="library-title">Choose a shape.</h2>
      </div>
      <label class="field">
        <span>Chord</span>
        <select bind:value={selectedChordId} aria-label="Choose an open chord">
          {#each OPEN_CHORDS as chord (chord.id)}
            <option value={chord.id}>{chord.name} · {chord.quality}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="chord-summary">
      <div>
        <span class="eyebrow">{selectedChord.quality.toUpperCase()}</span>
        <h3>{selectedChord.name}</h3>
      </div>
      <p>{selectedChord.description}</p>
    </div>

    <div
      class="chord-diagram"
      role="img"
      aria-label={`${selectedChord.name} chord, ${handedness}-handed view. ${displayStrings.map((string) => `string ${string.stringNumber}: ${stringDescription(string)}`).join('; ')}.`}
    >
      {#each displayStrings as string (string.stringNumber)}
        <div class="chord-string">
          <span class="string-name">
            {string.stringNumber === 1
              ? 'e'
              : string.stringNumber === 2
                ? 'B'
                : string.stringNumber === 3
                  ? 'G'
                  : string.stringNumber === 4
                    ? 'D'
                    : string.stringNumber === 5
                      ? 'A'
                      : 'E'}
          </span>
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

    <div class="diagram-legend" aria-label="Chord diagram legend">
      <span><i class="open-key">○</i> Open string</span>
      <span><i class="muted-key">×</i> Muted string</span>
      <span><i class="finger-key">1</i> Finger number</span>
      <span class="handedness">{handedness === 'left' ? 'Left-handed' : 'Right-handed'} view</span>
    </div>
    {#if profileStatus}
      <p class="profile-status" role="status">{profileStatus}</p>
    {/if}
  </section>

  <section class="panel drill-panel" aria-labelledby="drill-title">
    <div class="eyebrow">CHORD-CHANGE DRILL</div>
    <h2 id="drill-title">Move between two shapes.</h2>
    <p class="section-description">
      Choose two different chords, start the drill, and alternate between the
      displayed target shapes. Record a clean change or one that needs correction.
    </p>
    <div class="drill-choices">
      <label class="field">
        <span>First chord</span>
        <select bind:value={fromChordId} disabled={drillActive} aria-label="First drill chord">
          {#each OPEN_CHORDS as chord (chord.id)}
            <option value={chord.id}>{chord.name} · {chord.quality}</option>
          {/each}
        </select>
      </label>
      <label class="field">
        <span>Second chord</span>
        <select bind:value={toChordId} disabled={drillActive} aria-label="Second drill chord">
          {#each OPEN_CHORDS as chord (chord.id)}
            <option value={chord.id}>{chord.name} · {chord.quality}</option>
          {/each}
        </select>
      </label>
    </div>
    {#if fromChordId === toChordId}
      <p class="input-error" role="alert">Choose two different chords for a transition drill.</p>
    {/if}
    <div class="drill-target" aria-live="polite">
      <span>{drillActive ? 'NEXT CHORD TO PLAY' : 'READY WHEN YOU ARE'}</span>
      <strong>{drillActive ? nextDrillChord.name : `${fromChord.name} → ${toChord.name}`}</strong>
      <p>{drillActive ? nextDrillChord.description : 'The target alternates after each recorded attempt.'}</p>
    </div>
    <div class="drill-actions">
      {#if drillActive}
        <button type="button" class="secondary-button" onclick={() => recordChange(true)}>
          Record clean change
        </button>
        <button type="button" class="secondary-button" onclick={() => recordChange(false)}>
          Record correction needed
        </button>
        <button type="button" class="finish-button" onclick={finishDrill}>
          Finish drill
        </button>
      {:else}
        <button
          type="button"
          class="primary-button"
          onclick={startDrill}
          disabled={fromChordId === toChordId}
        >
          Start / reset drill
        </button>
      {/if}
    </div>
  </section>

  <section class="panel observation-panel" aria-labelledby="observation-title">
    <div class="eyebrow">PRACTICE EVIDENCE</div>
    <h2 id="observation-title">Chord-change observation.</h2>
    <p class="section-description">
      Record clean changes and elapsed time separately. GuitarLab does not
      turn speed into a proxy for accuracy.
    </p>
    <div class="observation-fields">
      <label class="field">
        <span>Clean changes</span>
        <input type="number" min="0" max="10000" step="1" bind:value={cleanChanges} disabled={drillActive} />
      </label>
      <label class="field">
        <span>Total attempts</span>
        <input type="number" min="0" max="10000" step="1" bind:value={totalAttempts} disabled={drillActive} />
      </label>
      <label class="field">
        <span>Elapsed seconds</span>
        <input type="number" min="0" max="86400" step="1" bind:value={elapsedSeconds} disabled={drillActive} />
      </label>
    </div>
    {#if cleanChangeObservation}
      <div class="observation-result" role="status" aria-live="polite">
        <div>
          <span>Clean changes</span>
          <strong>{cleanChangeRate === null ? 'No attempts' : `${cleanChangeRate}%`}</strong>
        </div>
        <div>
          <span>Elapsed time</span>
          <strong>{cleanChangeObservation.elapsedSeconds}s</strong>
        </div>
        <p>
          {cleanChangeObservation.cleanChanges} clean of
          {cleanChangeObservation.totalAttempts} attempts
        </p>
      </div>
    {:else}
      <p class="input-error" role="alert">
        Enter whole-number values from zero to the limits shown. Clean changes
        cannot exceed total attempts.
      </p>
    {/if}
  </section>

  <p class="privacy-note">
    These observations remain on this page and are not saved as learner
    mastery or uploaded practice evidence.
  </p>
</main>

<style>
  .chords-page {
    width: min(100% - 32px, 960px);
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
    max-width: 700px;
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
  .section-description,
  .privacy-note {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
  }
  .panel {
    margin-top: 16px;
    padding: clamp(16px, 3vw, 24px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 20px;
  }
  h2 {
    margin: 6px 0 0;
    font: 500 22px / 1.2 Georgia, serif;
  }
  .field {
    display: grid;
    gap: 7px;
    min-width: 0;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
  }
  .field input,
  .field select {
    width: 100%;
    min-height: 42px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface-raised);
    color: var(--text);
    font-size: 12px;
  }
  .section-heading > .field {
    width: min(220px, 45%);
  }
  .chord-summary {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 20px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 11px;
    background: var(--surface-raised);
  }
  .chord-summary h3 {
    margin: 7px 0 0;
    font: 500 34px / 1 Georgia, serif;
  }
  .chord-summary p {
    max-width: 520px;
    margin: 0;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.7;
  }
  .chord-diagram {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 7px;
    max-width: 600px;
    margin: 22px auto 14px;
    padding: 8px 0;
  }
  .chord-string {
    display: grid;
    min-width: 0;
    min-height: 112px;
    align-content: center;
    justify-items: center;
    gap: 8px;
    border-left: 1px solid var(--border);
  }
  .chord-string:first-child {
    border-left: 0;
  }
  .string-name {
    color: var(--muted);
    font-size: 12px;
    font-weight: 800;
  }
  .string-marker {
    display: grid;
    width: 38px;
    height: 38px;
    place-items: center;
    font-size: 23px;
    line-height: 1;
  }
  .string-marker.open {
    color: var(--success);
  }
  .string-marker.muted {
    color: var(--danger);
    font-weight: 850;
  }
  .string-marker.fretted {
    border-radius: 50%;
    background: var(--primary);
    color: var(--primary-ink);
    font-size: 14px;
    font-weight: 850;
  }
  .chord-string small {
    color: var(--muted);
    font-size: 10px;
  }
  .diagram-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px 18px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 10px;
  }
  .diagram-legend i {
    margin-right: 3px;
    font-style: normal;
    font-weight: 850;
  }
  .open-key {
    color: var(--success);
  }
  .muted-key {
    color: var(--danger);
  }
  .finger-key {
    display: inline-grid;
    width: 17px;
    height: 17px;
    place-items: center;
    border-radius: 50%;
    background: var(--primary);
    color: var(--primary-ink);
  }
  .handedness {
    color: var(--text);
  }
  .profile-status {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 10px;
  }
  .drill-panel h2 {
    margin-bottom: 6px;
  }
  .drill-choices {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 18px 0;
  }
  .drill-target {
    display: grid;
    gap: 7px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
  }
  .drill-target > span {
    color: var(--muted);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1px;
  }
  .drill-target strong {
    font: 500 28px / 1 Georgia, serif;
  }
  .drill-target p {
    margin: 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.5;
  }
  .drill-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 14px;
  }
  .primary-button,
  .secondary-button,
  .finish-button {
    min-height: 40px;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 9px;
    font-size: 10px;
    font-weight: 750;
    cursor: pointer;
  }
  .primary-button {
    border-color: var(--primary);
    background: var(--primary);
    color: var(--primary-ink);
  }
  .secondary-button,
  .finish-button {
    background: var(--surface-raised);
    color: var(--text);
  }
  .finish-button {
    color: var(--muted);
  }
  button:disabled,
  input:disabled,
  select:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
  .observation-panel h2 {
    margin-bottom: 6px;
  }
  .section-description {
    max-width: 650px;
    margin: 0;
  }
  .observation-fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 18px 0;
  }
  .observation-result {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 20px;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
  }
  .observation-result div {
    display: grid;
    gap: 5px;
  }
  .observation-result span {
    color: var(--muted);
    font-size: 10px;
  }
  .observation-result strong {
    font: 500 24px / 1 Georgia, serif;
  }
  .observation-result p {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--muted);
    font-size: 10px;
  }
  .input-error {
    margin: 0;
    color: var(--danger);
    font-size: 11px;
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
    outline-offset: 2px;
  }
  @media (max-width: 640px) {
    .chords-page {
      padding-top: 22px;
    }
    .section-heading,
    .chord-summary {
      align-items: stretch;
      flex-direction: column;
    }
    .section-heading > .field {
      width: 100%;
    }
    .chord-summary {
      gap: 10px;
    }
    .chord-string {
      min-height: 96px;
    }
    .string-marker {
      width: 30px;
      height: 30px;
    }
    .observation-fields,
    .drill-choices {
      grid-template-columns: 1fr;
    }
    .drill-actions > button {
      flex: 1 1 100%;
    }
  }
</style>
