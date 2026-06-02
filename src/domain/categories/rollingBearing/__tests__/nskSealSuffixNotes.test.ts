import {
  formatNskSealSuffixReferenceNoteTr,
  getNskEquivalentCheckNotesTr,
} from '../nskSealSuffixNotes';

describe('nskSealSuffixNotes', () => {
  it('returns reference note only for NSK', () => {
    expect(getNskEquivalentCheckNotesTr('NSK')).toHaveLength(1);
    expect(getNskEquivalentCheckNotesTr('NTN')).toEqual([]);
  });

  it('lists Z through VV with RS / 2RS equivalents', () => {
    const note = formatNskSealSuffixReferenceNoteTr();
    expect(note).toContain('DU');
    expect(note).toContain('≈ RS');
    expect(note).toContain('DDU');
    expect(note).toContain('≈ 2RS');
    expect(note).toContain('ZZ');
    expect(note).toContain('VV');
  });
});
