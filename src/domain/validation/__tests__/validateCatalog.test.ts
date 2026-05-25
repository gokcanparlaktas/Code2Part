import { validateCatalog } from '../validateCatalog';

describe('validateCatalog', () => {
  it('validates the current local catalog without errors', () => {
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

  it('warns for manual_unverified catalog records', () => {
    const result = validateCatalog();

    const manualWarnings = result.warnings.filter(
      (w) => w.code === 'RELIABILITY_MANUAL_UNVERIFIED'
    );
    expect(manualWarnings.length).toBeGreaterThan(0);
  });

  it('includes reliability summary counts', () => {
    const result = validateCatalog();
    const { reliability } = result.summary;

    expect(reliability.totalRecords).toBeGreaterThan(0);
    expect(reliability.manualUnverifiedCount).toBeGreaterThan(0);
    expect(
      reliability.sourceVerifiedCount +
        reliability.manualVerifiedCount +
        reliability.manualUnverifiedCount +
        reliability.mockCount
    ).toBe(reliability.totalRecords);
  });
});
