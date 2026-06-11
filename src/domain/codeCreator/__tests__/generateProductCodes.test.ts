import { buildHydraulicCenterTypeCatalogOptions } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import { buildPneumaticCylinderSuggestedCode } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderSuggestedCode';
import { generateProductCodes } from '@/domain/codeCreator/generateProductCodes';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';

function closedCenterOptionId(): string {
  const match = buildHydraulicCenterTypeCatalogOptions().find((option) =>
    option.labelTr.includes('P,T,A,B Kapalı')
  );
  if (!match) {
    throw new Error('closed center catalog option not found');
  }
  return match.id;
}

describe('generateProductCodes', () => {
  it('exposes catalog-backed center type options beyond the legacy five', () => {
    expect(buildHydraulicCenterTypeCatalogOptions().length).toBeGreaterThan(5);
  });

  it('generates Rexroth full code when brand is Rexroth and attributes are complete', () => {
    const result = generateProductCodes({
      category: 'hydraulic_valve',
      mountingGroup: 'cetop_03_ng6',
      brandFilter: 'rexroth',
      selections: {
        ways_positions: '4_3',
        center_condition: closedCenterOptionId(),
        coil_voltage: 'dc_24v',
        manual_override: 'with',
        connector_type: 'standard',
        design_series: '62',
      },
    });

    expect(result.codes).toHaveLength(1);
    expect(result.codes[0]?.code).toBe('4WE6E-62/EG24N9K4');
    expect(result.codes[0]?.code).not.toMatch(/6X|7X/i);
    expect(result.codes[0]?.status).toBe('generated_full');
  });

  it('generates multiple brand codes when brand filter is empty', () => {
    const result = generateProductCodes({
      category: 'hydraulic_valve',
      mountingGroup: 'cetop_03_ng6',
      brandFilter: null,
      selections: {
        ways_positions: '4_3',
        center_condition: closedCenterOptionId(),
        coil_voltage: 'dc_24v',
        manual_override: 'with',
        connector_type: 'standard',
      },
    });

    const brands = result.codes.map((entry) => entry.brand);
    expect(brands).toContain('Rexroth');
    expect(brands).toContain('Yuken');
    expect(result.codes.find((entry) => entry.brand === 'Yuken')?.code).toBe(
      'DSG-01-3C2-D24-N1-70'
    );
  });

  it('generates pneumatic cylinder codes with optional suffix tokens', () => {
    const result = generateProductCodes({
      category: 'pneumatic_cylinder',
      brandFilter: null,
      selections: {
        bore: '50',
        stroke: '100',
        cushioning_type: 'with',
        sensor_option: 'with',
      },
    });

    expect(result.codes.some((entry) => entry.code === 'DSBC-50-100-PPVA-N3')).toBe(true);
    expect(result.codes.some((entry) => entry.code === 'CP96SDB50-100C')).toBe(true);
    expect(result.codes.some((entry) => entry.code === 'P1D-S050MS-0100')).toBe(true);
    expect(result.codes.some((entry) => entry.code === 'PRA-DA-050-0100')).toBe(true);
    expect(result.codes.every((entry) => entry.brand !== 'SMC' || !entry.code.includes('N3'))).toBe(
      true
    );
    expect(result.codes.every((entry) => !entry.code.includes('PPVA') || entry.brand === 'Festo')).toBe(
      true
    );
  });

  it('generates bare pneumatic codes when optional suffixes are none', () => {
    const result = generateProductCodes({
      category: 'pneumatic_cylinder',
      brandFilter: null,
      selections: {
        bore: '50',
        stroke: '100',
        cushioning_type: 'none',
        sensor_option: 'none',
        rod_end_option: 'none',
        extra_option: 'none',
      },
    });

    expect(result.codes.some((entry) => entry.code === 'DSBC-50-100')).toBe(true);
    expect(result.codes.some((entry) => entry.code === 'CP96SDB50-100C')).toBe(true);
    expect(result.codes.some((entry) => entry.code === 'P1D-S050MS-0100')).toBe(true);
  });

  it('matches equivalent suggested codes for catalog order-key series', () => {
    const source = identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3'));
    const creator = generateProductCodes({
      category: 'pneumatic_cylinder',
      brandFilter: null,
      selections: {
        bore: '50',
        stroke: '100',
        cushioning_type: 'with',
        sensor_option: 'with',
      },
    });

    for (const seriesId of ['smc_cp96', 'parker_p1d', 'aventics_pra'] as const) {
      const targetSeries = getProductSeriesById(seriesId)!;
      const equivalent = buildPneumaticCylinderSuggestedCode(source, targetSeries);
      const created = creator.codes.find((entry) => entry.seriesId === seriesId)?.code;
      expect(created).toBe(equivalent);
    }
  });
});
