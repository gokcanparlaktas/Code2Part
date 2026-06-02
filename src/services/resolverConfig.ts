export type ResolverMode = 'local' | 'backend';

const DEFAULT_API_BASE_URL =
  'https://europe-west3-code2part-de0d0.cloudfunctions.net';

function readPublicEnv(key: string): string | undefined {
  const value = process.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function getResolverMode(): ResolverMode {
  const raw = readPublicEnv('EXPO_PUBLIC_RESOLVER_MODE')?.toLowerCase();
  if (raw === 'local') {
    return 'local';
  }
  return 'backend';
}

export function isBackendResolverMode(): boolean {
  return getResolverMode() === 'backend';
}

export function getResolverApiBaseUrl(): string {
  const configured = readPublicEnv('EXPO_PUBLIC_RESOLVER_API_BASE_URL');
  const base = configured || DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, '');
}

export function getResolverRequestTimeoutMs(): number {
  const raw = readPublicEnv('EXPO_PUBLIC_RESOLVER_TIMEOUT_MS');
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30_000;
}

/** Opt-in dev-only escape hatch; production always uses backend only. */
export function shouldFallbackToLocalResolverOnBackendError(): boolean {
  if (!__DEV__) {
    return false;
  }
  return readPublicEnv('EXPO_PUBLIC_RESOLVER_BACKEND_FALLBACK') === 'true';
}
