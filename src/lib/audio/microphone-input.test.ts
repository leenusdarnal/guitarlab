import { describe, expect, it, vi } from 'vitest';
import { MicrophoneInput, MicrophoneInputError } from './microphone-input';

class FakeTrack {
  stop = vi.fn();
  private endedListeners = new Set<EventListenerOrEventListenerObject>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type === 'ended') this.endedListeners.add(listener);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ) {
    if (type === 'ended') this.endedListeners.delete(listener);
  }

  end() {
    for (const listener of this.endedListeners) {
      if (typeof listener === 'function') listener(new Event('ended'));
      else listener.handleEvent(new Event('ended'));
    }
  }
}

class FakeAnalyser {
  fftSize = 0;
  smoothingTimeConstant = 0;
  getFloatTimeDomainData = vi.fn((target: Float32Array) => {
    target.fill(0.25);
  });
}

class FakeSource {
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeAudioContext {
  sampleRate = 48_000;
  analyser = new FakeAnalyser();
  source = new FakeSource();
  createAnalyser = vi.fn(() => this.analyser as unknown as AnalyserNode);
  createMediaStreamSource = vi.fn(
    () => this.source as unknown as MediaStreamAudioSourceNode
  );
}

function makeStream(track = new FakeTrack()) {
  return {
    track,
    stream: {
      getTracks: vi.fn(() => [track as unknown as MediaStreamTrack])
    } as unknown as MediaStream
  };
}

function makeSession(context = new FakeAudioContext()) {
  return {
    context,
    session: {
      resume: vi.fn(async () => context as unknown as AudioContext),
      close: vi.fn(async () => undefined)
    }
  };
}

describe('MicrophoneInput', () => {
  it('does not request permission until start and exposes ephemeral samples', async () => {
    const { stream } = makeStream();
    const getUserMedia = vi.fn(async () => stream);
    const { context, session } = makeSession();
    const input = new MicrophoneInput({
      getUserMedia,
      createAudioSession: () => session
    });

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(input.isRunning).toBe(false);

    await input.start();
    await input.start();

    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      },
      video: false
    });
    expect(input.isRunning).toBe(true);
    expect(input.sampleRate).toBe(48_000);
    expect(context.analyser.fftSize).toBe(4_096);
    expect(context.analyser.smoothingTimeConstant).toBe(0);

    const samples = new Float32Array(128);
    expect(input.readSamples(samples)).toBe(samples);
    expect(samples.every((sample) => sample === 0.25)).toBe(true);
    expect(context.source.connect).toHaveBeenCalledWith(context.analyser);

    await input.dispose();
  });

  it('stops every track, disconnects the source and closes its owned session', async () => {
    const { stream, track } = makeStream();
    const getUserMedia = vi.fn(async () => stream);
    const { context, session } = makeSession();
    const input = new MicrophoneInput({
      getUserMedia,
      createAudioSession: () => session
    });

    await input.start();
    await input.stop();

    expect(track.stop).toHaveBeenCalledOnce();
    expect(context.source.disconnect).toHaveBeenCalledOnce();
    expect(session.close).toHaveBeenCalledOnce();
    expect(input.isRunning).toBe(false);
    expect(input.sampleRate).toBeNull();
    expect(() => input.readSamples(new Float32Array(32))).toThrow(
      MicrophoneInputError
    );
  });

  it('maps a denied permission to a safe, actionable error', async () => {
    const denied = Object.assign(new Error('permission blocked'), {
      name: 'NotAllowedError'
    });
    const getUserMedia = vi.fn(async () => {
      throw denied;
    });
    const { session } = makeSession();
    const input = new MicrophoneInput({
      getUserMedia,
      createAudioSession: () => session
    });

    await expect(input.start()).rejects.toMatchObject({
      name: 'MicrophoneInputError',
      code: 'permission-denied'
    });
    expect(session.close).toHaveBeenCalledOnce();
    expect(input.isRunning).toBe(false);
  });

  it('reports a missing microphone distinctly', async () => {
    const missing = Object.assign(new Error('no input device'), {
      name: 'NotFoundError'
    });
    const input = new MicrophoneInput({
      getUserMedia: async () => {
        throw missing;
      },
      createAudioSession: () => makeSession().session
    });

    await expect(input.start()).rejects.toMatchObject({
      code: 'no-device'
    });
  });

  it('stops capture when the active microphone track ends', async () => {
    const { stream, track } = makeStream();
    const getUserMedia = vi.fn(async () => stream);
    const { session } = makeSession();
    const input = new MicrophoneInput({
      getUserMedia,
      createAudioSession: () => session
    });

    await input.start();
    track.end();
    await vi.waitFor(() => {
      expect(input.isRunning).toBe(false);
      expect(session.close).toHaveBeenCalledOnce();
    });
    expect(track.stop).toHaveBeenCalledOnce();
  });

  it('stops a stream that resolves after the caller has stopped startup', async () => {
    const { stream, track } = makeStream();
    let resolveStream: ((value: MediaStream) => void) | undefined;
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveStream = resolve;
        })
    );
    const { session } = makeSession();
    const input = new MicrophoneInput({
      getUserMedia,
      createAudioSession: () => session
    });

    const starting = input.start();
    await input.stop();
    resolveStream?.(stream);
    await starting;

    expect(track.stop).toHaveBeenCalledOnce();
    expect(input.isRunning).toBe(false);
  });

  it('permanently rejects starts after disposal', async () => {
    const getUserMedia = vi.fn(async () => makeStream().stream);
    const input = new MicrophoneInput({
      getUserMedia,
      createAudioSession: () => makeSession().session
    });

    await input.dispose();
    await expect(input.start()).rejects.toMatchObject({
      code: 'interrupted'
    });
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('validates the analyser buffer size', () => {
    expect(() => new MicrophoneInput({ fftSize: 1_000 })).toThrow(RangeError);
  });
});
