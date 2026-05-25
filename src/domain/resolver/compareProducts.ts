import type {
  AttributeComparison,
  CompatibilityResult,
  EquivalentCandidate,
} from '@/types/compatibility';
import type { ProductIdentification, TechnicalAttribute } from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';

function displayAttribute(attr: TechnicalAttribute<string | number>): string {
  return formatAttributeValue(attr.value, attr.unit);
}

function compareAttribute(
  label: string,
  source: TechnicalAttribute<string | number>,
  target: TechnicalAttribute<string | number> | string,
  options?: { treatDifferentValuesAsCheck?: boolean }
): AttributeComparison {
  const targetAttr: TechnicalAttribute<string | number> =
    typeof target === 'string'
      ? { value: target, evidence: 'series_table', requiresCheck: false }
      : target;

  const sourceDisplay = displayAttribute(source);
  const targetDisplay = displayAttribute(targetAttr);

  if (source.requiresCheck || targetAttr.requiresCheck) {
    return {
      label,
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
      note: 'Bu bilgi kesin değil; kontrol edilmeli.',
    };
  }

  if (
    source.evidence === 'unknown' ||
    targetAttr.evidence === 'unknown' ||
    source.value === null ||
    targetAttr.value === null
  ) {
    return {
      label,
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
      note: 'Karşılaştırma için yeterli bilgi yok.',
    };
  }

  if (source.evidence === 'inferred' || targetAttr.evidence === 'inferred') {
    return {
      label,
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
      note: 'Tahmini bilgi; doğrulama önerilir.',
    };
  }

  const sourceValue = String(source.value);
  const targetValue = String(targetAttr.value);

  if (sourceValue === targetValue) {
    return {
      label,
      sourceDisplay,
      targetDisplay,
      status: 'compatible',
    };
  }

  if (options?.treatDifferentValuesAsCheck) {
    return {
      label,
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
      note: 'Farklı görünüyor; teknik kontrol gerekli.',
    };
  }

  return {
    label,
    sourceDisplay,
    targetDisplay,
    status: 'different',
    note: 'Değerler farklı.',
  };
}

function collectWarnings(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): string[] {
  const warnings: string[] = [];

  if (!candidate.suggestedCode) {
    warnings.push(
      'Önerilen karşılaştırma kodu oluşturulamadı; çap veya strok bilgisi eksik.'
    );
  }

  if (source.confidence !== 'high') {
    warnings.push(
      'Kaynak ürün tanımlamasının güven düzeyi yüksek değil; sonuçları doğrulayın.'
    );
  }

  if (
    candidate.targetIdentification &&
    candidate.targetIdentification.confidence !== 'high'
  ) {
    warnings.push(
      `${candidate.brand} ${candidate.series} için önerilen kod güvenle doğrulanamadı.`
    );
  }

  if (source.brand.value && candidate.brand !== source.brand.value) {
    warnings.push(
      'Farklı marka serileri karşılaştırılıyor; montaj ve bağlantı detaylarını kontrol edin.'
    );
  }

  return warnings;
}

export function compareProducts(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CompatibilityResult {
  const target = candidate.targetIdentification;
  const comparisons: AttributeComparison[] = [
    compareAttribute('Standart ailesi', source.standardFamily, candidate.standardFamily),
    compareAttribute('Ürün tipi', source.productType, candidate.productType),
    compareAttribute(
      'Çap (bore)',
      source.bore,
      target?.bore ?? { value: null, evidence: 'unknown', requiresCheck: true }
    ),
    compareAttribute(
      'Strok',
      source.stroke,
      target?.stroke ?? { value: null, evidence: 'unknown', requiresCheck: true }
    ),
    compareAttribute(
      'Marka',
      source.brand,
      candidate.brand,
      { treatDifferentValuesAsCheck: true }
    ),
  ];

  const compatible = comparisons.filter((c) => c.status === 'compatible');
  const different = comparisons.filter((c) => c.status === 'different');
  const unknownOrCheck = comparisons.filter((c) => c.status === 'unknownOrCheck');
  const warnings = collectWarnings(source, candidate);

  return {
    candidate,
    compatible,
    different,
    unknownOrCheck,
    warnings,
  };
}
