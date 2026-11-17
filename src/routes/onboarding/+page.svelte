<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import Icon from '../../lib/components/Icon.svelte';
  import Brand from '../../lib/components/Brand.svelte';
  import {
    createEmptyProfilePreferences,
    profilePreferencesSchema,
    type ProfilePreferences
  } from '../../lib/domain/profile/preferences';
  import { lessonPresentationOptions } from '../../lib/domain/profile/lesson-presentation';
  import {
    loadActiveLearnerProfile,
    saveActiveLearnerPreferences
  } from '../../lib/storage/indexeddb';

  let preferences = $state<ProfilePreferences>(createEmptyProfilePreferences());
  let message = $state('');
  let isLoading = $state(true);
  let isSaving = $state(false);
  let hasSavedPreferences = $state(false);
  let customPracticeMinutes = $state('30');
  let customPracticeTouched = $state(false);
  let customPracticeError = $state('');

  onMount(() => {
    let active = true;
    void loadActiveLearnerProfile()
      .then((profile) => {
        if (active) {
          preferences = profile.preferences;
          customPracticeMinutes = String(profile.preferences.practiceMinutes ?? 30);
        }
      })
      .catch(() => {
        if (active) {
          message = 'Local storage is unavailable. Your choices have not been saved.';
        }
      })
      .finally(() => {
        if (active) isLoading = false;
      });

    return () => {
      active = false;
    };
  });

  const goalOptions = [
    { value: 'all-round-musician', label: 'All-round musician' },
    { value: 'acoustic-fingerstyle', label: 'Acoustic & fingerstyle' },
    { value: 'rock-blues', label: 'Rock & blues' },
    { value: 'jazz-harmony', label: 'Jazz & harmony' },
    { value: 'singer-songwriter', label: 'Singer-songwriter' },
    { value: 'custom', label: 'Something else' }
  ] as const;
  const practiceOptions = [10, 20, 40, 60] as const;

  function updateCustomPracticeMinutes(event: Event) {
    customPracticeMinutes = (event.currentTarget as HTMLInputElement).value;
    customPracticeTouched = true;
  }

  function commitCustomPracticeMinutes() {
    if (!customPracticeTouched) return true;
    const minutes = Number(customPracticeMinutes);
    if (!Number.isSafeInteger(minutes) || minutes < 5 || minutes > 180) {
      customPracticeError = 'Choose a whole number from 5 to 180 minutes.';
      return false;
    }
    preferences.practiceMinutes = minutes;
    customPracticeError = '';
    customPracticeTouched = false;
    return true;
  }

  function clearSaveConfirmation() {
    hasSavedPreferences = false;
    message = '';
  }

  async function submitSetup(event: SubmitEvent) {
    event.preventDefault();
    if (!commitCustomPracticeMinutes()) return;
    const result = profilePreferencesSchema.safeParse(preferences);
    if (!result.success) {
      message = 'Please review the selected preferences.';
      return;
    }

    isSaving = true;
    message = '';
    try {
      const saved = await saveActiveLearnerPreferences(result.data);
      preferences = saved.preferences;
      hasSavedPreferences = true;
      message = 'Your preferences have been saved privately on this device.';
    } catch {
      hasSavedPreferences = false;
      message = 'Could not save your preferences. Your existing local profile has been left unchanged.';
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Learner setup — GuitarLab</title>
  <meta name="description" content="Choose musical goals and a daily practice target for GuitarLab. Every choice is optional." />
</svelte:head>

<main class="setup-page">
  <header><a href={resolve('/')} class="brand"><Brand size="small" /></a><a href={resolve('/')} class="skip"><Icon name="arrow-left" size={14} /> Back to Today</a></header>
  <section class="setup-card">
    <div class="eyebrow">YOUR LEARNING PROFILE · OPTIONAL SETUP</div>
    <h1>Make GuitarLab <em>yours.</em></h1>
    <p class="intro">Choose a musical direction and a realistic practice target. Only preferences that currently change your daily plan appear here. You can skip either choice or return to update them later.</p>

    <form onsubmit={submitSetup} onchange={clearSaveConfirmation}>
      <fieldset>
        <legend>01 · What would you like to work towards?</legend>
        <div class="choices">
          {#each goalOptions as item (item.value)}
            <label class:chosen={preferences.goals.includes(item.value)}><input type="checkbox" checked={preferences.goals.includes(item.value)} onchange={(event)=>{preferences.goals=event.currentTarget.checked?[...preferences.goals,item.value as ProfilePreferences['goals'][number]]:preferences.goals.filter(goal=>goal!==item.value)}}/><span>{item.label}</span></label>
          {/each}
        </div>
        <p class="preference-effect">These goals shape the musical application suggestions in your daily plan.</p>
      </fieldset>
      <fieldset>
        <legend>02 · How long would you like to practise?</legend>
        <div class="choices four">
          {#each practiceOptions as minutes (minutes)}
            <label class:chosen={preferences.practiceMinutes===minutes}><input type="radio" name="minutes" value={minutes} checked={preferences.practiceMinutes===minutes} onchange={()=>{preferences.practiceMinutes=minutes;customPracticeMinutes=String(minutes);customPracticeTouched=false;customPracticeError='';}}/><span>{minutes} min</span></label>
          {/each}
        </div>
        <label class="custom-practice">
          Or choose any duration from 5 to 180 minutes
          <input id="custom-practice-minutes" type="number" min="5" max="180" step="1" value={customPracticeMinutes} oninput={updateCustomPracticeMinutes} onblur={commitCustomPracticeMinutes} aria-invalid={Boolean(customPracticeError)} aria-describedby="custom-practice-help" />
        </label>
        <p id="custom-practice-help" class="custom-practice-help">
          {customPracticeError || 'Your saved target pre-fills Practice Studio and guides your daily plan. It is a flexible target, not a quota.'}
        </p>
      </fieldset>
      <fieldset>
        <legend>03 · How should a lesson be presented?</legend>
        <div class="choices presentation-choices">
          {#each lessonPresentationOptions as item (item.value)}
            <label class:chosen={(preferences.lessonPresentation ?? 'balanced') === item.value}>
              <input
                type="radio"
                name="lessonPresentation"
                value={item.value}
                checked={(preferences.lessonPresentation ?? 'balanced') === item.value}
                onchange={() => (preferences.lessonPresentation = item.value)}
              />
              <span class="presentation-choice-copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </label>
          {/each}
        </div>
        <p class="preference-effect">
          This changes the order of teaching sections, not the learning goals or content. Every lesson keeps its full text, exercises and checkpoints.
        </p>
      </fieldset>
      <div class="form-actions"><button type="submit" disabled={isLoading || isSaving}>{isLoading ? 'Loading profile…' : isSaving ? 'Saving…' : 'Save my preferences'} <Icon name="arrow-right" size={14} /></button><a href={resolve('/')}>Return to Today</a></div>
      {#if message}<p class="message" role="status">{message}</p>{/if}
      {#if hasSavedPreferences}
        <a class="return-today" href={resolve('/')}>Go to Today <Icon name="arrow-right" size={14} /></a>
      {/if}
    </form>
    <p class="privacy-note">Privacy by design: your profile and preferences are stored in this browser only. They are not uploaded or synced to a server. No account or microphone permission is required.</p>
  </section>
</main>

<style>
  .setup-page{max-width:850px;margin:0 auto;padding:25px 22px 70px}.setup-page header{display:flex;justify-content:space-between;align-items:center;margin-bottom:48px}.brand{display:inline-flex;align-items:center;text-decoration:none}.skip{font-size:12px;color:var(--muted)}.setup-card{border:1px solid var(--border);border-radius:22px;background:var(--surface);padding:clamp(22px,5vw,48px)}.eyebrow{font-size:10px;letter-spacing:1.3px;color:var(--muted);font-weight:750}.setup-card h1{font:500 clamp(34px,6vw,48px)/1.1 Georgia,serif;letter-spacing:-1.5px;margin:13px 0}.setup-card h1 em{color:var(--primary)}.intro{color:var(--muted);font-size:13px;line-height:1.7;max-width:600px;margin:0 0 32px}fieldset{border:0;border-top:1px solid var(--border);padding:23px 0 0;margin:0 0 25px}legend{padding:0 0 14px;font-size:13px;font-weight:700}.choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.choices.four{grid-template-columns:repeat(4,minmax(0,1fr))}.choices label{display:flex;align-items:center;gap:10px;min-height:46px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;color:var(--muted);font-size:12px;cursor:pointer}.choices label.chosen{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 9%,var(--surface));color:var(--text)}.choices input{accent-color:var(--primary)}select{width:100%;min-height:46px;border:1px solid var(--border);border-radius:10px;padding:0 12px;background:var(--surface-raised);color:var(--text);font-size:12px}.custom-practice{display:grid;gap:7px;margin-top:14px;color:var(--muted);font-size:12px;font-weight:650}.custom-practice input{width:100%;max-width:220px;min-height:44px;border:1px solid var(--border);border-radius:9px;padding:8px 11px;background:var(--surface-raised);color:var(--text);font:inherit}.custom-practice-help{min-height:20px;margin:7px 0 0;color:var(--muted);font-size:11px}.form-actions{display:flex;align-items:center;gap:18px;margin-top:32px}.form-actions button:disabled{opacity:.65;cursor:wait}.form-actions button{border:0;border-radius:10px;padding:13px 17px;background:var(--primary);color:var(--primary-ink);font-weight:750;font-size:12px;cursor:pointer}.form-actions button :global(.icon){margin-left:12px}.form-actions>a{font-size:12px;color:var(--muted)}.message{padding:12px;background:var(--surface-raised);border-radius:9px;font-size:12px;line-height:1.6}.preference-effect{margin:10px 0 0;color:var(--muted);font-size:11px;line-height:1.6}.return-today{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:12px;padding:11px 16px;border:1px solid var(--primary);border-radius:10px;color:var(--primary);font-size:12px;font-weight:750}.privacy-note{border-top:1px solid var(--border);padding-top:18px;margin:25px 0 0;color:var(--muted);font-size:11px;line-height:1.7}@media(max-width:520px){.choices,.choices.four{grid-template-columns:1fr 1fr}.setup-page header{margin-bottom:28px}.form-actions{align-items:stretch;flex-direction:column}.form-actions button{width:100%}}

  .presentation-choices label {
    min-height: 82px;
    align-items: flex-start;
  }

  .presentation-choice-copy {
    display: grid;
    gap: 4px;
  }

  .presentation-choice-copy strong {
    color: var(--text);
    font-size: var(--font-size-supporting);
  }

  .presentation-choice-copy small {
    color: var(--muted);
    font-size: var(--font-size-metadata);
    line-height: 1.5;
  }

  /* Keep first-run explanations readable; reserve compact type for true metadata. */
  .skip,
  .choices label,
  .form-actions button,
  .form-actions > a,
  .message,
  .preference-effect,
  .custom-practice,
  .custom-practice-help,
  .privacy-note {
    font-size: var(--font-size-supporting);
    line-height: var(--line-height-body);
  }

  .intro {
    font-size: var(--font-size-body);
    line-height: var(--line-height-body);
  }

  .eyebrow {
    font-size: var(--font-size-metadata);
  }

  .choices label {
    min-height: 48px;
  }

  .form-actions button {
    min-height: 44px;
  }
</style>
