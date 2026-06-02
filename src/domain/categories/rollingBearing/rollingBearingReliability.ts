import type { ConfidenceLevel, ProductIdentification } from '@/types/product';

import type { CategoryReliabilityResult } from '../pneumaticCylinder/pneumaticCylinderReliability';

export function calculateRollingBearingReliability(
  identification: ProductIdentification
): CategoryReliabilityResult {
  const confidence: ConfidenceLevel = identification.confidence;

  if (identification.outcome === 'series_only') {
    return {
      confidence,
      seriesOnlyNoticeTr:
        'Rulman seri kodu tanındı; boyutlar veya suffix alanları katalogdan tam doğrulanamadı.',
    };
  }

  if (identification.outcome === 'not_found') {
    return {
      confidence: 'unknown',
      warningTitleTr: 'Rulman kodu tanınamadı.',
      warningMessageTr: 'Taban kod ve suffix yapısını kontrol edin.',
    };
  }

  if (confidence === 'low') {
    return {
      confidence,
      warningTitleTr: 'Marka veya suffix bilgisi sınırlı.',
      warningMessageTr: 'Sipariş öncesi üretici kataloğundan doğrulayın.',
    };
  }

  return { confidence };
}
