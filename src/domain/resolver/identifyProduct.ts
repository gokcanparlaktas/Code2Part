import equivalentSeriesData from '@/data/equivalentSeries.json';
import parsingRulesData from '@/data/parsingRules.json';
import productSeriesData from '@/data/productSeries.json';
import type {
  ConfidenceLevel,
  ParsingRuleRecord,
  ProductIdentification,
  ProductSeriesRecord,
  TechnicalAttribute,
} from '@/types/product';

const productSeries = productSeriesData as ProductSeriesRecord[];
const parsingRules = parsingRulesData as ParsingRuleRecord[];

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

function findSeriesByCode(normalizedCode: string): ProductSeriesRecord | null {
  const sorted = [...productSeries].sort(
    (a, b) => b.codePrefix.length - a.codePrefix.length
  );
  return (
    sorted.find((series) => normalizedCode.startsWith(series.codePrefix)) ??
    null
  );
}

function parseDimensions(
  normalizedCode: string,
  seriesId: string
): { bore: TechnicalAttribute<number>; stroke: TechnicalAttribute<number> } {
  const rule = parsingRules.find((r) => r.seriesId === seriesId);
  if (!rule) {
    return { bore: unknownAttribute(), stroke: unknownAttribute() };
  }

  const regex = new RegExp(rule.pattern);
  const match = normalizedCode.match(regex);
  if (!match) {
    return { bore: unknownAttribute(), stroke: unknownAttribute() };
  }

  const boreValue = Number(match[rule.boreGroup]);
  const strokeValue = Number(match[rule.strokeGroup]);

  if (Number.isNaN(boreValue) || Number.isNaN(strokeValue)) {
    return { bore: unknownAttribute(), stroke: unknownAttribute() };
  }

  return {
    bore: attributeFromCode(boreValue, 'mm'),
    stroke: attributeFromCode(strokeValue, 'mm'),
  };
}

function resolveConfidence(
  series: ProductSeriesRecord,
  bore: TechnicalAttribute<number>,
  stroke: TechnicalAttribute<number>
): ConfidenceLevel {
  if (bore.evidence === 'code' && stroke.evidence === 'code') {
    return series.confidenceWhenMatched;
  }
  if (bore.requiresCheck || stroke.requiresCheck) {
    return 'low';
  }
  return 'medium';
}

export function identifyProduct(
  inputCode: string,
  normalizedCode: string
): ProductIdentification {
  const series = findSeriesByCode(normalizedCode);

  if (!series) {
    return {
      inputCode,
      normalizedCode,
      seriesId: null,
      matched: false,
      brand: unknownAttribute(),
      series: unknownAttribute(),
      productType: unknownAttribute(),
      standardFamily: unknownAttribute(),
      bore: unknownAttribute(),
      stroke: unknownAttribute(),
      confidence: 'unknown',
    };
  }

  const { bore, stroke } = parseDimensions(normalizedCode, series.id);

  return {
    inputCode,
    normalizedCode,
    seriesId: series.id,
    matched: true,
    brand: attributeFromSeries(series.brand),
    series: attributeFromSeries(series.series),
    productType: attributeFromSeries(series.productType),
    standardFamily: {
      value: series.standardFamily,
      evidence: 'standard',
      requiresCheck: false,
    },
    bore,
    stroke,
    confidence: resolveConfidence(series, bore, stroke),
  };
}

export function buildSuggestedEquivalentCode(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): string | null {
  if (
    source.bore.value === null ||
    source.stroke.value === null ||
    source.bore.requiresCheck ||
    source.stroke.requiresCheck
  ) {
    return null;
  }
  return `${targetSeries.codePrefix}-${source.bore.value}-${source.stroke.value}`;
}

export function getProductSeriesById(id: string): ProductSeriesRecord | undefined {
  return productSeries.find((s) => s.id === id);
}

export function getAllProductSeries(): ProductSeriesRecord[] {
  return productSeries;
}

export function getEquivalentGroups() {
  return equivalentSeriesData;
}
