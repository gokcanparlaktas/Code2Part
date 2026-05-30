import { normalizeCode } from '@/domain/resolver/normalizeCode';
import type { CompatibilityResult } from '@/types/compatibility';

export function compatibilityResultKey(result: {
  candidate: {
    suggestedCode: string | null;
    seriesId: string;
    targetIdentification: ProductIdentificationLike | null;
  };
}): string {
  const fromId = result.candidate.targetIdentification?.normalizedCode;
  if (typeof fromId === 'string' && fromId.trim()) {
    return fromId;
  }
  const fromSuggested = result.candidate.suggestedCode?.trim();
  if (fromSuggested) {
    return normalizeCode(fromSuggested);
  }
  return result.candidate.seriesId;
}

interface ProductIdentificationLike {
  normalizedCode: string;
}

export function mergeCompatibilityResultDisplay(
  preview: CompatibilityResult,
  detailed: CompatibilityResult | null | undefined
): CompatibilityResult {
  if (!detailed) {
    return preview;
  }

  return {
    ...detailed,
    candidate: {
      ...detailed.candidate,
      brand: detailed.candidate.brand || preview.candidate.brand,
      series: detailed.candidate.series || preview.candidate.series,
      suggestedCode: detailed.candidate.suggestedCode ?? preview.candidate.suggestedCode,
      seriesId: detailed.candidate.seriesId || preview.candidate.seriesId,
    },
  };
}
