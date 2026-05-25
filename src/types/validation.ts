export type ValidationLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: ValidationLevel;
  code: string;
  messageTr: string;
  relatedId?: string;
}

import type { ReliabilitySummary } from './catalogMetadata';

export interface CatalogValidationSummary {
  productSeriesCount: number;
  parsingRulesCount: number;
  equivalenceGroupCount: number;
  equivalentLinksCount: number;
  reliability: ReliabilitySummary;
}

export interface CatalogValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: CatalogValidationSummary;
}
