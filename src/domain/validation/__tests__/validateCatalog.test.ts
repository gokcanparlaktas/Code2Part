import { validateCatalog } from '../validateCatalog';

describe('validateCatalog', () => {
  it('validates the current local catalog', () => {
    const result = validateCatalog();

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.summary.productSeriesCount).toBeGreaterThan(0);
    expect(result.summary.parsingRulesCount).toBeGreaterThan(0);
    expect(result.summary.equivalenceGroupCount).toBeGreaterThan(0);
    expect(result.summary.equivalentLinksCount).toBeGreaterThan(0);

    const regexErrors = result.errors.filter((e) => e.code === 'PARSER_INVALID_REGEX');
    expect(regexErrors).toHaveLength(0);
  });
});
