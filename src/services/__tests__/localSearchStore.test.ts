import { dedupeSearchHistoryByNormalizedCode } from '@/services/searchHistoryDedupe';
import type { SearchHistoryEntry } from '@/types/searchHistory';

function entry(
  overrides: Partial<SearchHistoryEntry> & Pick<SearchHistoryEntry, 'normalizedCode'>
): SearchHistoryEntry {
  return {
    id: overrides.id ?? '1',
    originalInput: overrides.originalInput ?? overrides.normalizedCode,
    normalizedCode: overrides.normalizedCode,
    identified: overrides.identified ?? true,
    brand: overrides.brand ?? 'Festo',
    series: overrides.series ?? 'DSBC',
    confidence: overrides.confidence ?? 'high',
    searchedAt: overrides.searchedAt ?? '2026-05-26T10:00:00.000Z',
  };
}

describe('dedupeSearchHistoryByNormalizedCode', () => {
  it('removes prior rows with the same normalized code', () => {
    const searches = [
      entry({ id: 'a', normalizedCode: 'DSBC-50-100' }),
      entry({ id: 'b', normalizedCode: 'CP96-50-100' }),
      entry({ id: 'c', normalizedCode: 'dsbc-50-100' }),
    ];

    const deduped = dedupeSearchHistoryByNormalizedCode(searches, 'DSBC-50-100');
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.id).toBe('b');
  });

  it('ignores whitespace and case when matching', () => {
    const searches = [entry({ normalizedCode: ' 4WE6E-6X/EG24N9K4 ' })];
    const deduped = dedupeSearchHistoryByNormalizedCode(
      searches,
      '4we6e-6x/eg24n9k4'
    );
    expect(deduped).toHaveLength(0);
  });

  it('returns unchanged list when normalized code is empty', () => {
    const searches = [entry({ normalizedCode: 'ADN-32-50' })];
    expect(dedupeSearchHistoryByNormalizedCode(searches, '   ')).toEqual(searches);
  });
});
