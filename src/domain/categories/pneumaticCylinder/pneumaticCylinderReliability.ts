import type { ConfidenceLevel, ProductIdentification } from '@/types/product';

export interface CategoryReliabilityResult {
  confidence: ConfidenceLevel;
  warningTitleTr?: string;
  warningMessageTr?: string;
  seriesOnlyNoticeTr?: string;
}

export function calculatePneumaticCylinderReliability(
  identification: ProductIdentification
): CategoryReliabilityResult {
  // Keep existing pneumatic confidence behavior (bore/stroke parsing based).
  const confidence = identification.confidence;

  if (identification.outcome === 'series_only') {
    return {
      confidence,
      seriesOnlyNoticeTr:
        'Seri tanındı; çap ve strok kod formatından okunamadı. Değerler doğrulanmalıdır.',
    };
  }

  if (confidence === 'low' || confidence === 'unknown') {
    return {
      confidence,
      warningTitleTr: 'Bu sonuç düşük güvenle tahmin edildi.',
      warningMessageTr: 'Marka, seri ve teknik özellikler katalogdan doğrulanmalıdır.',
    };
  }

  return { confidence };
}

