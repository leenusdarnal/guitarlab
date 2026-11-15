export type NoteRecognitionScore = {
  firstTryMatches: number;
  totalAttempts: number;
  attemptsForCurrentTarget: number;
};

export function createNoteRecognitionScore(): NoteRecognitionScore {
  return {
    firstTryMatches: 0,
    totalAttempts: 0,
    attemptsForCurrentTarget: 0
  };
}

/** Count only the first detected note for each target as a first-try result. */
export function recordNoteRecognitionAttempt(
  score: NoteRecognitionScore,
  matchedTarget: boolean
): NoteRecognitionScore {
  return {
    firstTryMatches:
      score.firstTryMatches +
      (score.attemptsForCurrentTarget === 0 && matchedTarget ? 1 : 0),
    totalAttempts: score.totalAttempts + 1,
    attemptsForCurrentTarget: score.attemptsForCurrentTarget + 1
  };
}

/** Keep the session total while starting a fresh attempt count for the next target. */
export function resetNoteRecognitionTarget(
  score: NoteRecognitionScore
): NoteRecognitionScore {
  return { ...score, attemptsForCurrentTarget: 0 };
}
