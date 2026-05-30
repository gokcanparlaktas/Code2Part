import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { parseRexrothWEProductCode } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
import { isRexrothWECode } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
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
    /^(3WE6|4WE6|4WE10)(E[AB]|DOF|[ABCDEGHJY])(?:-?)(([67][0-9])|([67]X))\/?/i
  );
  if (!header) {
    return null;
  }

  const coilSection = normalized.includes('/') ? normalized.split('/')[1] ?? '' : '';
  const coilMatch = coilSection.match(/^(?:OF)?(EG24|CG24|HG24|G12|G24)(N9|N)?(K4|C4Z)?/i);

  return {
    spoolSymbol: header[2] === 'DOF' ? 'D' : header[2].startsWith('E') ? 'E' : header[2].toUpperCase(),
    functionCode: header[2].toUpperCase(),
    coilRating: coilMatch?.[1]?.toUpperCase() ?? null,
    manualOverride: coilMatch?.[2]?.toUpperCase() ?? null,
    connector: coilMatch?.[3]?.toUpperCase() ?? null,
    designSeries: header[3]?.length === 2 ? header[3] : null,
    designSeriesFamily: header[4] ? `${header[4]}X` : header[3]?.toUpperCase() ?? null,
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
    manualOverride: parsed.manualOverrideToken === 'default' ? null : parsed.manualOverrideToken,
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
      fromParser.manualOverride ??
      (fromAttributes.manualOverride === 'default' ? null : fromAttributes.manualOverride),
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
    extractFromRexrothParser(normalized) ?? extractFromYukenParser(normalized)
  );
}
