import { getCanonicalDisplayValueForUi } from '@/domain/canonical/resolveCanonicalAttribute';
import type { CanonicalResolvedField, ConnectorFamilyKey } from '@/types/canonicalAttribute';

/** Ortak kısa DIN valf soketi etiketi (K4, U, ISO 4400 / DIN 43650 / EN 175301-803). */
export const DIN_VALVE_CONNECTOR_SHORT_LABEL = 'DIN 43650, EN 175301-803';

/**
 * Uzun katalog cümlesinden kısa standart etiketleri çıkarır.
 * Örn. "Connector 3 Pole … 175301-803" → "DIN 43650, EN 175301-803"
 */
export function shortenConnectorCatalogText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }

  const parts: string[] = [];
  if (/43650|ISO\s*4400|ISO4400/i.test(trimmed)) {
    parts.push('DIN 43650');
  }
  if (/175301/i.test(trimmed)) {
    parts.push('EN 175301-803');
  }

  if (parts.length > 0) {
    return [...new Set(parts)].join(', ');
  }

  if (/plug\s*-?\s*in/i.test(trimmed)) {
    return 'Fişli konnektör';
  }

  return trimmed;
}

export function formatConnectorUiLabel(options: {
  catalogText?: string | null;
  displayValue?: string | null;
  displayDetail?: string | null;
  connectorFamilyKey?: ConnectorFamilyKey;
  connectorStandardKey?: string;
  canonicalKey?: string;
}): string {
  const isDinFamily =
    options.connectorFamilyKey === 'DIN_VALVE_CONNECTOR' ||
    options.canonicalKey === 'DIN_VALVE_CONNECTOR' ||
    options.connectorStandardKey === 'DIN_43650_FORM_A_EN_175301_803' ||
    options.connectorStandardKey === 'ISO4400_DIN43650';

  let base: string;
  if (options.catalogText?.trim()) {
    const shortened = shortenConnectorCatalogText(options.catalogText);
    base = isDinFamily && shortened === options.catalogText.trim()
      ? DIN_VALVE_CONNECTOR_SHORT_LABEL
      : shortened;
  } else if (isDinFamily) {
    base = DIN_VALVE_CONNECTOR_SHORT_LABEL;
  } else {
    base = options.displayValue?.trim() || '';
  }

  const detail = options.displayDetail?.trim();
  if (detail && detail !== base && !base.includes(detail)) {
    return `${base} (${detail})`;
  }

  return base;
}

/** Primary UI label; optional non-critical detail in parentheses. */
export function formatConnectorDisplayValue(
  resolved: Pick<
    CanonicalResolvedField,
    | 'displayValue'
    | 'displayDetail'
    | 'canonicalKey'
    | 'connectorFamilyKey'
    | 'connectorStandardKey'
  >,
): string {
  const fromCanonical = formatConnectorUiLabel({
    displayValue: getCanonicalDisplayValueForUi(resolved),
    displayDetail: resolved.displayDetail,
    connectorFamilyKey: resolved.connectorFamilyKey,
    connectorStandardKey: resolved.connectorStandardKey,
    canonicalKey: resolved.canonicalKey,
  });

  return fromCanonical;
}
