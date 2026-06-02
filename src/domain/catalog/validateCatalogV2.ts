import { compactProductCode } from '@/domain/scoring/calculateSuggestionMatchPercentage';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
  ROLLING_BEARING_CATEGORY,
  type ProductResolverCategory,
} from '@/types/category';
import type { CatalogV2Bundle } from '@/types/catalog';
import type { CatalogValidationResult, ValidationIssue } from '@/types/validation';

import { computeReliabilitySummary } from '@/utils/catalogReliability';

import {
  getCatalogV2Bundle,
  getLegacyEquivalentGroups,
  getLegacyParsingRules,
  getLegacyProductSeries,
} from './adapters/catalogV2Adapter';

const VALID_RESOLVER_CATEGORIES: ProductResolverCategory[] = [
  PNEUMATIC_CYLINDER_CATEGORY,
  HYDRAULIC_VALVE_CATEGORY,
  ROLLING_BEARING_CATEGORY,
];

function issue(
  level: ValidationIssue['level'],
  code: string,
  messageTr: string,
  relatedId?: string
): ValidationIssue {
  return { level, code, messageTr, relatedId };
}

export function validateCatalogV2Bundle(bundle: CatalogV2Bundle): CatalogValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const groupIds = new Set(bundle.equivalenceGroups.map((g) => g.id));
  const mappingIds = new Set(bundle.functionMappings.map((m) => m.id));
  const checkRuleIds = new Set(bundle.checkRules.map((r) => r.id));
  const normalizedExampleOwners = new Map<string, string>();

  for (const series of bundle.productSeries) {
    if (!series.id || !series.brand || !series.series || !series.category) {
      errors.push(
        issue('error', 'series_required_fields', 'Seri kaydında zorunlu alanlar eksik.', series.id)
      );
    }

    if (!series.resolverCategory || !VALID_RESOLVER_CATEGORIES.includes(series.resolverCategory)) {
      errors.push(
        issue(
          'error',
          'series_invalid_resolver_category',
          'Geçersiz resolverCategory değeri.',
          series.id
        )
      );
    }

    if (!series.equivalenceGroupId) {
      errors.push(
        issue('error', 'series_missing_equivalence_group', 'equivalenceGroupId eksik.', series.id)
      );
    } else if (!groupIds.has(series.equivalenceGroupId)) {
      errors.push(
        issue(
          'error',
          'series_unknown_equivalence_group',
          'equivalenceGroupId katalogda bulunamadı.',
          series.id
        )
      );
    }

    for (const ref of series.functionMappingRefs ?? []) {
      if (!mappingIds.has(ref.mappingId)) {
        errors.push(
          issue(
            'error',
            'series_unknown_function_mapping',
            `functionMappingRefs içinde bilinmeyen mapping: ${ref.mappingId}`,
            series.id
          )
        );
      }
    }

    for (const ref of series.checkRuleRefs) {
      if (!checkRuleIds.has(ref.ruleId)) {
        errors.push(
          issue(
            'error',
            'series_unknown_check_rule',
            `checkRuleRefs içinde bilinmeyen kural: ${ref.ruleId}`,
            series.id
          )
        );
      }
    }

    for (const code of series.exampleCodes) {
      const normalized = normalizeCode(code);
      const compact = compactProductCode(code);
      const keys = [normalized, compact];
      for (const key of keys) {
        const owner = normalizedExampleOwners.get(key);
        if (owner && owner !== series.id) {
          errors.push(
            issue(
              'error',
              'duplicate_example_code',
              `Örnek kod çakışması (${code}): ${owner} ve ${series.id}`,
              series.id
            )
          );
        } else {
          normalizedExampleOwners.set(key, series.id);
        }
      }
    }

    for (const voltage of series.voltageCodes ?? []) {
      if (
        voltage.code === 'H7' &&
        voltage.labelTr?.toLowerCase().includes('24') &&
        !voltage.requiresCatalogCheck
      ) {
        errors.push(
          issue(
            'error',
            'h7_mapped_as_24v',
            'H7 kodu 24V DC olarak eşlenmemelidir.',
            series.id
          )
        );
      }
      if (voltage.code === 'H7' && voltage.labelTr === '24 V DC') {
        errors.push(
          issue(
            'error',
            'h7_mapped_as_24v',
            'H7 kodu 24V DC olarak eşlenmemelidir.',
            series.id
          )
        );
      }
    }

    const codePatternGroups = [
      ...(series.codePatterns?.boreStroke ?? []),
      ...(series.codePatterns?.boreStrokeFallback ?? []),
      ...(series.codePatterns?.connector ?? []),
      ...(series.codePatterns?.revision ?? []),
      ...(series.codePatterns?.functionToken ?? []),
      ...(series.codePatterns?.inferredVoltage ?? []),
    ];

    for (const pattern of codePatternGroups) {
      try {
        new RegExp(pattern.pattern);
      } catch {
        errors.push(
          issue(
            'error',
            'invalid_code_pattern',
            `Geçersiz codePatterns regex: ${pattern.id}`,
            series.id
          )
        );
      }
    }

    for (const voltage of series.voltageCodes ?? []) {
      if (voltage.matchPattern) {
        try {
          new RegExp(voltage.matchPattern);
        } catch {
          errors.push(
            issue(
              'error',
              'invalid_voltage_match_pattern',
              `Geçersiz voltage matchPattern: ${voltage.code}`,
              series.id
            )
          );
        }
      }
    }
  }

  for (const group of bundle.equivalenceGroups) {
    for (const seriesId of group.seriesIds) {
      if (!bundle.productSeries.some((s) => s.id === seriesId)) {
        errors.push(
          issue(
            'error',
            'group_unknown_series',
            `Muadil grupta bilinmeyen seri: ${seriesId}`,
            group.id
          )
        );
      }
    }
  }

  const isValid = errors.length === 0;

  const parsingRulesCount = bundle.productSeries.reduce(
    (count, series) => count + (series.parsingRules?.length ?? 0),
    0
  );

  let reliability = {
    totalRecords: 0,
    sourceVerifiedCount: 0,
    manualVerifiedCount: 0,
    manualUnverifiedCount: 0,
    mockCount: 0,
  };

  if (bundle === getCatalogV2Bundle()) {
    reliability = computeReliabilitySummary(
      getLegacyProductSeries(),
      getLegacyParsingRules(),
      getLegacyEquivalentGroups()
    );
  }

  return {
    isValid,
    errors,
    warnings,
    summary: {
      productSeriesCount: bundle.productSeries.length,
      parsingRulesCount,
      equivalenceGroupCount: bundle.equivalenceGroups.length,
      equivalentLinksCount: 0,
      functionMappingsCount: bundle.functionMappings.length,
      checkRulesCount: bundle.checkRules.length,
      reliability,
    },
  };
}

export function validateCatalogV2(): CatalogValidationResult {
  return validateCatalogV2Bundle(getCatalogV2Bundle());
}

export function assertCatalogV2Valid(): void {
  const result = validateCatalogV2();
  if (!result.isValid) {
    const message = result.errors.map((e) => e.messageTr).join('\n');
    throw new Error(`Catalog v2 validation failed:\n${message}`);
  }
}
