/** User-facing bearing family names (TR). */
export function bearingTypeNameTrForSeriesGroup(seriesGroup: string): string {
  switch (seriesGroup) {
    case '6000':
      return 'Bilyalı rulman';
    case '20000':
      return 'Oynak makaralı rulman';
    case '30000':
      return 'Konik makaralı rulman';
    default:
      return 'Rulman';
  }
}
