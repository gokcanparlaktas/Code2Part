import { CATALOG_CANDIDATE_META_TR, GENERIC_PORT_STATE_RESOLVED_TR } from './formatCatalogFieldDisplay';

/** Clean source labels for product detail rows (no internal review wording). */
export const USER_EVIDENCE_FROM_CODE_TR = 'Ürün kodundan';
export const USER_EVIDENCE_FROM_CATALOG_TR = 'Katalogdan';
export const USER_EVIDENCE_FROM_SERIES_TR = 'Seri bilgisinden';
export const USER_EVIDENCE_FROM_TECHNICAL_CATALOG_TR = 'Teknik katalogdan';

/** Single general warning for equivalence / product review sections. */
export const GENERAL_ORDER_CATALOG_WARNING_TR =
  'Sipariş öncesi katalog, uygulama basıncı/debisi ve bağlantı detayları kontrol edilmelidir.';

const INTERNAL_CATALOG_PHRASES = [
  CATALOG_CANDIDATE_META_TR,
  'Katalog adayı — doğrulanmalı',
  'Katalog adayı',
  GENERIC_PORT_STATE_RESOLVED_TR,
  'Port durumu katalog adayından çözümlendi',
  'Katalog sembolünden doğrulanmalı',
  'Katalogdan doğrulanmalı',
  'Çalışma davranışı katalog sembolünden doğrulanmalıdır.',
  'Konnektör tipi katalogdan doğrulanmalıdır.',
  'Katalog adayı — uygulama koşullarına göre doğrulanmalı',
] as const;

export function isInternalCatalogWording(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return INTERNAL_CATALOG_PHRASES.some((phrase) =>
    normalized.includes(phrase.toLowerCase())
  ) || /\bkatalog aday\b/i.test(text) || /\bdoğrulanmalı\b/i.test(normalized);
}

export function filterUserFacingDetailLines(lines: string[]): string[] {
  return lines
    .filter(Boolean)
    .filter((line) => !isInternalCatalogWording(line))
    .filter((line) => !line.toLowerCase().includes('katalog adayı'));
}

export function userEvidenceLabelForField(options: {
  hasCatalogEvidence?: boolean;
  fromProductCode?: boolean;
  technicalCatalog?: boolean;
  placeholderPrimary?: boolean;
}): string {
  if (options.placeholderPrimary) {
    return USER_EVIDENCE_FROM_SERIES_TR;
  }
  if (options.technicalCatalog || options.hasCatalogEvidence) {
    return options.fromProductCode
      ? USER_EVIDENCE_FROM_CODE_TR
      : USER_EVIDENCE_FROM_CATALOG_TR;
  }
  if (options.fromProductCode) {
    return USER_EVIDENCE_FROM_CODE_TR;
  }
  return USER_EVIDENCE_FROM_SERIES_TR;
}

export function hadCatalogReviewWarnings(warnings: string[]): boolean {
  return warnings.some(
    (w) =>
      isInternalCatalogWording(w) ||
      /port durumları|inceleme gerektiren|katalog aday/i.test(w)
  );
}

export function consolidateCatalogWarningsForUi(warnings: string[]): string[] {
  const hadCatalogReview = hadCatalogReviewWarnings(warnings);
  const nonInternal = warnings.filter((w) => !isInternalCatalogWording(w));

  const result = [...nonInternal];
  if (hadCatalogReview && !result.includes(GENERAL_ORDER_CATALOG_WARNING_TR)) {
    result.push(GENERAL_ORDER_CATALOG_WARNING_TR);
  }
  return [...new Set(result)];
}

const PRODUCT_CATEGORY_TAIL_PATTERNS = [
  /\s+hidrolik(?:\s+\w+)*\s+valfi\s*$/iu,
  /\s+pnömatik\s+silindir\s*$/iu,
] as const;

/** Ürün tipi zaten ayrı satırda gösterildiğinde kategoriden tekrar eden kuyruk metnini keser. */
export function formatProductCategoryDisplayValue(
  productCategory: string,
  productType: string
): string {
  const category = productCategory.trim();
  const type = productType.trim();
  if (!category || !type || category === 'Belirsiz') {
    return category;
  }

  const categoryLower = category.toLocaleLowerCase('tr-TR');
  const typeLower = type.toLocaleLowerCase('tr-TR');
  if (categoryLower.endsWith(typeLower)) {
    const trimmed = category
      .slice(0, category.length - type.length)
      .replace(/[\s\-–—/,]+$/, '')
      .trim();
    if (trimmed) {
      return trimmed;
    }
  }

  for (const pattern of PRODUCT_CATEGORY_TAIL_PATTERNS) {
    const trimmed = category.replace(pattern, '').trim();
    if (trimmed && trimmed !== category) {
      return trimmed;
    }
  }

  return category;
}
