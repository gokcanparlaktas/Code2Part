import type { ConfidenceLevel, ProductIdentification } from '@/types/product';

import type { CategoryReliabilityResult } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderReliability';

function hasSeries(identification: ProductIdentification): boolean {
  return Boolean(identification.seriesId && identification.series.value);
}

function hasCetop(identification: ProductIdentification): boolean {
  return Boolean(identification.cetopNgSize?.value);
}

export function calculateHydraulicValveReliability(
  identification: ProductIdentification
): CategoryReliabilityResult {
  if (!hasSeries(identification)) {
    return {
      confidence: 'unknown',
      warningTitleTr: 'Ürün tipi netleştirilemedi.',
      warningMessageTr: 'Kodun seri/prefix kısmı kontrol edilmelidir.',
    };
  }

  // Category-specific: hydraulic valves should not be penalized for missing cylinder fields.
  // If series and CETOP/NG are known and the code provides at least one clear attribute (voltage/spool),
  // treat identification as high confidence.
  const hasCodeSignals =
    identification.valveCoilVoltage?.evidence === 'code' ||
    identification.valveSpoolFunction?.evidence === 'code';

  const base: ConfidenceLevel =
    hasCetop(identification) && hasCodeSignals ? 'high' : hasCetop(identification) ? 'medium' : 'low';

  // Even when optional checks exist (spool/voltage/connector), avoid marking the identification itself as low.
  // Keep caution via a notice message instead.
  const notice =
    'Bu ürün hidrolik valf olarak tanımlandı. Sembol, bobin, konnektör ve katalog değerleri kontrol edilmelidir.';

  if (base === 'low') {
    return {
      confidence: 'medium',
      seriesOnlyNoticeTr: notice,
    };
  }

  return {
    confidence: base,
    seriesOnlyNoticeTr: identification.outcome === 'series_only' ? notice : undefined,
  };
}

