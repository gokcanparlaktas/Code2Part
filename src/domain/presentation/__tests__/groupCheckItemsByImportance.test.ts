import type { CheckItem } from '@/types/compatibility';

import { groupCheckItemsByImportance, severityToImportance } from '../groupCheckItemsByImportance';

describe('groupCheckItemsByImportance', () => {
  it('maps high severity to critical', () => {
    expect(severityToImportance('high')).toBe('critical');
  });

  it('maps medium severity to important', () => {
    expect(severityToImportance('medium')).toBe('important');
  });

  it('maps low severity to optional', () => {
    expect(severityToImportance('low')).toBe('optional');
  });

  it('groups items correctly and counts match', () => {
    const items: CheckItem[] = [
      { field: 'A', sourceValue: '1', targetValue: '1', reasonTr: 'x', severity: 'high' },
      { field: 'B', sourceValue: '1', targetValue: '1', reasonTr: 'x', severity: 'medium' },
      { field: 'C', sourceValue: '1', targetValue: '1', reasonTr: 'x', severity: 'low' },
      { field: 'D', sourceValue: '1', targetValue: '1', reasonTr: 'x', severity: 'medium' },
    ];

    const grouped = groupCheckItemsByImportance(items);
    expect(grouped.critical).toHaveLength(1);
    expect(grouped.important).toHaveLength(2);
    expect(grouped.optional).toHaveLength(1);
    expect(grouped.critical[0]?.field).toBe('A');
  });
});

