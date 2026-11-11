<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';

  let theme = $state<'dark' | 'light'>('dark');
  let menuOpen = $state(false);

  onMount(() => {
    const stored = window.localStorage.getItem('guitarlab-theme');
    if (stored === 'light' || stored === 'dark') theme = stored;
    document.documentElement.dataset.theme = theme;
  });

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('guitarlab-theme', theme);
  }
</script>

<svelte:head>
  <title>GuitarLab — Learn. Practise. Master.</title>
  <meta name="description" content="A focused, adaptive space to learn guitar, practise with purpose and build musicianship." />
  <meta name="theme-color" content={theme === 'dark' ? '#171715' : '#f5f3ed'} />
</svelte:head>

<div class="app-shell">
  <aside class="sidebar" aria-label="Main navigation">
    <a class="brand" href={resolve('/')} aria-label="GuitarLab home">
      <span class="brand-mark">G</span>
      <span><strong>GuitarLab</strong><small>LEARN. PRACTISE. MASTER.</small></span>
    </a>

    <div class="nav-label">WORKSPACE</div>
    <nav class="nav-list">
      <a class="nav-link active" href="#today"><span>⌂</span> Today</a>
      <a class="nav-link" href="#learn"><span>▤</span> Learn</a>
      <a class="nav-link" href="#practice"><span>◉</span> Practice</a>
      <a class="nav-link" href="#tools"><span>⌘</span> Tools</a>
      <a class="nav-link" href="#progress"><span>↗</span> Progress</a>
    </nav>

    <div class="sidebar-bottom">
      <div class="offline-indicator"><span></span> Local-first foundation</div>
      <a class="nav-link" href={resolve('/onboarding')}><span>⚙</span> Set up learner profile</a>
    </div>
  </aside>

  <main class="main-area">
    <header class="topbar">
      <button class="mobile-brand" onclick={() => (menuOpen = !menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation">☰ <strong>GuitarLab</strong></button>
      <div class="breadcrumb">Workspace <span>/</span> Today</div>
      <div class="top-actions">
        <span class="status-pill"><i></i> Your progress starts fresh</span>
        <button class="icon-button" onclick={toggleTheme} aria-label="Toggle colour theme" title="Toggle theme">{theme === 'dark' ? '☼' : '☾'}</button>
        <a class="avatar" href={resolve('/onboarding')} aria-label="Learner profile setup">?</a>
      </div>
    </header>

    {#if menuOpen}
      <nav class="mobile-menu" aria-label="Mobile navigation">
        <a href="#today" onclick={() => (menuOpen = false)}>Today</a>
        <a href="#learn" onclick={() => (menuOpen = false)}>Learn</a>
        <a href="#practice" onclick={() => (menuOpen = false)}>Practice</a>
        <a href="#tools" onclick={() => (menuOpen = false)}>Tools</a>
        <a href="#progress" onclick={() => (menuOpen = false)}>Progress</a>
        <a href={resolve('/onboarding')}>Learner setup</a>
      </nav>
    {/if}

    <div class="page-content">
      <section class="welcome" id="today">
        <div>
          <div class="eyebrow">YOUR PERSONAL PRACTICE SPACE</div>
          <h1>Make room for <em>music.</em></h1>
          <p>A calm place to build a skill, one useful practice at a time.</p>
        </div>
        <a class="primary-button" href={resolve('/onboarding')}>Set up your learning profile <span>→</span></a>
      </section>

      <section class="fresh-state" aria-labelledby="fresh-title">
        <div class="fresh-icon">✳</div>
        <div class="fresh-copy">
          <div class="eyebrow">A FRESH START</div>
          <h2 id="fresh-title">Your learning journey begins here.</h2>
          <p>No previous lessons or skill levels have been assumed. Set your preferences when you're ready; you can skip any question and change them later.</p>
        </div>
        <a class="text-link" href={resolve('/onboarding')}>Get started <span>↗</span></a>
      </section>

      <div class="section-heading">
        <div><div class="eyebrow">YOUR WORKSPACE</div><h2>What would you like to work on?</h2></div>
      </div>

      <section class="workspace-grid" aria-label="Learning areas">
        <a class="feature-card learn-card" id="learn" href={resolve('/onboarding')}>
          <div class="card-top"><span class="card-icon">▤</span><span class="card-kicker">BUILD YOUR FOUNDATION</span></div>
          <h3>Learn</h3>
          <p>Explore the curriculum, understand new ideas and follow guided lessons.</p>
          <span class="card-link">Explore learning path <b>→</b></span>
        </a>
        <a class="feature-card practice-card" id="practice" href={resolve('/onboarding')}>
          <div class="card-top"><span class="card-icon">◉</span><span class="card-kicker">MAKE IT MUSICAL</span></div>
          <h3>Practice</h3>
          <p>Work through focused exercises and build a consistent practice habit.</p>
          <span class="card-link">Open practice space <b>→</b></span>
        </a>
        <a class="feature-card tools-card" id="tools" href={resolve('/onboarding')}>
          <div class="card-top"><span class="card-icon">⌘</span><span class="card-kicker">YOUR MUSIC TOOLKIT</span></div>
          <h3>Tools</h3>
          <p>Fretboard, chords, rhythm and tuning tools will live in one place.</p>
          <span class="card-link">View planned tools <b>→</b></span>
        </a>
      </section>

      <section class="lower-grid">
        <div class="panel" id="progress">
          <div class="panel-heading"><div><div class="eyebrow">PROGRESS</div><h3>Nothing to catch up on.</h3></div><span class="neutral-tag">Fresh profile</span></div>
          <p class="muted">Your progress will be measured from skills you demonstrate, not time spent in the app.</p>
          <div class="empty-progress"><span>0</span><div><strong>No skills assessed yet</strong><small>Complete a lesson checkpoint to begin building your skill record.</small></div></div>
        </div>
        <div class="panel practice-note">
          <div class="eyebrow">A NOTE ON THE METHOD</div>
          <h3>Learn. See and hear. Practise. Test. Reflect.</h3>
          <p class="muted">Lessons will combine clear explanations, demonstrations, guided exercises and practical checks. You move forward when you're ready.</p>
          <a class="text-link" href={resolve('/onboarding')}>Configure your learning preferences <span>↗</span></a>
        </div>
      </section>

      <footer><span>GuitarLab · Learn. Practise. Master.</span><span>Built for thoughtful, independent learning.</span></footer>
    </div>
  </main>
</div>

<style>
  .app-shell{min-height:100vh;display:grid;grid-template-columns:250px minmax(0,1fr);background:var(--bg)}
  .sidebar{position:sticky;top:0;height:100vh;padding:28px 18px 20px;border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--surface)}
  .brand{display:flex;align-items:center;gap:11px;padding:0 8px 38px}.brand-mark{width:38px;height:38px;border-radius:12px;background:var(--primary);color:var(--primary-ink);display:grid;place-items:center;font-family:Georgia,serif;font-size:25px;font-weight:700}.brand strong{display:block;font-size:16px;letter-spacing:-.4px}.brand small{display:block;color:var(--muted);font-size:8px;letter-spacing:1.25px;margin-top:3px}
  .nav-label,.eyebrow{font-size:10px;font-weight:750;letter-spacing:1.35px;color:var(--muted)}.nav-label{padding:0 11px 12px}
  .nav-list{display:grid;gap:5px}.nav-link{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;color:var(--muted);font-size:13px;transition:background .15s,color .15s}.nav-link span{width:18px;text-align:center;font-size:17px}.nav-link:hover,.nav-link.active{background:var(--surface-raised);color:var(--text)}.nav-link.active{box-shadow:inset 2px 0 var(--primary)}
  .sidebar-bottom{margin-top:auto;display:grid;gap:12px}.offline-indicator{font-size:11px;color:var(--muted);padding:12px 10px;border-top:1px solid var(--border)}.offline-indicator span,.status-pill i{display:inline-block;width:7px;height:7px;background:var(--success);border-radius:50%;margin-right:7px}
  .main-area{min-width:0}.topbar{height:70px;padding:0 clamp(20px,4vw,54px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)}.breadcrumb{font-size:12px;color:var(--muted)}.breadcrumb span{padding:0 8px;color:var(--border)}.top-actions{display:flex;align-items:center;gap:13px}.status-pill,.neutral-tag{font-size:10px;color:var(--muted);border:1px solid var(--border);padding:7px 10px;border-radius:99px}.status-pill i{width:6px;height:6px}.icon-button,.avatar{border:1px solid var(--border);background:var(--surface);color:var(--text);width:34px;height:34px;border-radius:50%;display:grid;place-items:center;cursor:pointer}.avatar{font-size:12px;color:var(--primary);font-weight:700}.mobile-brand,.mobile-menu{display:none}
  .page-content{max-width:var(--content);margin:0 auto;padding:48px clamp(20px,4vw,54px) 24px}.welcome{display:flex;align-items:end;justify-content:space-between;gap:25px;margin-bottom:34px}.welcome h1{font-family:Georgia,serif;font-weight:500;font-size:clamp(36px,5vw,58px);letter-spacing:-2px;line-height:1.08;margin:12px 0}.welcome h1 em{color:var(--primary);font-weight:500}.welcome p,.muted{color:var(--muted);font-size:13px;line-height:1.7;margin:0}.primary-button{background:var(--primary);color:var(--primary-ink);font-size:12px;font-weight:750;padding:13px 17px;border-radius:10px;white-space:nowrap}.primary-button span{padding-left:10px}
  .fresh-state{display:flex;align-items:center;gap:18px;padding:21px 22px;border:1px solid color-mix(in srgb,var(--primary) 35%,var(--border));background:color-mix(in srgb,var(--primary) 7%,var(--surface));border-radius:var(--radius);margin-bottom:43px}.fresh-icon{width:42px;height:42px;flex:none;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--primary) 16%,transparent);color:var(--primary);font-size:22px}.fresh-copy{flex:1}.fresh-copy h2{font-size:16px;margin:5px 0 4px;letter-spacing:-.3px}.fresh-copy p{font-size:12px;line-height:1.6;color:var(--muted);margin:0;max-width:670px}.text-link{font-size:11px;color:var(--primary);font-weight:750;white-space:nowrap}.text-link span{padding-left:6px}
  .section-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:16px}.section-heading h2{font-size:19px;letter-spacing:-.5px;margin:7px 0 0}
  .workspace-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.feature-card,.panel{border:1px solid var(--border);background:var(--surface);border-radius:var(--radius)}.feature-card{padding:21px;min-height:218px;display:flex;flex-direction:column;transition:transform .15s,border-color .15s}.feature-card:hover{transform:translateY(-2px);border-color:var(--primary)}.card-top{display:flex;align-items:center;justify-content:space-between}.card-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--surface-raised);color:var(--primary);font-size:18px}.card-kicker{font-size:9px;letter-spacing:1px;color:var(--muted)}.feature-card h3{font-family:Georgia,serif;font-size:25px;font-weight:500;margin:22px 0 6px}.feature-card p{font-size:12px;line-height:1.65;color:var(--muted);margin:0 0 18px}.card-link{margin-top:auto;font-size:11px;color:var(--text);font-weight:650}.card-link b{color:var(--primary);padding-left:7px}.practice-card .card-icon{color:var(--secondary)}
  .lower-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px;margin-top:16px}.panel{padding:21px}.panel-heading{display:flex;justify-content:space-between;gap:12px;align-items:start}.panel h3{font-size:15px;margin:7px 0 9px}.neutral-tag{white-space:nowrap}.empty-progress{display:flex;align-items:center;gap:14px;margin-top:22px;padding-top:17px;border-top:1px solid var(--border)}.empty-progress>span{font-family:Georgia,serif;font-size:34px;color:var(--muted)}.empty-progress strong,.empty-progress small{display:block}.empty-progress strong{font-size:11px}.empty-progress small{font-size:10px;color:var(--muted);margin-top:4px;line-height:1.5}.practice-note h3{font-family:Georgia,serif;font-size:20px;font-weight:500;line-height:1.3;margin:12px 0}.practice-note .text-link{display:inline-block;margin-top:18px}
  footer{display:flex;justify-content:space-between;gap:15px;border-top:1px solid var(--border);padding-top:17px;margin-top:37px;color:var(--muted);font-size:10px}
  @media(max-width:900px){.app-shell{grid-template-columns:205px minmax(0,1fr)}.workspace-grid{grid-template-columns:1fr 1fr}.tools-card{grid-column:span 2}.welcome{align-items:start;flex-direction:column}.lower-grid{grid-template-columns:1fr}}
  @media(max-width:650px){.app-shell{display:block}.sidebar{display:none}.topbar{height:60px;padding:0 17px}.mobile-brand{display:flex;align-items:center;gap:9px;border:0;background:transparent;color:var(--text);font-size:14px}.mobile-brand strong{font-size:14px}.breadcrumb{display:none}.status-pill{display:none}.mobile-menu{display:grid;position:absolute;z-index:5;top:60px;left:12px;right:12px;padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:13px;box-shadow:0 15px 40px #0003}.mobile-menu a{padding:12px;border-radius:8px;font-size:13px}.mobile-menu a:hover{background:var(--surface-raised)}.page-content{padding-top:34px}.welcome{gap:18px}.welcome h1{font-size:42px}.primary-button{width:100%;text-align:center}.fresh-state{align-items:flex-start;flex-wrap:wrap;padding:17px}.fresh-copy{min-width:calc(100% - 65px)}.fresh-state>.text-link{margin-left:60px}.workspace-grid{grid-template-columns:1fr}.tools-card{grid-column:auto}.feature-card{min-height:190px}.lower-grid{grid-template-columns:1fr}footer{flex-direction:column}}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style>
