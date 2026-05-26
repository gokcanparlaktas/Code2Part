import type { CatalogCodePattern } from '@/types/catalog';

import { extractBoreStrokeFromPatterns } from './catalogPatternMatching';

/** Normalize product code for token scanning (display form). */
export function normalizeProductCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '-');
}

export function normalizeVoltage(label?: string | null): string | null {
  if (!label) {
    return null;
  }
  const trimmed = label.trim();
  if (/24\s*V\s*DC/i.test(trimmed)) {
    return '24V DC';
  }
  return trimmed.replace(/\s+/g, ' ').trim();
}

export function normalizeBore(value: number): number {
  return value;
}

export function normalizeStroke(value: number): number {
  return value;
}

export function normalizeFunctionToken(token: string): string {
  return token.trim().toUpperCase();
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Isolated fallback bore/stroke patterns when catalog rules do not match. */
export const FALLBACK_BORE_STROKE_PATTERNS: CatalogCodePattern[] = [
  {
    id: 'fallback-bore-stroke-x',
    kind: 'bore_stroke',
    pattern: '(\\d{1,3})X(\\d{1,4})',
    boreGroup: 1,
    strokeGroup: 2,
  },
  {
    id: 'fallback-bore-stroke-dash',
    kind: 'bore_stroke',
    pattern: '-(\\d{1,3})-(\\d{1,4})(?:-|$)',
    boreGroup: 1,
    strokeGroup: 2,
  },
  {
    id: 'fallback-bore-stroke-compact',
    kind: 'bore_stroke',
    pattern: '^[A-Z]+(\\d{1,3})-(\\d{1,4})[A-Z]*$',
    boreGroup: 1,
    strokeGroup: 2,
  },
  {
    id: 'fallback-bore-stroke-sms',
    kind: 'bore_stroke',
    pattern: 'S(\\d{2,3})MS-(\\d{2,4})',
    boreGroup: 1,
    strokeGroup: 2,
  },
  {
    id: 'fallback-bore-stroke-tail',
    kind: 'bore_stroke',
    pattern: '(\\d{1,3})-(\\d{1,4})$',
    boreGroup: 1,
    strokeGroup: 2,
  },
];

/** Fallback bore/stroke when catalog parsing rules do not match. */
export function extractBoreStrokeFallback(
  normalizedCode: string,
  patterns: CatalogCodePattern[] = FALLBACK_BORE_STROKE_PATTERNS
): {
  boreMm?: number;
  strokeMm?: number;
} {
  return extractBoreStrokeFromPatterns(normalizedCode, patterns);
}
