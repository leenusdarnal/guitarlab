#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { estimatePitch } from '../src/lib/audio/pitch-estimator.ts';
import { StableNoteTracker } from '../src/lib/audio/stable-note-tracker.ts';

const WINDOW_SIZE = 4_096;
const HOP_SIZE = 1_024;
const MIN_FREQUENCY_HZ = 40;
const MAX_FREQUENCY_HZ = 1_000;

const REPORT_DIMENSIONS = {
  instrumentType: [
    'electric',
    'steel_string_acoustic',
    'nylon_string_classical',
    'other'
  ],
  stringPosition: [
    'string_6',
    'string_5',
    'string_4',
    'string_3',
    'string_2',
    'string_1',
    'unknown'
  ],
  capturePath: [
    'piezo_pickup',
    'magnetic_pickup',
    'microphone',
    'direct_input',
    'other'
  ],
  segmentPhase: ['attack', 'sustain', 'decay', 'muted', 'silence', 'noise'],
  dynamic: ['pp', 'p', 'mp', 'mf', 'f', 'ff', 'unknown'],
  noiseCondition: [
    'quiet',
    'room_noise',
    'electrical_noise',
    'handling_noise',
    'other'
  ],
  tuningCondition: [
    'standard',
    'alternate',
    'flat_offset',
    'sharp_offset',
    'unknown'
  ]
};

function usage() {
  process.stderr.write(
    'Usage: node scripts/evaluate-pitch-recordings.mjs <manifest.json>\n' +
      'The manifest and WAV files stay local. Results are written to stdout only.\n'
  );
}

function parseWav(buffer) {
  if (
    buffer.length < 44 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WAVE'
  ) {
    throw new Error('Expected a RIFF/WAVE file.');
  }

  let format = null;
  let data = null;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + size;
    if (end > buffer.length) throw new Error('WAV chunk exceeds file bounds.');
    if (id === 'fmt ') {
      if (size < 16) throw new Error('WAV format chunk is incomplete.');
      format = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        blockAlign: buffer.readUInt16LE(start + 12),
        bitsPerSample: buffer.readUInt16LE(start + 14)
      };
    } else if (id === 'data') {
      data = buffer.subarray(start, end);
    }
    offset = end + (size % 2);
  }

  if (!format || !data)
    throw new Error('WAV must contain fmt and data chunks.');
  const { audioFormat, channels, sampleRate, blockAlign, bitsPerSample } =
    format;
  if (
    !Number.isInteger(channels) ||
    channels < 1 ||
    channels > 32 ||
    !Number.isInteger(sampleRate) ||
    sampleRate <= 0 ||
    blockAlign !== channels * (bitsPerSample / 8)
  ) {
    throw new Error(
      'WAV channel, sample-rate, or block-alignment metadata is invalid.'
    );
  }
  if (!(
    (audioFormat === 1 && [8, 16, 24, 32].includes(bitsPerSample)) ||
    (audioFormat === 3 && bitsPerSample === 32)
  )) {
    throw new Error(
      'Supported WAV encodings: PCM 8/16/24/32-bit and IEEE float32.'
    );
  }

  const bytesPerSample = bitsPerSample / 8;
  const frameCount = Math.floor(data.length / blockAlign);
  const mono = new Float32Array(frameCount);
  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      const offset = frame * blockAlign + channel * bytesPerSample;
      let value;
      if (audioFormat === 3) {
        value = data.readFloatLE(offset);
      } else if (bitsPerSample === 8) {
        value = (data.readUInt8(offset) - 128) / 128;
      } else if (bitsPerSample === 16) {
        value = data.readInt16LE(offset) / 32_768;
      } else if (bitsPerSample === 24) {
        let integer = data.readUIntLE(offset, 3);
        if (integer & 0x800000) integer -= 0x1000000;
        value = integer / 8_388_608;
      } else {
        value = data.readInt32LE(offset) / 2_147_483_648;
      }
      if (!Number.isFinite(value))
        throw new Error('WAV contains non-finite samples.');
      sum += value;
    }
    mono[frame] = sum / channels;
  }

  return { samples: mono, sampleRate };
}

function percentile(values, fraction) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)];
}

function validateEntry(entry, index) {
  if (
    !entry ||
    typeof entry !== 'object' ||
    typeof entry.id !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(entry.id) ||
    typeof entry.file !== 'string' ||
    !entry.file.trim()
  ) {
    throw new Error(
      `Manifest entry ${index + 1} needs a bounded ASCII segment id (1–64 letters, numbers, dots, underscores or hyphens) and a local file path. Use an opaque, non-identifying label.`
    );
  }
  if (
    entry.expectedFrequencyHz !== null &&
    (!Number.isFinite(entry.expectedFrequencyHz) ||
      entry.expectedFrequencyHz < MIN_FREQUENCY_HZ ||
      entry.expectedFrequencyHz > MAX_FREQUENCY_HZ)
  ) {
    throw new Error(
      `Entry "${entry.id}" expectedFrequencyHz must be null or between ${MIN_FREQUENCY_HZ} and ${MAX_FREQUENCY_HZ}.`
    );
  }
  const start = entry.startSeconds ?? 0;
  if (!Number.isFinite(start) || start < 0) {
    throw new Error(`Entry "${entry.id}" startSeconds must be non-negative.`);
  }
  if (
    entry.endSeconds !== undefined &&
    (!Number.isFinite(entry.endSeconds) || entry.endSeconds <= start)
  ) {
    throw new Error(
      `Entry "${entry.id}" endSeconds must be greater than startSeconds.`
    );
  }
  if (
    entry.expectedOnsetSeconds !== undefined &&
    (!Number.isFinite(entry.expectedOnsetSeconds) ||
      entry.expectedOnsetSeconds < start ||
      (entry.endSeconds !== undefined &&
        entry.expectedOnsetSeconds > entry.endSeconds))
  ) {
    throw new Error(
      `Entry "${entry.id}" expectedOnsetSeconds must fall within its segment.`
    );
  }

  if (entry.dimensions !== undefined) {
    if (
      !entry.dimensions ||
      typeof entry.dimensions !== 'object' ||
      Array.isArray(entry.dimensions)
    ) {
      throw new Error(
        `Entry "${entry.id}" dimensions must be an object of approved category values.`
      );
    }

    for (const [dimension, value] of Object.entries(entry.dimensions)) {
      const allowedValues = Object.hasOwn(REPORT_DIMENSIONS, dimension)
        ? REPORT_DIMENSIONS[dimension]
        : null;
      if (
        !allowedValues ||
        typeof value !== 'string' ||
        !allowedValues.includes(value)
      ) {
        throw new Error(
          'Manifest contains an unsupported dimension or category. Use only approved non-identifying values.'
        );
      }
    }
  }
}

function evaluateEntry(entry, samples, sampleRate) {
  const start = Math.floor((entry.startSeconds ?? 0) * sampleRate);
  const end =
    entry.endSeconds === undefined
      ? samples.length
      : Math.min(samples.length, Math.floor(entry.endSeconds * sampleRate));
  if (start >= samples.length || end - start < WINDOW_SIZE) {
    throw new Error(
      `Entry "${entry.id}" does not contain one complete analysis window.`
    );
  }

  const tracker = new StableNoteTracker();
  const errors = [];
  let windows = 0;
  let detected = 0;
  let falseNotes = 0;
  let noteOnSeconds = null;
  let lowConfidence = 0;

  for (let offset = start; offset + WINDOW_SIZE <= end; offset += HOP_SIZE) {
    const estimate = estimatePitch(
      samples.subarray(offset, offset + WINDOW_SIZE),
      sampleRate,
      { minFrequencyHz: MIN_FREQUENCY_HZ, maxFrequencyHz: MAX_FREQUENCY_HZ }
    );
    const timeSeconds = offset / sampleRate;
    const tracked = tracker.update(estimate, timeSeconds * 1_000);
    windows += 1;

    if (estimate.status === 'detected') {
      detected += 1;
      if (entry.expectedFrequencyHz === null) {
        falseNotes += 1;
      } else {
        errors.push(
          Math.abs(
            1_200 * Math.log2(estimate.frequencyHz / entry.expectedFrequencyHz)
          )
        );
      }
    } else if (estimate.status === 'uncertain') {
      lowConfidence += 1;
    }

    if (tracked.event === 'note-on' && noteOnSeconds === null) {
      noteOnSeconds = timeSeconds;
    }
  }

  const isSilence = entry.expectedFrequencyHz === null;
  const noteOnLatencyMs =
    entry.expectedOnsetSeconds !== undefined && noteOnSeconds !== null
      ? (noteOnSeconds - entry.expectedOnsetSeconds) * 1_000
      : null;
  const result = {
    id: entry.id,
    segmentType: isSilence ? 'silence-or-noise' : 'pitched-note',
    ...(entry.dimensions ? { dimensions: entry.dimensions } : {}),
    windows,
    detectionCoverage: isSilence ? null : detected / windows,
    falseNoteRate: isSilence ? falseNotes / windows : null,
    medianAbsoluteCentsError: isSilence ? null : percentile(errors, 0.5),
    p95AbsoluteCentsError: isSilence ? null : percentile(errors, 0.95),
    detectedWindows: detected,
    uncertainWindows: lowConfidence,
    noteOnLatencyMs,
    _metrics: {
      pitchedWindows: isSilence ? 0 : windows,
      pitchedDetections: isSilence ? 0 : detected,
      quietWindows: isSilence ? windows : 0,
      falseNotes,
      absoluteCentsErrors: errors,
      onsetAnnotated: entry.expectedOnsetSeconds !== undefined,
      onsetDetected: noteOnLatencyMs !== null,
      noteOnLatencyMs
    }
  };

  return result;
}

function aggregateSegments(segments) {
  const metrics = segments.map((segment) => segment._metrics);
  const pitchedWindows = metrics.reduce(
    (total, item) => total + item.pitchedWindows,
    0
  );
  const quietWindows = metrics.reduce(
    (total, item) => total + item.quietWindows,
    0
  );
  const detections = metrics.reduce(
    (total, item) => total + item.pitchedDetections,
    0
  );
  const falseNotes = metrics.reduce(
    (total, item) => total + item.falseNotes,
    0
  );
  const centsErrors = metrics.flatMap((item) => item.absoluteCentsErrors);
  const noteOnLatencies = metrics
    .map((item) => item.noteOnLatencyMs)
    .filter((value) => value !== null);

  return {
    segments: segments.length,
    pitchedSegments: metrics.filter((item) => item.pitchedWindows > 0).length,
    quietSegments: metrics.filter((item) => item.quietWindows > 0).length,
    analysisWindows: pitchedWindows + quietWindows,
    detectionCoverage: pitchedWindows ? detections / pitchedWindows : null,
    falseNoteRate: quietWindows ? falseNotes / quietWindows : null,
    medianAbsoluteCentsError: percentile(centsErrors, 0.5),
    p95AbsoluteCentsError: percentile(centsErrors, 0.95),
    onsetAnnotatedSegments: metrics.filter((item) => item.onsetAnnotated)
      .length,
    onsetDetectedSegments: metrics.filter((item) => item.onsetDetected).length,
    medianNoteOnLatencyMs: percentile(noteOnLatencies, 0.5),
    p95NoteOnLatencyMs: percentile(noteOnLatencies, 0.95)
  };
}

function buildDimensionBreakdowns(results) {
  return Object.fromEntries(
    Object.keys(REPORT_DIMENSIONS).map((dimension) => {
      const values = [
        ...new Set(
          results
            .map((result) => result.dimensions?.[dimension])
            .filter((value) => value !== undefined)
        )
      ].sort();
      return [
        dimension,
        values.map((value) => ({
          value,
          ...aggregateSegments(
            results.filter((result) => result.dimensions?.[dimension] === value)
          )
        }))
      ];
    })
  );
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath || process.argv.length !== 3) {
    usage();
    process.exitCode = 2;
    return;
  }

  const absoluteManifest = resolve(manifestPath);
  const manifest = JSON.parse(await readFile(absoluteManifest, 'utf8'));
  if (
    !manifest ||
    !Array.isArray(manifest.entries) ||
    manifest.entries.length === 0
  ) {
    throw new Error('Manifest must contain a non-empty entries array.');
  }

  const ids = new Set();
  const results = [];
  for (const [index, entry] of manifest.entries.entries()) {
    validateEntry(entry, index);
    if (ids.has(entry.id))
      throw new Error(`Duplicate manifest id: "${entry.id}".`);
    ids.add(entry.id);

    const wavPath = resolve(dirname(absoluteManifest), entry.file);
    const wav = parseWav(await readFile(wavPath));
    results.push(evaluateEntry(entry, wav.samples, wav.sampleRate));
  }

  const pitched = results.filter(
    (result) => result.segmentType === 'pitched-note'
  );
  const quiet = results.filter(
    (result) => result.segmentType === 'silence-or-noise'
  );
  const report = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    method: {
      estimator: 'YIN-style pitch estimator',
      sampleRatePolicy: 'native WAV sample rate; no resampling',
      windowSizeSamples: WINDOW_SIZE,
      hopSizeSamples: HOP_SIZE,
      frequencyRangeHz: [MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ],
      breakdownMethod:
        'Each dimension groups only entries with an explicitly supplied approved category. Detection and false-note rates are window-weighted; cents error and onset latency percentiles use qualifying detected windows/segments.',
      note: 'Metrics are computed locally. No audio or file paths are included. Segment IDs are emitted verbatim as supplied, so callers must use opaque, non-identifying labels; only approved category labels are accepted as additional metadata.'
    },
    summary: {
      segments: results.length,
      pitchedSegments: pitched.length,
      quietSegments: quiet.length,
      meanDetectionCoverage: pitched.length
        ? pitched.reduce(
            (sum, result) => sum + (result.detectionCoverage ?? 0),
            0
          ) / pitched.length
        : null,
      meanFalseNoteRate: quiet.length
        ? quiet.reduce((sum, result) => sum + (result.falseNoteRate ?? 0), 0) /
          quiet.length
        : null
    },
    breakdowns: buildDimensionBreakdowns(results),
    results: results.map((result) => {
      const visibleResult = { ...result };
      delete visibleResult._metrics;
      return visibleResult;
    })
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Pitch recording evaluation failed: ${error.message}\n`);
  process.exitCode = 1;
});
