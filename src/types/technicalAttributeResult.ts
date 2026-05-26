import type { ProductResolverCategory } from './category';
import type { AttributeEvidenceSource } from './technicalAttribute';

export type TechnicalAttributeResult = {
  key: string;
  label: string;
  value: string | number | boolean | null;
  normalizedValue?: string | number | null;
  unit?: string;
  evidence: AttributeEvidenceSource;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  requiresCatalogCheck?: boolean;
  sourceToken?: string;
  category: ProductResolverCategory;
  note?: string;
};
