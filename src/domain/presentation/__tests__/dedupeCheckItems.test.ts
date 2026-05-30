import {
  dedupeCheckItemsByField,
  filterBaseCheckItemsCoveredByCanonical,
  normalizeCheckFieldKey,
} from '@/domain/presentation/dedupeCheckItems';
import type { CheckItem } from '@/types/compatibility';

describe('dedupeCheckItems', () => {
  it('normalizes manual override labels to one key', () => {
    expect(normalizeCheckFieldKey('Manuel kumanda')).toBe('manuel kumanda');
    expect(normalizeCheckFieldKey('Manuel kumanda katalogdan doğrulanmalıdır')).toBe(
      'manuel kumanda'
    );
  });

  it('keeps merkez tipi separate from sürgü behavior for check dedupe', () => {
    expect(normalizeCheckFieldKey('Merkez tipi')).toBe('merkez tipi');
    expect(normalizeCheckFieldKey('Sürgü davranışı')).toBe('spool_center_behavior');
    expect(normalizeCheckFieldKey('Sürgü sembolü / fonksiyon')).toBe('spool_center_behavior');
  });

  it('dedupes duplicate manual override check items', () => {
    const items: CheckItem[] = [
      {
        field: 'Manuel kumanda',
        sourceValue: 'a',
        targetValue: 'b',
        reasonTr: 'base',
        severity: 'medium',
      },
      {
        field: 'Manuel kumanda',
        sourceValue: 'N9',
        targetValue: 'N1',
        reasonTr: 'canonical',
        severity: 'medium',
      },
    ];
    expect(dedupeCheckItemsByField(items)).toHaveLength(1);
    expect(dedupeCheckItemsByField(items)[0].reasonTr).toBe('base');
  });

  it('drops base pressure when canonical pressure check exists', () => {
    const base: CheckItem[] = [
      {
        field: 'Basınç değeri',
        sourceValue: '?',
        targetValue: '?',
        reasonTr: 'base',
        severity: 'high',
      },
    ];
    const canonical: CheckItem[] = [
      {
        field: 'Maks. basınç (A/B/P)',
        sourceValue: 'Doğrulanamadı',
        targetValue: 'Doğrulanamadı',
        reasonTr: 'canonical',
        severity: 'high',
      },
    ];
    expect(filterBaseCheckItemsCoveredByCanonical(base, canonical)).toHaveLength(0);
  });
});
