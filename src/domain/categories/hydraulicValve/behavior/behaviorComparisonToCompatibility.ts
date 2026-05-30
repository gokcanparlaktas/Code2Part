import type {
  AttributeComparison,
  CheckItem,
  CompatibilityResult,
  EquivalentCandidate,
  EquivalenceSummary,
} from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import {
  getHydraulicValveCheckItems,
  HYDRAULIC_VALVE_WARNINGS,
} from '@/domain/categories/hydraulicValve/hydraulicValveCheckItems';
import { formatAttributeValue } from '@/utils/formatConfidence';

import {
  dedupeCheckItemsByField,
  normalizeCheckFieldKey,
} from '@/domain/presentation/dedupeCheckItems';
import type { HydraulicValveBehaviorComparisonResult } from './compareHydraulicValveBehaviorProfiles';

function comparisonToCheckItem(comparison: AttributeComparison): CheckItem | null {
  if (comparison.status !== 'unknownOrCheck') {
    return null;
  }

  return {
    field: comparison.label,
    sourceValue: comparison.sourceDisplay,
    targetValue: comparison.targetDisplay,
    reasonTr: `${comparison.label} için yeterli kesin bilgi yok. Katalog veya şema ile doğrulanmalıdır.`,
    severity:
      comparison.label.includes('CETOP') ||
      comparison.label.includes('Merkez') ||
      comparison.label.includes('Konum') ||
      comparison.label.includes('voltaj')
        ? 'high'
        : 'medium',
  };
}

function lookupEquivalenceSummary(
  compatibleCount: number,
  differentCount: number,
  behavior: HydraulicValveBehaviorComparisonResult
): EquivalenceSummary {
  if (differentCount > 0) {
    return {
      matchLevelTr: 'Fonksiyonel alternatif',
      summaryTr:
        'CETOP/NG veya sürgü davranışı farklı olabilir. Hidrolik valf muadili için detaylı mühendislik kontrolü gerekir.',
      riskLevel: 'high',
    };
  }

  if (behavior.crossBrandSimilarBehavior) {
    return {
      matchLevelTr: 'Mekanik muadil adayı',
      summaryTr:
        'Davranışsal olarak benzer olabilir. Sürgü, bobin ve konnektör katalog sembolleriyle doğrulanmalıdır.',
      riskLevel: 'medium',
    };
  }

  if (compatibleCount >= 2) {
    return {
      matchLevelTr: 'Mekanik muadil adayı',
      summaryTr:
        'Aynı CETOP/NG grubunda muadil olabilir. Sürgü, bobin ve konnektör sipariş öncesi doğrulanmalıdır.',
      riskLevel: 'medium',
    };
  }

  return {
    matchLevelTr: 'Fonksiyonel alternatif',
    summaryTr: 'Sınırlı alan uyumu. Tüm teknik detaylar kontrol edilmelidir.',
    riskLevel: 'high',
  };
}

export function behaviorComparisonToCompatibilityResult(options: {
  source: ProductIdentification;
  candidate: EquivalentCandidate;
  behavior: HydraulicValveBehaviorComparisonResult;
  categoryComparison: AttributeComparison;
}): CompatibilityResult {
  const comparisons = [options.categoryComparison, ...options.behavior.comparisons];

  const compatible = comparisons.filter((c) => c.status === 'compatible');
  const different = comparisons.filter((c) => c.status === 'different');

  const attributeChecks = comparisons
    .map((c) => comparisonToCheckItem(c))
    .filter((item): item is CheckItem => item !== null);

  const voltageComparison = comparisons.find((c) => c.label === 'Bobin voltajı');
  const connectorComparison = comparisons.find((c) => c.label === 'Konnektör kodu');

  const checkItems = dedupeCheckItemsByField([
    ...getHydraulicValveCheckItems(options.source, options.candidate, {
      spool: options.behavior.spoolDynamicCheck,
      voltage: voltageComparison
        ? {
            source: voltageComparison.sourceDisplay,
            target: voltageComparison.targetDisplay,
            status: voltageComparison.status,
          }
        : undefined,
      connector: connectorComparison
        ? {
            source: connectorComparison.sourceDisplay,
            target: connectorComparison.targetDisplay,
            status: connectorComparison.status,
          }
        : undefined,
    }),
    ...attributeChecks.filter(
      (item) =>
        !['Bobin voltajı', 'Konnektör kodu', 'Sürgü / fonksiyon kodu'].includes(item.field) &&
        normalizeCheckFieldKey(item.field) !== 'merkez tipi'
    ),
  ]);

  const warningSet = new Set<string>([...HYDRAULIC_VALVE_WARNINGS, ...options.behavior.warnings]);

  if (!options.candidate.suggestedCode) {
    warningSet.add(
      'Örnek muadil kodu gösterilemedi. Sürgü, voltaj ve konnektör bilgileri doğrulanmalıdır.'
    );
  }

  return {
    candidate: options.candidate,
    summary: lookupEquivalenceSummary(compatible.length, different.length, options.behavior),
    compatible,
    different,
    checkItems,
    warnings: [...warningSet],
  };
}

export function buildCategoryComparison(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): AttributeComparison {
  const sourceDisplay = formatAttributeValue(source.productCategory.value, undefined);
  const targetDisplay = candidate.productCategory;

  if (String(source.productCategory.value) === candidate.productCategory) {
    return {
      label: 'Ürün kategorisi',
      sourceDisplay,
      targetDisplay,
      status: 'compatible',
    };
  }

  return {
    label: 'Ürün kategorisi',
    sourceDisplay,
    targetDisplay,
    status: 'different',
  };
}
