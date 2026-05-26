import {
  calculateSuggestionMatchPercentage,
  compactProductCode,
} from '../calculateSuggestionMatchPercentage';
import { matchPercentageFromSuggestion } from '../suggestionMatchPercentage';
import type { SuggestedProduct } from '@/types/suggestion';

function stubSuggestion(
  overrides: Pick<SuggestedProduct, 'seriesId' | 'series' | 'exampleCodeFormat'> &
    Partial<SuggestedProduct>
): SuggestedProduct {
  return {
    brand: 'Festo',
    productTypeTr: 'Pnömatik silindir',
    standardFamily: 'ISO 15552',
    equivalenceGroup: 'pneumatic_iso_15552_cylinder',
    confidence: 'medium',
    matchedBy: 'series_prefix',
    detectedAttributes: {},
    missingFields: ['bore', 'stroke'],
    suggestionTextTr: 'test',
    ...overrides,
  };
}

const FULL_DSBC = 'DSBC-50-100-PPVA-N3';

describe('calculateSuggestionMatchPercentage', () => {
  it('returns low percentage for "ds" against full DSBC example code, not 85', () => {
    const match = calculateSuggestionMatchPercentage('ds', FULL_DSBC);
    expect(match.percentage).toBeLessThan(20);
    expect(match.percentage).not.toBe(85);
    expect(match.level).toBe('low');
  });

  it('returns about 13% for "DS" against compact candidate code', () => {
    expect(compactProductCode(FULL_DSBC).length).toBe(15);
    const match = calculateSuggestionMatchPercentage('DS', FULL_DSBC);
    expect(match.percentage).toBe(13);
  });

  it('returns about 27% for "DSBC"', () => {
    const match = calculateSuggestionMatchPercentage('DSBC', FULL_DSBC);
    expect(match.percentage).toBe(27);
  });

  it('returns higher score for "DSBC 50 100" than for "DSBC"', () => {
    const partial = calculateSuggestionMatchPercentage('DSBC 50 100', FULL_DSBC);
    const prefix = calculateSuggestionMatchPercentage('DSBC', FULL_DSBC);
    expect(partial.percentage).toBeGreaterThan(prefix.percentage);
    expect(partial.percentage).toBe(60);
  });

  it('returns about 27% for "50 N3"', () => {
    const match = calculateSuggestionMatchPercentage('50 N3', FULL_DSBC);
    expect(match.percentage).toBe(27);
    expect(match.percentage).toBeLessThan(50);
  });

  it('returns much higher score for "50 100 PPVA N3"', () => {
    const match = calculateSuggestionMatchPercentage('50 100 PPVA N3', FULL_DSBC);
    expect(match.percentage).toBe(73);
    expect(match.level).toBe('medium');
  });

  it('returns 100% for full matching code', () => {
    const match = calculateSuggestionMatchPercentage(FULL_DSBC, FULL_DSBC);
    expect(match.percentage).toBe(100);
    expect(match.level).toBe('high');
  });

  it('clamps percentage between 0 and 100', () => {
    const empty = calculateSuggestionMatchPercentage('', FULL_DSBC);
    expect(empty.percentage).toBe(0);

    const over = calculateSuggestionMatchPercentage(
      'DSBC-50-100-PPVA-N3 EXTRA TOKEN',
      FULL_DSBC
    );
    expect(over.percentage).toBeLessThanOrEqual(100);
    expect(over.percentage).toBeGreaterThanOrEqual(0);
  });

  it('does not double-count repeated query tokens', () => {
    const once = calculateSuggestionMatchPercentage('50 N3', FULL_DSBC);
    const twice = calculateSuggestionMatchPercentage('50 50 N3 N3', FULL_DSBC);
    expect(twice.percentage).toBe(once.percentage);
  });

  it('caps score at 40 when using series name fallback', () => {
    const match = calculateSuggestionMatchPercentage('DSBC', '', {
      fallbackSeriesName: 'DSBC',
    });
    expect(match.percentage).toBe(40);
  });

  it('assigns level from percentage thresholds', () => {
    expect(calculateSuggestionMatchPercentage('ds', FULL_DSBC).level).toBe('low');
    expect(calculateSuggestionMatchPercentage('50 100 PPVA N3', FULL_DSBC).level).toBe(
      'medium'
    );
    expect(calculateSuggestionMatchPercentage(FULL_DSBC, FULL_DSBC).level).toBe('high');
  });

  it('scores low for "ds" when suggestion only has prefix DSBC', () => {
    const match = matchPercentageFromSuggestion(
      'ds',
      stubSuggestion({
        seriesId: 'festo_dsbc',
        series: 'DSBC',
        exampleCodeFormat: 'DSBC',
      })
    );
    expect(match.percentage).toBe(13);
    expect(match.percentage).not.toBe(50);
    expect(match.level).toBe('low');
  });
});
