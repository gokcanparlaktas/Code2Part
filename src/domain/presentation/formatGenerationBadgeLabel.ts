import type { EquivalentGenerationStatus } from '@/types/equivalentCodeGeneration';

export function formatGenerationBadgeLabel(options: {
  generationStatus?: EquivalentGenerationStatus;
  isExactKnownExample?: boolean;
}): string | null {
  const { generationStatus, isExactKnownExample } = options;

  if (isExactKnownExample && generationStatus === 'generated_full') {
    return 'Kayıtlı + üretilmiş aday';
  }

  if (generationStatus === 'exact_known' || isExactKnownExample) {
    return 'Kayıtlı örnek / doğrulanmış aday';
  }

  if (generationStatus === 'generated_full') {
    return 'Üretilmiş muadil kod';
  }

  if (generationStatus === 'generated_partial') {
    return 'Alternatif muadil adayı';
  }

  return null;
}
