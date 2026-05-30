import { GENERAL_ORDER_CATALOG_WARNING_TR } from '@/domain/presentation/formatUserFacingCatalogDisplay';

/** Generic hydraulic warnings shown once via first-launch disclaimer, not on every card. */
export const GENERIC_COMPATIBILITY_WARNING_TEXTS = [
  'Hidrolik valflerde sembol, sürgü tipi ve bobin voltajı mutlaka kontrol edilmelidir.',
  'CETOP/NG ölçüsü aynı olsa bile tüm teknik özellikler birebir uyumlu olmayabilir.',
  GENERAL_ORDER_CATALOG_WARNING_TR,
] as const;

const GENERIC_WARNING_SET = new Set<string>(GENERIC_COMPATIBILITY_WARNING_TEXTS);

export function isGenericCompatibilityWarning(text: string): boolean {
  return GENERIC_WARNING_SET.has(text.trim());
}

export function filterGenericCompatibilityWarningsForUi(
  warnings: readonly string[]
): string[] {
  return warnings.filter((warning) => !isGenericCompatibilityWarning(warning));
}
