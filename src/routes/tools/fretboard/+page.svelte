<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    FLAT_NOTE_NAMES,
    SHARP_NOTE_NAMES,
    STANDARD_GUITAR_TUNING,
    findFretboardPositions,
    getDisplayFretColumn,
    getFretboardLayout,
    type FretboardNote,
    type GuitarHandedness,
    type NoteSpelling
  } from '$lib/domain/music/fretboard';
  import type { ProfilePreferences } from '$lib/domain/profile/preferences';
  import {
    loadActiveLearnerProfile,
    saveActiveLearnerPreferences
  } from '$lib/storage/indexeddb';

  let handedness = $state<GuitarHandedness>('right');
  let profilePreferences = $state<ProfilePreferences | null>(null);
  let profileLoading = $state(true);
  let profileError = $state('');
  let spelling = $state<NoteSpelling>('sharp');
  let maxFret = $state(12);
  let showNoteNames = $state(true);
  let mode = $state<'explore' | 'find'>('explore');
  let targetPitchClass = $state(0);
  let selectedNote = $state<FretboardNote | null>(null);
  let feedback = $state('');
  let savingHandedness = $state(false);

  const noteNames = $derived(
    spelling === 'flat' ? FLAT_NOTE_NAMES : SHARP_NOTE_NAMES
  );
  const targetNoteName = $derived(noteNames[targetPitchClass]);
  const fretboard = $derived(
    getFretboardLayout(maxFret, STANDARD_GUITAR_TUNING, spelling)
  );
  const handednessIsSaved = $derived(
    profilePreferences?.handedness === handedness
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
          profileError =
            'Your saved handedness could not be loaded. The fretboard is using its standard display orientation.';
        }
      })
      .finally(() => {
        if (active) profileLoading = false;
      });
    return () => {
      active = false;
    };
  });

  function changeHandedness(event: Event) {
    handedness = (event.currentTarget as HTMLSelectElement)
      .value as GuitarHandedness;
    selectedNote = null;
    feedback = '';
  }

  function changeSpelling(event: Event) {
    spelling = (event.currentTarget as HTMLSelectElement)
      .value as NoteSpelling;
    feedback = '';
  }

  function changeMaxFret(event: Event) {
    maxFret = Number((event.currentTarget as HTMLSelectElement).value);
    selectedNote = null;
    feedback = '';
  }

  function selectMode(nextMode: 'explore' | 'find') {
    mode = nextMode;
    selectedNote = null;
    feedback = '';
  }

  function chooseTargetNote(event: Event) {
    targetPitchClass = Number((event.currentTarget as HTMLSelectElement).value);
    selectedNote = null;
    feedback = '';
  }

  function selectFretboardNote(note: FretboardNote) {
    if (mode === 'explore') {
      selectedNote = note;
      feedback = '';
      return;
    }

    if (note.pitchClass === targetPitchClass) {
      selectedNote = note;
      feedback = `Correct — ${targetNoteName} is at string ${note.stringNumber}, fret ${note.fret}.`;
    } else {
      selectedNote = null;
      feedback = `Not quite. String ${note.stringNumber}, fret ${note.fret} is ${note.noteName}${note.octave}. Keep looking for ${targetNoteName}.`;
    }
  }

  async function saveHandednessPreference() {
    if (!profilePreferences || savingHandedness) return;
    savingHandedness = true;
    try {
      const updated = await saveActiveLearnerPreferences({
        ...profilePreferences,
        handedness
      });
      profilePreferences = updated.preferences;
      feedback = `Saved ${handedness}-handed diagram orientation to your learner profile.`;
    } catch {
      feedback =
        'The diagram changed, but your handedness preference could not be saved. Your existing profile was left unchanged.';
    } finally {
      savingHandedness = false;
    }
  }

  function isFretMarker(fret: number) {
    return [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fret);
  }
</script>

<svelte:head>
  <title>Fretboard explorer — GuitarLab</title>
  <meta
    name="description"
    content="Explore notes across all six strings and practise finding pitches on a standard-tuned guitar."
  />
</svelte:head>

<main class="fretboard-page">
  <a class="back-link" href={resolve('/tools')}>← Practice tools</a>

  <header class="page-heading">
    <div class="eyebrow">MUSIC TOOLS · NOTES</div>
    <h1>Fretboard <em>explorer.</em></h1>
    <p>
      Learn where notes live across the neck. Pitch and string identity stay the
      same when you mirror the diagram for a left-handed view.
    </p>
  </header>

  <section class="setup-panel" aria-label="Fretboard settings">
    <div class="setup-heading">
      <div>
        <div class="eyebrow">YOUR INSTRUMENT VIEW</div>
        <h2>Standard E tuning</h2>
      </div>
      <span class="tuning-tag">E · A · D · G · B · E</span>
    </div>

    <div class="controls">
      <label>
        Diagram orientation
        <select value={handedness} onchange={changeHandedness}>
          <option value="right">Standard / right-handed</option>
          <option value="left">Mirrored / left-handed</option>
        </select>
      </label>
      <label>
        Note spelling
        <select value={spelling} onchange={changeSpelling}>
          <option value="sharp">Sharps (C♯)</option>
          <option value="flat">Flats (D♭)</option>
        </select>
      </label>
      <label>
        Frets shown
        <select value={maxFret} onchange={changeMaxFret}>
          <option value={5}>Open to 5th fret</option>
          <option value={12}>Open to 12th fret</option>
          <option value={24}>Open to 24th fret</option>
        </select>
      </label>
      <label class="toggle-control">
        <input type="checkbox" bind:checked={showNoteNames} />
        Show note names
      </label>
    </div>

    {#if profileLoading}
      <p class="profile-note" role="status">Loading your instrument preferences…</p>
    {:else if profileError}
      <p class="profile-note warning" role="alert">{profileError}</p>
    {:else if handednessIsSaved}
      <p class="profile-note">Using your saved {handedness}-handed diagram preference.</p>
    {:else}
      <div class="preference-save">
        <p class="profile-note">
          This is a diagram-only choice. Your learner profile has no saved handedness yet.
        </p>
        <button
          type="button"
          class="save-preference"
          disabled={savingHandedness}
          onclick={saveHandednessPreference}
        >
          {savingHandedness ? 'Saving…' : 'Save this orientation to my profile'}
        </button>
      </div>
    {/if}
  </section>

  <section class="explorer-panel" aria-labelledby="neck-title">
    <div class="panel-heading">
      <div>
        <div class="eyebrow">THE NECK</div>
        <h2 id="neck-title">Find your place on the fretboard</h2>
      </div>
      <span class="neutral-tag">6 strings · {maxFret + 1} positions each</span>
    </div>

    <div class="mode-controls" role="group" aria-label="Fretboard activity">
      <button
        type="button"
        class:active={mode === 'explore'}
        aria-pressed={mode === 'explore'}
        onclick={() => selectMode('explore')}
      >Explore notes</button>
      <button
        type="button"
        class:active={mode === 'find'}
        aria-pressed={mode === 'find'}
        onclick={() => selectMode('find')}
      >Find a note</button>
    </div>

    {#if mode === 'find'}
      <div class="find-prompt">
        <label for="target-note">Find this note across the neck</label>
        <select id="target-note" value={targetPitchClass} onchange={chooseTargetNote}>
          {#each noteNames as noteName, pitchClass}
            <option value={pitchClass}>{noteName}</option>
          {/each}
        </select>
        <p>Choose any matching position. More than one answer may be correct.</p>
      </div>
    {:else}
      <p class="activity-hint">
        Select any position to see its note name, octave and pitch frequency.
      </p>
    {/if}

    <div class="board-scroll" aria-label="Scrollable fretboard diagram">
      <div class="fretboard" class:is-left-handed={handedness === 'left'}>
        <div class="fret-label-row">
          <span class="string-heading">STRING</span>
          {#each Array.from({ length: maxFret + 1 }, (_, fret) => fret) as fret}
            <span
              class="fret-number"
              class:nut-label={fret === 0}
              style:grid-column={getDisplayFretColumn(fret, maxFret, handedness)}
            >{fret === 0 ? 'NUT' : fret}</span>
          {/each}
        </div>

        {#each fretboard as stringNotes (stringNotes[0].stringNumber)}
          <div
            class="string-row"
            role="group"
            aria-label={`String ${stringNotes[0].stringNumber}, ${stringNotes[0].noteName}${stringNotes[0].octave} open`}
          >
            <span class="string-label">
              <strong>{stringNotes[0].stringNumber}</strong>
              <small>{stringNotes[0].noteName}{stringNotes[0].octave}</small>
            </span>
            <div
              class="fret-cells"
              style:grid-template-columns={`repeat(${maxFret + 1}, minmax(38px, 1fr))`}
            >
              {#each stringNotes as note (note.fret)}
                <button
                  type="button"
                  class="fret-cell"
                  class:nut={note.fret === 0}
                  class:marker={isFretMarker(note.fret)}
                  class:selected={selectedNote?.stringNumber === note.stringNumber && selectedNote?.fret === note.fret}
                  class:correct={mode === 'find' && selectedNote?.stringNumber === note.stringNumber && selectedNote?.fret === note.fret && note.pitchClass === targetPitchClass}
                  style:grid-column={getDisplayFretColumn(note.fret, maxFret, handedness)}
                  data-string={note.stringNumber}
                  data-fret={note.fret}
                  data-display-column={getDisplayFretColumn(note.fret, maxFret, handedness)}
                  aria-label={mode === 'find'
                    ? `String ${note.stringNumber}, fret ${note.fret}, position`
                    : `String ${note.stringNumber}, fret ${note.fret}, ${note.noteName}${note.octave}`}
                  aria-pressed={selectedNote?.stringNumber === note.stringNumber && selectedNote?.fret === note.fret}
                  onclick={() => selectFretboardNote(note)}
                >
                  {#if showNoteNames && mode === 'explore'}
                    <span>{note.noteName}</span>
                  {:else if selectedNote?.stringNumber === note.stringNumber && selectedNote?.fret === note.fret}
                    <span>{note.noteName}</span>
                  {:else}
                    <span class="visually-hidden">Select position</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
    <p class="scroll-hint">On smaller screens, scroll sideways to reach higher frets.</p>

    {#if selectedNote && mode === 'explore'}
      <div class="note-detail" aria-live="polite">
        <div>
          <div class="eyebrow">SELECTED POSITION</div>
          <strong>{selectedNote.noteName}{selectedNote.octave}</strong>
        </div>
        <p>String {selectedNote.stringNumber} · Fret {selectedNote.fret}</p>
        <p>{selectedNote.frequencyHz.toFixed(1)} Hz</p>
      </div>
    {/if}

    {#if feedback}
      <p class="feedback" role="status">{feedback}</p>
    {/if}
  </section>

  <section class="reference-panel">
    <div class="eyebrow">HOW TO READ THE NECK</div>
    <div class="reference-grid">
      <p><strong>String numbers</strong><span>1 is the highest-pitched string; 6 is the lowest.</span></p>
      <p><strong>Open position</strong><span>Fret 0 is the open string, before the first fret.</span></p>
      <p><strong>Twelfth fret</strong><span>Each string repeats its open-string pitch one octave higher.</span></p>
      <p><strong>Handedness</strong><span>Mirroring changes where frets appear, never the pitch or string number.</span></p>
    </div>
  </section>

  <footer>
    <a href={resolve('/tools')}>← All practice tools</a>
    <a href={resolve('/onboarding')}>Learning preferences ↗</a>
  </footer>
</main>

<style>
  .fretboard-page {
    max-width: 1160px;
    margin: 0 auto;
    padding: 30px clamp(17px, 4vw, 48px) 64px;
    color: var(--text);
  }
  .back-link {
    display: inline-block;
    margin-bottom: 25px;
    color: var(--muted);
    font-size: 12px;
  }
  .page-heading {
    max-width: 720px;
    margin-bottom: 25px;
  }
  .eyebrow {
    color: var(--muted);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.4px;
  }
  h1 {
    margin: 11px 0;
    font: 500 clamp(36px, 5vw, 56px) / 1.08 Georgia, serif;
    letter-spacing: -1.6px;
  }
  h1 em {
    color: var(--primary);
  }
  .page-heading p {
    max-width: 650px;
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
  }
  .setup-panel,
  .explorer-panel,
  .reference-panel {
    margin-bottom: 15px;
    padding: 21px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .setup-heading,
  .panel-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }
  .setup-heading h2,
  .panel-heading h2 {
    margin: 7px 0 0;
    font-size: 16px;
  }
  .tuning-tag,
  .neutral-tag {
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: 99px;
    color: var(--muted);
    font-size: 9px;
    white-space: nowrap;
  }
  .controls {
    display: flex;
    align-items: end;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }
  .controls label,
  .find-prompt label {
    display: grid;
    gap: 6px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
  }
  select {
    min-height: 38px;
    min-width: 145px;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface-raised);
    color: var(--text);
    font-size: 11px;
  }
  .toggle-control {
    display: flex !important;
    min-height: 38px;
    align-items: center;
    gap: 8px !important;
    padding: 0 5px;
  }
  .toggle-control input {
    accent-color: var(--primary);
    width: 16px;
    height: 16px;
  }
  .profile-note {
    margin: 13px 0 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.6;
  }
  .profile-note.warning {
    color: var(--warning);
  }
  .preference-save {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .save-preference {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 11px;
    background: var(--surface-raised);
    color: var(--text);
    font-size: 10px;
    cursor: pointer;
  }
  .save-preference:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  .panel-heading {
    align-items: center;
  }
  .mode-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin: 18px 0 13px;
  }
  .mode-controls button {
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface-raised);
    color: var(--muted);
    font-size: 10px;
    cursor: pointer;
  }
  .mode-controls button.active {
    border-color: var(--primary);
    color: var(--text);
    background: color-mix(in srgb, var(--primary) 12%, var(--surface));
  }
  .activity-hint,
  .find-prompt p,
  .scroll-hint {
    color: var(--muted);
    font-size: 10px;
    line-height: 1.6;
  }
  .find-prompt {
    display: flex;
    align-items: end;
    flex-wrap: wrap;
    gap: 12px;
    padding: 13px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
  }
  .find-prompt select {
    min-width: 85px;
  }
  .find-prompt p {
    flex-basis: 100%;
    margin: 0;
  }
  .board-scroll {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    padding: 12px 0 4px;
  }
  .fretboard {
    min-width: max-content;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background: color-mix(in srgb, var(--surface-raised) 70%, var(--surface));
  }
  .fret-label-row,
  .string-row {
    display: grid;
    grid-template-columns: 62px auto;
    min-height: 48px;
  }
  .fret-label-row {
    min-height: 34px;
    background: var(--surface-raised);
    border-bottom: 1px solid var(--border);
  }
  .string-heading,
  .string-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-right: 1px solid var(--border);
    color: var(--muted);
    font-size: 9px;
  }
  .string-heading {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .string-label strong {
    color: var(--text);
    font-size: 11px;
  }
  .string-label small {
    color: var(--muted);
    font-size: 8px;
  }
  .fret-number {
    display: grid;
    min-width: 38px;
    place-items: center;
    color: var(--muted);
    font-size: 9px;
    border-right: 1px solid var(--border);
  }
  .fret-number.nut-label {
    color: var(--primary);
    font-size: 8px;
    font-weight: 800;
  }
  .fret-cells {
    display: grid;
    min-width: 0;
    background-image: linear-gradient(
      to bottom,
      transparent calc(50% - 1px),
      color-mix(in srgb, var(--muted) 42%, transparent) calc(50% - 1px),
      color-mix(in srgb, var(--muted) 42%, transparent) calc(50% + 1px),
      transparent calc(50% + 1px)
    );
  }
  .string-row + .string-row {
    border-top: 1px solid color-mix(in srgb, var(--border) 65%, transparent);
  }
  .fret-cell {
    position: relative;
    display: grid;
    min-width: 38px;
    min-height: 48px;
    place-items: center;
    border: 0;
    border-right: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }
  .fret-cell.nut {
    border-left: 4px solid var(--muted);
  }
  .is-left-handed .fret-cell.nut {
    border-left: 0;
    border-right: 4px solid var(--muted);
  }
  .fret-cell.marker::before {
    position: absolute;
    z-index: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--muted) 38%, transparent);
    content: '';
  }
  .fret-cell span {
    position: relative;
    z-index: 1;
    display: grid;
    min-width: 25px;
    min-height: 25px;
    place-items: center;
    border-radius: 50%;
    background: var(--surface-raised);
    font-size: 9px;
    font-weight: 750;
  }
  .fret-cell.selected span,
  .fret-cell.correct span {
    background: var(--primary);
    color: var(--primary-ink);
  }
  .fret-cell:focus-visible {
    z-index: 2;
    outline: 2px solid var(--focus);
    outline-offset: -3px;
  }
  .note-detail {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 17px;
    padding: 13px 15px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
  }
  .note-detail strong {
    display: block;
    margin-top: 4px;
    color: var(--primary);
    font: 500 24px Georgia, serif;
  }
  .note-detail p {
    margin: 0;
    color: var(--muted);
    font-size: 10px;
  }
  .feedback {
    margin: 13px 0 0;
    color: var(--text);
    font-size: 11px;
    line-height: 1.6;
  }
  .reference-panel {
    padding: 18px 21px;
  }
  .reference-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 13px;
    margin-top: 14px;
  }
  .reference-grid p {
    display: grid;
    gap: 5px;
    margin: 0;
  }
  .reference-grid strong {
    font-size: 10px;
  }
  .reference-grid span {
    color: var(--muted);
    font-size: 9px;
    line-height: 1.6;
  }
  footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 22px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
    font-size: 10px;
    color: var(--muted);
  }
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
  button:focus-visible,
  select:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 3px;
  }
  @media (max-width: 780px) {
    .reference-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 560px) {
    .fretboard-page {
      padding-top: 22px;
    }
    .setup-panel,
    .explorer-panel,
    .reference-panel {
      padding: 15px;
    }
    .setup-heading,
    .panel-heading {
      align-items: flex-start;
      flex-direction: column;
    }
    .controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .controls label {
      min-width: 0;
    }
    .controls select {
      min-width: 0;
      width: 100%;
    }
    .preference-save {
      align-items: flex-start;
      flex-direction: column;
    }
    .reference-grid {
      grid-template-columns: 1fr 1fr;
    }
    footer {
      flex-direction: column;
    }
  }
</style>
