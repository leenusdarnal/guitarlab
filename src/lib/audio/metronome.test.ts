import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_METRONOME_BPM,
  MIN_METRONOME_BPM,
  playReferenceTone,
  validateMetronomeTempo,
  WebAudioMetronome
} from './metronome';

type AudioEventHandler = (() => void) | null;

class FakeAudioParam {
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class FakeAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeOscillator extends FakeAudioNode {
  type = 'sine';
  frequency = new FakeAudioParam();
  onended: AudioEventHandler = null;
  start = vi.fn();
  stop = vi.fn();
}

class FakeGain extends FakeAudioNode {
  gain = new FakeAudioParam();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: AudioContextState = 'suspended';
  currentTime = 1;
  destination = new FakeAudioNode();
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
  createOscillator = vi.fn(() => {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  });
  createGain = vi.fn(() => {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  });

  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

function installAudioEnvironment() {
  FakeAudioContext.instances = [];
  const listeners = new Map<string, EventListener>();
  const documentMock = {
    visibilityState: 'visible',
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      if (listeners.get(type) === listener) listeners.delete(type);
    })
  };
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('document', documentMock);
  return {
    documentMock,
    dispatchVisibilityChange() {
      listeners.get('visibilitychange')?.(new Event('visibilitychange'));
    }
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Web Audio metronome configuration', () => {
  it('accepts tempos within the supported range', () => {
    expect(validateMetronomeTempo(MIN_METRONOME_BPM)).toBe(40);
    expect(validateMetronomeTempo(80)).toBe(80);
    expect(validateMetronomeTempo(MAX_METRONOME_BPM)).toBe(240);
  });

  it('rejects invalid tempos', () => {
    expect(() => validateMetronomeTempo(39)).toThrow(RangeError);
    expect(() => validateMetronomeTempo(241)).toThrow(RangeError);
    expect(() => validateMetronomeTempo(80.5)).toThrow(RangeError);
  });

  it('keeps tempo and meter settings independently configurable', () => {
    const metronome = new WebAudioMetronome({ bpm: 96, beatsPerBar: 3 });
    metronome.setTempo(112);
    metronome.setBeatsPerBar(6);
    expect(metronome.tempo).toBe(112);
    expect(metronome.meter).toBe(6);
    expect(metronome.isRunning).toBe(false);
  });

  it('rejects invalid time signature counts', () => {
    expect(() => new WebAudioMetronome({ beatsPerBar: 0 })).toThrow(RangeError);
    expect(() => new WebAudioMetronome({ beatsPerBar: 13 })).toThrow(
      RangeError
    );
    expect(() => new WebAudioMetronome().setBeatsPerBar(0)).toThrow(RangeError);
  });

  it('validates reference-tone frequency and duration before creating audio', async () => {
    await expect(playReferenceTone(10)).rejects.toThrow(RangeError);
    await expect(playReferenceTone(440, 99)).rejects.toThrow(RangeError);
    await expect(playReferenceTone(20_001)).rejects.toThrow(RangeError);
    await expect(playReferenceTone(440, 5_001)).rejects.toThrow(RangeError);
  });
});

describe('WebAudioMetronome audio lifecycle', () => {
  it('creates and resumes its context only when start is requested', async () => {
    installAudioEnvironment();
    const onStateChange = vi.fn();
    const metronome = new WebAudioMetronome({ onStateChange });

    expect(FakeAudioContext.instances).toHaveLength(0);
    await metronome.start();

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].resume).toHaveBeenCalledOnce();
    expect(metronome.isRunning).toBe(true);
    expect(onStateChange).toHaveBeenLastCalledWith(true);
    await metronome.dispose();
  });

  it('does not create duplicate contexts or schedulers when started twice', async () => {
    installAudioEnvironment();
    vi.useFakeTimers();
    const metronome = new WebAudioMetronome();

    await metronome.start();
    await metronome.start();

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].resume).toHaveBeenCalledOnce();
    await metronome.dispose();
  });

  it('stops scheduling and removes its visibility listener without closing the context', async () => {
    const { documentMock } = installAudioEnvironment();
    vi.useFakeTimers();
    const metronome = new WebAudioMetronome();

    await metronome.start();
    const context = FakeAudioContext.instances[0];
    metronome.stop();

    expect(metronome.isRunning).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(documentMock.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    expect(context.close).not.toHaveBeenCalled();
    await metronome.dispose();
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('stops when the document becomes hidden', async () => {
    const environment = installAudioEnvironment();
    vi.useFakeTimers();
    const metronome = new WebAudioMetronome();

    await metronome.start();
    environment.documentMock.visibilityState = 'hidden';
    environment.dispatchVisibilityChange();

    expect(metronome.isRunning).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    await metronome.dispose();
  });

  it('closes the owned context on dispose and creates a fresh one on the next start', async () => {
    installAudioEnvironment();
    vi.useFakeTimers();
    const metronome = new WebAudioMetronome();

    await metronome.start();
    const firstContext = FakeAudioContext.instances[0];
    await metronome.dispose();

    expect(firstContext.close).toHaveBeenCalledOnce();
    await metronome.start();

    expect(FakeAudioContext.instances).toHaveLength(2);
    expect(metronome.isRunning).toBe(true);
    await metronome.dispose();
  });

  it('reports a resume failure and leaves the metronome stopped', async () => {
    installAudioEnvironment();
    const metronome = new WebAudioMetronome();
    const context = new FakeAudioContext();
    context.resume.mockRejectedValueOnce(new Error('permission denied'));
    (metronome as unknown as { context: FakeAudioContext }).context = context;

    await expect(metronome.start()).rejects.toThrow('permission denied');
    expect(metronome.isRunning).toBe(false);
    expect(context.close).not.toHaveBeenCalled();
    await metronome.dispose();
  });

  it('disconnects scheduled oscillator and gain nodes when a click ends', async () => {
    installAudioEnvironment();
    vi.useFakeTimers();
    const metronome = new WebAudioMetronome({ bpm: 40 });

    await metronome.start();
    const context = FakeAudioContext.instances[0];
    expect(context.oscillators.length).toBeGreaterThan(0);
    const oscillator = context.oscillators[0];
    const gain = context.gains[0];

    oscillator.onended?.();

    expect(oscillator.disconnect).toHaveBeenCalledOnce();
    expect(gain.disconnect).toHaveBeenCalledOnce();
    await metronome.dispose();
  });

  it('rejects start when Web Audio is unavailable', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const metronome = new WebAudioMetronome();

    await expect(metronome.start()).rejects.toThrow(
      'Web Audio is not available in this browser.'
    );
    expect(metronome.isRunning).toBe(false);
  });
});

describe('playReferenceTone audio lifecycle', () => {
  it('resumes an owned context, schedules the requested tone, and closes after playback', async () => {
    installAudioEnvironment();

    const playback = playReferenceTone(523.25, 500);
    await Promise.resolve();

    const context = FakeAudioContext.instances[0];
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.state).toBe('running');
    expect(context.oscillators).toHaveLength(1);
    expect(context.gains).toHaveLength(1);

    const oscillator = context.oscillators[0];
    const gain = context.gains[0];
    expect(oscillator.type).toBe('sine');
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
      523.25,
      expect.any(Number)
    );
    expect(oscillator.start).toHaveBeenCalledOnce();
    expect(oscillator.stop).toHaveBeenCalledOnce();
    expect(oscillator.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(context.destination);

    oscillator.onended?.();
    await playback;

    expect(oscillator.disconnect).toHaveBeenCalledOnce();
    expect(gain.disconnect).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
    expect(context.state).toBe('closed');
  });

  it('closes the context when AudioContext resume rejects', async () => {
    installAudioEnvironment();
    const context = FakeAudioContext.instances[0];
    context.resume.mockRejectedValueOnce(new Error('resume denied'));

    await expect(playReferenceTone(440, 500)).rejects.toThrow('resume denied');

    expect(context.close).toHaveBeenCalledOnce();
    expect(context.state).toBe('closed');
  });

  it('closes the context when resume does not make the context run', async () => {
    installAudioEnvironment();
    const context = FakeAudioContext.instances[0];
    context.resume.mockImplementationOnce(async () => {});

    await expect(playReferenceTone(440, 500)).rejects.toThrow('Audio is not ready');
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('closes the context when oscillator creation fails', async () => {
    installAudioEnvironment();
    const context = FakeAudioContext.instances[0];
    context.createOscillator.mockImplementationOnce(() => {
      throw new Error('oscillator unavailable');
    });

    await expect(playReferenceTone(440, 500)).rejects.toThrow('oscillator unavailable');
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('disconnects the oscillator and closes the context when gain creation fails', async () => {
    installAudioEnvironment();
    const context = FakeAudioContext.instances[0];
    context.createGain.mockImplementationOnce(() => {
      throw new Error('gain unavailable');
    });

    await expect(playReferenceTone(440, 500)).rejects.toThrow('gain unavailable');
    expect(context.oscillators[0].disconnect).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('disconnects both nodes and closes the context when destination connection fails', async () => {
    installAudioEnvironment();
    const context = FakeAudioContext.instances[0];
    context.createGain.mockImplementationOnce(() => {
      const gain = new FakeGain();
      gain.connect.mockImplementationOnce(() => {
        throw new Error('destination connection failed');
      });
      context.gains.push(gain);
      return gain;
    });

    await expect(playReferenceTone(440, 500)).rejects.toThrow('destination connection failed');
    expect(context.oscillators[0].disconnect).toHaveBeenCalledOnce();
    expect(context.gains[0].disconnect).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('disconnects both nodes and closes the context when oscillator start fails', async () => {
    installAudioEnvironment();
    const context = FakeAudioContext.instances[0];
    context.createOscillator.mockImplementationOnce(() => {
      const oscillator = new FakeOscillator();
      oscillator.start.mockImplementationOnce(() => {
        throw new Error('start failed');
      });
      context.oscillators.push(oscillator);
      return oscillator;
    });

    await expect(playReferenceTone(440, 500)).rejects.toThrow('start failed');
    expect(context.oscillators[0].disconnect).toHaveBeenCalledOnce();
    expect(context.gains[0].disconnect).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('disconnects both nodes and closes the context when oscillator stop fails', async () => {
    installAudioEnvironment();
    const context = FakeAudioContext.instances[0];
    context.createOscillator.mockImplementationOnce(() => {
      const oscillator = new FakeOscillator();
      oscillator.stop.mockImplementationOnce(() => {
        throw new Error('stop failed');
      });
      context.oscillators.push(oscillator);
      return oscillator;
    });

    await expect(playReferenceTone(440, 500)).rejects.toThrow('stop failed');
    expect(context.oscillators[0].disconnect).toHaveBeenCalledOnce();
    expect(context.gains[0].disconnect).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
  });

});
