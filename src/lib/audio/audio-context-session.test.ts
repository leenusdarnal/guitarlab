import { describe, expect, it, vi } from 'vitest';
import { AudioContextSession } from './audio-context-session';

class FakeAudioContext {
  state: AudioContextState = 'suspended';
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
}

describe('AudioContextSession', () => {
  it('creates its context lazily and reuses it while running', async () => {
    const context = new FakeAudioContext();
    const createContext = vi.fn(
      () => context as unknown as AudioContext
    );
    const session = new AudioContextSession(createContext);

    expect(createContext).not.toHaveBeenCalled();
    expect(session.currentContext).toBeNull();

    const first = await session.resume();
    const second = await session.resume();

    expect(first).toBe(context);
    expect(second).toBe(context);
    expect(createContext).toHaveBeenCalledOnce();
    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.close).not.toHaveBeenCalled();
  });

  it('closes and releases the context when resume rejects', async () => {
    const context = new FakeAudioContext();
    context.resume.mockRejectedValueOnce(new Error('resume denied'));
    const session = new AudioContextSession(
      () => context as unknown as AudioContext
    );

    await expect(session.resume()).rejects.toThrow('resume denied');

    expect(context.close).toHaveBeenCalledOnce();
    expect(context.state).toBe('closed');
    expect(session.currentContext).toBeNull();
  });

  it('closes and releases a context that remains suspended', async () => {
    const context = new FakeAudioContext();
    context.resume.mockImplementationOnce(async () => {});
    const session = new AudioContextSession(
      () => context as unknown as AudioContext
    );

    await expect(session.resume('reference tone is not ready')).rejects.toThrow(
      'reference tone is not ready'
    );

    expect(context.close).toHaveBeenCalledOnce();
    expect(session.currentContext).toBeNull();
  });

  it('closes an owned context once and creates a fresh context on the next resume', async () => {
    const first = new FakeAudioContext();
    const second = new FakeAudioContext();
    const contexts = [first, second];
    const createContext = vi.fn(
      () => contexts.shift() as unknown as AudioContext
    );
    const session = new AudioContextSession(createContext);

    await session.resume();
    await session.close();
    await session.close();

    expect(first.close).toHaveBeenCalledOnce();
    expect(session.currentContext).toBeNull();

    const resumed = await session.resume();
    expect(resumed).toBe(second);
    expect(createContext).toHaveBeenCalledTimes(2);
    expect(second.resume).toHaveBeenCalledOnce();
  });

  it('replaces a context that was closed externally', async () => {
    const first = new FakeAudioContext();
    const second = new FakeAudioContext();
    const contexts = [first, second];
    const createContext = vi.fn(
      () => contexts.shift() as unknown as AudioContext
    );
    const session = new AudioContextSession(createContext);

    await session.resume();
    first.state = 'closed';

    await expect(session.resume()).resolves.toBe(second);
    expect(createContext).toHaveBeenCalledTimes(2);
    expect(second.resume).toHaveBeenCalledOnce();
  });

  it('propagates context-construction failures', async () => {
    const session = new AudioContextSession(() => {
      throw new Error('context construction failed');
    });

    await expect(session.resume()).rejects.toThrow(
      'context construction failed'
    );
    expect(session.currentContext).toBeNull();
  });
});
