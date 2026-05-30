import {
  getCatalogFunctionMappingsForSeries,
  getCatalogSeriesById,
  getCodePatternsForSeries,
  getKnownTokensForSeries,
  getVoltageCodesForSeries,
} from '@/domain/catalog/adapters/catalogV2Adapter';
import {
  isRexrothWECode,
  parseRexrothWE,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
import {
  isVickersDG4VCode,
  parseVickersDG4V,
} from '@/domain/categories/hydraulicValve/manufacturers/vickers/parseVickersDG4V';
import {
  isYukenDSGCode,
  parseYukenDSG,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import {
  isYukenDSHGCode,
  parseYukenDSHG,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSHG';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { CatalogFunctionMapping, CatalogSeries } from '@/types/catalog';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import {
  attributeDefLabel,
  buildAttributeResult,
  catalogConfidenceToAttribute,
  knownTokenNote,
} from './attributeEvidence';
import { PARSER_KEYS } from './parserFieldKeys';
import {
  extractFunctionTokenFromPatterns,
  extractInferredVoltageFromPatterns,
  extractLastCaptureFromPatterns,
} from './catalogPatternMatching';
import {
  escapeRegex,
  normalizeFunctionToken,
  normalizeProductCode,
} from './attributeNormalization';
import { voltageCodeAppearsInProductCode } from './defaultVoltageMatch';

export interface ExtractHydraulicAttributesOptions {
  inputCode: string;
  seriesId?: string | null;
}

function extractVoltageFromCatalog(
  normalized: string,
  series: CatalogSeries
): TechnicalAttributeResult {
  const defs = series.attributes;
  const label = attributeDefLabel(defs, 'voltage', 'Bobin kodu');
  const voltageCodes = [...getVoltageCodesForSeries(series.id)].sort(
    (a, b) => b.code.length - a.code.length
  );

  for (const entry of voltageCodes) {
    if (!voltageCodeAppearsInProductCode(entry.code, normalized, entry.matchPattern)) {
      continue;
    }

    if (entry.code === 'H7') {
      const hSplit = normalized.match(/-(H)([4-7])(?:-|$)/i);
      if (hSplit) {
        return buildAttributeResult({
          key: PARSER_KEYS.coil_rating,
          label,
          value: hSplit[1].toUpperCase(),
          evidence: 'code',
          confidence: catalogConfidenceToAttribute(entry.confidence),
          requiresCatalogCheck: true,
          sourceToken: hSplit[1].toUpperCase(),
          category: HYDRAULIC_VALVE_CATEGORY,
        });
      }
      return buildAttributeResult({
        key: PARSER_KEYS.coil_rating,
        label,
        value: 'H7',
        evidence: 'unknown',
        confidence: 'unknown',
        requiresCatalogCheck: true,
        sourceToken: 'H7',
        category: HYDRAULIC_VALVE_CATEGORY,
      });
    }

    return buildAttributeResult({
      key: PARSER_KEYS.coil_rating,
      label,
      value: entry.code,
      evidence: 'code',
      confidence: catalogConfidenceToAttribute(entry.confidence),
      requiresCatalogCheck: entry.requiresCatalogCheck,
      sourceToken: entry.code,
      category: HYDRAULIC_VALVE_CATEGORY,
    });
  }

  const inferredPatterns = getCodePatternsForSeries(series.id, 'inferred_voltage');
  const inferred = extractInferredVoltageFromPatterns(normalized, inferredPatterns);
  if (inferred) {
    return buildAttributeResult({
      key: PARSER_KEYS.coil_rating,
      label,
      value: inferred.token,
      evidence: 'inferred',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: inferred.token,
      category: HYDRAULIC_VALVE_CATEGORY,
    });
  }

  if (series.defaultCoilVoltageTr) {
    return buildAttributeResult({
      key: PARSER_KEYS.coil_rating,
      label,
      value: null,
      evidence: 'series_table',
      confidence: 'medium',
      requiresCatalogCheck: true,
      category: HYDRAULIC_VALVE_CATEGORY,
    });
  }

  return buildAttributeResult({
    key: PARSER_KEYS.coil_rating,
    label,
    value: null,
    evidence: 'unknown',
    confidence: 'unknown',
    category: HYDRAULIC_VALVE_CATEGORY,
  });
}

/** Fallback when catalog function_token patterns do not match. */
function functionTokenMatchesCode(
  normalized: string,
  mapping: CatalogFunctionMapping,
  series: CatalogSeries
): boolean {
  const token = normalizeFunctionToken(mapping.token);

  if (series.codePrefix.startsWith('4WE6') && token.length === 1) {
    return new RegExp(`^4WE6${escapeRegex(token)}`).test(normalized);
  }
  if (series.codePrefix.startsWith('4WE10') && token.length === 1) {
    return new RegExp(`^4WE10${escapeRegex(token)}`).test(normalized);
  }
  if (series.series.startsWith('DSG') && token.startsWith('3C')) {
    return new RegExp(`\\b${escapeRegex(token)}\\b`).test(normalized);
  }
  if (series.series.startsWith('DG4V') && /^\d[A-Z]$/.test(token)) {
    return new RegExp(`-${escapeRegex(token)}-`).test(normalized);
  }
  if (series.codePrefix === 'DHI' || series.codePrefix === 'DHU') {
    return (
      new RegExp(`${escapeRegex(series.codePrefix)}-${escapeRegex(token)}`).test(normalized) ||
      normalized.includes(token)
    );
  }
  if (series.codePrefix.startsWith('D1VW') || series.codePrefix.startsWith('D3VW')) {
    return normalized.startsWith(series.codePrefix.replace(/-/g, '')) && normalized.includes(token);
  }

  return new RegExp(`\\b${escapeRegex(token)}\\b`).test(normalized);
}

function extractFunctionFromCatalog(
  normalized: string,
  series: CatalogSeries
): TechnicalAttributeResult | null {
  const mappings = getCatalogFunctionMappingsForSeries(series.id).sort(
    (a, b) => b.token.length - a.token.length
  );

  const patternToken = extractFunctionTokenFromPatterns(
    normalized,
    getCodePatternsForSeries(series.id, 'function_token')
  );
  if (patternToken) {
    const mapping = mappings.find(
      (m) => normalizeFunctionToken(m.token) === normalizeFunctionToken(patternToken)
    );
    if (mapping) {
      return buildFunctionAttribute(series, mapping);
    }

    const label = attributeDefLabel(series.attributes, 'function_token', 'Fonksiyon kodu');
    return buildAttributeResult({
      key: PARSER_KEYS.function_code,
      label,
      value: patternToken,
      evidence: 'code',
      confidence: 'low',
      requiresCatalogCheck: true,
      sourceToken: patternToken,
      category: HYDRAULIC_VALVE_CATEGORY,
    });
  }

  for (const mapping of mappings) {
    if (!functionTokenMatchesCode(normalized, mapping, series)) {
      continue;
    }
    return buildFunctionAttribute(series, mapping);
  }

  return null;
}

function buildFunctionAttribute(
  series: CatalogSeries,
  mapping: CatalogFunctionMapping
): TechnicalAttributeResult {
  const label = attributeDefLabel(series.attributes, 'function_token', 'Fonksiyon kodu');
  return buildAttributeResult({
    key: PARSER_KEYS.function_code,
    label,
    value: mapping.token,
    evidence: 'code',
    confidence: catalogConfidenceToAttribute(mapping.confidence),
    requiresCatalogCheck: mapping.requiresCatalogCheck,
    sourceToken: mapping.token,
    category: HYDRAULIC_VALVE_CATEGORY,
  });
}

export function extractHydraulicAttributes(
  options: ExtractHydraulicAttributesOptions
): TechnicalAttributeResult[] {
  const normalized = normalizeProductCode(options.inputCode);
  const series = options.seriesId ? getCatalogSeriesById(options.seriesId) : undefined;

  const useRexrothWEParser =
    series?.id === 'rexroth_4we6' ||
    series?.id === 'rexroth_4we10' ||
    series?.codePrefix.startsWith('3WE6') ||
    series?.codePrefix.startsWith('4WE6') ||
    series?.codePrefix.startsWith('4WE10') ||
    isRexrothWECode(normalized);

  if (useRexrothWEParser) {
    const rexrothAttrs = parseRexrothWE(options.inputCode);
    if (rexrothAttrs) {
      if (series && !rexrothAttrs.some((attr) => attr.key === 'cetop_ng')) {
        rexrothAttrs.push(
          buildAttributeResult({
            key: 'cetop_ng',
            label: attributeDefLabel(series.attributes, 'cetop_ng', 'CETOP / NG'),
            value: series.cetopNgLabel ?? series.standardFamily,
            evidence: 'series_table',
            confidence: 'high',
            category: HYDRAULIC_VALVE_CATEGORY,
          })
        );
      }
      return rexrothAttrs;
    }
  }

  const useYukenDSGParser =
    series?.id === 'yuken_dsg01' ||
    series?.id === 'yuken_dsg03' ||
    series?.codePrefix?.startsWith('DSG-') ||
    isYukenDSGCode(normalized);

  if (useYukenDSGParser) {
    const yukenAttrs = parseYukenDSG(options.inputCode);
    if (yukenAttrs) {
      return yukenAttrs;
    }
  }

  const useYukenDSHGParser =
    series?.id === 'yuken_dshg03' ||
    series?.codePrefix?.startsWith('DSHG-') ||
    isYukenDSHGCode(normalized);

  if (useYukenDSHGParser) {
    const dshgAttrs = parseYukenDSHG(options.inputCode);
    if (dshgAttrs) {
      return dshgAttrs;
    }
  }

  const useVickersDG4VParser =
    series?.id === 'vickers_dg4v3' ||
    series?.id === 'vickers_dg4v5' ||
    series?.codePrefix?.startsWith('DG4V-') ||
    isVickersDG4VCode(normalized);

  if (useVickersDG4VParser) {
    const vickersAttrs = parseVickersDG4V(options.inputCode);
    if (vickersAttrs) {
      return vickersAttrs;
    }
  }

  const results: TechnicalAttributeResult[] = [];

  if (series) {
    results.push(
      buildAttributeResult({
        key: 'series',
        label: attributeDefLabel(series.attributes, 'series', 'Seri'),
        value: series.series,
        evidence: 'series_table',
        confidence: 'medium',
        category: HYDRAULIC_VALVE_CATEGORY,
      }),
      buildAttributeResult({
        key: 'cetop_ng',
        label: attributeDefLabel(series.attributes, 'cetop_ng', 'CETOP / NG'),
        value: series.cetopNgLabel ?? series.standardFamily,
        evidence: 'series_table',
        confidence: 'high',
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (series) {
    results.push(extractVoltageFromCatalog(normalized, series));
  } else {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.coil_rating,
        label: 'Bobin kodu',
        value: null,
        evidence: 'unknown',
        confidence: 'unknown',
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  if (series) {
    const functionAttr = extractFunctionFromCatalog(normalized, series);
    if (functionAttr) {
      results.push(functionAttr);
    }
  }

  const connectorPatterns = series
    ? getCodePatternsForSeries(series.id, 'connector')
    : [];
  const connector =
    connectorPatterns.length > 0
      ? extractLastCaptureFromPatterns(normalized, connectorPatterns, 'connector')
      : null;
  if (connector) {
    results.push(
      buildAttributeResult({
        key: PARSER_KEYS.connector_type,
        label: series
          ? attributeDefLabel(series.attributes, 'connector_token', 'Konnektör kodu')
          : 'Konnektör kodu',
        value: connector,
        evidence: 'code',
        confidence: 'low',
        requiresCatalogCheck: true,
        sourceToken: connector,
        category: HYDRAULIC_VALVE_CATEGORY,
      })
    );
  }

  const revisionPatterns = series ? getCodePatternsForSeries(series.id, 'revision') : [];
  const revision =
    revisionPatterns.length > 0
      ? extractLastCaptureFromPatterns(normalized, revisionPatterns, 'revision')
      : null;
  if (revision) {
    const isAtosNoConnectorToken =
      (series?.brand ?? '').trim().toLowerCase() === 'atos' &&
      revision.trim().toUpperCase() === 'X';
    if (isAtosNoConnectorToken) {
      results.push(
        buildAttributeResult({
          key: PARSER_KEYS.connector_type,
          label: series
            ? attributeDefLabel(series.attributes, 'connector_token', 'Konnektör kodu')
            : 'Konnektör kodu',
          value: revision,
          evidence: 'code',
          confidence: 'medium',
          requiresCatalogCheck: false,
          sourceToken: revision,
          category: HYDRAULIC_VALVE_CATEGORY,
        })
      );
      // Keep parsing other known tokens; only skip design_series row for X.
    } else {
      results.push(
        buildAttributeResult({
          key: PARSER_KEYS.design_series,
          label: 'Tasarım serisi kodu',
          value: revision,
          evidence: 'code',
          confidence: 'medium',
          sourceToken: revision,
          category: HYDRAULIC_VALVE_CATEGORY,
        })
      );
    }
  }

  for (const known of getKnownTokensForSeries(series?.id ?? '')) {
    if (!normalized.split(/[-/\\]+/).includes(known.token)) {
      continue;
    }
    results.push(
      buildAttributeResult({
        key: `known_${known.token}`,
        label: known.meaningTr ?? known.token,
        value: known.token,
        evidence: 'code',
        confidence: catalogConfidenceToAttribute(known.confidence),
        requiresCatalogCheck: known.requiresCatalogCheck,
        sourceToken: known.token,
        category: HYDRAULIC_VALVE_CATEGORY,
        note: knownTokenNote(known),
      })
    );
  }

  return results;
}
