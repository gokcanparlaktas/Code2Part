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

export function getPneumaticCylinderCodeTemplate(
  series: ProductSeriesRecord
): string {
  return (
    PNEUMATIC_CYLINDER_CODE_TEMPLATES[series.id] ??
    series.suggestedCodeTemplate ??
    '{prefix}-{bore}-{stroke}'
  );
}

export function buildPneumaticCylinderSuggestedCode(
  source: ProductIdentification,
  targetSeries: ProductSeriesRecord
): string | null {
  if (
    source.bore.value === null ||
    source.stroke.value === null ||
    source.bore.requiresCheck ||
    source.stroke.requiresCheck ||
    source.bore.evidence !== 'code' ||
    source.stroke.evidence !== 'code'
  ) {
    return null;
  }

  const bore = Math.round(source.bore.value);
  const stroke = Math.round(source.stroke.value);
  const template = getPneumaticCylinderCodeTemplate(targetSeries);

  return applyTemplate(template, bore, stroke, targetSeries.codePrefix);
}
