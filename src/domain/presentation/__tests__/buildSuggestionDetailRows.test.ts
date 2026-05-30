import {
  buildSuggestionDetailRows,
  formatSuggestionMatchedBy,
} from '@/domain/presentation/buildSuggestionDetailRows';
import {
  formatEquivalenceGroupLabel,
  formatSuggestionMissingStatus,
  isSeriesNameOnlySuggestion,
} from '@/domain/presentation/suggestionDisplay';
import type { SuggestedProduct } from '@/types/suggestion';

function minimalSuggestion(overrides: Partial<SuggestedProduct> = {}): SuggestedProduct {
  return {
    seriesId: 'festo-dsbc',
    brand: 'Festo',
    series: 'DSBC',
    productTypeTr: 'Pnömatik silindir',
    standardFamily: 'ISO 15552',
    equivalenceGroup: 'pneumatic_iso_15552_cylinder',
    confidence: 'medium',
    matchedBy: 'series_prefix',
    detectedAttributes: { boreMm: 50 },
    missingFields: ['stroke'],
    exampleCodeFormat: 'DSBC-50-100-PPVA',
    suggestionTextTr: 'Seri eşleşmesi olası.',
    ...overrides,
  };
}

describe('suggestionDisplay', () => {
  it('formats equivalence group id to catalog name', () => {
    expect(formatEquivalenceGroupLabel('hydraulic_cetop_03_ng6_valve')).toBe(
      'CETOP 03 / NG6 hidrolik yön kontrol valfi'
    );
  });

  it('detects series-name-only prefix matches', () => {
    const suggestion = minimalSuggestion({
      matchedBy: 'series_prefix',
      detectedAttributes: {},
      missingFields: [],
      equivalenceGroup: 'hydraulic_cetop_03_ng6_valve',
      series: '4WE6',
      brand: 'Rexroth',
    });

    expect(isSeriesNameOnlySuggestion(suggestion)).toBe(true);
    expect(formatSuggestionMissingStatus(suggestion)).toBe('Seri adı bulundu');
  });

  it('does not treat partial dimension matches as series-name-only', () => {
    expect(isSeriesNameOnlySuggestion(minimalSuggestion())).toBe(false);
  });
});

describe('buildSuggestionDetailRows', () => {
  it('includes core suggestion fields and detected attributes', () => {
    const rows = buildSuggestionDetailRows(minimalSuggestion());

    expect(rows).toEqual(
      expect.arrayContaining([
        { label: 'Marka', value: 'Festo' },
        { label: 'Seri', value: 'DSBC' },
        { label: 'Algılanan çap', value: '50 mm' },
        { label: 'Eksik alanlar', value: 'Strok' },
      ])
    );
  });

  it('formats matched-by labels in Turkish', () => {
    expect(formatSuggestionMatchedBy('exact_match')).toBe('Tam kod eşleşmesi');
    expect(formatSuggestionMatchedBy('series_prefix')).toBe('Seri kodu');
  });

  it('hides confidence and missing fields for series-name-only suggestions', () => {
    const rows = buildSuggestionDetailRows(
      minimalSuggestion({
        matchedBy: 'series_prefix',
        detectedAttributes: {},
        missingFields: [],
        equivalenceGroup: 'hydraulic_cetop_03_ng6_valve',
        series: '4WE6',
        brand: 'Rexroth',
      })
    );

    expect(rows.find((row) => row.label === 'Muadil grup')?.value).toBe(
      'CETOP 03 / NG6 hidrolik yön kontrol valfi'
    );
    expect(rows.find((row) => row.label === 'Eşleşme yöntemi')?.value).toBe('Seri kodu');
    expect(rows.some((row) => row.label === 'Güven')).toBe(false);
    expect(rows.some((row) => row.label === 'Eksik alanlar')).toBe(false);
  });
});
