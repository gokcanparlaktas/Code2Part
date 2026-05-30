import {
  generateBestHydraulicValveEquivalentCode,
  generateHydraulicValveEquivalentCandidates,
} from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/hydraulicValveEquivalentCodeGenerator';
import { synthesizeHydraulicValveEquivalentCode as synthesizeLegacyHydraulicCode } from '@/domain/categories/hydraulicValve/synthesizeHydraulicValveEquivalentCode';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import type { GeneratedEquivalentCandidate } from '@/types/equivalentCodeGeneration';
import type { ProductIdentification, ProductSeriesRecord } from '@/types/product';

import { getHydraulicValveExampleCode } from './hydraulicValveSuggestedCode';

function isRexrothYukenPair(sourceSeriesId: string, targetSeriesId: string): boolean {
  const rexroth = sourceSeriesId.startsWith('rexroth_4we') || targetSeriesId.startsWith('rexroth_4we');
  const yuken = sourceSeriesId.startsWith('yuken_dsg') || targetSeriesId.startsWith('yuken_dsg');
  return rexroth && yuken;
}

function sharesEquivalenceGroup(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): boolean {
  if (!source.seriesId) {
    return false;
  }

  const sourceSeries = getProductSeriesById(source.seriesId);
  if (!sourceSeries) {
    return false;
  }

  const sourceGroup = sourceSeries.equivalenceGroupId ?? sourceSeries.equivalenceGroup;
  const targetGroup = targetSeries.equivalenceGroupId ?? targetSeries.equivalenceGroup;
  return Boolean(sourceGroup && targetGroup && sourceGroup === targetGroup);
}

export function buildHydraulicValveEquivalentCandidates(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): GeneratedEquivalentCandidate[] {
  if (!sharesEquivalenceGroup(source, targetSeries)) {
    return [];
  }

  if (source.seriesId && isRexrothYukenPair(source.seriesId, targetSeries.id)) {
    return generateHydraulicValveEquivalentCandidates(source, targetSeries);
  }

  const legacy = synthesizeLegacyHydraulicCode(source, targetSeries);
  if (legacy) {
    return [
      {
        generatedCode: legacy,
        manufacturer: targetSeries.brand,
        series: targetSeries.series,
        seriesId: targetSeries.id,
        generationStatus: 'generated_full',
        confidence: 'medium',
        mappedFields: ['target_family'],
        unresolvedFields: [],
        checkNotes: [],
        requiresCheck: false,
        generationTrace: {
          steps: [],
          summaryTr: 'Hedef seri için kural tabanlı kod üretildi.',
        },
      },
    ];
  }

  const example = getHydraulicValveExampleCode(targetSeries);
  if (!example) {
    return [];
  }

  return [
    {
      generatedCode: example,
      manufacturer: targetSeries.brand,
      series: targetSeries.series,
      seriesId: targetSeries.id,
      generationStatus: 'exact_known',
      confidence: 'low',
      mappedFields: [],
      unresolvedFields: ['full_order_code'],
      checkNotes: ['Kaynak koddan hedef kod üretilemedi; katalog örneği gösterildi.'],
      requiresCheck: true,
      generationTrace: {
        steps: [],
        summaryTr: 'Katalog örneği kullanıldı.',
      },
      isExactKnownExample: true,
    },
  ];
}

export function buildHydraulicValveSuggestedCode(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): string | null {
  if (source.seriesId && isRexrothYukenPair(source.seriesId, targetSeries.id)) {
    return generateBestHydraulicValveEquivalentCode(source, targetSeries)?.generatedCode ?? null;
  }

  return buildHydraulicValveEquivalentCandidates(source, targetSeries)[0]?.generatedCode ?? null;
}
