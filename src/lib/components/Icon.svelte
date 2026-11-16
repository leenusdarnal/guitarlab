<script lang="ts">
  type IconName =
    | 'fretboard'
    | 'chord'
    | 'theory'
    | 'ear'
    | 'microphone'
    | 'metronome'
    | 'tuner'
    | 'song'
    | 'home'
    | 'book-open'
    | 'toolbox'
    | 'route'
    | 'target'
    | 'calendar-clock'
    | 'history'
    | 'settings'
    | 'download'
    | 'menu'
    | 'close'
    | 'external-link'
    | 'sparkles'
    | 'clock'
    | 'check'
    | 'circle'
    | 'arrow-right';

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
  {:else if name === 'home'}
    <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  {:else if name === 'book-open'}
    <path d="M12 7v14M12 7C9.5 4.8 6.4 4 3 4v14c3.4 0 6.5.8 9 3m0-14c2.5-2.2 5.6-3 9-3v14c-3.4 0-6.5.8-9 3" />
  {:else if name === 'toolbox'}
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 13h18M10 13v3h4v-3" />
  {:else if name === 'route'}
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <path d="M6 15.5v-3a3 3 0 0 1 3-3h6a3 3 0 0 0 3-3" />
  {:else if name === 'target'}
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  {:else if name === 'calendar-clock'}
    <rect x="3" y="4" width="13" height="16" rx="2" />
    <path d="M7 2v4M12 2v4M3 9h13M16 15a5 5 0 1 0 5-5" />
    <path d="M16 12v3l2 1" />
  {:else if name === 'history'}
    <path d="M3 11a9 9 0 1 1 2.6 6.4M3 4v7h7" />
    <path d="M12 7v5l3 2" />
  {:else if name === 'settings'}
    <circle cx="12" cy="12" r="3" />
    <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4L5.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1L9 7.4h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" />
  {:else if name === 'download'}
    <path d="M12 3v12m-5-5 5 5 5-5M4 20h16" />
  {:else if name === 'menu'}
    <path d="M4 6h16M4 12h16M4 18h16" />
  {:else if name === 'close'}
    <path d="m6 6 12 12M18 6 6 18" />
  {:else if name === 'external-link'}
    <path d="M14 3h7v7M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  {:else if name === 'sparkles'}
    <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
    <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 2l.7 2.3L8 5l-2.3.7L5 8l-.7-2.3L2 5l2.3-.7L5 2Z" />
  {:else if name === 'clock'}
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  {:else if name === 'check'}
    <path d="m5 12 4 4L19 6" />
  {:else if name === 'circle'}
    <circle cx="12" cy="12" r="8.5" />
  {:else if name === 'arrow-right'}
    <path d="M4 12h16m-6-6 6 6-6 6" />
  {/if}
</svg>
