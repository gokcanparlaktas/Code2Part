import { filterCheckItemsForResolvedIncompatibilities } from '@/domain/presentation/filterCheckItemsForResolvedIncompatibilities';
import type { AttributeComparison, CheckItem } from '@/types/compatibility';

describe('filterCheckItemsForResolvedIncompatibilities', () => {
  it('drops Montaj arayüzü when Montaj standardı is already different', () => {
    const checkItems: CheckItem[] = [
      {
        field: 'Montaj arayüzü',
        sourceValue: '?',
        targetValue: '?',
        reasonTr: 'Kontrol edilmeli',
        severity: 'medium',
      },
      {
        field: 'Bobin voltajı',
        sourceValue: '24V',
        targetValue: '24V',
        reasonTr: 'Kontrol edilmeli',
        severity: 'high',
      },
    ];
    const comparisons: AttributeComparison[] = [
      {
        label: 'Montaj standardı',
        sourceDisplay: 'CETOP 03 / NG6',
        targetDisplay: 'CETOP 05 / NG10',
        status: 'different',
      },
    ];

    const filtered = filterCheckItemsForResolvedIncompatibilities(checkItems, comparisons);
    expect(filtered.some((item) => item.field === 'Montaj arayüzü')).toBe(false);
    expect(filtered.some((item) => item.field === 'Bobin voltajı')).toBe(true);
  });
});
