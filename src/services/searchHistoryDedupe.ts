import type { SearchHistoryEntry } from '@/types/searchHistory';

/** Removes prior history rows for the same normalized code (demo: avoid duplicate taps). */
export function dedupeSearchHistoryByNormalizedCode(
  searches: SearchHistoryEntry[],
  normalizedCode: string
): SearchHistoryEntry[] {
  const key = normalizedCode.trim().toUpperCase();
  if (!key) {
    return searches;
  }
  return searches.filter((entry) => entry.normalizedCode.trim().toUpperCase() !== key);
}
