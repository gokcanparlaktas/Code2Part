import {
  getResolverApiBaseUrl,
  getResolverMode,
  getResolverRequestTimeoutMs,
  isBackendResolverMode,
  shouldFallbackToLocalResolverOnBackendError,
} from '@/services/resolverConfig';

describe('resolverConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_RESOLVER_MODE;
    delete process.env.EXPO_PUBLIC_RESOLVER_API_BASE_URL;
    delete process.env.EXPO_PUBLIC_RESOLVER_TIMEOUT_MS;
    delete process.env.EXPO_PUBLIC_RESOLVER_BACKEND_FALLBACK;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults to backend mode', () => {
    expect(getResolverMode()).toBe('backend');
    expect(isBackendResolverMode()).toBe(true);
  });

  it('allows explicit local mode from env', () => {
    process.env.EXPO_PUBLIC_RESOLVER_MODE = 'local';
    expect(getResolverMode()).toBe('local');
    expect(isBackendResolverMode()).toBe(false);
  });

  it('uses configured API base URL', () => {
    process.env.EXPO_PUBLIC_RESOLVER_API_BASE_URL =
      'https://example.cloudfunctions.net/';
    expect(getResolverApiBaseUrl()).toBe('https://example.cloudfunctions.net');
  });

  it('uses default timeout when unset', () => {
    expect(getResolverRequestTimeoutMs()).toBe(30_000);
  });

  it('disables backend fallback unless explicitly enabled in dev', () => {
    expect(shouldFallbackToLocalResolverOnBackendError()).toBe(false);
    process.env.EXPO_PUBLIC_RESOLVER_BACKEND_FALLBACK = 'true';
    expect(shouldFallbackToLocalResolverOnBackendError()).toBe(true);
  });
});
