import {
  buildHydraulicCenterTypeCatalogOptions,
  hydraulicCenterTypeOptionsForCreator,
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
  });

  it('creator options are unique and never show Belirsiz PTAB rows', () => {
    const creator = hydraulicCenterTypeOptionsForCreator();
    const labels = creator.map((option) => option.labelTr);

    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.every((label) => !/Belirsiz/i.test(label))).toBe(true);
    expect(labels.filter((label) => label.includes('Açık merkez'))).toHaveLength(1);
    expect(labels.filter((label) => label.includes('Basınç merkez'))).toHaveLength(1);
    expect(labels.filter((label) => label.includes('Ofset merkez'))).toHaveLength(2);
  });

  it('includes closed center WE6 mapping for code generation', () => {
    const closed = buildHydraulicCenterTypeCatalogOptions().find((option) =>
      option.labelTr.startsWith('P,T,A,B Kapalı')
    );

    expect(closed?.rexrothSpoolToken).toBe('E');
    expect(closed?.portState).toBeTruthy();
    expect(closed?.id).toBe(serializePortStateKey(closed!.portState!));
  });

  it('creator options exclude all-port-uncertain PTAB rows', () => {
    const creator = hydraulicCenterTypeOptionsForCreator();

    expect(creator.every((option) => !/Belirsiz/i.test(option.labelTr))).toBe(true);
  });

  it('creator options never show raw per-port Bağlı labels', () => {
    const creator = hydraulicCenterTypeOptionsForCreator();

    expect(
      creator.every(
        (option) =>
          !/^[PTAB] Bağlı, [PTAB] Bağlı, [PTAB] Bağlı, [PTAB] Bağlı$/.test(option.labelTr)
      )
    ).toBe(true);
    expect(creator.some((option) => option.labelTr.includes('P-B Bağlı, T-A Bağlı'))).toBe(
      true
    );
  });
});
