import type { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';

export type PneumaticCylinderCategory = typeof PNEUMATIC_CYLINDER_CATEGORY;

export type PneumaticRawEvidence = 'code' | 'series_table' | 'standard' | 'inferred' | 'unknown';

export type PneumaticRawConfidence = 'high' | 'medium' | 'low' | 'unknown';

export interface PneumaticRawParsedField {
  attributeKey: string;
  rawToken?: string;
  rawValue?: string | number;
  position?: string;
  evidence: PneumaticRawEvidence;
  confidence: PneumaticRawConfidence;
  requiresCatalogCheck: boolean;
}

export interface PneumaticRawParseResult {
  brand?: string;
  series?: string;
  standardFamily?: string;
  boreMm?: number;
  strokeMm?: number;
  fields: PneumaticRawParsedField[];
  confidence: PneumaticRawConfidence;
  requiresCatalogCheck: boolean;
  matchedPatternId?: string;
}

export interface PneumaticComparableOptionContext {
  brand: string;
  series: string;
  category?: PneumaticCylinderCategory;
  attributeKey: string;
  rawToken: string;
  tokenPosition?: string;
}

export interface PneumaticComparableOptionResolved {
  found: boolean;
  attributeKey: string;
  rawToken: string;
  candidateMeaning?: string;
  comparisonAttributeKey?: string;
  confidence: PneumaticRawConfidence;
  needsReview: boolean;
  sourceStatus?: string;
  evidence: 'catalog_data';
}

export interface PneumaticCodeGenerationInput {
  brand: string;
  series: string;
  boreMm: number;
  strokeMm: number;
  cushioningToken?: string;
  magnetSensorToken?: string;
  variant?: string;
}

export interface PneumaticCodeGenerationCandidate {
  code: string;
  templateId: string;
  needsReview: boolean;
  confidence: PneumaticRawConfidence;
  notes?: string[];
}
