import { getCatalogSeriesById } from '@/domain/catalog/adapters/catalogV2Adapter';
import {
  getBoreStrokeFallbackPatternsForSeries,
  getCodePatternsForSeries,
  getKnownTokensForSeries,
} from '@/domain/catalog/catalogPatternSelectors';
import { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import type { CatalogKnownToken, CatalogSeries } from '@/types/catalog';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import {
  attributeDefLabel,
  buildAttributeResult,
  catalogConfidenceToAttribute,
  knownTokenNote,
} from './attributeEvidence';
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
  const boreMm = fromRules.boreMm ?? fallback.boreMm;
  const strokeMm = fromRules.strokeMm ?? fallback.strokeMm;

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
        key: 'cushioning_token',
        label: 'Sönümleme',
        value: cushioning.token,
        evidence: 'code',
        confidence: catalogConfidenceToAttribute(cushioning.confidence),
        requiresCatalogCheck: cushioning.requiresCatalogCheck,
        sourceToken: cushioning.token,
        category: PNEUMATIC_CYLINDER_CATEGORY,
        note: knownTokenNote(cushioning),
      })
    );
  }

  const optionTokens = knownMatched
    .filter((k) => k.role === 'options' || k.role === 'sensor')
    .map((k) => k.token);

  if (optionTokens.length > 0) {
    results.push(
      buildAttributeResult({
        key: 'options',
        label: 'Varyant / opsiyonlar',
        value: optionTokens.join(', '),
        evidence: 'code',
        confidence: 'low',
        requiresCatalogCheck: true,
        sourceToken: optionTokens.join(','),
        category: PNEUMATIC_CYLINDER_CATEGORY,
        note: 'Bu bilgiler koddan algılandı. Teknik anlamları seriye göre değişebilir.',
      })
    );
  }

  return results;
}
