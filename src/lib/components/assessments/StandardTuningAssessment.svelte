<script lang="ts">
  import { onMount } from 'svelte';
  import {
    standardTuningAssessment,
    type StandardTuningAnswers
  } from '../../../lib/domain/learning/standard-tuning-assessment';
  import {
    loadLatestActiveStandardTuningAssessment,
    recordActiveStandardTuningAssessment
  } from '../../../lib/storage/assessment';
  import type { AssessmentAttemptRecord } from '../../../lib/repositories/contracts';

  function emptyAnswers(): StandardTuningAnswers {
    return Object.fromEntries(
      standardTuningAssessment.items.map((item) => [item.id, ''])
    ) as StandardTuningAnswers;
  }

  let answers = $state<StandardTuningAnswers>(emptyAnswers());
  let result = $state<AssessmentAttemptRecord | null>(null);
  let saving = $state(false);
  let loading = $state(true);
  let error = $state('');
  const answeredCount = $derived(
    standardTuningAssessment.items.filter((item) => Boolean(answers[item.id])).length
  );
  const isComplete = $derived(
    answeredCount === standardTuningAssessment.items.length
  );

  onMount(() => {
    let active = true;
    void loadLatestActiveStandardTuningAssessment()
      .then((attempt) => {
        if (active) result = attempt;
      })
      .catch((cause: unknown) => {
        if (active) {
          error =
            cause instanceof Error
              ? cause.message
              : 'The previous assessment result could not be loaded.';
        }
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });

  async function submitAssessment() {
    if (!isComplete || saving || result) return;
    saving = true;
    error = '';
    try {
      const completedAnswers = Object.fromEntries(
        standardTuningAssessment.items.map((item) => [
          item.id,
          answers[item.id]
        ])
      ) as StandardTuningAnswers;
      result = await recordActiveStandardTuningAssessment(completedAnswers);
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'Your assessment could not be saved on this device.';
    } finally {
      saving = false;
    }
  }

  function startAnotherAttempt() {
    answers = emptyAnswers();
    result = null;
    error = '';
  }
</script>

<section class="assessment" aria-labelledby="standard-tuning-assessment-title">
  <div class="assessment-heading">
    <span class="eyebrow">OBJECTIVE RECALL CHECK · 6 ITEMS</span>
    <h2 id="standard-tuning-assessment-title">{standardTuningAssessment.title}</h2>
    <p>{standardTuningAssessment.description}</p>
  </div>

  {#if loading}
    <p class="local-note" role="status">Loading your saved assessment result…</p>
  {:else if result}
    <div class="assessment-result" aria-live="polite">
      <div class="result-summary">
        <strong>{result.outcome === 'passed' ? 'Check passed' : result.outcome === 'needs_practice' ? 'More practice recommended' : 'Inconclusive attempt'}</strong>
        <span>{result.score === null ? 'No score' : `${result.score}%`}</span>
      </div>
      <p>
        {result.itemEvidence?.filter((item) => item.outcome === 'correct').length ?? 0}
        of {standardTuningAssessment.items.length} pitches identified correctly.
        A pass requires at least {standardTuningAssessment.passThreshold} correct.
      </p>
      <ol class="item-results">
        {#each standardTuningAssessment.items as item (item.id)}
          {@const saved = result.itemEvidence?.find((entry) => entry.itemId === item.id)}
          <li class:correct={saved?.outcome === 'correct'} class:incorrect={saved?.outcome === 'incorrect'}>
            <span>{item.prompt}</span>
            <strong>{saved?.response ?? 'No response'} · {saved?.outcome ?? 'not recorded'}</strong>
          </li>
        {/each}
      </ol>
      <p class="mastery-boundary">
        This records a scored recall attempt only. It does not automatically award skill mastery or verify the physical tuning of your guitar.
      </p>
      <button type="button" class="secondary-button" onclick={startAnotherAttempt}>
        Retake check
      </button>
    </div>
  {:else}
    <div class="assessment-items">
      {#each standardTuningAssessment.items as item, index (item.id)}
        <div class="assessment-item">
          <label for={item.id}>
            <span>ITEM {index + 1}</span>
            {item.prompt}
          </label>
          <select id={item.id} bind:value={answers[item.id]} disabled={saving}>
            <option value="">Choose an open-string pitch</option>
            {#each standardTuningAssessment.options as option (option)}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </div>
      {/each}
    </div>
    <div class="assessment-actions">
      <span>{answeredCount} of {standardTuningAssessment.items.length} answered</span>
      <button type="button" onclick={submitAssessment} disabled={!isComplete || saving}>
        {saving ? 'Saving attempt…' : 'Check answers'}
      </button>
    </div>
    {#if error}
      <p class="assessment-error" role="alert">{error}</p>
    {/if}
    <p class="local-note">Your answers and result are saved in this browser's local learner record. No recording or audio is collected.</p>
  {/if}
</section>

<style>
  .assessment{margin:26px 0 30px;padding:22px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}
  .assessment-heading h2{font:500 25px/1.2 Georgia,serif;margin:8px 0}
  .assessment-heading p,.assessment-result>p{font-size:11px;line-height:1.65;color:var(--muted);margin:0}
  .assessment-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}
  .assessment-item{display:grid;gap:8px;padding:13px;border:1px solid var(--border);border-radius:10px;background:var(--surface-raised)}
  .assessment-item label{display:grid;gap:5px;font-size:11px;line-height:1.5;font-weight:650}
  .assessment-item label span{font-size:8px;letter-spacing:1px;color:var(--muted)}
  .assessment-item select{width:100%;min-height:40px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font:inherit;font-size:11px}
  .assessment-actions,.result-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:17px}
  .assessment-actions span{font-size:10px;color:var(--muted)}
  .assessment-actions button,.secondary-button{min-height:40px;padding:9px 14px;border:1px solid var(--primary);border-radius:9px;background:var(--primary);color:var(--surface);font-size:10px;font-weight:750}
  .assessment-actions button:disabled{opacity:.45;cursor:not-allowed}
  .local-note,.mastery-boundary{margin:12px 0 0;font-size:9px;line-height:1.6;color:var(--muted)}
  .assessment-error{font-size:10px;color:var(--danger,#b45309);margin:10px 0 0}
  .assessment-result{margin-top:18px}
  .result-summary{margin:0 0 7px}
  .result-summary strong{font-size:13px}
  .result-summary span{font:500 22px Georgia,serif;color:var(--primary)}
  .item-results{display:grid;gap:7px;padding:0;margin:15px 0;list-style:none}
  .item-results li{display:grid;gap:4px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:10px;color:var(--muted)}
  .item-results li strong{font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:var(--text)}
  .item-results li.correct{border-color:color-mix(in srgb,var(--primary) 45%,var(--border))}
  .item-results li.incorrect strong{color:var(--danger,#b45309)}
  .secondary-button{margin-top:14px;background:transparent;color:var(--primary)}
  button:focus-visible,select:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
  @media(max-width:650px){.assessment{padding:17px}.assessment-items{grid-template-columns:1fr}.assessment-actions{align-items:flex-start;flex-direction:column}.assessment-actions button{width:100%}}
</style>
