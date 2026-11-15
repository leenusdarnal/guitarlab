import { AudioContextSession } from './audio-context-session';

export const MIN_METRONOME_BPM = 40;
export const MAX_METRONOME_BPM = 240;

export function validateMetronomeTempo(bpm: number): number {
  if (
    !Number.isInteger(bpm) ||
    bpm < MIN_METRONOME_BPM ||
    bpm > MAX_METRONOME_BPM
  ) {
    throw new RangeError(
      'Tempo must be a whole number from ' +
        MIN_METRONOME_BPM +
        ' to ' +
        MAX_METRONOME_BPM +
        ' BPM.'
    );
  }
  return bpm;
}

/**
 * A lookahead-scheduled metronome. JavaScript timers only queue events;
 * Web Audio's clock determines when each click is actually played.
 */
export class WebAudioMetronome {
  private readonly audioSession = new AudioContextSession();

  private get context(): AudioContext | null {
    return this.audioSession.currentContext;
  }
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly scheduledOscillators = new Set<OscillatorNode>();
  private running = false;
  private nextBeatTime = 0;
  private beatIndex = 0;
  private bpm: number;
  private beatsPerBar: number;
  private readonly onStateChange?: (running: boolean) => void;

  private readonly tickMilliseconds = 25;
  private readonly lookaheadSeconds = 0.1;

  constructor(options?: {
    bpm?: number;
    beatsPerBar?: number;
    onStateChange?: (running: boolean) => void;
  }) {
    this.bpm = validateMetronomeTempo(options?.bpm ?? 80);
    this.onStateChange = options?.onStateChange;
    this.beatsPerBar = options?.beatsPerBar ?? 4;
    if (
      !Number.isInteger(this.beatsPerBar) ||
      this.beatsPerBar < 1 ||
      this.beatsPerBar > 12
    ) {
      throw new RangeError(
        'Beats per bar must be a whole number from 1 to 12.'
      );
    }
  }

  get isRunning(): boolean {
    return this.running;
  }

  get tempo(): number {
    return this.bpm;
  }

  get meter(): number {
    return this.beatsPerBar;
  }

  setTempo(bpm: number): void {
    this.bpm = validateMetronomeTempo(bpm);
  }

  setBeatsPerBar(beats: number): void {
    if (!Number.isInteger(beats) || beats < 1 || beats > 12) {
      throw new RangeError(
        'Beats per bar must be a whole number from 1 to 12.'
      );
    }
    if (beats !== this.beatsPerBar) {
      this.beatsPerBar = beats;
      this.beatIndex = 0;
    }
  }

  async start(): Promise<void> {
    if (this.running) return;
    const context = await this.audioSession.resume(
      'Audio is not ready. Tap start again to enable the metronome.'
    );

    this.running = true;
    this.onStateChange?.(true);
    this.nextBeatTime = context.currentTime + 0.05;
    this.beatIndex = 0;
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.schedule();
  }

  stop(): void {
    const wasRunning = this.running;
    this.running = false;
    if (wasRunning) this.onStateChange?.(false);
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    for (const oscillator of this.scheduledOscillators) {
      try {
        // Cancel clicks already queued inside the lookahead window as well.
        oscillator.stop();
      } catch {
        // A source may have ended between scheduling and stop().
      }
    }
    this.scheduledOscillators.clear();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  async dispose(): Promise<void> {
    this.stop();
    await this.audioSession.close();
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
    gain.gain.exponentialRampToValueAtTime(
      accented ? 0.24 : 0.14,
      when + 0.004
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
    oscillator.connect(gain);
    gain.connect(context.destination);
    this.scheduledOscillators.add(oscillator);
    oscillator.onended = () => {
      this.scheduledOscillators.delete(oscillator);
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
    throw new RangeError(
      'Reference tone frequency must be between 20 and 20,000 Hz.'
    );
  }
  if (
    !Number.isInteger(durationMilliseconds) ||
    durationMilliseconds < 100 ||
    durationMilliseconds > 5_000
  ) {
    throw new RangeError(
      'Reference tone duration must be between 100 and 5,000 ms.'
    );
  }
  const session = new AudioContextSession();
  try {
    const context = await session.resume(
      'Audio is not ready. Tap the reference tone again.'
    );

    let oscillator: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let nodesDisconnected = false;
    const disconnectNodes = () => {
      if (nodesDisconnected) return;
      nodesDisconnected = true;
      try {
        oscillator?.disconnect();
      } catch {
        // Preserve the original playback error while attempting all cleanup.
      }
      try {
        gain?.disconnect();
      } catch {
        // Preserve the original playback error while attempting all cleanup.
      }
    };

    await new Promise<void>((resolve, reject) => {
      try {
        oscillator = context.createOscillator();
        gain = context.createGain();
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
          disconnectNodes();
          resolve();
        };
        oscillator.start(startAt);
        oscillator.stop(endAt);
      } catch (error) {
        disconnectNodes();
        reject(error);
      }
    });
  } finally {
    await session.close();
  }
}
