/**
 * Firestore rejects `undefined` anywhere in a document. Envelopes may omit optional
 * fields (e.g. `familyId` on shared/index docs) as `undefined` in TypeScript.
 *
 * Array behavior: elements strictly equal to `undefined` are removed. Firestore has
 * no undefined scalar; dropping sparse holes keeps arrays aligned with intent.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}

export function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) {
      continue;
    }
    result[key] = sanitizeForFirestore(entry);
  }
  return result as T;
}

export function findUndefinedFirestorePaths(value: unknown, path = ''): string[] {
  if (value === undefined) {
    return [path || '(root)'];
  }

  if (value === null || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    const paths: string[] = [];
    value.forEach((item, index) => {
      const childPath = path ? `${path}[${index}]` : `[${index}]`;
      paths.push(...findUndefinedFirestorePaths(item, childPath));
    });
    return paths;
  }

  if (!isPlainObject(value)) {
    return [];
  }

  const paths: string[] = [];
  for (const [key, entry] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    paths.push(...findUndefinedFirestorePaths(entry, childPath));
  }
  return paths;
}

export function assertNoUndefinedFirestoreValues(value: unknown, context?: string): void {
  const paths = findUndefinedFirestorePaths(value);
  if (paths.length === 0) {
    return;
  }

  const prefix = context ? `${context}: ` : '';
  throw new Error(
    `${prefix}Firestore payload contains undefined at ${paths.join(', ')}`
  );
}
