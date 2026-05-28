import type { AttributeComparison } from '@/types/compatibility';
import {
  UNKNOWN_CANONICAL_KEY,
  type CanonicalResolvedField,
  type ConnectorFamilyKey,
  type ConnectorOptionKey,
} from '@/types/canonicalAttribute';

import { isCanonicallyResolvedField } from '@/domain/canonical/resolveCanonicalAttribute';
import { formatConnectorDisplayValue } from './formatConnectorDisplayValue';

export interface ConnectorCanonicalSnapshot {
  canonicalKey: string;
  displayValue: string;
  connectorFamilyKey?: ConnectorFamilyKey;
  connectorStandardKey?: string;
  connectorOptions?: ConnectorOptionKey[];
  hasIndicatorLight?: boolean;
  hasPgPlug?: boolean;
  isGenericConnector?: boolean;
  requiresCatalogCheck: boolean;
  resolved: boolean;
}

export function connectorSnapshotFromResolved(
  resolved: CanonicalResolvedField,
): ConnectorCanonicalSnapshot {
  return {
    canonicalKey: resolved.canonicalKey,
    displayValue: formatConnectorDisplayValue(resolved),
    connectorFamilyKey: resolved.connectorFamilyKey,
    connectorStandardKey: resolved.connectorStandardKey,
    connectorOptions: resolved.connectorOptions,
    hasIndicatorLight: resolved.hasIndicatorLight,
    hasPgPlug: resolved.hasPgPlug,
    isGenericConnector: resolved.isGenericConnector,
    requiresCatalogCheck: resolved.requiresCatalogCheck,
    resolved: isCanonicallyResolvedField(resolved),
  };
}

function optionSetsDiffer(
  left?: ConnectorOptionKey[],
  right?: ConnectorOptionKey[],
): boolean {
  const a = new Set(left ?? []);
  const b = new Set(right ?? []);
  if (a.size !== b.size) {
    return true;
  }
  for (const key of a) {
    if (!b.has(key)) {
      return true;
    }
  }
  return false;
}

function buildOptionDifferenceWarning(
  source: ConnectorCanonicalSnapshot,
  target: ConnectorCanonicalSnapshot,
): string | null {
  if (
    source.hasIndicatorLight !== target.hasIndicatorLight ||
    (source.connectorOptions?.includes('INDICATOR_LIGHT') &&
      !target.connectorOptions?.includes('INDICATOR_LIGHT')) ||
    (!source.connectorOptions?.includes('INDICATOR_LIGHT') &&
      target.connectorOptions?.includes('INDICATOR_LIGHT'))
  ) {
    return 'Konnektör opsiyonu farklı olabilir: ışıklı / ışıksız';
  }

  if (
    source.hasPgPlug !== target.hasPgPlug ||
    optionSetsDiffer(source.connectorOptions, target.connectorOptions)
  ) {
    if (
      source.connectorOptions?.includes('PG11_ENTRY') ||
      target.connectorOptions?.includes('PG11_ENTRY')
    ) {
      return 'Konnektör giriş detayı kontrol edilmeli: PG11';
    }
  }

  if (optionSetsDiffer(source.connectorOptions, target.connectorOptions)) {
    return 'Konnektör opsiyonu farklı olabilir';
  }

  return null;
}

function isGenericVsSpecificFamily(
  source: ConnectorCanonicalSnapshot,
  target: ConnectorCanonicalSnapshot,
): boolean {
  const genericFamilies: ConnectorFamilyKey[] = ['PLUG_IN_CONNECTOR'];
  const specificFamilies: ConnectorFamilyKey[] = [
    'DIN_VALVE_CONNECTOR',
    'AMP_JUNIOR_TIMER',
    'DEUTSCH_CONNECTOR',
    'M12_CONNECTOR',
  ];

  const sourceFamily = source.connectorFamilyKey ?? 'UNKNOWN';
  const targetFamily = target.connectorFamilyKey ?? 'UNKNOWN';

  const sourceGeneric =
    source.isGenericConnector && genericFamilies.includes(sourceFamily);
  const targetGeneric =
    target.isGenericConnector && genericFamilies.includes(targetFamily);

  if (sourceGeneric && specificFamilies.includes(targetFamily)) {
    return true;
  }
  if (targetGeneric && specificFamilies.includes(sourceFamily)) {
    return true;
  }
  return false;
}

export function compareConnectorCanonicalSnapshots(
  source: ConnectorCanonicalSnapshot,
  target: ConnectorCanonicalSnapshot,
  label = 'Konnektör tipi',
): { comparison: AttributeComparison; sentence: string | null; warning?: string } {
  const sourceDisplay = source.displayValue;
  const targetDisplay = target.displayValue;

  if (!source.resolved || !target.resolved) {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      sentence: 'Konnektör tipi katalogdan doğrulanmalıdır.',
    };
  }

  if (source.canonicalKey === UNKNOWN_CANONICAL_KEY || target.canonicalKey === UNKNOWN_CANONICAL_KEY) {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      sentence: 'Konnektör tipi katalogdan doğrulanmalıdır.',
    };
  }

  if (isGenericVsSpecificFamily(source, target)) {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      sentence: 'Konnektör tipi katalogdan doğrulanmalıdır.',
    };
  }

  const sourceFamily = source.connectorFamilyKey ?? 'UNKNOWN';
  const targetFamily = target.connectorFamilyKey ?? 'UNKNOWN';

  if (sourceFamily === 'NO_CONNECTOR' || targetFamily === 'NO_CONNECTOR') {
    if (sourceFamily === targetFamily) {
      return {
        comparison: {
          label,
          sourceDisplay,
          targetDisplay,
          status: 'compatible',
        },
        sentence: 'İki üründe de konnektör dahil değil; bağlantı aksesuarı ayrıca sipariş edilir.',
        warning: 'Konnektör/aksesuar seçimi ayrıca kontrol edilmelidir.',
      };
    }
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      sentence:
        'Bir üründe konnektör dahil değil; bağlantı aksesuarı ayrıca kontrol edilmelidir.',
    };
  }

  if (sourceFamily !== targetFamily && sourceFamily !== 'UNKNOWN' && targetFamily !== 'UNKNOWN') {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'different',
      },
      sentence: `Konnektör ailesi farklı: ${sourceDisplay} / ${targetDisplay}`,
    };
  }

  if (source.canonicalKey === target.canonicalKey) {
    const optionWarning = buildOptionDifferenceWarning(source, target);
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      sentence: `Konnektör ailesi aynı: ${sourceDisplay}`,
      ...(optionWarning ? { warning: optionWarning } : {}),
    };
  }

  if (sourceFamily === targetFamily && sourceFamily !== 'UNKNOWN') {
    const standardsDiffer =
      source.connectorStandardKey &&
      target.connectorStandardKey &&
      source.connectorStandardKey !== target.connectorStandardKey;

    if (standardsDiffer) {
      return {
        comparison: {
          label,
          sourceDisplay,
          targetDisplay,
          status: 'unknownOrCheck',
        },
        sentence:
          'Aynı konnektör ailesinde görünüyor; form/pin/gövde detayı kontrol edilmeli.',
      };
    }

    const optionWarning = buildOptionDifferenceWarning(source, target);
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      sentence: `Konnektör ailesi aynı: ${sourceDisplay}`,
      ...(optionWarning ? { warning: optionWarning } : {}),
    };
  }

  return {
    comparison: {
      label,
      sourceDisplay,
      targetDisplay,
      status: 'different',
    },
    sentence: `Konnektör ailesi farklı: ${sourceDisplay} / ${targetDisplay}`,
  };
}
