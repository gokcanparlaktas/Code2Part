import hydraulicValveSeriesData from '@/data/hydraulicValveSeries.json';
import productSeriesData from '@/data/productSeries.json';
import { suggestHydraulicValveProducts } from '@/domain/categories/hydraulicValve/hydraulicValveSuggestions';
import {
  buildPneumaticCylinderExampleCode,
  buildPneumaticCylinderSuggestionTextTr,
  computePneumaticCylinderMissingFields,
  detectPneumaticCylinderPartialDimensions,
  suggestSeriesLessPneumaticCylinders,
  suggestTokenMatchedPneumaticCylinders,
} from '@/domain/categories/pneumaticCylinder/pneumaticCylinderSuggestions';
import { isEligibleTokenQuery, tokenizeForMatching } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderTokenMatch';
import { HYDRAULIC_VALVE_CATEGORY, PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import { identifyProduct } from './identifyProduct';
import { normalizeCode } from './normalizeCode';
import type { ProductSeriesRecord } from '@/types/product';
import type {
  SuggestionConfidence,
  SuggestionMatchedBy,
  SuggestedProduct,
} from '@/types/suggestion';

const productSeries = [
  ...(productSeriesData as ProductSeriesRecord[]),
  ...(hydraulicValveSeriesData as ProductSeriesRecord[]),
];

const BRAND_ALIASES: { brand: string; aliases: string[] }[] = [
  { brand: 'Festo', aliases: ['FESTO'] },
  { brand: 'SMC', aliases: ['SMC'] },
  { brand: 'Parker', aliases: ['PARKER'] },
  { brand: 'Aventics', aliases: ['AVENTICS'] },
  { brand: 'AirTAC', aliases: ['AIRTAC', 'AIRTEC'] },
];

interface MatchCandidate {
  series: ProductSeriesRecord;
  matchedBy: SuggestionMatchedBy;
  score: number;
  boreMm?: number;
  strokeMm?: number;
}

function getSeriesPrefixes(series: ProductSeriesRecord): string[] {
  const prefixes = series.matchPrefixes ?? [series.codePrefix];
  return [...new Set([series.codePrefix, ...prefixes])].sort(
    (a, b) => b.length - a.length
  );
}

function confidenceFromScore(
  score: number,
  series: ProductSeriesRecord
): SuggestionConfidence {
  const cappedScore = series.resolverCategory === HYDRAULIC_VALVE_CATEGORY ? Math.min(score, 79) : score;
  if (cappedScore >= 80) {
    return 'high';
  }
  if (cappedScore >= 55) {
    return 'medium';
  }
  return 'low';
}

function detectPartialDimensions(
  normalized: string,
  series: ProductSeriesRecord,
  prefix: string
): { boreMm?: number; strokeMm?: number } {
  if (series.resolverCategory === PNEUMATIC_CYLINDER_CATEGORY) {
    return detectPneumaticCylinderPartialDimensions(normalized, series, prefix);
  }
  return {};
}

function buildExampleCode(
  series: ProductSeriesRecord,
  boreMm?: number,
  strokeMm?: number
): string {
  if (series.resolverCategory === PNEUMATIC_CYLINDER_CATEGORY) {
    return buildPneumaticCylinderExampleCode(series, boreMm, strokeMm);
  }
  return series.codePrefix;
}

function computeMissingFields(
  normalized: string,
  series: ProductSeriesRecord,
  boreMm?: number,
  strokeMm?: number
) {
  if (series.resolverCategory === PNEUMATIC_CYLINDER_CATEGORY) {
    return computePneumaticCylinderMissingFields(normalized, boreMm, strokeMm);
  }
  return [];
}

function buildSuggestionTextTr(
  series: ProductSeriesRecord,
  boreMm?: number,
  strokeMm?: number,
  missingFields: ReturnType<typeof computeMissingFields> = []
): string {
  if (series.resolverCategory === PNEUMATIC_CYLINDER_CATEGORY) {
    return buildPneumaticCylinderSuggestionTextTr(
      series.brand,
      series.series,
      boreMm,
      strokeMm,
      missingFields
    );
  }
  return `Bu kod ${series.brand} ${series.series} serisine ait olabilir.`;
}

function matchSeriesPrefix(normalized: string, series: ProductSeriesRecord): MatchCandidate | null {
  for (const prefix of getSeriesPrefixes(series)) {
    if (normalized === prefix) {
      return { series, matchedBy: 'series_prefix', score: 92 };
    }
    if (normalized.startsWith(prefix)) {
      const dims = detectPartialDimensions(normalized, series, prefix);
      return {
        series,
        matchedBy: dims.boreMm !== undefined ? 'partial_regex' : 'series_prefix',
        score: dims.boreMm !== undefined ? 85 : 88,
        boreMm: dims.boreMm,
        strokeMm: dims.strokeMm,
      };
    }
    if (prefix.startsWith(normalized) && normalized.length >= 2) {
      return { series, matchedBy: 'series_prefix', score: 82 };
    }
  }
  return null;
}

function matchBrandAlias(normalized: string, series: ProductSeriesRecord): MatchCandidate | null {
  const entry = BRAND_ALIASES.find((b) => b.brand === series.brand);
  if (!entry) {
    return null;
  }
  const matched = entry.aliases.some(
    (alias) => normalized === alias || normalized.startsWith(alias)
  );
  if (!matched) {
    return null;
  }
  return { series, matchedBy: 'brand_alias', score: 58 };
}

function matchContains(normalized: string, series: ProductSeriesRecord): MatchCandidate | null {
  const seriesKey = series.series.toUpperCase();
  const brandKey = series.brand.toUpperCase().replace(/\s/g, '');

  if (seriesKey.length >= 4 && normalized.includes(seriesKey)) {
    return { series, matchedBy: 'contains', score: 42 };
  }
  if (brandKey.length >= 4 && normalized.includes(brandKey)) {
    return { series, matchedBy: 'contains', score: 40 };
  }
  return null;
}

function toSuggestedProduct(candidate: MatchCandidate, normalized: string): SuggestedProduct {
  const { series, matchedBy, score, boreMm, strokeMm } = candidate;
  const missingFields = computeMissingFields(normalized, series, boreMm, strokeMm);

  return {
    seriesId: series.id,
    brand: series.brand,
    series: series.series,
    productTypeTr: series.productType,
    standardFamily: series.standardFamily,
    equivalenceGroup: series.equivalenceGroup ?? series.equivalenceGroupId ?? '',
    confidence: confidenceFromScore(score, series),
    matchedBy,
    detectedAttributes: {
      ...(boreMm !== undefined ? { boreMm } : {}),
      ...(strokeMm !== undefined ? { strokeMm } : {}),
    },
    missingFields,
    exampleCodeFormat: buildExampleCode(series, boreMm, strokeMm),
    suggestionTextTr: buildSuggestionTextTr(series, boreMm, strokeMm, missingFields),
  };
}

function suggestionSortScore(suggestion: SuggestedProduct): number {
  const confidenceWeight = { high: 300, medium: 200, low: 100 };
  const matchedByWeight: Record<SuggestedProduct['matchedBy'], number> = {
    example_code_contains: 90,
    token_match: 85,
    series_prefix: 80,
    partial_regex: 75,
    dimension_fragment: 55,
    brand_alias: 40,
    contains: 30,
  };
  return confidenceWeight[suggestion.confidence] + (matchedByWeight[suggestion.matchedBy] ?? 0);
}

export function suggestProducts(rawInput: string, limit = 5): SuggestedProduct[] {
  const normalized = normalizeCode(rawInput);
  const queryTokens = tokenizeForMatching(rawInput);
  const tokenEligible = isEligibleTokenQuery(queryTokens);

  if (normalized.length < 2 && !tokenEligible) {
    return [];
  }

  const identification = identifyProduct(rawInput, normalized);
  if (identification.outcome === 'full') {
    return [];
  }

  const bestBySeries = new Map<string, MatchCandidate>();

  for (const series of productSeries) {
    const candidates = [
      matchSeriesPrefix(normalized, series),
      matchBrandAlias(normalized, series),
      matchContains(normalized, series),
    ].filter((c): c is MatchCandidate => c !== null);

    for (const candidate of candidates) {
      const existing = bestBySeries.get(series.id);
      if (!existing || candidate.score > existing.score) {
        bestBySeries.set(series.id, candidate);
      }
    }
  }

  const prefixSuggestions = [...bestBySeries.values()]
    .sort((a, b) => b.score - a.score)
    .map((candidate) => toSuggestedProduct(candidate, normalized));

  const seriesLessSuggestions = suggestSeriesLessPneumaticCylinders(
    normalized,
    productSeries,
    limit
  );

  const tokenSuggestions = suggestTokenMatchedPneumaticCylinders(
    rawInput,
    productSeries,
    Math.max(limit, 8)
  );

  const hydraulicSuggestions = suggestHydraulicValveProducts(
    rawInput,
    productSeries,
    Math.max(limit, 8)
  );

  const merged = new Map<string, SuggestedProduct>();

  for (const suggestion of [
    ...hydraulicSuggestions,
    ...tokenSuggestions,
    ...seriesLessSuggestions,
    ...prefixSuggestions,
  ]) {
    const key = `${suggestion.seriesId}:${suggestion.exampleCodeFormat}`;
    const existing = merged.get(key);
    if (!existing || suggestionSortScore(suggestion) > suggestionSortScore(existing)) {
      merged.set(key, suggestion);
    }
  }

  return [...merged.values()]
    .sort((a, b) => suggestionSortScore(b) - suggestionSortScore(a))
    .slice(0, limit);
}
