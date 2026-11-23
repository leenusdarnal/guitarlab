import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEntryTransfers,
  classifyClientAsset,
  createAssetRecord,
  formatAssetReport,
  summarizeAssets
} from './build-asset-report.mjs';

test('classifies client JavaScript and CSS assets by emitted role', () => {
  assert.deepEqual(classifyClientAsset('entry/start.abc.js'), {
    type: 'javascript',
    group: 'entry'
  });
  assert.deepEqual(classifyClientAsset('nodes/4.abc.js'), {
    type: 'javascript',
    group: 'route-node'
  });
  assert.deepEqual(classifyClientAsset('chunks/shared.abc.js'), {
    type: 'javascript',
    group: 'shared-chunk'
  });
  assert.deepEqual(classifyClientAsset('assets/page.abc.css'), {
    type: 'css',
    group: 'css'
  });
  assert.equal(classifyClientAsset('assets/font.woff2'), null);
});

test('records exact, gzip and Brotli sizes for each emitted asset', () => {
  const record = createAssetRecord('chunks/app.js', Buffer.from('const app = true;'));

  assert.equal(record.file, 'chunks/app.js');
  assert.equal(record.type, 'javascript');
  assert.equal(record.group, 'shared-chunk');
  assert.equal(record.raw, Buffer.byteLength('const app = true;'));
  assert.ok(record.gzip > 0);
  assert.ok(record.brotli > 0);
});

test('summarizes totals, asset roles and the largest assets', () => {
  const rows = [
    { file: 'entry/start.js', type: 'javascript', group: 'entry', raw: 100, gzip: 60, brotli: 55 },
    { file: 'nodes/4.js', type: 'javascript', group: 'route-node', raw: 300, gzip: 140, brotli: 125 },
    { file: 'chunks/shared.js', type: 'javascript', group: 'shared-chunk', raw: 600, gzip: 210, brotli: 185 },
    { file: 'assets/route.css', type: 'css', group: 'css', raw: 200, gzip: 80, brotli: 70 }
  ];

  const report = summarizeAssets(rows, { largestLimit: 2 });

  assert.deepEqual(report.total, { count: 4, raw: 1200, gzip: 490, brotli: 435 });
  assert.deepEqual(report.byType.javascript, {
    count: 3,
    raw: 1000,
    gzip: 410,
    brotli: 365
  });
  assert.deepEqual(report.byType.css, {
    count: 1,
    raw: 200,
    gzip: 80,
    brotli: 70
  });
  assert.deepEqual(report.byGroup['shared-chunk'], {
    count: 1,
    raw: 600,
    gzip: 210,
    brotli: 185
  });
  assert.deepEqual(report.largestAssets.map((asset) => asset.file), [
    'chunks/shared.js',
    'nodes/4.js'
  ]);
});

test('calculates entry transfer from static imports and shared CSS only once', () => {
  const manifest = {
    'src/routes/+page.svelte': {
      file: '_app/immutable/nodes/home.js',
      src: 'src/routes/+page.svelte',
      isEntry: true,
      imports: ['_shared.js'],
      css: ['_app/immutable/assets/home.css']
    },
    'src/routes/learn/+page.svelte': {
      file: '_app/immutable/nodes/learn.js',
      src: 'src/routes/learn/+page.svelte',
      isEntry: true,
      imports: ['_shared.js'],
      css: ['_app/immutable/assets/learn.css']
    },
    '_shared.js': {
      file: '_app/immutable/chunks/shared.js'
    },
    'lazy-tool.js': {
      file: '_app/immutable/nodes/lazy-tool.js',
      isDynamicEntry: true
    }
  };
  const rows = [
    { file: 'nodes/home.js', type: 'javascript', group: 'route-node', raw: 100, gzip: 50, brotli: 40 },
    { file: 'nodes/learn.js', type: 'javascript', group: 'route-node', raw: 120, gzip: 60, brotli: 48 },
    { file: 'chunks/shared.js', type: 'javascript', group: 'shared-chunk', raw: 300, gzip: 100, brotli: 90 },
    { file: 'assets/home.css', type: 'css', group: 'css', raw: 40, gzip: 20, brotli: 15 },
    { file: 'assets/learn.css', type: 'css', group: 'css', raw: 50, gzip: 22, brotli: 17 },
    { file: 'nodes/lazy-tool.js', type: 'javascript', group: 'route-node', raw: 400, gzip: 130, brotli: 115 }
  ];

  const entries = buildEntryTransfers(manifest, rows);

  assert.equal(entries.length, 3);
  const home = entries.find((entry) => entry.source === 'src/routes/+page.svelte');
  const learn = entries.find((entry) => entry.source === 'src/routes/learn/+page.svelte');
  const lazy = entries.find((entry) => entry.kind === 'dynamic');

  assert.deepEqual(home.total, { count: 3, raw: 440, gzip: 170, brotli: 145 });
  assert.deepEqual(learn.total, { count: 3, raw: 470, gzip: 182, brotli: 155 });
  assert.deepEqual(lazy.total, { count: 1, raw: 400, gzip: 130, brotli: 115 });
  assert.deepEqual(home.missingFiles, []);
});

test('formats a readable production asset report with explicit measurement limits', () => {
  const rows = [
    { file: 'chunks/shared.js', type: 'javascript', group: 'shared-chunk', raw: 600, gzip: 210, brotli: 185 },
    { file: 'assets/main.css', type: 'css', group: 'css', raw: 200, gzip: 80, brotli: 70 }
  ];
  const report = {
    commitSha: 'abc123',
    total: { count: 2, raw: 800, gzip: 290, brotli: 255 },
    byType: {
      javascript: { count: 1, raw: 600, gzip: 210, brotli: 185 },
      css: { count: 1, raw: 200, gzip: 80, brotli: 70 }
    },
    byGroup: {
      'shared-chunk': { count: 1, raw: 600, gzip: 210, brotli: 185 },
      css: { count: 1, raw: 200, gzip: 80, brotli: 70 }
    },
    largestAssets: rows,
    entries: []
  };

  const markdown = formatAssetReport(report);

  assert.match(markdown, /abc123/);
  assert.match(markdown, /JavaScript/);
  assert.match(markdown, /Brotli/);
  assert.match(markdown, /chunks\/shared\.js/);
  assert.match(markdown, /per emitted asset/);
  assert.match(markdown, /not a measured page transfer/);
});

test('parses SvelteKit route dictionary into layout and leaf node indices', async () => {
  const { parseSvelteKitRouteDictionary } = await import('./build-asset-report.mjs');
  const source = `
    export const dictionary = {
      "/": ["~2"],
      "/learn": [3, [0, 4], [1]]
    };
  `;

  assert.deepEqual(parseSvelteKitRouteDictionary(source), [
    { route: '/', nodeIndices: [0, 2], usesServerData: true },
    { route: '/learn', nodeIndices: [0, 4, 3], usesServerData: false }
  ]);
});

test('builds route-level static transfer estimates with shared assets counted once', async () => {
  const { buildRouteTransfers } = await import('./build-asset-report.mjs');
  const routes = [
    { route: '/', nodeIndices: [0, 2], usesServerData: true },
    { route: '/learn', nodeIndices: [0, 4, 3], usesServerData: false }
  ];
  const entries = [
    { source: '.svelte-kit/generated/build/client-optimized/app.js', kind: 'entry', nodeIndex: null, files: ['entry/app.js'] },
    { source: '.svelte-kit/generated/build/client-optimized/nodes/0.js', kind: 'entry', nodeIndex: 0, files: ['nodes/0.js', 'chunks/shared.js'] },
    { source: '.svelte-kit/generated/build/client-optimized/nodes/2.js', kind: 'entry', nodeIndex: 2, files: ['nodes/2.js', 'assets/home.css', 'chunks/shared.js'] },
    { source: '.svelte-kit/generated/build/client-optimized/nodes/3.js', kind: 'entry', nodeIndex: 3, files: ['nodes/3.js', 'assets/learn.css', 'chunks/shared.js'] },
    { source: '.svelte-kit/generated/build/client-optimized/nodes/4.js', kind: 'entry', nodeIndex: 4, files: ['nodes/4.js'] },
    { source: 'node_modules/@sveltejs/kit/src/runtime/client/entry.js', kind: 'entry', nodeIndex: null, files: ['entry/runtime.js'] },
    { source: '.svelte-kit/generated/shared/error-template.js', kind: 'dynamic', nodeIndex: null, files: ['chunks/error-template.js'] }
  ];
  const rows = [
    { file: 'entry/app.js', type: 'javascript', group: 'entry', raw: 10, gzip: 8, brotli: 7 },
    { file: 'entry/runtime.js', type: 'javascript', group: 'entry', raw: 20, gzip: 10, brotli: 9 },
    { file: 'nodes/0.js', type: 'javascript', group: 'route-node', raw: 100, gzip: 50, brotli: 45 },
    { file: 'nodes/2.js', type: 'javascript', group: 'route-node', raw: 30, gzip: 18, brotli: 16 },
    { file: 'nodes/3.js', type: 'javascript', group: 'route-node', raw: 40, gzip: 20, brotli: 18 },
    { file: 'nodes/4.js', type: 'javascript', group: 'route-node', raw: 50, gzip: 25, brotli: 22 },
    { file: 'chunks/shared.js', type: 'javascript', group: 'shared-chunk', raw: 200, gzip: 80, brotli: 70 },
    { file: 'assets/home.css', type: 'css', group: 'css', raw: 15, gzip: 9, brotli: 8 },
    { file: 'assets/learn.css', type: 'css', group: 'css', raw: 25, gzip: 12, brotli: 10 },
    { file: 'chunks/error-template.js', type: 'javascript', group: 'shared-chunk', raw: 5, gzip: 4, brotli: 3 }
  ];

  const transfers = buildRouteTransfers(routes, entries, rows);
  const home = transfers.find((route) => route.route === '/');
  const learn = transfers.find((route) => route.route === '/learn');

  assert.deepEqual(home.total, { count: 6, raw: 375, gzip: 175, brotli: 155 });
  assert.deepEqual(learn.total, { count: 7, raw: 445, gzip: 205, brotli: 181 });
  assert.deepEqual(home.nodeIndices, [0, 2]);
  assert.deepEqual(home.missingNodeIndices, []);
});
