export type EquivalentGenerationStatus =
  | 'exact_known'
  | 'generated_full'
  | 'generated_partial'
  | 'cannot_generate';

export interface CodeGenerationTraceStep {
  field: string;
  action: string;
  sourceValue: string | null;
  targetValue: string | null;
  noteTr?: string;
}

export interface CodeGenerationTrace {
  steps: CodeGenerationTraceStep[];
  summaryTr: string;
}

export interface GeneratedEquivalentCandidate {
  generatedCode: string;
  manufacturer: string;
  series: string;
  seriesId: string;
  generationStatus: EquivalentGenerationStatus;
  confidence: 'high' | 'medium' | 'low';
  mappedFields: string[];
  unresolvedFields: string[];
  checkNotes: string[];
  /** Informational notes only — must not affect match score or requiresCheck. */
  infoNotes?: string[];
  requiresCheck: boolean;
  generationTrace: CodeGenerationTrace;
  /** True when the code also exists as a stored catalog example. */
  isExactKnownExample?: boolean;
}

export interface TargetManufacturerCodeTemplate {
  manufacturer: string;
  seriesId: string;
  /** Ordered segments with `{token}` placeholders, e.g. `DSG-{size}-{function}-{coil}-{connector}-{design}`. */
  pattern: string;
}

export interface EquivalentGenerationMetadata {
  generationStatus: EquivalentGenerationStatus;
  requiresCheck: boolean;
  generationCheckNotes: string[];
  generationInfoNotes?: string[];
  isExactKnownExample?: boolean;
  generationTraceSummaryTr?: string;
}
