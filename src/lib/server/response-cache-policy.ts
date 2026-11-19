export interface PrivateResponseCacheContext {
  authenticated: boolean;
  privatePath: boolean;
}

/**
 * Prevent authenticated, identity-route, and cookie-setting responses from
 * entering a shared/offline cache.
 *
 * This runs in the server request lifecycle, where Set-Cookie is still
 * available to inspect before browser response-header filtering.
 */
export function applyPrivateResponseCachePolicy(
  headers: Headers,
  context: PrivateResponseCacheContext
): void {
  if (
    context.authenticated ||
    context.privatePath ||
    headers.has('set-cookie')
  ) {
    headers.set('Cache-Control', 'private, no-store');
    headers.delete('X-GuitarLab-Cache');
  }
}
