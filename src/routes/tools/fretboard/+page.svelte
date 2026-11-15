<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    FLAT_NOTE_NAMES,
    SHARP_NOTE_NAMES,
    STANDARD_GUITAR_TUNING,
    findFretboardPositions,
    getDisplayFretColumn,
    getFretboardInlayFrets,
    getFretboardLayout,
    getNoteAtPosition,
    type FretboardNote,
    type GuitarHandedness,
    type NoteSpelling
  } from '../../../lib/domain/music/fretboard';
  import {
    getCagedShapePositions,
    getMajorScalePitchClasses,
    getTriadInversionPositions,
    getTriadPitchClasses
  } from '../../../lib/domain/music/harmony';
  import {
    loadActiveLearnerProfile,
    saveActiveLearnerPreferences
  } from '../../../lib/storage/indexeddb';
  import type { ProfilePreferences } from '../../../lib/domain/profile/preferences';
  import { playReferenceTone } from '../../../lib/audio/metronome';

  let handedness = $state<GuitarHandedness>('right');
  let spelling = $state<NoteSpelling>('sharp');
  type HarmonyLayer =
    | 'all'
    | 'c-major-scale'
    | 'c-major-triad'
    | 'c-major-first-inversion'
    | 'c-major-second-inversion'
    | 'caged';

  let maxFret = $state(12);
  let targetPitchClass = $state(0);
  let harmonyLayer = $state<HarmonyLayer>('all');
  let findMode = $state(false);
  let selectedPosition = $state<{ stringNumber: number; fret: number } | null>(null);
  let focusedPosition = $state({ stringNumber: 1, fret: 0 });
  let feedback = $state('');
  let saveStatus = $state('');
  let profilePreferences = $state<ProfilePreferences | null>(null);
  let isSaving = $state(false);
  let targetFound = $state(false);
  let foundCount = $state(0);
  let firstTryCount = $state(0);
  let attemptCount = $state(0);
  let attemptsForTarget = $state(0);
  let hintUsed = $state(false);
  let hintPosition = $state<{ stringNumber: number; fret: number } | null>(null);
  let revealedPositions = $state(false);
  let isPlayingNote = $state(false);
  let playbackMessage = $state('');

  let fretboardRows = $derived(
    getFretboardLayout(maxFret, STANDARD_GUITAR_TUNING, spelling)
  );
  const inlayFrets = $derived(getFretboardInlayFrets(maxFret));
  const fretWires = $derived(Array.from({ length: maxFret }, (_, index) => index + 1));
  const targetPositions = $derived(
    findFretboardPositions(targetPitchClass, maxFret, STANDARD_GUITAR_TUNING)
  );

  const cagedShapes = getCagedShapePositions(0);
  const cagedPositionKeys = new Set(
    cagedShapes.flatMap((shape) =>
      shape.notes.flatMap((note) =>
        note ? [`${note.stringNumber}:${note.fret}`] : []
      )
    )
  );
  const inversionPositionKeys = $derived.by(() => {
    const inversion =
      harmonyLayer === 'c-major-first-inversion'
        ? 'first'
        : harmonyLayer === 'c-major-second-inversion'
          ? 'second'
          : harmonyLayer === 'c-major-triad'
            ? 'root'
            : null;
    return new Set(
      inversion
        ? getTriadInversionPositions(0, inversion).map(
            (note) => `${note.stringNumber}:${note.fret}`
          )
        : []
    );
  });
  const harmonyPitchClasses = $derived.by(() => {
    switch (harmonyLayer) {
      case 'c-major-scale':
        return getMajorScalePitchClasses(0);
      case 'c-major-triad':
        return getTriadPitchClasses(0, 'major', 'root');
      case 'c-major-first-inversion':
        return getTriadPitchClasses(0, 'major', 'first');
      case 'c-major-second-inversion':
        return getTriadPitchClasses(0, 'major', 'second');
      default:
        return [];
    }
  });
  function isHarmonyHighlighted(note: FretboardNote): boolean {
    const positionKey = `${note.stringNumber}:${note.fret}`;
    if (harmonyLayer === 'caged') {
      return cagedPositionKeys.has(positionKey);
    }
    if (
      harmonyLayer === 'c-major-triad' ||
      harmonyLayer === 'c-major-first-inversion' ||
      harmonyLayer === 'c-major-second-inversion'
    ) {
      return inversionPositionKeys.has(positionKey);
    }
    return harmonyLayer !== 'all' && harmonyPitchClasses.includes(note.pitchClass);
  }

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

  function resetFindTarget() {
    selectedPosition = null;
    feedback = '';
    targetFound = false;
    attemptsForTarget = 0;
    hintUsed = false;
    hintPosition = null;
    revealedPositions = false;
  }

  function changeTargetNote(event: Event) {
    targetPitchClass = Number((event.currentTarget as HTMLSelectElement).value);
    resetFindTarget();
  }

  function nextTargetNote() {
    targetPitchClass = (targetPitchClass + 1) % SHARP_NOTE_NAMES.length;
    resetFindTarget();
  }

  function showHint() {
    const firstPosition = targetPositions[0];
    if (!firstPosition) return;
    hintUsed = true;
    hintPosition = { stringNumber: firstPosition.stringNumber, fret: firstPosition.fret };
    feedback = `Hint: look at string ${firstPosition.stringNumber}, fret ${firstPosition.fret}.`;
  }

  function revealPositions() {
    hintUsed = true;
    revealedPositions = true;
    const descriptions = targetPositions.slice(0, 8).map((position) =>
      `string ${position.stringNumber}, fret ${position.fret}`
    );
    feedback = `All visible ${targetNoteName} positions: ${descriptions.join('; ')}.`;
  }

  function changeMaxFret(event: Event) {
    maxFret = Number((event.currentTarget as HTMLSelectElement).value);
    if (focusedPosition.fret > maxFret) {
      focusedPosition = { stringNumber: 1, fret: 0 };
    }
    resetFindTarget();
  }

  function activateNote(note: FretboardNote) {
    if (findMode) {
      if (targetFound) {
        feedback = `You have already found ${targetNoteName}. Choose Next note to continue.`;
        return;
      }
      const isFirstTry = attemptsForTarget === 0 && !hintUsed;
      attemptCount += 1;
      attemptsForTarget += 1;
      if (note.pitchClass !== targetPitchClass) {
        selectedPosition = null;
        feedback = `Not quite. Find ${targetNoteName} on another position.`;
        return;
      }
      if (isFirstTry) firstTryCount += 1;
      foundCount += 1;
      targetFound = true;
      selectedPosition = { stringNumber: note.stringNumber, fret: note.fret };
      feedback = `Correct — ${targetNoteName} is at string ${note.stringNumber}, fret ${note.fret}. You have found ${foundCount} note targets.`;
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
    targetFound = false;
    attemptsForTarget = 0;
    hintUsed = false;
    hintPosition = null;
    revealedPositions = false;
    if (findMode) {
      foundCount = 0;
      firstTryCount = 0;
      attemptCount = 0;
    }
  }

  async function playSelectedNote() {
    if (!selectedNote || isPlayingNote) return;
    isPlayingNote = true;
    playbackMessage = '';
    try {
      await playReferenceTone(selectedNote.frequencyHz, 700);
      playbackMessage = `Played ${selectedNote.noteName}${selectedNote.octave}.`;
    } catch (error) {
      playbackMessage = error instanceof Error
        ? error.message
        : 'The note could not be played in this browser.';
    } finally {
      isPlayingNote = false;
    }
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

    <div class="harmony-control">
      <label for="harmony-layer">Harmony learning layer</label>
      <select id="harmony-layer" bind:value={harmonyLayer}>
        <option value="all">All fretboard notes</option>
        <option value="c-major-scale">C major scale</option>
        <option value="c-major-triad">C major triad · root position</option>
        <option value="c-major-first-inversion">C major triad · first inversion</option>
        <option value="c-major-second-inversion">C major triad · second inversion</option>
        <option value="caged">C major · CAGED shapes</option>
      </select>
      <p>
        {#if harmonyLayer === 'c-major-scale'}
          Highlighting the seven notes of C major across the same standard-tuning fretboard model.
        {:else if harmonyLayer === 'c-major-triad'}
          Highlighting one playable C-major triad voicing with C in the bass.
        {:else if harmonyLayer === 'c-major-first-inversion'}
          Highlighting a playable first-inversion voicing with E in the bass.
        {:else if harmonyLayer === 'c-major-second-inversion'}
          Highlighting a playable second-inversion voicing with G in the bass.
        {:else if harmonyLayer === 'caged'}
          Highlighting the five CAGED C-major voicings. Frets are shown low E to high e; x means muted.
        {:else}
          Choose a scale, triad or inversion to connect chord theory to note positions.
        {/if}
      </p>
    </div>
    {#if harmonyLayer === 'caged'}
      <div class="caged-shapes" aria-label="CAGED C-major shape positions">
        {#each cagedShapes as shape (shape.shape)}
          <div class="caged-shape">
            <strong>{shape.shape}-form</strong>
            <span>{shape.fretLabel}</span>
            <small>Low E → high e</small>
          </div>
        {/each}
      </div>
    {/if}

    {#if findMode}
      <div class="find-panel">
        <label for="target-note">Find this note</label>
        <select id="target-note" value={targetPitchClass} onchange={changeTargetNote}>
          {#each SHARP_NOTE_NAMES as noteName, index (index)}
            <option value={index}>{spelling === 'flat' ? FLAT_NOTE_NAMES[index] : noteName}</option>
          {/each}
        </select>
        <div class="find-progress" role="status" aria-live="polite" aria-atomic="true" aria-label="Find a note progress">
          <strong>{foundCount} found</strong>
          <span>{firstTryCount} first-try · {attemptCount} selections</span>
        </div>
        <div class="find-actions">
          <button type="button" class="secondary-button" onclick={showHint} disabled={targetFound}>Hint</button>
          <button type="button" class="secondary-button" onclick={revealPositions} disabled={targetFound}>Reveal positions</button>
          <button type="button" class="primary-button" onclick={nextTargetNote}>Next note</button>
        </div>
        <p>Find one matching position. Hints and reveals help you learn the neck, but do not count as a first-try answer.</p>
      </div>
    {:else}
      <p class="diagram-hint" id="keyboard-help">
        Select any position to see its note and pitch. Use the arrow keys to move
        between neighbouring frets and strings.
      </p>
    {/if}

    <div class="fretboard-scroll" aria-label="Scrollable fretboard diagram">
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

        <div class="fret-rows" data-frets={maxFret}>
          <svg
            class="fretboard-structure"
            viewBox={`0 0 ${maxFret + 1} 6`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {#each Array.from({ length: 6 }, (_, row) => row) as row (row)}
              <line class="board-string" x1="0" x2={maxFret + 1} y1={row + 0.5} y2={row + 0.5} />
            {/each}
            {#each fretWires as fret (fret)}
              <line
                class:nut={fret === (handedness === 'left' ? maxFret : 1)}
                class="board-fret-wire"
                x1={fret}
                x2={fret}
                y1="0"
                y2="6"
              />
            {/each}
            {#each inlayFrets as fret (fret)}
              {#if fret === 12 || fret === 24}
                <circle class="board-inlay" cx={getDisplayFretColumn(fret, maxFret, handedness) - 0.5} cy="1.6" r="0.12" />
                <circle class="board-inlay" cx={getDisplayFretColumn(fret, maxFret, handedness) - 0.5} cy="4.4" r="0.12" />
              {:else}
                <circle class="board-inlay" cx={getDisplayFretColumn(fret, maxFret, handedness) - 0.5} cy="3" r="0.12" />
              {/if}
            {/each}
          </svg>
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
                class:is-harmony-note={isHarmonyHighlighted(note)}
                class:is-hint={findMode && hintPosition?.stringNumber === note.stringNumber && hintPosition?.fret === note.fret}
                class:is-revealed={findMode && revealedPositions && note.pitchClass === targetPitchClass}
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
                {#if !findMode || (revealedPositions && note.pitchClass === targetPitchClass) || (selectedPosition?.stringNumber === note.stringNumber && selectedPosition?.fret === note.fret)}
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
    </div>

    <div class="legend" aria-label="Fretboard legend">
      <span><i class="open-marker"></i> Open string</span>
      <span><i class="target-marker"></i> Target note</span>
      <span><i class="inlay-marker"></i> Standard fret position inlay</span>
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
          <button type="button" class="secondary-button" onclick={playSelectedNote} disabled={isPlayingNote}>
            {isPlayingNote ? 'Playing note…' : `Hear ${selectedNote.noteName}${selectedNote.octave}`}
          </button>
        </div>
      </div>
      {#if playbackMessage}
        <p class="feedback" role="status">{playbackMessage}</p>
      {/if}
    {/if}

    {#if feedback}
      <p class="feedback" role="status">{feedback}</p>
    {/if}
  </section>

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
    grid-template-columns: minmax(150px, 210px) minmax(0, 1fr);
    gap: 9px 14px;
    align-items: center;
    margin: 0 0 16px;
    padding: 13px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
  }
  .find-panel label,
  .find-panel select { grid-column: 1; }
  .find-progress {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px 14px;
    grid-column: 2;
    color: var(--muted);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
  }
  .find-progress strong { color: var(--text); font-size: 15px; }
  .find-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    grid-column: 1 / -1;
  }
  .find-actions button { min-height: 44px; padding-inline: 14px; }
  .find-panel p {
    grid-column: 1 / -1;
    grid-row: auto;
    margin: 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.6;
  }
  .fretboard-structure {
    position: absolute;
    top: 0;
    left: 34px;
    z-index: 0;
    width: calc(100% - 34px);
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }
  .fret-rows {
    position: relative;
    display: grid;
    grid-auto-rows: minmax(48px, auto);
    gap: 0;
    min-width: 100%;
  }
  .fret-rows[data-frets='24'] { min-width: 700px; }
  .board-string { stroke: var(--border-strong); stroke-width: 0.035; }
  .board-fret-wire { stroke: var(--border); stroke-width: 0.035; }
  .board-fret-wire.nut { stroke: var(--text); stroke-width: 0.12; }
  .board-inlay { fill: color-mix(in srgb, var(--muted) 24%, transparent); }
  .fretboard { gap: 3px; }
  .fret-row { position: relative; z-index: 1; min-height: 48px; gap: 0; }
  .fret-cell {
    min-width: 24px;
    min-height: 44px;
    border: 0;
    border-radius: 50%;
    background: transparent;
  }
  .fret-cell.is-hint {
    outline: 3px solid var(--focus);
    outline-offset: -3px;
    background: color-mix(in srgb, var(--secondary) 28%, var(--surface));
  }
  .fret-cell.is-revealed {
    background: color-mix(in srgb, var(--secondary) 14%, var(--surface));
    font-weight: 850;
  }
  .inlay-marker {
    border-color: var(--muted) !important;
    border-radius: 50% !important;
    background: color-mix(in srgb, var(--muted) 24%, var(--surface-raised));
  }
  .frequency .secondary-button { min-height: 44px; margin-top: 7px; }
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
    min-width: 700px;
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
    min-width: 24px;
    min-height: 40px;
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
  .harmony-control {
    display: grid;
    grid-template-columns: minmax(190px, 250px) minmax(0, 1fr);
    gap: 7px 14px;
    align-items: center;
    margin: 0 0 16px;
    padding: 13px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-raised);
  }
  .harmony-control label {
    grid-column: 1;
    color: var(--muted);
    font-size: 10px;
    font-weight: 750;
  }
  .harmony-control select {
    grid-column: 1;
  }
  .harmony-control p {
    grid-column: 2;
    grid-row: 1 / span 2;
    margin: 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.6;
  }
  .caged-shapes {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    margin: -5px 0 16px;
  }
  .caged-shape {
    display: grid;
    gap: 5px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface);
  }
  .caged-shape strong {
    font-size: 10px;
  }
  .caged-shape span {
    font-variant-numeric: tabular-nums;
    font-size: 11px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }
  .caged-shape small {
    color: var(--muted);
    font-size: 8px;
  }
  .fret-cell.is-harmony-note {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 16%, var(--surface));
    font-weight: 800;
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
    .harmony-control {
      grid-template-columns: 1fr;
    }
    .harmony-control p {
      grid-column: 1;
      grid-row: auto;
    }
    .caged-shapes {
      grid-template-columns: repeat(2, minmax(0, 1fr));
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
    .find-progress,
    .find-actions,
    .find-panel p {
      grid-column: 1;
      grid-row: auto;
    }
    .find-progress {
      justify-content: flex-start;
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
