/** Firestore document paths must have an even number of path segments (collection/doc/...). */

export function firestorePathSegments(documentPath: string): string[] {
  return documentPath
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function isValidFirestoreDocumentPath(documentPath: string): boolean {
  const segments = firestorePathSegments(documentPath);
  return segments.length > 0 && segments.length % 2 === 0;
}

export function assertValidFirestoreDocumentPath(documentPath: string): void {
  const segments = firestorePathSegments(documentPath);
  if (segments.length === 0) {
    throw new Error('Firestore document path must not be empty');
  }
  if (segments.length % 2 !== 0) {
    throw new Error(
      `Firestore document path must have an even number of segments (${segments.length}): ${documentPath}`
    );
  }
}

export function buildValidatedFirestoreDocumentPath(segments: string[]): string {
  const path = segments.join('/');
  assertValidFirestoreDocumentPath(path);
  return path;
}
