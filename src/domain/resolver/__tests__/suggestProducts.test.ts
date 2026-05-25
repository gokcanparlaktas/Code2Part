import { suggestProducts } from '../suggestProducts';

function firstSuggestion(input: string) {
  const suggestions = suggestProducts(input);
  return suggestions[0];
}

describe('suggestProducts', () => {
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
});
