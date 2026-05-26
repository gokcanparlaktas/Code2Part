import equivalentSeriesData from '@/data/equivalentSeries.json';
import equivalenceProfilesData from '@/data/equivalenceProfiles.json';
import parsingRulesData from '@/data/parsingRules.json';
import hydraulicValveSeriesData from '@/data/hydraulicValveSeries.json';
import productSeriesData from '@/data/productSeries.json';
import type { DataReliabilityMetadata } from '@/types/catalogMetadata';
import type {
  CatalogValidationResult,
  ValidationIssue,
} from '@/types/validation';
import { computeReliabilitySummary } from '@/utils/catalogReliability';

const REQUIRED_SERIES_FIELDS = [
  'id',
  'brand',
  'series',
  'technology',
  'resolverCategory',
  'category',
  'equivalenceGroup',
] as const;

type CatalogRecordWithReliability = DataReliabilityMetadata & {
  id?: string;
};

interface CatalogProductSeries extends CatalogRecordWithReliability {
  brand?: string;
  series?: string;
  technology?: string;
  resolverCategory?: string;
  category?: string;
  equivalenceGroup?: string;
  equivalenceGroupId?: string;
}

interface CatalogParsingRule extends CatalogRecordWithReliability {
  seriesId?: string;
  pattern?: string;
  boreGroup?: number;
  strokeGroup?: number;
}

interface CatalogEquivalenceGroup extends CatalogRecordWithReliability {
  name?: string;
  seriesIds?: string[];
}

interface CatalogEquivalentLink {
  sourceSeriesId?: string;
  targetSeriesId?: string;
}

function issue(
  level: ValidationIssue['level'],
  code: string,
  messageTr: string,
  relatedId?: string
): ValidationIssue {
  return { level, code, messageTr, relatedId };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const VERIFICATION_STATUSES = [
  'mock',
  'manual_unverified',
  'manual_verified',
  'source_verified',
] as const;

const SOURCE_TYPES = ['mock', 'catalog', 'manufacturer_page', 'standard', 'manual'] as const;

function validateReliabilityMetadata(
  record: Partial<DataReliabilityMetadata>,
  relatedId: string
): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];

  if (
    !record.verificationStatus ||
    !VERIFICATION_STATUSES.includes(
      record.verificationStatus as (typeof VERIFICATION_STATUSES)[number]
    )
  ) {
    warnings.push(
      issue(
        'warning',
        'RELIABILITY_MISSING_STATUS',
        'Bu kayıt için doğrulama durumu eksik.',
        relatedId
      )
    );
  }

  if (
    !record.sourceType ||
    !SOURCE_TYPES.includes(record.sourceType as (typeof SOURCE_TYPES)[number])
  ) {
    warnings.push(
      issue(
        'warning',
        'RELIABILITY_MISSING_SOURCE_TYPE',
        'Bu kayıt için kaynak tipi eksik.',
        relatedId
      )
    );
  }

  if (record.verificationStatus === 'source_verified' && !isNonEmptyString(record.sourceUrl)) {
    warnings.push(
      issue(
        'warning',
        'RELIABILITY_MISSING_SOURCE_URL',
        'Kaynak doğrulamalı kayıt için kaynak linki bulunmalı.',
        relatedId
      )
    );
  }

  if (record.verificationStatus === 'manual_unverified') {
    warnings.push(
      issue(
        'warning',
        'RELIABILITY_MANUAL_UNVERIFIED',
        'Bu kayıt manuel eklenmiş ve henüz doğrulanmamış.',
        relatedId
      )
    );
  }

  return warnings;
}

function validateProductSeries(
  items: CatalogProductSeries[],
  seriesIds: Set<string>
): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const seenIds = new Map<string, number>();

  items.forEach((item, index) => {
    const rowId = item.id ?? `satır-${index + 1}`;

    for (const field of REQUIRED_SERIES_FIELDS) {
      const value = item[field];
      if (!isNonEmptyString(value)) {
        errors.push(
          issue(
            'error',
            'SERIES_MISSING_FIELD',
            `Ürün serisi kaydında zorunlu alan eksik: ${field}.`,
            rowId
          )
        );
      }
    }

    if (isNonEmptyString(item.id)) {
      const count = (seenIds.get(item.id) ?? 0) + 1;
      seenIds.set(item.id, count);
      seriesIds.add(item.id);
    }

    if (
      isNonEmptyString(item.equivalenceGroup) &&
      isNonEmptyString(item.equivalenceGroupId) &&
      item.equivalenceGroup !== item.equivalenceGroupId
    ) {
      warnings.push(
        issue(
          'warning',
          'SERIES_GROUP_MISMATCH',
          'equivalenceGroup ve equivalenceGroupId farklı değerler içeriyor.',
          item.id
        )
      );
    }

    warnings.push(...validateReliabilityMetadata(item, rowId));
  });

  seenIds.forEach((count, id) => {
    if (count > 1) {
      errors.push(
        issue(
          'error',
          'DUPLICATE_SERIES_ID',
          'Aynı ürün serisi ID’si birden fazla kez kullanılmış.',
          id
        )
      );
    }
  });

  return { errors, warnings };
}

function validateParsingRules(
  rules: CatalogParsingRule[],
  seriesIds: Set<string>
): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const seenRuleIds = new Map<string, number>();

  rules.forEach((rule, index) => {
    const ruleKey = rule.id ?? `kural-${index + 1}`;

    if (rule.id) {
      const count = (seenRuleIds.get(rule.id) ?? 0) + 1;
      seenRuleIds.set(rule.id, count);
    }

    if (!isNonEmptyString(rule.seriesId)) {
      errors.push(
        issue(
          'error',
          'PARSER_MISSING_SERIES',
          'Parser kuralında seriesId alanı eksik.',
          ruleKey
        )
      );
    } else if (!seriesIds.has(rule.seriesId)) {
      errors.push(
        issue(
          'error',
          'PARSER_UNKNOWN_SERIES',
          "Parser kuralı mevcut olmayan bir seri ID'sine bağlı.",
          rule.seriesId
        )
      );
    }

    if (!isNonEmptyString(rule.pattern)) {
      errors.push(
        issue(
          'error',
          'PARSER_MISSING_PATTERN',
          'Parser kuralında regex deseni eksik.',
          ruleKey
        )
      );
    } else {
      try {
        RegExp(rule.pattern);
      } catch {
        errors.push(
          issue(
            'error',
            'PARSER_INVALID_REGEX',
            'Regex formatı hatalı.',
            ruleKey
          )
        );
      }
    }

    if (
      typeof rule.boreGroup !== 'number' ||
      typeof rule.strokeGroup !== 'number' ||
      rule.boreGroup < 1 ||
      rule.strokeGroup < 1
    ) {
      warnings.push(
        issue(
          'warning',
          'PARSER_GROUP_INDEX',
          'Parser kuralında çap/strok grup numarası kontrol edilmeli.',
          ruleKey
        )
      );
    }

    warnings.push(...validateReliabilityMetadata(rule, ruleKey));
  });

  seenRuleIds.forEach((count, id) => {
    if (count > 1) {
      errors.push(
        issue(
          'error',
          'DUPLICATE_PARSER_RULE_ID',
          'Aynı parser kuralı ID’si birden fazla kez kullanılmış.',
          id
        )
      );
    }
  });

  const seriesWithRules = new Set(
    rules.map((r) => r.seriesId).filter(isNonEmptyString)
  );
  seriesIds.forEach((id) => {
    if (!seriesWithRules.has(id)) {
      warnings.push(
        issue(
          'warning',
          'SERIES_WITHOUT_PARSER',
          'Bu seri için tanımlı parser kuralı yok.',
          id
        )
      );
    }
  });

  return { errors, warnings };
}

function validateEquivalenceGroups(
  groups: CatalogEquivalenceGroup[],
  seriesIds: Set<string>
): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const assignedSeries = new Map<string, string>();

  groups.forEach((group, index) => {
    const groupId = group.id ?? `grup-${index + 1}`;
    const members = group.seriesIds ?? [];

    if (!isNonEmptyString(group.id)) {
      errors.push(
        issue(
          'error',
          'GROUP_MISSING_ID',
          'Muadil grubunda ID alanı eksik.',
          groupId
        )
      );
    }

    if (members.length < 2) {
      errors.push(
        issue(
          'error',
          'GROUP_TOO_FEW_SERIES',
          'Bu muadil grupta yalnızca bir seri var.',
          groupId
        )
      );
    }

    members.forEach((seriesId) => {
      if (!seriesIds.has(seriesId)) {
        errors.push(
          issue(
            'error',
            'GROUP_UNKNOWN_SERIES',
            "Muadil grupta mevcut olmayan bir seri ID'si var.",
            seriesId
          )
        );
      }

      const previousGroup = assignedSeries.get(seriesId);
      if (previousGroup && previousGroup !== groupId) {
        warnings.push(
          issue(
            'warning',
            'SERIES_MULTIPLE_GROUPS',
            'Bir seri birden fazla muadil grubunda listelenmiş.',
            seriesId
          )
        );
      } else {
        assignedSeries.set(seriesId, groupId);
      }
    });

    warnings.push(...validateReliabilityMetadata(group, groupId));
  });

  return { errors, warnings };
}

function validateEquivalentLinks(
  links: CatalogEquivalentLink[],
  seriesIds: Set<string>
): ValidationIssue[] {
  const errors: ValidationIssue[] = [];

  links.forEach((link, index) => {
    const linkId = `${link.sourceSeriesId ?? '?'}-${link.targetSeriesId ?? '?'}-${index}`;

    if (!isNonEmptyString(link.sourceSeriesId)) {
      errors.push(
        issue(
          'error',
          'LINK_MISSING_SOURCE',
          'Muadil bağlantısında kaynak seri ID eksik.',
          linkId
        )
      );
    } else if (!seriesIds.has(link.sourceSeriesId)) {
      errors.push(
        issue(
          'error',
          'LINK_UNKNOWN_SOURCE',
          "Muadil bağlantısının kaynak seri ID'si katalogda yok.",
          link.sourceSeriesId
        )
      );
    }

    if (!isNonEmptyString(link.targetSeriesId)) {
      errors.push(
        issue(
          'error',
          'LINK_MISSING_TARGET',
          'Muadil bağlantısında hedef seri ID eksik.',
          linkId
        )
      );
    } else if (!seriesIds.has(link.targetSeriesId)) {
      errors.push(
        issue(
          'error',
          'LINK_UNKNOWN_TARGET',
          "Muadil bağlantısının hedef seri ID'si katalogda yok.",
          link.targetSeriesId
        )
      );
    }

    if (
      isNonEmptyString(link.sourceSeriesId) &&
      isNonEmptyString(link.targetSeriesId) &&
      link.sourceSeriesId === link.targetSeriesId
    ) {
      errors.push(
        issue(
          'error',
          'LINK_SAME_SERIES',
          'Kaynak ve hedef seri aynı olamaz.',
          link.sourceSeriesId
        )
      );
    }
  });

  return errors;
}

export function validateCatalog(): CatalogValidationResult {
  const productSeries = [
    ...(productSeriesData as CatalogProductSeries[]),
    ...(hydraulicValveSeriesData as CatalogProductSeries[]),
  ];
  const parsingRules = parsingRulesData as CatalogParsingRule[];
  const equivalenceGroups = equivalentSeriesData as CatalogEquivalenceGroup[];
  const equivalentLinks = equivalenceProfilesData as CatalogEquivalentLink[];

  const seriesIds = new Set<string>();
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const seriesResult = validateProductSeries(productSeries, seriesIds);
  errors.push(...seriesResult.errors);
  warnings.push(...seriesResult.warnings);

  const parserResult = validateParsingRules(parsingRules, seriesIds);
  errors.push(...parserResult.errors);
  warnings.push(...parserResult.warnings);

  const groupResult = validateEquivalenceGroups(equivalenceGroups, seriesIds);
  errors.push(...groupResult.errors);
  warnings.push(...groupResult.warnings);

  errors.push(...validateEquivalentLinks(equivalentLinks, seriesIds));

  const reliability = computeReliabilitySummary(
    productSeries,
    parsingRules,
    equivalenceGroups
  );

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      productSeriesCount: productSeries.length,
      parsingRulesCount: parsingRules.length,
      equivalenceGroupCount: equivalenceGroups.length,
      equivalentLinksCount: equivalentLinks.length,
      reliability,
    },
  };
}
