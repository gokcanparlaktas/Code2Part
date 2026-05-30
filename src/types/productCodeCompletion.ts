export type ProductCodeCompletionFieldKey =
  | 'coil_voltage'
  | 'manual_override'
  | 'connector_type'
  | 'function_code'
  | 'design_number'
  | 'spool_symbol'
  | 'design_series';

export type ProductCodeCompletionStatus =
  | 'already_complete'
  | 'can_complete'
  | 'completed_full'
  | 'completed_partial'
  | 'partial_unresolved'
  | 'cannot_complete';

export interface ProductCodeCompletionOption {
  token: string | null;
  displayValue: string;
  isUncertainOption?: boolean;
}

export interface ProductCodeCompletionRecognizedField {
  key: string;
  labelTr: string;
  value: string;
}

export interface ProductCodeCompletionFieldDefinition {
  key: ProductCodeCompletionFieldKey;
  labelTr: string;
  options: ProductCodeCompletionOption[];
}

export interface ProductCodeCompletionSelections {
  coil_voltage?: string | null;
  manual_override?: string | null;
  connector_type?: string | null;
  function_code?: string | null;
  design_number?: string | null;
  spool_symbol?: string | null;
  design_series?: string | null;
}

export interface ProductCodeCompletionResult {
  inputCode: string;
  normalizedInput: string;
  manufacturer: string | null;
  family: string | null;
  completionStatus: ProductCodeCompletionStatus;
  recognizedFields: ProductCodeCompletionRecognizedField[];
  missingFields: ProductCodeCompletionFieldDefinition[];
  uncertainFields: ProductCodeCompletionFieldKey[];
  completedCode?: string | null;
  selectedFields?: ProductCodeCompletionSelections;
  checkNotes: string[];
}

export const UNCERTAIN_COMPLETION_OPTION: ProductCodeCompletionOption = {
  token: null,
  displayValue: 'Kararsızım / Bilmiyorum',
  isUncertainOption: true,
};
