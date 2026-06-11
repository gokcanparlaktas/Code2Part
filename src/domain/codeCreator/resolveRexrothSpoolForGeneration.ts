import type { HydraulicCenterTypeOption } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import {
  isRexrothWEOrderingSpoolSymbol,
  rexrothWE6BehaviorLookupToken,
  rexrothWE6OrderingSpoolTokenForEquivalent,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';

/**
 * Resolves the Rexroth ordering-code spool letter for code generation from a PTAB
 * center-type option. Catalog tokens (F, P, L, …) are valid RE 23178 symbols and are
 * kept when recognized; otherwise falls back to the closest classic letter (E, C, D…).
 */
export function resolveRexrothSpoolForGeneration(
  centerOption: HydraulicCenterTypeOption | undefined
): string | null {
  const raw = centerOption?.rexrothSpoolToken?.trim().toUpperCase() ?? '';
  if (raw) {
    const ordering = rexrothWE6OrderingSpoolTokenForEquivalent(raw);
    if (ordering) {
      return ordering;
    }

    const letter = raw.length === 1 ? raw : (rexrothWE6BehaviorLookupToken(raw) ?? null);
    if (letter && isRexrothWEOrderingSpoolSymbol(letter)) {
      return letter;
    }
  }

  return null;
}
