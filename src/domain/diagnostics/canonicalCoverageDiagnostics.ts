import { extractTechnicalAttributeResults } from '@/domain/attributes/extractors/extractTechnicalAttributes';
import { getAllCatalogExampleCodes } from '@/domain/catalog/adapters/catalogV2Adapter';
import {
  isCanonicallyResolvedField,
  resolveCanonicalAttribute,
} from '@/domain/canonical/resolveCanonicalAttribute';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import type { ProductResolverCategory } from '@/types/category';
import type { CanonicalResolvedField } from '@/types/canonicalAttribute';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

export type CanonicalCoverageMissingReason =
  | 'unknown_canonical'
  | 'catalog_check_required'
  | 'missing_mapping';

export type CanonicalCoverageDiagnostics = {
  totalCheckedCodes: number;
  totalParsedAttributes: number;
  resolvedAttributes: number;
  unresolvedAttributes: number;
  requiresCatalogCheckCount: number;
  coveragePercent: number;

  byCategory: Array<{
    category: string;
    total: number;
    resolved: number;
    unresolved: number;
    coveragePercent: number;
  }>;

  byManufacturer: Array<{
    manufacturer: string;
    total: number;
    resolved: number;
    unresolved: number;
    coveragePercent: number;
  }>;

  bySeries: Array<{
    series: string;
    manufacturer?: string;
    category?: string;
    total: number;
    resolved: number;
    unresolved: number;
    coveragePercent: number;
  }>;

  missingMappings: Array<{
    category: string;
    manufacturer?: string;
    series?: string;
    attributeKey: string;
    rawToken?: string;
    exampleCode?: string;
    reason: CanonicalCoverageMissingReason;
  }>;

  topMissingAttributeKeys: Array<{
    attributeKey: string;
    count: number;
  }>;
};

type GroupBucket = {
  total: number;
  resolved: number;
  unresolved: number;
};

const SKIP_PARSER_ATTRIBUTE_KEYS = new Set([
  'bore',
  'stroke',
  'series',
  'manufacturer',
  'standard_family',
  'parse_warning',
  'unsupported_category',
]);

function percent(resolved: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((resolved / total) * 1000) / 10;
}

function bumpBucket(bucket: GroupBucket, resolved: boolean): void {
  bucket.total += 1;
  if (resolved) {
    bucket.resolved += 1;
  } else {
    bucket.unresolved += 1;
  }
}

function toGroupedRows(
  map: Map<string, GroupBucket>,
  labelKey: 'category' | 'manufacturer' | 'series',
  extra?: (key: string) => Partial<CanonicalCoverageDiagnostics['bySeries'][number]>,
): Array<{
  total: number;
  resolved: number;
  unresolved: number;
  coveragePercent: number;
} & Record<string, string | undefined>> {
  return [...map.entries()]
    .map(([key, bucket]) => ({
      [labelKey]: key,
      ...(extra?.(key) ?? {}),
      total: bucket.total,
      resolved: bucket.resolved,
      unresolved: bucket.unresolved,
      coveragePercent: percent(bucket.resolved, bucket.total),
    }))
    .sort((a, b) => b.unresolved - a.unresolved || b.total - a.total);
}

function readParserRawToken(attr: TechnicalAttributeResult): string | undefined {
  if (attr.sourceToken?.trim()) {
    return attr.sourceToken.trim();
  }
  if (attr.value === null || attr.value === undefined) {
    return undefined;
  }
  return String(attr.value).trim();
}

function shouldEvaluateParserAttribute(attr: TechnicalAttributeResult): boolean {
  if (SKIP_PARSER_ATTRIBUTE_KEYS.has(attr.key)) {
    return false;
  }
  if (attr.evidence !== 'code' && attr.evidence !== 'inferred') {
    return false;
  }
  return Boolean(readParserRawToken(attr));
}

export { isCanonicallyResolvedField } from '@/domain/canonical/resolveCanonicalAttribute';

function classifyCoverageOutcome(resolved: CanonicalResolvedField): {
  isResolved: boolean;
  missingReason?: CanonicalCoverageMissingReason;
} {
  const isResolved = isCanonicallyResolvedField(resolved);

  if (isResolved) {
    return { isResolved: true };
  }

  if (!resolved.resolved) {
    return { isResolved: false, missingReason: 'missing_mapping' };
  }

  return { isResolved: false, missingReason: 'unknown_canonical' };
}

function collectParserAttributesForDiagnostics(
  inputCode: string,
  seriesId: string | null,
  category: ProductResolverCategory | null,
): TechnicalAttributeResult[] {
  if (!category || !seriesId) {
    return [];
  }

  return extractTechnicalAttributeResults({
    inputCode,
    seriesId,
    resolverCategoryKey: category,
  }).filter(shouldEvaluateParserAttribute);
}

export function buildCanonicalCoverageDiagnostics(): CanonicalCoverageDiagnostics {
  const exampleCodes = getAllCatalogExampleCodes();

  const byCategory = new Map<string, GroupBucket>();
  const byManufacturer = new Map<string, GroupBucket>();
  const bySeries = new Map<string, GroupBucket & { manufacturer?: string; category?: string }>();

  const missingMappings: CanonicalCoverageDiagnostics['missingMappings'] = [];
  const missingKeyCounts = new Map<string, number>();

  let totalCheckedCodes = 0;
  let totalParsedAttributes = 0;
  let resolvedAttributes = 0;
  let unresolvedAttributes = 0;
  let requiresCatalogCheckCount = 0;

  for (const exampleCode of exampleCodes) {
    const normalized = normalizeCode(exampleCode);
    const identification = identifyProduct(exampleCode, normalized);

    if (identification.outcome !== 'full' || !identification.resolverCategoryKey) {
      continue;
    }

    totalCheckedCodes += 1;

    const category = identification.resolverCategoryKey;
    const manufacturer = identification.brand.value ?? 'Bilinmiyor';
    const series = identification.series.value ?? 'Bilinmiyor';
    const seriesKey = `${manufacturer}::${series}`;

    if (!byCategory.has(category)) {
      byCategory.set(category, { total: 0, resolved: 0, unresolved: 0 });
    }
    if (!byManufacturer.has(manufacturer)) {
      byManufacturer.set(manufacturer, { total: 0, resolved: 0, unresolved: 0 });
    }
    if (!bySeries.has(seriesKey)) {
      bySeries.set(seriesKey, {
        total: 0,
        resolved: 0,
        unresolved: 0,
        manufacturer,
        category,
      });
    }

    const parserAttributes = collectParserAttributesForDiagnostics(
      exampleCode,
      identification.seriesId,
      category,
    );

    for (const attr of parserAttributes) {
      const rawToken = readParserRawToken(attr);
      if (!rawToken) {
        continue;
      }

      totalParsedAttributes += 1;

      const resolved = resolveCanonicalAttribute({
        category,
        manufacturer,
        series,
        attributeKey: attr.key,
        rawToken,
        evidence: attr.evidence,
        confidence: attr.confidence,
      });

      const outcome = classifyCoverageOutcome(resolved);

      bumpBucket(byCategory.get(category)!, outcome.isResolved);
      bumpBucket(byManufacturer.get(manufacturer)!, outcome.isResolved);
      bumpBucket(bySeries.get(seriesKey)!, outcome.isResolved);

      if (outcome.isResolved) {
        resolvedAttributes += 1;
        if (resolved.requiresCatalogCheck) {
          requiresCatalogCheckCount += 1;
        }
      } else {
        unresolvedAttributes += 1;
        if (outcome.missingReason) {
          missingMappings.push({
            category,
            manufacturer,
            series,
            attributeKey: attr.key,
            rawToken,
            exampleCode,
            reason: outcome.missingReason,
          });
          missingKeyCounts.set(attr.key, (missingKeyCounts.get(attr.key) ?? 0) + 1);
        }
      }
    }
  }

  const topMissingAttributeKeys = [...missingKeyCounts.entries()]
    .map(([attributeKey, count]) => ({ attributeKey, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCheckedCodes,
    totalParsedAttributes,
    resolvedAttributes,
    unresolvedAttributes,
    requiresCatalogCheckCount,
    coveragePercent: percent(resolvedAttributes, totalParsedAttributes),
    byCategory: toGroupedRows(byCategory, 'category') as CanonicalCoverageDiagnostics['byCategory'],
    byManufacturer: toGroupedRows(
      byManufacturer,
      'manufacturer',
    ) as CanonicalCoverageDiagnostics['byManufacturer'],
    bySeries: toGroupedRows(bySeries, 'series', (key) => {
      const bucket = bySeries.get(key)!;
      return { manufacturer: bucket.manufacturer, category: bucket.category };
    }) as CanonicalCoverageDiagnostics['bySeries'],
    missingMappings,
    topMissingAttributeKeys,
  };
}
