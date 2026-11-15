import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const evaluatorPath = fileURLToPath(
  new URL('../../../scripts/evaluate-pitch-recordings.mjs', import.meta.url)
);

function createPcmWav(frequencyHz: number | null, seconds = 2): Buffer {
  const sampleRate = 44_100;
  const frameCount = sampleRate * seconds;
  const dataBytes = frameCount * 2;
  const wav = Buffer.alloc(44 + dataBytes);

  wav.write('RIFF', 0, 'ascii');
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVE', 8, 'ascii');
  wav.write('fmt ', 12, 'ascii');
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36, 'ascii');
  wav.writeUInt32LE(dataBytes, 40);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const sample =
      frequencyHz === null
        ? 0
        : Math.round(
            Math.sin((2 * Math.PI * frequencyHz * frame) / sampleRate) *
              0.45 *
              32_767
          );
    wav.writeInt16LE(sample, 44 + frame * 2);
  }

  return wav;
}

function runEvaluator(entries: unknown[]) {
  const directory = mkdtempSync(join(tmpdir(), 'guitarlab-pitch-eval-'));
  const manifestPath = join(directory, 'private-manifest.json');

  try {
    writeFileSync(
      join(directory, 'private-pitched-segment.wav'),
      createPcmWav(110)
    );
    writeFileSync(
      join(directory, 'private-quiet-segment.wav'),
      createPcmWav(null)
    );
    writeFileSync(manifestPath, JSON.stringify({ entries }));

    return spawnSync(process.execPath, [evaluatorPath, manifestPath], {
      encoding: 'utf8',
      timeout: 15_000
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('local pitch recording evaluator', () => {
  it('reports privacy-safe, window-weighted breakdowns by approved capture dimensions', () => {
    const result = runEvaluator([
      {
        id: 'segment-01',
        file: './private-pitched-segment.wav',
        expectedFrequencyHz: 110,
        startSeconds: 0,
        endSeconds: 2,
        expectedOnsetSeconds: 0,
        dimensions: {
          instrumentType: 'electric',
          stringPosition: 'string_5',
          capturePath: 'direct_input',
          segmentPhase: 'sustain',
          dynamic: 'mf',
          noiseCondition: 'quiet',
          tuningCondition: 'standard'
        }
      },
      {
        id: 'segment-02',
        file: './private-quiet-segment.wav',
        expectedFrequencyHz: null,
        startSeconds: 0,
        endSeconds: 2,
        dimensions: {
          instrumentType: 'electric',
          capturePath: 'microphone',
          segmentPhase: 'silence',
          noiseCondition: 'room_noise'
        }
      }
    ]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.schemaVersion).toBe(2);
    expect(report.summary).toMatchObject({
      segments: 2,
      pitchedSegments: 1,
      quietSegments: 1
    });
    expect(report.breakdowns.stringPosition).toHaveLength(1);
    expect(report.breakdowns.stringPosition[0].value).toBe('string_5');
    expect(report.breakdowns.stringPosition[0].pitchedSegments).toBe(1);
    expect(report.breakdowns.capturePath).toHaveLength(2);
    expect(
      report.breakdowns.capturePath.find(
        (item: { value: string }) => item.value === 'direct_input'
      ).detectionCoverage
    ).toBeGreaterThan(0);
    expect(report.breakdowns.noiseCondition).toHaveLength(2);
    expect(
      report.breakdowns.noiseCondition.find(
        (item: { value: string }) => item.value === 'room_noise'
      ).falseNoteRate
    ).toBe(0);
    expect(
      report.breakdowns.segmentPhase.map(
        (item: { value: string }) => item.value
      )
    ).toEqual(['silence', 'sustain']);
    expect(report.results[0].dimensions).toMatchObject({
      instrumentType: 'electric',
      stringPosition: 'string_5'
    });
    expect(result.stdout).not.toContain('private-manifest.json');
    expect(result.stdout).not.toContain('private-pitched-segment.wav');
    expect(result.stdout).not.toContain('_metrics');
    expect(report.results[0]).not.toHaveProperty('file');
  });

  it('rejects arbitrary dimension keys or free-form values before reading files', () => {
    const result = runEvaluator([
      {
        id: 'segment-01',
        file: './file-that-must-not-be-opened.wav',
        expectedFrequencyHz: 110,
        dimensions: {
          deviceSerialNumber: 'private-device-serial'
        }
      }
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('approved non-identifying values');
    expect(result.stderr).not.toContain('private-device-serial');
  });

  it('keeps older manifests valid when no condition dimensions are supplied', () => {
    const result = runEvaluator([
      {
        id: 'legacy-segment',
        file: './private-pitched-segment.wav',
        expectedFrequencyHz: 110
      }
    ]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.schemaVersion).toBe(2);
    expect(report.breakdowns.stringPosition).toEqual([]);
    expect(report.breakdowns.capturePath).toEqual([]);
    expect(report.results[0]).not.toHaveProperty('dimensions');
  });
});
