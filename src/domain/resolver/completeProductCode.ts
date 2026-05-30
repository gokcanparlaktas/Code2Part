import { completeRexrothWEProductCode } from '@/domain/resolver/rexrothWECodeCompletion';
import { completeYukenDSGProductCode } from '@/domain/resolver/yukenDSGCodeCompletion';
import type {
  ProductCodeCompletionResult,
  ProductCodeCompletionSelections,
} from '@/types/productCodeCompletion';

export function completeProductCode(
  inputCode: string,
  selections?: ProductCodeCompletionSelections
): ProductCodeCompletionResult {
  const rexroth = completeRexrothWEProductCode(inputCode, selections);
  if (rexroth) {
    return rexroth;
  }

  const yuken = completeYukenDSGProductCode(inputCode, selections);
  if (yuken) {
    return yuken;
  }

  return {
    inputCode,
    normalizedInput: inputCode.trim().toUpperCase().replace(/\s+/g, ''),
    manufacturer: null,
    family: null,
    completionStatus: 'cannot_complete',
    recognizedFields: [],
    missingFields: [],
    uncertainFields: [],
    checkNotes: ['Bu kod yapısı için tamamlama henüz desteklenmiyor.'],
  };
}

export function shouldSuppressWeakPartialSuggestions(
  completion: ProductCodeCompletionResult | null
): boolean {
  if (!completion) {
    return false;
  }

  return (
    completion.completionStatus === 'can_complete' ||
    completion.completionStatus === 'completed_full' ||
    completion.completionStatus === 'completed_partial' ||
    completion.completionStatus === 'already_complete'
  );
}
