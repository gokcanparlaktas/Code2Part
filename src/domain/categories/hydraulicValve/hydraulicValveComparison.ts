import type {
  AttributeComparison,
  CheckItem,
  CompatibilityResult,
  EquivalenceSummary,
  EquivalentCandidate,
} from '@/types/compatibility';
import type { ProductIdentification, TechnicalAttribute } from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';

import { getHydraulicValveCheckItems, HYDRAULIC_VALVE_WARNINGS } from './hydraulicValveCheckItems';

function displayAttribute(attr: TechnicalAttribute<string | number>): string {
  return formatAttributeValue(attr.value, attr.unit);
}

function compareAttribute(
  label: string,
  source: TechnicalAttribute<string | number>,
  target: TechnicalAttribute<string | number> | string
): AttributeComparison {
  const targetAttr: TechnicalAttribute<string | number> =
    typeof target === 'string'
      ? { value: target, evidence: 'series_table', requiresCheck: false }
      : target;

  const sourceDisplay = displayAttribute(source);
  const targetDisplay = displayAttribute(targetAttr);

  if (source.requiresCheck || targetAttr.requiresCheck) {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (
    source.evidence === 'unknown' ||
    targetAttr.evidence === 'unknown' ||
    source.value === null ||
    targetAttr.value === null
  ) {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (source.evidence === 'inferred' || targetAttr.evidence === 'inferred') {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (String(source.value) === String(targetAttr.value)) {
    return { label, sourceDisplay, targetDisplay, status: 'compatible' };
  }

  return { label, sourceDisplay, targetDisplay, status: 'different' };
}

function comparisonToCheckItem(comparison: AttributeComparison): CheckItem | null {
  if (comparison.status !== 'unknownOrCheck') {
    return null;
  }

  return {
    field: comparison.label,
    sourceValue: comparison.sourceDisplay,
    targetValue: comparison.targetDisplay,
    reasonTr: `${comparison.label} için yeterli kesin bilgi yok. Katalog veya şema ile doğrulanmalıdır.`,
    severity: comparison.label.includes('CETOP') ? 'high' : 'medium',
  };
}

function lookupEquivalenceSummary(
  compatibleCount: number,
  differentCount: number
): EquivalenceSummary {
  if (differentCount > 0) {
    return {
      matchLevelTr: 'Fonksiyonel alternatif',
      summaryTr:
        'CETOP/NG veya kategori farkı var. Hidrolik valf muadili için detaylı mühendislik kontrolü gerekir.',
      riskLevel: 'high',
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

export function compareHydraulicValves(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CompatibilityResult {
  const target = candidate.targetIdentification;
  const sourceCetop =
    source.cetopNgSize ??
    ({
      value: source.standardFamily.value,
      evidence: source.standardFamily.evidence,
      requiresCheck: false,
    } as TechnicalAttribute<string>);

  const targetCetop: TechnicalAttribute<string> = target?.cetopNgSize ??
    target?.standardFamily ?? {
      value: candidate.standardFamily,
      evidence: 'series_table',
      requiresCheck: false,
    };

  const comparisons: AttributeComparison[] = [
    compareAttribute(
      'Ürün kategorisi',
      source.productCategory,
      candidate.productCategory
    ),
    compareAttribute('CETOP / NG ölçüsü', sourceCetop, targetCetop),
    compareAttribute(
      'Valf fonksiyonu / sürgü',
      source.valveSpoolFunction ?? {
        value: null,
        evidence: 'unknown',
        requiresCheck: true,
      },
      target?.valveSpoolFunction ?? {
        value: null,
        evidence: 'unknown',
        requiresCheck: true,
      }
    ),
  ];

  const compatible = comparisons.filter((c) => c.status === 'compatible');
  const different = comparisons.filter((c) => c.status === 'different');

  const attributeChecks = comparisons
    .map((c) => comparisonToCheckItem(c))
    .filter((item): item is CheckItem => item !== null);

  const checkItems = [...attributeChecks, ...getHydraulicValveCheckItems(source, candidate)];

  const warnings = [...HYDRAULIC_VALVE_WARNINGS];
  if (!candidate.suggestedCode) {
    warnings.push(
      'Örnek muadil kodu gösterilemedi. Sürgü, voltaj ve konnektör bilgileri doğrulanmalıdır.'
    );
  }

  return {
    candidate,
    summary: lookupEquivalenceSummary(compatible.length, different.length),
    compatible,
    different,
    checkItems,
    warnings,
  };
}
