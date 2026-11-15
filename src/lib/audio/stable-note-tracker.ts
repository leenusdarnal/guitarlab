import type { PitchEstimate } from './pitch-estimator';

export interface StableNoteTrackerOptions {
  /** Number of consecutive frames required before publishing a note. */
  confirmationFrames?: number;
  /** Number of unusable frames tolerated before releasing a stable note. */
  releaseFrames?: number;
  /** Maximum interval between frames before a candidate streak is restarted. */
  maxGapMs?: number;
  /** Number of recent frequency/confidence samples used for median smoothing. */
  smoothingWindow?: number;
  /** Minimum confidence required for a frame to participate in tracking. */
  minConfidence?: number;
  /** Semitone distance required before a different note can replace the active note. */
  switchThresholdSemitones?: number;
}

export interface StableNote {
  midiNote: number;
  noteName: string;
  frequencyHz: number;
  confidence: number;
}

export interface StableNoteUpdate {
  status: 'none' | 'candidate' | 'stable';
  event: 'note-on' | 'note-change' | 'note-off' | null;
  note: StableNote | null;
  candidateMidiNote: number | null;
  consecutiveFrames: number;
}

const DEFAULT_OPTIONS = {
  confirmationFrames: 3,
  releaseFrames: 3,
  maxGapMs: 180,
  smoothingWindow: 5,
  minConfidence: 0.8,
  switchThresholdSemitones: 0.65
} as const;

const NOTE_NAMES = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B'
] as const;

/**
 * Converts successive single-note pitch estimates into stable note events.
 *
 * The tracker is deterministic and has no browser dependencies. It applies
 * confidence gating, consecutive-frame confirmation, median smoothing and
 * switch/release hysteresis. It does not retain audio samples.
 */
export class StableNoteTracker {
  private readonly options: Required<StableNoteTrackerOptions>;
  private activeNote: StableNote | null = null;
  private candidateMidiNote: number | null = null;
  private candidateFrames = 0;
  private candidateFrequencies: number[] = [];
  private candidateConfidences: number[] = [];
  private activeFrequencies: number[] = [];
  private activeConfidences: number[] = [];
  private invalidFrames = 0;
  private lastTimestampMs: number | null = null;

  constructor(options: StableNoteTrackerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.validateOptions();
  }

  update(estimate: PitchEstimate, timestampMs: number): StableNoteUpdate {
    if (!Number.isFinite(timestampMs) || timestampMs < 0) {
      throw new RangeError('Timestamp must be a finite non-negative number.');
    }

    if (this.lastTimestampMs !== null && timestampMs < this.lastTimestampMs) {
      throw new RangeError('Timestamps must be monotonic.');
    }

    if (
      this.lastTimestampMs !== null &&
      timestampMs - this.lastTimestampMs > this.options.maxGapMs
    ) {
      this.resetCandidate();
      if (this.activeNote) {
        this.activeNote = null;
        this.activeFrequencies = [];
        this.activeConfidences = [];
        this.invalidFrames = 0;
        this.lastTimestampMs = timestampMs;
        return this.result('none', 'note-off', null);
      }
    }
    this.lastTimestampMs = timestampMs;

    if (
      estimate.status !== 'detected' ||
      !Number.isFinite(estimate.frequencyHz) ||
      estimate.frequencyHz <= 0 ||
      !Number.isFinite(estimate.confidence) ||
      estimate.confidence < this.options.minConfidence
    ) {
      return this.handleInvalidFrame();
    }

    this.invalidFrames = 0;
    const midiFloat = frequencyToMidi(estimate.frequencyHz);
    const midiNote = Math.round(midiFloat);

    if (this.activeNote) {
      const distanceFromActive = Math.abs(midiFloat - this.activeNote.midiNote);
      if (
        midiNote === this.activeNote.midiNote ||
        distanceFromActive < this.options.switchThresholdSemitones
      ) {
        this.resetCandidate();
        if (midiNote === this.activeNote.midiNote) {
          pushLimited(
            this.activeFrequencies,
            estimate.frequencyHz,
            this.options.smoothingWindow
          );
          pushLimited(
            this.activeConfidences,
            estimate.confidence,
            this.options.smoothingWindow
          );
          this.activeNote = this.makeNote(
            this.activeNote.midiNote,
            this.activeFrequencies,
            this.activeConfidences
          );
        }
        return this.result('stable', null, this.activeNote);
      }
    }

    if (this.candidateMidiNote !== midiNote) {
      this.candidateMidiNote = midiNote;
      this.candidateFrames = 0;
      this.candidateFrequencies = [];
      this.candidateConfidences = [];
    }

    this.candidateFrames += 1;
    pushLimited(
      this.candidateFrequencies,
      estimate.frequencyHz,
      this.options.smoothingWindow
    );
    pushLimited(
      this.candidateConfidences,
      estimate.confidence,
      this.options.smoothingWindow
    );

    if (this.candidateFrames < this.options.confirmationFrames) {
      return this.result(
        this.activeNote ? 'stable' : 'candidate',
        null,
        this.activeNote
      );
    }

    const nextNote = this.makeNote(
      midiNote,
      this.candidateFrequencies,
      this.candidateConfidences
    );
    const event = this.activeNote ? 'note-change' : 'note-on';
    this.activeNote = nextNote;
    this.activeFrequencies = [...this.candidateFrequencies];
    this.activeConfidences = [...this.candidateConfidences];
    this.resetCandidate();
    return this.result('stable', event, this.activeNote);
  }

  /** Clear all tracking state without emitting an event. */
  reset(): void {
    this.activeNote = null;
    this.activeFrequencies = [];
    this.activeConfidences = [];
    this.invalidFrames = 0;
    this.lastTimestampMs = null;
    this.resetCandidate();
  }

  private handleInvalidFrame(): StableNoteUpdate {
    this.resetCandidate();
    if (!this.activeNote) return this.result('none', null, null);

    this.invalidFrames += 1;
    if (this.invalidFrames >= this.options.releaseFrames) {
      this.activeNote = null;
      this.activeFrequencies = [];
      this.activeConfidences = [];
      this.invalidFrames = 0;
      return this.result('none', 'note-off', null);
    }
    return this.result('stable', null, this.activeNote);
  }

  private makeNote(
    midiNote: number,
    frequencies: number[],
    confidences: number[]
  ): StableNote {
    return {
      midiNote,
      noteName: midiNoteToName(midiNote),
      frequencyHz: median(frequencies),
      confidence: median(confidences)
    };
  }

  private result(
    status: StableNoteUpdate['status'],
    event: StableNoteUpdate['event'],
    note: StableNote | null
  ): StableNoteUpdate {
    return {
      status,
      event,
      note,
      candidateMidiNote: this.candidateMidiNote,
      consecutiveFrames: this.candidateFrames
    };
  }

  private resetCandidate(): void {
    this.candidateMidiNote = null;
    this.candidateFrames = 0;
    this.candidateFrequencies = [];
    this.candidateConfidences = [];
  }

  private validateOptions(): void {
    const {
      confirmationFrames,
      releaseFrames,
      maxGapMs,
      smoothingWindow,
      minConfidence,
      switchThresholdSemitones
    } = this.options;
    if (!Number.isInteger(confirmationFrames) || confirmationFrames < 1) {
      throw new RangeError('Confirmation frames must be a positive integer.');
    }
    if (!Number.isInteger(releaseFrames) || releaseFrames < 1) {
      throw new RangeError('Release frames must be a positive integer.');
    }
    if (!Number.isFinite(maxGapMs) || maxGapMs <= 0) {
      throw new RangeError(
        'Maximum frame gap must be a positive finite number.'
      );
    }
    if (!Number.isInteger(smoothingWindow) || smoothingWindow < 1) {
      throw new RangeError('Smoothing window must be a positive integer.');
    }
    if (
      !Number.isFinite(minConfidence) ||
      minConfidence < 0 ||
      minConfidence > 1
    ) {
      throw new RangeError('Minimum confidence must be between 0 and 1.');
    }
    if (
      !Number.isFinite(switchThresholdSemitones) ||
      switchThresholdSemitones <= 0 ||
      switchThresholdSemitones > 1
    ) {
      throw new RangeError(
        'Switch threshold must be greater than 0 and at most 1 semitone.'
      );
    }
  }
}

function frequencyToMidi(frequencyHz: number): number {
  return 69 + 12 * Math.log2(frequencyHz / 440);
}

function midiNoteToName(midiNote: number): string {
  const pitchClass = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  return `${NOTE_NAMES[pitchClass]}${octave}`;
}

function pushLimited(values: number[], value: number, limit: number): void {
  values.push(value);
  if (values.length > limit) values.shift();
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}
