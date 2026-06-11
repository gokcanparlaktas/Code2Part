import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import {
  generatePneumaticCodeCandidates,
  pickPreferredPneumaticCodeCandidate,
} from '@/domain/catalogData/pneumatics/generatePneumaticCodeCandidate';
import type { EquivalentGenerationMetadata } from '@/types/equivalentCodeGeneration';
import type {
  ProductIdentification,
  ProductSeriesRecord,
} from '@/types/product';

const PNEUMATIC_CYLINDER_CODE_TEMPLATES: Record<string, string> = {
  festo_dsbc: 'DSBC-{bore}-{stroke}',
  festo_adn: 'ADN-{bore}-{stroke}',
  festo_dsnu: 'DSNU-{bore}-{stroke}',
  smc_cp96: 'CP96-{bore}-{stroke}',
  smc_c96: 'C96-{bore}-{stroke}',
  smc_cq2: 'CQ2B{bore}-{stroke}',
  smc_c85: 'C85N{bore}-{stroke}',
  parker_p1d: 'P1D-{bore}-{stroke}',
  aventics_pra: 'PRA-{bore}-{stroke}',
  airtac_si: 'SI-{bore}-{stroke}',
};

/** Preferred catalog template substring per target series (full order-key shape). */
const SERIES_CATALOG_TEMPLATE_HINT: Record<string, string> = {
  festo_dsbc: 'DSBC-',
  festo_adn: 'ADN-',
  festo_dsnu: 'DSNU-',
  smc_cp96: 'CP96SDB',
  smc_c96: 'C96SDB',
  smc_cq2: 'CQ2B',
  smc_c85: 'C85N',
  parker_p1d: 'P1D-S',
  aventics_pra: 'PRA-DA',
  airtac_si: 'SI',
};

export type PneumaticSuggestedCodeBuildResult = {
  suggestedCode: string | null;
  catalogDerived: boolean;
  needsReview: boolean;
  templateId?: string;
};

function applyTemplate(
  template: string,
  bore: number,
  stroke: number,
  codePrefix: string
): string {
  return template
    .replace(/\{bore\}/g, String(bore))
    .replace(/\{stroke\}/g, String(stroke))
    .replace(/\{prefix\}/g, codePrefix);
}

function extractCushioningTokenFromSource(source: ProductIdentification): string | undefined {
  const attrs = getTechnicalAttributes(source);
  const cushioning = attrs.find(
    (a) => a.key === 'cushioning_type' || a.key === 'cushioning_token'
  );
  if (!cushioning?.value) {
    return undefined;
  }
  return String(cushioning.value);
}

/** Seriler whose order-key shape must come from catalog-data templates (not dash suffix). */
export const PNEUMATIC_CATALOG_ORDER_KEY_SERIES_IDS = new Set([
  'smc_cp96',
  'smc_c96',
  'smc_cq2',
  'smc_c85',
  'parker_p1d',
  'aventics_pra',
  'airtac_si',
]);

export function pickPneumaticCatalogCodeCandidate(
  targetSeries: ProductSeriesRecord,
  boreMm: number,
  strokeMm: number,
  options?: {
    cushioningToken?: string;
    preferAppCurrentShape?: boolean;
  }
) {
  const templateHint = SERIES_CATALOG_TEMPLATE_HINT[targetSeries.id];
  const input = {
    brand: targetSeries.brand,
    series: targetSeries.series,
    boreMm,
    strokeMm,
    cushioningToken: options?.cushioningToken,
  };
  const candidates = generatePneumaticCodeCandidates(input);

  if (templateHint) {
    const matched = candidates.find(
      (c) => c.code.includes(templateHint) || c.templateId.includes(templateHint)
    );
    if (matched) {
      return matched;
    }
  }

  return pickPreferredPneumaticCodeCandidate(input, {
    preferAppCurrentShape:
      options?.preferAppCurrentShape ?? targetSeries.id === 'parker_p1d',
  });
}

function pickCatalogCandidate(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord,
  bore: number,
  stroke: number
) {
  const sameBrand = source.brand.value === targetSeries.brand;
  const cushioningToken = sameBrand ? extractCushioningTokenFromSource(source) : undefined;

  return pickPneumaticCatalogCodeCandidate(targetSeries, bore, stroke, {
    cushioningToken,
  });
}

export function getPneumaticCylinderCodeTemplate(
  series: ProductSeriesRecord
): string {
  return (
    PNEUMATIC_CYLINDER_CODE_TEMPLATES[series.id] ??
    series.suggestedCodeTemplate ??
    '{prefix}-{bore}-{stroke}'
  );
}

export function buildPneumaticCylinderSuggestedCodeResult(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): PneumaticSuggestedCodeBuildResult {
  if (
    source.bore.value === null ||
    source.stroke.value === null ||
    source.bore.requiresCheck ||
    source.stroke.requiresCheck ||
    source.bore.evidence !== 'code' ||
    source.stroke.evidence !== 'code'
  ) {
    return { suggestedCode: null, catalogDerived: false, needsReview: false };
  }

  const bore = Math.round(source.bore.value);
  const stroke = Math.round(source.stroke.value);

  const catalogCandidate = pickCatalogCandidate(source, targetSeries, bore, stroke);
  if (catalogCandidate?.code) {
    return {
      suggestedCode: catalogCandidate.code,
      catalogDerived: true,
      needsReview: catalogCandidate.needsReview,
      templateId: catalogCandidate.templateId,
    };
  }

  const template = getPneumaticCylinderCodeTemplate(targetSeries);
  return {
    suggestedCode: applyTemplate(template, bore, stroke, targetSeries.codePrefix),
    catalogDerived: false,
    needsReview: false,
  };
}

export function buildPneumaticEquivalentGenerationMetadata(
  buildResult: PneumaticSuggestedCodeBuildResult
): EquivalentGenerationMetadata | undefined {
  if (!buildResult.suggestedCode || !buildResult.catalogDerived) {
    return undefined;
  }

  return {
    generationStatus: 'generated_full',
    requiresCheck: buildResult.needsReview,
    generationCheckNotes: [
      'Katalog order-key şablonundan türetilmiş tam kod adayı. Sipariş öncesi üretici kataloğu ile doğrulanmalıdır.',
    ],
    generationTraceSummaryTr: buildResult.templateId
      ? `Catalog-data şablonu: ${buildResult.templateId}`
      : 'Catalog-data kod adayı',
  };
}

export function buildPneumaticCylinderSuggestedCode(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): string | null {
  return buildPneumaticCylinderSuggestedCodeResult(source, targetSeries).suggestedCode;
}
