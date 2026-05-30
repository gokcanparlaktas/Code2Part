const ENCODED_SEGMENT_SEPARATOR = '__';

/** Rejects keys that would not round-trip through encode/decode. */
export function assertValidCatalogDocumentKey(documentKey: string): void {
  if (!documentKey.trim()) {
    throw new Error('documentKey must not be empty');
  }
  if (documentKey.includes(ENCODED_SEGMENT_SEPARATOR)) {
    throw new Error(
      `documentKey must not contain "${ENCODED_SEGMENT_SEPARATOR}": ${documentKey}`
    );
  }
  if (documentKey.includes('\\')) {
    throw new Error(`documentKey must use forward slashes only: ${documentKey}`);
  }
}

/** Relative path without extension → Firestore-safe document id. */
export function encodeCatalogDocumentId(documentKey: string): string {
  assertValidCatalogDocumentKey(documentKey);
  return documentKey.split('/').join(ENCODED_SEGMENT_SEPARATOR);
}

export function decodeCatalogDocumentId(encodedDocumentId: string): string {
  if (!encodedDocumentId.trim()) {
    throw new Error('encodedDocumentId must not be empty');
  }
  if (encodedDocumentId.includes('/')) {
    throw new Error(
      `encodedDocumentId must not contain "/": ${encodedDocumentId}`
    );
  }
  return encodedDocumentId.split(ENCODED_SEGMENT_SEPARATOR).join('/');
}

export function documentKeyFromRelativePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized.endsWith('.json')) {
    throw new Error(`relativePath must end with .json: ${relativePath}`);
  }
  return normalized.slice(0, -'.json'.length);
}

export function relativePathFromDocumentKey(documentKey: string): string {
  return `${documentKey}.json`;
}
