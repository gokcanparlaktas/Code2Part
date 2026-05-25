import type { ProductIdentification } from './product';

export type CompatibilityStatus = 'compatible' | 'different' | 'unknownOrCheck';

export interface AttributeComparison {
  label: string;
  sourceDisplay: string;
  targetDisplay: string;
  status: CompatibilityStatus;
  note?: string;
}

export interface EquivalentCandidate {
  seriesId: string;
  brand: string;
  series: string;
  productType: string;
  standardFamily: string;
  suggestedCode: string | null;
  targetIdentification: ProductIdentification | null;
}

export interface CompatibilityResult {
  candidate: EquivalentCandidate;
  compatible: AttributeComparison[];
  different: AttributeComparison[];
  unknownOrCheck: AttributeComparison[];
  warnings: string[];
}
