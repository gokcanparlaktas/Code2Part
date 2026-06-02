import { getCodeCreatorFields } from '@/domain/codeCreator/getCodeCreatorSchema';
import { hydraulicCenterTypeOptionsForCreator } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';

describe('hydraulic center type creator select values', () => {
  it('creator catalog options expose stable non-empty values', () => {
    const creator = hydraulicCenterTypeOptionsForCreator();
    const values = creator.map((option) => option.value);
    expect(values.every((value) => value.length > 0)).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });

  it('code creator schema center_condition options match catalog values', () => {
    const centerField = getCodeCreatorFields({
      category: 'hydraulic_valve',
      mountingGroup: 'cetop_03_ng6',
      brandFilter: null,
    }).find(
      (field) => field.key === 'center_condition'
    );
    expect(centerField).toBeDefined();

    const values = centerField!.options.map((option) => option.value);
    expect(values.every((value) => value.length > 0)).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });
});
