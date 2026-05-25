import equivalentSeriesData from '@/data/equivalentSeries.json';
import {
  buildSuggestedEquivalentCode,
  getProductSeriesById,
  identifyProduct,
} from './identifyProduct';
import type { EquivalentCandidate } from '@/types/compatibility';
import type {
  EquivalentGroupRecord,
  ProductIdentification,
} from '@/types/product';

const equivalentGroups = equivalentSeriesData as EquivalentGroupRecord[];

export function findEquivalents(
  source: ProductIdentification
): EquivalentCandidate[] {
  if (!source.seriesId || source.outcome === 'not_found') {
    return [];
  }

  const group = equivalentGroups.find((g) =>
    g.seriesIds.includes(source.seriesId!)
  );
  if (!group) {
    return [];
  }

  return group.seriesIds
    .filter((id) => id !== source.seriesId)
    .map((seriesId) => {
      const series = getProductSeriesById(seriesId);
      if (!series) {
        return null;
      }

      const suggestedCode = buildSuggestedEquivalentCode(source, series);
      const targetIdentification = suggestedCode
        ? identifyProduct(suggestedCode, suggestedCode)
        : null;

      return {
        seriesId: series.id,
        brand: series.brand,
        series: series.series,
        productType: series.productType,
        standardFamily: series.standardFamily,
        suggestedCode,
        targetIdentification,
      } satisfies EquivalentCandidate;
    })
    .filter((candidate): candidate is EquivalentCandidate => candidate !== null);
}
