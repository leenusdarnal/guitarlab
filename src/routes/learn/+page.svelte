<script lang="ts">
  import { resolve } from '$app/paths';
  import Icon from '../../lib/components/Icon.svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let searchQuery = $state('');
  let selectedRoute = $state('all');
  let durationFilter = $state('all');
  let visibleCount = $state(12);
  let catalogHydrated = $state(false);

  onMount(() => {
    catalogHydrated = true;
  });

  const allLessons = $derived(
    data.routes.flatMap((route) =>
      route.weeks.map((week) => ({
        ...week,
        routeId: route.id,
        routeTitle: route.title,
        tier: route.tier,
        phaseTitle: route.phases.find((phase) => phase.id === week.phaseId)?.title ?? route.title
      }))
    )
  );

  const filteredLessons = $derived.by(() => {
    const terms = searchQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

    return allLessons.filter((lesson) => {
      if (selectedRoute !== 'all' && lesson.routeId !== selectedRoute) return false;

      const searchableText = [
        lesson.title,
        lesson.focus,
        lesson.checkpoint,
        lesson.routeTitle,
        lesson.phaseTitle,
        lesson.tier,
        'week ' + lesson.week
      ].join(' ').toLocaleLowerCase();

      const searchableTokens = new Set(searchableText.match(/[\p{L}\p{N}]+/gu) ?? []);
      if (
        !terms.every((term) =>
          /^\d+$/.test(term) ? searchableTokens.has(term) : searchableText.includes(term)
        )
      ) return false;

      if (durationFilter === 'up-to-20' && lesson.estimatedMinutes > 20) return false;
      if (durationFilter === '21-30' && (lesson.estimatedMinutes < 21 || lesson.estimatedMinutes > 30)) return false;
      if (durationFilter === '31-plus' && lesson.estimatedMinutes < 31) return false;

      return true;
    });
  });

  const visibleLessons = $derived(filteredLessons.slice(0, visibleCount));

  function updateSearch(event: Event) {
    searchQuery = (event.currentTarget as HTMLInputElement).value;
    visibleCount = 12;
  }

  function updateRoute(event: Event) {
    selectedRoute = (event.currentTarget as HTMLSelectElement).value;
    visibleCount = 12;
  }

  function updateDuration(event: Event) {
    durationFilter = (event.currentTarget as HTMLSelectElement).value;
    visibleCount = 12;
  }

  function clearFilters() {
    searchQuery = '';
    selectedRoute = 'all';
    durationFilter = 'all';
    visibleCount = 12;
  }
</script>

<svelte:head>
  <title>Find a lesson — GuitarLab</title>
  <meta name="description" content="Search and browse all 152 GuitarLab lessons by name, topic, learning path and lesson length." />
</svelte:head>

<main class="catalog">
  <header class="catalog-header">
    <a class="back" href={resolve('/')}><Icon name="arrow-left" size={14} /> Today</a>
    <div class="eyebrow">THE GUITARLAB CURRICULUM</div>
    <h1>Find your next <em>lesson.</em></h1>
    <p class="intro">Search by lesson name or what you want to practise. Filter by learning path or the time you have, then open a lesson directly.</p>
    <div class="stats" aria-label="Curriculum coverage">
      <span><strong>{data.stats.year1}</strong> Year 1 lessons</span>
      <span><strong>{data.stats.year2}</strong> Year 2 lessons</span>
      <span><strong>{data.stats.specialisations}</strong> specialist lessons</span>
      <span><strong>{data.stats.totalLessons}</strong> lessons in total</span>
    </div>
  </header>

  <section
    class="finder"
    aria-labelledby="finder-title"
    data-catalog-hydrated={catalogHydrated ? 'true' : 'false'}
  >
    <div class="finder-heading">
      <div>
        <div class="eyebrow">LESSON FINDER</div>
        <h2 id="finder-title">What would you like to learn?</h2>
      </div>
      <a class="browse-paths-link" href="#browse-paths">Browse learning paths <Icon name="arrow-down" size={14} /></a>
    </div>

    <label class="search-label" for="lesson-search">Search 152 lessons</label>
    <div class="search-wrap">
      <span class="search-icon" aria-hidden="true"><Icon name="search" size={18} /></span>
      <input
        id="lesson-search"
        type="search"
        aria-label="Search lessons"
        placeholder="Try “open chords”, “fingerstyle” or “fretboard”…"
        value={searchQuery}
        oninput={updateSearch}
        autocomplete="off"
      />
      {#if searchQuery}
        <button class="clear-search" type="button" onclick={clearFilters}>Clear</button>
      {/if}
    </div>

    <div class="filters">
      <label>
        <span>Learning path</span>
        <select aria-label="Learning path" value={selectedRoute} onchange={updateRoute}>
          <option value="all">All learning paths</option>
          {#each data.routes as route (route.id)}
            <option value={route.id}>{route.title}</option>
          {/each}
        </select>
      </label>
      <label>
        <span>Lesson length</span>
        <select aria-label="Lesson length" value={durationFilter} onchange={updateDuration}>
          <option value="all">Any duration</option>
          <option value="up-to-20">20 minutes or less</option>
          <option value="21-30">21–30 minutes</option>
          <option value="31-plus">31 minutes or more</option>
        </select>
      </label>
    </div>

    <div class="results-heading">
      <h2>Lessons</h2>
      <p class="result-count" aria-live="polite">
        {filteredLessons.length} {filteredLessons.length === 1 ? 'lesson' : 'lessons'} found
        {#if searchQuery || selectedRoute !== 'all' || durationFilter !== 'all'}
          <span> · filtered results</span>
        {/if}
      </p>
    </div>

    {#if filteredLessons.length === 0}
      <div class="empty-results" role="status">
        <div class="empty-symbol" aria-hidden="true"><Icon name="search" size={24} /></div>
        <h3>No lessons match those filters.</h3>
        <p>Try another word, choose a different learning path or remove the duration filter.</p>
        <button type="button" onclick={clearFilters}>Clear filters</button>
      </div>
    {:else}
      <div class="lesson-results" data-testid="lesson-results">
        {#each visibleLessons as lesson (lesson.routeId + ':' + lesson.lessonId)}
          <article class="lesson-result">
            <div class="result-meta">
              <span>{lesson.tier}</span>
              <span>Week {lesson.week}</span>
              <span>{lesson.estimatedMinutes} min</span>
            </div>
            <h3>{lesson.title}</h3>
            <p class="result-focus">{lesson.focus}</p>
            <div class="result-footer">
              <span>{lesson.routeTitle} <span aria-hidden="true">·</span> {lesson.phaseTitle}</span>
              <a class="lesson-result-link" href={resolve('/learn/[lessonId]', { lessonId: lesson.lessonId })} aria-label={'Open lesson: ' + lesson.title}>
                Open lesson <Icon name="arrow-right" size={14} />
              </a>
            </div>
          </article>
        {/each}
      </div>
      {#if visibleLessons.length < filteredLessons.length}
        <div class="show-more-wrap">
          <button class="show-more" type="button" onclick={() => (visibleCount += 12)}>
            Show {Math.min(12, filteredLessons.length - visibleLessons.length)} more lessons
            <Icon name="arrow-down" size={14} />
          </button>
          <p>Showing {visibleLessons.length} of {filteredLessons.length} matching lessons</p>
        </div>
      {:else if filteredLessons.length > 0}
        <p class="all-results-shown">Showing all {filteredLessons.length} matching lessons</p>
      {/if}
    {/if}
  </section>

  <section class="path-directory" id="browse-paths" aria-labelledby="paths-title">
    <div class="directory-heading">
      <div>
        <div class="eyebrow">EXPLORE THE CURRICULUM</div>
        <h2 id="paths-title">Browse by learning path</h2>
        <p>Follow a structured route or explore an optional specialist pathway.</p>
      </div>
      <a href="#lesson-search"><Icon name="arrow-up" size={14} /> Back to lesson finder</a>
    </div>
    <nav class="route-jump" aria-label="Jump to a learning path">
      {#each data.routes as route (route.id)}
        <a href={'#route-' + route.id}>{route.title}</a>
      {/each}
    </nav>
    <div class="routes">
      {#each data.routes as route (route.id)}
        <article class="route-card" id={'route-' + route.id}>
          <div class="route-card-top">
            <span class="route-kind">{route.tier === 'Year 3+ specialisation' ? 'Optional specialisation' : 'Core learning path'}</span>
            <span class="route-count">{route.totalLessons} lessons</span>
          </div>
          <h3>{route.title}</h3>
          <p>{route.goal}</p>
          <div class="route-card-footer">
            <span>{route.phases.length} {route.phases.length === 1 ? 'stage' : 'stages'} · {route.contentVersion} content</span>
            <a href={resolve('/learn/[lessonId]', { lessonId: route.weeks[0].lessonId })}>Open first lesson <Icon name="arrow-right" size={14} /></a>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <footer>All 152 authored lessons remain available. Week numbers organise the material; they are not deadlines. Completing a lesson and demonstrating skill mastery are separate.</footer>
</main>

<style>
  .catalog{max-width:1180px;margin:0 auto;padding:28px clamp(16px,4vw,50px) 72px;color:var(--text)}
  .catalog-header{padding:8px 0 26px}
  .back{display:inline-block;font-size:13px;color:var(--muted);margin-bottom:24px}
  .eyebrow{font-size:11px;letter-spacing:1.25px;font-weight:800;color:var(--muted)}
  h1{font:500 clamp(38px,6vw,58px)/1.08 Georgia,serif;letter-spacing:-1.6px;margin:12px 0}
  h1 em{color:var(--primary)}
  .intro{max-width:720px;color:var(--muted);font-size:16px;line-height:1.7;margin:0}
  .stats{display:flex;gap:9px;flex-wrap:wrap;margin-top:22px}
  .stats span{padding:10px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--muted);font-size:13px}
  .stats strong{color:var(--text);font-size:15px;margin-right:4px}
  .finder{padding:22px;border:1px solid var(--border);border-radius:18px;background:var(--surface);box-shadow:0 16px 44px #0000000d}
  .finder-heading,.directory-heading{display:flex;justify-content:space-between;align-items:end;gap:16px}
  .finder-heading h2,.directory-heading h2{font:500 27px/1.2 Georgia,serif;margin:7px 0 0}
  .browse-paths-link,.directory-heading>a{font-size:13px;font-weight:700;color:var(--primary);white-space:nowrap}
  .search-label{display:block;margin:20px 0 8px;font-size:13px;font-weight:750}
  .search-wrap{display:flex;align-items:center;gap:10px;min-height:54px;padding:0 14px;border:1px solid var(--border);border-radius:12px;background:var(--bg)}
  .search-wrap:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 18%,transparent)}
  .search-icon{font-size:24px;color:var(--muted)}
  .search-wrap input{width:100%;min-width:0;min-height:50px;border:0;outline:none;background:transparent;color:var(--text);font-size:15px}
  .search-wrap input::placeholder{color:var(--muted);opacity:.85}
  .clear-search{border:0;background:transparent;color:var(--primary);font-size:13px;font-weight:750;cursor:pointer}
  .filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}
  .filters label{display:grid;gap:7px;font-size:12px;font-weight:750}
  .filters select{width:100%;min-height:46px;padding:0 12px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);font-size:14px}
  .results-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:25px 0 13px}
  .results-heading h2{font:500 23px Georgia,serif;margin:0}
  .result-count{margin:0;font-size:13px;color:var(--muted)}
  .result-count span{font-size:12px}
  .lesson-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
  .lesson-result{display:flex;flex-direction:column;min-width:0;padding:17px;border:1px solid var(--border);border-radius:13px;background:var(--bg)}
  .result-meta{display:flex;flex-wrap:wrap;gap:7px 12px;color:var(--muted);font-size:11px}
  .result-meta span+span:before{content:'·';margin-right:10px;color:var(--border)}
  .lesson-result h3{font-size:17px;line-height:1.35;margin:10px 0 6px}
  .result-focus{flex:1;margin:0;color:var(--muted);font-size:14px;line-height:1.55}
  .result-footer{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border)}
  .result-footer>span{font-size:11px;line-height:1.45;color:var(--muted)}
  .lesson-result-link{display:inline-flex;align-items:center;gap:8px;min-height:40px;flex:none;color:var(--primary);font-size:13px;font-weight:800}
  .lesson-result-link:hover,.browse-paths-link:hover,.directory-heading>a:hover{ text-decoration:underline;text-underline-offset:3px}
  .show-more-wrap{text-align:center;padding:20px 0 2px}
  .show-more,.empty-results button{min-height:44px;padding:10px 17px;border:1px solid var(--border);border-radius:10px;background:var(--surface-raised);color:var(--text);font-size:13px;font-weight:750;cursor:pointer}
  .show-more span{padding-left:8px;color:var(--primary)}
  .show-more-wrap p,.all-results-shown{color:var(--muted);font-size:12px;margin:8px 0 0;text-align:center}
  .empty-results{padding:30px 15px;text-align:center;border:1px dashed var(--border);border-radius:12px;background:var(--bg)}
  .empty-symbol{font-size:32px;color:var(--muted)}
  .empty-results h3{font:500 22px Georgia,serif;margin:8px 0}
  .empty-results p{max-width:480px;margin:0 auto 17px;color:var(--muted);font-size:14px;line-height:1.6}
  .empty-results button{background:var(--primary);color:var(--primary-ink);border-color:var(--primary)}
  .path-directory{padding-top:38px;scroll-margin-top:84px}
  .directory-heading{margin-bottom:14px}
  .directory-heading p{margin:7px 0 0;color:var(--muted);font-size:14px;line-height:1.55}
  .route-jump{display:flex;gap:8px;overflow-x:auto;padding:7px 0 15px;scrollbar-width:thin}
  .route-jump a{flex:none;min-height:40px;display:inline-flex;align-items:center;padding:8px 13px;border:1px solid var(--border);background:var(--surface);border-radius:99px;font-size:13px;color:var(--text)}
  .route-jump a:hover,.route-jump a:focus-visible{border-color:var(--primary)}
  .routes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .route-card{min-width:0;padding:19px;border:1px solid var(--border);background:var(--surface);border-radius:14px;scroll-margin-top:84px}
  .route-card-top,.route-card-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;min-width:0;flex-wrap:wrap}
  .route-kind,.route-count{font-size:12px;color:var(--muted)}
  .route-kind{text-transform:uppercase;letter-spacing:.5px;font-weight:750}
  .route-card h3{font:500 21px/1.25 Georgia,serif;margin:13px 0 7px}
  .route-card p{min-height:48px;margin:0;color:var(--muted);font-size:14px;line-height:1.55}
  .route-card-footer{padding-top:14px;margin-top:15px;border-top:1px solid var(--border)}
  .route-card-footer>span{font-size:11px;color:var(--muted)}
  .route-card-footer a{font-size:13px;font-weight:800;color:var(--primary);white-space:normal;overflow-wrap:anywhere}
  footer{margin-top:25px;padding-top:16px;border-top:1px solid var(--border);font-size:13px;line-height:1.6;color:var(--muted)}
  a:focus-visible,button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
  @media(max-width:760px){.lesson-results,.routes{grid-template-columns:1fr}.finder{padding:17px}.finder-heading,.directory-heading{align-items:flex-start;flex-direction:column}.browse-paths-link,.directory-heading>a{white-space:normal}.directory-heading h2{font-size:25px}.route-card p{min-height:0}}
  @media(max-width:520px){.catalog{padding:20px 15px 55px}.filters{grid-template-columns:1fr}.stats span{flex:1 1 42%}.results-heading{align-items:flex-start;flex-direction:column}.result-footer{align-items:flex-start;flex-direction:column}.lesson-result-link{min-height:44px}}
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
</style>
