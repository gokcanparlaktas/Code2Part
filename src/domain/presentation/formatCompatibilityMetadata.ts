import type {
  CompatibilityLevel,
  CompatibilityMetadata,
  ConfidenceLevel,
  DataCompletenessLevel,
  RiskLevel,
} from '@/types/compatibility';

export const COMPATIBILITY_LEVEL_LABELS: Record<CompatibilityLevel, string> = {
  high: 'Uyumluluk: Yüksek',
  medium: 'Uyumluluk: Orta',
  low: 'Uyumluluk: Düşük',
  not_compatible: 'Uyumlu değil',
};

/** User-facing source confidence (catalog / ordering code backed). */
export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  high: 'Kaynak güveni: Yüksek',
  medium: 'Kaynak güveni: Orta',
  low: 'Kaynak güveni: Düşük',
};

/** How many comparison fields are resolved, not source quality. */
export const DATA_COMPLETENESS_LABELS: Record<DataCompletenessLevel, string> = {
  high: 'Veri kapsamı: Yüksek',
  medium: 'Veri kapsamı: Orta',
  low: 'Veri kapsamı: Düşük',
};

/** @deprecated Use CONFIDENCE_LEVEL_LABELS — kept for imports that expect old name. */
export const LEGACY_CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  high: 'Güven: Yüksek',
  medium: 'Güven: Orta',
  low: 'Güven: Düşük',
};

/** @deprecated Use DATA_COMPLETENESS_LABELS */
export const LEGACY_DATA_COMPLETENESS_LABELS: Record<DataCompletenessLevel, string> = {
  high: 'Veri tamamlığı: Yüksek',
  medium: 'Veri tamamlığı: Orta',
  low: 'Veri tamamlığı: Düşük',
};

export const CATALOG_REVIEW_WARNING_TITLE_TR = 'Katalog doğrulaması gerekli';

export const CATALOG_SUPPORTED_MATCH_FOOTNOTE_TR =
  'Eşleşme üretici katalog verileriyle desteklenir. Sipariş öncesi uygulama basıncı, debisi ve bağlantı detayları kontrol edilmelidir.';

const CATALOG_REVIEW_PATTERN =
  /port durumları|katalog aday|inceleme gerektiren|katalog sembol|üretim onayı değildir/i;

export function formatCompatibilityLevelLabel(level: CompatibilityLevel): string {
  return COMPATIBILITY_LEVEL_LABELS[level];
}

export function formatConfidenceLevelLabel(level: ConfidenceLevel): string {
  return CONFIDENCE_LEVEL_LABELS[level];
}

export function formatDataCompletenessLabel(level: DataCompletenessLevel): string {
  return DATA_COMPLETENESS_LABELS[level];
}

export function formatCompatibilityMetadataLines(
  metadata: CompatibilityMetadata
): string[] {
  return [
    formatCompatibilityLevelLabel(metadata.compatibilityLevel),
    formatConfidenceLevelLabel(metadata.confidenceLevel),
    formatDataCompletenessLabel(metadata.dataCompleteness),
  ];
}

export function formatCompatibilityMetadataCompact(
  metadata: CompatibilityMetadata
): string {
  return formatCompatibilityMetadataLines(metadata).join(' • ');
}

export type EquivalenceStatusTone = 'positive' | 'caution' | 'danger';

export function formatEquivalenceStatusLabel(
  metadata: CompatibilityMetadata,
  options: { hasCheckItems?: boolean } = {}
): string {
  const { hasCheckItems = false } = options;
  const needsPracticalCheck =
    hasCheckItems ||
    metadata.confidenceLevel !== 'high' ||
    metadata.dataCompleteness !== 'high';

  switch (metadata.compatibilityLevel) {
    case 'not_compatible':
      return 'Uyumsuz';
    case 'low':
      return needsPracticalCheck ? 'Düşük uyum · Kontrol gerekli' : 'Düşük uyum';
    case 'medium':
      return 'Orta uyum · Kontrol gerekli';
    case 'high':
      if (
        metadata.confidenceLevel === 'high' &&
        metadata.dataCompleteness === 'high' &&
        !hasCheckItems
      ) {
        return 'Yüksek uyum';
      }
      if (
        metadata.confidenceLevel === 'high' &&
        metadata.dataCompleteness === 'high' &&
        hasCheckItems
      ) {
        return 'Yüksek uyum · Kontrol gerekli';
      }
      return needsPracticalCheck
        ? 'Yüksek uyum · Kontrol gerekli'
        : 'Yüksek uyum';
    default:
      return needsPracticalCheck ? 'Kontrol gerekli' : 'Yüksek uyum';
  }
}

export function equivalenceStatusTone(
  metadata: CompatibilityMetadata
): EquivalenceStatusTone {
  if (metadata.compatibilityLevel === 'not_compatible') {
    return 'danger';
  }
  if (
    metadata.compatibilityLevel === 'low' ||
    metadata.compatibilityLevel === 'medium'
  ) {
    return 'caution';
  }
  return 'positive';
}

/**
 * Legacy RiskLevel for code paths without metadata-aware labels.
 * Prefer formatEquivalenceStatusLabel when CompatibilityResult.metadata exists.
 */
export function deriveSummaryRiskLevelFromMetadata(
  metadata: CompatibilityMetadata
): RiskLevel {
  if (
    metadata.compatibilityLevel === 'not_compatible' ||
    metadata.compatibilityLevel === 'low'
  ) {
    return 'high';
  }
  if (metadata.compatibilityLevel === 'medium') {
    return 'medium';
  }
  if (metadata.confidenceLevel === 'low' || metadata.dataCompleteness === 'low') {
    return 'medium';
  }
  return 'low';
}

export function buildLegacyMatchScoreFootnote(
  metadata: CompatibilityMetadata | undefined,
  matchLevel: 'low' | 'medium' | 'high'
): string | null {
  if (!metadata || metadata.compatibilityLevel !== 'high') {
    return null;
  }
  if (matchLevel === 'high') {
    return null;
  }
  return (
    'Yüzde skoru kontrol gerektiren alanlardan etkilenebilir; ' +
    'ana uyumluluk seviyesi yukarıda gösterilir.'
  );
}

export function buildCompatibilityMetadataFootnote(
  metadata: CompatibilityMetadata,
  options: { hasCheckItems?: boolean } = {}
): string | null {
  if (metadata.compatibilityLevel !== 'high') {
    return null;
  }

  if (
    options.hasCheckItems ||
    metadata.dataCompleteness !== 'high' ||
    metadata.confidenceLevel !== 'high'
  ) {
    return CATALOG_SUPPORTED_MATCH_FOOTNOTE_TR;
  }

  return null;
}

export function isCatalogReviewWarning(text: string): boolean {
  return CATALOG_REVIEW_PATTERN.test(text);
}

export interface FormattedCompatibilityWarning {
  title: string;
  detail?: string;
  isCatalogReview: boolean;
}

export function formatCompatibilityWarningForUi(
  warning: string
): FormattedCompatibilityWarning {
  if (isCatalogReviewWarning(warning)) {
    return {
      title:
        'Sipariş öncesi katalog, uygulama basıncı/debisi ve bağlantı detayları kontrol edilmelidir.',
      isCatalogReview: true,
    };
  }
  return {
    title: warning,
    isCatalogReview: false,
  };
}
