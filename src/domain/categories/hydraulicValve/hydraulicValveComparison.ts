import type {
  AttributeComparison,
  CheckItem,
  CompatibilityResult,
  EquivalenceSummary,
  EquivalentCandidate,
} from '@/types/compatibility';
import type { ProductIdentification, TechnicalAttribute } from '@/types/product';
import { formatAttributeValue } from '@/utils/formatConfidence';

import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { compareValveFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctionBehavior';
import {
  getHydraulicValveCheckItems,
  HYDRAULIC_VALVE_WARNINGS,
} from './hydraulicValveCheckItems';

function displayAttribute(attr: TechnicalAttribute<string | number>): string {
  return formatAttributeValue(attr.value, attr.unit);
}

function compareAttribute(
  label: string,
  source: TechnicalAttribute<string | number>,
  target: TechnicalAttribute<string | number> | string
): AttributeComparison {
  const targetAttr: TechnicalAttribute<string | number> =
    typeof target === 'string'
      ? { value: target, evidence: 'series_table', requiresCheck: false }
      : target;

  const sourceDisplay = displayAttribute(source);
  const targetDisplay = displayAttribute(targetAttr);

  if (source.requiresCheck || targetAttr.requiresCheck) {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (
    source.evidence === 'unknown' ||
    targetAttr.evidence === 'unknown' ||
    source.value === null ||
    targetAttr.value === null
  ) {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (source.evidence === 'inferred' || targetAttr.evidence === 'inferred') {
    return { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (String(source.value) === String(targetAttr.value)) {
    return { label, sourceDisplay, targetDisplay, status: 'compatible' };
  }

  return { label, sourceDisplay, targetDisplay, status: 'different' };
}

type AttributeWithNormalized = ReturnType<typeof getTechnicalAttributes>[number] & {
  normalizedValue?: string | number | null;
};

function getAttrValue(
  attributes: ReturnType<typeof getTechnicalAttributes>,
  key: string
): string | null {
  const match = attributes.find((a) => a.key === key);
  if (!match || match.value === null) {
    return null;
  }
  const unit = match.unit ? ` ${match.unit}` : '';
  return `${match.value}${unit}`;
}

/** Prefer normalized machine values (e.g. spring_centered) when present. */
function getComparableAttrValue(
  attributes: ReturnType<typeof getTechnicalAttributes>,
  key: string
): string | null {
  const match = attributes.find((a) => a.key === key) as AttributeWithNormalized | undefined;
  if (!match) {
    return null;
  }
  if (match.normalizedValue !== undefined && match.normalizedValue !== null) {
    return String(match.normalizedValue);
  }
  if (match.value === null) {
    return null;
  }
  const unit = match.unit ? ` ${match.unit}` : '';
  return `${match.value}${unit}`;
}

function getFunctionTokenForComparison(
  attributes: ReturnType<typeof getTechnicalAttributes>
): string | null {
  return (
    getAttrValue(attributes, 'function_token') ??
    getAttrValue(attributes, 'spool_function_code') ??
    getAttrValue(attributes, 'spool_symbol')
  );
}

const UNRESOLVED_COIL_VOLTAGE_CODES = new Set(['H7']);

function compareCoilVoltageCode(options: {
  sourceValue: string | null;
  targetValue: string | null;
}): AttributeComparison {
  const sourceDisplay = options.sourceValue ?? 'Doğrulanamadı';
  const targetDisplay = options.targetValue ?? 'Doğrulanamadı';

  if (!options.sourceValue || !options.targetValue) {
    return {
      label: 'Bobin kodu',
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
    };
  }

  if (
    UNRESOLVED_COIL_VOLTAGE_CODES.has(options.sourceValue) ||
    UNRESOLVED_COIL_VOLTAGE_CODES.has(options.targetValue)
  ) {
    return {
      label: 'Bobin kodu',
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
    };
  }

  if (options.sourceValue === options.targetValue) {
    return {
      label: 'Bobin kodu',
      sourceDisplay,
      targetDisplay,
      status: 'compatible',
    };
  }

  return {
    label: 'Bobin kodu',
    sourceDisplay,
    targetDisplay,
    status: 'different',
  };
}

function compareOptionalString(options: {
  label: string;
  sourceValue: string | null;
  targetValue: string | null;
  missingMessageTr: string;
}): AttributeComparison {
  const sourceDisplay = options.sourceValue ?? 'Doğrulanamadı';
  const targetDisplay = options.targetValue ?? 'Doğrulanamadı';

  if (!options.sourceValue || !options.targetValue) {
    return {
      label: options.label,
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
    };
  }

  if (options.sourceValue === options.targetValue) {
    return {
      label: options.label,
      sourceDisplay,
      targetDisplay,
      status: 'compatible',
    };
  }

  return {
    label: options.label,
    sourceDisplay,
    targetDisplay,
    status: 'different',
  };
}

function comparisonToCheckItem(comparison: AttributeComparison): CheckItem | null {
  if (comparison.status !== 'unknownOrCheck') {
    return null;
  }

  return {
    field: comparison.label,
    sourceValue: comparison.sourceDisplay,
    targetValue: comparison.targetDisplay,
    reasonTr: `${comparison.label} için yeterli kesin bilgi yok. Katalog veya şema ile doğrulanmalıdır.`,
    severity: comparison.label.includes('CETOP') ? 'high' : 'medium',
  };
}

function lookupEquivalenceSummary(
  compatibleCount: number,
  differentCount: number
): EquivalenceSummary {
  if (differentCount > 0) {
    return {
      matchLevelTr: 'Fonksiyonel alternatif',
      summaryTr:
        'CETOP/NG veya kategori farkı var. Hidrolik valf muadili için detaylı mühendislik kontrolü gerekir.',
      riskLevel: 'high',
    };
  }

  if (compatibleCount >= 2) {
    return {
      matchLevelTr: 'Mekanik muadil adayı',
      summaryTr:
        'Aynı CETOP/NG grubunda muadil olabilir. Sürgü, bobin ve konnektör sipariş öncesi doğrulanmalıdır.',
      riskLevel: 'medium',
    };
  }

  return {
    matchLevelTr: 'Fonksiyonel alternatif',
    summaryTr: 'Sınırlı alan uyumu. Tüm teknik detaylar kontrol edilmelidir.',
    riskLevel: 'high',
  };
}

export function compareHydraulicValves(
  source: ProductIdentification,
  candidate: EquivalentCandidate
): CompatibilityResult {
  const target = candidate.targetIdentification;
  const sourceAttrs = getTechnicalAttributes(source);
  const targetAttrs = target ? getTechnicalAttributes(target) : [];

  const sourceCetop =
    source.cetopNgSize ??
    ({
      value: source.standardFamily.value,
      evidence: source.standardFamily.evidence,
      requiresCheck: false,
    } as TechnicalAttribute<string>);

  const targetCetop: TechnicalAttribute<string> = target?.cetopNgSize ??
    target?.standardFamily ?? {
      value: candidate.standardFamily,
      evidence: 'series_table',
      requiresCheck: false,
    };

  const sourceVoltage = getAttrValue(sourceAttrs, 'voltage');
  const targetVoltage = target ? getAttrValue(targetAttrs, 'voltage') : null;

  const sourceConnector =
    getAttrValue(sourceAttrs, 'connector') ?? getAttrValue(sourceAttrs, 'connector_token');
  const targetConnector = target
    ? getAttrValue(targetAttrs, 'connector') ?? getAttrValue(targetAttrs, 'connector_token')
    : null;

  const sourceFunction = getFunctionTokenForComparison(sourceAttrs);
  const targetFunction = target ? getFunctionTokenForComparison(targetAttrs) : null;

  const functionMatch = compareValveFunctionBehavior({
    label: 'Sürgü / fonksiyon kodu',
    source: {
      manufacturer: String(source.brand.value ?? ''),
      series: String(source.series.value ?? ''),
      token: sourceFunction,
    },
    target: {
      manufacturer: target ? String(target.brand.value ?? '') : candidate.brand,
      series: target ? String(target.series.value ?? '') : candidate.series,
      token: targetFunction,
    },
  });

  const sourceCoilCode = getAttrValue(sourceAttrs, 'coil_voltage_code');
  const targetCoilCode = target ? getAttrValue(targetAttrs, 'coil_voltage_code') : null;
  const sourceElectrical = getAttrValue(sourceAttrs, 'electrical_option');
  const targetElectrical = target ? getAttrValue(targetAttrs, 'electrical_option') : null;
  const sourceDesign = getAttrValue(sourceAttrs, 'design_number');
  const targetDesign = target ? getAttrValue(targetAttrs, 'design_number') : null;

  const comparisons: AttributeComparison[] = [
    compareAttribute(
      'Ürün kategorisi',
      source.productCategory,
      candidate.productCategory
    ),
    compareAttribute('CETOP / NG ölçüsü', sourceCetop, targetCetop),
    compareOptionalString({
      label: 'Bobin voltajı',
      sourceValue: sourceVoltage,
      targetValue: targetVoltage,
      missingMessageTr: 'Bobin voltajı eksik veya doğrulanamadı.',
    }),
    compareOptionalString({
      label: 'Konnektör kodu',
      sourceValue: sourceConnector,
      targetValue: targetConnector,
      missingMessageTr: 'Konnektör kodu eksik veya doğrulanamadı.',
    }),
    compareOptionalString({
      label: 'Konum sayısı',
      sourceValue: getComparableAttrValue(sourceAttrs, 'number_of_positions'),
      targetValue: target ? getComparableAttrValue(targetAttrs, 'number_of_positions') : null,
      missingMessageTr: 'Konum sayısı katalogdan doğrulanmalıdır.',
    }),
    compareOptionalString({
      label: 'Yay düzeni',
      sourceValue: getComparableAttrValue(sourceAttrs, 'spring_arrangement'),
      targetValue: target ? getComparableAttrValue(targetAttrs, 'spring_arrangement') : null,
      missingMessageTr: 'Yay düzeni katalogdan doğrulanmalıdır.',
    }),
    compareOptionalString({
      label: 'Sürgü tipi',
      sourceValue: getAttrValue(sourceAttrs, 'spool_type'),
      targetValue: target ? getAttrValue(targetAttrs, 'spool_type') : null,
      missingMessageTr: 'Sürgü tipi katalogdan doğrulanmalıdır.',
    }),
    compareOptionalString({
      label: 'Manuel kumanda',
      sourceValue: getAttrValue(sourceAttrs, 'manual_override'),
      targetValue: target ? getAttrValue(targetAttrs, 'manual_override') : null,
      missingMessageTr: 'Manuel kumanda bilgisi eksik veya doğrulanamadı.',
    }),
    compareOptionalString({
      label: 'Port deseni',
      sourceValue: getAttrValue(sourceAttrs, 'porting_pattern'),
      targetValue: target ? getAttrValue(targetAttrs, 'porting_pattern') : null,
      missingMessageTr: 'Port deseni katalogdan doğrulanmalıdır.',
    }),
    compareOptionalString({
      label: 'Maks. debi',
      sourceValue: getAttrValue(sourceAttrs, 'max_flow'),
      targetValue: target ? getAttrValue(targetAttrs, 'max_flow') : null,
      missingMessageTr: 'Maksimum debi katalogdan doğrulanmalıdır.',
    }),
    functionMatch.comparison,
  ];

  if (sourceCoilCode || targetCoilCode) {
    comparisons.splice(
      comparisons.findIndex((c) => c.label === 'Konnektör kodu') + 1,
      0,
      compareCoilVoltageCode({
        sourceValue: sourceCoilCode,
        targetValue: targetCoilCode,
      })
    );
  }

  if (sourceElectrical || targetElectrical) {
    comparisons.push(
      compareOptionalString({
        label: 'Elektrik seçeneği',
        sourceValue: sourceElectrical,
        targetValue: targetElectrical,
        missingMessageTr: 'Elektrik seçeneği katalogdan doğrulanmalıdır.',
      })
    );
  }

  if (sourceDesign || targetDesign) {
    comparisons.push(
      compareOptionalString({
        label: 'Tasarım serisi',
        sourceValue: sourceDesign,
        targetValue: targetDesign,
        missingMessageTr: 'Tasarım serisi katalogdan doğrulanmalıdır.',
      })
    );
  }

  const sourcePressureAbp = getAttrValue(sourceAttrs, 'max_pressure_abp');
  const targetPressureAbp = target ? getAttrValue(targetAttrs, 'max_pressure_abp') : null;
  if (sourcePressureAbp || targetPressureAbp) {
    comparisons.push(
      compareOptionalString({
        label: 'Maks. basınç (A/B/P)',
        sourceValue: sourcePressureAbp,
        targetValue: targetPressureAbp,
        missingMessageTr: 'Maksimum çalışma basıncı katalogdan doğrulanmalıdır.',
      })
    );
  }

  const compatible = comparisons.filter((c) => c.status === 'compatible');
  const different = comparisons.filter((c) => c.status === 'different');

  const attributeChecks = comparisons
    .map((c) => comparisonToCheckItem(c))
    .filter((item): item is CheckItem => item !== null);

  const findComparison = (label: string) => comparisons.find((c) => c.label === label);
  const spoolComparison = findComparison('Sürgü / fonksiyon kodu');
  const voltageComparison = findComparison('Bobin voltajı');
  const connectorComparison = findComparison('Konnektör kodu');

  const checkItems = [
    // dynamic category check items (only when missing/unknown)
    ...getHydraulicValveCheckItems(source, candidate, {
      spool: spoolComparison
        ? {
            source: spoolComparison.sourceDisplay,
            target: spoolComparison.targetDisplay,
            status: spoolComparison.status,
            reasonTr:
              spoolComparison.status === 'unknownOrCheck'
                ? functionMatch.statusMessageTr
                : undefined,
          }
        : undefined,
      voltage: voltageComparison
        ? { source: voltageComparison.sourceDisplay, target: voltageComparison.targetDisplay, status: voltageComparison.status }
        : undefined,
      connector: connectorComparison
        ? { source: connectorComparison.sourceDisplay, target: connectorComparison.targetDisplay, status: connectorComparison.status }
        : undefined,
    }),
    // any other unknown comparisons (e.g. category/cetop missing) as generic check items
    ...attributeChecks.filter(
      (item) =>
        !['Bobin voltajı', 'Konnektör kodu', 'Sürgü / fonksiyon kodu'].includes(item.field)
    ),
  ];

  const warningSet = new Set<string>(HYDRAULIC_VALVE_WARNINGS);
  if (
    functionMatch.requiresCatalogCheck &&
    functionMatch.statusMessageTr &&
    functionMatch.comparison.status === 'different'
  ) {
    warningSet.add(functionMatch.statusMessageTr);
  }

  const warnings = [...warningSet];
  if (!candidate.suggestedCode) {
    warnings.push(
      'Örnek muadil kodu gösterilemedi. Sürgü, voltaj ve konnektör bilgileri doğrulanmalıdır.'
    );
  }

  return {
    candidate,
    summary: lookupEquivalenceSummary(compatible.length, different.length),
    compatible,
    different,
    checkItems,
    warnings,
  };
}
