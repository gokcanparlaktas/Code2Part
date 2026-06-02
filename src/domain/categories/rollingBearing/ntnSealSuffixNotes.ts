/** NTN seal/shield suffix codes vs common SKF-style 2RS / ZZ naming. */
export const NTN_SEAL_SUFFIX_REFERENCE_LINES_TR = [
  { code: 'LB', descriptionTr: 'Tek taraflı sentetik conta (temasız)' },
  { code: 'LLB', descriptionTr: 'Çift taraflı sentetik conta (temasız)' },
  { code: 'LU', descriptionTr: 'Tek taraflı sentetik conta (temaslı)' },
  { code: 'LLU', descriptionTr: 'Çift taraflı sentetik conta (temaslı)' },
  { code: 'LH', descriptionTr: 'Tek taraflı sentetik conta (düşük tork)' },
  { code: 'LLH', descriptionTr: 'Çift taraflı sentetik conta (düşük tork)' },
] as const;

export function formatNtnSealSuffixReferenceNoteTr(): string {
  const body = NTN_SEAL_SUFFIX_REFERENCE_LINES_TR.map(
    (entry) => `${entry.code} — ${entry.descriptionTr}`
  ).join('; ');
  return `NTN conta/kapak kodları (diğer markalardaki 2RS / ZZ karşılığı farklı yazılır): ${body}.`;
}

export function getNtnEquivalentCheckNotesTr(manufacturer: string): string[] {
  if (manufacturer !== 'NTN') {
    return [];
  }
  return [formatNtnSealSuffixReferenceNoteTr()];
}
