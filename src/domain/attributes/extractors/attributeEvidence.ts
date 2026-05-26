import type { CatalogAttributeDefinition, CatalogConfidence, CatalogKnownToken } from '@/types/catalog';
import type { ProductResolverCategory } from '@/types/category';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';
import type { AttributeEvidenceSource } from '@/types/technicalAttribute';

export function catalogConfidenceToAttribute(
  confidence: CatalogConfidence
): TechnicalAttributeResult['confidence'] {
  return confidence;
}

export function buildAttributeResult(options: {
  key: string;
  label: string;
  value: string | number | boolean | null;
  normalizedValue?: string | number | null;
  unit?: string;
  evidence: AttributeEvidenceSource;
  confidence: TechnicalAttributeResult['confidence'];
  requiresCatalogCheck?: boolean;
  sourceToken?: string;
  category: ProductResolverCategory;
  note?: string;
}): TechnicalAttributeResult {
  return {
    confidence: 'unknown',
    ...options,
  };
}

export function attributeDefLabel(
  defs: CatalogAttributeDefinition[],
  key: string,
  fallback: string
): string {
  return defs.find((d) => d.key === key)?.labelTr ?? fallback;
}

export function knownTokenNote(token: CatalogKnownToken): string {
  if (token.meaningTr) {
    return `${token.meaningTr} (kod: ${token.token}). Katalogdan doğrulanmalıdır.`;
  }
  return 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.';
}

export function toPresentationAttribute(result: TechnicalAttributeResult) {
  const { category: _category, requiresCatalogCheck, ...rest } = result;
  return {
    ...rest,
    note:
      rest.note ??
      (requiresCatalogCheck ? 'Bu bilgi katalog sembolleriyle doğrulanmalıdır.' : undefined),
  };
}
