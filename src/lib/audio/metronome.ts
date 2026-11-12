export const MIN_METRONOME_BPM = 40;
export const MAX_METRONOME_BPM = 240;

export function validateMetronomeTempo(bpm: number): number {
  if (!Number.isInteger(bpm) || bpm < MIN_METRONOME_BPM || bpm > MAX_METRONOME_BPM) {
    throw new RangeError(
      `Tempo must be a whole number from ${MIN_METRONOME_BPM} to ${MAX_METRONOME_BPM} BPM.`
    );
  }
  return bpm;
}

/**
 * A lookahead-scheduled metronome. JavaScript timers only queue events;
 * Web Audio's clock determines when each click is actually played.
 */
export class WebAudioMetronome {
  private context: AudioContext | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private nextBeatTime = 0;
  private beatIndex = 0;
  private bpm: number;
  private beatsPerBar: number;

  private readonly tickMilliseconds = 25;
  private readonly lookaheadSeconds = 0.1;

  constructor(options?: { bpm?: number; beatsPerBar?: number }) {
    this.bpm = validateMetronomeTempo(options?.bpm ?? 80);
    this.beatsPerBar = options?.beatsPerBar ?? 4;
    if (
      !Number.isInteger(this.beatsPerBar) ||
      this.beatsPerBar < 1 ||
      this.beatsPerBar > 12
    ) {
      throw new RangeError('Beats per bar must be a whole number from 1 to 12.');
    }
  }

  get isRunning(): boolean {
    return this.running;
  }

  get tempo(): number {
    return this.bpm;
  }

  setTempo(bpm: number): void {
    this.bpm = validateMetronomeTempo(bpm);
  }

  setBeatsPerBar(beats: number): void {
    if (!Number.isInteger(beats) || beats < 1 || beats > 12) {
      throw new RangeError('Beats per bar must be a whole number from 1 to 12.');
    }
    this.beatsPerBar = beats;
  }

  async start(): Promise<void> {
    if (this.running) return;
    if (typeof AudioContext === 'undefined') {
      throw new Error('Web Audio is not available in this browser.');
    }

    if (!this.context || this.context.state === 'closed') {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    if (this.context.state !== 'running') {
      throw new Error('Audio is not ready. Tap start again to enable the metronome.');
    }

    this.running = true;
    this.nextBeatTime = this.context.currentTime + 0.05;
    this.beatIndex = 0;
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.schedule();
  }

  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  async dispose(): Promise<void> {
    this.stop();
    if (this.context && this.context.state !== 'closed') {
      await this.context.close();
    }
    this.context = null;
  }

  private readonly handleVisibilityChange = () => {
    // Do not let a throttled background tab produce unpredictable practice clicks.
    if (document.visibilityState === 'hidden') this.stop();
  };

  private schedule = (): void => {
    const context = this.context;
    if (!this.running || !context || context.state !== 'running') {
      this.stop();
      return;
    }

    while (this.nextBeatTime < context.currentTime + this.lookaheadSeconds) {
      const accented = this.beatIndex % this.beatsPerBar === 0;
      this.scheduleClick(this.nextBeatTime, accented);
      this.nextBeatTime += 60 / this.bpm;
      this.beatIndex += 1;
    }

    this.timer = setTimeout(this.schedule, this.tickMilliseconds);
  };

  private scheduleClick(when: number, accented: boolean): void {
    const context = this.context;
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(accented ? 1480 : 990, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(accented ? 0.24 : 0.14, when + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(when);
    oscillator.stop(when + 0.07);
  }
}

/** Play a reference pitch only after the learner explicitly presses its control. */
export async function playReferenceTone(
  frequencyHz = 440,
  durationMilliseconds = 900
): Promise<void> {
  if (
    !Number.isFinite(frequencyHz) ||
    frequencyHz < 20 ||
    frequencyHz > 20_000
  ) {
    throw new RangeError('Reference tone frequency must be between 20 and 20,000 Hz.');
  }
  if (
    !Number.isInteger(durationMilliseconds) ||
    durationMilliseconds < 100 ||
    durationMilliseconds > 5_000
  ) {
    throw new RangeError('Reference tone duration must be between 100 and 5,000 ms.');
  }
  if (typeof AudioContext === 'undefined') {
    throw new Error('Web Audio is not available in this browser.');
  }

  const context = new AudioContext();
  try {
    if (context.state === 'suspended') await context.resume();
    if (context.state !== 'running') {
      throw new Error('Audio is not ready. Tap the reference tone again.');
    }

    await new Promise<void>((resolve, reject) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = context.currentTime + 0.02;
      const endAt = startAt + durationMilliseconds / 1_000;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequencyHz, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.01);
      gain.gain.setValueAtTime(0.2, endAt - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        resolve();
      };
      oscillator.onerror = () => reject(new Error('The reference tone could not be played.'));
      oscillator.start(startAt);
      oscillator.stop(endAt);
    });
  } finally {
    await context.close();
  }
}
