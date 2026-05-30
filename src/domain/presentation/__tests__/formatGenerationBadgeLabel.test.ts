import { formatGenerationBadgeLabel } from '@/domain/presentation/formatGenerationBadgeLabel';

describe('formatGenerationBadgeLabel', () => {
  it('returns combined label when exact known and generated full', () => {
    expect(
      formatGenerationBadgeLabel({
        generationStatus: 'generated_full',
        isExactKnownExample: true,
      })
    ).toBe('Kayıtlı + üretilmiş aday');
  });

  it('returns generated full label', () => {
    expect(formatGenerationBadgeLabel({ generationStatus: 'generated_full' })).toBe(
      'Üretilmiş muadil kod'
    );
  });

  it('returns partial alternative label', () => {
    expect(formatGenerationBadgeLabel({ generationStatus: 'generated_partial' })).toBe(
      'Alternatif muadil adayı'
    );
  });
});
