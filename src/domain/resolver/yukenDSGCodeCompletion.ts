import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import { buildYukenCenterTypeCompletionOptions } from '@/domain/categories/hydraulicValve/hydraulicValveCenterTypeSelection';
import { parseYukenDSGProductCode } from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import { getYukenDSGSpoolSemantics } from '@/domain/categories/hydraulicValve/manufacturers/yuken/yukenDSGSpoolSemantics';
import { formatCenterConditionSelectionLabel } from '@/domain/presentation/formatCenterTypeDisplay';
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

function buildFunctionOptions(): ProductCodeCompletionOption[] {
  return [...buildYukenCenterTypeCompletionOptions(), UNCERTAIN_COMPLETION_OPTION];
}

const YUKEN_VOLTAGE_OPTIONS: ProductCodeCompletionOption[] = [
  { token: 'D24', displayValue: '24 V DC' },
  { token: 'D12', displayValue: '12 V DC' },
  { token: 'D48', displayValue: '48 V DC' },
  UNCERTAIN_COMPLETION_OPTION,
];

const YUKEN_MANUAL_OPTIONS: ProductCodeCompletionOption[] = [
  { token: 'default', displayValue: 'Var' },
  { token: 'C', displayValue: 'Var (C tipi)' },
  UNCERTAIN_COMPLETION_OPTION,
];

const YUKEN_CONNECTOR_OPTIONS: ProductCodeCompletionOption[] = [
  { token: 'N1', displayValue: 'Standart' },
  { token: 'N', displayValue: 'Alternatif (N)' },
  UNCERTAIN_COMPLETION_OPTION,
];

const YUKEN_DESIGN_OPTIONS: ProductCodeCompletionOption[] = [
  { token: '70', displayValue: '70 (güncel)' },
  { token: '50', displayValue: '50 (eski)' },
  { token: '22', displayValue: '22' },
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

export interface YukenDSGPartialParse {
  valveSize: '01' | '03';
  series: string;
  spoolFunctionCode?: string;
  voltageToken?: string;
  manualOverrideToken?: 'default' | 'C';
  connectorToken?: string;
  designNumber?: string;
}

export function normalizeYukenDSGInput(raw: string): string {
  const normalized = normalizeProductCode(raw);
  return normalized.replace(/^DSG(01|03)$/i, 'DSG-$1');
}

export function isYukenDSGSeriesInput(raw: string): boolean {
  const normalized = normalizeYukenDSGInput(raw);
  if (/^DSHG/i.test(normalized)) {
    return false;
  }
  return /^DSG-(01|03)(?:-.*)?$/.test(normalized);
}

function buildMissingFieldDefinitions(
  partial: YukenDSGPartialParse
): ProductCodeCompletionFieldDefinition[] {
  const fields: ProductCodeCompletionFieldDefinition[] = [];

  if (!partial.spoolFunctionCode) {
    fields.push({
      key: 'function_code',
      labelTr: FIELD_LABELS.function_code,
      options: buildFunctionOptions(),
    });
  }

  if (!partial.voltageToken) {
    fields.push({
      key: 'coil_voltage',
      labelTr: FIELD_LABELS.coil_voltage,
      options: YUKEN_VOLTAGE_OPTIONS,
    });
  }

  if (partial.manualOverrideToken === undefined) {
    fields.push({
      key: 'manual_override',
      labelTr: FIELD_LABELS.manual_override,
      options: YUKEN_MANUAL_OPTIONS,
    });
  }

  if (!partial.connectorToken) {
    fields.push({
      key: 'connector_type',
      labelTr: FIELD_LABELS.connector_type,
      options: YUKEN_CONNECTOR_OPTIONS,
    });
  }

  if (!partial.designNumber) {
    fields.push({
      key: 'design_number',
      labelTr: FIELD_LABELS.design_number,
      options: YUKEN_DESIGN_OPTIONS,
    });
  }

  return fields;
}

export function parseYukenDSGPartialInput(raw: string): YukenDSGPartialParse | null {
  const normalized = normalizeYukenDSGInput(raw);
  const seriesMatch = normalized.match(/^DSG-(01|03)(?:-(.*))?$/);
  if (!seriesMatch) {
    return null;
  }

  const valveSize = seriesMatch[1] as '01' | '03';
  const partial: YukenDSGPartialParse = {
    valveSize,
    series: `DSG-${valveSize}`,
  };

  let rest = seriesMatch[2] ?? '';
  if (!rest) {
    return partial;
  }

  const functionMatch = rest.match(/^(\d[CBD]\d{1,2})(?:-(.*))?$/);
  if (!functionMatch) {
    return partial;
  }

  partial.spoolFunctionCode = functionMatch[1];
  rest = functionMatch[2] ?? '';
  if (!rest) {
    return partial;
  }

  const voltageMatch = rest.match(/^(D12|D24|D48)(?:-(.*))?$/);
  if (!voltageMatch) {
    return partial;
  }

  partial.voltageToken = voltageMatch[1];
  rest = voltageMatch[2] ?? '';
  if (!rest) {
    return partial;
  }

  if (rest.startsWith('C-')) {
    partial.manualOverrideToken = 'C';
    rest = rest.slice(2);
  } else if (rest === 'C') {
    partial.manualOverrideToken = 'C';
    rest = '';
  }

  if (!rest) {
    return partial;
  }

  const connectorMatch = rest.match(/^(N1?)(?:-(.*))?$/);
  if (!connectorMatch) {
    return partial;
  }

  partial.connectorToken = connectorMatch[1];
  rest = connectorMatch[2] ?? '';
  if (!rest) {
    return partial;
  }

  const designMatch = rest.match(/^(\d{2,3})$/);
  if (designMatch) {
    partial.designNumber = designMatch[1];
  }

  return partial;
}

function buildRecognizedFields(partial: YukenDSGPartialParse): ProductCodeCompletionRecognizedField[] {
  const fields: ProductCodeCompletionRecognizedField[] = [
    { key: 'manufacturer', labelTr: 'Üretici', value: 'Yuken' },
    { key: 'family', labelTr: 'Seri', value: partial.series },
  ];

  if (partial.spoolFunctionCode) {
    const semantics = getYukenDSGSpoolSemantics(partial.spoolFunctionCode);
    fields.push({
      key: 'function_code',
      labelTr: 'Merkez Tipi',
      value: semantics
        ? formatCenterConditionSelectionLabel(semantics.centerCondition)
        : 'Katalogdan kontrol',
    });
  }

  if (partial.voltageToken) {
    const voltageLabel =
      YUKEN_VOLTAGE_OPTIONS.find((option) => option.token === partial.voltageToken)?.displayValue ??
      partial.voltageToken;
    fields.push({
      key: 'coil_voltage',
      labelTr: 'Bobin voltajı',
      value: voltageLabel,
    });
  }

  if (partial.manualOverrideToken) {
    fields.push({
      key: 'manual_override',
      labelTr: 'Manuel kumanda',
      value: partial.manualOverrideToken === 'C' ? 'Var (C tipi)' : 'Var',
    });
  }

  if (partial.connectorToken) {
    fields.push({
      key: 'connector_type',
      labelTr: 'Konnektör tipi',
      value: partial.connectorToken,
    });
  }

  if (partial.designNumber) {
    fields.push({
      key: 'design_number',
      labelTr: 'Tasarım numarası',
      value: partial.designNumber,
    });
  }

  return fields;
}

function readSelectionValue(
  key: ProductCodeCompletionFieldKey,
  partial: YukenDSGPartialParse,
  selections: ProductCodeCompletionSelections
): string | null | undefined {
  switch (key) {
    case 'function_code':
      return partial.spoolFunctionCode ?? selections.function_code;
    case 'coil_voltage':
      return partial.voltageToken ?? selections.coil_voltage;
    case 'manual_override':
      return partial.manualOverrideToken ?? selections.manual_override;
    case 'connector_type':
      return partial.connectorToken ?? selections.connector_type;
    case 'design_number':
      return partial.designNumber ?? selections.design_number;
    default:
      return undefined;
  }
}

function resolveUncertainFields(
  partial: YukenDSGPartialParse,
  selections: ProductCodeCompletionSelections,
  missingFields: ProductCodeCompletionFieldDefinition[]
): ProductCodeCompletionFieldKey[] {
  return missingFields
    .map((field) => field.key)
    .filter((key) => {
      const value = readSelectionValue(key, partial, selections);
      return value === null || value === undefined;
    });
}

function assembleYukenDSGCode(
  partial: YukenDSGPartialParse,
  selections: ProductCodeCompletionSelections,
  uncertainFields: ProductCodeCompletionFieldKey[]
): string {
  let code = `DSG-${partial.valveSize}`;

  const functionCode = readSelectionValue('function_code', partial, selections);
  if (!functionCode || uncertainFields.includes('function_code')) {
    return code;
  }
  code += `-${functionCode}`;

  const voltage = readSelectionValue('coil_voltage', partial, selections);
  if (!voltage || uncertainFields.includes('coil_voltage')) {
    return code;
  }
  code += `-${voltage}`;

  const manual = readSelectionValue('manual_override', partial, selections);
  if (!uncertainFields.includes('manual_override') && manual === 'C') {
    code += '-C';
  }

  const connector = readSelectionValue('connector_type', partial, selections);
  if (!connector || uncertainFields.includes('connector_type')) {
    return code;
  }
  code += `-${connector}`;

  const design = readSelectionValue('design_number', partial, selections);
  if (!design || uncertainFields.includes('design_number')) {
    return code;
  }

  return `${code}-${design}`;
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

export function completeYukenDSGProductCode(
  inputCode: string,
  selections?: ProductCodeCompletionSelections
): ProductCodeCompletionResult | null {
  const normalizedInput = normalizeYukenDSGInput(inputCode);
  if (!isYukenDSGSeriesInput(normalizedInput)) {
    return null;
  }

  const parsedFull = parseYukenDSGProductCode(normalizedInput);
  if (parsedFull) {
    const partial = parseYukenDSGPartialInput(normalizedInput)!;
    return {
      inputCode,
      normalizedInput,
      manufacturer: 'Yuken',
      family: parsedFull.series,
      completionStatus: 'already_complete',
      recognizedFields: buildRecognizedFields({
        ...partial,
        manualOverrideToken: parsedFull.manualOverrideToken,
      }),
      missingFields: [],
      uncertainFields: [],
      completedCode: normalizedInput,
      checkNotes: [],
    };
  }

  const partial = parseYukenDSGPartialInput(normalizedInput);
  if (!partial) {
    return {
      inputCode,
      normalizedInput,
      manufacturer: 'Yuken',
      family: null,
      completionStatus: 'cannot_complete',
      recognizedFields: [],
      missingFields: [],
      uncertainFields: [],
      checkNotes: ['Yuken DSG kodu tanınamadı.'],
    };
  }

  const recognizedFields = buildRecognizedFields(partial);
  const missingFields = buildMissingFieldDefinitions(partial);

  if (missingFields.length === 0) {
    return {
      inputCode,
      normalizedInput,
      manufacturer: 'Yuken',
      family: partial.series,
      completionStatus: 'partial_unresolved',
      recognizedFields,
      missingFields: [],
      uncertainFields: [],
      completedCode: normalizedInput,
      checkNotes: ['Kod yapısı tamamlanmış görünüyor ancak tam sipariş kodu doğrulanamadı.'],
    };
  }

  if (!selections) {
    return {
      inputCode,
      normalizedInput,
      manufacturer: 'Yuken',
      family: partial.series,
      completionStatus: 'can_complete',
      recognizedFields,
      missingFields,
      uncertainFields: [],
      checkNotes: [],
    };
  }

  const uncertainFields = resolveUncertainFields(partial, selections, missingFields);
  const completedCode = assembleYukenDSGCode(partial, selections, uncertainFields);
  const completionStatus = resolveCompletionStatus(uncertainFields, completedCode);

  return {
    inputCode,
    normalizedInput,
    manufacturer: 'Yuken',
    family: partial.series,
    completionStatus,
    recognizedFields,
    missingFields: uncertainFields.length > 0 ? missingFields : [],
    uncertainFields,
    completedCode,
    selectedFields: selections,
    checkNotes: buildCheckNotes(uncertainFields),
  };
}
