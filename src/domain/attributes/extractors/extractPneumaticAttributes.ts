import { getCatalogSeriesById } from '@/domain/catalog/adapters/catalogV2Adapter';
import {
  getBoreStrokeFallbackPatternsForSeries,
  getCodePatternsForSeries,
  getKnownTokensForSeries,
} from '@/domain/catalog/catalogPatternSelectors';
import { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import type { CatalogKnownToken, CatalogSeries } from '@/types/catalog';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import { enrichPneumaticAttributesFromCatalogData } from '@/domain/catalogData/pneumatics/pneumaticCatalogDataBridge';
import { parsePneumaticCylinderRawAttributes } from '@/domain/catalogData/pneumatics/parsePneumaticCylinderRawAttributes';

import {
  attributeDefLabel,
  buildAttributeResult,
  catalogConfidenceToAttribute,
} from './attributeEvidence';
import { PARSER_KEYS } from './parserFieldKeys';
import { extractBoreStrokeFromPatterns } from './catalogPatternMatching';
import {
  extractBoreStrokeFallback,
  FALLBACK_BORE_STROKE_PATTERNS,
  normalizeBore,
  normalizeProductCode,
  normalizeStroke,
} from './attributeNormalization';

export interface ExtractPneumaticAttributesOptions {
  inputCode: string;
  seriesId?: string | null;
}

function splitCodeTokens(normalized: string): string[] {
  return normalized
    .split(/[-/\\]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function findKnownTokensInCode(
  normalized: string,
  knownTokens: CatalogKnownToken[]
): CatalogKnownToken[] {
  const parts = splitCodeTokens(normalized);
  const withoutPrefix = parts.slice(1);
  const found: CatalogKnownToken[] = [];

  for (const known of knownTokens) {
    if (withoutPrefix.includes(known.token)) {
      found.push(known);
      continue;
    }
    if (known.token.length > 1 && normalized.includes(known.token)) {
      found.push(known);
    }
  }

  if (normalized.includes('SDB')) {
    const sdb = knownTokens.find((k) => k.token === 'SDB');
    if (sdb && !found.includes(sdb)) {
      found.push(sdb);
    }
  }

  const suffixMatch = normalized.match(/-(\d{1,4})([A-Z]{1,3})$/);
  if (suffixMatch?.[2]) {
    const suffixToken = knownTokens.find((k) => k.token === suffixMatch[2]);
    if (suffixToken && !found.includes(suffixToken)) {
      found.push(suffixToken);
    }
  }

  return found;
}

export function extractPneumaticAttributes(
  options: ExtractPneumaticAttributesOptions
): TechnicalAttributeResult[] {
  const normalized = normalizeProductCode(options.inputCode);
  const series = options.seriesId ? getCatalogSeriesById(options.seriesId) : undefined;
  const results: TechnicalAttributeResult[] = [];

  if (series) {
    results.push(
      buildAttributeResult({
        key: 'series',
        label: attributeDefLabel(series.attributes, 'series', 'Seri'),
        value: series.series,
        evidence: 'series_table',
        confidence: 'medium',
        category: PNEUMATIC_CYLINDER_CATEGORY,
      }),
      buildAttributeResult({
        key: 'standard_family',
        label: attributeDefLabel(series.attributes, 'standard_family', 'Standart'),
        value: series.standardFamily,
        evidence: 'series_table',
        confidence: 'medium',
        category: PNEUMATIC_CYLINDER_CATEGORY,
      })
    );
  }

  const catalogParsed = parsePneumaticCylinderRawAttributes(options.inputCode);

  const fromRules = series
    ? extractBoreStrokeFromPatterns(
        normalized,
        getCodePatternsForSeries(series.id, 'bore_stroke')
      )
    : {};
  const catalogFallbackPatterns = series
    ? getBoreStrokeFallbackPatternsForSeries(series.id)
    : [];
  const fallbackPatterns =
    catalogFallbackPatterns.length > 0
      ? catalogFallbackPatterns
      : FALLBACK_BORE_STROKE_PATTERNS;
  const fallback = extractBoreStrokeFallback(normalized, fallbackPatterns);
  const boreMm = fromRules.boreMm ?? catalogParsed?.boreMm ?? fallback.boreMm;
  const strokeMm = fromRules.strokeMm ?? catalogParsed?.strokeMm ?? fallback.strokeMm;

  results.push(
    buildAttributeResult({
      key: 'bore',
      label: series ? attributeDefLabel(series.attributes, 'bore', 'Çap') : 'Çap',
      value: boreMm !== undefined ? normalizeBore(boreMm) : null,
      normalizedValue: boreMm ?? null,
      unit: boreMm !== undefined ? 'mm' : undefined,
      evidence: boreMm !== undefined ? 'code' : 'unknown',
      confidence: boreMm !== undefined ? 'high' : 'unknown',
      category: PNEUMATIC_CYLINDER_CATEGORY,
      note: boreMm === undefined ? 'Koddan net çap (bore) okunamadı.' : undefined,
    }),
    buildAttributeResult({
      key: 'stroke',
      label: series ? attributeDefLabel(series.attributes, 'stroke', 'Strok') : 'Strok',
      value: strokeMm !== undefined ? normalizeStroke(strokeMm) : null,
      normalizedValue: strokeMm ?? null,
      unit: strokeMm !== undefined ? 'mm' : undefined,
      evidence: strokeMm !== undefined ? 'code' : 'unknown',
      confidence: strokeMm !== undefined ? 'high' : 'unknown',
      category: PNEUMATIC_CYLINDER_CATEGORY,
      note: strokeMm === undefined ? 'Koddan net strok (stroke) okunamadı.' : undefined,
    })
  );

  const knownMatched = findKnownTokensInCode(
    normalized,
    series ? getKnownTokensForSeries(series.id) : []
  );
  const cushioning = knownMatched.find((k) => k.role === 'cushioning');
  if (cushioning) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.cushioning_type,
        label: 'Sönümleme kodu',
        value: cushioning.token,
        evidence: 'code',
        confidence: catalogConfidenceToAttribute(cushioning.confidence),
        requiresCatalogCheck: cushioning.requiresCatalogCheck,
        sourceToken: cushioning.token,
        category: PNEUMATIC_CYLINDER_CATEGORY,
      })
    );
  }

  for (const known of knownMatched.filter(
    (k) => k.role === 'options' || k.role === 'sensor'
  )) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.variant_code,
        label: 'Varyant kodu',
        value: known.token,
        evidence: 'code',
        confidence: catalogConfidenceToAttribute(known.confidence),
        requiresCatalogCheck: known.requiresCatalogCheck,
        sourceToken: known.token,
        category: PNEUMATIC_CYLINDER_CATEGORY,
      })
    );
  }

  return enrichPneumaticAttributesFromCatalogData({
    inputCode: options.inputCode,
    brand: series?.brand,
    series: series?.series,
    existing: results,
  });
}
