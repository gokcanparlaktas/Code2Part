/** Plain Turkish tips when a product code cannot be identified. */
export const NOT_FOUND_SEARCH_TIPS = [
  'Tam ürün kodunu yazmayı deneyin',
  'Marka veya seri adı ekleyin (ör. Festo, SMC, Rexroth)',
  'Gereksiz boşlukları kaldırın; tireleri kontrol edin',
] as const;

export function formatNotFoundSearchTips(): string {
  return NOT_FOUND_SEARCH_TIPS.map((tip) => `• ${tip}`).join('\n');
}
