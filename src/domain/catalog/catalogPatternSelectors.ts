import type {
  CatalogCodePattern,
  CatalogCodePatternKind,
  CatalogKnownToken,
  CatalogParsingRule,
  CatalogSeries,
  CatalogSeriesCodePatterns,
  CatalogVoltageCode,
} from '@/types/catalog';

import { getCatalogSeriesById } from './adapters/catalogV2Adapter';

function patternsFromParsingRules(series: CatalogSeries): CatalogCodePattern[] {
  return (series.parsingRules ?? []).map((rule) => parsingRuleToBoreStrokePattern(rule));
}

function parsingRuleToBoreStrokePattern(rule: CatalogParsingRule): CatalogCodePattern {
  return {
    id: rule.id,
    kind: 'bore_stroke',
    pattern: rule.pattern,
    boreGroup: rule.boreGroup,
    strokeGroup: rule.strokeGroup,
    confidence: 'high',
  };
}

function getCodePatterns(series: CatalogSeries | undefined): CatalogSeriesCodePatterns {
  return series?.codePatterns ?? {};
}

export function getParsingRulesForSeries(seriesId: string): CatalogParsingRule[] {
  return getCatalogSeriesById(seriesId)?.parsingRules ?? [];
}

export function getCodePatternsForSeries(
  seriesId: string,
  kind: CatalogCodePatternKind
): CatalogCodePattern[] {
  const series = getCatalogSeriesById(seriesId);
  if (!series) {
    return [];
  }

  const grouped = getCodePatterns(series);
  switch (kind) {
    case 'bore_stroke':
      return [
        ...patternsFromParsingRules(series),
        ...(grouped.boreStroke ?? []),
      ];
    case 'connector':
      return grouped.connector ?? [];
    case 'revision':
      return grouped.revision ?? [];
    case 'function_token':
      return grouped.functionToken ?? [];
    case 'inferred_voltage':
      return grouped.inferredVoltage ?? [];
    default:
      return [];
  }
}

export function getBoreStrokeFallbackPatternsForSeries(seriesId: string): CatalogCodePattern[] {
  const series = getCatalogSeriesById(seriesId);
  return series?.codePatterns?.boreStrokeFallback ?? [];
}

export function getKnownTokensForSeries(seriesId: string): CatalogKnownToken[] {
  return getCatalogSeriesById(seriesId)?.knownTokens ?? [];
}

export function getVoltageCodesForSeries(seriesId: string): CatalogVoltageCode[] {
  return getCatalogSeriesById(seriesId)?.voltageCodes ?? [];
}

export function getComparisonProfileRef(seriesId: string): string | undefined {
  return getCatalogSeriesById(seriesId)?.comparisonProfileRef;
}
