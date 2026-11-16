<script lang="ts">
  import { resolve } from '$app/paths';
  import Icon from '../../lib/components/Icon.svelte';
</script>

<svelte:head>
  <title>Practice tools — GuitarLab</title>
  <meta
    name="description"
    content="Choose a guitar practice tool by what you want to explore, hear, recognise or practise."
  />
</svelte:head>

<main class="tools-page">
  <a class="back-link" href={resolve('/')}>← Today</a>
  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH</div>
    <h1>Tools for your <em>practice.</em></h1>
    <p>
      Choose a tool by the task you want to work on. The tuner and note recognition
      use your microphone only after you press Start; the other tools do not request it.
    </p>
  </header>

  <section class="tool-group" aria-labelledby="explore-title">
    <header class="tool-group-heading">
      <h2 id="explore-title">Explore notes and chords</h2>
      <p>See where notes sit, explore chord shapes and connect them to musical harmony.</p>
    </header>
    <div class="tool-list">
    <article class="tool-row">
      <div class="tool-symbol" aria-hidden="true"><Icon name="fretboard" /></div>
      <div class="tool-copy">
        <div class="tool-meta"><span>Notes · Tuning · Fretboard</span></div>
        <h2>Fretboard explorer</h2>
        <p>
          See note names across all six strings in standard tuning. Switch between
          sharp and flat spelling, mirror the diagram, and practise finding a note.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/fretboard')}>Open fretboard explorer <span aria-hidden="true">→</span></a>
    </article>
    <article class="tool-row">
      <div class="tool-symbol" aria-hidden="true"><Icon name="chord" /></div>
      <div class="tool-copy">
        <div class="tool-meta"><span>Voicings · Clean changes</span></div>
        <h2>Chord library</h2>
        <p>
          Explore five open chord shapes, identify muted and fretted strings, and
          record clean changes separately from elapsed practice time.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/chords')}>Open chord library <span aria-hidden="true">→</span></a>
    </article>
    <article class="tool-row">
      <div class="tool-symbol" aria-hidden="true"><Icon name="theory" /></div>
      <div class="tool-copy">
        <div class="tool-meta"><span>Harmony · Chords · Musical function</span></div>
        <h2>Theory recall</h2>
        <p>
          Connect chord names, locally synthesized triad sounds and their role
          in a key through short name, sound and use prompts.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/theory-recall')}>Open theory recall <span aria-hidden="true">→</span></a>
    </article>
    </div>
  </section>

  <section class="tool-group" aria-labelledby="listen-title">
    <header class="tool-group-heading">
      <h2 id="listen-title">Listen and recognise</h2>
      <p>Train your ear and practise recognising the notes you play.</p>
    </header>
    <div class="tool-list">
    <article class="tool-row">
      <div class="tool-symbol" aria-hidden="true"><Icon name="ear" /></div>
      <div class="tool-copy">
        <div class="tool-meta"><span>Listening · Pulse · Pitch · Intervals</span></div>
        <h2>Ear training</h2>
        <p>
          Practise steady pulse, high and low pitch, melodic contour and intervals with
          short audio examples generated locally in your browser.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/ear-training')}>Open ear training <span aria-hidden="true">→</span></a>
    </article>
    <article class="tool-row">
      <div class="tool-symbol" aria-hidden="true"><Icon name="microphone" /></div>
      <div class="tool-copy">
        <div class="tool-meta"><span>Microphone · Open strings · Pitch</span></div>
        <h2>Note recognition</h2>
        <p>
          Play each of the six standard open strings and get immediate, confidence-aware
          feedback from local pitch recognition. Microphone access starts only after Start.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/note-recognition')}>Open note recognition <span aria-hidden="true">→</span></a>
    </article>
    </div>
  </section>

  <section class="tool-group" aria-labelledby="timing-title">
    <header class="tool-group-heading">
      <h2 id="timing-title">Keep time and tune</h2>
      <p>Build a steady pulse or check the pitch of each guitar string.</p>
    </header>
    <div class="tool-list">
    <article class="tool-row">
      <div class="tool-symbol" aria-hidden="true"><Icon name="metronome" /></div>
      <div class="tool-copy">
        <div class="tool-meta"><span>Tempo · Pulse · Reference tones</span></div>
        <h2>Metronome</h2>
        <p>
          Practise with a Web Audio metronome, adjustable tempo and meter, and a
          separately triggered A4 reference tone.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/metronome')}>Open metronome <span aria-hidden="true">→</span></a>
    </article>
    <article class="tool-row">
      <div class="tool-symbol" aria-hidden="true"><Icon name="tuner" /></div>
      <div class="tool-copy">
        <div class="tool-meta"><span>Chromatic · Microphone · Pitch</span></div>
        <h2>Chromatic tuner</h2>
        <p>
          Tune one string at a time with confidence-aware pitch detection and a clear
          flat-to-sharp meter. Microphone access starts only when you choose Start.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/tuner')}>Open chromatic tuner <span aria-hidden="true">→</span></a>
    </article>
    </div>
  </section>

  <section class="tool-group" aria-labelledby="organise-title">
    <header class="tool-group-heading">
      <h2 id="organise-title">Organise your music</h2>
      <p>Keep song notes, section bookmarks and practice targets together.</p>
    </header>
    <div class="tool-list">
    <article class="tool-row">
      <div class="tool-symbol" aria-hidden="true"><Icon name="song" /></div>
      <div class="tool-copy">
        <div class="tool-meta"><span>Notes · Sections · Practice targets</span></div>
        <h2>Song projects</h2>
        <p>
          Organise your own song notes, section bookmarks and practice targets
          locally, with learner backup and restore support.
        </p>
      </div>
      <a class="open-tool" href={resolve('/repertoire')}>Open song projects <span aria-hidden="true">→</span></a>
    </article>
    </div>
  </section>

  <p class="privacy-note">
    Chromatic tuner and Note recognition are the only tools that request microphone access,
    and each waits for your explicit Start action. Audio analysis stays in this browser;
    raw audio is not uploaded or saved.
  </p>
</main>

<style>
  .tools-page {
    max-width: 1040px;
    margin: 0 auto;
    padding: 34px clamp(18px, 4vw, 52px) 70px;
    color: var(--text);
  }
  .back-link {
    display: inline-block;
    margin-bottom: 30px;
    color: var(--muted);
    font-size: var(--font-size-supporting);
  }
  .page-heading {
    max-width: 700px;
    padding-bottom: 30px;
  }
  .eyebrow {
    color: var(--muted);
    font-size: var(--font-size-metadata);
    font-weight: 750;
    letter-spacing: 1.4px;
  }
  h1 {
    margin: 12px 0;
    font: 500 clamp(38px, 6vw, 58px) / 1.08 Georgia, serif;
    letter-spacing: -1.8px;
  }
  h1 em {
    color: var(--primary);
  }
  .page-heading p,
  .tool-copy p,
  .privacy-note {
    color: var(--muted);
    font-size: var(--font-size-supporting);
    line-height: var(--line-height-body);
  }
  .tool-group {
    margin-top: 26px;
  }
  .tool-group-heading {
    display: grid;
    gap: 5px;
    margin-bottom: 10px;
  }
  .tool-group-heading h2 {
    margin: 0;
    font: 500 var(--font-size-section-title) / var(--line-height-heading) Georgia, serif;
  }
  .tool-group-heading p {
    max-width: 620px;
    margin: 0;
    color: var(--muted);
    font-size: var(--font-size-supporting);
    line-height: var(--line-height-body);
  }
  .tool-list {
    display: grid;
    border-top: 1px solid var(--border);
  }
  .tool-row {
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr) auto;
    align-items: center;
    gap: 18px;
    padding: 22px 4px;
    border-bottom: 1px solid var(--border);
  }
  .tool-symbol {
    display: grid;
    width: 48px;
    height: 48px;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    color: var(--primary);
    font-size: 22px;
  }
  .tool-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    color: var(--muted);
    font-size: var(--font-size-metadata);
    letter-spacing: 0.45px;
    text-transform: uppercase;
  }
  .tool-copy h2 {
    margin: 7px 0 4px;
    font: 500 var(--font-size-panel-title) / var(--line-height-heading) Georgia, serif;
  }
  .tool-copy p {
    max-width: 600px;
    margin: 0;
    font-size: var(--font-size-body);
  }
  .open-tool,
  .tool-status {
    white-space: nowrap;
    font-size: var(--font-size-supporting);
    font-weight: 750;
  }
  .open-tool {
    color: var(--primary);
  }
  .open-tool span {
    padding-left: 7px;
  }
  .tool-status {
    color: var(--muted);
  }
  .privacy-note {
    margin-top: 22px;
    font-size: 10px;
  }
  a:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 3px;
  }
  @media (max-width: 680px) {
    .tools-page {
      padding-top: 24px;
    }
    .tool-group-heading h2 {
      font-size: 21px;
    }
    .tool-row {
      grid-template-columns: 42px minmax(0, 1fr);
      gap: 12px;
    }
    .tool-symbol {
      width: 40px;
      height: 40px;
      border-radius: 12px;
    }
    .open-tool,
    .tool-status {
      grid-column: 2;
      justify-self: start;
    }
  }
</style>
