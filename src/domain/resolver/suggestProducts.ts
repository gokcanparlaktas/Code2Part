import parsingRulesData from '@/data/parsingRules.json';
import productSeriesData from '@/data/productSeries.json';
import { identifyProduct } from './identifyProduct';
import { normalizeCode } from './normalizeCode';
import type {
  ParsingRuleRecord,
  ProductSeriesRecord,
} from '@/types/product';
import type {
  SuggestionConfidence,
  SuggestionMatchedBy,
  SuggestedProduct,
  SuggestionMissingField,
} from '@/types/suggestion';

const productSeries = productSeriesData as ProductSeriesRecord[];
const parsingRules = parsingRulesData as ParsingRuleRecord[];

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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSeriesPrefixes(series: ProductSeriesRecord): string[] {
  const prefixes = series.matchPrefixes ?? [series.codePrefix];
  return [...new Set([series.codePrefix, ...prefixes])].sort(
    (a, b) => b.length - a.length
  );
}

function confidenceFromScore(score: number): SuggestionConfidence {
  if (score >= 80) {
    return 'high';
  }
  if (score >= 55) {
    return 'medium';
  }
  return 'low';
}

function tryFullParserMatch(
  normalized: string,
  seriesId: string
): { boreMm?: number; strokeMm?: number } | null {
  const rules = parsingRules.filter((r) => r.seriesId === seriesId);
  for (const rule of rules) {
    const match = normalized.match(new RegExp(rule.pattern));
    if (!match) {
      continue;
    }
    const bore = Number(match[rule.boreGroup]);
    const stroke = Number(match[rule.strokeGroup]);
    if (!Number.isNaN(bore) && !Number.isNaN(stroke)) {
      return { boreMm: bore, strokeMm: stroke };
    }
  }
  return null;
}

function tryPartialDimensionParse(
  normalized: string,
  series: ProductSeriesRecord,
  prefix: string
): { boreMm?: number; strokeMm?: number } {
  const full = tryFullParserMatch(normalized, series.id);
  if (full) {
    return full;
  }

  const escaped = escapeRegex(prefix);

  const patterns = [
    new RegExp(`^${escaped}-(\\d+)-(\\d+)`),
    new RegExp(`^${escaped}-(\\d+)$`),
    new RegExp(`^${escaped}(\\d+)X(\\d+)$`, 'i'),
    new RegExp(`^${escaped}(\\d+)X(\\d+)?$`, 'i'),
    new RegExp(`^${escaped}(\\d+)$`, 'i'),
    new RegExp(`^${escaped}B(\\d+)-(\\d+)D?$`, 'i'),
    new RegExp(`^${escaped}B(\\d+)$`, 'i'),
    new RegExp(`^${escaped}N(\\d+)-(\\d+)$`, 'i'),
    new RegExp(`^${escaped}S(\\d{3})MS-(\\d+)$`, 'i'),
    new RegExp(`^${escaped}S(\\d{3})MS$`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) {
      continue;
    }
    const bore = match[1] ? Number(match[1]) : undefined;
    const stroke = match[2] ? Number(match[2]) : undefined;
    const result: { boreMm?: number; strokeMm?: number } = {};
    if (bore !== undefined && !Number.isNaN(bore)) {
      result.boreMm = bore;
    }
    if (stroke !== undefined && !Number.isNaN(stroke)) {
      result.strokeMm = stroke;
    }
    if (result.boreMm !== undefined || result.strokeMm !== undefined) {
      return result;
    }
  }

  return {};
}

function matchSeriesPrefix(normalized: string, series: ProductSeriesRecord): MatchCandidate | null {
  for (const prefix of getSeriesPrefixes(series)) {
    if (normalized === prefix) {
      return { series, matchedBy: 'series_prefix', score: 92 };
    }
    if (normalized.startsWith(prefix)) {
      const dims = tryPartialDimensionParse(normalized, series, prefix);
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

function buildExampleCode(
  series: ProductSeriesRecord,
  boreMm?: number,
  strokeMm?: number
): string {
  const prefix = series.codePrefix;
  const template = series.suggestedCodeTemplate ?? '{prefix}-{bore}-{stroke}';

  if (boreMm !== undefined && strokeMm !== undefined) {
    return template
      .replace(/\{bore\}/g, String(boreMm))
      .replace(/\{stroke\}/g, String(strokeMm))
      .replace(/\{prefix\}/g, prefix);
  }
  if (boreMm !== undefined) {
    if (template.includes('{bore}')) {
      return template
        .replace(/\{bore\}/g, String(boreMm))
        .replace(/\{stroke\}/g, '')
        .replace(/\{prefix\}/g, prefix)
        .replace(/--/g, '-')
        .replace(/-$/, '');
    }
    return `${prefix}-${boreMm}`;
  }
  return prefix;
}

function computeMissingFields(
  normalized: string,
  boreMm?: number,
  strokeMm?: number
): SuggestionMissingField[] {
  const missing: SuggestionMissingField[] = [];
  if (boreMm === undefined) {
    missing.push('bore');
  }
  if (strokeMm === undefined) {
    missing.push('stroke');
  }
  if (normalized.includes('-') && missing.length > 0) {
    missing.push('options');
  }
  return missing;
}

function buildSuggestionTextTr(
  brand: string,
  series: string,
  boreMm?: number,
  strokeMm?: number,
  missingFields: SuggestionMissingField[] = []
): string {
  const base = `Bu kod ${brand} ${series} serisine ait olabilir.`;

  if (boreMm !== undefined && missingFields.includes('stroke')) {
    return `${base} Çap ${boreMm} mm olarak algılandı, strok bilgisi eksik.`;
  }
  if (missingFields.includes('bore') && missingFields.includes('stroke')) {
    return `${base} Çap ve strok bilgisi eksik görünüyor.`;
  }
  if (missingFields.length > 0) {
    return `${base} Bazı teknik alanlar henüz tam okunamadı.`;
  }
  return `${base} Kod yapısı bu seriyle uyumlu görünüyor.`;
}

function toSuggestedProduct(candidate: MatchCandidate, normalized: string): SuggestedProduct {
  const { series, matchedBy, score, boreMm, strokeMm } = candidate;
  const missingFields = computeMissingFields(normalized, boreMm, strokeMm);

  return {
    seriesId: series.id,
    brand: series.brand,
    series: series.series,
    productTypeTr: series.productType,
    standardFamily: series.standardFamily,
    equivalenceGroup: series.equivalenceGroup ?? series.equivalenceGroupId ?? '',
    confidence: confidenceFromScore(score),
    matchedBy,
    detectedAttributes: {
      ...(boreMm !== undefined ? { boreMm } : {}),
      ...(strokeMm !== undefined ? { strokeMm } : {}),
    },
    missingFields,
    exampleCodeFormat: buildExampleCode(series, boreMm, strokeMm),
    suggestionTextTr: buildSuggestionTextTr(
      series.brand,
      series.series,
      boreMm,
      strokeMm,
      missingFields
    ),
  };
}

export function suggestProducts(rawInput: string, limit = 5): SuggestedProduct[] {
  const normalized = normalizeCode(rawInput);
  if (normalized.length < 2) {
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

  return [...bestBySeries.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((candidate) => toSuggestedProduct(candidate, normalized));
}
