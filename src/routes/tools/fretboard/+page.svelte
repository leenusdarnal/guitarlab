<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    FLAT_NOTE_NAMES,
    SHARP_NOTE_NAMES,
    STANDARD_GUITAR_TUNING,
    getDisplayFretColumn,
    getFretboardLayout,
    getNoteAtPosition,
    type FretboardNote,
    type GuitarHandedness,
    type NoteSpelling
  } from '../../../lib/domain/music/fretboard';
  import {
    loadActiveLearnerProfile,
    saveActiveLearnerPreferences
  } from '../../../lib/storage/indexeddb';
  import type { ProfilePreferences } from '../../../lib/domain/profile/preferences';

  let handedness = $state<GuitarHandedness>('right');
  let spelling = $state<NoteSpelling>('sharp');
  let maxFret = $state(12);
  let targetPitchClass = $state(0);
  let findMode = $state(false);
  let selectedPosition = $state<{ stringNumber: number; fret: number } | null>(null);
  let focusedPosition = $state({ stringNumber: 1, fret: 0 });
  let feedback = $state('');
  let saveStatus = $state('');
  let profilePreferences = $state<ProfilePreferences | null>(null);
  let isSaving = $state(false);

  let fretboardRows = $derived(
    getFretboardLayout(maxFret, STANDARD_GUITAR_TUNING, spelling)
  );
  let targetNoteName = $derived(
    (spelling === 'flat' ? FLAT_NOTE_NAMES : SHARP_NOTE_NAMES)[targetPitchClass]
  );
  let selectedNote = $derived(
    selectedPosition
      ? getNoteAtPosition(
          selectedPosition.stringNumber,
          selectedPosition.fret,
          STANDARD_GUITAR_TUNING,
          spelling
        )
      : null
  );

  onMount(() => {
    let active = true;
    void loadActiveLearnerProfile()
      .then((profile) => {
        if (!active) return;
        profilePreferences = profile.preferences;
        if (profile.preferences.handedness) {
          handedness = profile.preferences.handedness;
        }
      })
      .catch(() => {
        if (active) {
          saveStatus =
            'Your saved orientation could not be loaded. You can still explore the fretboard and choose an orientation.';
        }
      });
    return () => {
      active = false;
    };
  });

  function cellLabel(note: FretboardNote): string {
    if (findMode) return `String ${note.stringNumber}, fret ${note.fret}, position`;
    return `String ${note.stringNumber}, fret ${note.fret}, ${note.noteName}${note.octave}`;
  }

  function changeTargetNote(event: Event) {
    targetPitchClass = Number((event.currentTarget as HTMLSelectElement).value);
    selectedPosition = null;
    feedback = '';
  }

  function changeMaxFret(event: Event) {
    maxFret = Number((event.currentTarget as HTMLSelectElement).value);
    if (focusedPosition.fret > maxFret) {
      focusedPosition = { stringNumber: 1, fret: 0 };
    }
    selectedPosition = null;
    feedback = '';
  }

  function activateNote(note: FretboardNote) {
    if (findMode) {
      if (note.pitchClass !== targetPitchClass) {
        selectedPosition = null;
        feedback = `Not quite. Find ${targetNoteName} on another position.`;
        return;
      }
      selectedPosition = {
        stringNumber: note.stringNumber,
        fret: note.fret
      };
      feedback = `Correct — ${targetNoteName} is at string ${note.stringNumber}, fret ${note.fret}.`;
      return;
    }

    selectedPosition = {
      stringNumber: note.stringNumber,
      fret: note.fret
    };
    feedback = '';
  }

  function moveFocus(event: KeyboardEvent, note: FretboardNote) {
    const rightward = event.key === 'ArrowRight';
    const leftward = event.key === 'ArrowLeft';
    const downward = event.key === 'ArrowDown';
    const upward = event.key === 'ArrowUp';
    if (!rightward && !leftward && !downward && !upward) return;

    event.preventDefault();
    const visualDirection = rightward ? 1 : leftward ? -1 : 0;
    const fretDirection = handedness === 'left' ? -visualDirection : visualDirection;
    const nextFret = note.fret + fretDirection;
    const nextString = note.stringNumber + (downward ? 1 : upward ? -1 : 0);
    if (nextFret < 0 || nextFret > maxFret || nextString < 1 || nextString > 6) {
      return;
    }

    focusedPosition = { stringNumber: nextString, fret: nextFret };
    document
      .querySelector<HTMLButtonElement>(
        `.fret-cell[data-string="${nextString}"][data-fret="${nextFret}"]`
      )
      ?.focus();
  }

  function startFindMode() {
    findMode = !findMode;
    selectedPosition = null;
    feedback = '';
  }

  async function saveOrientation() {
    isSaving = true;
    saveStatus = '';
    try {
      const preferences =
        profilePreferences ?? (await loadActiveLearnerProfile()).preferences;
      const updated = await saveActiveLearnerPreferences({
        ...preferences,
        handedness
      });
      profilePreferences = updated.preferences;
      saveStatus = `Saved ${handedness}-handed diagram orientation to your profile.`;
    } catch {
      saveStatus =
        'The orientation could not be saved. Your current diagram remains available until you leave this page.';
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Fretboard explorer — GuitarLab</title>
  <meta
    name="description"
    content="Explore guitar notes across six strings, practise note finding and choose a handedness-aware fretboard view."
  />
</svelte:head>

<main class="fretboard-page">
  <a class="back-link" href={resolve('/tools')}>← Practice tools</a>

  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH · NOTES &amp; PITCH</div>
    <h1>Fretboard explorer.</h1>
    <p>
      Find your way across the strings one note at a time. The diagram keeps each
      note's pitch and string identity unchanged when you switch its display
      orientation.
    </p>
  </header>

  <section class="panel settings-panel" aria-labelledby="settings-title">
    <div class="section-heading">
      <div>
        <div class="eyebrow">YOUR VIEW</div>
        <h2 id="settings-title">Fretboard settings</h2>
      </div>
      <span class="local-label">Runs locally</span>
    </div>

    <div class="controls">
      <label>
        <span>Diagram orientation</span>
        <select aria-label="Diagram orientation" bind:value={handedness}>
          <option value="right">Right-handed</option>
          <option value="left">Left-handed</option>
        </select>
      </label>
      <label>
        <span>Note spelling</span>
        <select aria-label="Note spelling" bind:value={spelling}>
          <option value="sharp">Sharps (♯)</option>
          <option value="flat">Flats (♭)</option>
        </select>
      </label>
      <label>
        <span>Fret range</span>
        <select aria-label="Fret range" value={maxFret} onchange={changeMaxFret}>
          <option value={12}>Open to 12th fret</option>
          <option value={24}>Open to 24th fret</option>
        </select>
      </label>
    </div>

    <div class="preference-actions">
      <p>Save the diagram orientation as a preference on this learner profile.</p>
      <button class="secondary-button" type="button" onclick={saveOrientation} disabled={isSaving}>
        {isSaving ? 'Saving…' : 'Save this orientation to my profile'}
      </button>
    </div>
    {#if saveStatus}
      <p class="save-status" role="status">{saveStatus}</p>
    {/if}
  </section>

  <section class="panel explorer-panel" aria-labelledby="diagram-title">
    <div class="section-heading">
      <div>
        <div class="eyebrow">STANDARD E TUNING</div>
        <h2 id="diagram-title">Six strings, every note.</h2>
      </div>
      <button class="primary-button" type="button" onclick={startFindMode} aria-pressed={findMode}>
        {findMode ? 'Exit find mode' : 'Find a note'}
      </button>
    </div>

    {#if findMode}
      <div class="find-panel">
        <label for="target-note">Find this note</label>
        <select id="target-note" value={targetPitchClass} onchange={changeTargetNote}>
          {#each SHARP_NOTE_NAMES as noteName, index (index)}
            <option value={index}>{spelling === 'flat' ? FLAT_NOTE_NAMES[index] : noteName}</option>
          {/each}
        </select>
        <p>Choose any matching position. The exercise checks note identity, not speed.</p>
      </div>
    {:else}
      <p class="diagram-hint" id="keyboard-help">
        Select any position to see its note and pitch. Use the arrow keys to move
        between neighbouring frets and strings.
      </p>
    {/if}

    <div class="fretboard-scroll" tabindex="0" aria-label="Scrollable fretboard diagram">
      <div class="fretboard">
        <div
          class="fret-numbers"
          data-frets={maxFret}
          style={`grid-template-columns: 34px repeat(${maxFret + 1}, minmax(0, 1fr));`}
          aria-hidden="true"
        >
          <span class="string-heading">String</span>
          {#each Array.from({ length: maxFret + 1 }, (_, fret) => fret) as fret (fret)}
            <span
              class="fret-number"
              style={`grid-column: ${getDisplayFretColumn(fret, maxFret, handedness) + 1};`}
            >{fret === 0 ? 'Open' : fret}</span>
          {/each}
        </div>

        {#each fretboardRows as notes, rowIndex (rowIndex + 1)}
          <div
            class="fret-row"
            role="group"
            data-frets={maxFret}
            style={`grid-template-columns: 34px repeat(${maxFret + 1}, minmax(0, 1fr));`}
            aria-label={`String ${rowIndex + 1}`}
          >
            <span class="string-label">
              <strong>{notes[0].noteName}{notes[0].octave}</strong>
              <small>{rowIndex + 1}</small>
            </span>
            {#each notes as note (note.fret)}
              <button
                class="fret-cell"
                class:open-string={note.fret === 0}
                class:is-target={findMode && selectedPosition?.stringNumber === note.stringNumber && selectedPosition?.fret === note.fret && note.pitchClass === targetPitchClass}
                class:is-selected={selectedPosition?.stringNumber === note.stringNumber && selectedPosition?.fret === note.fret}
                type="button"
                aria-label={cellLabel(note)}
                aria-pressed={selectedPosition?.stringNumber === note.stringNumber && selectedPosition?.fret === note.fret}
                aria-describedby={findMode ? undefined : 'keyboard-help'}
                aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
                tabindex={focusedPosition.stringNumber === note.stringNumber && focusedPosition.fret === note.fret ? 0 : -1}
                onfocus={() => {
                  focusedPosition = {
                    stringNumber: note.stringNumber,
                    fret: note.fret
                  };
                }}
                data-string={note.stringNumber}
                data-fret={note.fret}
                data-display-column={getDisplayFretColumn(note.fret, maxFret, handedness)}
                style={`grid-column: ${getDisplayFretColumn(note.fret, maxFret, handedness) + 1};`}
                onclick={() => activateNote(note)}
                onkeydown={(event) => moveFocus(event, note)}
              >
                {#if !findMode || (selectedPosition?.stringNumber === note.stringNumber && selectedPosition?.fret === note.fret)}
                  <span>{note.noteName}</span><small>{note.octave}</small>
                {:else}
                  <span class="visually-hidden">Position</span>
                {/if}
              </button>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <div class="legend" aria-label="Fretboard legend">
      <span><i class="open-marker"></i> Open string</span>
      <span><i class="target-marker"></i> Target note</span>
      <span>String 1 is the highest pitch; string 6 is the lowest.</span>
    </div>

    {#if selectedNote && !findMode}
      <div class="note-detail" aria-live="polite">
        <div>
          <span class="eyebrow">SELECTED POSITION</span>
          <strong>{selectedNote.noteName}{selectedNote.octave}</strong>
          <p>String {selectedNote.stringNumber} · Fret {selectedNote.fret}</p>
        </div>
        <div class="frequency">
          <span>Frequency</span>
          <strong>{selectedNote.frequencyHz.toFixed(2)} Hz</strong>
        </div>
      </div>
    {/if}

    {#if feedback}
      <p class="feedback" role="status">{feedback}</p>
    {/if}
  </section>

  <p class="privacy-note">
    No microphone permission is needed. Note positions and the find-a-note exercise
    run in this browser; no learner data or audio is uploaded.
  </p>
</main>

<style>
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .fretboard-page {
    width: min(100% - 32px, 1040px);
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
  .privacy-note {
    max-width: 680px;
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
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
  }
  h2 {
    margin: 6px 0 0;
    font: 500 21px / 1.2 Georgia, serif;
  }
  .local-label {
    color: var(--success);
    font-size: 10px;
    font-weight: 750;
  }
  .controls {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .controls label,
  .find-panel label {
    display: grid;
    gap: 7px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
  }
  select {
    width: 100%;
    min-height: 42px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface-raised);
    color: var(--text);
    font-size: 11px;
  }
  .preference-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 15px;
  }
  .preference-actions p,
  .find-panel p,
  .diagram-hint {
    margin: 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.6;
  }
  .secondary-button,
  .primary-button {
    min-height: 38px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 9px;
    font-size: 10px;
    font-weight: 750;
    cursor: pointer;
  }
  .secondary-button {
    background: var(--surface-raised);
    color: var(--text);
  }
  .primary-button {
    border-color: var(--primary);
    background: var(--primary);
    color: var(--primary-ink);
  }
  button:disabled {
    cursor: wait;
    opacity: 0.65;
  }
  .save-status,
  .feedback {
    margin: 12px 0 0;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--text);
    font-size: 11px;
    line-height: 1.5;
  }
  .diagram-hint {
    margin: -6px 0 15px;
  }
  .find-panel {
    display: grid;
    grid-template-columns: minmax(150px, 220px) minmax(0, 1fr);
    align-items: center;
    gap: 6px 14px;
    margin: 0 0 15px;
    padding: 13px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
  }
  .find-panel select {
    grid-column: 1;
  }
  .find-panel p {
    grid-column: 2;
    grid-row: 1 / span 2;
  }
  .fretboard-scroll {
    width: 100%;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    border: 1px solid var(--border);
    border-radius: 11px;
    background: var(--bg);
    padding: 8px;
  }
  .fretboard {
    display: grid;
    gap: 4px;
    min-width: 100%;
  }
  .fret-numbers,
  .fret-row {
    display: grid;
    align-items: center;
    gap: 2px;
  }
  .fret-numbers[data-frets='24'],
  .fret-row[data-frets='24'] {
    min-width: 640px;
  }
  .string-heading,
  .fret-number {
    color: var(--muted);
    font-size: 8px;
    text-align: center;
  }
  .string-label {
    display: grid;
    justify-items: center;
    gap: 2px;
    color: var(--text);
    font-size: 9px;
  }
  .string-label small {
    color: var(--muted);
    font-size: 8px;
  }
  .fret-cell {
    display: flex;
    min-width: 0;
    min-height: 30px;
    align-items: center;
    justify-content: center;
    gap: 1px;
    padding: 2px 0;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font-size: clamp(7px, 1.8vw, 10px);
    cursor: pointer;
  }
  .fret-cell small {
    color: var(--muted);
    font-size: 7px;
  }
  .fret-cell.open-string {
    border-color: color-mix(in srgb, var(--primary) 65%, var(--border));
  }
  .fret-cell.is-target {
    background: color-mix(in srgb, var(--secondary) 22%, var(--surface));
  }
  .fret-cell.is-selected {
    outline: 2px solid var(--primary);
    outline-offset: -2px;
  }
  .fret-cell:focus-visible {
    position: relative;
    z-index: 1;
    outline: 3px solid var(--focus);
    outline-offset: 1px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    margin-top: 12px;
    color: var(--muted);
    font-size: 9px;
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .legend i {
    display: inline-block;
    width: 9px;
    height: 9px;
    border: 1px solid var(--border);
    border-radius: 3px;
  }
  .open-marker {
    border-color: var(--primary) !important;
  }
  .target-marker {
    background: var(--secondary);
  }
  .note-detail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 16px;
    padding: 15px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
  }
  .note-detail > div:first-child {
    display: grid;
    gap: 5px;
  }
  .note-detail strong {
    font: 500 25px / 1.1 Georgia, serif;
  }
  .note-detail p {
    margin: 0;
    color: var(--muted);
    font-size: 10px;
  }
  .frequency {
    display: grid;
    gap: 5px;
    text-align: right;
  }
  .frequency span {
    color: var(--muted);
    font-size: 9px;
  }
  .frequency strong {
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
  }
  .privacy-note {
    margin-top: 18px;
    font-size: 10px;
  }
  a:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }
  @media (max-width: 640px) {
    .fretboard-page {
      padding-top: 22px;
    }
    .controls {
      grid-template-columns: 1fr;
    }
    .preference-actions {
      align-items: flex-start;
      flex-direction: column;
    }
    .section-heading {
      align-items: flex-start;
    }
    .find-panel {
      grid-template-columns: 1fr;
    }
    .find-panel p {
      grid-column: 1;
      grid-row: auto;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
