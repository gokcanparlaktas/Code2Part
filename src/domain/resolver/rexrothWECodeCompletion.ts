import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { buildRexrothCenterTypeCompletionOptions, formatRexrothSpoolDisplayLabel } from '@/domain/categories/hydraulicValve/hydraulicValveCenterTypeSelection';
import {
  isRexrothWECode,
  parseRexrothWEProductCode,
  parseRexrothWECoilSectionTokens,
  type RexrothWECoilSectionTokens,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
import {
  analyzePartialRexrothWE,
  parseRexrothWEHeaderOnly,
  parseRexrothWEPartialHeader,
  type RexrothWEPartialHeader,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWEParserDiagnostics';
import { parseRexrothWEDesignSeriesToken } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWEDesignSeries';
import { rexrothWEAllowedDesignFirstDigits } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWESeriesPrefixes';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import type {
  ProductCodeCompletionFieldDefinition,
  ProductCodeCompletionFieldKey,
  ProductCodeCompletionOption,
  ProductCodeCompletionRecognizedField,
  ProductCodeCompletionResult,
  ProductCodeCompletionSelections,
  ProductCodeCompletionStatus,
} from '@/types/productCodeCompletion';
import { UNCERTAIN_COMPLETION_OPTION } from '@/types/productCodeCompletion';

const COIL_VOLTAGE_OPTIONS: ProductCodeCompletionOption[] = [
  { token: 'EG24', displayValue: '24 V DC' },
  { token: 'G12', displayValue: '12 V DC' },
  { token: 'HG24', displayValue: '24 V DC (H tipi)' },
  UNCERTAIN_COMPLETION_OPTION,
];

const MANUAL_OVERRIDE_OPTIONS: ProductCodeCompletionOption[] = [
  { token: 'N9', displayValue: 'Var' },
  { token: '', displayValue: 'Yok' },
  UNCERTAIN_COMPLETION_OPTION,
];

const CONNECTOR_OPTIONS: ProductCodeCompletionOption[] = [
  { token: 'K4', displayValue: 'Standart (K4)' },
  { token: 'C4Z', displayValue: 'Alternatif (C4Z)' },
  UNCERTAIN_COMPLETION_OPTION,
];

const FIELD_LABELS: Record<ProductCodeCompletionFieldKey, string> = {
  function_code: 'Merkez Tipi',
  spool_symbol: 'Merkez Tipi',
  design_series: 'Tasarım serisi',
  coil_voltage: 'Bobin voltajı',
  manual_override: 'Manuel kumanda',
  connector_type: 'Konnektör tipi',
  design_number: 'Tasarım numarası',
};

const UNCERTAIN_FIELD_NOTES: Record<ProductCodeCompletionFieldKey, string> = {
  function_code:
    'Merkez tipi seçilmedi. Muadil adaylarında merkez tipi alanı katalogdan kontrol edilmelidir.',
  spool_symbol:
    'Merkez tipi seçilmedi. Muadil adaylarında merkez tipi alanı katalogdan kontrol edilmelidir.',
  design_series:
    'Tasarım serisi seçilmedi. Muadil adaylarında tasarım serisi alanı kontrol edilmelidir.',
  coil_voltage:
    'Bobin voltajı seçilmedi. Muadil adaylarında gerilim alanı katalogdan kontrol edilmelidir.',
  manual_override:
    'Manuel kumanda seçilmedi. Muadil adaylarında manuel kumanda alanı kontrol edilmelidir.',
  connector_type:
    'Konnektör tipi seçilmedi. Muadil adaylarında konnektör alanı kontrol edilmelidir.',
  design_number:
    'Tasarım numarası seçilmedi. Muadil adaylarında tasarım serisi alanı kontrol edilmelidir.',
};

function buildSpoolOptions(): ProductCodeCompletionOption[] {
  return [...buildRexrothCenterTypeCompletionOptions(), UNCERTAIN_COMPLETION_OPTION];
}

function allowedDesignDigits(seriesPrefix: RexrothWEPartialHeader['seriesPrefix']): string {
  return rexrothWEAllowedDesignFirstDigits(seriesPrefix);
}

function hasParsedDesign(partial: RexrothWEPartialHeader): boolean {
  return Boolean(partial.rawDesignSeries || partial.componentSeriesFamily);
}

function buildDesignSeriesOptions(
  seriesPrefix: RexrothWEPartialHeader['seriesPrefix']
): ProductCodeCompletionOption[] {
  if (seriesPrefix === '4WE10') {
    return [
      { token: '35', displayValue: '35' },
      { token: '51', displayValue: '51' },
      { token: '31', displayValue: '31' },
      { token: '52', displayValue: '52' },
      UNCERTAIN_COMPLETION_OPTION,
    ];
  }

  return [
    { token: '62', displayValue: '62' },
    { token: '61', displayValue: '61' },
    { token: '71', displayValue: '71' },
    { token: '72', displayValue: '72' },
    UNCERTAIN_COMPLETION_OPTION,
  ];
}

function extractParsedCoilFromNormalized(
  normalizedInput: string
): RexrothWECoilSectionTokens | null {
  const slashIndex = normalizedInput.indexOf('/');
  if (slashIndex === -1) {
    return null;
  }
  return parseRexrothWECoilSectionTokens(normalizedInput.slice(slashIndex + 1));
}

function buildMissingFieldDefinitions(
  partial: RexrothWEPartialHeader,
  parsedCoil: RexrothWECoilSectionTokens | null
): ProductCodeCompletionFieldDefinition[] {
  const fields: ProductCodeCompletionFieldDefinition[] = [];

  if (!partial.spoolToken) {
    fields.push({
      key: 'spool_symbol',
      labelTr: FIELD_LABELS.spool_symbol,
      options: buildSpoolOptions(),
    });
  }

  if (!hasParsedDesign(partial)) {
    fields.push({
      key: 'design_series',
      labelTr: FIELD_LABELS.design_series,
      options: buildDesignSeriesOptions(partial.seriesPrefix),
    });
  }

  if (!parsedCoil?.voltageToken) {
    fields.push(
      {
        key: 'coil_voltage',
        labelTr: FIELD_LABELS.coil_voltage,
        options: COIL_VOLTAGE_OPTIONS,
      },
      {
        key: 'manual_override',
        labelTr: FIELD_LABELS.manual_override,
        options: MANUAL_OVERRIDE_OPTIONS,
      },
      {
        key: 'connector_type',
        labelTr: FIELD_LABELS.connector_type,
        options: CONNECTOR_OPTIONS,
      }
    );
  } else {
    if (!parsedCoil.manualOverrideToken) {
      fields.push({
        key: 'manual_override',
        labelTr: FIELD_LABELS.manual_override,
        options: MANUAL_OVERRIDE_OPTIONS,
      });
    }

    if (!parsedCoil.connectorToken) {
      fields.push({
        key: 'connector_type',
        labelTr: FIELD_LABELS.connector_type,
        options: CONNECTOR_OPTIONS,
      });
    }
  }

  return fields;
}

function resolveDesignSegment(
  partial: RexrothWEPartialHeader,
  selections: ProductCodeCompletionSelections,
  uncertainFields: ProductCodeCompletionFieldKey[]
): string | null {
  if (partial.rawDesignSeries) {
    return partial.rawDesignSeries;
  }

  if (uncertainFields.includes('design_series')) {
    return null;
  }

  const token = selections.design_series;
  if (!token) {
    return null;
  }

  const parsed = parseRexrothWEDesignSeriesToken(token, allowedDesignDigits(partial.seriesPrefix));
  if (parsed?.rawDesignSeries) {
    return parsed.rawDesignSeries;
  }

  if (/^\d{2}$/.test(token)) {
    return token;
  }

  return null;
}

function buildHeaderSegment(
  partial: RexrothWEPartialHeader,
  selections: ProductCodeCompletionSelections,
  uncertainFields: ProductCodeCompletionFieldKey[]
): string | null {
  const spoolToken = partial.spoolToken ?? selections.spool_symbol;
  if (!spoolToken || uncertainFields.includes('spool_symbol')) {
    return partial.seriesPrefix;
  }

  const designSegment = resolveDesignSegment(partial, selections, uncertainFields);
  if (!designSegment) {
    return `${partial.seriesPrefix}${spoolToken}`;
  }

  return `${partial.seriesPrefix}${spoolToken}-${designSegment}`;
}

function buildCoilSection(selections: ProductCodeCompletionSelections): {
  coilSection: string | null;
  uncertainFields: ProductCodeCompletionFieldKey[];
} {
  const uncertainFields: ProductCodeCompletionFieldKey[] = [];
  let coilSection = '';

  if (selections.coil_voltage === null || selections.coil_voltage === undefined) {
    uncertainFields.push('coil_voltage');
  } else if (selections.coil_voltage) {
    coilSection += selections.coil_voltage;
  } else {
    uncertainFields.push('coil_voltage');
  }

  if (selections.manual_override === null || selections.manual_override === undefined) {
    uncertainFields.push('manual_override');
  } else if (selections.manual_override) {
    coilSection += selections.manual_override;
  }

  if (selections.connector_type === null || selections.connector_type === undefined) {
    uncertainFields.push('connector_type');
  } else if (selections.connector_type) {
    coilSection += selections.connector_type;
  }

  if (!coilSection) {
    return { coilSection: null, uncertainFields };
  }

  return { coilSection, uncertainFields };
}

function buildRecognizedFields(
  partial: RexrothWEPartialHeader,
  parsedCoil: RexrothWECoilSectionTokens | null
): ProductCodeCompletionRecognizedField[] {
  const fields: ProductCodeCompletionRecognizedField[] = [
    { key: 'manufacturer', labelTr: 'Üretici', value: 'Rexroth' },
    { key: 'series', labelTr: 'Seri', value: partial.seriesPrefix },
    { key: 'family', labelTr: 'Aile', value: partial.sourceFamily },
  ];

  if (partial.spoolToken) {
    fields.push({
      key: 'spool_symbol',
      labelTr: 'Merkez Tipi',
      value: formatRexrothSpoolDisplayLabel(partial.spoolToken),
    });
  }

  if (hasParsedDesign(partial)) {
    fields.push({
      key: 'design_series',
      labelTr: 'Tasarım serisi',
      value: partial.rawDesignSeries ?? partial.designDisplay ?? '',
    });
  }

  if (parsedCoil?.voltageToken) {
    fields.push({
      key: 'coil_voltage',
      labelTr: FIELD_LABELS.coil_voltage,
      value: parsedCoil.voltageToken,
    });
  }

  if (parsedCoil?.manualOverrideToken) {
    fields.push({
      key: 'manual_override',
      labelTr: FIELD_LABELS.manual_override,
      value: 'Var (N9)',
    });
  }

  if (parsedCoil?.connectorToken) {
    fields.push({
      key: 'connector_type',
      labelTr: FIELD_LABELS.connector_type,
      value: parsedCoil.connectorToken,
    });
  }

  return fields;
}

function resolveUncertainFields(
  partial: RexrothWEPartialHeader,
  selections: ProductCodeCompletionSelections,
  missingFields: ProductCodeCompletionFieldDefinition[]
): ProductCodeCompletionFieldKey[] {
  return missingFields
    .map((field) => field.key)
    .filter((key) => {
      switch (key) {
        case 'spool_symbol':
          return (
            !partial.spoolToken &&
            (selections.spool_symbol === null || selections.spool_symbol === undefined)
          );
        case 'design_series':
          return (
            !hasParsedDesign(partial) &&
            (selections.design_series === null || selections.design_series === undefined)
          );
        case 'coil_voltage':
          return selections.coil_voltage === null || selections.coil_voltage === undefined;
        case 'manual_override':
          return selections.manual_override === null || selections.manual_override === undefined;
        case 'connector_type':
          return selections.connector_type === null || selections.connector_type === undefined;
        default:
          return false;
      }
    });
}

function resolveCompletionStatus(
  uncertainFields: ProductCodeCompletionFieldKey[],
  completedCode: string | null
): ProductCodeCompletionStatus {
  if (!completedCode) {
    return 'partial_unresolved';
  }

  const identification = identifyProduct(completedCode, normalizeCode(completedCode));
  if (identification.outcome === 'full' && uncertainFields.length === 0) {
    return 'completed_full';
  }

  return 'completed_partial';
}

function buildCheckNotes(uncertainFields: ProductCodeCompletionFieldKey[]): string[] {
  return uncertainFields.map((field) => UNCERTAIN_FIELD_NOTES[field]);
}

export function completeRexrothWEProductCode(
  inputCode: string,
  selections?: ProductCodeCompletionSelections
): ProductCodeCompletionResult | null {
  const normalizedInput = normalizeProductCode(inputCode);
  if (!isRexrothWECode(normalizedInput)) {
    return null;
  }

  const parsedCoilFromInput = extractParsedCoilFromNormalized(normalizedInput);

  const parsedFull = parseRexrothWEProductCode(inputCode);
  if (parsedFull) {
    const partial = parseRexrothWEPartialHeader(normalizedInput)!;
    return {
      inputCode,
      normalizedInput,
      manufacturer: 'Rexroth',
      family: parsedFull.sourceFamily,
      completionStatus: 'already_complete',
      recognizedFields: buildRecognizedFields(
        {
          ...partial,
          spoolToken: parsedFull.functionToken,
          spoolSymbol: parsedFull.spoolSymbol,
          rawDesignSeries: parsedFull.rawDesignSeries,
          componentSeriesFamily: parsedFull.componentSeriesFamily,
          designDisplay: parsedFull.rawDesignSeries ?? parsedFull.componentSeriesFamily,
        },
        parsedCoilFromInput
      ),
      missingFields: [],
      uncertainFields: [],
      completedCode: normalizedInput.includes('/') ? normalizedInput : inputCode.trim(),
      checkNotes: [],
    };
  }

  const headerOnly = parseRexrothWEHeaderOnly(normalizedInput);
  if (
    headerOnly &&
    parsedCoilFromInput?.voltageToken &&
    parsedCoilFromInput.connectorToken &&
    identifyProduct(normalizedInput, normalizeCode(normalizedInput)).outcome === 'full'
  ) {
    const partial = parseRexrothWEPartialHeader(normalizedInput)!;
    return {
      inputCode,
      normalizedInput,
      manufacturer: 'Rexroth',
      family: headerOnly.sourceFamily,
      completionStatus: 'already_complete',
      recognizedFields: buildRecognizedFields(
        {
          ...partial,
          spoolToken: headerOnly.spoolToken,
          spoolSymbol: headerOnly.spoolSymbol,
          rawDesignSeries: headerOnly.rawDesignSeries,
          componentSeriesFamily: headerOnly.componentSeriesFamily,
          designDisplay: headerOnly.designDisplay,
        },
        parsedCoilFromInput
      ),
      missingFields: [],
      uncertainFields: [],
      completedCode: normalizedInput,
      checkNotes: [],
    };
  }

  const partial = parseRexrothWEPartialHeader(normalizedInput);
  const diagnostics = analyzePartialRexrothWE(normalizedInput);

  if (!partial) {
    return {
      inputCode,
      normalizedInput,
      manufacturer: 'Rexroth',
      family: null,
      completionStatus: diagnostics.unresolvedSegments.includes('spool_symbol')
        ? 'partial_unresolved'
        : 'cannot_complete',
      recognizedFields: [],
      missingFields: [],
      uncertainFields: [],
      checkNotes: diagnostics.parserNotes,
    };
  }

  const recognizedFields = buildRecognizedFields(partial, parsedCoilFromInput);
  const missingFields = buildMissingFieldDefinitions(partial, parsedCoilFromInput);

  if (!selections) {
    return {
      inputCode,
      normalizedInput,
      manufacturer: 'Rexroth',
      family: partial.sourceFamily,
      completionStatus: 'can_complete',
      recognizedFields,
      missingFields,
      uncertainFields: [],
      checkNotes: [],
    };
  }

  const uncertainFields = resolveUncertainFields(partial, selections, missingFields);
  const headerSegment = buildHeaderSegment(partial, selections, uncertainFields);
  const { coilSection, uncertainFields: coilUncertain } = buildCoilSection(selections);
  const allUncertain = [...new Set([...uncertainFields, ...coilUncertain])];

  const completedCode =
    headerSegment && coilSection ? `${headerSegment}/${coilSection}` : headerSegment;

  const completionStatus = resolveCompletionStatus(allUncertain, completedCode);

  return {
    inputCode,
    normalizedInput,
    manufacturer: 'Rexroth',
    family: partial.sourceFamily,
    completionStatus,
    recognizedFields,
    missingFields: allUncertain.length > 0 ? missingFields : [],
    uncertainFields: allUncertain,
    completedCode,
    selectedFields: selections,
    checkNotes: buildCheckNotes(allUncertain),
  };
}
