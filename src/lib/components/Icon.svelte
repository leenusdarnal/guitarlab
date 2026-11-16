<script lang="ts">
  type IconName =
    | 'fretboard'
    | 'chord'
    | 'theory'
    | 'ear'
    | 'microphone'
    | 'metronome'
    | 'tuner'
    | 'song';

  type Props = {
    name: IconName;
    size?: number;
  };

  let { name, size = 24 }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
  data-icon={name}
>
  {#if name === 'fretboard'}
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 3v18M12 3v18M16 3v18M4 7h16M4 11h16M4 15h16" />
  {:else if name === 'chord'}
    <path d="M5 4v16M10 4v16M15 4v16M20 4v16M3 8h19M3 14h19" />
    <circle cx="5" cy="8" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="20" cy="8" r="1.4" fill="currentColor" stroke="none" />
  {:else if name === 'theory'}
    <path d="M12 7c-2-2-4-3-8-3v15c4 0 6 1 8 3m0-15c2-2 4-3 8-3v15c-4 0-6 1-8 3m0-15v15" />
  {:else if name === 'ear'}
    <path d="M20 9a8 8 0 0 0-16 0c0 2.2 1.2 3.6 2.5 5.1 1 1.1 1.5 2 1.5 3.4A3.5 3.5 0 0 0 11.5 21c2 0 3.3-1.2 3.8-3.1l.3-1.1c.2-.8.7-1.4 1.5-2.2C19 12.6 20 11 20 9Z" />
    <path d="M10 7a3 3 0 0 1 3 3c0 1-.5 1.7-1.3 2.4-.7.6-1.2 1.3-1.2 2.6" />
  {:else if name === 'microphone'}
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M9 22h6" />
  {:else if name === 'metronome'}
    <path d="M7 21h10l3-17H4l3 17Z" />
    <path d="M12 7 8.5 17M12 7l4 4" />
    <circle cx="12" cy="7" r="1.3" fill="currentColor" stroke="none" />
  {:else if name === 'tuner'}
    <path d="M3 9c2.25-2.5 4.5-2.5 6.75 0s4.5 2.5 6.75 0 4.5-2.5 6.75 0M3 15c2.25 2.5 4.5 2.5 6.75 0s4.5-2.5 6.75 0 4.5 2.5 6.75 0" />
    <path d="M12 4v16M9 7h6M9 17h6" />
  {:else if name === 'song'}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M10 18v-7l6-1v7" />
    <circle cx="8" cy="18" r="2" />
    <circle cx="14" cy="17" r="2" />
  {/if}
</svg>
