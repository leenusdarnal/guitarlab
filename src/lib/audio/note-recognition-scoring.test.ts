import { describe, expect, it } from 'vitest';
import {
  createNoteRecognitionScore,
  recordNoteRecognitionAttempt,
  resetNoteRecognitionTarget
} from './note-recognition-scoring';

describe('note recognition scoring', () => {
  it('counts a correct first detection as a first-try match', () => {
    const score = recordNoteRecognitionAttempt(
      createNoteRecognitionScore(),
      true
    );

    expect(score).toEqual({
      firstTryMatches: 1,
      totalAttempts: 1,
      attemptsForCurrentTarget: 1
    });
  });

  it('does not count a correct retry as a first-try match', () => {
    const firstAttempt = recordNoteRecognitionAttempt(
      createNoteRecognitionScore(),
      false
    );
    const retry = recordNoteRecognitionAttempt(firstAttempt, true);

    expect(retry).toEqual({
      firstTryMatches: 0,
      totalAttempts: 2,
      attemptsForCurrentTarget: 2
    });
  });

  it('resets only the per-target attempt count when advancing', () => {
    const firstTarget = recordNoteRecognitionAttempt(
      recordNoteRecognitionAttempt(createNoteRecognitionScore(), false),
      true
    );
    const secondTarget = resetNoteRecognitionTarget(firstTarget);
    const secondTargetSuccess = recordNoteRecognitionAttempt(
      secondTarget,
      true
    );

    expect(secondTargetSuccess).toEqual({
      firstTryMatches: 1,
      totalAttempts: 3,
      attemptsForCurrentTarget: 1
    });
  });
});
