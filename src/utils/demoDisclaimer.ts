/** Short Turkish demo disclaimers (local catalog, not production sign-off). */
export const DEMO_DISCLAIMER_LINES = [
  'Demo verileri katalog kontrolü gerektirebilir.',
  'Uyumluluk sonuçları kesin teknik onay yerine geçmez.',
] as const;

export function getDemoDisclaimerText(separator = ' '): string {
  return DEMO_DISCLAIMER_LINES.join(separator);
}
