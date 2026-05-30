import checkRulesV2Data from '@/data/catalog/checkRules.v2.json';
import equivalenceGroupsV2Data from '@/data/catalog/equivalenceGroups.v2.json';
import functionMappingsV2Data from '@/data/catalog/hydraulicFunctionMappings.v2.json';
import productSeriesV2Data from '@/data/catalog/productSeries.v2.json';
import type { CanonicalValveFunctionId } from '@/domain/categories/hydraulicValve/functionMappings/canonicalValveFunctions';
import type { HydraulicFunctionAlias } from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionAliases';
import type {
  CatalogCheckRule,
  CatalogEquivalenceGroup,
  CatalogFunctionMapping,
  CatalogSeries,
  CatalogV2Bundle,
} from '@/types/catalog';
import type {
  EquivalentGroupRecord,
  ParsingRuleRecord,
  ProductSeriesRecord,
} from '@/types/product';

const catalogV2: CatalogV2Bundle = {
  productSeries: productSeriesV2Data as CatalogSeries[],
  equivalenceGroups: equivalenceGroupsV2Data as CatalogEquivalenceGroup[],
  functionMappings: functionMappingsV2Data as CatalogFunctionMapping[],
  checkRules: checkRulesV2Data as CatalogCheckRule[],
};

const seriesById = new Map(catalogV2.productSeries.map((s) => [s.id, s]));
const checkRuleById = new Map(catalogV2.checkRules.map((r) => [r.id, r]));
const functionMappingById = new Map(catalogV2.functionMappings.map((m) => [m.id, m]));

let legacyProductSeriesCache: ProductSeriesRecord[] | null = null;
let legacyParsingRulesCache: ParsingRuleRecord[] | null = null;

export function getCatalogV2Bundle(): CatalogV2Bundle {
  return catalogV2;
}

export function getCatalogSeriesById(id: string): CatalogSeries | undefined {
  return seriesById.get(id);
}

export function getAllCatalogSeries(): CatalogSeries[] {
  return catalogV2.productSeries;
}

export function getCatalogEquivalenceGroups(): CatalogEquivalenceGroup[] {
  return catalogV2.equivalenceGroups;
}

export function getCatalogFunctionMappings(): CatalogFunctionMapping[] {
  return catalogV2.functionMappings;
}

export function getCatalogCheckRules(): CatalogCheckRule[] {
  return catalogV2.checkRules;
}

export function getCatalogCheckRuleById(id: string): CatalogCheckRule | undefined {
  return checkRuleById.get(id);
}

export function getCatalogCheckRulesForSeries(seriesId: string): CatalogCheckRule[] {
  const series = seriesById.get(seriesId);
  if (!series) {
    return [];
  }
  return series.checkRuleRefs
    .map((ref) => checkRuleById.get(ref.ruleId))
    .filter((rule): rule is CatalogCheckRule => rule !== undefined);
}

export function getCatalogFunctionMappingsForSeries(
  seriesId: string
): CatalogFunctionMapping[] {
  const series = seriesById.get(seriesId);
  if (!series) {
    return [];
  }

  const seen = new Set<string>();
  const mappings: CatalogFunctionMapping[] = [];

  const add = (mapping: CatalogFunctionMapping | undefined) => {
    if (!mapping || seen.has(mapping.id)) {
      return;
    }
    seen.add(mapping.id);
    mappings.push(mapping);
  };

  for (const ref of series.functionMappingRefs ?? []) {
    add(functionMappingById.get(ref.mappingId));
  }

  for (const mapping of catalogV2.functionMappings) {
    const family = mapping.seriesFamily;
    if (
      series.series.startsWith(family) ||
      series.codePrefix.startsWith(family) ||
      series.matchPrefixes.some((prefix) => prefix.startsWith(family))
    ) {
      add(mapping);
    }
  }

  return mappings;
}

export function getHydraulicFunctionAliasesFromCatalog(): HydraulicFunctionAlias[] {
  return catalogV2.functionMappings.map((mapping) => ({
    manufacturer: mapping.manufacturer,
    series: mapping.seriesFamily,
    token: mapping.token,
    canonicalFunctionId: mapping.canonicalFunctionId as CanonicalValveFunctionId,
    confidence: mapping.confidence,
    requiresCatalogCheck: mapping.requiresCatalogCheck,
    note: mapping.noteTr,
  }));
}

export function toProductSeriesRecord(series: CatalogSeries): ProductSeriesRecord {
  return {
    verificationStatus: series.verificationStatus,
    sourceType: series.sourceType,
    sourceUrl: series.sourceUrl,
    lastReviewedAt: series.lastReviewedAt,
    notesTr: series.notesTr,
    id: series.id,
    brand: series.brand,
    series: series.series,
    technology: series.technology,
    resolverCategory: series.resolverCategory,
    category: series.category,
    equivalenceGroup: series.equivalenceGroupId,
    productType: series.productTypeLabel,
    productCategory: series.productCategoryLabel,
    standardFamily: series.standardFamily,
    codePrefix: series.codePrefix,
    matchPrefixes: series.matchPrefixes,
    suggestedCodeTemplate: series.suggestedCodeTemplate,
    confidenceWhenMatched: series.confidenceWhenMatched,
    equivalenceGroupId: series.equivalenceGroupId,
    cetopNgLabel: series.cetopNgLabel,
    defaultCoilVoltageTr: series.defaultCoilVoltageTr,
    exampleProductCodes: series.exampleCodes,
  };
}

export function getLegacyProductSeries(): ProductSeriesRecord[] {
  if (!legacyProductSeriesCache) {
    legacyProductSeriesCache = catalogV2.productSeries.map(toProductSeriesRecord);
  }
  return legacyProductSeriesCache;
}

export function getLegacyProductSeriesById(id: string): ProductSeriesRecord | undefined {
  const series = seriesById.get(id);
  return series ? toProductSeriesRecord(series) : undefined;
}

export function getLegacyEquivalentGroups(): EquivalentGroupRecord[] {
  return catalogV2.equivalenceGroups.map((group) => ({
    verificationStatus: group.verificationStatus,
    sourceType: group.sourceType,
    sourceUrl: group.sourceUrl,
    lastReviewedAt: group.lastReviewedAt,
    notesTr: group.notesTr,
    id: group.id,
    name: group.name,
    seriesIds: group.seriesIds,
  }));
}

export function getLegacyParsingRules(): ParsingRuleRecord[] {
  if (!legacyParsingRulesCache) {
    legacyParsingRulesCache = catalogV2.productSeries.flatMap((series) =>
      (series.parsingRules ?? []).map((rule) => ({
        verificationStatus: series.verificationStatus,
        sourceType: series.sourceType,
        sourceUrl: series.sourceUrl,
        lastReviewedAt: series.lastReviewedAt,
        notesTr: series.notesTr,
        id: rule.id,
        seriesId: series.id,
        pattern: rule.pattern,
        boreGroup: rule.boreGroup,
        strokeGroup: rule.strokeGroup,
      }))
    );
  }
  return legacyParsingRulesCache;
}

export function getAllCatalogExampleCodes(): string[] {
  return [
    ...new Set(catalogV2.productSeries.flatMap((series) => series.exampleCodes)),
  ];
}

export function getPneumaticCatalogExampleCodes(): string[] {
  return [
    ...new Set(
      catalogV2.productSeries
        .filter((s) => s.resolverCategory === 'pneumatic_cylinder')
        .flatMap((s) => s.exampleCodes)
    ),
  ];
}

export function getHydraulicCatalogExampleCodes(): string[] {
  return [
    ...new Set(
      catalogV2.productSeries
        .filter((s) => s.resolverCategory === 'hydraulic_valve')
        .flatMap((s) => s.exampleCodes)
    ),
  ];
}

export function getCatalogSearchAliases(seriesId: string): string[] {
  return seriesById.get(seriesId)?.searchAliases ?? [];
}

export function getCatalogVoltageCodes(seriesId: string) {
  return seriesById.get(seriesId)?.voltageCodes ?? [];
}
