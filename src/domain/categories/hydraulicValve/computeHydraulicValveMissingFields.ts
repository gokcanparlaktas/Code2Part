import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import type { ProductIdentification } from '@/types/product';
import type { SuggestionMissingField } from '@/types/suggestion';

function attributeIsMissing(key: string, attributes: ReturnType<typeof getTechnicalAttributes>): boolean {
  const attr = attributes.find((a) => a.key === key);
  if (!attr || attr.value === null || attr.value === undefined) {
    return true;
  }
  return attr.evidence === 'unknown';
}

export function computeHydraulicValveMissingFields(
  identification: ProductIdentification
): SuggestionMissingField[] {
  const attributes = getTechnicalAttributes(identification);
  const missing: SuggestionMissingField[] = [];

  if (attributeIsMissing('function_token', attributes)) {
    missing.push('spool_function');
  }
  if (attributeIsMissing('voltage', attributes)) {
    missing.push('coil_voltage');
  }
  if (attributeIsMissing('connector_token', attributes)) {
    missing.push('connector');
  }

  return missing;
}
