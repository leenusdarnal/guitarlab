<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Practice tools — GuitarLab</title>
  <meta
    name="description"
    content="Explore the guitar fretboard and find the notes that support your practice."
  />
</svelte:head>

<main class="tools-page">
  <a class="back-link" href={resolve('/')}>← Dashboard</a>
  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH</div>
    <h1>Tools for your <em>practice.</em></h1>
    <p>
      Clear, focused tools that help connect the fretboard, harmony and rhythm to
      the music you are learning. Everything here works without microphone access.
    </p>
  </header>

  <section class="tool-list" aria-label="GuitarLab tools">
    <article class="tool-row available">
      <div class="tool-symbol" aria-hidden="true">♬</div>
      <div class="tool-copy">
        <div class="tool-meta"><span class="available-label">Available now</span><span>Notes · Tuning · Fretboard</span></div>
        <h2>Fretboard explorer</h2>
        <p>
          See note names across all six strings in standard tuning. Switch between
          sharp and flat spelling, mirror the diagram, and practise finding a note.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/fretboard')}>Open explorer <span aria-hidden="true">→</span></a>
    </article>

    <article class="tool-row available">
      <div class="tool-symbol" aria-hidden="true">◇</div>
      <div class="tool-copy">
        <div class="tool-meta"><span class="available-label">Available now</span><span>Voicings · Clean changes</span></div>
        <h2>Chord library</h2>
        <p>
          Explore five open chord shapes, identify muted and fretted strings, and
          record clean changes separately from elapsed practice time.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/chords')}>Open chord library <span aria-hidden="true">→</span></a>
    </article>

    <article class="tool-row available">
      <div class="tool-symbol" aria-hidden="true">♫</div>
      <div class="tool-copy">
        <div class="tool-meta"><span class="available-label">Available now</span><span>Listening · Pulse · Pitch</span></div>
        <h2>Ear training</h2>
        <p>
          Practise steady pulse, high and low pitch, and melodic contour with
          short audio examples generated locally in your browser.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/ear-training')}>Open ear training <span aria-hidden="true">→</span></a>
    </article>

    <article class="tool-row available">
      <div class="tool-symbol" aria-hidden="true">◷</div>
      <div class="tool-copy">
        <div class="tool-meta"><span class="available-label">Available now</span><span>Tempo · Pulse · Reference tones</span></div>
        <h2>Metronome</h2>
        <p>
          Practise with a Web Audio metronome, adjustable tempo and meter, and a
          separately triggered A4 reference tone.
        </p>
      </div>
      <a class="open-tool" href={resolve('/tools/metronome')}>Open metronome <span aria-hidden="true">→</span></a>
    </article>
  </section>

  <p class="privacy-note">
    GuitarLab's music tools calculate and play locally in your browser. They do not
    upload learner data or request microphone access.
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
    font-size: 12px;
  }
  .page-heading {
    max-width: 700px;
    padding-bottom: 30px;
  }
  .eyebrow {
    color: var(--muted);
    font-size: 10px;
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
    font-size: 12px;
    line-height: 1.75;
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
    font-size: 9px;
    letter-spacing: 0.45px;
    text-transform: uppercase;
  }
  .available-label {
    color: var(--success);
    font-weight: 800;
  }
  .tool-copy h2 {
    margin: 7px 0 4px;
    font: 500 22px / 1.2 Georgia, serif;
  }
  .tool-copy p {
    max-width: 600px;
    margin: 0;
    font-size: 11px;
  }
  .open-tool,
  .tool-status {
    white-space: nowrap;
    font-size: 11px;
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
