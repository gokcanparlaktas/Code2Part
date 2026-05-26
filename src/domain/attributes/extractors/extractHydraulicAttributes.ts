import {
  getCatalogFunctionMappingsForSeries,
  getCatalogSeriesById,
  getCodePatternsForSeries,
  getKnownTokensForSeries,
  getVoltageCodesForSeries,
} from '@/domain/catalog/adapters/catalogV2Adapter';
import {
  isRexrothWE6Code,
  parseRexrothWE6,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE6';
import {
  isVickersDG4VCode,
  parseVickersDG4V,
} from '@/domain/categories/hydraulicValve/manufacturers/vickers/parseVickersDG4V';
import {
  isYukenDSGCode,
  parseYukenDSG,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { CatalogFunctionMapping, CatalogSeries } from '@/types/catalog';
import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import {
  attributeDefLabel,
  buildAttributeResult,
  catalogConfidenceToAttribute,
  knownTokenNote,
} from './attributeEvidence';
import {
  extractFunctionTokenFromPatterns,
  extractInferredVoltageFromPatterns,
  extractLastCaptureFromPatterns,
} from './catalogPatternMatching';
import {
  escapeRegex,
  normalizeFunctionToken,
  normalizeProductCode,
  normalizeVoltage,
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
  const label = attributeDefLabel(defs, 'voltage', 'Bobin voltajı');
  const voltageCodes = [...getVoltageCodesForSeries(series.id)].sort(
    (a, b) => b.code.length - a.code.length
  );

  for (const entry of voltageCodes) {
    if (!voltageCodeAppearsInProductCode(entry.code, normalized, entry.matchPattern)) {
      continue;
    }

    if (entry.code === 'H7' || (entry.requiresCatalogCheck && !entry.labelTr)) {
      return buildAttributeResult({
        key: 'voltage',
        label,
        value: null,
        evidence: 'unknown',
        confidence: 'unknown',
        requiresCatalogCheck: true,
        sourceToken: 'H7',
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'H7 kodu bobin voltajı olarak doğrulanamaz; katalog kontrolü gerekir.',
      });
    }

    const normalizedValue = normalizeVoltage(entry.labelTr);
    return buildAttributeResult({
      key: 'voltage',
      label,
      value: normalizedValue,
      normalizedValue,
      evidence: 'code',
      confidence: catalogConfidenceToAttribute(entry.confidence),
      requiresCatalogCheck: entry.requiresCatalogCheck,
      sourceToken: entry.code,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: `Kodda ${entry.code} geçti.`,
    });
  }

  const inferredPatterns = getCodePatternsForSeries(series.id, 'inferred_voltage');
  const inferred = extractInferredVoltageFromPatterns(normalized, inferredPatterns);
  if (inferred) {
    return buildAttributeResult({
      key: 'voltage',
      label,
      value: inferred.voltageValue,
      normalizedValue: inferred.voltageValue,
      evidence: 'inferred',
      confidence: 'medium',
      requiresCatalogCheck: true,
      sourceToken: inferred.token,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'Voltaj koddan tahmin edildi; katalogdan doğrulanmalıdır.',
    });
  }

  if (series.defaultCoilVoltageTr) {
    return buildAttributeResult({
      key: 'voltage',
      label,
      value: null,
      evidence: 'series_table',
      confidence: 'medium',
      requiresCatalogCheck: true,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'Seri bilgisinde tipik voltaj var; koddan doğrulanmadı.',
    });
  }

  return buildAttributeResult({
    key: 'voltage',
    label,
    value: null,
    evidence: 'unknown',
    confidence: 'unknown',
    category: HYDRAULIC_VALVE_CATEGORY,
    note: 'Voltaj koddan çıkarılamadı.',
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

    const label = attributeDefLabel(series.attributes, 'function_token', 'Fonksiyon / spool');
    return buildAttributeResult({
      key: 'function_token',
      label,
      value: patternToken,
      normalizedValue: normalizeFunctionToken(patternToken),
      evidence: 'code',
      confidence: 'low',
      requiresCatalogCheck: true,
      sourceToken: patternToken,
      category: HYDRAULIC_VALVE_CATEGORY,
      note: 'Fonksiyon kodu koddan okundu; sembol davranışı katalogdan doğrulanmalıdır.',
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
  const label = attributeDefLabel(series.attributes, 'function_token', 'Fonksiyon / spool');
  return buildAttributeResult({
    key: 'function_token',
    label,
    value: mapping.token,
    normalizedValue: normalizeFunctionToken(mapping.token),
    evidence: 'code',
    confidence: catalogConfidenceToAttribute(mapping.confidence),
    requiresCatalogCheck: mapping.requiresCatalogCheck,
    sourceToken: mapping.token,
    category: HYDRAULIC_VALVE_CATEGORY,
    note:
      mapping.noteTr ??
      'Bu bilgi koddan algılandı. Teknik anlamı katalog sembolleriyle doğrulanmalıdır.',
  });
}

export function extractHydraulicAttributes(
  options: ExtractHydraulicAttributesOptions
): TechnicalAttributeResult[] {
  const normalized = normalizeProductCode(options.inputCode);
  const series = options.seriesId ? getCatalogSeriesById(options.seriesId) : undefined;

  const useRexrothWE6Parser =
    series?.id === 'rexroth_4we6' ||
    series?.codePrefix.startsWith('4WE6') ||
    isRexrothWE6Code(normalized);

  if (useRexrothWE6Parser) {
    const rexrothAttrs = parseRexrothWE6(options.inputCode);
    if (rexrothAttrs) {
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
        key: 'voltage',
        label: 'Bobin voltajı',
        value: null,
        evidence: 'unknown',
        confidence: 'unknown',
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'Voltaj koddan çıkarılamadı.',
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
        key: 'connector_token',
        label: series
          ? attributeDefLabel(series.attributes, 'connector_token', 'Konnektör')
          : 'Konnektör',
        value: connector,
        evidence: 'code',
        confidence: 'low',
        requiresCatalogCheck: true,
        sourceToken: connector,
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.',
      })
    );
  }

  const revisionPatterns = series ? getCodePatternsForSeries(series.id, 'revision') : [];
  const revision =
    revisionPatterns.length > 0
      ? extractLastCaptureFromPatterns(normalized, revisionPatterns, 'revision')
      : null;
  if (revision) {
    results.push(
      buildAttributeResult({
        key: 'revision',
        label: 'Revizyon / seri',
        value: revision,
        evidence: 'code',
        confidence: 'medium',
        sourceToken: revision,
        category: HYDRAULIC_VALVE_CATEGORY,
        note: 'Bu bilgi koddan algılandı.',
      })
    );
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
