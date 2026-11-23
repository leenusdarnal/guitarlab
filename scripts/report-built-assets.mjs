#!/usr/bin/env node
import { appendFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildEntryTransfers,
  createAssetRecord,
  formatAssetReport,
  summarizeAssets
} from './build-asset-report.mjs';

const clientRoot = fileURLToPath(
  new URL('../.svelte-kit/output/client/', import.meta.url)
);
const immutableRoot = join(clientRoot, '_app', 'immutable');
const manifestPath = join(clientRoot, '.vite', 'manifest.json');
const reportPath = join(clientRoot, 'build-asset-report.json');

async function collectClientAssets(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectClientAssets(absolutePath)));
    } else if (entry.isFile() && /\.(?:m?js|css)$/i.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

let assetFiles;
try {
  assetFiles = await collectClientAssets(immutableRoot);
} catch (error) {
  console.error(
    'Built client asset directory is missing. Run npm run build before reporting production asset sizes.'
  );
  throw error;
}

if (assetFiles.length === 0) {
  throw new Error(
    'No emitted JavaScript or CSS assets found under .svelte-kit/output/client/_app/immutable/.'
  );
}

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (error) {
  console.error(
    'Vite build manifest is missing or invalid. Confirm build.manifest is enabled in vite.config.ts.'
  );
  throw error;
}

const rows = [];
for (const absolutePath of assetFiles) {
  const bytes = await readFile(absolutePath);
  const relativePath = relative(immutableRoot, absolutePath).split('\\\\').join('/');
  rows.push(createAssetRecord(relativePath, bytes));
}
rows.sort((left, right) => left.file.localeCompare(right.file));

const summary = summarizeAssets(rows, { largestLimit: 15 });
const entries = buildEntryTransfers(manifest, rows);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  commitSha: process.env.GITHUB_SHA || null,
  nodeVersion: process.version,
  compression: {
    gzip: 'gzip level 9, measured independently per emitted asset',
    brotli: 'Node.js brotliCompressSync defaults, measured independently per emitted asset'
  },
  assetRoot: '.svelte-kit/output/client/_app/immutable/',
  manifestPath: '.svelte-kit/output/client/.vite/manifest.json',
  ...summary,
  entries,
  assets: rows
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const markdown = formatAssetReport(report);
console.log(markdown);
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, 'utf8');
}

console.log(
  `\nJSON production asset report: ${relative(process.cwd(), reportPath)}`
);
