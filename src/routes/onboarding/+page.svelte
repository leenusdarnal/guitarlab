<script lang="ts">
  import { resolve } from '$app/paths';
  import { createEmptyProfilePreferences, profilePreferencesSchema, type ProfilePreferences } from '$lib/domain/profile/preferences';

  let preferences = $state<ProfilePreferences>(createEmptyProfilePreferences());
  let message = $state('');
  const instruments = [
    { value: 'acoustic', label: 'Acoustic guitar' },
    { value: 'electric', label: 'Electric guitar' },
    { value: 'classical', label: 'Classical guitar' },
    { value: 'other', label: 'Other' }
  ] as const;
  const startingPoints = [
    { value: 'fresh-beginner', label: 'Starting from the beginning' },
    { value: 'some-experience', label: 'I know a few things already' },
    { value: 'placement-needed', label: 'Help me find my level' }
  ] as const;
  const goalOptions = [
    { value: 'all-round-musician', label: 'All-round musician' },
    { value: 'acoustic-fingerstyle', label: 'Acoustic & fingerstyle' },
    { value: 'rock-blues', label: 'Rock & blues' },
    { value: 'jazz-harmony', label: 'Jazz & harmony' },
    { value: 'singer-songwriter', label: 'Singer-songwriter' },
    { value: 'custom', label: 'Something else' }
  ] as const;
  const practiceOptions = [10, 20, 40, 60] as const;

  function submitSetup(event: SubmitEvent) {
    event.preventDefault();
    const result = profilePreferencesSchema.safeParse(preferences);
    if (!result.success) {
      message = 'Please review the selected preferences.';
      return;
    }
    message = 'Your setup is valid. Profile persistence will be enabled with the local-data milestone; nothing has been uploaded or saved yet.';
  }
</script>

<svelte:head>
  <title>Learner setup — GuitarLab</title>
  <meta name="description" content="Configure your guitar, goals and learning preferences. Every question is optional." />
</svelte:head>

<main class="setup-page">
  <header><a href={resolve('/')} class="brand"><span class="mark">G</span><strong>GuitarLab</strong></a><a href={resolve('/')} class="skip">Skip for now ↗</a></header>
  <section class="setup-card">
    <div class="eyebrow">YOUR LEARNING PROFILE · OPTIONAL SETUP</div>
    <h1>Make GuitarLab <em>yours.</em></h1>
    <p class="intro">A few preferences can make lessons more useful. Skip anything you're unsure about — you can change these choices later.</p>

    <form onsubmit={submitSetup}>
      <fieldset>
        <legend>01 · What instrument do you play?</legend>
        <div class="choices">
          {#each instruments as item}
            <label class:chosen={preferences.instrument===item.value}><input type="radio" name="instrument" value={item.value} bind:group={preferences.instrument}/><span>{item.label}</span></label>
          {/each}
        </div>
      </fieldset>
      <fieldset>
        <legend>02 · Which hand do you fret with?</legend>
        <div class="choices two">
          <label class:chosen={preferences.handedness==='right'}><input type="radio" name="handedness" value="right" bind:group={preferences.handedness}/><span>Right-handed · left hand frets</span></label>
          <label class:chosen={preferences.handedness==='left'}><input type="radio" name="handedness" value="left" bind:group={preferences.handedness}/><span>Left-handed · right hand frets</span></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>03 · Where are you starting?</legend>
        <div class="choices">
          {#each startingPoints as item}
            <label class:chosen={preferences.startingPoint===item.value}><input type="radio" name="starting" value={item.value} bind:group={preferences.startingPoint}/><span>{item.label}</span></label>
          {/each}
        </div>
      </fieldset>
      <fieldset>
        <legend>04 · What would you like to work towards?</legend>
        <div class="choices">
          {#each goalOptions as item}
            <label class:chosen={preferences.goals.includes(item.value)}><input type="checkbox" checked={preferences.goals.includes(item.value)} onchange={(event)=>{preferences.goals=event.currentTarget.checked?[...preferences.goals,item.value as ProfilePreferences['goals'][number]]:preferences.goals.filter(goal=>goal!==item.value)}}/><span>{item.label}</span></label>
          {/each}
        </div>
      </fieldset>
      <fieldset>
        <legend>05 · How long would you like to practise?</legend>
        <div class="choices four">
          {#each practiceOptions as minutes}
            <label class:chosen={preferences.practiceMinutes===minutes}><input type="radio" name="minutes" value={minutes} checked={preferences.practiceMinutes===minutes} onchange={()=>preferences.practiceMinutes=minutes}/><span>{minutes} min</span></label>
          {/each}
        </div>
      </fieldset>
      <fieldset>
        <legend>06 · How do you prefer to learn?</legend>
        <select bind:value={preferences.lessonPresentation} aria-label="Preferred lesson presentation">
          <option value={null}>No preference — balanced</option>
          <option value="balanced">Balanced explanations and practice</option>
          <option value="visual-first">Visual-first</option>
          <option value="demonstration-first">Demonstration and audio-first</option>
          <option value="text-first">Text and reading-first</option>
          <option value="interactive-first">Interactive drills-first</option>
          <option value="song-first">Song-first</option>
        </select>
      </fieldset>
      <div class="form-actions"><button type="submit">Review my preferences <span>→</span></button><a href={resolve('/')}>I'll do this later</a></div>
      {#if message}<p class="message" role="status">{message}</p>{/if}
    </form>
    <p class="privacy-note">Privacy by design: this first setup preview validates your choices in this page only. Local profile saving arrives with the local-persistence milestone. No account or microphone permission is required.</p>
  </section>
</main>

<style>
  .setup-page{max-width:850px;margin:0 auto;padding:25px 22px 70px}.setup-page header{display:flex;justify-content:space-between;align-items:center;margin-bottom:48px}.brand{display:flex;align-items:center;gap:10px}.mark{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:var(--primary);color:var(--primary-ink);font:700 22px Georgia,serif}.brand strong{font-size:15px}.skip{font-size:12px;color:var(--muted)}.setup-card{border:1px solid var(--border);border-radius:22px;background:var(--surface);padding:clamp(22px,5vw,48px)}.eyebrow{font-size:10px;letter-spacing:1.3px;color:var(--muted);font-weight:750}.setup-card h1{font:500 clamp(34px,6vw,48px)/1.1 Georgia,serif;letter-spacing:-1.5px;margin:13px 0}.setup-card h1 em{color:var(--primary)}.intro{color:var(--muted);font-size:13px;line-height:1.7;max-width:600px;margin:0 0 32px}fieldset{border:0;border-top:1px solid var(--border);padding:23px 0 0;margin:0 0 25px}legend{padding:0 0 14px;font-size:13px;font-weight:700}.choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.choices.four{grid-template-columns:repeat(4,minmax(0,1fr))}.choices label{display:flex;align-items:center;gap:10px;min-height:46px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;color:var(--muted);font-size:12px;cursor:pointer}.choices label.chosen{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 9%,var(--surface));color:var(--text)}.choices input{accent-color:var(--primary)}select{width:100%;min-height:46px;border:1px solid var(--border);border-radius:10px;padding:0 12px;background:var(--surface-raised);color:var(--text);font-size:12px}.form-actions{display:flex;align-items:center;gap:18px;margin-top:32px}.form-actions button{border:0;border-radius:10px;padding:13px 17px;background:var(--primary);color:var(--primary-ink);font-weight:750;font-size:12px;cursor:pointer}.form-actions button span{padding-left:12px}.form-actions>a{font-size:12px;color:var(--muted)}.message{padding:12px;background:var(--surface-raised);border-radius:9px;font-size:12px;line-height:1.6}.privacy-note{border-top:1px solid var(--border);padding-top:18px;margin:25px 0 0;color:var(--muted);font-size:11px;line-height:1.7}@media(max-width:520px){.choices,.choices.four{grid-template-columns:1fr 1fr}.setup-page header{margin-bottom:28px}.form-actions{align-items:stretch;flex-direction:column}.form-actions button{width:100%}}
</style>
