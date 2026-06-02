import {
  buildPneumaticCushioningOptions,
  buildPneumaticVariantOptions,
  resolveSeriesCushioningToken,
} from '@/domain/codeCreator/pneumaticCreatorCatalogOptions';
import { buildHydraulicCoilVoltageOptions } from '@/domain/codeCreator/hydraulicCoilVoltageCatalogOptions';
import { getCodeCreatorFields } from '@/domain/codeCreator/getCodeCreatorSchema';

describe('code creator field options', () => {
  it('exposes unified DC voltage labels without ordering tokens', () => {
    const options = buildHydraulicCoilVoltageOptions();
    expect(options.some((option) => option.value === 'dc_24v' && option.labelTr === '24 V DC')).toBe(
      true
    );
    expect(options.every((option) => !option.labelTr.includes('EG24'))).toBe(true);
    expect(options.every((option) => !option.labelTr.includes('D24'))).toBe(true);
  });

  it('lists pneumatic cushioning as Yok/Var only and variant tokens when needed', () => {
    const cushioning = buildPneumaticCushioningOptions();
    const variants = buildPneumaticVariantOptions();

    expect(cushioning).toEqual([
      { value: 'none', labelTr: 'Yok' },
      { value: 'with', labelTr: 'Var' },
    ]);
    expect(variants.some((option) => option.value === 'N3')).toBe(true);
  });

  it('resolves cushioning token per series when Var is selected', () => {
    expect(resolveSeriesCushioningToken('festo_dsbc', 'with')).toBe('PPVA');
    expect(resolveSeriesCushioningToken('smc_cp96', 'with')).toBe('PPVA');
    expect(resolveSeriesCushioningToken('festo_dsbc', 'none')).toBeNull();
    expect(resolveSeriesCushioningToken('festo_dsbc', 'PPSA')).toBe('PPSA');
    expect(resolveSeriesCushioningToken('festo_dsbc', 'PPVA')).toBe('PPVA');
  });

  it('shows Rexroth/Yuken design fields only when that brand is selected', () => {
    const allBrands = getCodeCreatorFields({
      category: 'hydraulic_valve',
      brandFilter: null,
    }).map((field) => field.key);
    const rexroth = getCodeCreatorFields({
      category: 'hydraulic_valve',
      brandFilter: 'rexroth',
    }).map((field) => field.key);
    const yuken = getCodeCreatorFields({
      category: 'hydraulic_valve',
      brandFilter: 'yuken',
    }).map((field) => field.key);

    expect(allBrands).not.toContain('design_series');
    expect(allBrands).not.toContain('design_number');
    expect(rexroth).toContain('design_series');
    expect(rexroth).not.toContain('design_number');
    expect(yuken).toContain('design_number');
    expect(yuken).not.toContain('design_series');
  });
});
