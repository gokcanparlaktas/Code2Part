import {
  formatNtnSealSuffixReferenceNoteTr,
  getNtnEquivalentCheckNotesTr,
} from '../ntnSealSuffixNotes';

describe('ntnSealSuffixNotes', () => {
  it('returns reference note only for NTN', () => {
    expect(getNtnEquivalentCheckNotesTr('NTN')).toHaveLength(1);
    expect(getNtnEquivalentCheckNotesTr('SKF')).toEqual([]);
  });

  it('lists LB through LLH meanings in Turkish', () => {
    const note = formatNtnSealSuffixReferenceNoteTr();
    expect(note).toContain('LB');
    expect(note).toContain('temasız');
    expect(note).toContain('LLU');
    expect(note).toContain('temaslı');
    expect(note).toContain('LLH');
    expect(note).toContain('düşük tork');
  });
});
