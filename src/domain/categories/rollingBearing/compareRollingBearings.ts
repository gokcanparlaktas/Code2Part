import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getDefaultCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import type {
  AttributeComparison,
  CompatibilityResult,
  EquivalentCandidate,
} from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';

import {
  formatSealFromResolution,
  formatSealMeaningTr,
  METAL_COVER_DESCRIPTION_TR,
} from './bearingDisplayLabels';
import { BEARING_EQUIVALENT_METADATA } from './bearingAttributePolicy';
import { parseRollingBearingCode } from './parseRollingBearingCode';

const BEARING_EQUIVALENT_SUMMARY_TR =
  'Metrik rulman standardına göre teknik karşılık önerisi.';

function compareNumericAttribute(
  label: string,
  sourceValue: number | null,
  targetValue: number | null
): AttributeComparison {
  const sourceDisplay = formatAttributeValue(sourceValue, 'mm');
  const targetDisplay = formatAttributeValue(targetValue, 'mm');

  if (sourceValue === null || targetValue === null) {
    return {
      label,
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
      checkReasonTr: 'Boyut bilgisi eksik.',
    };
  }

  if (sourceValue === targetValue) {
    return { label, sourceDisplay, targetDisplay, status: 'compatible' };
  }

  return {
    label,
    sourceDisplay,
    targetDisplay,
    status: 'different',
    checkReasonTr: 'd/D/B eşleşmiyor.',
  };
}

function compareSealAttribute(
  sourceProfile: ReturnType<typeof parseRollingBearingCode>,
  targetProfile: ReturnType<typeof parseRollingBearingCode> | null
): AttributeComparison {
  const sourceSeal = sourceProfile.suffixResolutions.find(
    (s) => s.attributeKey === 'seal_or_shield'
  );
  const targetSeal = targetProfile?.suffixResolutions.find(
    (s) => s.attributeKey === 'seal_or_shield'
  );

  const sourceDisplay = sourceSeal
    ? formatSealFromResolution(sourceSeal)
    : 'Açık tip';
  const targetDisplay = targetSeal ? formatSealFromResolution(targetSeal) : 'Açık tip';

  const sourceMetal =
    sourceSeal && formatSealMeaningTr(sourceSeal.normalizedMeaning, sourceSeal.rawToken) === METAL_COVER_DESCRIPTION_TR;
  const targetMetal =
    targetSeal && formatSealMeaningTr(targetSeal.normalizedMeaning, targetSeal.rawToken) === METAL_COVER_DESCRIPTION_TR;

  if (sourceMetal && targetMetal) {
    return {
      label: 'Sızdırmazlık',
      sourceDisplay,
      targetDisplay,
      status: 'compatible',
    };
  }

  if (sourceDisplay === targetDisplay) {
    return {
      label: 'Sızdırmazlık',
      sourceDisplay,
      targetDisplay,
      status: 'compatible',
    };
  }

  return {
    label: 'Sızdırmazlık',
    sourceDisplay,
    targetDisplay,
    status: 'different',
    checkReasonTr: 'Conta / metal kapak tipi farklı olabilir.',
  };
}

export function compareRollingBearings(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
  options?: { catalogProvider?: CatalogDataProvider }
): CompatibilityResult {
  const catalogProvider = options?.catalogProvider ?? getDefaultCatalogDataProvider();
  const target = candidate.targetIdentification;

  const sourceProfile =
    source.bearingDecode ?? parseRollingBearingCode(source.inputCode, catalogProvider);
  const targetProfile = target?.bearingDecode
    ? target.bearingDecode
    : candidate.suggestedCode
      ? parseRollingBearingCode(candidate.suggestedCode, catalogProvider)
      : null;

  if (!targetProfile || targetProfile.dimensions.status !== 'complete') {
    return {
      candidate,
      summary: {
        matchLevelTr: 'Kontrol gerekli',
        summaryTr: 'Hedef kod boyutları okunamadı.',
        riskLevel: 'medium',
      },
      compatible: [],
      different: [],
      checkItems: [],
      warnings: [],
      metadata: {
        compatibilityLevel: 'medium',
        confidenceLevel: 'medium',
        dataCompleteness: 'medium',
      },
    };
  }

  if (sourceProfile.dimensions.status !== 'complete') {
    return {
      candidate,
      summary: {
        matchLevelTr: 'Kontrol gerekli',
        summaryTr: 'Kaynak boyutları eksik.',
        riskLevel: 'medium',
      },
      compatible: [],
      different: [],
      checkItems: [],
      warnings: [],
      metadata: {
        compatibilityLevel: 'medium',
        confidenceLevel: 'medium',
        dataCompleteness: 'medium',
      },
    };
  }

  const comparisons: AttributeComparison[] = [
    compareNumericAttribute(
      'İç çap',
      sourceProfile.dimensions.boreDiameterMm,
      targetProfile.dimensions.boreDiameterMm
    ),
    compareNumericAttribute(
      'Dış çap',
      sourceProfile.dimensions.outsideDiameterMm,
      targetProfile.dimensions.outsideDiameterMm
    ),
    compareNumericAttribute(
      'Kalınlık',
      sourceProfile.dimensions.widthMm,
      targetProfile.dimensions.widthMm
    ),
    compareSealAttribute(sourceProfile, targetProfile),
    {
      label: 'Rulman tipi',
      sourceDisplay: source.productType.value?.toString() ?? '—',
      targetDisplay:
        target?.productType.value?.toString() ?? candidate.productType ?? '—',
      status:
        source.productType.value &&
        (target?.productType.value ?? candidate.productType) &&
        source.productType.value === (target?.productType.value ?? candidate.productType)
          ? 'compatible'
          : 'different',
    },
  ];

  const compatible = comparisons.filter((c) => c.status === 'compatible');
  const different = comparisons.filter((c) => c.status === 'different');
  const hasCriticalDifferent = different.some((c) =>
    ['İç çap', 'Dış çap', 'Kalınlık'].includes(c.label)
  );

  return {
    candidate,
    summary: {
      matchLevelTr: hasCriticalDifferent
        ? 'Uyumsuz'
        : 'Yüksek uyumlu muadil adayı',
      summaryTr: hasCriticalDifferent
        ? 'd/D/B veya tip eşleşmiyor.'
        : BEARING_EQUIVALENT_SUMMARY_TR,
      riskLevel: hasCriticalDifferent ? 'high' : 'low',
    },
    metadata: hasCriticalDifferent
      ? {
          compatibilityLevel: 'low',
          confidenceLevel: 'medium',
          dataCompleteness: 'medium',
        }
      : BEARING_EQUIVALENT_METADATA,
    compatible,
    different,
    checkItems: comparisons
      .filter((c) => c.status === 'unknownOrCheck')
      .map((c, index) => ({
        field: c.label || `Kontrol ${index + 1}`,
        sourceValue: c.sourceDisplay,
        targetValue: c.targetDisplay,
        reasonTr: c.checkReasonTr ?? 'Kontrol gerekli.',
        severity: 'medium' as const,
      })),
    warnings: [],
  };
}
