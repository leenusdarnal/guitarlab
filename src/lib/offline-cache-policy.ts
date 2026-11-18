export const PRIVATE_NAVIGATION_PATH_PATTERN =
  /^\/(?:api|account|login|register|signup|verify|password-reset)(?:\/|$)/;

export function isEligiblePublicNavigation(
  url: URL,
  origin: string
): boolean {
  return (
    url.origin === origin &&
    !url.search &&
    !PRIVATE_NAVIGATION_PATH_PATTERN.test(url.pathname)
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
  if (!isEligiblePublicNavigation(url, origin)) return false;
  if (response.status !== 200 || response.type !== 'basic') return false;
  if (!response.headers.get('content-type')?.includes('text/html')) return false;
  if (response.headers.has('set-cookie')) return false;

  const cacheControl = response.headers.get('cache-control')?.toLowerCase() ?? '';
  const directives = cacheControl
    .split(',')
    .map((directive) => directive.split('=', 1)[0].trim());
  if (directives.some((directive) => ['private', 'no-store'].includes(directive))) {
    return false;
  }

  const explicitlyPublic =
    publicPaths.has(url.pathname) || directives.includes('public');
  if (!explicitlyPublic) return false;

  const vary = response.headers.get('vary')?.toLowerCase() ?? '';
  if (
    vary
      .split(',')
      .some((value) =>
        ['*', 'cookie', 'authorization'].includes(value.trim())
      )
  ) {
    return false;
  }

  return true;
}
