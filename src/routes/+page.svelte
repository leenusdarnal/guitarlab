<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { loadActiveLearnerDashboard } from '../lib/storage/indexeddb';
  import type { DashboardSnapshot } from '../lib/application/dashboard';
  import {
    buildPracticePlan,
    type PracticePlanPreset
  } from '../lib/application/practice-plan';

  let theme = $state<'dark' | 'light'>('dark');
  let menuOpen = $state(false);
  let dashboard = $state<DashboardSnapshot | null>(null);
  let isLoading = $state(true);
  let dashboardError = $state('');
  let selectedPracticeMinutes = $state<number | null>(null);
  let selectedPracticePreset = $state<PracticePlanPreset | null>(null);
  let customPracticeValue = $state('30');
  let customDurationError = $state('');
  let planDismissed = $state(false);
  let planAccepted = $state(false);
  let planNotice = $state('');
  let practicePlan = $derived(
    dashboard && selectedPracticeMinutes !== null
      ? buildPracticePlan({
          minutes: selectedPracticeMinutes,
          preset:
            selectedPracticePreset ??
            (selectedPracticeMinutes === 10 ||
            selectedPracticeMinutes === 20 ||
            selectedPracticeMinutes === 40
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

  onMount(() => {
    const stored = window.localStorage.getItem('guitarlab-theme');
    if (stored === 'light' || stored === 'dark') theme = stored;
    document.documentElement.dataset.theme = theme;
    let active = true;
    void loadActiveLearnerDashboard()
      .then((snapshot) => {
        if (active) {
          dashboard = snapshot;
          selectedPracticeMinutes = snapshot.practiceMinutes;
          selectedPracticePreset =
            selectedPracticeMinutes === null
              ? null
              : selectedPracticeMinutes === 10 ||
                  selectedPracticeMinutes === 20 ||
                  selectedPracticeMinutes === 40
                ? selectedPracticeMinutes
                : 'custom';
          customPracticeValue =
            selectedPracticeMinutes === null ? '30' : String(selectedPracticeMinutes);
        }
      })
      .catch(() => { if (active) dashboardError = 'Your local learning data could not be loaded. Check browser storage and try again.'; })
      .finally(() => { if (active) isLoading = false; });
    return () => { active = false; };
  });

  function selectPracticePreset(minutes: 10 | 20 | 40) {
    selectedPracticeMinutes = minutes;
    selectedPracticePreset = minutes;
    customPracticeValue = String(minutes);
    customDurationError = '';
    planAccepted = false;
    planNotice = '';
  }

  function selectCustomPracticePreset() {
    selectedPracticePreset = 'custom';
    const minutes = Number(customPracticeValue);
    if (Number.isInteger(minutes) && minutes >= 5 && minutes <= 180) {
      selectedPracticeMinutes = minutes;
      customDurationError = '';
      planAccepted = false;
      planNotice = '';
    } else {
      customDurationError = 'Enter a whole number from 5 to 180 minutes.';
    }
  }

  function updateCustomPracticeDuration(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    customPracticeValue = input.value;
    const minutes = Number(input.value);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) {
      customDurationError = 'Enter a whole number from 5 to 180 minutes.';
      return;
    }
    selectedPracticeMinutes = minutes;
    selectedPracticePreset = 'custom';
    customDurationError = '';
    planAccepted = false;
    planNotice = '';
  }

  function acceptPracticePlan() {
    planAccepted = true;
    planDismissed = false;
    planNotice =
      'Plan selected. This does not record practice, complete lessons or change skill mastery.';
  }

  function dismissPracticePlan() {
    planDismissed = true;
    planAccepted = false;
    planNotice = 'Suggestions hidden for now. Your learning progress has not changed.';
  }

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('guitarlab-theme', theme);
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
  <meta name="theme-color" content={theme === 'dark' ? '#171715' : '#f5f3ed'} />
</svelte:head>

<div class="app-shell">
  <aside class="sidebar" aria-label="Main navigation">
    <a class="brand" href={resolve('/')} aria-label="GuitarLab home"><span class="brand-mark">G</span><span><strong>GuitarLab</strong><small>LEARN. PRACTISE. MASTER.</small></span></a>
    <div class="nav-label">YOUR WORKSPACE</div>
    <nav class="nav-list">
      <a class="nav-link active" href="#today" aria-current="page"><span aria-hidden="true">⌂</span> Today</a>
      <a class="nav-link" href={resolve('/learn')}><span aria-hidden="true">♫</span> Curriculum</a>
      <a class="nav-link" href={resolve('/tools')}><span aria-hidden="true">♬</span> Music tools</a>
      <a class="nav-link" href="#learning-path"><span aria-hidden="true">▤</span> Learning path</a>
      <a class="nav-link" href="#reviews"><span aria-hidden="true">◷</span> Reviews</a>
      <a class="nav-link" href="#practice-history"><span aria-hidden="true">◉</span> Practice history</a>
    </nav>
    <div class="sidebar-bottom">
      <div class="offline-indicator"><span></span> Your data stays on this device</div>
      <a class="nav-link" href={resolve('/onboarding')}><span aria-hidden="true">⚙</span> Learning preferences</a>
      <a class="nav-link" href={resolve('/settings/data')}><span aria-hidden="true">↓</span> Data &amp; backups</a>
    </div>
  </aside>

  <main class="main-area">
    <header class="topbar">
      <button class="mobile-brand" onclick={() => (menuOpen = !menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label="Toggle navigation">☰ <strong>GuitarLab</strong></button>
      <div class="breadcrumb">Workspace <span>/</span> Today</div>
      <div class="top-actions"><span class="status-pill"><i></i> Local-first learning</span><button class="icon-button" onclick={toggleTheme} aria-label="Toggle colour theme" title="Toggle theme">{theme === 'dark' ? '☼' : '☾'}</button><a class="avatar" href={resolve('/onboarding')} aria-label="Learning preferences">↗</a></div>
    </header>

    {#if menuOpen}
      <nav class="mobile-menu" id="mobile-navigation" aria-label="Mobile navigation">
        <a href="#today" onclick={() => (menuOpen = false)}>Today</a>
        <a href={resolve('/learn')}>Curriculum</a>
        <a href={resolve('/tools')}>Music tools</a>
        <a href="#learning-path" onclick={() => (menuOpen = false)}>Learning path</a>
        <a href="#reviews" onclick={() => (menuOpen = false)}>Reviews</a>
        <a href="#practice-history" onclick={() => (menuOpen = false)}>Practice history</a>
        <a href={resolve('/onboarding')}>Learning preferences</a>
        <a href={resolve('/settings/data')}>Data &amp; backups</a>
      </nav>
    {/if}

    <div class="page-content">
      <section class="welcome" id="today">
        <div><div class="eyebrow">YOUR PERSONAL PRACTICE SPACE</div><h1>Make room for <em>music.</em></h1><p>A clear next step, a flexible pace and progress based on what you can demonstrate.</p></div>
        <a class="secondary-button" href={resolve('/onboarding')}>Learning preferences <span>↗</span></a>
      </section>

      {#if isLoading}
        <div class="state-panel" role="status">Loading your local learning dashboard…</div>
      {:else if dashboardError}
        <div class="state-panel error-panel" role="alert"><strong>Dashboard unavailable</strong><p>{dashboardError}</p><a class="text-link" href={resolve('/onboarding')}>Review your profile settings ↗</a></div>
      {:else if dashboard}
        {#if dashboard.isFreshStart}
          <section class="fresh-state" aria-labelledby="fresh-title"><div class="fresh-icon" aria-hidden="true">✳</div><div class="fresh-copy"><div class="eyebrow">A FRESH START</div><h2 id="fresh-title">Your journey begins with the foundations.</h2><p>No previous lessons or skill levels have been assumed. Your first step is Year 1, Week 1. Week numbers are a route, not deadlines.</p></div></section>
        {/if}

        <section class="hero-grid" aria-label="Today's learning">
          <article class="target-card">
            <div class="eyebrow">YOUR NEXT LEARNING TARGET</div>
            {#if dashboard.nextLesson}
              <div class="target-meta">YEAR 1 <span>·</span> WEEK {dashboard.nextLesson.week}{#if dashboard.currentPhase}<span>·</span>{dashboard.currentPhase}{/if}</div>
              <h2>{dashboard.nextLesson.title}</h2><p>{dashboard.nextLesson.focus}</p>
              <div class="target-footer"><span>{dashboard.nextLesson.estimatedMinutes} min lesson guide</span><a href={resolve('/learn/[lessonId]', { lessonId: dashboard.nextLesson.id })}>Open lesson <b>→</b></a></div>
            {:else}
              <h2>Year 1 route complete</h2><p>You've completed every lesson in this route. Your learning record remains available for review.</p>
              <div class="target-footer"><span>{dashboard.completedLessons} lessons completed</span><a href="#learning-path">Review your path <b>→</b></a></div>
            {/if}
          </article>
          <article class="practice-target">
            <div class="eyebrow">TODAY'S PRACTICE PLAN</div>
            {#if dashboard.practiceMinutes}
              <div class="practice-number">{dashboard.practiceMinutes}<small>min</small></div><h2>Your chosen daily target</h2><p>Use this as a flexible guide, not a quota. A shorter focused session is still useful.</p>
              <a class="text-link" href={resolve('/onboarding')}>Change practice target ↗</a>
            {:else}
              <div class="practice-symbol" aria-hidden="true">◷</div><h2>Choose a practice duration</h2><p>Set a time that fits your routine. You can change it whenever you need.</p>
              <a class="text-link" href={resolve('/onboarding')}>Set your practice target ↗</a>
            {/if}
          </article>
        </section>

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

          <div class="duration-controls" role="group" aria-label="Practice duration">
            <button type="button" class:choice-active={selectedPracticePreset === 10} aria-pressed={selectedPracticePreset === 10} onclick={() => selectPracticePreset(10)}>10 min</button>
            <button type="button" class:choice-active={selectedPracticePreset === 20} aria-pressed={selectedPracticePreset === 20} onclick={() => selectPracticePreset(20)}>20 min</button>
            <button type="button" class:choice-active={selectedPracticePreset === 40} aria-pressed={selectedPracticePreset === 40} onclick={() => selectPracticePreset(40)}>40 min</button>
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
                <button type="button" class="planner-primary" disabled={Boolean(customDurationError)} onclick={acceptPracticePlan}>
                  {planAccepted ? 'Plan selected' : 'Use this plan'}
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

        <section class="dashboard-grid">
          <article class="panel" id="reviews">
            <div class="panel-heading"><div><div class="eyebrow">SPACED REVIEW</div><h2>Skills ready to revisit</h2></div><span class="neutral-tag">{dashboard.dueReviews.length} due</span></div>
            {#if dashboard.dueReviews.length > 0}
              <ul class="review-list">{#each dashboard.dueReviews as review (review.skillId)}<li><span class="review-dot" aria-hidden="true"></span><strong>{skillLabel(review.skillId)}</strong><span class="review-date">Due {formatDate(review.nextReviewAt)}</span></li>{/each}</ul>
            {:else}
              <div class="empty-state"><span class="empty-symbol" aria-hidden="true">✓</span><div><strong>No reviews due right now</strong><p>Skills appear here when an assessment schedules a review. Lesson completion alone does not create mastery.</p></div></div>
            {/if}
          </article>
          <article class="panel" id="practice-history">
            <div class="panel-heading"><div><div class="eyebrow">RECENT EVIDENCE</div><h2>Practice history</h2></div><span class="neutral-tag">Latest 3</span></div>
            {#if dashboard.recentPractice.length > 0}
              <ul class="session-list">{#each dashboard.recentPractice as session (session.id)}<li><span class="session-mark" aria-hidden="true">◉</span><span class="session-copy"><strong>{session.focus ?? 'Practice session'}</strong><small>{formatDate(session.startedAt)}</small></span><span class="session-duration">{formatDuration(session.actualDurationSeconds)}</span></li>{/each}</ul>
            {:else}
              <div class="empty-state"><span class="empty-symbol" aria-hidden="true">○</span><div><strong>Your first session is still ahead</strong><p>Completed practice sessions will appear here. Time spent practising is separate from skill assessments.</p></div></div>
            {/if}
          </article>
        </section>

        <section class="learning-path" id="learning-path" aria-labelledby="path-title">
          <div class="section-heading"><div><div class="eyebrow">YOUR CURRICULUM</div><h2 id="path-title">Year 1 learning path</h2><p>Four flexible phases, from first notes to independent playing.</p></div><span class="neutral-tag">{dashboard.completedLessons} / {dashboard.totalLessons} lessons complete</span></div>
          <div class="phase-grid">
            {#each dashboard.phases as phase (phase.id)}
              <article class:current-phase={phase.isCurrent} class="phase-card">
                <div class="phase-top"><span>WEEKS {phase.firstWeek}–{phase.lastWeek}</span>{#if phase.isCurrent}<span class="current-label">CURRENT</span>{/if}</div>
                <h3>{phase.title}</h3><p>{phase.goal}</p>
                <div class="phase-progress" role="progressbar" aria-label={'Progress: ' + phase.title} aria-valuemin="0" aria-valuemax={phase.totalLessons} aria-valuenow={phase.completedLessons}><span style={'width: ' + phaseProgress(phase.completedLessons, phase.totalLessons) + '%'}></span></div>
                <div class="phase-count">{phase.completedLessons} of {phase.totalLessons} lessons completed</div>
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
  .app-shell{min-height:100vh;display:grid;grid-template-columns:250px minmax(0,1fr);background:var(--bg)}.sidebar{position:sticky;top:0;height:100vh;padding:28px 18px 20px;border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--surface)}.brand{display:flex;align-items:center;gap:11px;padding:0 8px 38px}.brand-mark{width:38px;height:38px;border-radius:12px;background:var(--primary);color:var(--primary-ink);display:grid;place-items:center;font:700 25px Georgia,serif}.brand strong{display:block;font-size:16px}.brand small{display:block;color:var(--muted);font-size:8px;letter-spacing:1.25px;margin-top:3px}.nav-label,.eyebrow{font-size:10px;font-weight:750;letter-spacing:1.35px;color:var(--muted)}.nav-label{padding:0 11px 12px}.nav-list{display:grid;gap:5px}.nav-link{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;color:var(--muted);font-size:13px}.nav-link span{width:18px;text-align:center;font-size:17px}.nav-link:hover,.nav-link.active{background:var(--surface-raised);color:var(--text)}.nav-link.active{box-shadow:inset 2px 0 var(--primary)}.sidebar-bottom{margin-top:auto;display:grid;gap:12px}.offline-indicator{font-size:11px;color:var(--muted);padding:12px 10px;border-top:1px solid var(--border)}.offline-indicator span,.status-pill i{display:inline-block;width:7px;height:7px;background:var(--success);border-radius:50%;margin-right:7px}.main-area{min-width:0}.topbar{height:70px;padding:0 clamp(20px,4vw,54px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)}.breadcrumb{font-size:12px;color:var(--muted)}.breadcrumb span{padding:0 8px;color:var(--border)}.top-actions{display:flex;align-items:center;gap:13px}.status-pill,.neutral-tag{font-size:10px;color:var(--muted);border:1px solid var(--border);padding:7px 10px;border-radius:99px}.status-pill i{width:6px;height:6px}.icon-button,.avatar{border:1px solid var(--border);background:var(--surface);color:var(--text);width:34px;height:34px;border-radius:50%;display:grid;place-items:center;cursor:pointer}.avatar{font-size:12px;color:var(--primary);font-weight:700}.mobile-brand,.mobile-menu{display:none}
  .page-content{max-width:var(--content);margin:0 auto;padding:44px clamp(20px,4vw,54px) 24px}.welcome{display:flex;align-items:end;justify-content:space-between;gap:25px;margin-bottom:28px}.welcome h1{font:500 clamp(36px,5vw,58px)/1.08 Georgia,serif;letter-spacing:-2px;margin:12px 0}.welcome h1 em{color:var(--primary)}.welcome p{color:var(--muted);font-size:13px;line-height:1.7;margin:0}.secondary-button{border:1px solid var(--border);border-radius:10px;padding:12px 15px;font-size:11px;white-space:nowrap}.secondary-button span{padding-left:8px;color:var(--primary)}.fresh-state{display:flex;align-items:center;gap:18px;padding:19px 21px;border:1px solid color-mix(in srgb,var(--primary) 35%,var(--border));background:color-mix(in srgb,var(--primary) 7%,var(--surface));border-radius:var(--radius);margin-bottom:17px}.fresh-icon{width:42px;height:42px;flex:none;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--primary) 16%,transparent);color:var(--primary);font-size:22px}.fresh-copy{flex:1}.fresh-copy h2{font-size:15px;margin:5px 0 4px}.fresh-copy p{font-size:12px;line-height:1.6;color:var(--muted);margin:0}.state-panel{padding:20px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);font-size:13px;color:var(--muted)}.error-panel{border-color:var(--danger)}.error-panel strong{color:var(--text)}.error-panel p{font-size:12px;line-height:1.6}.text-link{font-size:11px;color:var(--primary);font-weight:750}
  .hero-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:14px;margin-bottom:15px}.target-card,.practice-target,.panel,.phase-card{border:1px solid var(--border);background:var(--surface);border-radius:var(--radius)}.target-card{padding:25px;min-height:220px;display:flex;flex-direction:column}.target-meta{display:flex;gap:8px;align-items:center;font-size:9px;letter-spacing:1px;font-weight:750;color:var(--primary);margin-top:20px}.target-meta span{color:var(--muted)}.target-card h2{font:500 clamp(25px,3vw,34px)/1.2 Georgia,serif;margin:9px 0 6px}.target-card>p,.practice-target>p{font-size:12px;color:var(--muted);line-height:1.65;margin:0}.target-footer{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:auto;padding-top:22px;font-size:10px;color:var(--muted)}.target-footer a{font-size:11px;color:var(--primary);font-weight:750}.target-footer b{padding-left:6px}.practice-target{padding:23px;display:flex;flex-direction:column;align-items:flex-start}.practice-number{font:500 42px/1 Georgia,serif;color:var(--primary);margin:19px 0 9px}.practice-number small{font:500 14px system-ui;color:var(--muted);padding-left:5px}.practice-symbol{font-size:30px;color:var(--primary);margin:20px 0 7px}.practice-target h2{font-size:15px;margin:0 0 7px}.practice-target>p{margin-bottom:16px}.practice-target .text-link{margin-top:auto}
  .practice-planner{margin:0 0 15px;padding:23px}.planner-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.planner-heading h2{font-size:18px;margin:7px 0}.planner-heading p{font-size:11px;line-height:1.6;color:var(--muted);margin:0;max-width:570px}.duration-controls{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 16px}.duration-controls button,.planner-primary,.planner-secondary{border:1px solid var(--border);border-radius:9px;padding:9px 13px;background:var(--surface-raised);color:var(--text);font:inherit;font-size:11px;cursor:pointer}.duration-controls button.choice-active{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 12%,var(--surface));color:var(--text)}.duration-controls button:focus-visible,.planner-primary:focus-visible,.planner-secondary:focus-visible,.custom-duration input:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.custom-duration{display:grid;gap:7px;max-width:240px;font-size:11px;font-weight:650}.custom-duration input{width:100%;min-height:39px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-raised);color:var(--text)}.duration-help{font-size:10px;color:var(--muted);margin:7px 0 14px}.task-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.practice-task{min-width:0;padding:15px;border:1px solid var(--border);border-radius:11px;background:var(--surface-raised)}.task-meta{display:flex;justify-content:space-between;gap:10px;color:var(--muted);font-size:9px;text-transform:capitalize;letter-spacing:.4px}.task-meta span:last-child{white-space:nowrap;color:var(--primary);font-weight:750}.practice-task h3{font-size:12px;margin:10px 0 6px}.practice-task p{font-size:10px;line-height:1.6;color:var(--muted);margin:0}.planner-footer{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:16px}.planner-footer>p,.planner-guardrail,.planner-notice{font-size:10px;line-height:1.6;color:var(--muted);margin:0}.planner-actions{display:flex;gap:8px;flex-wrap:wrap}.planner-primary{background:var(--primary);border-color:var(--primary);color:var(--primary-ink);font-weight:750}.planner-primary:disabled{opacity:.55;cursor:not-allowed}.planner-empty{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px;border:1px dashed var(--border);border-radius:10px;font-size:11px;color:var(--muted)}.planner-empty p{margin:0}.planner-notice{margin-top:12px;color:var(--text)}.planner-guardrail{border-top:1px solid var(--border);padding-top:13px;margin-top:16px}
    .dashboard-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:37px}.panel{padding:21px;min-width:0}.panel-heading{display:flex;justify-content:space-between;gap:12px;align-items:center}.panel-heading h2{font-size:15px;margin:7px 0 0}.neutral-tag{white-space:nowrap}.empty-state{display:flex;align-items:flex-start;gap:13px;margin-top:21px;padding-top:17px;border-top:1px solid var(--border)}.empty-symbol{width:28px;height:28px;flex:none;border-radius:9px;background:var(--surface-raised);display:grid;place-items:center;color:var(--success)}.empty-state strong{font-size:11px}.empty-state p{font-size:10px;line-height:1.6;color:var(--muted);margin:5px 0 0}.review-list,.session-list{list-style:none;margin:19px 0 0;padding:0}.review-list li,.session-list li{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid var(--border);font-size:11px}.review-dot{width:7px;height:7px;flex:none;border-radius:50%;background:var(--warning)}.review-date,.session-duration{margin-left:auto;color:var(--muted);font-size:10px}.session-mark{color:var(--primary);font-size:16px}.session-copy{display:grid;gap:3px}.session-copy strong{font-size:11px}.session-copy small{font-size:10px;color:var(--muted)}
  .learning-path{margin-bottom:35px}.section-heading{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:16px}.section-heading h2{font-size:20px;margin:7px 0 5px}.section-heading p{font-size:11px;color:var(--muted);margin:0}.phase-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.phase-card{padding:17px;min-width:0}.phase-card.current-phase{border-color:color-mix(in srgb,var(--primary) 65%,var(--border));background:color-mix(in srgb,var(--primary) 5%,var(--surface))}.phase-top{display:flex;justify-content:space-between;gap:6px;font-size:8px;letter-spacing:.8px;color:var(--muted);font-weight:750}.current-label{color:var(--primary)}.phase-card h3{font:500 19px/1.2 Georgia,serif;margin:17px 0 7px}.phase-card>p{font-size:10px;line-height:1.6;color:var(--muted);min-height:64px;margin:0 0 15px}.phase-progress{height:5px;border-radius:9px;background:var(--surface-raised);overflow:hidden}.phase-progress span{display:block;height:100%;border-radius:9px;background:var(--primary)}.phase-count{font-size:9px;color:var(--muted);margin-top:8px}.path-note{font-size:10px;line-height:1.6;color:var(--muted);margin:13px 0 0}footer{display:flex;justify-content:space-between;gap:15px;border-top:1px solid var(--border);padding-top:17px;margin-top:30px;color:var(--muted);font-size:10px}
  @media(max-width:1050px){.phase-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.phase-card>p{min-height:44px}}@media(max-width:900px){.app-shell{grid-template-columns:205px minmax(0,1fr)}.hero-grid,.dashboard-grid{grid-template-columns:1fr}.section-heading{align-items:flex-start;flex-direction:column}}@media(max-width:650px){.task-list{grid-template-columns:1fr}.planner-heading{flex-direction:column}.planner-footer{align-items:flex-start;flex-direction:column}.app-shell{display:block}.sidebar{display:none}.topbar{height:60px;padding:0 17px}.mobile-brand{display:flex;align-items:center;gap:9px;border:0;background:transparent;color:var(--text);font-size:14px}.mobile-brand strong{font-size:14px}.breadcrumb,.status-pill{display:none}.mobile-menu{display:grid;position:absolute;z-index:5;top:60px;left:12px;right:12px;padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:13px;box-shadow:0 15px 40px #0003}.mobile-menu a{padding:12px;border-radius:8px;font-size:13px}.mobile-menu a:hover{background:var(--surface-raised)}.page-content{padding:32px 17px 22px}.welcome{align-items:flex-start;flex-direction:column;gap:17px}.welcome h1{font-size:42px}.secondary-button{width:100%;text-align:center}.fresh-state{align-items:flex-start;padding:16px}.target-card{padding:20px;min-height:215px}.target-footer{align-items:flex-start;flex-direction:column}.practice-target{min-height:200px}.phase-grid{grid-template-columns:1fr}.phase-card>p{min-height:0}.panel{padding:18px}footer{flex-direction:column}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style>
