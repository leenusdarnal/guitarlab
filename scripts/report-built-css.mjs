#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { join, relative } from 'node:path';

const outputDirectory = new URL(
  '../.svelte-kit/output/client/_app/immutable/assets/',
  import.meta.url
);
const root = new URL(
  '../.svelte-kit/output/client/_app/immutable/assets/',
  import.meta.url
);

async function collectCss(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory.pathname, entry.name);
    if (entry.isDirectory()) {
      files.push(
        ...(await collectCss(new URL(`./${entry.name}/`, directory)))
      );
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      files.push(path);
    }
  }
  return files;
}

let files;
try {
  files = await collectCss(outputDirectory);
} catch (error) {
  console.error(
    'Built CSS output directory is missing. Run npm run build before reporting CSS size.'
  );
  throw error;
}

if (files.length === 0) {
  console.error(
    'No emitted CSS assets found in .svelte-kit/output/client/_app/immutable/assets/.'
  );
  process.exit(1);
}

const rows = [];
for (const file of files) {
  const bytes = await readFile(file);
  rows.push({
    file: relative(root.pathname, file),
    raw: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes).length
  });
}
rows.sort((a, b) => a.file.localeCompare(b.file));

const totals = rows.reduce(
  (sum, row) => ({
    raw: sum.raw + row.raw,
    gzip: sum.gzip + row.gzip,
    brotli: sum.brotli + row.brotli
  }),
  { raw: 0, gzip: 0, brotli: 0 }
);

console.log('Production CSS asset sizes (compressed per emitted asset):');
for (const row of rows) {
  console.log(
    `  ${row.file}: raw=${row.raw} B, gzip=${row.gzip} B, brotli=${row.brotli} B`
  );
}
console.log(
  `TOTAL (${rows.length} assets): raw=${totals.raw} B, gzip=${totals.gzip} B, brotli=${totals.brotli} B`
);
