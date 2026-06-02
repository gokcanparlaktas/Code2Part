import { parseHydraulicValveAttributes, canFullyParseHydraulicProductCode } from '@/domain/categories/hydraulicValve/hydraulicValveIdentify';
import { getLegacyParsingRules } from '@/domain/catalog/adapters/catalogV2Adapter';
import { calculateProductReliability } from '@/domain/reliability/calculateProductReliability';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type {
  ConfidenceLevel,
  IdentificationOutcome,
  ProductIdentification,
  ProductSeriesRecord,
  TechnicalAttribute,
} from '@/types/product';

import { findExactExampleCodeMatch } from './exactExampleCodeMatch';
import { getAllProductSeries } from './productSeriesCatalog';
import { normalizeCode } from './normalizeCode';

function attributeFromSeries<T extends string | number>(
  value: T,
  evidence: TechnicalAttribute<T>['evidence'] = 'series_table'
): TechnicalAttribute<T> {
  return { value, evidence, requiresCheck: false };
}

function unknownAttribute<T extends string | number>(): TechnicalAttribute<T> {
  return { value: null, evidence: 'unknown', requiresCheck: true };
}

function attributeFromCode<T extends string | number>(
  value: T,
  unit?: string
): TechnicalAttribute<T> {
  return { value, unit, evidence: 'code', requiresCheck: false };
}

function getSeriesPrefixes(series: ProductSeriesRecord): string[] {
  const prefixes = series.matchPrefixes ?? [series.codePrefix];
  return [...new Set([series.codePrefix, ...prefixes])].sort(
    (a, b) => b.length - a.length
  );
}

function findSeriesByCode(normalizedCode: string): ProductSeriesRecord | null {
  if (!normalizedCode) {
    return null;
  }

  if (/^3WE4/i.test(normalizedCode)) {
    return null;
  }

  const candidates = getAllProductSeries()
    .flatMap((series) =>
      getSeriesPrefixes(series).map((prefix) => ({ series, prefix }))
    )
    .sort((a, b) => b.prefix.length - a.prefix.length);

  const match = candidates.find(({ prefix }) => normalizedCode.startsWith(prefix));
  return match?.series ?? null;
}

function hasParserRule(seriesId: string): boolean {
  return getLegacyParsingRules().some((rule) => rule.seriesId === seriesId);
}

function parseDimensions(
  normalizedCode: string,
  seriesId: string
): { bore: TechnicalAttribute<number>; stroke: TechnicalAttribute<number>; parsed: boolean } {
  const rules = getLegacyParsingRules().filter((r) => r.seriesId === seriesId);

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern);
    const match = normalizedCode.match(regex);
    if (!match) {
      continue;
    }

    const boreValue = Number(match[rule.boreGroup]);
    const strokeValue = Number(match[rule.strokeGroup]);

    if (Number.isNaN(boreValue) || Number.isNaN(strokeValue)) {
      continue;
    }

    return {
      bore: attributeFromCode(boreValue, 'mm'),
      stroke: attributeFromCode(strokeValue, 'mm'),
      parsed: true,
    };
  }

  return { bore: unknownAttribute(), stroke: unknownAttribute(), parsed: false };
}

function resolveConfidence(
  series: ProductSeriesRecord,
  bore: TechnicalAttribute<number>,
  stroke: TechnicalAttribute<number>,
  parsed: boolean
): ConfidenceLevel {
  if (!parsed) {
    return 'unknown';
  }
  if (bore.evidence === 'code' && stroke.evidence === 'code') {
    return series.confidenceWhenMatched;
  }
  if (bore.requiresCheck || stroke.requiresCheck) {
    return 'low';
  }
  return 'medium';
}

function resolveOutcome(
  series: ProductSeriesRecord | null,
  parsed: boolean
): IdentificationOutcome {
  if (!series) {
    return 'not_found';
  }
  if (!hasParserRule(series.id) || !parsed) {
    return 'series_only';
  }
  return 'full';
}

function emptyIdentification(
  inputCode: string,
  normalizedCode: string
): ProductIdentification {
  return {
    inputCode,
    normalizedCode,
    seriesId: null,
    resolverCategoryKey: null,
    matched: false,
    outcome: 'not_found',
    brand: unknownAttribute(),
    series: unknownAttribute(),
    productType: unknownAttribute(),
    productCategory: unknownAttribute(),
    standardFamily: unknownAttribute(),
    bore: unknownAttribute(),
    stroke: unknownAttribute(),
    confidence: 'unknown',
  };
}

function identifyHydraulicValveProduct(
  inputCode: string,
  normalizedCode: string,
  series: ProductSeriesRecord,
  options?: { forceFullIdentification?: boolean }
): ProductIdentification {
  const hydraulicAttrs = parseHydraulicValveAttributes(normalizedCode, series);
  const fullyParsedByGrammar = canFullyParseHydraulicProductCode(inputCode, series);
  const outcome =
    options?.forceFullIdentification || fullyParsedByGrammar ? 'full' : 'series_only';

  const identification: ProductIdentification = {
    inputCode,
    normalizedCode,
    seriesId: series.id,
    resolverCategoryKey: HYDRAULIC_VALVE_CATEGORY,
    matched: true,
    outcome,
    brand: attributeFromSeries(series.brand),
    series: attributeFromSeries(series.series),
    productType: attributeFromSeries(series.productType),
    productCategory: attributeFromSeries(series.productCategory),
    standardFamily: {
      value: series.standardFamily,
      evidence: 'standard',
      requiresCheck: false,
    },
    bore: unknownAttribute(),
    stroke: unknownAttribute(),
    cetopNgSize: hydraulicAttrs.cetopNgSize,
    valveCoilVoltage: hydraulicAttrs.valveCoilVoltage,
    valveSpoolFunction: hydraulicAttrs.valveSpoolFunction,
    confidence: 'unknown',
  };

  const reliability = calculateProductReliability(identification);
  identification.confidence =
    options?.forceFullIdentification || fullyParsedByGrammar ? 'high' : reliability.confidence;
  return identification;
}

function identifyFromExactExample(
  inputCode: string,
  canonicalNormalized: string,
  series: ProductSeriesRecord
): ProductIdentification {
  if (series.resolverCategory === HYDRAULIC_VALVE_CATEGORY) {
    return identifyHydraulicValveProduct(inputCode, canonicalNormalized, series, {
      forceFullIdentification: true,
    });
  }

  const { bore, stroke, parsed } = parseDimensions(canonicalNormalized, series.id);

  return {
    inputCode,
    normalizedCode: canonicalNormalized,
    seriesId: series.id,
    resolverCategoryKey: series.resolverCategory,
    matched: true,
    outcome: 'full',
    brand: attributeFromSeries(series.brand),
    series: attributeFromSeries(series.series),
    productType: attributeFromSeries(series.productType),
    productCategory: attributeFromSeries(series.productCategory),
    standardFamily: {
      value: series.standardFamily,
      evidence: 'standard',
      requiresCheck: false,
    },
    bore: parsed ? bore : unknownAttribute(),
    stroke: parsed ? stroke : unknownAttribute(),
    confidence: parsed ? series.confidenceWhenMatched : 'high',
  };
}

export function identifyProduct(
  inputCode: string,
  normalizedCode: string
): ProductIdentification {
  const exactExample = findExactExampleCodeMatch(normalizedCode);
  if (exactExample) {
    const canonicalNormalized = normalizeCode(exactExample);
    const series = findSeriesByCode(canonicalNormalized);
    if (series) {
      return identifyFromExactExample(inputCode, canonicalNormalized, series);
    }
  }

  const series = findSeriesByCode(normalizedCode);

  if (!series) {
    return emptyIdentification(inputCode, normalizedCode);
  }

  if (series.resolverCategory === HYDRAULIC_VALVE_CATEGORY) {
    return identifyHydraulicValveProduct(inputCode, normalizedCode, series);
  }

  const { bore, stroke, parsed } = parseDimensions(normalizedCode, series.id);
  const outcome = resolveOutcome(series, parsed);

  return {
    inputCode,
    normalizedCode,
    seriesId: series.id,
    resolverCategoryKey: series.resolverCategory,
    matched: outcome !== 'not_found',
    outcome,
    brand: attributeFromSeries(series.brand),
    series: attributeFromSeries(series.series),
    productType: attributeFromSeries(series.productType),
    productCategory: attributeFromSeries(series.productCategory),
    standardFamily: {
      value: series.standardFamily,
      evidence: 'standard',
      requiresCheck: false,
    },
    bore,
    stroke,
    confidence: resolveConfidence(series, bore, stroke, parsed),
  };
}

export {
  getAllProductSeries,
  getEquivalentGroups,
  getProductSeriesById,
} from './productSeriesCatalog';
