/** NSK seal/shield suffix codes vs common SKF-style RS / 2RS / Z / ZZ naming. */
export const NSK_SEAL_SUFFIX_REFERENCE_LINES_TR = [
  { code: 'Z, ZS', descriptionTr: 'Tek taraflı metal kapak' },
  { code: 'ZZ, ZZS', descriptionTr: 'Çift taraflı metal kapak' },
  { code: 'DU', descriptionTr: 'Tek taraflı temaslı conta (≈ RS)' },
  { code: 'DDU', descriptionTr: 'Çift taraflı temaslı conta (≈ 2RS)' },
  { code: 'B, V', descriptionTr: 'Tek taraflı temasız conta' },
  { code: 'VV', descriptionTr: 'Çift taraflı temasız conta' },
] as const;

export function formatNskSealSuffixReferenceNoteTr(): string {
  const body = NSK_SEAL_SUFFIX_REFERENCE_LINES_TR.map(
    (entry) => `${entry.code} — ${entry.descriptionTr}`
  ).join('; ');
  return `NSK conta/kapak kodları (SKF tarzı RS / 2RS / Z / ZZ karşılığı farklı yazılır): ${body}.`;
}

export function getNskEquivalentCheckNotesTr(manufacturer: string): string[] {
  if (manufacturer !== 'NSK') {
    return [];
  }
  return [formatNskSealSuffixReferenceNoteTr()];
}
