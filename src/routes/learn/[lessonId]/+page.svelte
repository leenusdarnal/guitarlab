<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';
  import { completeActiveLessonProgress, loadActiveLessonProgress, saveActiveLessonProgress } from '../../../lib/storage/indexeddb';
  import type { LessonProgressRecord } from '../../../lib/repositories/contracts';
  import StandardTuningAssessment from '../../../lib/components/assessments/StandardTuningAssessment.svelte';
  import { standardTuningAssessment } from '../../../lib/domain/learning/standard-tuning-assessment';

  let { data }: { data: PageData } = $props();
  const lesson = $derived(data.detail.lesson);
  const curriculumReleaseId = 'curriculum-v1';
  let progress = $state<LessonProgressRecord | null>(null);
  let progressLoading = $state(true);
  let progressSaving = $state(false);
  let progressRequestId = 0;
  let progressSaveQueue: Promise<void> = Promise.resolve();
  let progressSaveRequestCounts = new SvelteMap<number, number>();
  let progressError = $state('');
  let progressRetryAction = $state<'load' | 'save' | 'complete' | null>(null);
  let requestedLastBlockId = $state<string | null>(null);
  let completedBlockIds = $state<string[]>([]);
  let checkpointOutcome = $state<'achieved' | 'needs_practice' | null>(null);
  let checkpointNote = $state('');
  const completedBlockCount = $derived(completedBlockIds.length);
  const progressPercent = $derived(lesson.lessonBlocks.length === 0 ? 0 : Math.round((completedBlockCount / lesson.lessonBlocks.length) * 100));

  function lines(value: string | string[] | null | undefined): string[] {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }

  $effect(() => {
    const lessonId = lesson.id;
    const blockIds = lesson.lessonBlocks.map((block) => block.id);
    const requestId = ++progressRequestId;
    let active = true;

    progress = null;
    progressLoading = true;
    progressSaving = false;
    progressError = '';
    progressRetryAction = null;
    requestedLastBlockId = null;
    completedBlockIds = [];
    checkpointOutcome = null;
    checkpointNote = '';

    void loadActiveLessonProgress(lessonId, blockIds, curriculumReleaseId)
      .then((record) => {
        if (!active || requestId !== progressRequestId) return;
        progress = record;
        requestedLastBlockId = record.lastBlockId ?? null;
        progressRetryAction = null;
        completedBlockIds = record.completedBlockIds ?? [];
        checkpointOutcome = record.checkpointOutcome ?? null;
        checkpointNote = record.checkpointNote ?? '';
      })
      .catch((error: unknown) => {
        if (active && requestId === progressRequestId) {
          progressError = error instanceof Error
            ? error.message
            : 'Local lesson progress could not be loaded.';
          progressRetryAction = 'load';
        }
      })
      .finally(() => {
        if (active && requestId === progressRequestId) progressLoading = false;
      });

    return () => {
      active = false;
    };
  });

  async function retryProgressLoad() {
    const lessonId = lesson.id;
    const blockIds = lesson.lessonBlocks.map((block) => block.id);
    const requestId = ++progressRequestId;
    progressLoading = true;
    progressError = '';
    progressRetryAction = null;
    try {
      const record = await loadActiveLessonProgress(lessonId, blockIds, curriculumReleaseId);
      if (requestId !== progressRequestId) return;
      progress = record;
      requestedLastBlockId = record.lastBlockId ?? null;
      completedBlockIds = record.completedBlockIds ?? [];
      checkpointOutcome = record.checkpointOutcome ?? null;
      checkpointNote = record.checkpointNote ?? '';
    } catch (error) {
      if (requestId === progressRequestId) {
        progressError = error instanceof Error ? error.message : 'Local lesson progress could not be loaded.';
        progressRetryAction = 'load';
      }
    } finally {
      if (requestId === progressRequestId) progressLoading = false;
    }
  }

  async function retryProgressActionNow() {
    if (progressRetryAction === 'load') {
      await retryProgressLoad();
    } else if (progressRetryAction === 'complete') {
      await markLessonComplete();
    } else if (progressRetryAction === 'save') {
      await persistProgress({
        lastBlockId: requestedLastBlockId,
        completedBlockIds,
        checkpointOutcome,
        checkpointNote
      });
    }
  }

  async function persistProgress(overrides: Partial<{
    lastBlockId: string | null;
    completedBlockIds: string[];
    checkpointOutcome: 'achieved' | 'needs_practice' | null;
    checkpointNote: string | null;
  }> = {}) {
    const currentProgress = progress;
    if (!currentProgress || currentProgress.status === 'completed') return;

    const lessonId = lesson.id;
    const blockIds = lesson.lessonBlocks.map((block) => block.id);
    const requestId = progressRequestId;
    const snapshot = {
      lastBlockId:
        overrides.lastBlockId !== undefined
          ? overrides.lastBlockId
          : requestedLastBlockId,
      completedBlockIds: overrides.completedBlockIds ?? completedBlockIds,
      checkpointOutcome:
        overrides.checkpointOutcome !== undefined
          ? overrides.checkpointOutcome
          : checkpointOutcome,
      checkpointNote:
        overrides.checkpointNote !== undefined
          ? overrides.checkpointNote
          : checkpointNote
    };

    progressSaveRequestCounts.set(
      requestId,
      (progressSaveRequestCounts.get(requestId) ?? 0) + 1
    );
    progressSaving = true;
    progressError = '';

    const write = async () => {
      if (requestId !== progressRequestId) return;
      const latestProgress = progress;
      if (!latestProgress || latestProgress.status === 'completed') return;
      try {
        const saved = await saveActiveLessonProgress(
          lessonId,
          { expectedRevision: latestProgress.revision ?? 0, ...snapshot },
          blockIds,
          curriculumReleaseId
        );
        if (requestId !== progressRequestId) return;
        progress = saved;
        requestedLastBlockId = saved.lastBlockId ?? null;
        progressError = '';
        progressRetryAction = null;
      } catch (error) {
        if (requestId === progressRequestId) {
          progressError = error instanceof Error
            ? error.message
            : 'Your lesson progress could not be saved. Please try again.';
          progressRetryAction = 'save';
        }
      }
    };

    const operation = progressSaveQueue.then(write, write);
    progressSaveQueue = operation.catch(() => undefined);
    try {
      await operation;
    } finally {
      const pending = Math.max(
        0,
        (progressSaveRequestCounts.get(requestId) ?? 1) - 1
      );
      if (pending === 0) progressSaveRequestCounts.delete(requestId);
      else progressSaveRequestCounts.set(requestId, pending);
      if (requestId === progressRequestId) progressSaving = pending > 0;
    }
  }

  async function toggleBlock(blockId: string) {
    if (!progress || progress.status === 'completed') return;
    const next = completedBlockIds.includes(blockId) ? completedBlockIds.filter((id) => id !== blockId) : [...completedBlockIds, blockId];
    const lastBlockId = next.includes(blockId) ? blockId : (progress.lastBlockId === blockId ? next[next.length - 1] ?? null : progress.lastBlockId);
    completedBlockIds = next;
    requestedLastBlockId = lastBlockId;
    await persistProgress({ lastBlockId, completedBlockIds: next });
  }

  async function chooseCheckpoint(outcome: 'achieved' | 'needs_practice') {
    if (!progress || progress.status === 'completed') return;
    checkpointOutcome = outcome;
    await persistProgress({ checkpointOutcome: outcome });
  }

  async function saveCheckpointNote() {
    if (!progress || progress.status === 'completed') return;
    await persistProgress({ checkpointNote });
  }

  function continueFromSavedSection() {
    if (!progress?.lastBlockId) return;
    document.getElementById(`lesson-block-${progress.lastBlockId}`)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  async function markLessonComplete() {
    if (!progress || progress.status === 'completed' || checkpointOutcome !== 'achieved' || progressSaving) return;
    progressSaving = true;
    progressError = '';
    try {
      progress = await completeActiveLessonProgress(lesson.id, curriculumReleaseId);
      progressError = '';
      progressRetryAction = null;
    } catch (error) {
      progressError = error instanceof Error ? error.message : 'The lesson could not be marked complete. Please try again.';
      progressRetryAction = 'complete';
    } finally { progressSaving = false; }
  }

</script>

<svelte:head>
  <title>{lesson.title} — GuitarLab</title>
  <meta name="description" content={lesson.focus} />
</svelte:head>

<main class="lesson-page">
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <a href={resolve('/')}>Dashboard</a><span aria-hidden="true">/</span>
    <a href={resolve('/learn')}>Curriculum</a><span aria-hidden="true">/</span>
    <a href={resolve('/learn')}>{data.detail.route.title}</a>
    <span aria-hidden="true">/</span><span aria-current="page">{lesson.title}</span>
  </nav>

  <header class="lesson-header">
    <div class="eyebrow">{data.detail.route.tier} · WEEK {lesson.week} · {data.detail.phase.title}</div>
    <h1>{lesson.title}</h1>
    <p class="focus">{lesson.focus}</p>
    <div class="lesson-meta">
      <span>{lesson.estimatedMinutes} min lesson guide</span>
      {#if lesson.startingTempoBpm}<span>{lesson.startingTempoBpm} BPM starting reference</span>{/if}
    </div>
    <div class="checkpoint">
      <span class="eyebrow">LESSON CHECKPOINT</span>
      <p>{lesson.checkpoint}</p>
      <small>Use this as an observable learning target, not a deadline or automatic mastery score.</small>
    </div>
  </header>


  <nav class="lesson-outline" aria-label="Lesson sections">
    <a href="#lesson-section-overview">Overview</a>
    <a href="#lesson-section-key-idea">Key idea</a>
    <a href="#lesson-section-demonstration">Demonstration</a>
    <a href="#lesson-section-walkthrough">Walkthrough</a>
    <a href="#lesson-section-exercises">Exercises</a>
    <a href="#lesson-section-music">Make music</a>
    <a href="#lesson-section-recall">Review</a>
    <a href="#lesson-progress">My progress</a>
  </nav>



  {#if lesson.id === standardTuningAssessment.lessonId}
    <StandardTuningAssessment />
  {/if}

  <div class="lesson-layout">
    <article class="lesson-content">
      <section class="content-section" id="lesson-section-overview">
        <div class="kicker">01 · LEARN</div>
        <h2>What you will learn</h2>
        <ul>{#each lesson.learningObjectives as objective (objective)}<li>{objective}</li>{/each}</ul>
      </section>

      <section class="content-section" id="lesson-section-prerequisites">
        <div class="kicker">BEFORE YOU BEGIN</div>
        <h2>Prerequisites and refreshers</h2>
        {#if data.detail.prerequisiteReferences.length > 0}
          <ul>
            {#each data.detail.prerequisiteReferences as prerequisite (prerequisite.id)}
              <li>{#if prerequisite.available}<a href={resolve('/learn/[lessonId]', { lessonId: prerequisite.id })}>{prerequisite.title}</a>{:else}<span>Not available in this curriculum version</span>{/if}</li>
            {/each}
          </ul>
        {:else}
          <p>No hard prerequisites are declared for this lesson. You can begin here without marking any earlier lesson complete.</p>
        {/if}
        {#if lesson.priorTopicsToRefresh.length > 0}
          <h3>Optional topics to refresh</h3>
          <ul>{#each lesson.priorTopicsToRefresh as topic (topic)}<li>{topic}</li>{/each}</ul>
        {/if}
      </section>

      <section class="content-section" id="lesson-section-key-idea">
        <div class="kicker">02 · UNDERSTAND</div>
        <h2>The key idea</h2>
        <p>{lesson.explanation.keyIdea}</p>
        <p>{lesson.explanation.plainLanguage}</p>
        <div class="worked-example"><span class="eyebrow">WORKED EXAMPLE</span><p>{lesson.explanation.workedExample}</p></div>
      </section>

      <section class="content-section" id="lesson-section-demonstration">
        <div class="kicker">03 · SEE / HEAR</div>
        <h2>Guided demonstration</h2>
        <p>{lesson.demonstrationOrReference.referenceSuggestion}</p>
        <ol>{#each lesson.demonstrationOrReference.steps as step, stepIndex (stepIndex)}<li>{step}</li>{/each}</ol>
      </section>

      <section class="content-section" id="lesson-section-walkthrough">
        <div class="kicker">04 · FOLLOW THE LESSON</div>
        <h2>Lesson walkthrough</h2>
        <div class="lesson-blocks">
          {#each lesson.lessonBlocks as block, index (block.id)}
            <article class="lesson-block" id={`lesson-block-${block.id}`}>
              <div class="block-number">{String(index + 1).padStart(2, '0')}</div>
              <div>
                <div class="block-type">{block.type.replaceAll('-', ' ')}</div>
                <h3>{block.title}</h3>
                {#if Array.isArray(block.content)}
                  <ul>{#each block.content as item, itemIndex (itemIndex)}<li>{item}</li>{/each}</ul>
                {:else}<p>{block.content}</p>{/if}
                <button class="block-complete" type="button" aria-pressed={completedBlockIds.includes(block.id)} onclick={() => toggleBlock(block.id)} disabled={progress?.status === 'completed' || progressLoading}>
                  {completedBlockIds.includes(block.id) ? 'Section completed' : 'Mark section complete'}
                </button>
              </div>
            </article>
          {/each}
        </div>
      </section>

      <section class="content-section" id="lesson-section-exercises">
        <div class="kicker">05 · PRACTISE</div>
        <h2>Focused exercises</h2>
        <aside class="lesson-adaptation" aria-label="A manageable alternative for this lesson">
          <strong>Need a smaller starting point?</strong>
          <p>{lesson.accessibleAlternative}</p>
        </aside>
        <nav class="lesson-tool-links" aria-label="Tools for this lesson">
          <!-- eslint-disable svelte/no-navigation-without-resolve -->
          <a
            href={
              resolve('/tools/metronome') +
              (lesson.startingTempoBpm ? '?bpm=' + lesson.startingTempoBpm : '')
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            Open metronome{#if lesson.startingTempoBpm}{' ' + 'at ' + lesson.startingTempoBpm + ' BPM'}{/if}
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
          <a href={resolve('/tools/tuner')} target="_blank" rel="noopener noreferrer">Open tuner</a>
        </nav>
        <div class="exercise-list">
          {#each lesson.exercises as exercise, exerciseIndex (exercise.title ?? `${exercise.type}-${exerciseIndex}`)}
            <article class="exercise">
              <div class="exercise-meta"><span>{exercise.type.replaceAll('-', ' ')}</span><span>{exercise.durationMinutes} min guide</span></div>
              <h3>{exercise.title ?? exercise.type}</h3>
              <ol>{#each exercise.instructions as instruction, instructionIndex (instructionIndex)}<li>{instruction}</li>{/each}</ol>
              <div class="success-target"><strong>Success looks like</strong><p>{exercise.successCriterion}</p></div>
            </article>
          {/each}
        </div>
      </section>

      <section class="content-section" id="lesson-section-music">
        <div class="kicker">06 · MAKE MUSIC</div>
        <h2>Musical application</h2>
        <p>{lesson.musicalApplication.prompt}</p>
        <ol>{#each lesson.musicalApplication.instructions as instruction, instructionIndex (instructionIndex)}<li>{instruction}</li>{/each}</ol>
        {#if lesson.workedExamples.length > 0}
          <h3>Examples and references</h3>
          <div class="references">
            {#each lesson.workedExamples as example (example.label)}
              <article><span>{example.kind.replaceAll('-', ' ')}</span><h4>{example.label}</h4><p>{example.content}</p></article>
            {/each}
          </div>
        {/if}
      </section>

      <section class="content-section" id="lesson-section-success">
        <div class="kicker">07 · CHECK YOURSELF</div>
        <h2>Success criteria</h2>
        <ul class="criteria">
          {#each lesson.successCriteria as criterion (criterion.dimension)}
            <li><strong>{criterion.dimension.replaceAll('-', ' ')}</strong><p>{criterion.criterion}</p></li>
          {/each}
        </ul>
      </section>

      <section class="content-section" id="lesson-section-coaching">
        <div class="kicker">COACHING NOTES</div>
        <h2>Common mistakes and corrections</h2>
        <div class="mistakes">
          {#each lesson.commonMistakesAndCorrections as item, itemIndex (itemIndex)}
            <article><strong>Watch for</strong><p>{item.mistake}</p><strong>Try this correction</strong><p>{item.correction}</p></article>
          {/each}
        </div>
      </section>

      <section class="content-section" id="lesson-section-recall">
        <div class="kicker">08 · REFLECT AND RETRIEVE</div>
        <h2>Recall without looking</h2>
        <ul>{#each lesson.retrievalPrompt as prompt (prompt)}<li>{prompt}</li>{/each}</ul>
        <h3>Review guidance</h3>
        <p>{lesson.nextReviewSuggestion.approach}</p>
        <ul>{#each lesson.nextReviewSuggestion.suggestedChecks as check (check)}<li>{check}</li>{/each}</ul>
        <p>{lesson.nextReviewSuggestion.adaptation}</p>
      </section>

      <section class="content-section" id="lesson-section-session">
        <div class="kicker">FLEXIBLE PRACTICE</div>
        <h2>Choose a session size</h2>
        <div class="practice-options">
          <article><h3>10 minutes</h3><ul>{#each lines(lesson.practiceOptions.tenMinutes) as item, index (index)}<li>{item}</li>{/each}</ul></article>
          <article><h3>20 minutes</h3><ul>{#each lines(lesson.practiceOptions.twentyMinutes) as item, index (index)}<li>{item}</li>{/each}</ul></article>
          <article><h3>40 minutes</h3><ul>{#each lines(lesson.practiceOptions.fortyMinutes) as item, index (index)}<li>{item}</li>{/each}</ul></article>
        </div>
        <p>{lesson.practiceOptions.rule}</p>
      </section>
    </article>

    <aside class="lesson-sidebar" aria-label="Lesson navigation">
      <div class="sidebar-card">
        <span class="eyebrow">YOUR ROUTE</span><strong>{data.detail.route.title}</strong>
        <span>Weeks {data.detail.phase.firstWeek}–{data.detail.phase.lastWeek}</span>
        <p>{data.detail.phase.goal}</p>
        <a href={resolve(`/learn#route-${data.detail.route.id}`)}>View all lessons in this route ↗</a>
      </div>
      <div class="sidebar-card glance-card">
        <span class="eyebrow">LESSON AT A GLANCE</span>
        <strong>{lesson.estimatedMinutes} minutes</strong>
        <span>{lesson.lessonBlocks.length} guided steps</span>
        <span>{lesson.exercises.length} focused exercises</span>
        <a href="#lesson-progress">View your saved progress ↓</a>
      </div>
    </aside>
  </div>

  <section class="progress-panel" id="lesson-progress" aria-label="Your lesson progress">
    {#if progressLoading}
      <p class="progress-message">Loading your saved lesson progress…</p>
    {:else if progressError && !progress}
      <p class="progress-error" role="alert">{progressError}</p>
      <button class="retry-progress" type="button" onclick={retryProgressActionNow}>Try again</button>
    {:else if progress}
      <div class="progress-summary">
        <div><span class="eyebrow">YOUR PROGRESS</span><strong>{completedBlockCount} of {lesson.lessonBlocks.length} sections completed</strong></div>
        <span class="progress-percent">{progressPercent}%</span>
      </div>
      <div class="progress-track" role="progressbar" aria-label="Lesson sections completed" aria-valuemin="0" aria-valuemax={lesson.lessonBlocks.length} aria-valuenow={completedBlockCount}><span style={`width: ${progressPercent}%`}></span></div>
      {#if progress.status === 'completed'}
        <p class="progress-complete"><strong>Lesson completed.</strong> Your progress is saved on this device.</p>
      {:else}
        {#if progress.lastBlockId}<button class="resume-button" type="button" onclick={continueFromSavedSection}>Continue from saved section</button>{/if}
        <div class="checkpoint-check">
          <div><span class="eyebrow">LEARNER CHECKPOINT</span><p>Can you meet the observable target above with comfortable, controlled playing?</p></div>
          <div class="checkpoint-actions">
            <button type="button" class:chosen={checkpointOutcome === 'achieved'} aria-pressed={checkpointOutcome === 'achieved'} onclick={() => chooseCheckpoint('achieved')}>I can meet this target</button>
            <button type="button" class:chosen={checkpointOutcome === 'needs_practice'} aria-pressed={checkpointOutcome === 'needs_practice'} onclick={() => chooseCheckpoint('needs_practice')}>I need more practice</button>
          </div>
        </div>
        <label class="note-label" for="checkpoint-note">Next practice note <span>(optional, private to this browser)</span></label>
        <textarea id="checkpoint-note" bind:value={checkpointNote} maxlength="500" rows="2" onblur={saveCheckpointNote} placeholder="What should you focus on next time?"></textarea>
        <div class="completion-actions"><button type="button" onclick={markLessonComplete} disabled={progressSaving || checkpointOutcome !== 'achieved'} aria-busy={progressSaving}>{progressSaving ? 'Saving…' : 'Mark lesson complete'}</button></div>
      {/if}
      {#if progressError}
        <p class="progress-error" role="alert">{progressError}</p>
        <button class="retry-progress" type="button" onclick={retryProgressActionNow} disabled={progressSaving}>
          {progressRetryAction === 'complete' ? 'Try completing again' : 'Retry save'}
        </button>
      {/if}
      {#if progressSaving}<p class="saving-message" role="status">Saving on this device…</p>{/if}
    {/if}
  </section>

  <nav class="lesson-pagination" aria-label="Lesson pagination">
    {#if data.previousLessonId}<a href={resolve('/learn/[lessonId]', { lessonId: data.previousLessonId })}>← Previous lesson</a>{:else}<span>Start of this route</span>{/if}
    <a href={resolve(`/learn#route-${data.detail.route.id}`)}>All lessons</a>
    {#if data.nextLessonId}<a href={resolve('/learn/[lessonId]', { lessonId: data.nextLessonId })}>Next lesson →</a>{:else}<span>End of this route</span>{/if}
  </nav>
  <p class="mastery-note">Reading a lesson or spending time on an exercise does not mark it complete or prove skill mastery. Progress recording and checkpoints are a separate learning step.</p>
</main>

<style>
  .lesson-page{max-width:1180px;margin:0 auto;padding:28px clamp(16px,4vw,50px) 70px;color:var(--text)}
  .breadcrumbs{display:flex;flex-wrap:wrap;gap:8px;align-items:center;color:var(--muted);font-size:10px;margin-bottom:29px}
  .breadcrumbs a:hover{color:var(--primary)}.lesson-header{max-width:850px;margin-bottom:28px}
  .eyebrow,.kicker{font-size:9px;font-weight:800;letter-spacing:1.25px;color:var(--muted)}
  .lesson-header h1{font:500 clamp(36px,6vw,56px)/1.1 Georgia,serif;letter-spacing:-1.5px;margin:12px 0}
  .focus{font-size:16px;color:var(--muted);line-height:1.65;margin:0}.lesson-meta{display:flex;flex-wrap:wrap;gap:8px;margin:17px 0}
  .lesson-meta span{border:1px solid var(--border);border-radius:99px;padding:7px 10px;color:var(--muted);font-size:9px}
  .checkpoint{margin-top:21px;padding:19px 21px;border:1px solid color-mix(in srgb,var(--primary) 45%,var(--border));border-radius:var(--radius);background:color-mix(in srgb,var(--primary) 6%,var(--surface))}
  .checkpoint p{font:500 18px/1.45 Georgia,serif;margin:8px 0}.checkpoint small{font-size:10px;line-height:1.5;color:var(--muted)}
  .lesson-layout{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:25px;align-items:start}.lesson-content{min-width:0}
  .content-section{padding:26px 0;border-bottom:1px solid var(--border);scroll-margin-top:20px}
  .content-section h2{font:500 25px/1.2 Georgia,serif;margin:8px 0 15px}.content-section h3{font-size:13px;margin:20px 0 9px}
  .content-section p,.content-section li{font-size:12px;line-height:1.8;color:var(--muted)}.content-section ul,.content-section ol{padding-left:21px}
  .worked-example,.success-target{padding:15px 17px;margin-top:15px;border:1px solid var(--border);border-radius:11px;background:var(--surface)}
  .worked-example p,.success-target p{margin:7px 0 0}
  .lesson-blocks,.exercise-list,.references,.mistakes{display:grid;gap:11px}
  .lesson-block{display:grid;grid-template-columns:38px minmax(0,1fr);gap:12px;padding:15px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
  .block-number{font:500 20px Georgia,serif;color:var(--primary)}.block-type,.exercise-meta,.references article>span{font-size:9px;text-transform:uppercase;letter-spacing:.7px;color:var(--muted)}
  .lesson-block h3{margin:5px 0}.lesson-block p{margin:0}
  .exercise,.references article,.mistakes article{padding:17px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
  .exercise-meta{display:flex;justify-content:space-between;gap:12px}.exercise h3{margin:9px 0}
  .success-target strong,.mistakes strong{font-size:10px;color:var(--text)}.success-target p,.mistakes p{margin:5px 0 9px}
  .exercise>small{display:block;margin-top:12px;font-size:9px;color:var(--muted)}
  .references h4{font-size:11px;margin:7px 0}.references p{margin:0}
  .criteria{list-style:none;padding:0!important;display:grid;gap:10px}.criteria li{padding:13px 15px;border-left:2px solid var(--primary);background:var(--surface)}
  .criteria strong{font-size:10px;color:var(--text);text-transform:capitalize}.criteria p{margin:5px 0 0}
  .alternative{padding:20px;border:1px solid var(--border);border-radius:12px;background:var(--surface-raised);margin-top:20px}
  .alternative h2{margin-bottom:8px}.alternative p{margin:0}
  .practice-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
  .practice-options article{padding:13px;border:1px solid var(--border);border-radius:10px;background:var(--surface)}
  .practice-options h3{margin:0 0 8px}.practice-options ul{padding-left:15px}.practice-options li{font-size:10px}
  .lesson-sidebar{display:grid;gap:12px;position:sticky;top:18px}
  .sidebar-card{display:grid;gap:8px;padding:17px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
  .sidebar-card strong{font-size:12px}.sidebar-card>span:not(.eyebrow){font-size:10px;color:var(--muted);overflow-wrap:anywhere}
  .sidebar-card p{font-size:10px;line-height:1.6;color:var(--muted);margin:0}.sidebar-card a{font-size:10px;color:var(--primary);font-weight:750;margin-top:5px}
  .lesson-pagination{display:flex;justify-content:space-between;gap:10px;margin-top:30px;padding:15px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
  .lesson-pagination a,.lesson-pagination span{display:inline-flex;align-items:center;min-height:44px;font-size:11px;color:var(--primary)}.lesson-pagination span{color:var(--muted)}
  .mastery-note{font-size:10px;line-height:1.6;color:var(--muted);margin-top:16px}

  .progress-panel{margin:22px 0 28px;padding:18px 20px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}
  .progress-summary{display:flex;justify-content:space-between;align-items:center;gap:12px}.progress-summary>div{display:grid;gap:6px}.progress-summary strong{font-size:12px}.progress-percent{font:500 22px Georgia,serif;color:var(--primary)}
  .progress-track{height:7px;margin:13px 0 16px;border-radius:99px;background:var(--surface-raised);overflow:hidden}.progress-track span{display:block;height:100%;background:var(--primary);border-radius:99px;transition:width .2s ease}
  .progress-message,.saving-message{font-size:10px;color:var(--muted);margin:8px 0}.progress-error{font-size:11px;color:var(--danger,#b45309);margin:9px 0}
  .retry-progress{min-height:44px;padding:9px 13px;border:1px solid var(--border-strong);border-radius:9px;background:var(--surface-raised);color:var(--text);font:inherit;font-size:12px;font-weight:700}
  .lesson-adaptation{padding:14px 16px;margin:14px 0;border-left:3px solid var(--primary);border-radius:9px;background:var(--surface-raised)}
  .lesson-adaptation strong{font-size:13px;color:var(--text)}
  .lesson-adaptation p{margin:6px 0 0;font-size:1rem;line-height:1.65;color:var(--text)}
  .lesson-tool-links{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0 18px}
  .lesson-tool-links a{display:inline-flex;align-items:center;min-height:44px;padding:9px 13px;border:1px solid var(--border-strong);border-radius:9px;background:var(--surface);color:var(--primary);font-size:12px;font-weight:750;text-decoration:none}
  .lesson-tool-links a:hover{background:var(--surface-raised)}
  .progress-complete{font-size:11px;line-height:1.6;color:var(--muted);margin:5px 0}.progress-complete strong{color:var(--primary)}
  .resume-button,.checkpoint-actions button,.completion-actions button,.block-complete{min-height:40px;border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:10px;font-weight:700}
  .resume-button{color:var(--primary);margin:0 0 12px}.checkpoint-check{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 0;border-top:1px solid var(--border)}
  .checkpoint-check p{font-size:11px;line-height:1.5;color:var(--muted);margin:5px 0 0}.checkpoint-actions{display:flex;flex-wrap:wrap;gap:7px}
  .checkpoint-actions button.chosen{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 11%,var(--surface));color:var(--primary)}
  .note-label{display:block;font-size:10px;font-weight:700;margin:8px 0}.note-label span{font-weight:400;color:var(--muted)}
  #checkpoint-note{width:100%;resize:vertical;min-height:58px;border:1px solid var(--border);border-radius:9px;padding:10px;background:var(--surface-raised);color:var(--text);font:inherit;font-size:11px}
  .completion-actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:12px}.completion-actions button{background:var(--primary);color:var(--surface);border-color:var(--primary)}.completion-actions button:disabled{opacity:.45;cursor:not-allowed}
  .completion-actions small{font-size:9px;line-height:1.5;color:var(--muted)}.block-complete{margin-top:10px;color:var(--primary)}.block-complete[aria-pressed="true"]{background:color-mix(in srgb,var(--primary) 10%,var(--surface));border-color:var(--primary)}
  button:focus-visible,textarea:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
  a:focus-visible{outline:2px solid var(--primary);outline-offset:3px;border-radius:4px}
  @media(max-width:900px){.lesson-layout{grid-template-columns:1fr}.lesson-sidebar{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:700px){.checkpoint-check{align-items:flex-start;flex-direction:column}.checkpoint-actions{width:100%}.checkpoint-actions button{flex:1}}
  @media(max-width:600px){.lesson-page{padding:20px 16px 55px}.breadcrumbs{margin-bottom:23px}.lesson-header h1{font-size:39px}.content-section{padding:22px 0}.content-section h2{font-size:22px}.practice-options{grid-template-columns:1fr}.lesson-sidebar{grid-template-columns:1fr}.lesson-pagination{flex-wrap:wrap}.lesson-pagination>*{flex:1 1 30%}.lesson-pagination>*:last-child{text-align:right}}

  .lesson-outline{position:sticky;top:66px;z-index:30;display:flex;gap:6px;overflow-x:auto;margin:0 0 17px;padding:9px;border:1px solid var(--border);border-radius:12px;background:color-mix(in srgb,var(--surface) 96%,transparent);backdrop-filter:blur(12px);scrollbar-width:thin}
  .lesson-outline a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;flex:none;padding:8px 12px;border-radius:8px;color:var(--muted);font-size:13px;font-weight:750;white-space:nowrap}
  .lesson-outline a:hover,.lesson-outline a:focus-visible{background:var(--surface-raised);color:var(--primary)}
  .content-section{scroll-margin-top:126px}
  #lesson-progress{scroll-margin-top:126px}
  .content-section h3{font-size:15px}
  .content-section p,.content-section li{font-size:1rem;line-height:1.7;color:var(--text)}
  @media(min-width:900px){.content-section p,.content-section li{font-size:1.0625rem}}
  .block-type,.exercise-meta,.references article>span{font-size:11px}
  .exercise>small{font-size:11px}
  .sidebar-card p{font-size:12px}
  .sidebar-card>span:not(.eyebrow){font-size:12px}
  .glance-card strong{font:500 21px Georgia,serif;color:var(--primary)}
  @media(max-width:760px){.lesson-outline{top:60px;margin-inline:-2px;padding:6px}.lesson-outline a{min-height:44px;padding:8px 10px;font-size:12px}.content-section,#lesson-progress{scroll-margin-top:116px}.lesson-tool-links a{flex:1 1 140px;justify-content:center}}


  /* Supporting lesson copy uses the shared readable type scale; metadata stays compact. */
  .breadcrumbs {
    font-size: var(--font-size-supporting);
  }

  .eyebrow,
  .kicker,
  .lesson-meta span,
  .checkpoint small,
  .block-type,
  .exercise-meta,
  .references article > span {
    font-size: var(--font-size-metadata);
  }

  .success-target strong,
  .mistakes strong,
  .references h4,
  .criteria strong,
  .sidebar-card strong,
  .sidebar-card > span:not(.eyebrow),
  .progress-summary strong,
  .progress-message,
  .saving-message,
  .progress-error,
  .progress-complete,
  .mastery-note,
  .checkpoint-check p,
  .note-label,
  .practice-options li,
  .lesson-pagination a,
  .lesson-pagination span {
    font-size: var(--font-size-supporting);
    line-height: var(--line-height-body);
  }

  .sidebar-card p,
  .success-target p,
  .mistakes p,
  .references p,
  .criteria p {
    font-size: var(--font-size-supporting);
    line-height: var(--line-height-body);
  }

  .retry-progress,
  .resume-button,
  .checkpoint-actions button,
  .completion-actions button,
  .block-complete {
    min-height: 44px;
    font-size: var(--font-size-supporting);
  }

  .progress-error {
    color: var(--text-danger);
  }

  button:focus-visible,
  textarea:focus-visible,
  a:focus-visible {
    outline-color: var(--focus);
  }
</style>
