export type AttributeEvidenceSource =
  | 'code'
  | 'series_table'
  | 'standard'
  | 'inferred'
  | 'unknown';

export type TechnicalAttribute = {
  key: string;
  label: string;
  value: string | number | boolean | null;
  unit?: string;
  evidence: AttributeEvidenceSource;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  note?: string;
};

