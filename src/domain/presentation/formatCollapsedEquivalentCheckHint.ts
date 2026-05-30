export function formatCollapsedEquivalentCheckHint(checkCount: number): string | null {
  if (checkCount <= 0) {
    return null;
  }
  return `${checkCount} özellik kontrol edilmeli`;
}
