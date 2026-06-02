/**
 * Additional Rexroth WE6 ordering-code spool letters from RE 23178 symbol tables
 * (data/catalog-data/.../spool-symbol-candidates.json). These are real order-code
 * characters (e.g. 4WE6F-62), not substitutes for E/C/D.
 */

import type { RexrothWE6SpoolSemantics } from './rexrothWE6SpoolSemantics';

/** Single-letter spool symbols seen in WE6 catalog (RE 23178). */
export const REXROTH_WE6_CATALOG_ORDERING_SPOOL_LETTERS =
  'ABCDEFGHJKLMOPQRTUVWY';

const CATALOG_HINT =
  'RE 23178 sembol tablosu; kesin hidrolik davranış katalogdan doğrulanmalıdır.';

/**
 * WE6 letters beyond the original MVP subset (A,B,C,D,E,G,H,J,Y), with PTAB/center notes.
 * Source: spool-symbol-candidates.json (sourceFamily WE6).
 */
export const REXROTH_WE6_EXTENDED_SPOOL_SEMANTICS: Record<string, RexrothWE6SpoolSemantics> =
  {
    F: {
      baseSpoolSymbol: 'F',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'partially_open',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Merkez: P-A-T bağlı, B kapalı. ${CATALOG_HINT}`,
    },
    P: {
      baseSpoolSymbol: 'P',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'partially_open',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Merkez: P-B-T bağlı, A kapalı. ${CATALOG_HINT}`,
    },
    L: {
      baseSpoolSymbol: 'L',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'partially_open',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Merkez: A-T bağlı; P ve B kapalı. ${CATALOG_HINT}`,
    },
    M: {
      baseSpoolSymbol: 'M',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'open_center',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Merkez: P-A-B bağlı, T kapalı (basınç merkez). ${CATALOG_HINT}`,
    },
    Q: {
      baseSpoolSymbol: 'Q',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'partially_open',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Merkez: P kapalı; A-B-T kısıtlı bağlı. ${CATALOG_HINT}`,
    },
    R: {
      baseSpoolSymbol: 'R',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'unknown',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Katalog sembolü R. ${CATALOG_HINT}`,
    },
    T: {
      baseSpoolSymbol: 'T',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'unknown',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Katalog sembolü T. ${CATALOG_HINT}`,
    },
    U: {
      baseSpoolSymbol: 'U',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'partially_open',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Merkez: B-T bağlı; P ve A kapalı. ${CATALOG_HINT}`,
    },
    V: {
      baseSpoolSymbol: 'V',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'partially_open',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Merkez: P kapalı; A-B-T kısıtlı bağlı. ${CATALOG_HINT}`,
    },
    W: {
      baseSpoolSymbol: 'W',
      numberOfPositions: 3,
      centering: 'spring_centered',
      centerCondition: 'partially_open',
      normallyState: 'unknown',
      requiresCatalogCheck: true,
      behaviorNoteTr: `Merkez: P kapalı; A-B kısıtlı bağlı (katalog W). ${CATALOG_HINT}`,
    },
  };

/** Regex character class for Rexroth WE6 header spool letter. */
export function rexrothWE6OrderingSpoolPattern(): string {
  return `[${REXROTH_WE6_CATALOG_ORDERING_SPOOL_LETTERS}]`;
}
