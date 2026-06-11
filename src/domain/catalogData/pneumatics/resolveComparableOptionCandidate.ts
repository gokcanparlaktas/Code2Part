import { getPneumaticComparableOptionCandidates } from './loadPneumaticCylinderCatalogData';
import type {
  PneumaticComparableOptionContext,
  PneumaticComparableOptionResolved,
} from './types';

const CUSHIONING_ATTRIBUTE_KEYS = new Set([
  'cushioning',
  'cushioning_type',
  'cushioning_token',
]);

const MAGNET_ATTRIBUTE_KEYS = new Set(['magnet_sensor_capability']);

const MOUNTING_ATTRIBUTE_KEYS = new Set([
  'mounting_style',
  'head_cover_or_mounting_style',
]);

const ACTION_ATTRIBUTE_KEYS = new Set(['action', 'action_and_cushioning']);

function normalizeBrand(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeSeries(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeToken(value: string): string {
  return value.trim().toUpperCase();
}

function attributeKeysMatch(entryKey: string, contextKey: string): boolean {
  if (entryKey === contextKey) {
    return true;
  }

  if (CUSHIONING_ATTRIBUTE_KEYS.has(entryKey) && CUSHIONING_ATTRIBUTE_KEYS.has(contextKey)) {
    return true;
  }

  if (MAGNET_ATTRIBUTE_KEYS.has(entryKey) && MAGNET_ATTRIBUTE_KEYS.has(contextKey)) {
    return true;
  }

  if (MOUNTING_ATTRIBUTE_KEYS.has(entryKey) && MOUNTING_ATTRIBUTE_KEYS.has(contextKey)) {
    return true;
  }

  if (ACTION_ATTRIBUTE_KEYS.has(entryKey) && ACTION_ATTRIBUTE_KEYS.has(contextKey)) {
    return true;
  }

  return false;
}

function notFound(
  context: PneumaticComparableOptionContext
): PneumaticComparableOptionResolved {
  return {
    found: false,
    attributeKey: context.attributeKey,
    rawToken: context.rawToken,
    confidence: 'unknown',
    needsReview: true,
    evidence: 'catalog_data',
  };
}

/**
 * Context-aware comparable option lookup. Never resolves by rawToken alone.
 */
export function resolveComparableOptionCandidate(
  context: PneumaticComparableOptionContext
): PneumaticComparableOptionResolved {
  const catalog = getPneumaticComparableOptionCandidates();
  const brand = normalizeBrand(context.brand);
  const series = normalizeSeries(context.series);
  const token = normalizeToken(context.rawToken);
  const attributeKey = context.attributeKey;

  const matches = catalog.entries.filter((entry) => {
    if (normalizeBrand(entry.brand) !== brand) {
      return false;
    }

    const entrySeries = normalizeSeries(entry.series);
    if (entrySeries !== series && !series.startsWith(entrySeries)) {
      if (!(entrySeries.includes('/') && series.startsWith(entrySeries.split('/')[0]))) {
        return false;
      }
    }

    if (normalizeToken(entry.rawToken) !== token) {
      return false;
    }

    if (!attributeKeysMatch(entry.attributeKey, attributeKey)) {
      return false;
    }

    if (!tokenPositionMatches(entry, context)) {
      return false;
    }

    if (
      entry.sourceStatus === 'source_backed_candidate_position_sensitive' &&
      context.tokenPosition &&
      entry.attributeKey !== context.tokenPosition &&
      entry.attributeKey !== attributeKey
    ) {
      return false;
    }

    return true;
  });

  if (matches.length === 0) {
    return notFound(context);
  }

  if (matches.length > 1 && context.tokenPosition) {
    const positionMatch = matches.find((m) =>
      tokenPositionMatches(m, context)
    );
    if (positionMatch) {
      return toResolved(positionMatch, context);
    }
  }

  return toResolved(matches[0], context);
}

type ComparableEntry = ReturnType<
  typeof getPneumaticComparableOptionCandidates
>['entries'][number] & { tokenPosition?: string };

function entryTokenPosition(entry: ComparableEntry): string | undefined {
  return entry.tokenPosition;
}

function tokenPositionMatches(
  entry: ComparableEntry,
  context: PneumaticComparableOptionContext
): boolean {
  if (!context.tokenPosition) {
    return true;
  }
  const entryPosition = entryTokenPosition(entry);
  if (!entryPosition) {
    return true;
  }
  return entryPosition === context.tokenPosition;
}

function toResolved(
  entry: ComparableEntry,
  context: PneumaticComparableOptionContext
): PneumaticComparableOptionResolved {
  return {
    found: true,
    attributeKey: context.attributeKey,
    rawToken: context.rawToken,
    candidateMeaning: entry.candidateMeaning,
    comparisonAttributeKey: entry.attributeKey,
    confidence: (entry.confidence as PneumaticComparableOptionResolved['confidence']) ?? 'medium',
    needsReview: entry.needsReview ?? true,
    sourceStatus: entry.sourceStatus,
    evidence: 'catalog_data',
  };
}

/**
 * Parker P1D N token must be resolved with position-sensitive attributeKey.
 * Global N lookup without brand/series/position returns not found.
 */
export function resolveParkerP1DToken(
  rawToken: string,
  attributeKey: string,
  brand = 'Parker',
  series = 'P1D'
): PneumaticComparableOptionResolved {
  return resolveComparableOptionCandidate({
    brand,
    series,
    attributeKey,
    rawToken,
    tokenPosition: attributeKey,
  });
}
