<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    getSkillCategoryDisplayName,
    getSkillDescription,
    listLessonsForSkill
  } from '../../lib/application/skill-catalog';
  import type { SkillProgressOverviewItem } from '../../lib/application/skill-progress-overview';
  import type { SkillMasteryRecord } from '../../lib/repositories/contracts';
  import {
    correctActiveSkillState,
    loadSkillProgressOverview
  } from '../../lib/storage/indexeddb';

  type SkillState = SkillMasteryRecord['state'];

  const states: SkillState[] = [
    'not_started',
    'learning',
    'practising',
    'stable',
    'review_due'
  ];

  const stateGuides: {
    state: SkillState;
    title: string;
    description: string;
  }[] = [
    {
      state: 'not_started',
      title: 'Not assessed yet',
      description: 'No skill-level assessment has been recorded.'
    },
    {
      state: 'learning',
      title: 'More evidence needed',
      description: 'The latest assessment was inconclusive.'
    },
    {
      state: 'practising',
      title: 'Needs more practice',
      description: 'The latest assessment suggests another practice pass.'
    },
    {
      state: 'stable',
      title: 'Demonstrated',
      description: 'The latest skill-level assessment was passed.'
    },
    {
      state: 'review_due',
      title: 'Review due',
      description: 'A previously demonstrated skill is due to be checked again.'
    }
  ];

  let reviews = $state<SkillProgressOverviewItem[]>([]);
  let selectedSkillId = $state('');
  let selectedState = $state<SkillState>('not_started');
  let searchQuery = $state('');
  let categoryFilter = $state('all');
  let correctionNote = $state('');
  let mobileDetail = $state(false);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let notice = $state('');

  const selectedReview = $derived(
    reviews.find((review) => review.skill.id === selectedSkillId) ?? null
  );
  const categoryOptions = $derived(
    [...new Set(reviews.map((review) => review.skill.category))].sort((left, right) =>
      getSkillCategoryDisplayName(left).localeCompare(getSkillCategoryDisplayName(right))
    )
  );
  const filteredReviews = $derived(
    reviews.filter((review) => {
      const query = searchQuery.trim().toLocaleLowerCase();
      const matchesQuery =
        query.length === 0 ||
        review.skill.displayName.toLocaleLowerCase().includes(query) ||
        review.skill.id.toLocaleLowerCase().includes(query) ||
        getSkillCategoryDisplayName(review.skill.category)
          .toLocaleLowerCase()
          .includes(query);
      return (
        matchesQuery &&
        (categoryFilter === 'all' || review.skill.category === categoryFilter)
      );
    })
  );
  const selectedLessons = $derived(
    selectedReview ? listLessonsForSkill(selectedReview.skill.id) : []
  );

  onMount(() => {
    void refresh();
  });

  async function refresh() {
    loading = true;
    error = '';
    try {
      reviews = await loadSkillProgressOverview();
      if (!reviews.some((review) => review.skill.id === selectedSkillId)) {
        selectedSkillId = reviews[0]?.skill.id ?? '';
      }
      const current = reviews.find((review) => review.skill.id === selectedSkillId);
      if (current) {
        selectedState = current.mastery?.state ?? current.explanation.state;
      }
    } catch {
      error = 'Your local skill map could not be loaded. Check browser storage and try again.';
    } finally {
      loading = false;
    }
  }

  function chooseSkill(review: SkillProgressOverviewItem) {
    selectedSkillId = review.skill.id;
    selectedState = review.mastery?.state ?? review.explanation.state;
    correctionNote = '';
    notice = '';
    error = '';
    mobileDetail = true;
  }

  function showSkillList() {
    mobileDetail = false;
    notice = '';
    error = '';
  }

  async function saveCorrection(event: SubmitEvent) {
    event.preventDefault();
    if (!selectedReview?.mastery || saving) return;
    if (!correctionNote.trim()) {
      error = 'Add a short note explaining why you are correcting this state.';
      return;
    }
    saving = true;
    error = '';
    notice = '';
    try {
      await correctActiveSkillState({
        skillId: selectedReview.skill.id,
        curriculumReleaseId: selectedReview.mastery.curriculumReleaseId,
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

  function stateLabel(state: SkillState) {
    return (
      stateGuides.find((guide) => guide.state === state)?.title ??
      state.replace('_', ' ')
    );
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

  function clearFilters() {
    searchQuery = '';
    categoryFilter = 'all';
  }
</script>

<svelte:head>
  <title>Skill map — GuitarLab</title>
  <meta
    name="description"
    content="Explore the GuitarLab skill catalogue and see what your assessment evidence does and does not tell you yet."
  />
</svelte:head>

<main class="skill-page">
  <a class="back" href={resolve('/')}>← Dashboard</a>
  <header>
    <div class="eyebrow">YOUR LEARNING MAP</div>
    <h1>See the skills behind <em>the music.</em></h1>
    <p>
      Explore the skills covered by GuitarLab. Each state is based on skill-level
      assessment evidence—not practice time, lesson completion or how long you
      have been learning.
    </p>
  </header>

  <section class="state-guide" aria-labelledby="state-guide-title">
    <div class="guide-heading">
      <h2 id="state-guide-title">How to read your skill states</h2>
      <p>Missing evidence is not a low score or a failed assessment.</p>
    </div>
    <div class="guide-grid">
      {#each stateGuides as guide (guide.state)}
        <article class="guide-item">
          <span class="state-dot" data-state={guide.state}></span>
          <strong>{guide.title}</strong>
          <p>{guide.description}</p>
        </article>
      {/each}
    </div>
  </section>

  {#if loading}
    <p class="status" role="status">Loading your skill map…</p>
  {:else if error && reviews.length === 0}
    <p class="status error" role="alert">{error}</p>
  {:else}
    <div class="layout">
      <section
        class="skill-list"
        class:mobile-hidden={mobileDetail}
        aria-label="Canonical GuitarLab skill catalogue"
      >
        <div class="list-heading">
          <div>
            <div class="eyebrow">CANONICAL CATALOGUE</div>
            <h2>Skills <span>{reviews.length}</span></h2>
          </div>
          <span class="catalogue-tag">Published skill map</span>
        </div>

        <div class="filters">
          <label for="skill-search">Find a skill</label>
          <input
            id="skill-search"
            type="search"
            bind:value={searchQuery}
            placeholder="Search skills or categories"
          />
          <label for="skill-category">Category</label>
          <select id="skill-category" bind:value={categoryFilter}>
            <option value="all">All categories</option>
            {#each categoryOptions as category (category)}
              <option value={category}>{getSkillCategoryDisplayName(category)}</option>
            {/each}
          </select>
        </div>

        <p class="result-count" role="status" aria-live="polite">
          Showing {filteredReviews.length} of {reviews.length} skills
        </p>

        {#if filteredReviews.length === 0}
          <div class="no-results">
            <strong>No skills match those filters.</strong>
            <button type="button" onclick={clearFilters}>Clear search and category</button>
          </div>
        {:else}
          <div class="skill-options">
            {#each filteredReviews as review (review.skill.id)}
              <button
                class="skill-choice"
                class:chosen={selectedSkillId === review.skill.id}
                type="button"
                onclick={() => chooseSkill(review)}
                aria-pressed={selectedSkillId === review.skill.id}
              >
                <span class="choice-copy">
                  <small>{getSkillCategoryDisplayName(review.skill.category)}</small>
                  <strong>{review.skill.displayName}</strong>
                </span>
                <span class="choice-state" data-state={review.explanation.state}>
                  {stateLabel(review.explanation.state)}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </section>

      {#if selectedReview}
        <section
          class="detail"
          class:mobile-visible={mobileDetail}
          aria-labelledby="skill-title"
        >
          <button class="mobile-back" type="button" onclick={showSkillList}>
            ← All skills
          </button>
          <div class="eyebrow">{getSkillCategoryDisplayName(selectedReview.skill.category)}</div>
          <h2 id="skill-title">{selectedReview.skill.displayName}</h2>
          <p class="skill-description">
            {getSkillDescription(selectedReview.skill.id) ??
              'This skill is part of the published GuitarLab learning catalogue.'}
          </p>

          <div class="state-summary" data-state={selectedReview.explanation.state}>
            <div>
              <span class="eyebrow">CURRENT EVIDENCE</span>
              <strong>{stateLabel(selectedReview.explanation.state)}</strong>
            </div>
            <p>{selectedReview.explanation.reason}</p>
          </div>

          <dl class="evidence">
            <div>
              <dt>Qualifying assessments</dt>
              <dd>{selectedReview.explanation.evidenceCount}</dd>
            </div>
            <div>
              <dt>Latest assessment</dt>
              <dd>{selectedReview.explanation.latestOutcome ?? 'None recorded'}</dd>
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
              <dt>State source</dt>
              <dd>
                {selectedReview.mastery?.decisionSource === 'learner'
                  ? 'Your correction'
                  : selectedReview.mastery
                    ? 'Assessment evidence'
                    : 'No saved state'}
              </dd>
            </div>
            {#if selectedReview.mastery?.correctionNote}
              <div class="full">
                <dt>Your previous correction note</dt>
                <dd>{selectedReview.mastery.correctionNote}</dd>
              </div>
            {/if}
          </dl>

          <section class="related" aria-labelledby="related-title">
            <div class="eyebrow">YOUR NEXT STEPS</div>
            <h3 id="related-title">Learn and practise this skill</h3>
            {#if selectedLessons.length > 0}
              <ul class="lesson-links">
                {#each selectedLessons as lesson (lesson.id)}
                  <li>
                    <a href={resolve('/learn/[lessonId]', { lessonId: lesson.id })}>
                      <span>Week {lesson.week}</span>
                      <strong>{lesson.title}</strong>
                      <small>{lesson.focus}</small>
                    </a>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="related-note">
                No Year 1 lesson is currently linked to this skill in the published
                curriculum index.
              </p>
            {/if}
            <div class="related-actions">
              <a href={resolve('/practice')}>Open Practice Studio <span aria-hidden="true">→</span></a>
              <a href={resolve('/practice') + '#history-heading'}>
                View full practice history <span aria-hidden="true">→</span>
              </a>
            </div>
            <p class="related-note">
              Practice history helps you revisit your activity. It does not
              independently establish skill mastery.
            </p>
          </section>

          {#if selectedReview.mastery}
            <form onsubmit={saveCorrection}>
              <h3>Correct this state</h3>
              <p class="form-help">
                Choose the state that best reflects your experience and explain
                your choice. A learner correction cannot bypass the assessment
                requirement for a demonstrated state.
              </p>
              <label for="corrected-state">Your state</label>
              <select id="corrected-state" bind:value={selectedState}>
                {#each states as state (state)}
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
          {:else}
            <p class="correction-note">
              State corrections become available after this skill has a saved
              assessment-based state. Your current practice and lesson activity
              remain visible in Practice Studio.
            </p>
          {/if}

          {#if notice}<p class="notice" role="status">{notice}</p>{/if}
          {#if error}<p class="error" role="alert">{error}</p>{/if}
        </section>
      {/if}
    </div>
  {/if}

  <footer>
    The published catalogue shows what can be learned. Your evidence panel shows
    only assessment results recorded on this device; no progress is assumed.
  </footer>
</main>

<style>
  .skill-page {
    max-width: 1240px;
    margin: 0 auto;
    padding: 32px clamp(16px, 4vw, 52px) 64px;
    color: var(--text);
  }
  .back {
    display: inline-block;
    margin-bottom: 24px;
    color: var(--muted);
    font-size: 12px;
  }
  .eyebrow {
    color: var(--muted);
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 1.3px;
  }
  header {
    max-width: 740px;
    padding-bottom: 24px;
  }
  h1 {
    margin: 10px 0;
    font: 500 clamp(35px, 5.5vw, 58px) / 1.08 Georgia, serif;
    letter-spacing: -1.7px;
  }
  h1 em {
    color: var(--primary);
  }
  header > p,
  .skill-description {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.75;
  }
  .state-guide,
  .skill-list,
  .detail,
  .status {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .state-guide {
    margin-bottom: 18px;
    padding: 18px;
  }
  .guide-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px 18px;
  }
  .guide-heading h2 {
    margin: 0;
    font-size: 14px;
  }
  .guide-heading p {
    margin: 0;
    color: var(--muted);
    font-size: 10px;
  }
  .guide-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    margin-top: 14px;
  }
  .guide-item {
    min-width: 0;
    padding: 11px;
    border: 1px solid var(--border);
    border-radius: 9px;
  }
  .guide-item strong {
    display: block;
    margin: 7px 0 4px;
    font-size: 10px;
  }
  .guide-item p {
    margin: 0;
    color: var(--muted);
    font-size: 9px;
    line-height: 1.55;
  }
  .state-dot {
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
  }
  .state-dot[data-state='learning'],
  .choice-state[data-state='learning'] {
    color: var(--muted);
  }
  .state-dot[data-state='practising'],
  .choice-state[data-state='practising'] {
    color: var(--warning);
  }
  .state-dot[data-state='stable'],
  .choice-state[data-state='stable'] {
    color: var(--success);
  }
  .state-dot[data-state='review_due'],
  .choice-state[data-state='review_due'] {
    color: var(--primary);
  }
  .state-dot[data-state='practising'] {
    background: var(--warning);
  }
  .state-dot[data-state='stable'] {
    background: var(--success);
  }
  .state-dot[data-state='review_due'] {
    background: var(--primary);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.5fr);
    align-items: start;
    gap: 16px;
  }
  .skill-list,
  .detail {
    min-width: 0;
    padding: 18px;
  }
  .list-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .list-heading h2 {
    margin: 6px 0 0;
    font: 500 22px Georgia, serif;
  }
  .list-heading h2 span {
    color: var(--muted);
    font: 500 12px system-ui, sans-serif;
  }
  .catalogue-tag {
    color: var(--muted);
    font-size: 9px;
  }
  .filters {
    display: grid;
    gap: 7px;
    margin-top: 16px;
  }
  label {
    font-size: 10px;
    font-weight: 700;
  }
  input,
  select,
  textarea {
    width: 100%;
    min-height: 42px;
    padding: 10px 11px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-size: 12px;
  }
  .result-count {
    margin: 12px 0 9px;
    color: var(--muted);
    font-size: 10px;
  }
  .skill-options {
    display: grid;
    gap: 5px;
    max-height: 650px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .skill-choice {
    display: grid;
    gap: 7px;
    width: 100%;
    min-height: 64px;
    padding: 11px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    text-align: left;
  }
  .skill-choice:hover,
  .skill-choice.chosen {
    border-color: var(--border);
    background: var(--surface-raised);
  }
  .choice-copy {
    display: grid;
    gap: 3px;
  }
  .choice-copy small {
    color: var(--muted);
    font-size: 9px;
  }
  .choice-copy strong {
    font-size: 11px;
  }
  .choice-state {
    font-size: 9px;
    font-weight: 700;
  }
  .no-results {
    display: grid;
    gap: 9px;
    padding: 18px 8px;
    color: var(--muted);
    font-size: 11px;
  }
  .no-results button,
  .mobile-back {
    justify-self: start;
    min-height: 42px;
    border: 0;
    background: transparent;
    color: var(--primary);
    font: inherit;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }
  .detail h2 {
    margin: 8px 0;
    font: 500 clamp(24px, 3vw, 32px) / 1.2 Georgia, serif;
  }
  .skill-description {
    margin: 0 0 16px;
    font-size: 12px;
  }
  .state-summary {
    display: grid;
    gap: 9px;
    padding: 15px;
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .state-summary strong {
    display: block;
    margin-top: 5px;
    font-size: 14px;
  }
  .state-summary p {
    margin: 0;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.65;
  }
  .evidence {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
    margin: 14px 0 20px;
  }
  .evidence div {
    min-width: 0;
    padding: 11px;
    border: 1px solid var(--border);
    border-radius: 9px;
  }
  .evidence .full {
    grid-column: 1 / -1;
  }
  dt {
    margin-bottom: 6px;
    color: var(--muted);
    font-size: 9px;
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 11px;
    text-transform: capitalize;
  }
  .related {
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .related h3 {
    margin: 6px 0 12px;
    font: 500 18px Georgia, serif;
  }
  .lesson-links {
    display: grid;
    gap: 7px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .lesson-links a {
    display: grid;
    gap: 4px;
    min-height: 58px;
    padding: 11px;
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--text);
    text-decoration: none;
  }
  .lesson-links a:hover {
    background: var(--surface-raised);
  }
  .lesson-links span,
  .lesson-links small {
    color: var(--muted);
    font-size: 9px;
  }
  .lesson-links strong {
    font-size: 11px;
  }
  .related-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px 18px;
    margin-top: 14px;
  }
  .related-actions a {
    color: var(--primary);
    font-size: 10px;
    font-weight: 750;
  }
  .related-note {
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 10px;
    line-height: 1.6;
  }
  form {
    display: grid;
    gap: 9px;
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
  }
  form h3 {
    margin: 0;
    font: 500 18px Georgia, serif;
  }
  .form-help,
  .correction-note {
    margin: 0;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.65;
  }
  textarea {
    min-height: 88px;
    resize: vertical;
  }
  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .form-footer span {
    color: var(--muted);
    font-size: 10px;
  }
  button[type='submit'] {
    min-height: 46px;
    padding: 11px 15px;
    border: 0;
    border-radius: 9px;
    background: var(--primary);
    color: var(--primary-ink);
    font-size: 11px;
    font-weight: 750;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  .notice,
  .error {
    font-size: 11px;
    line-height: 1.6;
  }
  .notice {
    color: var(--success);
  }
  .error {
    color: var(--danger);
  }
  .status {
    padding: 17px;
    font-size: 12px;
  }
  .status.error {
    color: var(--danger);
  }
  .mobile-back {
    display: none;
  }
  footer {
    margin-top: 24px;
    padding-top: 15px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 10px;
    line-height: 1.65;
  }
  a:focus-visible,
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 3px;
  }
  @media (max-width: 1000px) {
    .guide-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .layout {
      grid-template-columns: minmax(250px, 0.85fr) minmax(0, 1.15fr);
    }
  }
  @media (max-width: 700px) {
    .guide-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
    .skill-list.mobile-hidden {
      display: none;
    }
    .detail:not(.mobile-visible) {
      display: none;
    }
    .mobile-back {
      display: inline-block;
      margin: -5px 0 10px;
      padding: 5px 0;
    }
    .skill-options {
      max-height: none;
    }
  }
  @media (max-width: 420px) {
    .guide-grid,
    .evidence {
      grid-template-columns: minmax(0, 1fr);
    }
    .evidence .full {
      grid-column: auto;
    }
    .skill-page {
      padding-inline: 15px;
    }
    .state-guide,
    .skill-list,
    .detail {
      padding: 14px;
    }
    .related-actions {
      display: grid;
    }
  }
</style>
