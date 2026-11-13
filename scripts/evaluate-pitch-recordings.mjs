#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { estimatePitch } from '../src/lib/audio/pitch-estimator.ts';
import { StableNoteTracker } from '../src/lib/audio/stable-note-tracker.ts';

const WINDOW_SIZE = 4_096;
const HOP_SIZE = 1_024;
const MIN_FREQUENCY_HZ = 40;
const MAX_FREQUENCY_HZ = 1_000;

function usage() {
  process.stderr.write(
    'Usage: node scripts/evaluate-pitch-recordings.mjs <manifest.json>\n' +
      'The manifest and WAV files stay local. Results are written to stdout only.\n'
  );
}

function parseWav(buffer) {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' ||
      buffer.toString('ascii', 8, 12) !== 'WAVE') {
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

  if (!format || !data) throw new Error('WAV must contain fmt and data chunks.');
  const { audioFormat, channels, sampleRate, blockAlign, bitsPerSample } = format;
  if (!Number.isInteger(channels) || channels < 1 || channels > 32 ||
      !Number.isInteger(sampleRate) || sampleRate <= 0 ||
      blockAlign !== channels * (bitsPerSample / 8)) {
    throw new Error('WAV channel, sample-rate, or block-alignment metadata is invalid.');
  }
  if (!((audioFormat === 1 && [8, 16, 24, 32].includes(bitsPerSample)) ||
        (audioFormat === 3 && bitsPerSample === 32))) {
    throw new Error('Supported WAV encodings: PCM 8/16/24/32-bit and IEEE float32.');
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
      if (!Number.isFinite(value)) throw new Error('WAV contains non-finite samples.');
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
  if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' ||
      !entry.id.trim() || typeof entry.file !== 'string' || !entry.file.trim()) {
    throw new Error(`Manifest entry ${index + 1} needs non-empty id and file fields.`);
  }
  if (entry.expectedFrequencyHz !== null &&
      (!Number.isFinite(entry.expectedFrequencyHz) ||
       entry.expectedFrequencyHz < MIN_FREQUENCY_HZ ||
       entry.expectedFrequencyHz > MAX_FREQUENCY_HZ)) {
    throw new Error(`Entry "${entry.id}" expectedFrequencyHz must be null or between ${MIN_FREQUENCY_HZ} and ${MAX_FREQUENCY_HZ}.`);
  }
  const start = entry.startSeconds ?? 0;
  if (!Number.isFinite(start) || start < 0) {
    throw new Error(`Entry "${entry.id}" startSeconds must be non-negative.`);
  }
  if (entry.endSeconds !== undefined &&
      (!Number.isFinite(entry.endSeconds) || entry.endSeconds <= start)) {
    throw new Error(`Entry "${entry.id}" endSeconds must be greater than startSeconds.`);
  }
  if (entry.expectedOnsetSeconds !== undefined &&
      (!Number.isFinite(entry.expectedOnsetSeconds) || entry.expectedOnsetSeconds < start ||
       (entry.endSeconds !== undefined && entry.expectedOnsetSeconds > entry.endSeconds))) {
    throw new Error(`Entry "${entry.id}" expectedOnsetSeconds must fall within its segment.`);
  }
}

function evaluateEntry(entry, samples, sampleRate) {
  const start = Math.floor((entry.startSeconds ?? 0) * sampleRate);
  const end = entry.endSeconds === undefined
    ? samples.length
    : Math.min(samples.length, Math.floor(entry.endSeconds * sampleRate));
  if (start >= samples.length || end - start < WINDOW_SIZE) {
    throw new Error(`Entry "${entry.id}" does not contain one complete analysis window.`);
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
        errors.push(Math.abs(1_200 * Math.log2(
          estimate.frequencyHz / entry.expectedFrequencyHz
        )));
      }
    } else if (estimate.status === 'uncertain') {
      lowConfidence += 1;
    }

    if (tracked.event === 'note-on' && noteOnSeconds === null) {
      noteOnSeconds = timeSeconds;
    }
  }

  const isSilence = entry.expectedFrequencyHz === null;
  const result = {
    id: entry.id,
    segmentType: isSilence ? 'silence-or-noise' : 'pitched-note',
    windows,
    detectionCoverage: isSilence ? null : detected / windows,
    falseNoteRate: isSilence ? falseNotes / windows : null,
    medianAbsoluteCentsError: isSilence ? null : percentile(errors, 0.5),
    p95AbsoluteCentsError: isSilence ? null : percentile(errors, 0.95),
    detectedWindows: detected,
    uncertainWindows: lowConfidence,
    noteOnLatencyMs: entry.expectedOnsetSeconds !== undefined && noteOnSeconds !== null
      ? (noteOnSeconds - entry.expectedOnsetSeconds) * 1_000
      : null
  };

  return result;
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
  if (!manifest || !Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw new Error('Manifest must contain a non-empty entries array.');
  }

  const ids = new Set();
  const results = [];
  for (const [index, entry] of manifest.entries.entries()) {
    validateEntry(entry, index);
    if (ids.has(entry.id)) throw new Error(`Duplicate manifest id: "${entry.id}".`);
    ids.add(entry.id);

    const wavPath = resolve(dirname(absoluteManifest), entry.file);
    const wav = parseWav(await readFile(wavPath));
    results.push(evaluateEntry(entry, wav.samples, wav.sampleRate));
  }

  const pitched = results.filter((result) => result.segmentType === 'pitched-note');
  const quiet = results.filter((result) => result.segmentType === 'silence-or-noise');
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    method: {
      estimator: 'YIN-style pitch estimator',
      sampleRatePolicy: 'native WAV sample rate; no resampling',
      windowSizeSamples: WINDOW_SIZE,
      hopSizeSamples: HOP_SIZE,
      frequencyRangeHz: [MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ],
      note: 'Metrics are computed locally. No audio or file paths are included in this report.'
    },
    summary: {
      segments: results.length,
      pitchedSegments: pitched.length,
      quietSegments: quiet.length,
      meanDetectionCoverage: pitched.length
        ? pitched.reduce((sum, result) => sum + (result.detectionCoverage ?? 0), 0) / pitched.length
        : null,
      meanFalseNoteRate: quiet.length
        ? quiet.reduce((sum, result) => sum + (result.falseNoteRate ?? 0), 0) / quiet.length
        : null
    },
    results
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Pitch recording evaluation failed: ${error.message}\n`);
  process.exitCode = 1;
});
