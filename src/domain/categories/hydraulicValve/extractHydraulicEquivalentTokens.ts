import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import {
  isRexrothWECode,
  parseRexrothWEProductCode,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
import {
  REXROTH_WE_CODE_PREFIX_PATTERN,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWESeriesPrefixes';
import {
  isVickersDG4VCode,
  parseVickersDG4VProductCode,
} from '@/domain/categories/hydraulicValve/manufacturers/vickers/parseVickersDG4V';
import { isYukenDSGCode, parseYukenDSGProductCode } from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import type { ProductIdentification } from '@/types/product';

export interface HydraulicEquivalentTokens {
  spoolSymbol: string | null;
  functionCode: string | null;
  coilRating: string | null;
  manualOverride: string | null;
  connector: string | null;
  designSeries: string | null;
  designSeriesFamily: string | null;
}

function readAttribute(
  attributes: ReturnType<typeof getTechnicalAttributes>,
  key: string
): string | null {
  const match = attributes.find((attribute) => attribute.key === key);
  if (!match || match.value === null || match.value === undefined) {
    return null;
  }
  return String(match.value).trim() || null;
}

function extractFromRexrothParser(normalized: string): HydraulicEquivalentTokens | null {
  if (!isRexrothWECode(normalized)) {
    return null;
  }

  const parsed = parseRexrothWEProductCode(normalized);
  if (parsed) {
    return {
      spoolSymbol: parsed.spoolSymbol,
      functionCode: parsed.functionToken,
      coilRating: parsed.voltageToken,
      manualOverride: parsed.manualOverrideToken,
      connector: parsed.connectorToken,
      designSeries: parsed.rawDesignSeries,
      designSeriesFamily: parsed.componentSeriesFamily,
    };
  }

  const header = normalized.match(
    new RegExp(
      `^${REXROTH_WE_CODE_PREFIX_PATTERN}(E[AB]|DOF|[ABCDEGHJY])(?:-?)(([457][0-9])|([457]X))/?`,
      'i'
    )
  );
  if (!header) {
    return null;
  }

  const coilSection = normalized.includes('/') ? normalized.split('/')[1] ?? '' : '';
  const coilMatch = coilSection.match(/^(?:OF)?(EG24|CG24|HG24|G12|G24)(N9|N)?(K4|C4Z)?/i);

  const spoolToken = header[1] ?? '';
  const designTwoDigit = header[3];
  const designXNotation = header[4];

  return {
    spoolSymbol:
      spoolToken === 'DOF' ? 'D' : spoolToken.startsWith('E') ? 'E' : spoolToken.toUpperCase(),
    functionCode: spoolToken.toUpperCase(),
    coilRating: coilMatch?.[1]?.toUpperCase() ?? null,
    manualOverride: coilMatch?.[2]?.toUpperCase() ?? (coilMatch?.[1] ? 'none' : null),
    connector: coilMatch?.[3]?.toUpperCase() ?? null,
    designSeries: designTwoDigit ?? null,
    designSeriesFamily: designXNotation ?? designTwoDigit ?? null,
  };
}

function extractFromVickersParser(normalized: string): HydraulicEquivalentTokens | null {
  if (!isVickersDG4VCode(normalized)) {
    return null;
  }

  const parsed = parseVickersDG4VProductCode(normalized);
  if (!parsed) {
    return null;
  }

  return {
    spoolSymbol: parsed.spoolType,
    functionCode: parsed.spoolFunctionCode,
    coilRating: parsed.coilRatingCode,
    manualOverride: null,
    connector: parsed.connectorOption,
    designSeries: parsed.designNumber,
    designSeriesFamily: null,
  };
}

function extractFromYukenParser(normalized: string): HydraulicEquivalentTokens | null {
  if (!isYukenDSGCode(normalized)) {
    return null;
  }

  const parsed = parseYukenDSGProductCode(normalized);
  if (!parsed) {
    return null;
  }

  return {
    spoolSymbol: parsed.spoolType,
    functionCode: parsed.spoolFunctionCode,
    coilRating: parsed.voltageToken,
    manualOverride: parsed.manualOverrideToken,
    connector: parsed.connectorToken,
    designSeries: parsed.designNumber,
    designSeriesFamily: null,
  };
}

function mergeTokens(
  fromAttributes: HydraulicEquivalentTokens,
  fromParser: HydraulicEquivalentTokens | null
): HydraulicEquivalentTokens {
  if (!fromParser) {
    return fromAttributes;
  }

  return {
    spoolSymbol: fromParser.spoolSymbol ?? fromAttributes.spoolSymbol,
    functionCode: fromParser.functionCode ?? fromAttributes.functionCode,
    coilRating: fromParser.coilRating ?? fromAttributes.coilRating,
    manualOverride:
      fromParser.manualOverride ?? fromAttributes.manualOverride,
    connector: fromParser.connector ?? fromAttributes.connector,
    designSeries: fromParser.designSeries ?? fromAttributes.designSeries,
    designSeriesFamily: fromParser.designSeriesFamily ?? fromAttributes.designSeriesFamily,
  };
}

export function extractHydraulicEquivalentTokens(
  source: ProductIdentification
): HydraulicEquivalentTokens {
  const normalized = normalizeProductCode(source.inputCode || source.normalizedCode);
  const attributes = getTechnicalAttributes(source);

  const fromAttributes: HydraulicEquivalentTokens = {
    spoolSymbol: readAttribute(attributes, 'spool_symbol'),
    functionCode: readAttribute(attributes, 'function_code'),
    coilRating: readAttribute(attributes, 'coil_rating'),
    manualOverride: readAttribute(attributes, 'manual_override'),
    connector: readAttribute(attributes, 'connector_type'),
    designSeries:
      readAttribute(attributes, 'raw_design_series') ??
      readAttribute(attributes, 'design_series'),
    designSeriesFamily:
      readAttribute(attributes, 'design_series_family') ??
      readAttribute(attributes, 'component_series'),
  };

  return mergeTokens(
    fromAttributes,
    extractFromRexrothParser(normalized) ??
      extractFromYukenParser(normalized) ??
      extractFromVickersParser(normalized)
  );
}
