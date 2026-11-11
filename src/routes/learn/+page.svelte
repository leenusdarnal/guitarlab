<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Learning paths — GuitarLab</title>
  <meta name="description" content="Browse all 152 authored GuitarLab lessons across Year 1, Year 2 and four optional specialisations." />
</svelte:head>

<main class="catalog">
  <header>
    <a class="back" href={resolve('/')}>← Dashboard</a>
    <div class="eyebrow">THE GUITARLAB CURRICULUM</div>
    <h1>Choose your <em>next chapter.</em></h1>
    <p class="intro">Explore the core learning routes or a specialist path. Every lesson is self-contained; move at a pace that keeps the playing comfortable and musical.</p>
    <div class="stats" aria-label="Curriculum coverage">
      <span><strong>{data.stats.year1}</strong> Year 1 lessons</span>
      <span><strong>{data.stats.year2}</strong> Year 2 lessons</span>
      <span><strong>{data.stats.specialisations}</strong> specialist lessons</span>
      <span><strong>{data.stats.totalLessons}</strong> total lessons</span>
    </div>
  </header>

  {#if data.routes.length === 0}
    <section class="empty" role="status">
      <h2>No learning paths are available yet.</h2>
      <p>The authored curriculum could not be found. Return to the dashboard and try again.</p>
      <a href={resolve('/')}>Return to dashboard</a>
    </section>
  {:else}
    <section class="routes" aria-label="Available learning paths">
      {#each data.routes as route (route.id)}
        <article class="route-card" id={'route-' + route.id}>
          <header class="route-header">
            <div class="meta"><span>{route.tier}</span><span>{route.contentVersion} content</span><span>{route.totalLessons} lessons</span></div>
            <h2>{route.title}</h2>
            <p>{route.goal}</p>
          </header>
          <div class="phases">
            {#each route.phases as phase, phaseIndex (phase.id)}
              <details class="phase" open={route.id === 'year-1' && phaseIndex === 0}>
                <summary>
                  <span class="phase-copy"><strong>{phase.title}</strong><small>Weeks {phase.firstWeek}–{phase.lastWeek} · {phase.goal}</small></span>
                  <span class="count">{route.weeks.filter((week) => week.phaseId === phase.id).length} lessons</span>
                </summary>
                <ol class="weeks">
                  {#each route.weeks.filter((week) => week.phaseId === phase.id) as week (week.id)}
                    <li>
                      <a class="week-link" href={resolve('/learn/[lessonId]', { lessonId: week.lessonId })}>
                        <span class="week-number">W{String(week.week).padStart(2, '0')}</span>
                        <span class="week-copy"><strong>{week.title}</strong><small>{week.focus}</small><span>{week.checkpoint}</span></span>
                        <span class="arrow" aria-hidden="true">→</span>
                      </a>
                    </li>
                  {/each}
                </ol>
              </details>
            {/each}
          </div>
        </article>
      {/each}
    </section>
  {/if}
  <footer>Lesson IDs and authored ordering are stable curriculum references. Week numbers organise the material; they are not deadlines.</footer>
</main>

<style>
  .catalog{max-width:1120px;margin:0 auto;padding:34px clamp(17px,4vw,52px) 70px;color:var(--text)}
  .catalog>header{padding:12px 0 30px}.back{display:inline-block;font-size:12px;color:var(--muted);margin-bottom:28px}
  .eyebrow{font-size:10px;letter-spacing:1.4px;font-weight:750;color:var(--muted)}
  h1{font:500 clamp(38px,6vw,60px)/1.08 Georgia,serif;letter-spacing:-1.8px;margin:12px 0}
  h1 em{color:var(--primary)}.intro{max-width:680px;color:var(--muted);font-size:13px;line-height:1.75}
  .stats{display:flex;gap:9px;flex-wrap:wrap;margin-top:24px}.stats span{padding:9px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--muted);font-size:10px}
  .stats strong{color:var(--text);font-size:13px;margin-right:4px}
  .route-jump{display:flex;gap:8px;overflow-x:auto;padding:6px 0 18px;scrollbar-width:thin}
  .route-jump a{flex:none;border:1px solid var(--border);background:var(--surface);border-radius:99px;padding:9px 12px;font-size:10px;color:var(--muted)}
  .route-jump a:hover,.route-jump a:focus-visible{color:var(--text);border-color:var(--primary)}
  .routes{display:grid;gap:15px}.route-card{border:1px solid var(--border);background:var(--surface);border-radius:var(--radius);overflow:hidden;scroll-margin-top:18px}
  .route-header{padding:22px 23px 18px;border-bottom:1px solid var(--border)}
  .meta{display:flex;gap:8px;flex-wrap:wrap;font-size:9px;letter-spacing:.65px;text-transform:uppercase;color:var(--muted)}
  .meta span+span:before{content:'·';margin-right:8px;color:var(--border)}
  .route-header h2{font:500 25px/1.2 Georgia,serif;margin:10px 0 6px}.route-header p{font-size:11px;line-height:1.65;color:var(--muted);margin:0;max-width:760px}
  .phases{padding:10px 13px 14px}.phase{border-bottom:1px solid var(--border)}.phase:last-child{border-bottom:0}
  .phase summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 10px;cursor:pointer;list-style:none}
  .phase summary::-webkit-details-marker{display:none}.phase summary:after{content:'＋';color:var(--primary);font-size:14px}.phase[open] summary:after{content:'−'}
  .phase-copy{display:grid;gap:4px}.phase-copy strong{font-size:12px}.phase-copy small{font-size:10px;line-height:1.5;color:var(--muted)}
  .count{white-space:nowrap;color:var(--muted);font-size:9px}.weeks{list-style:none;padding:0 8px 10px;margin:0;display:grid;gap:5px}
  .week-link{display:grid;grid-template-columns:42px minmax(0,1fr) 16px;align-items:start;gap:12px;padding:12px;border-radius:10px;border:1px solid transparent}
  .week-link:hover{background:var(--surface-raised);border-color:var(--border)}.week-number{font-size:10px;font-weight:800;color:var(--primary);padding-top:2px}
  .week-copy{display:grid;gap:4px;min-width:0}.week-copy strong{font-size:11px}.week-copy small,.week-copy span{font-size:10px;line-height:1.5;color:var(--muted)}
  .arrow{color:var(--primary);font-size:13px}.empty{padding:24px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}
  .empty p{font-size:12px;color:var(--muted);line-height:1.6}.empty a{font-size:11px;color:var(--primary)}
  footer{margin-top:22px;padding-top:15px;border-top:1px solid var(--border);font-size:10px;line-height:1.6;color:var(--muted)}
  a:focus-visible,summary:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
  @media(max-width:620px){.catalog{padding-top:23px}.route-header{padding:18px}.phases{padding:7px 9px 10px}.week-link{grid-template-columns:35px minmax(0,1fr) 14px;gap:8px;padding:11px 8px}.stats span{flex:1 1 42%}}
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
</style>
