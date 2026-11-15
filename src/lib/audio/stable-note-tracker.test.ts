import { describe, expect, it } from 'vitest';
import type { PitchEstimate } from './pitch-estimator';
import { StableNoteTracker } from './stable-note-tracker';

function detected(frequencyHz: number, confidence = 0.95): PitchEstimate {
  return { status: 'detected', frequencyHz, confidence, rms: 0.2 };
}

const silence: PitchEstimate = { status: 'silence', confidence: 0, rms: 0 };

describe('StableNoteTracker', () => {
  it('waits for consecutive confident frames before emitting note-on', () => {
    const tracker = new StableNoteTracker();
    expect(tracker.update(detected(440), 0)).toMatchObject({
      status: 'candidate',
      event: null,
      candidateMidiNote: 69,
      consecutiveFrames: 1
    });
    expect(tracker.update(detected(441), 30)).toMatchObject({
      status: 'candidate',
      event: null,
      consecutiveFrames: 2
    });
    expect(tracker.update(detected(439), 60)).toMatchObject({
      status: 'stable',
      event: 'note-on',
      note: { midiNote: 69, noteName: 'A4' }
    });
  });

  it('does not emit duplicate events for a sustained note', () => {
    const tracker = new StableNoteTracker();
    tracker.update(detected(440), 0);
    tracker.update(detected(440), 30);
    expect(tracker.update(detected(440), 60).event).toBe('note-on');
    for (let frame = 3; frame < 20; frame += 1) {
      expect(
        tracker.update(detected(440 + (frame % 2)), frame * 30).event
      ).toBeNull();
    }
  });

  it('smooths frequency using the median of recent frames', () => {
    const tracker = new StableNoteTracker({ smoothingWindow: 3 });
    tracker.update(detected(438), 0);
    tracker.update(detected(442), 30);
    const stable = tracker.update(detected(440), 60);
    expect(stable.note?.frequencyHz).toBe(440);
  });

  it('requires a confirmed semitone change before replacing an active note', () => {
    const tracker = new StableNoteTracker();
    tracker.update(detected(440), 0);
    tracker.update(detected(440), 30);
    tracker.update(detected(440), 60);
    expect(tracker.update(detected(466.16), 90)).toMatchObject({
      status: 'stable',
      event: null,
      note: { midiNote: 69 }
    });
    expect(tracker.update(detected(466.16), 120).event).toBeNull();
    expect(tracker.update(detected(466.16), 150)).toMatchObject({
      event: 'note-change',
      note: { midiNote: 70, noteName: 'A♯4' }
    });
  });

  it('keeps the active note through transient silence and releases after the threshold', () => {
    const tracker = new StableNoteTracker({ releaseFrames: 2 });
    tracker.update(detected(440), 0);
    tracker.update(detected(440), 30);
    tracker.update(detected(440), 60);
    expect(tracker.update(silence, 90)).toMatchObject({
      status: 'stable',
      event: null,
      note: { midiNote: 69 }
    });
    expect(tracker.update(silence, 120)).toMatchObject({
      status: 'none',
      event: 'note-off',
      note: null
    });
  });

  it('ignores low-confidence detections instead of publishing a wrong note', () => {
    const tracker = new StableNoteTracker();
    tracker.update(detected(440), 0);
    tracker.update(detected(440), 30);
    tracker.update(detected(440), 60);
    const result = tracker.update(detected(880, 0.2), 90);
    expect(result.event).toBeNull();
    expect(result.note?.midiNote).toBe(69);
  });

  it('releases a note after a long sampling gap', () => {
    const tracker = new StableNoteTracker({ maxGapMs: 100 });
    tracker.update(detected(440), 0);
    tracker.update(detected(440), 30);
    tracker.update(detected(440), 60);
    expect(tracker.update(detected(440), 200)).toMatchObject({
      status: 'none',
      event: 'note-off',
      note: null
    });
  });

  it('restarts an unconfirmed candidate after a long frame gap', () => {
    const tracker = new StableNoteTracker({ maxGapMs: 100 });
    tracker.update(detected(440), 0);
    expect(tracker.update(detected(440), 200)).toMatchObject({
      status: 'candidate',
      event: null,
      consecutiveFrames: 1
    });
  });

  it('validates options and monotonic timestamps', () => {
    expect(() => new StableNoteTracker({ confirmationFrames: 0 })).toThrow(
      RangeError
    );
    expect(() => new StableNoteTracker({ minConfidence: 2 })).toThrow(
      RangeError
    );
    const tracker = new StableNoteTracker();
    tracker.update(detected(440), 30);
    expect(() => tracker.update(detected(440), 20)).toThrow(RangeError);
  });

  it('can be reset for a fresh capture session', () => {
    const tracker = new StableNoteTracker();
    tracker.update(detected(440), 0);
    tracker.update(detected(440), 30);
    tracker.update(detected(440), 60);
    tracker.reset();
    expect(tracker.update(detected(440), 0)).toMatchObject({
      status: 'candidate',
      event: null,
      consecutiveFrames: 1
    });
  });
});
