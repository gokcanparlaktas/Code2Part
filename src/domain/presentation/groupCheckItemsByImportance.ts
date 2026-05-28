import type { AttributeImportance, CheckItem } from '@/types/compatibility';

export type GroupedCheckItems = {
  critical: CheckItem[];
  important: CheckItem[];
  optional: CheckItem[];
};

export function severityToImportance(severity: CheckItem['severity']): AttributeImportance {
  if (severity === 'high') {
    return 'critical';
  }
  if (severity === 'low') {
    return 'optional';
  }
  return 'important';
}

export function groupCheckItemsByImportance(checkItems: CheckItem[]): GroupedCheckItems {
  const grouped: GroupedCheckItems = { critical: [], important: [], optional: [] };

  for (const item of checkItems) {
    const bucket = severityToImportance(item.severity);
    if (bucket === 'critical') {
      grouped.critical.push(item);
    } else if (bucket === 'optional') {
      grouped.optional.push(item);
    } else {
      grouped.important.push(item);
    }
  }

  return grouped;
}

