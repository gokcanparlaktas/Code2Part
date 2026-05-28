import type {
  AttributeComparison,
  CheckItem,
  CompatibilityResult,
  CompatibilityStatus,
  EquivalentCandidate,
  ScoredAttributeComparison,
} from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import { compareValveFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctionBehavior';
import {
  getHydraulicValveCheckItems,
  HYDRAULIC_VALVE_WARNINGS,
} from '@/domain/categories/hydraulicValve/hydraulicValveCheckItems';
import { buildCategoryComparison } from '@/domain/categories/hydraulicValve/behavior/behaviorComparisonToCompatibility';

import { isCatalogCheckDisplayText } from '@/domain/canonical/catalogCheckDisplay';
import {
  compareConnectorCanonicalSnapshots,
  connectorSnapshotFromResolved,
  type ConnectorCanonicalSnapshot,
} from '@/domain/canonical/connector/compareConnectorCanonical';
import { resolveCanonicalAttribute } from '@/domain/canonical/resolveCanonicalAttribute';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';

import { FIELD_LABELS } from './hydraulicValveCanonicalDictionary';
import { normalizeHydraulicVoltageDisplay } from './hydraulicValveAttributeDisplay';
import {
  summarizeSpoolBehaviorForComparison,
} from './hydraulicValveBehaviorDescriptions';
import type { CanonicalField, HydraulicValveCanonicalProfile } from './hydraulicValveCanonicalTypes';
import { UNRESOLVED_VOLTAGE_CODES } from './normalizeHydraulicValveAttribute';

export interface HydraulicValveCanonicalComparisonResult {
  compatible: string[];
  different: string[];
  unknownOrCheck: string[];
  warnings: string[];
  comparisons: AttributeComparison[];
  scoredComparisons: ScoredAttributeComparison[];
  requiresCatalogCheck: boolean;
  crossBrandSimilarBehavior: boolean;
  spoolDynamicCheck?: {
    source: string;
    target: string;
    status: CompatibilityStatus;
    reasonTr?: string;
  };
}

function isSameBrandSeries(source: HydraulicValveCanonicalProfile, target: HydraulicValveCanonicalProfile): boolean {
  if (!source.brand || !target.brand || !source.series || !target.series) {
    return false;
  }
  return (
    source.brand.trim().toLowerCase() === target.brand.trim().toLowerCase() &&
    source.series.trim().toLowerCase() === target.series.trim().toLowerCase()
  );
}

function isUnknownCanonicalValue<T>(value: T | null | undefined): boolean {
  return value === null || value === undefined || value === 'unknown';
}

function compareCanonicalEnumField<T extends string>(options: {
  sourceField: CanonicalField<T>;
  targetField: CanonicalField<T>;
  sourceValue: T | null;
  targetValue: T | null;
  compatibleMessage: (display: string) => string;
  differentMessage: (sourceDisplay: string, targetDisplay: string) => string;
  unknownMessage: string;
  crossBrand?: boolean;
  treatSameAsCheckWhenCrossBrand?: boolean;
}): { comparison: AttributeComparison; sentence: string | null } {
  const sourceDisplay = options.sourceField.displayValue;
  const targetDisplay = options.targetField.displayValue;
  const label = options.sourceField.label;

  if (isUnknownCanonicalValue(options.sourceValue) || isUnknownCanonicalValue(options.targetValue)) {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      sentence: options.unknownMessage,
    };
  }

  if (options.sourceValue === options.targetValue) {
    if (
      isCatalogCheckDisplayText(sourceDisplay) ||
      isCatalogCheckDisplayText(targetDisplay)
    ) {
      return {
        comparison: {
          label,
          sourceDisplay,
          targetDisplay,
          status: 'unknownOrCheck',
        },
        sentence: options.unknownMessage,
      };
    }
    if (options.treatSameAsCheckWhenCrossBrand && options.crossBrand) {
      return {
        comparison: {
          label,
          sourceDisplay,
          targetDisplay,
          status: 'unknownOrCheck',
        },
        sentence: options.unknownMessage,
      };
    }

    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      sentence: options.compatibleMessage(sourceDisplay),
    };
  }

  return {
    comparison: {
      label,
      sourceDisplay,
      targetDisplay,
      status: 'different',
    },
    sentence: options.differentMessage(sourceDisplay, targetDisplay),
  };
}

function connectorSnapshotFromProfileField(
  field: HydraulicValveCanonicalProfile['connectorType'],
  brand?: string,
  series?: string,
): ConnectorCanonicalSnapshot {
  if (field.connectorFamilyKey) {
    return {
      canonicalKey: field.value ?? 'unknown',
      displayValue: field.displayValue,
      connectorFamilyKey: field.connectorFamilyKey,
      connectorStandardKey: field.connectorStandardKey,
      connectorOptions: field.connectorOptions,
      isGenericConnector: field.isGenericConnector,
      requiresCatalogCheck: Boolean(field.requiresCatalogCheck),
      resolved: !isUnknownCanonicalValue(field.value),
    };
  }

  const rawToken = field.rawToken;
  if (rawToken) {
    const resolved = resolveCanonicalAttribute({
      category: HYDRAULIC_VALVE_CATEGORY,
      manufacturer: brand,
      series,
      attributeKey: 'connector_type',
      rawToken,
    });
    return connectorSnapshotFromResolved(resolved);
  }

  return {
    canonicalKey: field.value ?? 'unknown',
    displayValue: field.displayValue,
    requiresCatalogCheck: Boolean(field.requiresCatalogCheck),
    resolved: !isUnknownCanonicalValue(field.value),
  };
}

function compareConnectorFields(
  source: HydraulicValveCanonicalProfile,
  target: HydraulicValveCanonicalProfile
): { comparison: AttributeComparison; sentence: string | null; warning?: string } {
  const result = compareConnectorCanonicalSnapshots(
    connectorSnapshotFromProfileField(source.connectorType, source.brand, source.series),
    connectorSnapshotFromProfileField(target.connectorType, target.brand, target.series),
    FIELD_LABELS.connectorType,
  );
  return result;
}

function compareOptionalNumericFields(
  sourceField: CanonicalField<number | null> | undefined,
  targetField: CanonicalField<number | null> | undefined,
  unknownMessage: string,
  unit: string
): { comparison: AttributeComparison; sentence: string | null } {
  const label = sourceField?.label ?? targetField?.label ?? '';
  const sourceDisplay =
    sourceField?.value != null ? `${sourceField.value} ${unit}` : 'Doğrulanamadı';
  const targetDisplay =
    targetField?.value != null ? `${targetField.value} ${unit}` : 'Doğrulanamadı';

  if (sourceField?.value == null || targetField?.value == null) {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      sentence: unknownMessage,
    };
  }

  if (sourceField.value === targetField.value) {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      sentence: `${label} aynı: ${sourceDisplay}`,
    };
  }

  return {
    comparison: {
      label,
      sourceDisplay,
      targetDisplay,
      status: 'different',
    },
    sentence: `${label} farklı: ${sourceDisplay} / ${targetDisplay}`,
  };
}

function pushResult(
  result: HydraulicValveCanonicalComparisonResult,
  comparison: AttributeComparison,
  sentence: string | null,
  importance: ScoredAttributeComparison['importance']
): void {
  result.comparisons.push(comparison);
  result.scoredComparisons.push({ ...comparison, importance });

  if (comparison.status === 'compatible' && sentence) {
    result.compatible.push(sentence);
  } else if (comparison.status === 'different' && sentence) {
    result.different.push(sentence);
  } else if (comparison.status === 'unknownOrCheck' && sentence) {
    result.unknownOrCheck.push(sentence);
  }
}

export function compareHydraulicValveCanonicalProfiles(
  source: HydraulicValveCanonicalProfile,
  target: HydraulicValveCanonicalProfile
): HydraulicValveCanonicalComparisonResult {
  const crossBrand = !isSameBrandSeries(source, target);
  const requiresCatalogCheck =
    crossBrand ||
    source.notes.length > 0 ||
    target.notes.length > 0 ||
    Boolean(source.centerCondition.requiresCatalogCheck) ||
    Boolean(target.centerCondition.requiresCatalogCheck) ||
    Boolean(source.connectorType.requiresCatalogCheck) ||
    Boolean(target.connectorType.requiresCatalogCheck);

  const result: HydraulicValveCanonicalComparisonResult = {
    compatible: [],
    different: [],
    unknownOrCheck: [],
    warnings: [],
    comparisons: [],
    scoredComparisons: [],
    requiresCatalogCheck,
    crossBrandSimilarBehavior: false,
  };

  if (requiresCatalogCheck) {
    result.warnings.push(
      'Sürgü davranışı ve bobin seçenekleri katalog sembolleriyle doğrulanmalıdır.'
    );
  }

  const mounting = compareCanonicalEnumField({
    sourceField: source.mountingStandard,
    targetField: target.mountingStandard,
    sourceValue: source.mountingStandard.value,
    targetValue: target.mountingStandard.value,
    compatibleMessage: (display) => `Montaj standardı aynı: ${display}`,
    differentMessage: (sourceDisplay, targetDisplay) =>
      `Montaj standardı farklı: ${sourceDisplay} / ${targetDisplay}`,
    unknownMessage: 'Montaj standardı katalogdan doğrulanmalıdır.',
    crossBrand,
  });
  pushResult(result, mounting.comparison, mounting.sentence, 'critical');

  const ways = compareCanonicalEnumField({
    sourceField: source.waysPositions,
    targetField: target.waysPositions,
    sourceValue: source.waysPositions.value,
    targetValue: target.waysPositions.value,
    compatibleMessage: (display) => `Yol/konum yapısı aynı: ${display}`,
    differentMessage: (sourceDisplay, targetDisplay) =>
      `Yol/konum yapısı farklı: ${sourceDisplay} / ${targetDisplay}`,
    unknownMessage: 'Yol/konum yapısı katalogdan doğrulanmalıdır.',
    crossBrand,
  });
  pushResult(result, ways.comparison, ways.sentence, 'critical');

  const centerRequiresCheck =
    source.centerCondition.requiresCatalogCheck ||
    target.centerCondition.requiresCatalogCheck ||
    source.centerCondition.confidence === 'low' ||
    target.centerCondition.confidence === 'low';

  const center = compareCanonicalEnumField({
    sourceField: source.centerCondition,
    targetField: target.centerCondition,
    sourceValue: source.centerCondition.value,
    targetValue: target.centerCondition.value,
    compatibleMessage: (display) => `Merkez tipi aynı: ${display}`,
    differentMessage: (sourceDisplay, targetDisplay) =>
      `Merkez tipi farklı: ${sourceDisplay} / ${targetDisplay}`,
    unknownMessage: 'Merkez tipi katalog sembolünden doğrulanmalıdır.',
    crossBrand,
    treatSameAsCheckWhenCrossBrand: centerRequiresCheck,
  });
  pushResult(result, center.comparison, center.sentence, 'critical');

  const centering = compareCanonicalEnumField({
    sourceField: source.centering,
    targetField: target.centering,
    sourceValue: source.centering.value,
    targetValue: target.centering.value,
    compatibleMessage: (display) => `Merkezleme aynı: ${display}`,
    differentMessage: (sourceDisplay, targetDisplay) =>
      `Merkezleme farklı: ${sourceDisplay} / ${targetDisplay}`,
    unknownMessage: 'Merkezleme katalogdan doğrulanmalıdır.',
    crossBrand,
  });
  pushResult(result, centering.comparison, centering.sentence, 'critical');

  const voltage = compareCanonicalEnumField({
    sourceField: source.coilVoltage,
    targetField: target.coilVoltage,
    sourceValue: source.coilVoltage.value,
    targetValue: target.coilVoltage.value,
    compatibleMessage: (display) => `Bobin voltajı aynı: ${display}`,
    differentMessage: (sourceDisplay, targetDisplay) =>
      `Bobin voltajı farklı: ${sourceDisplay} / ${targetDisplay}`,
    unknownMessage: 'Bobin voltajı katalogdan doğrulanmalıdır.',
    crossBrand,
  });
  if (source.coilVoltage.requiresCatalogCheck || target.coilVoltage.requiresCatalogCheck) {
    // If both sides canonically resolve to the same voltage, treat as compatible
    // but still warn that the coil code should be verified from catalog.
    if (voltage.comparison.status === 'compatible') {
      pushResult(result, voltage.comparison, voltage.sentence, 'critical');
      result.warnings.push('Bobin voltajı kodu katalogdan doğrulanmalıdır.');
    } else {
      voltage.comparison.status = 'unknownOrCheck';
      pushResult(result, voltage.comparison, 'Bobin voltajı katalogdan doğrulanmalıdır.', 'critical');
    }
  } else {
    pushResult(result, voltage.comparison, voltage.sentence, 'critical');
  }
  if (
    voltage.comparison.status === 'unknownOrCheck' &&
    (source.coilVoltage.rawToken === 'H' || target.coilVoltage.rawToken === 'H')
  ) {
    result.unknownOrCheck.push(
      'Bobin kodu H bulundu, voltaj değeri katalogdan doğrulanmalıdır.'
    );
  }

  const connector = compareConnectorFields(source, target);
  pushResult(result, connector.comparison, connector.sentence, 'important');
  if (connector.warning) {
    result.warnings.push(connector.warning);
  }

  const manual = compareCanonicalEnumField({
    sourceField: source.manualOverride,
    targetField: target.manualOverride,
    sourceValue: source.manualOverride.value,
    targetValue: target.manualOverride.value,
    compatibleMessage: (display) => `Manuel kumanda aynı: ${display}`,
    differentMessage: (sourceDisplay, targetDisplay) =>
      `Manuel kumanda farklı: ${sourceDisplay} / ${targetDisplay}`,
    unknownMessage: 'Manuel kumanda katalogdan doğrulanmalıdır.',
    crossBrand,
  });
  pushResult(result, manual.comparison, manual.sentence, 'important');

  const pressure = compareOptionalNumericFields(
    source.maxPressureBar,
    target.maxPressureBar,
    'Basınç ve debi değerleri katalogdan kontrol edilmelidir.',
    'bar'
  );
  pushResult(result, pressure.comparison, pressure.sentence, 'important');

  const flow = compareOptionalNumericFields(
    source.maxFlowLpm,
    target.maxFlowLpm,
    'Basınç ve debi değerleri katalogdan kontrol edilmelidir.',
    'l/min'
  );
  pushResult(result, flow.comparison, flow.sentence, 'important');

  if (source.sealMaterial && target.sealMaterial) {
    const seal = compareCanonicalEnumField({
      sourceField: source.sealMaterial,
      targetField: target.sealMaterial,
      sourceValue: source.sealMaterial.value,
      targetValue: target.sealMaterial.value,
      compatibleMessage: (display) => `Keçe malzemesi aynı: ${display}`,
      differentMessage: (sourceDisplay, targetDisplay) =>
        `Keçe malzemesi farklı: ${sourceDisplay} / ${targetDisplay}`,
      unknownMessage: 'Keçe malzemesi katalogdan doğrulanmalıdır.',
      crossBrand,
    });
    pushResult(result, seal.comparison, seal.sentence, 'optional');
  }

  const functionMatch = compareValveFunctionBehavior({
    label: FIELD_LABELS.spoolFunctionCode,
    source: {
      manufacturer: source.brand ?? '',
      series: source.series ?? '',
      token: source.rawFunctionCode ?? null,
    },
    target: {
      manufacturer: target.brand ?? '',
      series: target.series ?? '',
      token: target.rawFunctionCode ?? null,
    },
  });

  const sourceSpoolDisplay = summarizeSpoolBehaviorForComparison(source);
  const targetSpoolDisplay = summarizeSpoolBehaviorForComparison(target);

  let spoolComparison = {
    ...functionMatch.comparison,
    label: FIELD_LABELS.spoolFunctionCode,
    sourceDisplay: sourceSpoolDisplay,
    targetDisplay: targetSpoolDisplay,
  };
  const sameBrandSeries = isSameBrandSeries(source, target);
  const sourceToken = source.rawFunctionCode?.trim().toUpperCase();
  const targetToken = target.rawFunctionCode?.trim().toUpperCase();
  const mountingMismatch =
    !isUnknownCanonicalValue(source.mountingStandard.value) &&
    !isUnknownCanonicalValue(target.mountingStandard.value) &&
    source.mountingStandard.value !== target.mountingStandard.value;

  if (
    sameBrandSeries &&
    sourceToken &&
    targetToken &&
    sourceToken !== targetToken
  ) {
    spoolComparison = {
      ...spoolComparison,
      status: 'different',
    };
  }

  if (mountingMismatch && spoolComparison.status === 'compatible') {
    spoolComparison = {
      ...spoolComparison,
      status: 'unknownOrCheck',
    };
  }

  const spoolRequiresCatalogCheck =
    source.centerCondition.requiresCatalogCheck ||
    target.centerCondition.requiresCatalogCheck ||
    source.centering.requiresCatalogCheck ||
    target.centering.requiresCatalogCheck ||
    source.waysPositions.requiresCatalogCheck ||
    target.waysPositions.requiresCatalogCheck ||
    functionMatch.requiresCatalogCheck;

  let spoolSentence: string | null = null;
  if (spoolComparison.status === 'compatible') {
    if (spoolRequiresCatalogCheck) {
      spoolSentence =
        'Sürgü davranışı aynı görünebilir, fakat katalog sembolüyle doğrulanmalıdır.';
    } else {
      spoolSentence = `Sürgü davranışı aynı: ${sourceSpoolDisplay}`;
    }
  } else if (spoolComparison.status === 'different') {
    if (
      spoolRequiresCatalogCheck ||
      sourceSpoolDisplay.includes('doğrulanmalı') ||
      targetSpoolDisplay.includes('doğrulanmalı')
    ) {
      spoolSentence =
        'Merkez tipi iki üründe de doğrulanamadı. Katalog sembolleri kontrol edilmelidir.';
    } else {
      spoolSentence = `Sürgü davranışı farklı: ${sourceSpoolDisplay} / ${targetSpoolDisplay}`;
    }
  } else {
    spoolSentence = 'Sürgü merkez tipi katalog sembolünden doğrulanmalıdır.';
  }

  pushResult(result, spoolComparison, spoolSentence, 'optional');

  if (crossBrand) {
    const sameCenter =
      !isUnknownCanonicalValue(source.centerCondition.value) &&
      !isUnknownCanonicalValue(target.centerCondition.value) &&
      source.centerCondition.value === target.centerCondition.value;
    const sameWays =
      !isUnknownCanonicalValue(source.waysPositions.value) &&
      !isUnknownCanonicalValue(target.waysPositions.value) &&
      source.waysPositions.value === target.waysPositions.value;
    const sameCentering =
      !isUnknownCanonicalValue(source.centering.value) &&
      !isUnknownCanonicalValue(target.centering.value) &&
      source.centering.value === target.centering.value;

    if (sameCenter && sameWays && sameCentering) {
      result.crossBrandSimilarBehavior = true;
      result.warnings.push(
        'Sürgü davranışı benzer olabilir. Katalog sembolüyle doğrulanmalıdır.'
      );
    }
  }

  if (
    functionMatch.requiresCatalogCheck &&
    functionMatch.statusMessageTr &&
    spoolComparison.status === 'different'
  ) {
    result.warnings.push(functionMatch.statusMessageTr);
  }

  const spoolComparisonEntry = result.comparisons.find(
    (c) => c.label === FIELD_LABELS.spoolFunctionCode
  );
  if (spoolComparisonEntry) {
    result.spoolDynamicCheck = {
      source: spoolComparisonEntry.sourceDisplay,
      target: spoolComparisonEntry.targetDisplay,
      status: spoolComparisonEntry.status,
      reasonTr: result.crossBrandSimilarBehavior
        ? 'Sürgü/fonksiyon davranışı benzer olabilir. Katalog sembolüyle doğrulanmalıdır.'
        : spoolComparisonEntry.status === 'unknownOrCheck'
          ? 'Sürgü/fonksiyon sembolü katalogdan kontrol edilmelidir.'
          : undefined,
    };
  }

  return result;
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
    severity:
      comparison.label.includes('Montaj') ||
      comparison.label.includes('Merkez') ||
      comparison.label.includes('Yol') ||
      comparison.label.includes('voltaj')
        ? 'high'
        : 'medium',
  };
}

function lookupEquivalenceSummary(
  compatibleCount: number,
  differentCount: number,
  canonical: HydraulicValveCanonicalComparisonResult
): CompatibilityResult['summary'] {
  if (differentCount > 0) {
    return {
      matchLevelTr: 'Fonksiyonel alternatif',
      summaryTr:
        'Montaj standardı veya sürgü davranışı farklı olabilir. Hidrolik valf muadili için detaylı mühendislik kontrolü gerekir.',
      riskLevel: 'high',
    };
  }

  if (canonical.crossBrandSimilarBehavior) {
    return {
      matchLevelTr: 'Mekanik muadil adayı',
      summaryTr:
        'Davranışsal olarak benzer olabilir. Sürgü, bobin ve konnektör katalog sembolleriyle doğrulanmalıdır.',
      riskLevel: 'medium',
    };
  }

  if (compatibleCount >= 2) {
    return {
      matchLevelTr: 'Mekanik muadil adayı',
      summaryTr:
        'Aynı montaj standardı grubunda muadil olabilir. Sürgü, bobin ve konnektör sipariş öncesi doğrulanmalıdır.',
      riskLevel: 'medium',
    };
  }

  return {
    matchLevelTr: 'Fonksiyonel alternatif',
    summaryTr: 'Sınırlı alan uyumu. Tüm teknik detaylar kontrol edilmelidir.',
    riskLevel: 'high',
  };
}

export function canonicalComparisonToCompatibilityResult(options: {
  source: ProductIdentification;
  candidate: EquivalentCandidate;
  canonical: HydraulicValveCanonicalComparisonResult;
}): CompatibilityResult {
  const categoryComparison = buildCategoryComparison(options.source, options.candidate);
  const comparisons = [categoryComparison, ...options.canonical.comparisons];

  const compatible = comparisons.filter((c) => c.status === 'compatible');
  const different = comparisons.filter((c) => c.status === 'different');

  const voltageComparison = comparisons.find((c) => c.label === FIELD_LABELS.coilVoltage);
  const connectorComparison = comparisons.find((c) => c.label === FIELD_LABELS.connectorType);
  const spoolComparison = comparisons.find((c) => c.label === FIELD_LABELS.spoolFunctionCode);

  const attributeChecks = comparisons
    .map((c) => comparisonToCheckItem(c))
    .filter((item): item is CheckItem => item !== null);

  const checkItems = [
    ...getHydraulicValveCheckItems(options.source, options.candidate, {
      spool: options.canonical.spoolDynamicCheck,
      voltage: voltageComparison
        ? {
            source: voltageComparison.sourceDisplay,
            target: voltageComparison.targetDisplay,
            status: voltageComparison.status,
          }
        : undefined,
      connector: connectorComparison
        ? {
            source: connectorComparison.sourceDisplay,
            target: connectorComparison.targetDisplay,
            status: connectorComparison.status,
          }
        : undefined,
    }),
    ...attributeChecks.filter(
      (item) =>
        ![
          FIELD_LABELS.coilVoltage,
          FIELD_LABELS.connectorType,
          FIELD_LABELS.spoolFunctionCode,
        ].includes(item.field)
    ),
  ];

  const warningSet = new Set<string>([...HYDRAULIC_VALVE_WARNINGS, ...options.canonical.warnings]);

  if (!options.candidate.suggestedCode) {
    warningSet.add(
      'Örnek muadil kodu gösterilemedi. Sürgü, voltaj ve konnektör bilgileri doğrulanmalıdır.'
    );
  }

  return {
    candidate: options.candidate,
    summary: lookupEquivalenceSummary(compatible.length, different.length, options.canonical),
    compatible,
    different,
    checkItems,
    warnings: [...warningSet],
    profileScoring: {
      scoredComparisons: options.canonical.scoredComparisons,
    },
  };
}
