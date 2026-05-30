import { portStatesMatch } from '@/domain/catalogData';
import type { CatalogPortState } from '@/domain/catalogData/types';
import type { AttributeComparison } from '@/types/compatibility';

import type { CanonicalField, HydraulicCenterCondition } from './hydraulicValveCanonicalTypes';

/** Shown when portState match relies on review-gated catalog-data candidates. */
export const CATALOG_PORT_STATE_CANDIDATE_WARNING_TR =
  'Sürgü merkez davranışı eşleşmesi, inceleme gerektiren katalog aday verisindeki port durumlarına (portState) dayanır; üretici kataloğu ile doğrulanmalıdır. Bu eşdeğerlik üretim onayı değildir.';

export function hasCatalogPortStateEvidence(
  field: CanonicalField<HydraulicCenterCondition>
): field is CanonicalField<HydraulicCenterCondition> & {
  catalogEvidence: { portState: CatalogPortState };
} {
  const portState = field.catalogEvidence?.portState;
  if (!portState) {
    return false;
  }
  return (
    portState.P != null &&
    portState.T != null &&
    portState.A != null &&
    portState.B != null
  );
}

export interface CatalogPortStateSpoolComparisonResult {
  /** True when comparison used catalogEvidence.portState on both sides. */
  usedPortState: boolean;
  comparison: AttributeComparison;
  catalogReviewRequired: boolean;
}

/**
 * Compares spool/center hydraulic behavior using catalog portState when both profiles have it.
 * Falls back to unknownOrCheck when only one or neither side has portState (caller should use legacy path).
 */
export function compareSpoolBehaviorByCatalogPortState(options: {
  label: string;
  sourceField: CanonicalField<HydraulicCenterCondition>;
  targetField: CanonicalField<HydraulicCenterCondition>;
  sourceDisplay: string;
  targetDisplay: string;
}): CatalogPortStateSpoolComparisonResult {
  const base = {
    label: options.label,
    sourceDisplay: options.sourceDisplay,
    targetDisplay: options.targetDisplay,
  };

  const sourceHas = hasCatalogPortStateEvidence(options.sourceField);
  const targetHas = hasCatalogPortStateEvidence(options.targetField);

  if (!sourceHas || !targetHas) {
    return {
      usedPortState: false,
      comparison: { ...base, status: 'unknownOrCheck' },
      catalogReviewRequired: false,
    };
  }

  const catalogReviewRequired =
    Boolean(options.sourceField.catalogEvidence?.needsReview) ||
    Boolean(options.targetField.catalogEvidence?.needsReview);

  const sourcePs = options.sourceField.catalogEvidence.portState;
  const targetPs = options.targetField.catalogEvidence.portState;

  if (portStatesMatch(sourcePs, targetPs)) {
    return {
      usedPortState: true,
      comparison: { ...base, status: 'compatible' },
      catalogReviewRequired,
    };
  }

  return {
    usedPortState: true,
    comparison: { ...base, status: 'different' },
    catalogReviewRequired,
  };
}
