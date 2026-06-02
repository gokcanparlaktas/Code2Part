import { generateProductCodes } from '@/domain/codeCreator/generateProductCodes';
import { buildHydraulicCenterTypeCatalogOptions } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import { isRexrothWEOrderingSpoolSymbol } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import { completeProductCode } from '@/domain/resolver/completeProductCode';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('Rexroth catalog spool letters F, P, L', () => {
  it('treats F, P, L as valid WE6 ordering spool symbols', () => {
    expect(isRexrothWEOrderingSpoolSymbol('F')).toBe(true);
    expect(isRexrothWEOrderingSpoolSymbol('P')).toBe(true);
    expect(isRexrothWEOrderingSpoolSymbol('L')).toBe(true);
  });

  it('parses and fully identifies 4WE6F-6X/EG24N9K4', () => {
    const code = '4WE6F-6X/EG24N9K4';
    expect(identifyProduct(code, normalizeCode(code)).outcome).toBe('full');
    expect(completeProductCode(code).completionStatus).toBe('already_complete');
    expect(completeProductCode(code).missingFields).toEqual([]);
  });

  it('parses and fully identifies 4WE6F-62/EG24N9K4 from code creator', () => {
    const code = '4WE6F-62/EG24N9K4';
    expect(identifyProduct(code, normalizeCode(code)).outcome).toBe('full');
    expect(completeProductCode(code).completionStatus).toBe('already_complete');
  });

  it('generates 4WE6F when PTAB center maps to catalog token F', () => {
    const fCenter = buildHydraulicCenterTypeCatalogOptions().find(
      (option) => option.rexrothSpoolToken === 'F'
    );
    expect(fCenter?.labelTr).toContain('P');
    expect(fCenter?.yukenFunctionToken).toBeTruthy();

    const result = generateProductCodes({
      category: 'hydraulic_valve',
      mountingGroup: 'cetop_03_ng6',
      brandFilter: 'rexroth',
      selections: {
        ways_positions: '4_3',
        center_condition: fCenter!.id,
        coil_voltage: 'dc_24v',
        manual_override: 'with',
        connector_type: 'standard',
        design_series: '62',
      },
    });

    expect(result.codes[0]?.code).toBe('4WE6F-62/EG24N9K4');
  });

  it('generates 4WE6P for catalog P center (P-B-T, A blocked)', () => {
    const pCenter = buildHydraulicCenterTypeCatalogOptions().find(
      (option) => option.rexrothSpoolToken === 'P'
    );
    expect(pCenter).toBeDefined();

    const result = generateProductCodes({
      category: 'hydraulic_valve',
      mountingGroup: 'cetop_03_ng6',
      brandFilter: 'rexroth',
      selections: {
        ways_positions: '4_3',
        center_condition: pCenter!.id,
        coil_voltage: 'dc_24v',
        manual_override: 'with',
        connector_type: 'standard',
        design_series: '62',
      },
    });

    expect(result.codes[0]?.code).toBe('4WE6P-62/EG24N9K4');
  });
});
