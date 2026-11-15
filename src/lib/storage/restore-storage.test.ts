import { describe, expect, it } from 'vitest';
import {
  resetActiveLearnerData,
  restoreLearnerBackup,
  reviewLearnerBackup
} from './restore-storage';

describe('learner restore safety gates', () => {
  it('refuses restore until the caller explicitly confirms replacement', async () => {
    await expect(restoreLearnerBackup({}, false)).rejects.toThrow(
      'Confirm the restore before replacing local data.'
    );
  });

  it('refuses reset until the caller explicitly confirms deletion', async () => {
    await expect(resetActiveLearnerData(false)).rejects.toThrow(
      'Confirm the reset before deleting local learner data.'
    );
  });

  it('rejects malformed input before opening or mutating local storage', async () => {
    await expect(reviewLearnerBackup('{')).resolves.toMatchObject({
      success: false,
      message: 'The selected file is not valid JSON.'
    });
  });
});
