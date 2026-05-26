import { validateCatalogV2Bundle } from '@/domain/catalog/validateCatalogV2';

import { cloneCatalogV2Bundle } from './catalogV2TestFixtures';

describe('validateCatalogV2 negative cases', () => {
  it('fails on duplicate normalized exampleCode across series', () => {
    const bundle = cloneCatalogV2Bundle();
    const target = bundle.productSeries.find((s) => s.id === 'smc_cp96')!;
    const donor = bundle.productSeries.find((s) => s.id === 'festo_dsbc')!;
    target.exampleCodes = [...target.exampleCodes, donor.exampleCodes[0]!];

    const result = validateCatalogV2Bundle(bundle);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'duplicate_example_code')).toBe(true);
    expect(result.errors.some((e) => e.messageTr.includes('Örnek kod çakışması'))).toBe(true);
  });

  it('fails when equivalenceGroupId is missing', () => {
    const bundle = cloneCatalogV2Bundle();
    bundle.productSeries[0]!.equivalenceGroupId = '';

    const result = validateCatalogV2Bundle(bundle);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'series_missing_equivalence_group')).toBe(true);
  });

  it('fails when equivalenceGroupId is unknown', () => {
    const bundle = cloneCatalogV2Bundle();
    bundle.productSeries[0]!.equivalenceGroupId = 'nonexistent_equivalence_group';

    const result = validateCatalogV2Bundle(bundle);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'series_unknown_equivalence_group')).toBe(true);
    expect(
      result.errors.some((e) => e.messageTr.includes('equivalenceGroupId katalogda bulunamadı'))
    ).toBe(true);
  });

  it('fails when checkRule ref is unknown', () => {
    const bundle = cloneCatalogV2Bundle();
    bundle.productSeries[0]!.checkRuleRefs.push({ ruleId: 'missing_check_rule_xyz' });

    const result = validateCatalogV2Bundle(bundle);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'series_unknown_check_rule')).toBe(true);
    expect(result.errors.some((e) => e.messageTr.includes('bilinmeyen kural'))).toBe(true);
  });

  it('fails when functionMapping ref is unknown', () => {
    const bundle = cloneCatalogV2Bundle();
    const hydraulic = bundle.productSeries.find((s) => s.resolverCategory === 'hydraulic_valve')!;
    hydraulic.functionMappingRefs = [
      ...(hydraulic.functionMappingRefs ?? []),
      { mappingId: 'missing_function_mapping_xyz' },
    ];

    const result = validateCatalogV2Bundle(bundle);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'series_unknown_function_mapping')).toBe(true);
    expect(result.errors.some((e) => e.messageTr.includes('bilinmeyen mapping'))).toBe(true);
  });

  it('fails when H7 is mapped to 24V DC in voltageCodes', () => {
    const bundle = cloneCatalogV2Bundle();
    const vickers = bundle.productSeries.find((s) => s.id === 'vickers_dg4v3')!;
    vickers.voltageCodes = [
      {
        code: 'H7',
        labelTr: '24 V DC',
        confidence: 'high',
        requiresCatalogCheck: false,
      },
    ];

    const result = validateCatalogV2Bundle(bundle);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'h7_mapped_as_24v')).toBe(true);
  });
});
