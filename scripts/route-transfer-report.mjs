function finiteBytes(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function roundMilliseconds(value) {
  return Number.isFinite(value) && value >= 0
    ? Math.round(value * 10) / 10
    : 0;
}

export function normalizeResourceTiming(entry, origin, statuses = new Map()) {
  let baseUrl;
  let resourceUrl;

  try {
    baseUrl = new URL(origin);
    resourceUrl = new URL(entry.name, baseUrl);
  } catch {
    return null;
  }

  if (
    resourceUrl.origin !== baseUrl.origin ||
    !['http:', 'https:'].includes(resourceUrl.protocol)
  ) {
    return null;
  }

  const transferSize = finiteBytes(entry.transferSize);

  return {
    path: resourceUrl.pathname,
    kind: entry.initiatorType || 'other',
    status: statuses.get(entry.name) ?? null,
    encodedBodyBytes: finiteBytes(entry.encodedBodySize),
    decodedBodyBytes: finiteBytes(entry.decodedBodySize),
    transferBytes: transferSize > 0 ? transferSize : null,
    durationMs: roundMilliseconds(entry.duration)
  };
}

export function summarizeRequests(requests) {
  const measured = requests.filter(
    (request) => request.transferBytes !== null
  );

  return {
    requestCount: requests.length,
    encodedBodyBytes: requests.reduce(
      (total, request) => total + request.encodedBodyBytes,
      0
    ),
    decodedBodyBytes: requests.reduce(
      (total, request) => total + request.decodedBodyBytes,
      0
    ),
    transferBytes: measured.reduce(
      (total, request) => total + request.transferBytes,
      0
    ),
    unmeasuredTransferCount: requests.length - measured.length,
    requests
  };
}

export function formatRouteTransferReport(report) {
  const rows = report.routes.map((route) => {
    const profile = route.profile;
    return [
      route.path,
      profile,
      route.status,
      route.requestCount,
      route.encodedBodyBytes,
      route.transferBytes,
      route.unmeasuredTransferCount
    ];
  });

  const lines = [
    '# Browser route-transfer baseline',
    '',
    `- Source commit: ${report.commitSha ?? 'not supplied'}`,
    `- Captured: ${report.generatedAt}`,
    `- Browser: Chromium ${report.browserVersion}`,
    '- Environment: local Wrangler Worker preview in CI',
    '- Cache policy: fresh browser context and disabled HTTP cache for each route',
    '',
    '| Route | Profile | HTTP | Requests | Encoded body (B) | Transfer (B) | Unmeasured |',
    '|---|---|---:|---:|---:|---:|---:|',
    ...rows.map((row) => `|${row.join('|')}|`),
    '',
    'Transfer bytes use the same-origin Resource Timing transferSize value, which includes response headers. Encoded body bytes use encodedBodySize; decoded bytes are retained in the JSON report.',
    '',
    'This is a repeatable CI lab measurement against the local Worker preview. It is not a production-edge transfer measurement, a physical-device result, a field Core Web Vitals report, or a bundle budget. Browser cache and service-worker reuse are disabled; only requests from the initial page load are measured.'
  ];

  return lines.join('\n');
}
