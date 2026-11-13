export type AudioContextFactory = () => AudioContext;

/**
 * Owns one AudioContext for a single feature instance or playback operation.
 * It deliberately does not share contexts between features.
 */
export class AudioContextSession {
  private context: AudioContext | null = null;

  constructor(
    private readonly createContext: AudioContextFactory = createBrowserAudioContext
  ) {}

  get currentContext(): AudioContext | null {
    return this.context;
  }

  async resume(
    notReadyMessage = 'Audio is not ready. Tap the audio control again.'
  ): Promise<AudioContext> {
    if (!this.context || this.context.state === 'closed') {
      this.context = this.createContext();
    }

    const context = this.context;
    try {
      if (context.state === 'suspended') {
        await context.resume();
      }
      if (context.state !== 'running') {
        throw new Error(notReadyMessage);
      }
      return context;
    } catch (error) {
      // A failed session must not retain a suspended or unusable context.
      try {
        await this.close();
      } catch {
        // Preserve the original resume/readiness error.
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') {
      await context.close();
    }
  }
}

function createBrowserAudioContext(): AudioContext {
  if (typeof AudioContext === 'undefined') {
    throw new Error('Web Audio is not available in this browser.');
  }
  return new AudioContext();
}
