import {
  buildPneumaticCushioningOptions,
  buildPneumaticExtraOptions,
  buildPneumaticRodEndOptions,
  buildPneumaticSensorOptions,
  resolveSeriesCushioningToken,
  resolveSeriesExtraToken,
  resolveSeriesRodEndToken,
  resolveSeriesSensorToken,
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

  it('lists pneumatic cushioning and sensor as Yok/Var; rod end as thread types', () => {
    expect(buildPneumaticCushioningOptions()).toEqual([
      { value: 'none', labelTr: 'Yok' },
      { value: 'with', labelTr: 'Var' },
    ]);
    expect(buildPneumaticSensorOptions()).toEqual([
      { value: 'none', labelTr: 'Yok' },
      { value: 'with', labelTr: 'Var' },
    ]);
    expect(buildPneumaticRodEndOptions()).toEqual([
      { value: 'none', labelTr: 'Belirtilmedi' },
      { value: 'male_external', labelTr: 'Dış diş (erkek)' },
      { value: 'female_internal', labelTr: 'İç diş (dişi)' },
    ]);
  });

  it('lists extra options with descriptive labels and hides ambiguous D/A tokens', () => {
    const extras = buildPneumaticExtraOptions();

    expect(extras[0]).toEqual({ value: 'none', labelTr: 'Yok' });
    expect(extras.some((option) => option.value === 'SDB')).toBe(true);
    expect(extras.every((option) => !['D', 'A'].includes(option.value))).toBe(true);
    expect(extras.find((option) => option.value === 'SDB')?.labelTr).toContain('SDB —');
  });

  it('resolves cushioning token per series when Var is selected', () => {
    expect(resolveSeriesCushioningToken('festo_dsbc', 'with')).toBe('PPVA');
    expect(resolveSeriesCushioningToken('festo_adn', 'with')).toBe('P');
    expect(resolveSeriesCushioningToken('smc_cp96', 'with')).toBe('C');
    expect(resolveSeriesCushioningToken('parker_p1d', 'with')).toBeNull();
    expect(resolveSeriesCushioningToken('festo_dsbc', 'none')).toBeNull();
    expect(resolveSeriesCushioningToken('festo_dsbc', 'PPSA')).toBe('PPSA');
    expect(resolveSeriesCushioningToken('festo_dsbc', 'PPVA')).toBe('PPVA');
  });

  it('resolves sensor and rod end tokens per series', () => {
    expect(resolveSeriesSensorToken('festo_dsbc', 'with')).toBe('N3');
    expect(resolveSeriesSensorToken('festo_adn', 'with')).toBe('A');
    expect(resolveSeriesSensorToken('smc_cp96', 'with')).toBeNull();
    expect(resolveSeriesRodEndToken('festo_adn', 'female_internal')).toBe('I');
    expect(resolveSeriesRodEndToken('parker_p1d', 'male_external')).toBe('N');
    expect(resolveSeriesRodEndToken('festo_dsbc', 'male_external')).toBeNull();
    expect(resolveSeriesRodEndToken('festo_adn', 'none')).toBeNull();
    expect(resolveSeriesExtraToken('smc_cp96', 'SDB')).toBe('SDB');
    expect(resolveSeriesExtraToken('festo_dsbc', 'SDB')).toBeNull();
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
