import { CATALOG_CHECK_DISPLAY_MESSAGE } from '@/types/canonicalAttribute';

/** UI/catalog fallback phrases that must never count as a resolved compatible value. */
export function isCatalogCheckDisplayText(value: string | null | undefined): boolean {
  if (value == null) {
    return false;
  }
  const text = String(value).trim();
  if (!text) {
    return false;
  }
  if (text === CATALOG_CHECK_DISPLAY_MESSAGE) {
    return true;
  }
  if (text.includes('Katalogdan doğrulanmalı')) {
    return true;
  }
  if (text.includes('Katalog sembolünden doğrulanmalı')) {
    return true;
  }
  if (/kontrol gerekli/i.test(text)) {
    return true;
  }
  return false;
}
