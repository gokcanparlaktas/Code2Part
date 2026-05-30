export const FORBIDDEN_BACKEND_RESPONSE_KEYS = [
  'payload',
  'entries',
  'checksumSha256',
  'encodedDocumentId',
  'relativePath',
  'documentKey',
  'catalogVersion',
  'catalogEvidence',
  'portState',
  'rawToken',
  'sourcePath',
  'firestorePath',
  'serviceAccount',
  'spoolSymbolMeanings',
  'voltageTokenMeanings',
  'sourceTextSnippet',
] as const;

export type ForbiddenBackendResponseKey = (typeof FORBIDDEN_BACKEND_RESPONSE_KEYS)[number];

export function collectSerializedObjectKeys(value: unknown): string[] {
  const keys: string[] = [];

  if (value === null || typeof value !== 'object') {
    return keys;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      keys.push(...collectSerializedObjectKeys(item));
    }
    return keys;
  }

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    keys.push(key);
    keys.push(...collectSerializedObjectKeys(entry));
  }

  return keys;
}

export function findForbiddenBackendResponseKeys(value: unknown): ForbiddenBackendResponseKey[] {
  const forbidden = new Set<string>(FORBIDDEN_BACKEND_RESPONSE_KEYS);
  const found = new Set<ForbiddenBackendResponseKey>();

  for (const key of collectSerializedObjectKeys(value)) {
    if (forbidden.has(key)) {
      found.add(key as ForbiddenBackendResponseKey);
    }
  }

  return [...found];
}

export function assertNoForbiddenBackendResponseKeys(value: unknown): void {
  const forbiddenKeys = findForbiddenBackendResponseKeys(value);
  if (forbiddenKeys.length > 0) {
    throw new Error(
      `Backend response contains forbidden keys: ${forbiddenKeys.join(', ')}`
    );
  }
}
