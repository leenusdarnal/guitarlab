import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForPlaybackCompletion } from './playback-lifecycle';

afterEach(() => {
  vi.useRealTimers();
});

describe('playback completion lifecycle', () => {
  it('resolves when the scheduled playback duration elapses', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const completion = waitForPlaybackCompletion(250, controller.signal);

    await vi.advanceTimersByTimeAsync(249);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(completion).resolves.toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the completion timer and resolves when playback is aborted', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const completion = waitForPlaybackCompletion(5_000, controller.signal);

    expect(vi.getTimerCount()).toBe(1);
    controller.abort();

    await expect(completion).resolves.toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not schedule a timer when the signal is already aborted', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    controller.abort();

    await expect(
      waitForPlaybackCompletion(5_000, controller.signal)
    ).resolves.toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects invalid playback durations', () => {
    const controller = new AbortController();

    expect(() => waitForPlaybackCompletion(-1, controller.signal)).toThrow(
      RangeError
    );
    expect(() =>
      waitForPlaybackCompletion(Number.NaN, controller.signal)
    ).toThrow(RangeError);
  });
});
