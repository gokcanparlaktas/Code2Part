import { identifyProduct } from '../identifyProduct';
import { normalizeCode } from '../normalizeCode';
import { suggestProducts } from '../suggestProducts';

function firstSuggestion(input: string) {
  const suggestions = suggestProducts(input);
  return suggestions[0];
}

import { getSuggestionReactKey } from '@/types/suggestion';

function expectUniqueReactKeys(suggestions: ReturnType<typeof suggestProducts>): void {
  const keys = suggestions.map(getSuggestionReactKey);
  expect(new Set(keys).size).toBe(keys.length);
}

describe('suggestProducts', () => {
  it('returns suggestions with unique React list keys', () => {
    for (const input of ['DSBC', 'DSBC-50', '50-100', '50 N3', 'DSBC 50 100']) {
      expectUniqueReactKeys(suggestProducts(input));
    }
  });

  it('suggests Festo DSBC for "DSBC"', () => {
    const suggestion = firstSuggestion('DSBC');
    expect(suggestion).toBeDefined();
    expect(suggestion.brand).toBe('Festo');
    expect(suggestion.series).toBe('DSBC');
    expect(suggestion.missingFields).toEqual(expect.arrayContaining(['bore', 'stroke']));
    expect(suggestion.suggestionTextTr).toContain('Festo DSBC');
  });

  it('suggests Festo DSBC with bore 50 for "DSBC-50"', () => {
    const suggestion = firstSuggestion('DSBC-50');
    expect(suggestion).toBeDefined();
    expect(suggestion.brand).toBe('Festo');
    expect(suggestion.series).toBe('DSBC');
    expect(suggestion.detectedAttributes.boreMm).toBe(50);
    expect(suggestion.missingFields).toEqual(expect.arrayContaining(['stroke']));
    expect(suggestion.suggestionTextTr).toContain('50 mm');
  });

  it('suggests SMC CP96 for "CP96"', () => {
    const suggestion = firstSuggestion('CP96');
    expect(suggestion).toBeDefined();
    expect(suggestion.brand).toBe('SMC');
    expect(suggestion.series).toBe('CP96');
  });

  it('suggests SMC CQ2 for "CQ2"', () => {
    const suggestion = firstSuggestion('CQ2');
    expect(suggestion).toBeDefined();
    expect(suggestion.brand).toBe('SMC');
    expect(suggestion.series).toBe('CQ2');
  });

  it('suggests Parker P1D for "P1D"', () => {
    const suggestion = firstSuggestion('P1D');
    expect(suggestion).toBeDefined();
    expect(suggestion.brand).toBe('Parker');
    expect(suggestion.series).toBe('P1D');
  });

  it('suggests AirTAC SI with bore 50 for "SI50"', () => {
    const suggestion = firstSuggestion('SI50');
    expect(suggestion).toBeDefined();
    expect(suggestion.brand).toBe('AirTAC');
    expect(suggestion.series).toBe('SI');
    expect(suggestion.detectedAttributes.boreMm).toBe(50);
    expect(suggestion.missingFields).toEqual(expect.arrayContaining(['stroke']));
  });

  it('returns empty suggestions for "UNKNOWN"', () => {
    expect(suggestProducts('UNKNOWN')).toEqual([]);
  });

  it('suggests DSBC-50-100-PPVA-N3 for series-less "50-100-ppva"', () => {
    const suggestions = suggestProducts('50-100-ppva');
    expect(
      suggestions.some((s) => s.exampleCodeFormat === 'DSBC-50-100-PPVA-N3')
    ).toBe(true);
    expect(suggestions.every((s) => s.confidence !== 'high')).toBe(true);
    expect(
      suggestions.some((s) => s.suggestionTextTr.includes('kesin sayılmamalıdır'))
    ).toBe(true);
  });

  it('returns pneumatic cylinder suggestions for series-less "50-100"', () => {
    const suggestions = suggestProducts('50-100');
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(
      suggestions.every((s) => s.detectedAttributes.boreMm === 50 && s.detectedAttributes.strokeMm === 100)
    ).toBe(true);
    expect(suggestions.every((s) => s.confidence !== 'high')).toBe(true);
    expect(
      suggestions.some((s) => s.suggestionTextTr.includes('Seri öneki girilmedi'))
    ).toBe(true);
  });

  it('does not mark unknown series as certain for dimension-only fragments', () => {
    const suggestions = suggestProducts('50-100');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((s) => s.confidence !== 'high')).toBe(true);
    expect(
      suggestions.some(
        (s) => s.matchedBy === 'dimension_fragment' || s.matchedBy === 'token_match'
      )
    ).toBe(true);
  });

  it('suggests DSBC-50-100-PPVA-N3 for token query "50 N3"', () => {
    const suggestions = suggestProducts('50 N3');
    expect(
      suggestions.some((s) => s.exampleCodeFormat === 'DSBC-50-100-PPVA-N3')
    ).toBe(true);
    expect(suggestions.every((s) => s.confidence !== 'high')).toBe(true);
  });

  it('does not suggest codes missing a query token for "50 n3"', () => {
    const suggestions = suggestProducts('50 n3');
    const codes = suggestions.map((s) => s.exampleCodeFormat);
    expect(codes).not.toContain('DSBC-32-25-PPSA-N3');
    expect(codes).not.toContain('ADN-32-50');
    expect(codes).toContain('DSBC-50-100-PPVA-N3');
  });

  it('suggests DSBC-50-100-PPVA-N3 for token query "ppva n3"', () => {
    const suggestions = suggestProducts('ppva n3');
    expect(
      suggestions.some((s) => s.exampleCodeFormat === 'DSBC-50-100-PPVA-N3')
    ).toBe(true);
    expect(
      suggestions.every((s) => {
        const compact = s.exampleCodeFormat.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        return compact.includes('PPVA') && compact.includes('N3');
      })
    ).toBe(true);
  });

  it('suggests products with bore 50 and stroke 100 for "50 100"', () => {
    const suggestions = suggestProducts('50 100');
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(
      suggestions.some(
        (s) => s.detectedAttributes.boreMm === 50 && s.detectedAttributes.strokeMm === 100
      )
    ).toBe(true);
    expect(suggestions.every((s) => s.confidence !== 'high')).toBe(true);
    expect(
      suggestions.every((s) => {
        const tokens = s.exampleCodeFormat
          .toUpperCase()
          .split(/[\s\-_/]+/)
          .map((t) => t.replace(/[^A-Z0-9]/g, ''));
        const compact = s.exampleCodeFormat.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const has50 = tokens.includes('50') || /(^|[^0-9])50([^0-9]|$)/.test(compact);
        const has100 = tokens.includes('100') || /(^|[^0-9])100([^0-9]|$)/.test(compact);
        return has50 && has100;
      })
    ).toBe(true);
  });

  it('prioritizes DSBC-50-100-PPVA-N3 for "50 100 ppva"', () => {
    const suggestions = suggestProducts('50 100 ppva');
    expect(suggestions[0]?.exampleCodeFormat).toBe('DSBC-50-100-PPVA-N3');
  });

  it('suggests DSBC-50-100-PPVA-N3 for spaced series query "DSBC 50 100"', () => {
    const suggestions = suggestProducts('DSBC 50 100');
    expect(
      suggestions.some((s) => s.exampleCodeFormat === 'DSBC-50-100-PPVA-N3')
    ).toBe(true);
  });

  it('does not suggest when "cp96 50 100" is an exact catalog example (identified instead)', () => {
    const suggestions = suggestProducts('cp96 50 100');
    expect(suggestions).toHaveLength(0);

    const identification = identifyProduct(
      'cp96 50 100',
      normalizeCode('cp96 50 100')
    );
    expect(identification.outcome).toBe('full');
    expect(identification.series.value).toBe('CP96');
  });

  it('does not create noisy suggestions for a lone short numeric token', () => {
    expect(suggestProducts('50')).toEqual([]);
  });

  it('does not create suggestions for input shorter than 3 characters alone', () => {
    expect(suggestProducts('ab')).toEqual([]);
  });

  it('suggests CP96SDB50-100 for compact fragment "SDB"', () => {
    const suggestions = suggestProducts('SDB');
    expect(suggestions.some((s) => s.exampleCodeFormat === 'CP96SDB50-100')).toBe(true);
  });

  it('suggests P1D-S050MS-0100 for compact fragments "S050" and "050MS"', () => {
    expect(
      suggestProducts('S050').some((s) => s.exampleCodeFormat === 'P1D-S050MS-0100')
    ).toBe(true);
    expect(
      suggestProducts('050MS').some((s) => s.exampleCodeFormat === 'P1D-S050MS-0100')
    ).toBe(true);
  });

  it('suggests CQ2B32-50D for fragment "CQ2B"', () => {
    expect(suggestProducts('CQ2B').some((s) => s.exampleCodeFormat === 'CQ2B32-50D')).toBe(
      true
    );
  });

  it('suggests C85N25-80 for fragment "C85N"', () => {
    expect(suggestProducts('C85N').some((s) => s.exampleCodeFormat === 'C85N25-80')).toBe(
      true
    );
  });

  it('still rejects partial multi-token matches for "50 n3"', () => {
    const suggestions = suggestProducts('50 n3');
    const codes = suggestions.map((s) => s.exampleCodeFormat);
    expect(codes).not.toContain('DSBC-32-25-PPSA-N3');
    expect(codes).not.toContain('ADN-32-50');
    expect(codes).toContain('DSBC-50-100-PPVA-N3');
  });
});
