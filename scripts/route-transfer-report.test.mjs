import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatRouteTransferReport,
  normalizeResourceTiming,
  summarizeRequests
} from './route-transfer-report.mjs';

const origin = 'http://127.0.0.1:8788';

test('normalizes same-origin resource timing and removes query strings', () => {
  const requestUrl = `${origin}/_app/immutable/entry/start.js?v=secret-fragment#section`;
  const request = normalizeResourceTiming(
    {
      name: requestUrl,
      initiatorType: 'script',
      encodedBodySize: 120,
      decodedBodySize: 640,
      transferSize: 164,
      duration: 18.36
    },
    origin,
    new Map([[requestUrl, 200]])
  );

  assert.deepEqual(request, {
    path: '/_app/immutable/entry/start.js',
    kind: 'script',
    status: 200,
    encodedBodyBytes: 120,
    decodedBodyBytes: 640,
    transferBytes: 164,
    durationMs: 18.4
  });
});

test('excludes cross-origin and non-HTTP resources', () => {
  assert.equal(
    normalizeResourceTiming(
      {
        name: 'https://example.com/analytics.js',
        initiatorType: 'script',
        encodedBodySize: 100,
        decodedBodySize: 100,
        transferSize: 150,
        duration: 5
      },
      origin
    ),
    null
  );

  assert.equal(
    normalizeResourceTiming(
      {
        name: 'data:image/svg+xml,example',
        initiatorType: 'img',
        encodedBodySize: 100,
        decodedBodySize: 100,
        transferSize: 100,
        duration: 1
      },
      origin
    ),
    null
  );
});

test('marks zero transfer sizes as unmeasured instead of treating cache hits as zero-byte transfers', () => {
  const request = normalizeResourceTiming(
    {
      name: `${origin}/cached.js`,
      initiatorType: 'script',
      encodedBodySize: 80,
      decodedBodySize: 320,
      transferSize: 0,
      duration: 1
    },
    origin
  );

  assert.equal(request.transferBytes, null);
  assert.equal(request.encodedBodyBytes, 80);
});

test('summarizes encoded, decoded and transferred bytes without hiding unmeasured requests', () => {
  const report = summarizeRequests([
    {
      path: '/app.js',
      encodedBodyBytes: 100,
      decodedBodyBytes: 400,
      transferBytes: 140
    },
    {
      path: '/cached.css',
      encodedBodyBytes: 50,
      decodedBodyBytes: 100,
      transferBytes: null
    }
  ]);

  assert.deepEqual(
    {
      requestCount: report.requestCount,
      encodedBodyBytes: report.encodedBodyBytes,
      decodedBodyBytes: report.decodedBodyBytes,
      transferBytes: report.transferBytes,
      unmeasuredTransferCount: report.unmeasuredTransferCount
    },
    {
      requestCount: 2,
      encodedBodyBytes: 150,
      decodedBodyBytes: 500,
      transferBytes: 140,
      unmeasuredTransferCount: 1
    }
  );
});

test('formats the measurement environment and its limitations', () => {
  const markdown = formatRouteTransferReport({
    commitSha: 'abc123',
    generatedAt: '2026-11-23T00:00:00.000Z',
    browserVersion: '1.56.1',
    routes: [
      {
        path: '/learn',
        profile: 'mobile',
        status: 200,
        requestCount: 12,
        encodedBodyBytes: 3000,
        transferBytes: 3200,
        unmeasuredTransferCount: 0
      }
    ]
  });

  assert.match(markdown, /abc123/);
  assert.match(markdown, /local Wrangler Worker preview/);
  assert.match(markdown, /Transfer bytes use the same-origin Resource Timing/);
  assert.match(markdown, /not a production-edge transfer measurement/);
  assert.match(markdown, /\|\/learn\|mobile\|200\|12\|3000\|3200\|0\|/);
});
