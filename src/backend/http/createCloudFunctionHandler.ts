import {
  dispatchResolverHttpRequest,
  type ResolverHttpDeps,
  type ResolverHttpEndpoint,
} from './resolverHttpHandlers';

/**
 * Future hardening (not implemented in Phase 3):
 * - Firebase App Check token verification
 * - Firebase Auth / anonymous auth
 * - Per-IP or per-user rate limiting (Cloud Armor / Redis / Firestore counters)
 */
export const RESOLVER_HTTP_SECURITY_NOTES = [
  'Enable Firebase App Check before public mobile release.',
  'Require Firebase Auth or signed API keys for production traffic.',
  'Add rate limiting at the edge or function middleware layer.',
] as const;

export interface CloudFunctionRequestLike {
  method?: string;
  body?: unknown;
}

export interface CloudFunctionResponseLike {
  status(code: number): CloudFunctionResponseLike;
  json(body: unknown): void;
  send(body?: string): void;
  set(header: string, value: string): void;
}

export function createResolverHttpHandler(
  endpoint: ResolverHttpEndpoint,
  deps?: ResolverHttpDeps
) {
  return async (req: CloudFunctionRequestLike, res: CloudFunctionResponseLike): Promise<void> => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.', code: 'method_not_allowed' });
      return;
    }

    const result = await dispatchResolverHttpRequest(endpoint, req.body, deps);
    res.status(result.status).json(result.body);
  };
}
