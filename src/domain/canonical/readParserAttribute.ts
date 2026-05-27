import type { TechnicalAttribute } from '@/types/technicalAttribute';

type AttributeWithNormalized = TechnicalAttribute & {
  normalizedValue?: string | number | null;
  requiresCatalogCheck?: boolean;
  sourceToken?: string;
};

export function readFirstParserAttr(
  map: Map<string, AttributeWithNormalized>,
  keys: string[],
): AttributeWithNormalized | undefined {
  for (const key of keys) {
    const attr = map.get(key);
    if (attr) {
      return attr;
    }
  }
  return undefined;
}

export function readFirstParserDisplay(
  map: Map<string, AttributeWithNormalized>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const attr = map.get(key);
    if (!attr || attr.value === null || attr.value === undefined) {
      continue;
    }
    const unit = attr.unit ? ` ${attr.unit}` : '';
    return `${attr.value}${unit}`;
  }
  return undefined;
}

export function readFirstParserToken(
  map: Map<string, AttributeWithNormalized>,
  keys: string[],
): string | undefined {
  const attr = readFirstParserAttr(map, keys);
  if (!attr) {
    return undefined;
  }
  if (attr.sourceToken?.trim()) {
    return attr.sourceToken.trim();
  }
  if (attr.value === null || attr.value === undefined) {
    return undefined;
  }
  return String(attr.value).trim();
}
