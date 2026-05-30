import { createHash } from 'crypto';

function stableSortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableSortValue);
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    const sorted: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sorted[key] = stableSortValue(record[key]);
    }
    return sorted;
  }
  return value;
}

export function stableJsonStringify(value: unknown): string {
  return JSON.stringify(stableSortValue(value));
}

export function sha256Checksum(value: unknown): string {
  return createHash('sha256').update(stableJsonStringify(value)).digest('hex');
}

export function payloadByteSize(value: unknown): number {
  return Buffer.byteLength(stableJsonStringify(value), 'utf8');
}
