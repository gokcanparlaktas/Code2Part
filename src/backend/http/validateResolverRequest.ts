export const MAX_PRODUCT_CODE_LENGTH = 256;

export class ResolverRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResolverRequestValidationError';
  }
}

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new ResolverRequestValidationError(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new ResolverRequestValidationError(`${fieldName} must not be empty`);
  }

  if (trimmed.length > MAX_PRODUCT_CODE_LENGTH) {
    throw new ResolverRequestValidationError(
      `${fieldName} must be at most ${MAX_PRODUCT_CODE_LENGTH} characters`
    );
  }

  return trimmed;
}

export function validateIdentifyRequestBody(body: unknown): { code: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ResolverRequestValidationError('Request body must be a JSON object');
  }

  const record = body as Record<string, unknown>;
  return {
    code: assertNonEmptyString(record.code, 'code'),
  };
}

export function validateCompareRequestBody(body: unknown): {
  sourceCode: string;
  candidateCode: string;
} {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ResolverRequestValidationError('Request body must be a JSON object');
  }

  const record = body as Record<string, unknown>;
  return {
    sourceCode: assertNonEmptyString(record.sourceCode, 'sourceCode'),
    candidateCode: assertNonEmptyString(record.candidateCode, 'candidateCode'),
  };
}

export function validateEquivalentsRequestBody(body: unknown): { code: string } {
  return validateIdentifyRequestBody(body);
}
