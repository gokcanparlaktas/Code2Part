import { lookupEquivalenceSummaryFromCatalog } from '@/domain/catalog/comparisonProfileBridge';
import type {
  AttributeComparison,
  CheckItem,
  CompatibilityResult,
  EquivalenceSummary,
  EquivalentCandidate,
} from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import { getPneumaticCylinderCheckItems } from './pneumaticCylinderCheckItems';
import { buildPneumaticCylinderCompatibilityProfile } from './pneumaticCylinderCompatibilityProfile';
import { compareCompatibilityProfilesDetailed } from '@/domain/compatibilityProfiles/compareCompatibilityProfiles';

function attributeCheckReason(label: string, status: AttributeComparison['status']): string {
  if (status === 'different') {
    return `${label} değerleri farklı görünüyor. Teknik şartname veya montaj çizimi ile doğrulayın.`;
  }
  if (label === 'Marka') {
    return 'Farklı üretici serileri karşılaştırılıyor. Bağlantı ve montaj detayları marka bazında değişebilir.';
  }
  if (label === 'Çap (bore)' || label === 'Strok') {
    return `${label} bilgisi ürün kodundan okunamadı veya eksik. Sipariş öncesinde ölçüler doğrulanmalıdır.`;
  }
  return `${label} için yeterli kesin bilgi yok. Sipariş öncesinde kontrol edilmelidir.`;
}

function attributeCheckSeverity(
  label: string,
  status: AttributeComparison['status']
): CheckItem['severity'] {
  if (label === 'Çap (bore)' || label === 'Strok') {
    return status === 'different' ? 'high' : 'medium';
  }
  if (label === 'Marka') {
    return 'medium';
  }
  return status === 'different' ? 'medium' : 'low';
}

function comparisonToCheckItem(comparison: AttributeComparison): CheckItem | null {
  if (comparison.status !== 'unknownOrCheck') {
    return null;
  }

  return {
    field: comparison.label,
    sourceValue: comparison.sourceDisplay,
    targetValue: comparison.targetDisplay,
    reasonTr: attributeCheckReason(comparison.label, comparison.status),
    severity: attributeCheckSeverity(comparison.label, comparison.status),
  };
}

function lookupEquivalenceSummary(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
  compatibleCount: number,
  checkCount: number
): EquivalenceSummary {
  const fromCatalog = lookupEquivalenceSummaryFromCatalog(source, candidate);
  if (fromCatalog) {
    return fromCatalog;
  }

  if (compatibleCount >= 4 && checkCount <= 2) {
    return {
      matchLevelTr: 'Yüksek uyumlu muadil adayı',
      summaryTr:
        'Temel teknik alanlar uyumlu görünüyor. Yine de sipariş öncesinde bağlantı ve aksesuar detaylarını kontrol edin.',
      riskLevel: 'low',
    };
  }

  if (compatibleCount >= 2) {
    return {
      matchLevelTr: 'Mekanik muadil adayı',
      summaryTr:
        'Benzer standart ailesinde muadil olabilir. Kodda okunamayan alanlar sipariş öncesinde doğrulanmalıdır.',
      riskLevel: 'medium',
    };
  }

  return {
    matchLevelTr: 'Fonksiyonel alternatif',
    summaryTr:
      'Aynı işlevi görebilir ancak teknik uyum sınırlı. Detaylı mühendislik kontrolü önerilir.',
    riskLevel: 'high',
  };
}

function collectWarnings(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): string[] {
  const warnings: string[] = [];

  if (!candidate.suggestedCode) {
    warnings.push(
      'Önerilen karşılaştırma kodu oluşturulamadı. Çap ve strok değerleri kodda net okunmalıdır.'
    );
  }

  if (source.confidence !== 'high') {
    warnings.push(
      'Kaynak ürün tanımlamasının güven düzeyi yüksek değil. Sonuçları sipariş öncesi doğrulayın.'
    );
  }

  if (
    candidate.targetIdentification &&
    candidate.targetIdentification.confidence !== 'high'
  ) {
    warnings.push(
      `${candidate.brand} ${candidate.series} için önerilen kod tam doğrulanamadı.`
    );
  }

  return warnings;
}

export function comparePneumaticCylinders(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CompatibilityResult {
  const target = candidate.targetIdentification;

  const sourceProfile = buildPneumaticCylinderCompatibilityProfile({ identification: source });
  const targetProfile = buildPneumaticCylinderCompatibilityProfile({
    identification: target,
    candidate,
  });
  const profileComparison = compareCompatibilityProfilesDetailed(sourceProfile, targetProfile);
  const comparisons: AttributeComparison[] = profileComparison.comparisons;

  const compatible = comparisons.filter((c) => c.status === 'compatible');
  const different = comparisons.filter((c) => c.status === 'different');

  const cylinderItems = getPneumaticCylinderCheckItems(source, candidate);

  const checkItems: CheckItem[] = [
    ...profileComparison.checkItems.map((item) => {
      // keep existing pneumatic wording for core fields when possible
      if (item.field === 'Çap (bore)' || item.field === 'Strok') {
        return {
          ...item,
          reasonTr: attributeCheckReason(item.field, 'unknownOrCheck'),
          severity: attributeCheckSeverity(item.field, 'unknownOrCheck'),
        };
      }
      return item;
    }),
    ...cylinderItems,
  ].filter(Boolean);

  const summary = lookupEquivalenceSummary(
    source,
    candidate,
    compatible.length,
    checkItems.length
  );

  const warnings = collectWarnings(source, candidate);

  return {
    candidate,
    summary,
    compatible,
    different,
    checkItems,
    warnings: [...new Set([...warnings, ...profileComparison.warnings])],
    profileScoring: {
      scoredComparisons: profileComparison.scoredComparisons,
    },
  };
}
