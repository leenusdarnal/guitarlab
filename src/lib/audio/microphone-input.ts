import { AudioContextSession } from './audio-context-session';

export type MicrophoneInputErrorCode =
  | 'unsupported'
  | 'permission-denied'
  | 'no-device'
  | 'device-busy'
  | 'interrupted'
  | 'unknown';

export class MicrophoneInputError extends Error {
  constructor(
    message: string,
    readonly code: MicrophoneInputErrorCode,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'MicrophoneInputError';
  }
}

export interface MicrophoneAudioSession {
  resume(): Promise<AudioContext>;
  close(): Promise<void>;
}

type GetUserMedia = (
  constraints: MediaStreamConstraints
) => Promise<MediaStream>;

export interface MicrophoneInputOptions {
  getUserMedia?: GetUserMedia;
  createAudioSession?: () => MicrophoneAudioSession;
  fftSize?: number;
}

const DEFAULT_FFT_SIZE = 4_096;

/**
 * Captures microphone audio for one feature-owned session.
 *
 * Permission is requested only when start() is called. Audio is exposed as
 * short-lived analyser samples and is never uploaded, persisted, or logged.
 * The caller owns the sampling cadence and must call stop() or dispose().
 */
export class MicrophoneInput {
  private readonly getUserMedia: GetUserMedia;
  private readonly createAudioSession: () => MicrophoneAudioSession;
  private readonly fftSize: number;
  private session: MicrophoneAudioSession | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private trackEndHandlers = new Map<MediaStreamTrack, () => void>();
  private startPromise: Promise<void> | null = null;
  private generation = 0;
  private state: 'idle' | 'starting' | 'running' | 'disposed' = 'idle';

  constructor(options: MicrophoneInputOptions = {}) {
    this.getUserMedia = options.getUserMedia ?? browserGetUserMedia;
    this.createAudioSession =
      options.createAudioSession ?? (() => new AudioContextSession());
    this.fftSize = options.fftSize ?? DEFAULT_FFT_SIZE;

    if (
      !Number.isInteger(this.fftSize) ||
      this.fftSize < 32 ||
      this.fftSize > 32_768 ||
      (this.fftSize & (this.fftSize - 1)) !== 0
    ) {
      throw new RangeError('Analyser FFT size must be a power of two from 32 to 32768.');
    }
  }

  get isRunning(): boolean {
    return this.state === 'running';
  }

  /**
   * Start capture. Call directly from the learner's explicit Start button
   * handler so the browser can present its permission prompt.
   */
  start(): Promise<void> {
    if (this.state === 'disposed') {
      return Promise.reject(
        new MicrophoneInputError(
          'This microphone session has been disposed.',
          'interrupted'
        )
      );
    }
    if (this.state === 'running') return Promise.resolve();
    if (this.startPromise) return this.startPromise;

    const generation = ++this.generation;
    const session = this.createAudioSession();
    this.session = session;
    this.state = 'starting';

    let streamPromise: Promise<MediaStream>;
    try {
      // Invoke getUserMedia synchronously from start() rather than deferring
      // it to a timer/effect; browsers require a secure context and user action.
      streamPromise = this.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });
    } catch (error) {
      this.state = 'idle';
      this.session = null;
      void session.close();
      return Promise.reject(normalizeMicrophoneError(error));
    }

    let pending: Promise<void>;
    pending = this.open(streamPromise, session, generation).finally(() => {
      if (this.startPromise === pending) this.startPromise = null;
    });
    this.startPromise = pending;
    return pending;
  }

  /**
   * Copy the latest time-domain samples into a caller-owned buffer.
   * The buffer remains owned by the caller; this class does not retain it.
   */
  readSamples(target: Float32Array): Float32Array {
    if (this.state !== 'running' || !this.analyser) {
      throw new MicrophoneInputError(
        'Microphone capture is not running.',
        'interrupted'
      );
    }
    if (target.length === 0) {
      throw new RangeError('A non-empty sample buffer is required.');
    }
    this.analyser.getFloatTimeDomainData(target);
    return target;
  }

  /** Stop capture but allow this instance to be started again. */
  async stop(): Promise<void> {
    if (this.state === 'disposed') return;
    ++this.generation;
    this.state = 'idle';
    this.releaseCapture();
    const session = this.session;
    this.session = null;
    if (session) await session.close();
  }

  /** Permanently stop capture and release all owned browser resources. */
  async dispose(): Promise<void> {
    if (this.state === 'disposed') return;
    ++this.generation;
    this.state = 'disposed';
    this.releaseCapture();
    const session = this.session;
    this.session = null;
    if (session) await session.close();
  }

  private async open(
    streamPromise: Promise<MediaStream>,
    session: MicrophoneAudioSession,
    generation: number
  ): Promise<void> {
    let stream: MediaStream | null = null;
    try {
      // Resume is initiated in the same start() call as the permission request.
      const contextPromise = session.resume();
      const [resolvedStream, context] = await Promise.all([
        streamPromise,
        contextPromise
      ]);
      stream = resolvedStream;

      if (generation !== this.generation || this.state === 'disposed') {
        stopStreamTracks(stream);
        await session.close();
        return;
      }

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = this.fftSize;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);

      this.stream = stream;
      this.source = source;
      this.analyser = analyser;
      for (const track of stream.getTracks()) {
        const onEnded = () => {
          if (this.state === 'running') void this.stop();
        };
        track.addEventListener('ended', onEnded);
        this.trackEndHandlers.set(track, onEnded);
      }
      this.state = 'running';
    } catch (error) {
      // Promise.all may reject before getUserMedia settles. Stop a late stream
      // as soon as the browser eventually returns it.
      if (stream) stopStreamTracks(stream);
      else void streamPromise.then(stopStreamTracks, () => undefined);
      if (this.session === session) this.session = null;
      if (generation === this.generation && this.state !== 'disposed') {
        this.state = 'idle';
      }
      try {
        await session.close();
      } catch {
        // Preserve the permission/capture error for the caller.
      }
      throw normalizeMicrophoneError(error);
    }
  }

  private releaseCapture(): void {
    for (const [track, handler] of this.trackEndHandlers) {
      track.removeEventListener('ended', handler);
    }
    this.trackEndHandlers.clear();

    try {
      this.source?.disconnect();
    } catch {
      // A source may already have been disconnected by the browser.
    }
    this.source = null;
    this.analyser = null;

    const stream = this.stream;
    this.stream = null;
    if (stream) stopStreamTracks(stream);
  }
}

function browserGetUserMedia(
  constraints: MediaStreamConstraints
): Promise<MediaStream> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    return Promise.reject(
      new MicrophoneInputError(
        'Microphone capture is not supported in this browser or context.',
        'unsupported'
      )
    );
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}

function stopStreamTracks(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // Continue stopping remaining tracks if one browser track throws.
    }
  }
}

function normalizeMicrophoneError(error: unknown): MicrophoneInputError {
  if (error instanceof MicrophoneInputError) return error;

  const name =
    error instanceof Error
      ? error.name
      : typeof error === 'object' && error !== null && 'name' in error
        ? String(error.name)
        : '';
  const message =
    error instanceof Error ? error.message : 'Unable to start microphone input.';

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return new MicrophoneInputError(
        'Microphone permission was denied. Allow microphone access and try again.',
        'permission-denied',
        { cause: error }
      );
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return new MicrophoneInputError(
        'No microphone was found. Connect a microphone and try again.',
        'no-device',
        { cause: error }
      );
    case 'NotReadableError':
    case 'TrackStartError':
      return new MicrophoneInputError(
        'The microphone is unavailable or already in use.',
        'device-busy',
        { cause: error }
      );
    case 'AbortError':
      return new MicrophoneInputError(
        'Microphone capture was interrupted. Try starting it again.',
        'interrupted',
        { cause: error }
      );
    default:
      return new MicrophoneInputError(message, 'unknown', { cause: error });
  }
}
