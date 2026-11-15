<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Curriculum unavailable — GuitarLab</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="error-page">
  <div class="eyebrow">CURRICULUM</div>
  <h1>We couldn't open that lesson.</h1>
  <p>{page.error?.message ?? 'The requested curriculum content is unavailable.'}</p>
  <p class="status">Error {page.status}</p>
  <a href={resolve('/learn')}>Return to the curriculum</a>
</main>

<style>
  .error-page{max-width:650px;margin:12vh auto;padding:30px 22px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}
  .eyebrow{font-size:10px;letter-spacing:1.3px;color:var(--muted);font-weight:800}
  h1{font:500 clamp(30px,5vw,43px)/1.1 Georgia,serif;margin:13px 0}
  p{font-size:12px;line-height:1.7;color:var(--muted)}.status{font-size:10px}a{font-size:12px;color:var(--primary)}
</style>
