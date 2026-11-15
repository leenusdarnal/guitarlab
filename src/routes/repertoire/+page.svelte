<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    createActiveSongProject,
    deleteActiveSongProject,
    loadActiveSongProjects,
    saveActiveSongProject
  } from '../../lib/storage/indexeddb';
  import type {
    SongProjectRecord,
    SongProjectSourceType
  } from '../../lib/domain/repertoire/song-project';

  let projects = $state<SongProjectRecord[]>([]);
  let draft = $state<SongProjectRecord | null>(null);
  let newTitle = $state('');
  let isLoading = $state(true);
  let isSaving = $state(false);
  let status = $state('');
  let error = $state('');

  onMount(() => {
    let active = true;
    void loadActiveSongProjects()
      .then((records) => {
        if (!active) return;
        projects = records;
        draft = records[0] ? $state.snapshot(records[0]) : null;
      })
      .catch((cause) => {
        if (active) {
          error =
            cause instanceof Error
              ? cause.message
              : 'Your local song projects could not be loaded.';
        }
      })
      .finally(() => {
        if (active) isLoading = false;
      });
    return () => {
      active = false;
    };
  });

  function selectProject(projectId: string) {
    const selected = projects.find((project) => project.id === projectId);
    draft = selected ? $state.snapshot(selected) : null;
    status = '';
    error = '';
  }

  async function createProject() {
    const title = newTitle.trim();
    if (!title || isSaving) return;
    isSaving = true;
    status = '';
    error = '';
    try {
      const created = await createActiveSongProject({
        title,
        artist: null,
        sourceType: 'original',
        sourceUrl: null,
        notes: '',
        sections: []
      });
      projects = [created, ...projects];
      draft = $state.snapshot(created);
      newTitle = '';
      status = 'Song project created and saved locally.';
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'The song project could not be created.';
    } finally {
      isSaving = false;
    }
  }

  async function saveProject() {
    if (!draft || isSaving) return;
    isSaving = true;
    status = '';
    error = '';
    const expectedUpdatedAt = draft.updatedAt;
    try {
      const saved = await saveActiveSongProject(draft, expectedUpdatedAt);
      if (!saved) {
        projects = await loadActiveSongProjects();
        const latest = projects.find((project) => project.id === draft?.id);
        draft = latest ? $state.snapshot(latest) : null;
        error =
          'This project changed in another tab. The latest saved version has been reloaded; review it before editing again.';
        return;
      }
      projects = await loadActiveSongProjects();
      const latest = projects.find((project) => project.id === draft?.id);
      draft = latest ? $state.snapshot(latest) : null;
      status = 'Changes saved on this device.';
    } catch (cause) {
      error =
        cause instanceof Error ? cause.message : 'Your changes could not be saved.';
    } finally {
      isSaving = false;
    }
  }

  async function deleteProject() {
    if (!draft || isSaving) return;
    const confirmed = window.confirm(
      `Delete the song project "${draft.title}" from this device?`
    );
    if (!confirmed) return;
    const projectId = draft.id;
    isSaving = true;
    status = '';
    error = '';
    try {
      const deleted = await deleteActiveSongProject(projectId);
      if (!deleted) {
        error = 'This project is no longer available to the active learner.';
        return;
      }
      projects = await loadActiveSongProjects();
      draft = projects[0] ? $state.snapshot(projects[0]) : null;
      status = 'Song project deleted from this device.';
    } catch (cause) {
      error =
        cause instanceof Error ? cause.message : 'The song project could not be deleted.';
    } finally {
      isSaving = false;
    }
  }

  function addSection() {
    if (!draft || draft.sections.length >= 100) return;
    const sections = [...draft.sections, {
      id: crypto.randomUUID(),
      title: `Section ${draft.sections.length + 1}`,
      order: draft.sections.length,
      notes: '',
      bookmark: null,
      practiceTarget: null
    }];
    draft = { ...draft, sections };
  }

  function removeSection(sectionId: string) {
    if (!draft) return;
    draft = {
      ...draft,
      sections: draft.sections
        .filter((section) => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))
    };
  }

  function setNullableField(
    field: 'artist' | 'sourceUrl',
    value: string
  ) {
    if (!draft) return;
    draft = { ...draft, [field]: value.trim() ? value : null };
  }

  function updateSourceType(value: string) {
    if (!draft) return;
    draft.sourceType = value as SongProjectSourceType;
    if (draft.sourceType !== 'reference_link' && !draft.sourceUrl) {
      draft.sourceUrl = null;
    }
  }
</script>

<svelte:head>
  <title>Song projects — GuitarLab</title>
  <meta
    name="description"
    content="Organise learner-authored song notes, section bookmarks and practice targets locally."
  />
</svelte:head>

<main class="repertoire-page">
  <a class="back-link" href={resolve('/tools')}>← Practice tools</a>
  <header class="page-heading">
    <div class="eyebrow">THE PRACTICE WORKBENCH · REPERTOIRE</div>
    <h1>Build your <em>repertoire.</em></h1>
    <p>
      Keep your own song notes, section structure, reference bookmarks and
      practice targets together. Projects stay in this browser and can be
      included in your learner backup.
    </p>
  </header>

  <section class="create-panel" aria-label="Create song project">
    <label for="new-project-title">New song or study project</label>
    <div class="create-row">
      <input
        id="new-project-title"
        bind:value={newTitle}
        maxlength="160"
        placeholder="e.g. My fingerstyle arrangement"
      />
      <button type="button" class="primary-button" onclick={createProject} disabled={!newTitle.trim() || isSaving}>
        {isSaving ? 'Saving…' : 'Create project'}
      </button>
    </div>
  </section>

  {#if isLoading}
    <p class="status" role="status">Loading local projects…</p>
  {:else}
    <div class="workspace">
      <aside class="project-list" aria-label="Your song projects">
        <div class="list-heading">
          <span class="eyebrow">YOUR PROJECTS</span>
          <span>{projects.length} saved</span>
        </div>
        {#if projects.length === 0}
          <p class="empty-copy">No projects yet. Create one to start organising your own notes and practice goals.</p>
        {:else}
          {#each projects as project (project.id)}
            <button
              type="button"
              class="project-choice"
              class:active={draft?.id === project.id}
              aria-pressed={draft?.id === project.id}
              onclick={() => selectProject(project.id)}
            >
              <strong>{project.title}</strong>
              <span>{project.artist || 'Personal study'}</span>
              <small>{project.sections.length} sections</small>
            </button>
          {/each}
        {/if}
      </aside>

      <section class="editor" aria-label="Song project editor">
        {#if draft}
          <div class="editor-heading">
            <div>
              <div class="eyebrow">LOCAL SONG PROJECT</div>
              <h2>{draft.title}</h2>
            </div>
            <button type="button" class="danger-button" onclick={deleteProject} disabled={isSaving}>Delete</button>
          </div>

          <div class="field-grid">
            <label>
              <span>Song or study title</span>
              <input bind:value={draft.title} maxlength="160" />
            </label>
            <label>
              <span>Artist / composer (optional)</span>
              <input
                value={draft.artist ?? ''}
                maxlength="160"
                oninput={(event) => setNullableField('artist', event.currentTarget.value)}
              />
            </label>
            <label>
              <span>Material status</span>
              <select value={draft.sourceType} onchange={(event) => updateSourceType(event.currentTarget.value)}>
                <option value="original">My original work</option>
                <option value="public_domain">Public-domain material</option>
                <option value="licensed">Material I am licensed to use</option>
                <option value="reference_link">External reference link only</option>
              </select>
            </label>
            <label>
              <span>External reference URL (optional)</span>
              <input
                type="url"
                value={draft.sourceUrl ?? ''}
                placeholder="https://…"
                maxlength="2048"
                oninput={(event) => setNullableField('sourceUrl', event.currentTarget.value)}
              />
            </label>
          </div>

          <label class="wide-field">
            <span>Project notes</span>
            <textarea
            bind:value={draft.notes}
            rows="4"
            maxlength="5000"
            placeholder="Write your own arrangement notes, interpretation ideas or practice reminders."
          ></textarea>
          </label>

          <div class="section-heading">
            <div>
              <div class="eyebrow">SONG STRUCTURE</div>
              <h3>Sections and practice targets</h3>
            </div>
            <button type="button" class="secondary-button" onclick={addSection} disabled={draft.sections.length >= 100}>Add section</button>
          </div>

          {#if draft.sections.length === 0}
            <p class="empty-copy">Add a verse, chorus, bridge or any section structure that matches your own arrangement.</p>
          {:else}
            <div class="sections">
              {#each draft.sections as section, index (section.id)}
                <article class="section-card">
                  <div class="section-card-heading">
                    <span class="section-number">{index + 1}</span>
                    <input aria-label={`Section ${index + 1} title`} bind:value={section.title} maxlength="100" />
                    <button type="button" class="text-button" onclick={() => removeSection(section.id)}>Remove</button>
                  </div>
                  <label>
                    <span>Your notes</span>
                    <textarea bind:value={section.notes} rows="2" maxlength="2000" placeholder="What do you want to remember about this section?" />
                  </label>
                  <div class="field-grid">
                    <label>
                      <span>Bookmark / reference position</span>
                      <input
                        value={section.bookmark ?? ''}
                        maxlength="160"
                        placeholder="e.g. bar 9 or link at 1:24"
                        oninput={(event) => { section.bookmark = event.currentTarget.value || null; }}
                      />
                    </label>
                    <label>
                      <span>Practice target</span>
                      <input
                        value={section.practiceTarget ?? ''}
                        maxlength="400"
                        placeholder="e.g. four clean chord changes"
                        oninput={(event) => { section.practiceTarget = event.currentTarget.value || null; }}
                      />
                    </label>
                  </div>
                </article>
              {/each}
            </div>
          {/if}

          <div class="save-row">
            <span>Last saved: {new Date(draft.updatedAt).toLocaleString()}</span>
            <button type="button" class="primary-button" onclick={saveProject} disabled={isSaving || !draft.title.trim()}>
              {isSaving ? 'Saving…' : 'Save project'}
            </button>
          </div>
        {:else}
          <div class="empty-editor">
            <div class="eyebrow">START WITH A PROJECT</div>
            <h2>Your repertoire workspace.</h2>
            <p>Create a project to organise your own song notes, sections and goals.</p>
          </div>
        {/if}
      </section>
    </div>
  {/if}

  {#if status}
    <p class="status success" role="status">{status}</p>
  {/if}
  {#if error}
    <p class="status error" role="alert">{error}</p>
  {/if}

  <p class="rights-note">
    Store only notes and notation you created yourself or are permitted to use.
    GuitarLab does not bundle or redistribute copyrighted tabs, lyrics or audio.
    External references remain links; GuitarLab does not fetch their content or
    send your private project notes to those sites.
  </p>
</main>

<style>
  .repertoire-page {
    width: min(100% - 32px, 1100px);
    margin: 0 auto;
    padding: 30px 0 64px;
    color: var(--text);
  }
  .back-link { display: inline-block; margin-bottom: 28px; color: var(--muted); font-size: 12px; }
  .page-heading { max-width: 720px; padding-bottom: 22px; }
  .eyebrow { color: var(--muted); font-size: 9px; font-weight: 800; letter-spacing: 1.2px; }
  h1 { margin: 10px 0; font: 500 clamp(36px, 5vw, 54px) / 1.08 Georgia, serif; letter-spacing: -1.5px; }
  h1 em { color: var(--primary); }
  .page-heading p, .empty-copy, .rights-note { color: var(--muted); font-size: 12px; line-height: 1.7; }
  .create-panel, .project-list, .editor {
    border: 1px solid var(--border);
    border-radius: 13px;
    background: var(--surface);
  }
  .create-panel { padding: 16px; margin-bottom: 16px; }
  label { display: grid; gap: 6px; color: var(--muted); font-size: 10px; font-weight: 750; }
  input, select, textarea {
    width: 100%;
    min-width: 0;
    padding: 10px 11px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface-raised);
    color: var(--text);
    font: inherit;
    font-size: 12px;
  }
  textarea { resize: vertical; line-height: 1.6; }
  .create-row, .save-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }
  .primary-button, .secondary-button, .danger-button, .text-button {
    min-height: 40px;
    padding: 9px 13px;
    border: 1px solid var(--border);
    border-radius: 9px;
    font-size: 11px;
    font-weight: 750;
    cursor: pointer;
    white-space: nowrap;
  }
  .primary-button { border-color: var(--primary); background: var(--primary); color: var(--primary-ink); }
  .secondary-button { background: var(--surface-raised); color: var(--text); }
  .danger-button { background: var(--surface); color: var(--danger); }
  .text-button { min-height: 32px; padding: 5px 8px; background: transparent; color: var(--muted); }
  button:disabled { opacity: .55; cursor: wait; }
  .workspace { display: grid; grid-template-columns: minmax(210px, 270px) minmax(0, 1fr); gap: 16px; align-items: start; }
  .project-list, .editor { padding: 16px; }
  .list-heading { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 12px; color: var(--muted); font-size: 10px; }
  .project-choice {
    display: grid;
    width: 100%;
    gap: 4px;
    margin-top: 7px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface-raised);
    color: var(--text);
    text-align: left;
    cursor: pointer;
  }
  .project-choice.active { border-color: var(--primary); }
  .project-choice strong { font-size: 12px; }
  .project-choice span, .project-choice small { color: var(--muted); font-size: 10px; }
  .editor-heading, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  h2 { margin: 7px 0 15px; font: 500 23px / 1.2 Georgia, serif; }
  h3 { margin: 5px 0 0; font: 500 18px / 1.2 Georgia, serif; }
  .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 16px 0; }
  .wide-field { margin: 16px 0 22px; }
  .section-heading { margin: 22px 0 12px; }
  .sections { display: grid; gap: 12px; }
  .section-card { padding: 13px; border: 1px solid var(--border); border-radius: 10px; }
  .section-card-heading { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; align-items: center; gap: 8px; margin-bottom: 12px; }
  .section-number { display: grid; width: 24px; height: 24px; place-items: center; border-radius: 50%; background: var(--surface-raised); color: var(--muted); font-size: 10px; }
  .save-row { justify-content: space-between; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border); }
  .save-row span { color: var(--muted); font-size: 10px; }
  .empty-editor { padding: 38px 12px; text-align: center; }
  .empty-editor p { color: var(--muted); font-size: 12px; }
  .status { margin: 12px 0; padding: 10px 12px; border: 1px solid var(--border); border-radius: 9px; font-size: 11px; }
  .status.success { color: var(--success); }
  .status.error { color: var(--danger); }
  .rights-note { margin-top: 18px; font-size: 10px; }
  button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  @media (max-width: 760px) {
    .workspace { grid-template-columns: 1fr; }
    .project-list { order: 2; }
    .editor { order: 1; }
  }
  @media (max-width: 540px) {
    .field-grid { grid-template-columns: 1fr; }
    .create-row { align-items: stretch; flex-direction: column; }
    .create-row button { width: 100%; }
    .section-card-heading { grid-template-columns: 24px minmax(0, 1fr); }
    .section-card-heading .text-button { grid-column: 2; justify-self: start; }
    .save-row { align-items: stretch; flex-direction: column; }
    .save-row button { width: 100%; }
  }
</style>
