import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import type { CompatibilityResult } from '@/types/compatibility';

export type VisibleEquivalentResults = {
  visible: CompatibilityResult[];
  hidden: CompatibilityResult[];
  hiddenCount: number;
  totalCount: number;
  isLimited: boolean;
};

export type VisibleEquivalentFilterOptions = {
  /** If total count <= this, show all (no button). */
  maxDefaultVisible: number;
  /** Candidates above this score should be shown (until cap). */
  minScoreToAlwaysShow: number;
  /** Hard cap for default visible candidates. */
  hardDefaultCap: number;
};

export const DEFAULT_VISIBLE_EQUIVALENT_FILTER_OPTIONS: VisibleEquivalentFilterOptions =
  {
    maxDefaultVisible: 5,
    minScoreToAlwaysShow: 60,
    hardDefaultCap: 8,
  };

/**
 * Given already-sorted results (score desc), return what to show by default.
 * Does not delete hidden candidates; they are meant for the full list screen.
 */
export function filterVisibleEquivalentResults(
  sortedResults: CompatibilityResult[],
  options: VisibleEquivalentFilterOptions = DEFAULT_VISIBLE_EQUIVALENT_FILTER_OPTIONS,
): VisibleEquivalentResults {
  const totalCount = sortedResults.length;
  if (totalCount <= options.maxDefaultVisible) {
    return {
      visible: sortedResults,
      hidden: [],
      hiddenCount: 0,
      totalCount,
      isLimited: false,
    };
  }

  const visible: CompatibilityResult[] = [];
  const hidden: CompatibilityResult[] = [];

  // Always include score>=threshold, but enforce cap later.
  for (const item of sortedResults) {
    if (calculateMatchPercentage(item).percentage >= options.minScoreToAlwaysShow) {
      visible.push(item);
    } else {
      hidden.push(item);
    }
  }

  // Ensure at least top N are visible.
  const ensureCount = Math.min(options.maxDefaultVisible, totalCount);
  for (let i = 0; i < ensureCount; i += 1) {
    const item = sortedResults[i]!;
    if (!visible.includes(item)) {
      visible.push(item);
      const idx = hidden.indexOf(item);
      if (idx >= 0) {
        hidden.splice(idx, 1);
      }
    }
  }

  // Apply hard cap by keeping top items in sorted order.
  const visibleSet = new Set(visible);
  const orderedVisible = sortedResults.filter((r) => visibleSet.has(r));
  const cappedVisible = orderedVisible.slice(0, options.hardDefaultCap);
  const cappedSet = new Set(cappedVisible);
  const finalHidden = sortedResults.filter((r) => !cappedSet.has(r));

  return {
    visible: cappedVisible,
    hidden: finalHidden,
    hiddenCount: finalHidden.length,
    totalCount,
    isLimited: finalHidden.length > 0,
  };
}

