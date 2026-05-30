import type { CompatibilityResult } from '@/types/compatibility';
import type { IdentificationOutcome, ProductIdentification } from '@/types/product';

import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

export const PARTIAL_SOURCE_EQUIVALENTS_WARNING_TR =
  'Tam sipariş kodu doğrulanamadığı için %100 uyumlu muadil önerilememektedir. Önerilen kodlar elde edilen bilgilerle oluşturulmuştur; sipariş öncesi katalog kontrolü gerekir.';

export const SYNTHESIZED_EQUIVALENT_CODE_NOTE_TR =
  'Muadil kodu, kaynak koddan çıkarılan bilgilerle oluşturuldu.';

export function canSearchEquivalentsForIdentification(
  identification: ProductIdentification
): boolean {
  if (identification.outcome === 'not_found' || !identification.seriesId) {
    return false;
  }

  return identification.outcome === 'full' || identification.outcome === 'series_only';
}

export function getEquivalenceWarningsForIdentification(
  identification: ProductIdentification
): string[] {
  if (identification.outcome === 'series_only') {
    return [PARTIAL_SOURCE_EQUIVALENTS_WARNING_TR];
  }
  return [];
}

const PARTIAL_SOURCE_MAX_MATCH_PERCENT = 95;

export function applyPartialSourceEquivalenceAdjustments(
  source: ProductIdentification,
  results: CompatibilityResult[]
): CompatibilityResult[] {
  if (source.outcome !== 'series_only') {
    return results;
  }

  return results.map((result) => {
    const currentPercentage =
      result.serverMatchPercentage ?? calculateMatchPercentage(result).percentage;
    const cappedPercentage = Math.min(currentPercentage, PARTIAL_SOURCE_MAX_MATCH_PERCENT);
    const warnings = new Set(result.warnings);

    warnings.add(PARTIAL_SOURCE_EQUIVALENTS_WARNING_TR);
    warnings.add(SYNTHESIZED_EQUIVALENT_CODE_NOTE_TR);

    return {
      ...result,
      serverMatchPercentage: cappedPercentage,
      warnings: [...warnings],
      metadata: result.metadata
        ? {
            ...result.metadata,
            dataCompleteness: 'low',
            confidenceLevel:
              result.metadata.confidenceLevel === 'high' ? 'medium' : result.metadata.confidenceLevel,
          }
        : result.metadata,
    };
  });
}

export function isPartialIdentificationOutcome(outcome: IdentificationOutcome): boolean {
  return outcome === 'series_only';
}
