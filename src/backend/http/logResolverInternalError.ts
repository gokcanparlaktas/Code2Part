import type { ResolverHttpEndpoint } from './resolverHttpHandlers';

export interface ResolverInternalErrorContext {
  providerSource?: string;
  catalogVersion?: string | null;
}

export function isResolverDebugLoggingEnabled(): boolean {
  return (
    Boolean(process.env.FIRESTORE_EMULATOR_HOST) ||
    process.env.FUNCTIONS_EMULATOR === 'true' ||
    process.env.NODE_ENV !== 'production'
  );
}

export function logResolverInternalError(
  endpoint: ResolverHttpEndpoint | string,
  error: unknown,
  context: ResolverInternalErrorContext = {}
): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error('[resolver-internal-error]', {
    endpoint,
    message,
    ...(context.providerSource ? { providerSource: context.providerSource } : {}),
    ...(context.catalogVersion !== undefined ? { catalogVersion: context.catalogVersion } : {}),
  });

  if (stack) {
    console.error(stack);
  }
}

export function logResolverCatalogProvider(message: string, details?: Record<string, unknown>): void {
  if (!isResolverDebugLoggingEnabled()) {
    return;
  }

  if (details && Object.keys(details).length > 0) {
    console.log('[resolver-catalog]', message, details);
    return;
  }

  console.log('[resolver-catalog]', message);
}
