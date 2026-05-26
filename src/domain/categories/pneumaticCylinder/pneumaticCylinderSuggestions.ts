import equivalentSeriesData from '@/data/equivalentSeries.json';
import exampleProductCodesData from '@/data/exampleProductCodes.json';
import parsingRulesData from '@/data/parsingRules.json';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

import {
  buildTokenizedQuery,
  collectSeriesPrefixes,
  extractBoreStrokeFromTokens,
  isEligibleTokenQuery,
  scoreProductCodeAgainstTokens,
} from './pneumaticCylinderTokenMatch';
import type { TokenMatchScore } from './pneumaticCylinderTokenMatch';
import { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import type {
  EquivalentGroupRecord,
  ParsingRuleRecord,
  ProductSeriesRecord,
} from '@/types/product';
import type {
  SuggestionConfidence,
  SuggestionMatchedBy,
  SuggestedProduct,
  SuggestionMissingField,
} from '@/types/suggestion';

const parsingRules = parsingRulesData as ParsingRuleRecord[];
const exampleProductCodes = exampleProductCodesData as string[];
const equivalentGroups = equivalentSeriesData as EquivalentGroupRecord[];

export interface SeriesLessPneumaticFragment {
  boreMm: number;
  strokeMm: number;
  optionsSuffix?: string;
}

interface SeriesLessSuggestionBuild {
  series: ProductSeriesRecord;
  seriesKnown: boolean;
  matchedBy: SuggestionMatchedBy;
  score: number;
  boreMm?: number;
  strokeMm?: number;
  exampleCodeFormat: string;
  missingFields: SuggestionMissingField[];
  suggestionTextTr: string;
}

function getSeriesPrefixes(series: ProductSeriesRecord): string[] {
  const prefixes = series.matchPrefixes ?? [series.codePrefix];
  return [...new Set([series.codePrefix, ...prefixes])].sort(
    (a, b) => b.length - a.length
  );
}

export function hasKnownPneumaticSeriesPrefix(
  normalized: string,
  productSeries: ProductSeriesRecord[]
): boolean {
  return productSeries.some((series) => {
    if (series.resolverCategory !== PNEUMATIC_CYLINDER_CATEGORY) {
      return false;
    }
    return getSeriesPrefixes(series).some((prefix) => normalized.startsWith(prefix));
  });
}

export function parseSeriesLessPneumaticFragment(
  normalized: string
): SeriesLessPneumaticFragment | null {
  if (!/^\d+-\d+/.test(normalized)) {
    return null;
  }

  const match = normalized.match(/^(\d+)-(\d+)(?:-(.+))?$/);
  if (!match) {
    return null;
  }

  const boreMm = Number(match[1]);
  const strokeMm = Number(match[2]);
  if (Number.isNaN(boreMm) || Number.isNaN(strokeMm)) {
    return null;
  }

  const optionsSuffix = match[3]?.trim();
  return {
    boreMm,
    strokeMm,
    ...(optionsSuffix ? { optionsSuffix } : {}),
  };
}

export function findExampleCodesContainingFragment(fragment: string): string[] {
  return exampleProductCodes
    .map((code) => normalizeCode(code))
    .filter((code) => code.includes(fragment))
    .sort((a, b) => {
      const aIndex = a.indexOf(fragment);
      const bIndex = b.indexOf(fragment);
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return a.length - b.length;
    });
}

function confidenceFromSeriesLessScore(score: number): SuggestionConfidence {
  if (score >= 75) {
    return 'medium';
  }
  return 'low';
}

export function buildSeriesLessFragmentSuggestionTextTr(options: {
  brand: string;
  series: string;
  seriesKnown: boolean;
  boreMm: number;
  strokeMm: number;
  exampleCodeFormat: string;
  fromExampleCode: boolean;
}): string {
  const dims = `Çap ${options.boreMm} mm ve strok ${options.strokeMm} mm`;
  if (options.fromExampleCode && options.seriesKnown) {
    return (
      `Girilen kod parçası ${options.exampleCodeFormat} örneğiyle uyumlu görünüyor. ` +
      `Seri öneki girilmediği için ${options.brand} ${options.series} eşleşmesi kesin sayılmamalıdır.`
    );
  }
  if (options.seriesKnown) {
    return (
      `Seri öneki girilmedi. ${dims} için ${options.brand} ${options.series} örnek kodu olabilir; ` +
      `seri kesin değildir.`
    );
  }
  return (
    `Seri öneki girilmedi. ${dims} okundu; aşağıdaki örnekler olası pnömatik silindir kodlarıdır. ` +
    `Seri kesin değildir.`
  );
}

function buildSeriesLessSuggestion(
  build: SeriesLessSuggestionBuild
): SuggestedProduct {
  return {
    seriesId: build.series.id,
    brand: build.series.brand,
    series: build.series.series,
    productTypeTr: build.series.productType,
    standardFamily: build.series.standardFamily,
    equivalenceGroup: build.series.equivalenceGroup ?? build.series.equivalenceGroupId ?? '',
    confidence: confidenceFromSeriesLessScore(build.score),
    matchedBy: build.matchedBy,
    detectedAttributes: {
      ...(build.boreMm !== undefined ? { boreMm: build.boreMm } : {}),
      ...(build.strokeMm !== undefined ? { strokeMm: build.strokeMm } : {}),
    },
    missingFields: build.missingFields,
    exampleCodeFormat: build.exampleCodeFormat,
    suggestionTextTr: build.suggestionTextTr,
  };
}

function suggestionsFromExampleCodes(
  normalized: string,
  fragment: SeriesLessPneumaticFragment,
  productSeries: ProductSeriesRecord[]
): SeriesLessSuggestionBuild[] {
  const matchingCodes = findExampleCodesContainingFragment(normalized);
  const builds: SeriesLessSuggestionBuild[] = [];

  for (const exampleCode of matchingCodes) {
    const identification = identifyProduct(exampleCode, exampleCode);
    if (!identification.seriesId) {
      continue;
    }

    const series = productSeries.find((s) => s.id === identification.seriesId);
    if (!series || series.resolverCategory !== PNEUMATIC_CYLINDER_CATEGORY) {
      continue;
    }

    const missingFields = computePneumaticCylinderMissingFields(
      normalized,
      fragment.boreMm,
      fragment.strokeMm
    );

    builds.push({
      series,
      seriesKnown: true,
      matchedBy: 'example_code_contains',
      score: 88,
      boreMm: fragment.boreMm,
      strokeMm: fragment.strokeMm,
      exampleCodeFormat: exampleCode,
      missingFields,
      suggestionTextTr: buildSeriesLessFragmentSuggestionTextTr({
        brand: series.brand,
        series: series.series,
        seriesKnown: true,
        boreMm: fragment.boreMm,
        strokeMm: fragment.strokeMm,
        exampleCodeFormat: exampleCode,
        fromExampleCode: true,
      }),
    });
  }

  return builds;
}

function resolveEquivalenceGroupIds(exampleBuilds: SeriesLessSuggestionBuild[]): string[] {
  const groupIds = new Set<string>();
  for (const build of exampleBuilds) {
    const id = build.series.equivalenceGroupId ?? build.series.equivalenceGroup;
    if (id) {
      groupIds.add(id);
    }
  }
  if (groupIds.size === 0) {
    groupIds.add('pneumatic_iso_15552_cylinder');
  }
  return [...groupIds];
}

function suggestionsFromEquivalenceGroups(
  fragment: SeriesLessPneumaticFragment,
  normalized: string,
  productSeries: ProductSeriesRecord[],
  groupIds: string[],
  existingKeys: Set<string>
): SeriesLessSuggestionBuild[] {
  const builds: SeriesLessSuggestionBuild[] = [];

  for (const groupId of groupIds) {
    const group = equivalentGroups.find((g) => g.id === groupId);
    if (!group) {
      continue;
    }

    for (const seriesId of group.seriesIds) {
      const series = productSeries.find((s) => s.id === seriesId);
      if (!series || series.resolverCategory !== PNEUMATIC_CYLINDER_CATEGORY) {
        continue;
      }

      const exampleCodeFormat = buildPneumaticCylinderExampleCode(
        series,
        fragment.boreMm,
        fragment.strokeMm
      );
      const dedupeKey = `${series.id}:${exampleCodeFormat}`;
      if (existingKeys.has(dedupeKey)) {
        continue;
      }

      builds.push({
        series,
        seriesKnown: false,
        matchedBy: 'dimension_fragment',
        score: 58,
        boreMm: fragment.boreMm,
        strokeMm: fragment.strokeMm,
        exampleCodeFormat,
        missingFields: computePneumaticCylinderMissingFields(
          normalized,
          fragment.boreMm,
          fragment.strokeMm
        ),
        suggestionTextTr: buildSeriesLessFragmentSuggestionTextTr({
          brand: series.brand,
          series: series.series,
          seriesKnown: false,
          boreMm: fragment.boreMm,
          strokeMm: fragment.strokeMm,
          exampleCodeFormat,
          fromExampleCode: false,
        }),
      });
    }
  }

  return builds;
}

const TOKEN_SUGGESTION_MAX = 8;

export function buildTokenMatchSuggestionTextTr(
  exampleCode: string,
  brand: string,
  series: string
): string {
  return (
    `Bu kod parçaları ${exampleCode} (${brand} ${series}) ile eşleşiyor olabilir. ` +
    'Seri kesin değilse teknik değerleri kontrol edin.'
  );
}

function confidenceFromTokenScore(score: number): SuggestionConfidence {
  if (score >= 75) {
    return 'medium';
  }
  return 'low';
}

export function suggestTokenMatchedPneumaticCylinders(
  rawInput: string,
  productSeries: ProductSeriesRecord[],
  limit = TOKEN_SUGGESTION_MAX
): SuggestedProduct[] {
  const query = buildTokenizedQuery(rawInput);
  if (!isEligibleTokenQuery(query.tokens)) {
    return [];
  }

  const seriesPrefixes = collectSeriesPrefixes(
    productSeries.filter((s) => s.resolverCategory === PNEUMATIC_CYLINDER_CATEGORY)
  );

  const scored = exampleProductCodes
    .map((code) => {
      const normalizedCode = normalizeCode(code);
      const match = scoreProductCodeAgainstTokens(normalizedCode, query, seriesPrefixes);
      if (!match) {
        return null;
      }
      return { code: normalizedCode, match };
    })
    .filter((entry): entry is { code: string; match: TokenMatchScore } => entry !== null)
    .sort((a, b) => b.match.score - a.match.score);

  const builds: SeriesLessSuggestionBuild[] = [];
  const seen = new Set<string>();

  for (const { code, match } of scored) {
    if (builds.length >= limit) {
      break;
    }

    const identification = identifyProduct(code, code);
    if (!identification.seriesId) {
      continue;
    }

    const series = productSeries.find((s) => s.id === identification.seriesId);
    if (!series || series.resolverCategory !== PNEUMATIC_CYLINDER_CATEGORY) {
      continue;
    }

    const dedupeKey = `${series.id}:${code}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    const dims = extractBoreStrokeFromTokens(query.tokens);
    const boreMm = identification.bore.value ?? dims.boreMm ?? match.boreMm;
    const strokeMm = identification.stroke.value ?? dims.strokeMm ?? match.strokeMm;

    builds.push({
      series,
      seriesKnown: match.seriesTokenMatched || identification.outcome === 'full',
      matchedBy: 'token_match',
      score: match.score,
      boreMm: boreMm ?? undefined,
      strokeMm: strokeMm ?? undefined,
      exampleCodeFormat: code,
      missingFields: computePneumaticCylinderMissingFields(
        query.compact,
        boreMm ?? undefined,
        strokeMm ?? undefined
      ),
      suggestionTextTr: buildTokenMatchSuggestionTextTr(code, series.brand, series.series),
    });
  }

  return builds
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((build) => ({
      ...buildSeriesLessSuggestion(build),
      confidence: confidenceFromTokenScore(build.score),
      matchedBy: 'token_match' as const,
      suggestionTextTr: build.suggestionTextTr,
    }));
}

export function suggestSeriesLessPneumaticCylinders(
  normalized: string,
  productSeries: ProductSeriesRecord[],
  limit = 5
): SuggestedProduct[] {
  if (hasKnownPneumaticSeriesPrefix(normalized, productSeries)) {
    return [];
  }

  const fragment = parseSeriesLessPneumaticFragment(normalized);
  if (!fragment) {
    return [];
  }

  const exampleBuilds = suggestionsFromExampleCodes(normalized, fragment, productSeries);
  const existingKeys = new Set(
    exampleBuilds.map((b) => `${b.series.id}:${b.exampleCodeFormat}`)
  );

  const groupIds = resolveEquivalenceGroupIds(exampleBuilds);
  const dimensionBuilds = suggestionsFromEquivalenceGroups(
    fragment,
    normalized,
    productSeries,
    groupIds,
    existingKeys
  );

  const allBuilds = [...exampleBuilds, ...dimensionBuilds]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return allBuilds.map(buildSeriesLessSuggestion);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

export function detectPneumaticCylinderPartialDimensions(
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

export function buildPneumaticCylinderExampleCode(
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

export function computePneumaticCylinderMissingFields(
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

export function buildPneumaticCylinderSuggestionTextTr(
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
