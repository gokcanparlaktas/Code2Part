import type { AttributeComparison, CheckItem } from '@/types/compatibility';
import type { ProductCompatibilityProfile } from './compatibilityProfile';

export type CompatibilityProfileSections = {
  compatible: string[];
  different: string[];
  unknownOrCheck: string[];
  warnings: string[];
};

export type CompatibilityProfileComparisonDetailed = CompatibilityProfileSections & {
  comparisons: AttributeComparison[];
  checkItems: CheckItem[];
};

function formatValue(value: string | number | boolean | null, unit?: string): string {
  if (value === null) {
    return 'Doğrulanamadı';
  }
  if (typeof value === 'boolean') {
    return value ? 'Var' : 'Yok';
  }
  return unit ? `${value} ${unit}` : String(value);
}

function severityFromImportance(
  importance: ProductCompatibilityProfile['attributes'][string]['importance']
): CheckItem['severity'] {
  if (importance === 'critical') {
    return 'high';
  }
  if (importance === 'important') {
    return 'medium';
  }
  return 'low';
}

function compareSingleAttribute(options: {
  source: ProductCompatibilityProfile['attributes'][string];
  target: ProductCompatibilityProfile['attributes'][string];
}): { comparison: AttributeComparison | null; checkItem: CheckItem | null; sentence: string | null } {
  const { source, target } = options;
  const label = source.label;
  const sourceDisplay = formatValue(source.value, source.unit);
  const targetDisplay = formatValue(target.value, target.unit);

  if (source.compareMode === 'ignore') {
    return { comparison: null, checkItem: null, sentence: null };
  }

  const eitherUnknown =
    source.value === null ||
    target.value === null ||
    source.evidence === 'unknown' ||
    target.evidence === 'unknown' ||
    source.evidence === 'inferred' ||
    target.evidence === 'inferred';

  const requiresCatalogCheck =
    Boolean(source.requiresCatalogCheck) || Boolean(target.requiresCatalogCheck);

  const bothPresent = source.value !== null && target.value !== null;
  const same = bothPresent && String(source.value) === String(target.value);

  const highConfidenceSame =
    same &&
    source.confidence === 'high' &&
    target.confidence === 'high' &&
    !requiresCatalogCheck;

  const numericSame =
    source.compareMode === 'numeric' &&
    typeof source.value === 'number' &&
    typeof target.value === 'number' &&
    source.value === target.value;

  const status: AttributeComparison['status'] = (() => {
    if (source.compareMode === 'presence') {
      return bothPresent ? 'compatible' : 'unknownOrCheck';
    }

    if (!bothPresent || eitherUnknown) {
      return 'unknownOrCheck';
    }

    if (source.compareMode === 'numeric') {
      return numericSame ? 'compatible' : 'different';
    }

    if (source.compareMode === 'exact') {
      return same ? 'compatible' : 'different';
    }

    if (source.compareMode === 'same_or_check') {
      if (highConfidenceSame) {
        return 'compatible';
      }
      return same ? 'unknownOrCheck' : 'different';
    }

    if (source.compareMode === 'catalog_check') {
      // Never mark fully compatible unless it is truly verified (high confidence, no catalog-check flag).
      return highConfidenceSame ? 'compatible' : 'unknownOrCheck';
    }

    return 'unknownOrCheck';
  })();

  const comparison: AttributeComparison = {
    label,
    sourceDisplay,
    targetDisplay,
    status,
  };

  const sentence =
    status === 'compatible'
      ? `${label} aynı: ${sourceDisplay}`
      : status === 'different'
        ? `${label} farklı: ${sourceDisplay} / ${targetDisplay}`
        : `${label} kontrol edilmeli: ${sourceDisplay} / ${targetDisplay}`;

  const checkItem: CheckItem | null =
    status !== 'unknownOrCheck'
      ? null
      : {
          field: label,
          sourceValue: sourceDisplay,
          targetValue: targetDisplay,
          reasonTr: requiresCatalogCheck
            ? `${label} seriye göre değişebilir. Katalogdan doğrulanmalıdır.`
            : `${label} için yeterli kesin bilgi yok. Katalog veya teknik çizim ile doğrulanmalıdır.`,
          severity: severityFromImportance(source.importance),
        };

  return { comparison, checkItem, sentence };
}

export function compareCompatibilityProfiles(
  sourceProfile: ProductCompatibilityProfile,
  candidateProfile: ProductCompatibilityProfile
): CompatibilityProfileSections {
  const detailed = compareCompatibilityProfilesDetailed(sourceProfile, candidateProfile);
  return {
    compatible: detailed.compatible,
    different: detailed.different,
    unknownOrCheck: detailed.unknownOrCheck,
    warnings: detailed.warnings,
  };
}

export function compareCompatibilityProfilesDetailed(
  sourceProfile: ProductCompatibilityProfile,
  candidateProfile: ProductCompatibilityProfile
): CompatibilityProfileComparisonDetailed {
  const compatible: string[] = [];
  const different: string[] = [];
  const unknownOrCheck: string[] = [];
  const warnings: string[] = [];
  const comparisons: AttributeComparison[] = [];
  const checkItems: CheckItem[] = [];

  if (sourceProfile.productCategory !== candidateProfile.productCategory) {
    const msg = 'Ürün kategorisi farklı: Bu iki ürün doğrudan uyumlu kabul edilmez.';
    different.push(msg);
    warnings.push(msg);
    return { compatible, different, unknownOrCheck, warnings, comparisons, checkItems };
  }

  for (const [key, sourceAttr] of Object.entries(sourceProfile.attributes)) {
    const targetAttr = candidateProfile.attributes[key];
    if (!targetAttr) {
      const sourceDisplay = formatValue(sourceAttr.value, sourceAttr.unit);
      const msg = `${sourceAttr.label} kontrol edilmeli: ${sourceDisplay} / Doğrulanamadı`;
      unknownOrCheck.push(msg);
      checkItems.push({
        field: sourceAttr.label,
        sourceValue: sourceDisplay,
        targetValue: 'Doğrulanamadı',
        reasonTr: `${sourceAttr.label} için muadil tarafta bilgi yok. Katalogdan doğrulanmalıdır.`,
        severity: severityFromImportance(sourceAttr.importance),
      });
      continue;
    }

    const result = compareSingleAttribute({ source: sourceAttr, target: targetAttr });
    if (result.comparison) {
      comparisons.push(result.comparison);
    }
    if (result.checkItem) {
      checkItems.push(result.checkItem);
    }
    if (!result.sentence) {
      continue;
    }
    if (result.comparison?.status === 'compatible') {
      compatible.push(result.sentence);
    } else if (result.comparison?.status === 'different') {
      different.push(result.sentence);
    } else {
      unknownOrCheck.push(result.sentence);
    }
  }

  if (unknownOrCheck.length > 0) {
    warnings.push('Bazı alanlar kesin değil: Sipariş öncesinde katalog kontrolü gerekir.');
  }

  return { compatible, different, unknownOrCheck, warnings, comparisons, checkItems };
}
