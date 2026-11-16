<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import Icon from '../lib/components/Icon.svelte';
  import Brand from '../lib/components/Brand.svelte';
  import { loadActiveLearnerDashboard } from '../lib/storage/indexeddb';
  import {
    readLastBackupExportAt,
    shouldShowBackupReminder
  } from '../lib/storage/backup-metadata';
  import type { DashboardSnapshot } from '../lib/application/dashboard';
  import {
    buildPracticePlan,
    type PracticePlanPreset
  } from '../lib/application/practice-plan';

  type ThemePreference = 'system' | 'light' | 'dark';
  type ResolvedTheme = 'dark' | 'light';
  let themePreference = $state<ThemePreference>('system');
  let dashboard = $state<DashboardSnapshot | null>(null);
  let isLoading = $state(true);
  let dashboardError = $state('');
  let lastBackupExportAt = $state<number | null>(null);
  let selectedPracticeMinutes = $state<number | null>(null);
  let selectedPracticePreset = $state<PracticePlanPreset | null>(null);
  let customPracticeValue = $state('30');
  let customDurationError = $state('');
  let planDismissed = $state(false);
  let planNotice = $state('');
  let practicePlan = $derived(
    dashboard && selectedPracticeMinutes !== null
      ? buildPracticePlan({
          minutes: selectedPracticeMinutes,
          preset:
            selectedPracticePreset ??
            (selectedPracticeMinutes === 10 ||
            selectedPracticeMinutes === 20 ||
            selectedPracticeMinutes === 40 ||
            selectedPracticeMinutes === 60
              ? selectedPracticeMinutes
              : 'custom'),
          currentLesson: dashboard.nextLesson
            ? {
                id: dashboard.nextLesson.id,
                title: dashboard.nextLesson.title,
                focus: dashboard.nextLesson.focus,
                estimatedMinutes: dashboard.nextLesson.estimatedMinutes,
                isInProgress: dashboard.nextLessonIsInProgress
              }
            : null,
          dueReviews: dashboard.dueReviews,
          learnerGoals: dashboard.learnerGoals,
          recentPractice: dashboard.recentPractice.map((session) => ({
            focus: session.focus,
            difficulty: session.difficulty,
            status: session.status,
            startedAt: session.startedAt
          })),
          now: Date.now()
        })
      : null
  );

  function isThemePreference(value: string | undefined): value is ThemePreference {
    return value === 'system' || value === 'light' || value === 'dark';
  }

  function readSavedThemePreference(): ThemePreference {
    const currentPreference = document.documentElement.dataset.themePreference;
    if (isThemePreference(currentPreference)) return currentPreference;
    try {
      const storedPreference = window.localStorage.getItem('guitarlab-theme') ?? undefined;
      return isThemePreference(storedPreference) ? storedPreference : 'system';
    } catch {
      return 'system';
    }
  }

  function applyResolvedTheme(preference: ThemePreference) {
    const resolved: ResolvedTheme =
      preference === 'system'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : preference;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = resolved;
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'light' ? '#F5F4F0' : '#101318');
  }

  function setThemePreference(preference: ThemePreference) {
    themePreference = preference;
    applyResolvedTheme(preference);
    try {
      window.localStorage.setItem('guitarlab-theme', preference);
    } catch {
      // The selected appearance remains active for this session.
    }
  }

  function handleThemePreferenceChange(event: Event) {
    const selected = event.currentTarget as HTMLSelectElement;
    if (isThemePreference(selected.value)) setThemePreference(selected.value);
  }

  async function loadDashboard(isCurrent: () => boolean = () => true) {
    isLoading = true;
    dashboardError = '';

    try {
      const snapshot = await loadActiveLearnerDashboard();
      if (!isCurrent()) return;

      dashboard = snapshot;
      selectedPracticeMinutes = snapshot.practiceMinutes;
      selectedPracticePreset =
        selectedPracticeMinutes === null
          ? null
          : selectedPracticeMinutes === 10 ||
              selectedPracticeMinutes === 20 ||
              selectedPracticeMinutes === 40 ||
              selectedPracticeMinutes === 60
            ? selectedPracticeMinutes
            : 'custom';
      customPracticeValue =
        selectedPracticeMinutes === null ? '30' : String(selectedPracticeMinutes);
    } catch {
      if (isCurrent()) {
        dashboardError =
          'Your local learning data could not be loaded. Check browser storage and try again.';
      }
    } finally {
      if (isCurrent()) isLoading = false;
    }
  }

  onMount(() => {
    try {
      lastBackupExportAt = readLastBackupExportAt(window.localStorage);
    } catch {
      lastBackupExportAt = null;
    }
    themePreference = readSavedThemePreference();
    applyResolvedTheme(themePreference);
    const themeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = () => {
      if (themePreference === 'system') applyResolvedTheme('system');
    };
    themeMediaQuery.addEventListener('change', handleSystemThemeChange);
    let active = true;
    void loadDashboard(() => active);
    return () => {
      active = false;
      themeMediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });

  function selectPracticePreset(minutes: 10 | 20 | 40 | 60) {
    selectedPracticeMinutes = minutes;
    selectedPracticePreset = minutes;
    customPracticeValue = String(minutes);
    customDurationError = '';
    planNotice = '';
  }

  function selectCustomPracticePreset() {
    selectedPracticePreset = 'custom';
    const minutes = Number(customPracticeValue);
    if (Number.isInteger(minutes) && minutes >= 5 && minutes <= 180) {
      selectedPracticeMinutes = minutes;
      customDurationError = '';
        planNotice = '';
    } else {
      customDurationError = 'Enter a whole number from 5 to 180 minutes.';
    }
  }

  function updateCustomPracticeDuration(event: Event) {
    customPracticeValue = (event.currentTarget as HTMLInputElement).value;
  }

  function commitCustomPracticeDuration() {
    const minutes = Number(customPracticeValue);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) {
      customDurationError = 'Enter a whole number from 5 to 180 minutes.';
      return false;
    }
    selectedPracticeMinutes = minutes;
    selectedPracticePreset = 'custom';
    customDurationError = '';
    planNotice = '';
    return true;
  }

  function acceptPracticePlan() {
    if (!practicePlan || (selectedPracticePreset === 'custom' && !commitCustomPracticeDuration())) {
      return;
    }
    const primaryTask =
      practicePlan.recommendations.find(
        (task) => task.kind === 'lesson-focus' || task.kind === 'skill-review'
      ) ?? practicePlan.recommendations[0];
    const focus = primaryTask?.title ?? 'Focused guitar practice';
    const query = new URLSearchParams({
      minutes: String(practicePlan.minutes),
      focus,
      source: 'today-plan'
    });
    window.location.assign(resolve('/practice') + '?' + query.toString() + '#practice-session');
  }

  function openPracticeTask(event: MouseEvent, task: {
    lessonId?: string;
    skillId?: string;
    title: string;
  }) {
    if (task.lessonId) return;
    event.preventDefault();
    if (task.skillId) {
      const query = new URLSearchParams({ skillId: task.skillId });
      window.location.assign(resolve('/skills') + '?' + query.toString());
      return;
    }
    const query = new URLSearchParams({
      minutes: String(selectedPracticeMinutes ?? 20),
      focus: task.title,
      source: 'today-task'
    });
    window.location.assign(resolve('/practice') + '?' + query.toString() + '#practice-session');
  }

  function openSkillReview(event: MouseEvent, skillId: string) {
    event.preventDefault();
    const query = new URLSearchParams({ skillId });
    window.location.assign(resolve('/skills') + '?' + query.toString());
  }

  function openPracticeHistory(event: MouseEvent) {
    event.preventDefault();
    window.location.assign(resolve('/practice') + '#practice-history');
  }

  function practiceTaskAction(task: { lessonId?: string; skillId?: string }) {
    return task.lessonId ? 'Open lesson' : task.skillId ? 'Review skill' : 'Practise this';
  }

  function dismissPracticePlan() {
    planDismissed = true;
    planNotice = 'Suggestions hidden for now. Your learning progress has not changed.';
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function formatDuration(seconds: number) {
    return seconds < 60 ? 'Under a minute' : Math.round(seconds / 60) + ' min';
  }
  function skillLabel(skillId: string) {
    return skillId.split(/[.-]/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }
  function phaseProgress(completed: number, total: number) {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }
</script>

<svelte:head>
  <title>GuitarLab — Your learning dashboard</title>
  <meta name="description" content="Your next guitar-learning step, practice target and evidence-based learning path." />
</svelte:head>

<div class="app-shell">
  <aside class="sidebar" aria-label="Main navigation">
    <a class="brand" href={resolve('/')}><Brand size="medium" tagline /></a>
    <div class="nav-label">YOUR WORKSPACE</div>
    <nav class="nav-list">
      <a class="nav-link active" href="#today" aria-current="page"><span class="nav-icon" aria-hidden="true"><Icon name="home" size={18} /></span> Today</a>
      <a class="nav-link" href={resolve('/learn')}><span class="nav-icon" aria-hidden="true"><Icon name="book-open" size={18} /></span> Curriculum</a>
      <a class="nav-link" href={resolve('/tools')}><span class="nav-icon" aria-hidden="true"><Icon name="toolbox" size={18} /></span> Tools</a>
      <a class="nav-link" href="#learning-path"><span class="nav-icon" aria-hidden="true"><Icon name="route" size={18} /></span> Learning path</a>
      <a class="nav-link" href={resolve('/skills')}><span class="nav-icon" aria-hidden="true"><Icon name="target" size={18} /></span> Skill states</a>
      <a class="nav-link" href="#reviews"><span class="nav-icon" aria-hidden="true"><Icon name="calendar-clock" size={18} /></span> Reviews</a>
      <a class="nav-link" href={resolve('/practice')}><span class="nav-icon" aria-hidden="true"><Icon name="metronome" size={18} /></span> Practice Studio</a>
      <a class="nav-link" href="#practice-history"><span class="nav-icon" aria-hidden="true"><Icon name="history" size={18} /></span> Practice history</a>
    </nav>
    <div class="sidebar-bottom">
      <div class="offline-indicator"><span></span> Your data stays on this device</div>
      <a class="nav-link" href={resolve('/onboarding')}><span class="nav-icon" aria-hidden="true"><Icon name="settings" size={18} /></span> Learning preferences</a>
      <a class="nav-link" href={resolve('/settings/data')}><span class="nav-icon" aria-hidden="true"><Icon name="download" size={18} /></span> Data &amp; backups</a>
    </div>
  </aside>

  <main class="main-area">
    <header class="topbar">
      <div class="mobile-brand" aria-hidden="true"><Brand size="small" /></div>
      <div class="breadcrumb">Workspace <span>/</span> Today</div>
      <div class="top-actions">
        <span class="status-pill"><i></i> Local-first learning</span>
        <a class="avatar" href={resolve('/onboarding')} aria-label="Learning preferences"><Icon name="external-link" size={16} /></a>
      </div>
    </header>

    <div class="page-content">
      <section class="welcome" id="today">
        <div><div class="eyebrow">YOUR PERSONAL PRACTICE SPACE</div><h1>Make room for <em>music.</em></h1><p>A clear next step, a flexible pace and progress based on what you can demonstrate.</p></div>
        <div class="welcome-actions">
          <a class="primary-button" href={resolve('/learn')}>Browse all lessons <Icon name="arrow-right" size={14} /></a>
          <a class="secondary-button" href={resolve('/onboarding')}>Learning preferences <Icon name="external-link" size={13} /></a>
        </div>
      </section>

      {#if isLoading}
        <div class="state-panel" role="status">Loading your local learning dashboard…</div>
      {:else if dashboardError}
        <div class="state-panel error-panel" role="alert">
          <strong>Dashboard unavailable</strong>
          <p>{dashboardError}</p>
          <div class="error-actions">
            <button type="button" class="secondary-button" onclick={() => void loadDashboard()}>
              Try again
            </button>
            <a class="text-link" href={resolve('/onboarding')}>Review your profile preferences <Icon name="external-link" size={13} /></a>
          </div>
        </div>
      {:else if dashboard}
        {#if dashboard.isFreshStart}
          <section class="fresh-state" aria-labelledby="fresh-title"><div class="fresh-icon" aria-hidden="true"><Icon name="sparkles" size={22} /></div><div class="fresh-copy"><div class="eyebrow">A FRESH START</div><h2 id="fresh-title">Your journey begins with the foundations.</h2><p>No previous lessons or skill levels have been assumed. Your first step is Year 1, Week 1. Week numbers are a route, not deadlines.</p></div></section>
        {/if}

        <section class="practice-planner panel" aria-labelledby="planner-title">
          <div class="planner-heading">
            <div>
              <div class="eyebrow">ADAPTIVE PRACTICE</div>
              <h2 id="planner-title">A focused plan for today</h2>
              <p>Suggestions use your next lesson and skills due for review. Change the time to fit your day.</p>
            </div>
            {#if practicePlan}
              <span class="neutral-tag">{practicePlan.allocatedMinutes} / {practicePlan.minutes} min planned</span>
            {/if}
          </div>

          <p class="duration-context">
            {#if dashboard.practiceMinutes}
              {#if selectedPracticeMinutes === dashboard.practiceMinutes}
                Using your saved {dashboard.practiceMinutes}-minute daily target. Changes here apply to today only.
              {:else}
                One-day override: {selectedPracticeMinutes ?? 'choose a duration'} min. Your saved {dashboard.practiceMinutes}-minute target is unchanged.
              {/if}
            {:else}
              This is a one-day plan. Save a usual duration in Learning preferences when you are ready.
            {/if}
          </p>
          <div class="duration-controls" role="group" aria-label="Today's practice duration">
            <button type="button" class:choice-active={selectedPracticePreset === 10} aria-pressed={selectedPracticePreset === 10} onclick={() => selectPracticePreset(10)}>10 min</button>
            <button type="button" class:choice-active={selectedPracticePreset === 20} aria-pressed={selectedPracticePreset === 20} onclick={() => selectPracticePreset(20)}>20 min</button>
            <button type="button" class:choice-active={selectedPracticePreset === 40} aria-pressed={selectedPracticePreset === 40} onclick={() => selectPracticePreset(40)}>40 min</button>
            <button type="button" class:choice-active={selectedPracticePreset === 60} aria-pressed={selectedPracticePreset === 60} onclick={() => selectPracticePreset(60)}>60 min</button>
            <button type="button" class:choice-active={selectedPracticePreset === 'custom'} aria-pressed={selectedPracticePreset === 'custom'} onclick={selectCustomPracticePreset}>Custom</button>
          </div>

          {#if selectedPracticePreset === 'custom'}
            <label class="custom-duration">
              Custom duration (5–180 minutes)
              <input
                type="number"
                min="5"
                max="180"
                step="1"
                value={customPracticeValue}
                oninput={updateCustomPracticeDuration}
                onblur={commitCustomPracticeDuration}
                aria-invalid={Boolean(customDurationError)}
                aria-describedby="custom-duration-help"
              />
            </label>
            <p class="duration-help" id="custom-duration-help">
              {customDurationError || 'Choose any whole-minute duration that works for you.'}
            </p>
          {/if}

          {#if planDismissed}
            <div class="planner-empty" role="status">
              <p>{planNotice}</p>
              <button type="button" class="planner-secondary" onclick={() => (planDismissed = false)}>Show suggestions</button>
            </div>
          {:else if practicePlan}
            {#if practicePlan.recommendations.length > 0}
              <div class="task-list">
                {#each practicePlan.recommendations as task (task.id)}
                  <article class="practice-task">
                    <div class="task-meta">
                      <span>{task.kind.replaceAll('-', ' ')}</span>
                      <span>{task.minutes} min</span>
                    </div>
                    <h3>{task.title}</h3>
                    <p>{task.reason}</p>
                    <a
                      class="task-action"
                      href={task.lessonId
                        ? resolve('/learn/[lessonId]', { lessonId: task.lessonId })
                        : task.skillId
                          ? resolve('/skills')
                          : resolve('/practice')}
                      onclick={(event) => openPracticeTask(event, task)}
                    >
                      {practiceTaskAction(task)} <Icon name="arrow-right" size={14} />
                    </a>
                  </article>
                {/each}
              </div>
            {:else}
              <div class="planner-empty">There is no suggested task yet. Continue with a lesson or record a skill assessment to build useful evidence.</div>
            {/if}
            <div class="planner-footer">
              <p>{practicePlan.remainingMinutes > 0
                ? `${practicePlan.remainingMinutes} min remain flexible. You do not need to fill every minute.`
                : 'The selected time is allocated. Take breaks whenever you need.'}</p>
              <div class="planner-actions">
                <button type="button" class="planner-primary" disabled={Boolean(customDurationError) || !practicePlan} onclick={acceptPracticePlan}>
                  Review in Practice Studio
                </button>
                <button type="button" class="planner-secondary" onclick={dismissPracticePlan}>Dismiss</button>
              </div>
            </div>
            {#if planNotice}
              <p class="planner-notice" role="status">{planNotice}</p>
            {/if}
          {:else}
            <div class="planner-empty" role="status">
              <p>Choose 10, 20, 40 or a custom duration to build today's plan. A fresh profile has no assumed practice-time preference.</p>
            </div>
          {/if}
          <p class="planner-guardrail">These are suggestions only. GuitarLab will not mark lessons complete or award skill mastery because a plan was selected or time was spent practising.</p>
        </section>

        <section class="hero-grid" aria-label="Today's learning">
          <article class="target-card">
            <div class="eyebrow">YOUR NEXT LEARNING TARGET</div>
            {#if dashboard.nextLesson}
              <div class="target-meta">YEAR 1 <span>·</span> WEEK {dashboard.nextLesson.week}{#if dashboard.currentPhase}<span>·</span>{dashboard.currentPhase}{/if}</div>
              <h2>{dashboard.nextLesson.title}</h2><p>{dashboard.nextLesson.focus}</p>
              <div class="target-footer"><span>{dashboard.nextLesson.estimatedMinutes} min lesson guide</span><a href={resolve('/learn/[lessonId]', { lessonId: dashboard.nextLesson.id })}>Open lesson <Icon name="arrow-right" size={14} /></a></div>
            {:else}
              <h2>Year 1 route complete</h2><p>You've completed every lesson in this route. Your learning record remains available for review.</p>
              <div class="target-footer"><span>{dashboard.completedLessons} lessons completed</span><a href="#learning-path">Review your path <Icon name="arrow-right" size={14} /></a></div>
            {/if}
          </article>
          <article class="practice-target">
            <div class="eyebrow">TODAY'S PRACTICE PLAN</div>
            {#if dashboard.practiceMinutes}
              <div class="practice-number">{dashboard.practiceMinutes}<small>min</small></div><h2>Your chosen daily target</h2><p>Use this as a flexible guide, not a quota. A shorter focused session is still useful.</p>
              <a class="text-link" href={resolve('/onboarding')}>Change practice target <Icon name="external-link" size={13} /></a>
            {:else}
              <div class="practice-symbol" aria-hidden="true"><Icon name="clock" size={30} /></div><h2>Choose a practice duration</h2><p>Set a time that fits your routine. You can change it whenever you need.</p>
              <a class="text-link" href={resolve('/onboarding')}>Set your practice target <Icon name="external-link" size={13} /></a>
            {/if}
          </article>
        </section>

        <section class="dashboard-grid">
          <article class="panel" id="reviews">
            <div class="panel-heading"><div><div class="eyebrow">SPACED REVIEW</div><h2>Skills ready to revisit</h2></div><span class="neutral-tag">{dashboard.dueReviews.length} due</span></div>
            {#if dashboard.dueReviews.length > 0}
              <ul class="review-list">
                {#each dashboard.dueReviews as review (review.skillId)}
                  <li>
                    <a class="review-link" href={resolve('/skills')} onclick={(event) => openSkillReview(event, review.skillId)}>
                      <span class="review-dot" aria-hidden="true"></span>
                      <strong>{skillLabel(review.skillId)}</strong>
                      <span class="review-date">Due {formatDate(review.nextReviewAt)}</span>
                      <span class="review-open" aria-hidden="true"><Icon name="arrow-right" size={14} /></span>
                    </a>
                  </li>
                {/each}
              </ul>
            {:else}
              <div class="empty-state"><span class="empty-symbol" aria-hidden="true"><Icon name="check" size={17} /></span><div><strong>No reviews due right now</strong><p>Skills appear here when an assessment schedules a review. Lesson completion alone does not create mastery.</p></div></div>
            {/if}
          </article>
          <article class="panel" id="practice-history">
            <div class="panel-heading">
              <div><div class="eyebrow">RECENT EVIDENCE</div><h2>Practice history</h2></div>
              <a class="panel-action" href={resolve('/practice')} onclick={openPracticeHistory}>View all sessions <Icon name="arrow-right" size={14} /></a>
            </div>
            {#if dashboard.recentPractice.length > 0}
              <ul class="session-list">{#each dashboard.recentPractice as session (session.id)}<li><span class="session-mark" aria-hidden="true"><Icon name="history" size={16} /></span><span class="session-copy"><strong>{session.focus ?? 'Practice session'}</strong><small>{formatDate(session.startedAt)}{session.status === 'paused' ? ' · Paused' : session.status === 'in_progress' ? ' · In progress' : ''}</small></span><span class="session-duration">{formatDuration(session.actualDurationSeconds)}</span></li>{/each}</ul>
            {:else}
              <div class="empty-state"><span class="empty-symbol" aria-hidden="true"><Icon name="circle" size={16} /></span><div><strong>Your first session is still ahead</strong><p>Completed practice sessions will appear here. Time spent practising is separate from skill assessments.</p></div></div>
            {/if}
          </article>
        </section>

        {#if shouldShowBackupReminder(lastBackupExportAt)}
          <section class="backup-reminder" id="backup-reminder" aria-label="Backup reminder">
            <div class="backup-reminder-copy">
              <div class="eyebrow">KEEP YOUR PROGRESS SAFE</div>
              <h2>Keep a copy of your learning data.</h2>
              {#if lastBackupExportAt === null}
                <p>No backup download has been started from this browser yet. Your profile is stored here, so create a copy before clearing site data or changing devices.</p>
              {:else}
                <p>Your last backup download started {new Date(lastBackupExportAt).toLocaleDateString()}. Create a fresh copy before clearing site data or changing devices.</p>
              {/if}
            </div>
            <a class="backup-reminder-action" href={resolve('/settings/data')}>Open backup settings <Icon name="arrow-right" size={14} /></a>
          </section>
        {/if}

        <section class="learning-path" id="learning-path" aria-labelledby="path-title">
          <div class="section-heading"><div><div class="eyebrow">YOUR CURRICULUM</div><h2 id="path-title">Year 1 learning path</h2><p>Four flexible phases, from first notes to independent playing.</p></div><span class="neutral-tag">{dashboard.completedLessons} / {dashboard.totalLessons} lessons complete</span></div>
          <div class="phase-grid">
            {#each dashboard.phases as phase (phase.id)}
              <article class:current-phase={phase.isCurrent} class="phase-card">
                <div class="phase-top"><span>WEEKS {phase.firstWeek}–{phase.lastWeek}</span>{#if phase.isCurrent}<span class="current-label">CURRENT</span>{/if}</div>
                <h3>{phase.title}</h3><p>{phase.goal}</p>
                <div class="phase-progress" role="progressbar" aria-label={'Progress: ' + phase.title} aria-valuemin="0" aria-valuemax={phase.totalLessons} aria-valuenow={phase.completedLessons}><span style={'width: ' + phaseProgress(phase.completedLessons, phase.totalLessons) + '%'}></span></div>
                <div class="phase-count">{phase.completedLessons} of {phase.totalLessons} lessons completed</div>
                <a class="phase-action" href={resolve('/learn')}>Browse Year 1 lessons <Icon name="arrow-right" size={14} /></a>
              </article>
            {/each}
          </div>
          <p class="path-note">The route is a guide, not a deadline. Repeat, pause or revisit a lesson whenever that helps you learn securely.</p>
        </section>
      {/if}

      <footer><span>GuitarLab · Learn. Practise. Master.</span><span>Built for thoughtful, independent learning.</span></footer>
    </div>
  </main>
</div>

<style>
  .app-shell{min-height:100vh;display:grid;grid-template-columns:250px minmax(0,1fr);background:var(--bg)}.sidebar{position:sticky;top:0;height:100vh;padding:28px 18px 20px;border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--surface)}.brand{display:flex;align-items:center;padding:0 8px 38px;text-decoration:none}.nav-label,.eyebrow{font-size:10px;font-weight:750;letter-spacing:1.35px;color:var(--muted)}.nav-label{padding:0 11px 12px}.nav-list{display:grid;gap:5px}.nav-link{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;color:var(--muted);font-size:13px}.nav-link .nav-icon{display:grid;place-items:center;width:18px;flex:none}.nav-link:hover,.nav-link.active{background:var(--surface-raised);color:var(--text)}.nav-link.active{box-shadow:inset 2px 0 var(--primary)}.sidebar-bottom{margin-top:auto;display:grid;gap:12px}.offline-indicator{font-size:11px;color:var(--muted);padding:12px 10px;border-top:1px solid var(--border)}.offline-indicator span,.status-pill i{display:inline-block;width:7px;height:7px;background:var(--success);border-radius:50%;margin-right:7px}.main-area{min-width:0}.topbar{height:70px;padding:0 clamp(20px,4vw,54px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)}.breadcrumb{font-size:12px;color:var(--muted)}.breadcrumb span{padding:0 8px;color:var(--border)}.top-actions{display:flex;align-items:center;gap:13px}.status-pill,.neutral-tag{font-size:10px;color:var(--muted);border:1px solid var(--border);padding:7px 10px;border-radius:99px}.status-pill i{width:6px;height:6px}.avatar{border:1px solid var(--border);background:var(--surface);color:var(--primary);width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700}.appearance-control select{min-width:104px;min-height:44px;padding:0 27px 0 10px;border:1px solid var(--control-border);border-radius:var(--radius-control);background:var(--surface);color:var(--text);font:inherit;font-size:13px;font-weight:700}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.mobile-brand{display:none}.mobile-brand :global(svg){flex:none}
  .page-content{max-width:var(--content);margin:0 auto;padding:44px clamp(20px,4vw,54px) 24px}.welcome{display:flex;align-items:end;justify-content:space-between;gap:25px;margin-bottom:28px}.welcome h1{font:500 clamp(36px,5vw,58px)/1.08 Georgia,serif;letter-spacing:-2px;margin:12px 0}.welcome h1 em{color:var(--primary)}.welcome p{color:var(--muted);font-size:13px;line-height:1.7;margin:0}.secondary-button{border:1px solid var(--border);border-radius:10px;padding:12px 15px;font-size:11px;white-space:nowrap}.secondary-button :global(svg){margin-left:8px;color:var(--primary)}.fresh-state{display:flex;align-items:center;gap:18px;padding:19px 21px;border:1px solid color-mix(in srgb,var(--primary) 35%,var(--border));background:color-mix(in srgb,var(--primary) 7%,var(--surface));border-radius:var(--radius);margin-bottom:17px}.fresh-icon{width:42px;height:42px;flex:none;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--primary) 16%,transparent);color:var(--primary);font-size:22px}.fresh-copy{flex:1}.fresh-copy h2{font-size:15px;margin:5px 0 4px}.fresh-copy p{font-size:12px;line-height:1.6;color:var(--muted);margin:0}.state-panel{padding:20px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);font-size:13px;color:var(--muted)}.error-panel{border-color:var(--danger)}.error-panel strong{color:var(--text)}.error-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:12px}.error-actions .secondary-button{min-height:44px;background:var(--surface-raised);color:var(--text);font-size:12px}.error-actions .text-link{display:inline-flex;align-items:center;min-height:44px}.error-panel p{font-size:12px;line-height:1.6}.text-link{font-size:11px;color:var(--primary);font-weight:750}
  .hero-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:14px;margin-bottom:15px}.target-card,.practice-target,.panel,.phase-card{border:1px solid var(--border);background:var(--surface);border-radius:var(--radius)}.target-card{padding:25px;min-height:220px;display:flex;flex-direction:column}.target-meta{display:flex;gap:8px;align-items:center;font-size:9px;letter-spacing:1px;font-weight:750;color:var(--primary);margin-top:20px}.target-meta span{color:var(--muted)}.target-card h2{font:500 clamp(25px,3vw,34px)/1.2 Georgia,serif;margin:9px 0 6px}.target-card>p,.practice-target>p{font-size:12px;color:var(--muted);line-height:1.65;margin:0}.target-footer{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:auto;padding-top:22px;font-size:10px;color:var(--muted)}.target-footer a{font-size:11px;color:var(--primary);font-weight:750}.target-footer :global(svg){flex:none;margin-left:6px}.practice-target{padding:23px;display:flex;flex-direction:column;align-items:flex-start}.practice-number{font:500 42px/1 Georgia,serif;color:var(--primary);margin:19px 0 9px}.practice-number small{font:500 14px system-ui;color:var(--muted);padding-left:5px}.practice-symbol{font-size:30px;color:var(--primary);margin:20px 0 7px}.practice-target h2{font-size:15px;margin:0 0 7px}.practice-target>p{margin-bottom:16px}.practice-target .text-link{margin-top:auto}
  .practice-planner{margin:0 0 15px;padding:23px}.planner-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.planner-heading h2{font-size:18px;margin:7px 0}.planner-heading p{font-size:11px;line-height:1.6;color:var(--muted);margin:0;max-width:570px}.duration-controls{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 16px}.duration-controls button,.planner-primary,.planner-secondary{border:1px solid var(--border);border-radius:9px;padding:9px 13px;background:var(--surface-raised);color:var(--text);font:inherit;font-size:11px;cursor:pointer}.duration-controls button.choice-active{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 12%,var(--surface));color:var(--text)}.duration-controls button:focus-visible,.planner-primary:focus-visible,.planner-secondary:focus-visible,.custom-duration input:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.custom-duration{display:grid;gap:7px;max-width:240px;font-size:11px;font-weight:650}.custom-duration input{width:100%;min-height:39px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-raised);color:var(--text)}.duration-help{font-size:10px;color:var(--muted);margin:7px 0 14px}.task-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.practice-task{min-width:0;padding:15px;border:1px solid var(--border);border-radius:11px;background:var(--surface-raised)}.task-meta{display:flex;justify-content:space-between;gap:10px;color:var(--muted);font-size:9px;text-transform:capitalize;letter-spacing:.4px}.task-meta span:last-child{white-space:nowrap;color:var(--primary);font-weight:750}.practice-task h3{font-size:12px;margin:10px 0 6px}.practice-task p{font-size:10px;line-height:1.6;color:var(--muted);margin:0}.task-action{display:inline-flex;align-items:center;gap:7px;min-height:44px;margin-top:9px;color:var(--primary);font-size:11px;font-weight:750;text-decoration:none}.duration-context{font-size:11px;line-height:1.55;color:var(--muted);margin:0}.planner-footer{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:16px}.planner-footer>p,.planner-guardrail,.planner-notice{font-size:10px;line-height:1.6;color:var(--muted);margin:0}.planner-actions{display:flex;gap:8px;flex-wrap:wrap}.planner-primary{background:var(--primary);border-color:var(--primary);color:var(--primary-ink);font-weight:750}.planner-primary:disabled{opacity:.55;cursor:not-allowed}.planner-empty{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px;border:1px dashed var(--border);border-radius:10px;font-size:11px;color:var(--muted)}.planner-empty p{margin:0}.planner-notice{margin-top:12px;color:var(--text)}.planner-guardrail{border-top:1px solid var(--border);padding-top:13px;margin-top:16px}
    .dashboard-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:37px}.panel{padding:21px;min-width:0}.panel-heading{display:flex;justify-content:space-between;gap:12px;align-items:center}.panel-heading h2{font-size:15px;margin:7px 0 0}.neutral-tag{white-space:nowrap}.empty-state{display:flex;align-items:flex-start;gap:13px;margin-top:21px;padding-top:17px;border-top:1px solid var(--border)}.empty-symbol{width:28px;height:28px;flex:none;border-radius:9px;background:var(--surface-raised);display:grid;place-items:center;color:var(--success)}.empty-state strong{font-size:11px}.empty-state p{font-size:10px;line-height:1.6;color:var(--muted);margin:5px 0 0}.review-list,.session-list{list-style:none;margin:19px 0 0;padding:0}.review-list li,.session-list li{display:flex;align-items:center;gap:10px;padding:0;border-top:1px solid var(--border);font-size:11px}.review-link{display:flex;align-items:center;gap:10px;min-height:48px;width:100%;color:var(--text);text-decoration:none}.review-link:hover strong,.panel-action:hover,.phase-action:hover{color:var(--primary)}.review-open{color:var(--primary);margin-left:3px}.panel-action{display:inline-flex;align-items:center;gap:6px;font-size:10px;color:var(--primary);font-weight:750}.review-dot{width:7px;height:7px;flex:none;border-radius:50%;background:var(--warning)}.review-date,.session-duration{margin-left:auto;color:var(--muted);font-size:10px}.session-mark{display:grid;place-items:center;flex:none;color:var(--primary)}.session-copy{display:grid;gap:3px}.session-copy strong{font-size:11px}.session-copy small{font-size:10px;color:var(--muted)}
  .backup-reminder{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 18px;margin:0 0 35px;border:1px solid var(--border);border-radius:12px;background:var(--surface-raised)}.backup-reminder-copy{display:grid;gap:5px}.backup-reminder h2{font-size:12px;margin:0}.backup-reminder p{font-size:10px;line-height:1.6;color:var(--muted);margin:0}.backup-reminder-action{display:inline-flex;align-items:center;gap:6px;min-height:44px;color:var(--primary);font-size:11px;font-weight:750;white-space:nowrap}
  .learning-path{margin-bottom:35px}.section-heading{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:16px}.section-heading h2{font-size:20px;margin:7px 0 5px}.section-heading p{font-size:11px;color:var(--muted);margin:0}.phase-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.phase-card{padding:17px;min-width:0}.phase-card.current-phase{border-color:color-mix(in srgb,var(--primary) 65%,var(--border));background:color-mix(in srgb,var(--primary) 5%,var(--surface))}.phase-top{display:flex;justify-content:space-between;gap:6px;font-size:8px;letter-spacing:.8px;color:var(--muted);font-weight:750}.current-label{color:var(--primary)}.phase-card h3{font:500 19px/1.2 Georgia,serif;margin:17px 0 7px}.phase-card>p{font-size:10px;line-height:1.6;color:var(--muted);min-height:64px;margin:0 0 15px}.phase-progress{height:5px;border-radius:9px;background:var(--surface-raised);overflow:hidden}.phase-progress span{display:block;height:100%;border-radius:9px;background:var(--primary)}.phase-count{font-size:9px;color:var(--muted);margin-top:8px}.phase-action{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin-top:6px;color:var(--primary);font-size:10px;font-weight:750;text-decoration:none}.path-note{font-size:10px;line-height:1.6;color:var(--muted);margin:13px 0 0}footer{display:flex;justify-content:space-between;gap:15px;border-top:1px solid var(--border);padding-top:17px;margin-top:30px;color:var(--muted);font-size:10px}
  @media(max-width:1050px){.phase-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.phase-card>p{min-height:44px}}@media(max-width:900px){.app-shell{grid-template-columns:205px minmax(0,1fr)}.hero-grid,.dashboard-grid{grid-template-columns:1fr}.section-heading{align-items:flex-start;flex-direction:column}}@media(max-width:650px){.task-list{grid-template-columns:1fr}.planner-heading{flex-direction:column}.planner-footer{align-items:flex-start;flex-direction:column}.app-shell{display:block}.sidebar{display:none}.topbar{height:60px;padding:0 17px}.mobile-brand{display:flex;align-items:center;gap:9px;border:0;background:transparent;color:var(--text);font-size:14px}.breadcrumb,.status-pill{display:none}.appearance-control select{min-width:92px;padding-inline:7px}.page-content{padding:32px 17px 22px}.welcome{align-items:flex-start;flex-direction:column;gap:17px}.welcome h1{font-size:42px}.secondary-button{width:100%;text-align:center}.fresh-state{align-items:flex-start;padding:16px}.target-card{padding:20px;min-height:215px}.target-footer{align-items:flex-start;flex-direction:column}.practice-target{min-height:200px}.phase-grid{grid-template-columns:1fr}.phase-card>p{min-height:0}.panel{padding:18px}footer{flex-direction:column}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}

  .welcome-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;flex:none}
  .primary-button,.secondary-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:750;white-space:nowrap}
  .primary-button{background:var(--primary);color:var(--primary-ink);border:1px solid var(--primary)}
  .primary-button:hover{filter:brightness(1.06)}
  .primary-button:focus-visible,.secondary-button:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  .secondary-button{border:1px solid var(--border);background:var(--surface);color:var(--text)}
  @media(max-width:900px){.welcome{align-items:flex-start;flex-direction:column;gap:17px}.welcome-actions{width:100%}}
  @media(max-width:720px){.welcome{align-items:flex-start;flex-direction:column;margin-bottom:16px}.welcome p{display:none}.welcome-actions{width:100%}.welcome-actions a{flex:1}.backup-reminder{align-items:flex-start;flex-direction:column}}
  


  /* The dashboard is a learning surface, not a compact analytics table. */
  .welcome p {
    font-size: var(--font-size-body);
    line-height: var(--line-height-body);
  }

  .nav-link {
    font-size: var(--font-size-supporting);
  }

  .offline-indicator {
    font-size: var(--font-size-metadata);
  }

  .target-card > p,
  .practice-target > p,
  .practice-task p,
  .fresh-copy p,
  .planner-heading p,
  .duration-context,
  .planner-footer > p,
  .planner-guardrail,
  .planner-notice,
  .error-panel p,
  .empty-state p,
  .backup-reminder p,
  .section-heading p,
  .phase-card > p,
  .path-note {
    font-size: var(--font-size-supporting);
    line-height: var(--line-height-body);
  }

  .fresh-copy h2,
  .practice-task h3,
  .panel-heading h2,
  .backup-reminder h2 {
    font-size: var(--font-size-panel-title);
    line-height: var(--line-height-heading);
  }

  .review-list li,
  .session-list li,
  .session-copy strong {
    font-size: var(--font-size-supporting);
  }

  .text-link,
  .panel-action,
  .task-action,
  .phase-action,
  .backup-reminder-action {
    font-size: var(--font-size-supporting);
  }

  .task-meta {
    font-size: var(--font-size-metadata);
  }

  .practice-task {
    padding: 18px;
  }

  .empty-state p {
    max-width: 58ch;
  }

  .phase-card > p {
    min-height: 0;
  }

  @media (max-width: 650px) {
    .target-card > p,
    .practice-target > p,
    .planner-heading p,
    .duration-context,
    .planner-footer > p,
    .planner-guardrail,
    .planner-notice,
    .error-panel p,
    .empty-state p,
    .backup-reminder p,
    .section-heading p,
    .phase-card > p,
    .path-note {
      font-size: 0.9375rem;
    }
  }

  @media (max-width: 760px) {
    .app-shell {
      display: block;
    }
    .sidebar,
    .topbar {
      display: none;
    }
  }

</style>
