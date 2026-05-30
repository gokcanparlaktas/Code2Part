import { assertNoForbiddenBackendResponseKeys } from '@/backend/dto/backendResponseSecurity';

export interface ResolverHttpResponse {
  status: number;
  body: Record<string, unknown>;
}

export function sendResolverJsonResponse(
  status: number,
  body: Record<string, unknown>
): ResolverHttpResponse {
  assertNoForbiddenBackendResponseKeys(body);
  return { status, body };
}

export function resolverErrorResponse(
  status: number,
  message: string,
  code?: string
): ResolverHttpResponse {
  const body: Record<string, unknown> = { error: message };
  if (code) {
    body.code = code;
  }
  assertNoForbiddenBackendResponseKeys(body);
  return { status, body };
}
