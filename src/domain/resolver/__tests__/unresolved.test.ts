import { confidenceToScore } from '@/utils/confidenceScore';

import { identifyProduct } from '../identifyProduct';
import { normalizeCode } from '../normalizeCode';

function identify(input: string) {
  const normalized = normalizeCode(input);
  return identifyProduct(input, normalized);
}

describe('unresolved product identification', () => {
  it('does not identify UNKNOWN-123', () => {
    const result = identify('UNKNOWN-123');

    expect(result.matched).toBe(false);
    expect(result.outcome).toBe('not_found');
    expect(result.brand.value).toBeNull();
    expect(result.series.value).toBeNull();
    expect(confidenceToScore(result.confidence)).toBe(0);
  });

  it('does not identify empty input', () => {
    const result = identify('');

    expect(result.matched).toBe(false);
    expect(result.outcome).toBe('not_found');
    expect(confidenceToScore(result.confidence)).toBe(0);
  });

  it('does not identify ambiguous short code ABC', () => {
    const result = identify('ABC');

    expect(result.matched).toBe(false);
    expect(result.outcome).toBe('not_found');
    expect(confidenceToScore(result.confidence)).toBe(0);
  });
});
