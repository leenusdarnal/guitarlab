import { describe, expect, it } from 'vitest';
import {
  MAX_METRONOME_BPM,
  MIN_METRONOME_BPM,
  playReferenceTone,
  validateMetronomeTempo,
  WebAudioMetronome
} from './metronome';

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
