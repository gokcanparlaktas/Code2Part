import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import type { GeneratedEquivalentCandidate } from '@/types/equivalentCodeGeneration';
import type { ProductIdentification } from '@/types/product';

import { generateRollingBearingCodeSuggestions } from './generateRollingBearingCodeSuggestions';
import { getManufacturerSealSuffixCheckNotesTr } from './manufacturerSealSuffixNotes';
import { ROLLING_BEARING_SERIES_ID } from './rollingBearingIdentify';

export function buildRollingBearingEquivalentCandidates(
  source: ProductIdentification
): GeneratedEquivalentCandidate[] {
  if (!source.bearingDecode || source.seriesId !== ROLLING_BEARING_SERIES_ID) {
    return [];
  }

  if (source.bearingDecode.dimensions.status !== 'complete') {
    return [];
  }

  const series = getProductSeriesById(ROLLING_BEARING_SERIES_ID);
  if (!series) {
    return [];
  }

  const suggestions = generateRollingBearingCodeSuggestions(source.bearingDecode, {
    targetManufacturers: undefined,
  });

  return suggestions
    .filter((suggestion) => {
      if (!source.brand.value) {
        return true;
      }
      return suggestion.manufacturer !== source.brand.value.split(' ')[0];
    })
    .map((suggestion) => {
      const identified = identifyProduct(
        suggestion.suggestedCode,
        normalizeCode(suggestion.suggestedCode)
      );
      const checkNotes = getManufacturerSealSuffixCheckNotesTr(suggestion.manufacturer);

      return {
        generatedCode: suggestion.suggestedCode,
        manufacturer: suggestion.manufacturer,
        series: series.series,
        seriesId: series.id,
        generationStatus: suggestion.generationStatus,
        confidence: 'high',
        mappedFields: ['base_code', 'seal_or_shield', 'bore_diameter', 'outside_diameter', 'width'],
        unresolvedFields: [],
        checkNotes,
        requiresCheck: checkNotes.length > 0,
        generationTrace: {
          steps: [],
          summaryTr: 'Teknik profile göre üretici suffix tercihi ile üretildi.',
        },
        targetIdentification: identified.matched ? identified : null,
      } satisfies GeneratedEquivalentCandidate;
    });
}
