import type { TechnicalAttribute } from '@/types/product';

/** ISO / industry starter dimensions are treated as verified standard data. */
export function attributeFromBearingStandard<T extends string | number>(
  value: T,
  unit?: string
): TechnicalAttribute<T> {
  return { value, unit, evidence: 'standard', requiresCheck: false };
}

export function attributeFromBearingCode<T extends string | number>(
  value: T,
  unit?: string
): TechnicalAttribute<T> {
  return { value, unit, evidence: 'code', requiresCheck: false };
}

export const BEARING_EQUIVALENT_METADATA = {
  compatibilityLevel: 'high' as const,
  confidenceLevel: 'high' as const,
  dataCompleteness: 'high' as const,
};
