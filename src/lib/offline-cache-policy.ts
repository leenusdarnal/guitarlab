export const PRIVATE_NAVIGATION_PATH_PATTERN =
  /^\/(?:api|account|login|register|signup|verify|password-reset)(?:\/|$)/;

export function isEligiblePublicNavigation(
  url: URL,
  origin: string,
  publicPaths: ReadonlySet<string>
): boolean {
  return (
    url.origin === origin &&
    !url.search &&
    !PRIVATE_NAVIGATION_PATH_PATTERN.test(url.pathname) &&
    publicPaths.has(url.pathname)
  );
}

export function isCacheablePublicNavigation(
  request: Pick<Request, 'method' | 'mode'>,
  response: Pick<Response, 'status' | 'type' | 'headers'>,
  url: URL,
  origin: string,
  publicPaths: ReadonlySet<string>
): boolean {
  if (request.method !== 'GET' || request.mode !== 'navigate') return false;
  if (!isEligiblePublicNavigation(url, origin, publicPaths)) return false;
  if (response.status !== 200 || response.type !== 'basic') return false;
  if (!response.headers.get('content-type')?.includes('text/html')) return false;
  if (response.headers.get('x-guitarlab-cache') !== 'public') return false;
  if (response.headers.has('set-cookie')) return false;

  const cacheControl = response.headers.get('cache-control')?.toLowerCase() ?? '';
  if (cacheControl.includes('private') || cacheControl.includes('no-store')) return false;

  const vary = response.headers.get('vary')?.toLowerCase() ?? '';
  if (vary.split(',').some((value) => ['*', 'cookie', 'authorization'].includes(value.trim()))) {
    return false;
  }
  return true;
}
