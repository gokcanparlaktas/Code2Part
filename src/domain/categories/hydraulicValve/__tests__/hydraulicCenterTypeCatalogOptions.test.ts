import {
  buildHydraulicCenterTypeCatalogOptions,
  serializePortStateKey,
} from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';

describe('hydraulicCenterTypeCatalogOptions', () => {
  it('lists unique PTAB center labels from spool catalogs', () => {
    const options = buildHydraulicCenterTypeCatalogOptions();

    expect(options.length).toBeGreaterThanOrEqual(10);
    expect(
      options.filter(
        (option) => option.labelTr.includes('(') || /Kapalı|Bağlı|Açık/i.test(option.labelTr)
      ).length
    ).toBeGreaterThanOrEqual(10);
    expect(new Set(options.map((option) => option.id)).size).toBe(options.length);
    expect(new Set(options.map((option) => option.labelTr)).size).toBe(options.length);
  });

  it('includes closed center WE6 mapping for code generation', () => {
    const closed = buildHydraulicCenterTypeCatalogOptions().find((option) =>
      option.labelTr.startsWith('P,T,A,B Kapalı')
    );

    expect(closed?.rexrothSpoolToken).toBe('E');
    expect(closed?.portState).toBeTruthy();
    expect(closed?.id).toBe(serializePortStateKey(closed!.portState!));
  });
});
