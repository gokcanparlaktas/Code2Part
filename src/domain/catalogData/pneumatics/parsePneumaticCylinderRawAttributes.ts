import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';

import {
  getPneumaticAppCurrentSeriesCandidates,
  getPneumaticBrandParserSpecs,
  type PneumaticBrandParserSpec,
} from './loadPneumaticCylinderCatalogData';
import {
  expandSmcCp96PrefixOptionBlock,
  expandSmcCp96SuffixBlock,
  tryParseCp96OfficialOrderKey,
} from './tokenizeSmcCp96OptionBlock';
import type { PneumaticRawParsedField, PneumaticRawParseResult } from './types';

type ParserPattern = PneumaticBrandParserSpec['rawPatternCandidates'][number];
type ParserSegment = ParserPattern['segments'][number];

function normalizeForParser(input: string): string {
  return normalizeProductCode(input).replace(/\s+/g, '');
}

function patternMatchPriority(code: string, pattern: ParserPattern): number {
  let score = pattern.pattern.length;
  if (code.startsWith('CP96K') && pattern.pattern.includes('CP96K')) {
    score += 900;
  }
  if (code.startsWith('CP96S') && pattern.pattern.includes('CP96S')) {
    score += 800;
  }
  if (code.startsWith('CP96SDB') && pattern.pattern.includes('CP96SDB')) {
    score += 1000;
  }
  if (code.startsWith('C96SDB') && pattern.pattern.includes('C96SDB')) {
    score += 1000;
  }
  if (code.startsWith('63') && pattern.series === '63') {
    score += 500;
  }
  return score;
}

function parseNumericBore(raw: string): number | undefined {
  const n = Number(raw);
  if (Number.isNaN(n)) {
    return undefined;
  }
  if (raw.length === 3) {
    return n;
  }
  return n;
}

function parseNumericStroke(raw: string, key: string): number | undefined {
  const n = Number(raw);
  if (Number.isNaN(n)) {
    return undefined;
  }
  if (key.includes('4_digit') || raw.length === 4) {
    return n;
  }
  return n;
}

function lookupAppCurrentAlignment(code: string): {
  brand?: string;
  series?: string;
  standardFamily?: string;
} | null {
  const normalized = normalizeForParser(code);
  const catalog = getPneumaticAppCurrentSeriesCandidates();

  for (const entry of catalog.series) {
    for (const prefix of entry.matchPrefixes) {
      if (normalized.startsWith(prefix.toUpperCase())) {
        return {
          brand: entry.brand,
          series: entry.series,
          standardFamily: entry.standardFamily,
        };
      }
    }
  }

  return null;
}

function segmentValue(
  match: RegExpMatchArray,
  segment: ParserSegment
): string | undefined {
  if (segment.rawToken) {
    return segment.rawToken;
  }
  if (segment.captureGroup !== undefined) {
    return match[segment.captureGroup] ?? undefined;
  }
  return undefined;
}

function fieldFromSegment(
  segment: ParserSegment,
  value: string | undefined,
  manufacturer: string
): PneumaticRawParsedField | null {
  if (!value) {
    return null;
  }

  const key = segment.attributeKey;

  if (key === 'bore_mm') {
    const bore = parseNumericBore(value);
    if (bore === undefined) {
      return null;
    }
    return {
      attributeKey: key,
      rawValue: bore,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
    };
  }

  if (key === 'stroke_mm' || key === 'stroke_mm_raw_4_digit') {
    const stroke = parseNumericStroke(value, key);
    if (stroke === undefined) {
      return null;
    }
    return {
      attributeKey: 'stroke_mm',
      rawValue: stroke,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
    };
  }

  if (key === 'series') {
    return {
      attributeKey: key,
      rawToken: value,
      evidence: 'code',
      confidence: 'high',
      requiresCatalogCheck: false,
    };
  }

  return {
    attributeKey: key,
    rawToken: value,
    evidence: 'code',
    confidence: 'medium',
    requiresCatalogCheck: true,
  };
}

function expandSpecialBlocks(
  fields: PneumaticRawParsedField[],
  manufacturer: string,
  series: string
): PneumaticRawParsedField[] {
  const expanded: PneumaticRawParsedField[] = [];

  for (const field of fields) {
    if (
      manufacturer === 'SMC' &&
      (series === 'CP96' || series === 'CP96SD') &&
      field.attributeKey === 'prefix_option_block' &&
      field.rawToken
    ) {
      expanded.push(...expandSmcCp96PrefixOptionBlock(field.rawToken, series));
      continue;
    }

    if (
      manufacturer === 'SMC' &&
      (series === 'CP96' || series === 'CP96SD') &&
      field.attributeKey === 'suffix_block' &&
      field.rawToken
    ) {
      expanded.push(...expandSmcCp96SuffixBlock(field.rawToken, series));
      continue;
    }

    expanded.push(field);
  }

  return expanded;
}

function tryPattern(
  code: string,
  pattern: ParserPattern,
  manufacturer: string
): PneumaticRawParseResult | null {
  const regex = new RegExp(pattern.pattern, 'i');
  const match = code.match(regex);
  if (!match) {
    return null;
  }

  const fields: PneumaticRawParsedField[] = [];
  let boreMm: number | undefined;
  let strokeMm: number | undefined;
  let series = pattern.series;

  for (const segment of pattern.segments) {
    const value = segmentValue(match, segment);
    const field = fieldFromSegment(segment, value, manufacturer);
    if (!field) {
      continue;
    }

    if (field.attributeKey === 'series' && field.rawToken) {
      const token = field.rawToken.toUpperCase();
      if (token.startsWith('CP96')) {
        series = 'CP96';
      } else if (token.startsWith('C96')) {
        series = 'C96';
      } else {
        series = field.rawToken;
      }
    }

    if (field.attributeKey === 'bore_mm' && typeof field.rawValue === 'number') {
      boreMm = field.rawValue;
    }
    if (field.attributeKey === 'stroke_mm' && typeof field.rawValue === 'number') {
      strokeMm = field.rawValue;
    }

    fields.push(field);
  }

  const expanded = expandSpecialBlocks(fields, manufacturer, series);

  return {
    brand: manufacturer,
    series,
    boreMm,
    strokeMm,
    fields: expanded,
    confidence: boreMm !== undefined && strokeMm !== undefined ? 'high' : 'medium',
    requiresCatalogCheck: true,
    matchedPatternId: `${manufacturer}:${pattern.series}:${pattern.pattern}`,
  };
}

function mergeAlignment(
  result: PneumaticRawParseResult,
  alignment: ReturnType<typeof lookupAppCurrentAlignment>
): PneumaticRawParseResult {
  if (!alignment) {
    return result;
  }

  return {
    ...result,
    brand: result.brand ?? alignment.brand,
    series: result.series ?? alignment.series,
    standardFamily: alignment.standardFamily,
    fields: [
      ...(alignment.standardFamily
        ? [
            {
              attributeKey: 'standard_family',
              rawToken: alignment.standardFamily,
              evidence: 'series_table' as const,
              confidence: 'medium' as const,
              requiresCatalogCheck: true,
            },
          ]
        : []),
      ...result.fields,
    ],
  };
}

/**
 * Catalog-data parser: raw attributes only (no canonical/display/UI output).
 */
export function parsePneumaticCylinderRawAttributes(
  inputCode: string
): PneumaticRawParseResult | null {
  const normalized = normalizeForParser(inputCode);
  if (!normalized) {
    return null;
  }

  const alignment = lookupAppCurrentAlignment(normalized);

  if (normalized.startsWith('CP96S') || normalized.startsWith('CP96K')) {
    const cp96Fields = tryParseCp96OfficialOrderKey(normalized);
    if (cp96Fields) {
      const boreField = cp96Fields.find((f) => f.attributeKey === 'bore_mm');
      const strokeField = cp96Fields.find((f) => f.attributeKey === 'stroke_mm');
      return mergeAlignment(
        {
          brand: 'SMC',
          series: 'CP96',
          boreMm: typeof boreField?.rawValue === 'number' ? boreField.rawValue : undefined,
          strokeMm: typeof strokeField?.rawValue === 'number' ? strokeField.rawValue : undefined,
          fields: cp96Fields,
          confidence: 'high',
          requiresCatalogCheck: true,
          matchedPatternId: 'SMC:CP96:official_order_key',
        },
        alignment
      );
    }
  }

  const specs = getPneumaticBrandParserSpecs();

  const patterns: { manufacturer: string; pattern: ParserPattern }[] = [];
  for (const spec of specs) {
    for (const pattern of spec.rawPatternCandidates ?? []) {
      patterns.push({ manufacturer: spec.manufacturer, pattern });
    }
  }

  patterns.sort((a, b) => patternMatchPriority(normalized, b.pattern) - patternMatchPriority(normalized, a.pattern));

  for (const { manufacturer, pattern } of patterns) {
    const result = tryPattern(normalized, pattern, manufacturer);
    if (result) {
      return mergeAlignment(result, alignment);
    }
  }

  if (alignment) {
    return {
      brand: alignment.brand,
      series: alignment.series,
      standardFamily: alignment.standardFamily,
      fields: alignment.standardFamily
        ? [
            {
              attributeKey: 'standard_family',
              rawToken: alignment.standardFamily,
              evidence: 'series_table',
              confidence: 'medium',
              requiresCatalogCheck: true,
            },
          ]
        : [],
      confidence: 'low',
      requiresCatalogCheck: true,
    };
  }

  return null;
}

export function getPneumaticCylinderCategoryKey(): typeof PNEUMATIC_CYLINDER_CATEGORY {
  return PNEUMATIC_CYLINDER_CATEGORY;
}
