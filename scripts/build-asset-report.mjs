import { brotliCompressSync, gzipSync } from 'node:zlib';
import { extname, posix } from 'node:path';

const TYPE_BY_EXTENSION = new Map([
  ['.js', 'javascript'],
  ['.mjs', 'javascript'],
  ['.css', 'css']
]);

function normalizeAssetPath(file) {
  let normalized = String(file).replaceAll('\\', '/').replace(/^\.\//, '');
  normalized = posix.normalize(normalized).replace(/^\/+/, '');
  const immutablePrefix = '_app/immutable/';
  if (normalized.startsWith(immutablePrefix)) {
    normalized = normalized.slice(immutablePrefix.length);
  }
  return normalized;
}

export function classifyClientAsset(file) {
  const normalized = normalizeAssetPath(file);
  const type = TYPE_BY_EXTENSION.get(extname(normalized).toLowerCase());
  if (!type) return null;

  const firstSegment = normalized.split('/')[0];
  let group = 'other';
  if (type === 'css') {
    group = 'css';
  } else if (firstSegment === 'entry') {
    group = 'entry';
  } else if (firstSegment === 'nodes') {
    group = 'route-node';
  } else if (firstSegment === 'chunks') {
    group = 'shared-chunk';
  }

  return { type, group };
}

export function createAssetRecord(file, bytes) {
  const normalizedFile = normalizeAssetPath(file);
  const classification = classifyClientAsset(normalizedFile);
  if (!classification) {
    throw new TypeError(`Unsupported production client asset type: ${file}`);
  }

  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return {
    file: normalizedFile,
    ...classification,
    raw: buffer.byteLength,
    gzip: gzipSync(buffer, { level: 9 }).byteLength,
    brotli: brotliCompressSync(buffer).byteLength
  };
}

function emptyTotals() {
  return { count: 0, raw: 0, gzip: 0, brotli: 0 };
}

function addAsset(totals, asset) {
  totals.count += 1;
  totals.raw += asset.raw;
  totals.gzip += asset.gzip;
  totals.brotli += asset.brotli;
}

export function summarizeAssets(rows, { largestLimit = 15 } = {}) {
  if (!Array.isArray(rows)) {
    throw new TypeError('Production asset rows must be an array.');
  }
  if (!Number.isInteger(largestLimit) || largestLimit < 0) {
    throw new RangeError('largestLimit must be a non-negative integer.');
  }

  const seen = new Set();
  const total = emptyTotals();
  const byType = {
    javascript: emptyTotals(),
    css: emptyTotals()
  };
  const byGroup = {};

  for (const row of rows) {
    if (!row || !row.file || !byType[row.type]) {
      throw new TypeError('Each asset row must include a file and supported type.');
    }
    for (const size of ['raw', 'gzip', 'brotli']) {
      if (!Number.isSafeInteger(row[size]) || row[size] < 0) {
        throw new TypeError(`Asset ${row.file} has an invalid ${size} byte count.`);
      }
    }

    const file = normalizeAssetPath(row.file);
    if (seen.has(file)) {
      throw new Error(`Duplicate production asset path: ${file}`);
    }
    seen.add(file);

    const group = row.group || 'other';
    if (!byGroup[group]) byGroup[group] = emptyTotals();
    addAsset(total, row);
    addAsset(byType[row.type], row);
    addAsset(byGroup[group], row);
  }

  const largestAssets = [...rows]
    .sort((left, right) => right.raw - left.raw || left.file.localeCompare(right.file))
    .slice(0, largestLimit);

  return { total, byType, byGroup, largestAssets };
}

function normalizeManifestFile(file) {
  return normalizeAssetPath(file);
}

function getAssetTotals(assets) {
  return assets.reduce((totals, asset) => {
    addAsset(totals, asset);
    return totals;
  }, emptyTotals());
}

/**
 * Estimate each manifest entry's static client asset graph. Static imports and
 * their CSS/assets are counted once; dynamic imports are intentionally left out
 * because they are deferred until the corresponding feature is requested.
 */
export function buildEntryTransfers(manifest, rows) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return [];
  }

  const assetsByPath = new Map(
    rows.map((row) => [normalizeManifestFile(row.file), row])
  );
  const entryChunks = Object.entries(manifest).filter(([, chunk]) => {
    const file = chunk?.file;
    return (
      typeof file === 'string' &&
      /\.(?:m?js)$/i.test(file) &&
      (chunk.isEntry === true || chunk.isDynamicEntry === true)
    );
  });

  return entryChunks
    .map(([key, rootChunk]) => {
      const visitedKeys = new Set();
      const visitedFiles = new Set();
      const includedAssets = [];
      const missingFiles = [];

      function includeFile(file) {
        if (typeof file !== 'string') return;
        const normalized = normalizeManifestFile(file);
        if (!classifyClientAsset(normalized) || visitedFiles.has(normalized)) return;
        visitedFiles.add(normalized);
        const asset = assetsByPath.get(normalized);
        if (asset) {
          includedAssets.push(asset);
        } else {
          missingFiles.push(normalized);
        }
      }

      function visitChunk(chunkKey) {
        if (visitedKeys.has(chunkKey)) return;
        visitedKeys.add(chunkKey);
        const chunk = manifest[chunkKey];
        if (!chunk || typeof chunk !== 'object') return;

        includeFile(chunk.file);
        for (const cssFile of chunk.css ?? []) includeFile(cssFile);
        for (const assetFile of chunk.assets ?? []) includeFile(assetFile);
        for (const importedKey of chunk.imports ?? []) visitChunk(importedKey);
      }

      visitChunk(key);
      const source = rootChunk.src || key;
      return {
        key,
        source,
        label: rootChunk.name || source,
        kind: rootChunk.isEntry === true ? 'entry' : 'dynamic',
        staticImportCount: visitedKeys.size - 1,
        deferredImportCount: Array.isArray(rootChunk.dynamicImports)
          ? rootChunk.dynamicImports.length
          : 0,
        missingFiles,
        files: includedAssets.map((asset) => asset.file).sort(),
        total: getAssetTotals(includedAssets)
      };
    })
    .sort((left, right) => left.source.localeCompare(right.source));
}

function formatBytes(value) {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MiB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${value} B`;
}

function formatSizeCells(totals) {
  return `|${totals.count}|${formatBytes(totals.raw)}|${formatBytes(totals.gzip)}|${formatBytes(totals.brotli)}|`;
}

function escapeMarkdown(value) {
  return String(value).replaceAll('|', '\\|');
}

export function formatAssetReport(report) {
  const lines = [
    '# Production client asset baseline',
    '',
    `Commit: \`${report.commitSha || 'unknown'}\``,
    '',
    'Compressed sizes below are calculated per emitted asset (gzip level 9 and Node Brotli defaults).',
    '',
    '## Total emitted JS/CSS assets',
    '',
    '| Type | Files | Raw | Gzip | Brotli |',
    '|---|---:|---:|---:|---:|',
    `|JavaScript${formatSizeCells(report.byType.javascript)}`,
    `|CSS${formatSizeCells(report.byType.css)}`,
    `|**Total**${formatSizeCells(report.total)}`,
    '',
    '## Asset groups',
    '',
    '| Group | Files | Raw | Gzip | Brotli |',
    '|---|---:|---:|---:|---:|'
  ];

  for (const [group, totals] of Object.entries(report.byGroup).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`|${escapeMarkdown(group)}${formatSizeCells(totals)}`);
  }

  lines.push(
    '',
    '## Largest emitted assets',
    '',
    '| Asset | Type | Raw | Gzip | Brotli |',
    '|---|---|---:|---:|---:|'
  );

  for (const asset of report.largestAssets) {
    lines.push(
      `|${escapeMarkdown(asset.file)}|${asset.type}|${formatBytes(asset.raw)}|${formatBytes(asset.gzip)}|${formatBytes(asset.brotli)}|`
    );
  }

  lines.push(
    '',
    '## Static entry graphs',
    '',
    'Each entry includes its own file, CSS/assets and transitive static imports, de-duplicated within that entry. Dynamic imports are listed separately and excluded from the initial static graph.',
    '',
    '| Entry source | Kind | Assets | Raw | Gzip | Brotli | Deferred imports | Missing manifest assets |',
    '|---|---|---:|---:|---:|---:|---:|---:|'
  );

  if (report.entries.length === 0) {
    lines.push('|(No Vite JavaScript entries found)|(unavailable)|0|0 B|0 B|0 B|0|0|');
  } else {
    for (const entry of report.entries) {
      lines.push(
        `|${escapeMarkdown(entry.source)}|${entry.kind}|${entry.total.count}|${formatBytes(entry.total.raw)}|${formatBytes(entry.total.gzip)}|${formatBytes(entry.total.brotli)}|${entry.deferredImportCount}|${entry.missingFiles.length}|`
      );
    }
  }

  lines.push(
    '',
    '> This is a build-output baseline, not a measured page transfer. Actual page requests depend on the route manifest, dynamic imports, browser cache, compression negotiation, headers and runtime behavior. It does not attribute minified bytes to individual npm dependencies.',
    ''
  );

  return lines.join('\n');
}
