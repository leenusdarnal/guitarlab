/**
 * Waits until scheduled playback should have completed, while allowing the
 * owning feature to cancel the wait when its page or playback session ends.
 *
 * Resolving on abort keeps callers simple: they can use one finally path for
 * normal completion and cancellation, while the AbortSignal distinguishes the
 * two cases when needed.
 */
export function waitForPlaybackCompletion(
  durationMilliseconds: number,
  signal: AbortSignal
): Promise<void> {
  if (!Number.isFinite(durationMilliseconds) || durationMilliseconds < 0) {
    throw new RangeError('Playback duration must be a finite non-negative number.');
  }

  if (signal.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      signal.removeEventListener('abort', abort);
    };

    const finish = () => {
      cleanup();
      resolve();
    };

    const abort = () => {
      clearTimeout(timeout);
      finish();
    };

    timeout = setTimeout(finish, durationMilliseconds);
    signal.addEventListener('abort', abort, { once: true });

    // Handle an abort that occurs between the initial check and listener setup.
    if (signal.aborted) {
      abort();
    }
  });
}
