/** Shared routing helpers for Eaton / Vickers catalog-data integration. */

export function isEatonVickersManufacturer(manufacturer: string): boolean {
  const normalized = manufacturer.trim().toLowerCase();
  return (
    normalized === 'vickers' ||
    normalized === 'eaton' ||
    normalized.includes('eaton vickers')
  );
}

/** Maps DG4V spring arrangement code to functional-symbol arrangement context. */
export function springArrangementToSpoolContext(springArrangement: string): string | undefined {
  const map: Record<string, string> = {
    N: 'NV',
    A: 'AV',
    AL: 'ALV',
    B: 'BV',
    BL: 'BLV',
  };
  return map[springArrangement.trim().toUpperCase()];
}
