import { formatCollapsedEquivalentCheckHint } from '@/domain/presentation/formatCollapsedEquivalentCheckHint';

describe('formatCollapsedEquivalentCheckHint', () => {
  it('returns null when there are no check items', () => {
    expect(formatCollapsedEquivalentCheckHint(0)).toBeNull();
  });

  it('returns count-based hint for check items', () => {
    expect(formatCollapsedEquivalentCheckHint(3)).toBe('3 özellik kontrol edilmeli');
  });
});
