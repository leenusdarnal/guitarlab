export const PRIVATE_NAVIGATION_PATH_PATTERN =
  /^\/(?:api|account|login|register|signup|verify|password-reset)(?:\/|$)/;

export function isEligiblePublicNavigation(url: URL, origin: string): boolean {
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
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return false;
  }
  if (response.headers.has('set-cookie')) return false;

  const cacheControl =
    response.headers.get('cache-control')?.toLowerCase() ?? '';
  const directives = cacheControl
    .split(',')
    .map((directive) => directive.split('=', 1)[0].trim());
  if (
    directives.some((directive) => ['private', 'no-store'].includes(directive))
  ) {
    return false;
  }

  const explicitlyPublic =
    publicPaths.has(url.pathname) || directives.includes('public');
  if (!explicitlyPublic) return false;

  const vary = response.headers.get('vary')?.toLowerCase() ?? '';
  if (
    vary
      .split(',')
      .some((value) => ['*', 'cookie', 'authorization'].includes(value.trim()))
  ) {
    return false;
  }

  return true;
}

export type PublicNavigationCache = Pick<Cache, 'match' | 'put' | 'delete'>;

export interface PublicNavigationResolutionOptions {
  online: boolean;
  fetchNavigation: () => Promise<Response>;
  offlineResponse: () => Response;
  afterCacheWrite?: () => Promise<unknown>;
}

/**
 * Resolve a document navigation without allowing a private response to enter
 * or leave Cache Storage. Cache failures are non-fatal to online navigation.
 */
export async function resolvePublicNavigation(
  request: Request,
  cache: PublicNavigationCache | null,
  url: URL,
  origin: string,
  publicPaths: ReadonlySet<string>,
  options: PublicNavigationResolutionOptions
): Promise<Response> {
  const offlineResponse = () => options.offlineResponse();

  if (!isEligiblePublicNavigation(url, origin)) {
    if (!options.online) return offlineResponse();

    try {
      return await options.fetchNavigation();
    } catch {
      return offlineResponse();
    }
  }

  const readPublicCache = async (): Promise<Response | null> => {
    if (!cache) return null;

    try {
      const cached = await cache.match(request);
      if (
        cached &&
        isCacheablePublicNavigation(request, cached, url, origin, publicPaths)
      ) {
        return cached;
      }
      if (cached) await cache.delete(request);
    } catch {
      // A cache lookup or cleanup failure must not block the offline fallback.
    }

    return null;
  };

  if (!options.online) {
    return (await readPublicCache()) ?? offlineResponse();
  }

  try {
    const response = await options.fetchNavigation();
    if (
      cache &&
      isCacheablePublicNavigation(request, response, url, origin, publicPaths)
    ) {
      try {
        await cache.put(request, response.clone());
        await options.afterCacheWrite?.();
      } catch {
        // Keep the successful network response usable when Cache Storage fails.
      }
    }
    return response;
  } catch {
    return (await readPublicCache()) ?? offlineResponse();
  }
}
