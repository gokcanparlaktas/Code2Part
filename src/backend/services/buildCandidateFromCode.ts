import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import type { EquivalentCandidate } from '@/types/compatibility';

export function buildCandidateFromCode(code: string): EquivalentCandidate {
  const normalized = normalizeCode(code);
  const targetIdentification = identifyProduct(code, normalized);
  if (!targetIdentification.seriesId) {
    throw new Error(`Cannot resolve product series for candidate code: ${code}`);
  }

  const series = getProductSeriesById(targetIdentification.seriesId);
  if (!series) {
    throw new Error(`Product series record not found: ${targetIdentification.seriesId}`);
  }

  return {
    seriesId: series.id,
    brand: series.brand,
    series: series.series,
    productType: series.productType,
    productCategory: series.productCategory,
    standardFamily: series.standardFamily,
    suggestedCode: code,
    targetIdentification,
  };
}

export function buildCandidateFromEquivalent(
  candidate: EquivalentCandidate
): EquivalentCandidate {
  const code = candidate.suggestedCode?.trim();
  if (!code) {
    return candidate;
  }
  if (candidate.targetIdentification) {
    return candidate;
  }
  return buildCandidateFromCode(code);
}
