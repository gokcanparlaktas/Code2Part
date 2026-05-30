import { compareTwoProductCodes } from '../compareTwoProductCodes';
import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';

describe('compareTwoProductCodes rexroth spool', () => {
  it('same Rexroth E spool code appears in uyumlu, not kritik kontrol', () => {
    const result = compareTwoProductCodes(
      '4WE6E-6X/EG24N9K4',
      '4WE6E-6X/EG24K4'
    );

    expect(result.compatible.some((c) => c.label === FIELD_LABELS.spoolFunctionCode)).toBe(
      true
    );
    expect(result.checkItems.filter((c) => c.field === FIELD_LABELS.spoolFunctionCode)).toHaveLength(
      0
    );
  });

  it('same Rexroth E spool across 4WE6 and 4WE10 stays uyumlu when function token matches', () => {
    const result = compareTwoProductCodes(
      '4WE6E-6X/EG24N9K4',
      '4WE10E-3X/CG24N9K4'
    );

    expect(result.compatible.some((c) => c.label === FIELD_LABELS.spoolFunctionCode)).toBe(
      true
    );
    expect(result.checkItems.filter((c) => c.field === FIELD_LABELS.spoolFunctionCode)).toHaveLength(
      0
    );
  });
});
