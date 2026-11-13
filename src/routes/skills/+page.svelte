<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    correctActiveSkillState,
    loadActiveSkillStateReview,
    type ActiveSkillStateReview
  } from '../../lib/storage/indexeddb';
  import type { SkillMasteryRecord } from '../../lib/repositories/contracts';

  const states: SkillMasteryRecord['state'][] = [
    'not_started',
    'learning',
    'practising',
    'stable',
    'review_due'
  ];

  let reviews = $state<ActiveSkillStateReview[]>([]);
  let selectedSkillId = $state('');
  let selectedState = $state<SkillMasteryRecord['state']>('learning');
  let correctionNote = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let notice = $state('');

  const selectedReview = $derived(
    reviews.find((review) => review.skillId === selectedSkillId) ?? null
  );

  onMount(() => {
    void refresh();
  });

  async function refresh() {
    loading = true;
    error = '';
    try {
      reviews = await loadActiveSkillStateReview();
      if (!reviews.some((review) => review.skillId === selectedSkillId)) {
        selectedSkillId = reviews[0]?.skillId ?? '';
      }
      if (selectedReview) selectedState = selectedReview.mastery.state;
    } catch {
      error = 'Your local skill states could not be loaded. Check browser storage and try again.';
    } finally {
      loading = false;
    }
  }

  function chooseSkill(review: ActiveSkillStateReview) {
    selectedSkillId = review.skillId;
    selectedState = review.mastery.state;
    correctionNote = '';
    notice = '';
    error = '';
  }

  async function saveCorrection(event: SubmitEvent) {
    event.preventDefault();
    if (!selectedReview || saving) return;
    if (!correctionNote.trim()) {
      error = 'Add a short note explaining why you are correcting this state.';
      return;
    }
    saving = true;
    error = '';
    notice = '';
    try {
      await correctActiveSkillState({
        skillId: selectedReview.skillId,
        state: selectedState,
        note: correctionNote
      });
      correctionNote = '';
      notice = 'Your correction has been saved on this device.';
      await refresh();
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'The correction could not be saved. Please try again.';
    } finally {
      saving = false;
    }
  }

  function label(skillId: string) {
    return skillId
      .split(/[.-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function stateLabel(state: SkillMasteryRecord['state']) {
    return state.replace('_', ' ');
  }

  function formatDate(timestamp: number | null) {
    return timestamp === null
      ? 'Not recorded'
      : new Date(timestamp).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
  }
</script>

<svelte:head>
  <title>Skill states — GuitarLab</title>
  <meta
    name="description"
    content="Understand the evidence behind your GuitarLab skill states and correct them when they do not reflect your experience."
  />
</svelte:head>

<main class="skill-page">
  <a class="back" href={resolve('/')}>← Dashboard</a>
  <header>
    <div class="eyebrow">YOUR LEARNING RECORD</div>
    <h1>Skill states, <em>explained.</em></h1>
    <p>
      See what your assessment history suggests and correct a saved state when it
      does not match your experience. Your correction is stored locally with your
      explanation.
    </p>
  </header>

  {#if loading}
    <p class="status" role="status">Loading your skill states…</p>
  {:else if error && reviews.length === 0}
    <p class="status error" role="alert">{error}</p>
  {:else if reviews.length === 0}
    <section class="empty">
      <h2>No saved skill states yet</h2>
      <p>
        Skill states appear here after an assessment or a mastery update has
        created a record. Practice time and lesson completion alone do not create
        mastery.
      </p>
      <a href={resolve('/learn')}>Explore your curriculum ↗</a>
    </section>
  {:else}
    <div class="layout">
      <section class="skill-list" aria-label="Your saved skill states">
        <h2>Saved skills <span>{reviews.length}</span></h2>
        {#each reviews as review (review.skillId)}
          <button
            class:chosen={selectedSkillId === review.skillId}
            class="skill-choice"
            type="button"
            onclick={() => chooseSkill(review)}
            aria-pressed={selectedSkillId === review.skillId}
          >
            <strong>{label(review.skillId)}</strong>
            <span>{stateLabel(review.mastery.state)}</span>
          </button>
        {/each}
      </section>

      {#if selectedReview}
        <section class="detail" aria-labelledby="skill-title">
          <div class="eyebrow">EVIDENCE-BASED SUGGESTION</div>
          <h2 id="skill-title">{label(selectedReview.skillId)}</h2>
          <div class="state-pill">{stateLabel(selectedReview.explanation.state)}</div>
          <p class="reason">{selectedReview.explanation.reason}</p>

          <dl class="evidence">
            <div>
              <dt>Assessment attempts</dt>
              <dd>{selectedReview.explanation.evidenceCount}</dd>
            </div>
            <div>
              <dt>Latest outcome</dt>
              <dd>{selectedReview.explanation.latestOutcome ?? 'None'}</dd>
            </div>
            <div>
              <dt>Last assessed</dt>
              <dd>{formatDate(selectedReview.explanation.latestAssessedAt)}</dd>
            </div>
            <div>
              <dt>Next review</dt>
              <dd>{formatDate(selectedReview.explanation.nextReviewAt)}</dd>
            </div>
            <div>
              <dt>Decision source</dt>
              <dd>{selectedReview.mastery.decisionSource ?? 'Evidence'}</dd>
            </div>
            {#if selectedReview.mastery.correctionNote}
              <div class="full">
                <dt>Previous correction note</dt>
                <dd>{selectedReview.mastery.correctionNote}</dd>
              </div>
            {/if}
          </dl>

          <form onsubmit={saveCorrection}>
            <h3>Correct this state</h3>
            <p class="form-help">
              Choose the state that best reflects your current experience and
              explain your choice. A learner correction cannot bypass the
              assessment requirement for a stable state.
            </p>
            <label for="corrected-state">Your state</label>
            <select id="corrected-state" bind:value={selectedState}>
              {#each states as state}
                <option value={state}>{stateLabel(state)}</option>
              {/each}
            </select>
            <label for="correction-note">Why does this fit better?</label>
            <textarea
              id="correction-note"
              bind:value={correctionNote}
              maxlength="500"
              rows="3"
              placeholder="For example: I can play this slowly, but my timing is not consistent yet."
              required
            ></textarea>
            <div class="form-footer">
              <span>{correctionNote.length}/500</span>
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save correction'}
              </button>
            </div>
          </form>
          {#if notice}<p class="notice" role="status">{notice}</p>{/if}
          {#if error}<p class="error" role="alert">{error}</p>{/if}
        </section>
      {/if}
    </div>
  {/if}
  <footer>
    Assessment outcomes drive evidence-based suggestions. Practice duration,
    repetitions and completed lessons do not independently establish mastery.
  </footer>
</main>

<style>
  .skill-page{max-width:1100px;margin:0 auto;padding:34px clamp(17px,4vw,52px) 70px;color:var(--text)}
  .back{display:inline-block;margin-bottom:28px;color:var(--muted);font-size:12px}
  .eyebrow{font-size:10px;letter-spacing:1.4px;font-weight:750;color:var(--muted)}
  header{max-width:720px;padding-bottom:28px}
  h1{font:500 clamp(38px,6vw,60px)/1.08 Georgia,serif;letter-spacing:-1.8px;margin:12px 0}
  h1 em{color:var(--primary)}
  header p,.reason,.form-help{font-size:13px;line-height:1.75;color:var(--muted)}
  .layout{display:grid;grid-template-columns:minmax(210px,.7fr) minmax(0,1.5fr);gap:16px;align-items:start}
  .skill-list,.detail,.empty,.status{border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);padding:20px}
  .skill-list h2{font-size:13px;margin:0 0 12px}.skill-list h2 span{color:var(--muted);font-weight:500;margin-left:5px}
  .skill-choice{display:grid;gap:5px;width:100%;text-align:left;padding:12px;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--text);cursor:pointer}
  .skill-choice strong{font-size:12px}.skill-choice span{font-size:10px;color:var(--muted);text-transform:capitalize}
  .skill-choice:hover,.skill-choice.chosen{background:var(--surface-raised);border-color:var(--border)}
  .detail h2{font:500 27px/1.2 Georgia,serif;margin:9px 0}
  .state-pill{display:inline-block;border:1px solid var(--border);border-radius:99px;padding:6px 10px;color:var(--primary);font-size:10px;text-transform:capitalize}
  .reason{margin:14px 0}
  .evidence{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0 24px}
  .evidence div{padding:11px;border:1px solid var(--border);border-radius:10px;min-width:0}
  .evidence .full{grid-column:1/-1}
  dt{font-size:9px;color:var(--muted);margin-bottom:6px}dd{font-size:11px;margin:0;overflow-wrap:anywhere;text-transform:capitalize}
  form{border-top:1px solid var(--border);padding-top:20px;display:grid;gap:9px}
  form h3{font:500 19px Georgia,serif;margin:0}
  .form-help{font-size:11px;margin:0 0 5px}
  label{font-size:10px;font-weight:700}
  select,textarea{width:100%;border:1px solid var(--border);border-radius:9px;padding:11px;background:var(--bg);color:var(--text);font-size:12px}
  textarea{resize:vertical;line-height:1.6}
  .form-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:4px}
  .form-footer span{font-size:10px;color:var(--muted)}
  button[type=submit]{border:0;border-radius:9px;padding:11px 15px;background:var(--primary);color:var(--primary-ink);font-size:11px;font-weight:750;cursor:pointer}
  button:disabled{opacity:.6;cursor:wait}
  .notice,.error{font-size:11px;line-height:1.6}.notice{color:var(--success)}.error{color:var(--danger)}
  .empty h2{font:500 22px Georgia,serif}.empty p{font-size:12px;line-height:1.7;color:var(--muted)}.empty a{font-size:11px;color:var(--primary)}
  .status{font-size:12px}.status.error{color:var(--danger)}
  footer{margin-top:24px;padding-top:15px;border-top:1px solid var(--border);font-size:10px;line-height:1.6;color:var(--muted)}
  a:focus-visible,button:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--focus);outline-offset:3px}
  @media(max-width:700px){.layout{grid-template-columns:1fr}.skill-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.skill-list h2{grid-column:1/-1}.skill-choice{min-width:0}}
  @media(max-width:420px){.skill-list{grid-template-columns:1fr}.evidence{grid-template-columns:1fr}.evidence .full{grid-column:auto}}
</style>
