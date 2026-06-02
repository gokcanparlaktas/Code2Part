import {
  parseRexrothWE6FunctionTokenParts,
  rexrothWE6OrderingSpoolTokenForEquivalent,
  REXROTH_WE6_SOFT_TRANSITION_NOTE_TR,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import {
  isConfidentRexrothSpoolMapping,
  resolveConfidentRexrothSpoolCode,
  resolveConfidentYukenSpoolCode,
  softTransitionInfoNotesForSpool,
} from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/rexrothYukenGenerationMappings';
import {
  clearHydraulicCenterTypeCatalogOptionsCache,
  hydraulicCenterTypeOptionsForCreator,
} from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';

describe('Rexroth C46 soft transition', () => {
  beforeEach(() => {
    clearHydraulicCenterTypeCatalogOptionsCache();
  });

  it('parses C46 as C-family ordering token', () => {
    expect(parseRexrothWE6FunctionTokenParts('C46')).toEqual({
      baseSpoolSymbol: 'C',
      functionToken: 'C46',
      switchingPositionVariant: null,
    });
    expect(rexrothWE6OrderingSpoolTokenForEquivalent('C46')).toBe('C46');
    expect(rexrothWE6OrderingSpoolTokenForEquivalent('C')).toBe('C46');
  });

  it('lists Ofset merkez once with C46 in creator options', () => {
    const creator = hydraulicCenterTypeOptionsForCreator();
    const offset = creator.filter((option) => option.labelTr.includes('Ofset merkez'));

    expect(offset).toHaveLength(1);
    expect(offset[0]?.labelTr).toContain('P-A Bağlı, B-T Bağlı');
    expect(offset[0]?.labelTr).not.toMatch(/Belirsiz/i);
  });

  it('maps C46 confidently without treating soft transition as check note', () => {
    expect(isConfidentRexrothSpoolMapping('C46')).toBe(true);
    expect(resolveConfidentYukenSpoolCode('C46')).toBeTruthy();
    expect(softTransitionInfoNotesForSpool('C46')).toEqual([REXROTH_WE6_SOFT_TRANSITION_NOTE_TR]);
  });

  it('generates Rexroth ordering segment C46 for Yuken ofset mapping', () => {
    const yuken = resolveConfidentYukenSpoolCode('C46');
    expect(yuken).toBeTruthy();
    if (yuken) {
      expect(resolveConfidentRexrothSpoolCode(yuken)).toBe('C46');
    }
  });
});
