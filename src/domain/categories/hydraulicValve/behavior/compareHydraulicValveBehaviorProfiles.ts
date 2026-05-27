import type { AttributeComparison, CompatibilityStatus } from '@/types/compatibility';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';

import {
  compareConnectorCanonicalSnapshots,
  connectorSnapshotFromResolved,
} from '@/domain/canonical/connector/compareConnectorCanonical';
import { resolveCanonicalAttribute } from '@/domain/canonical/resolveCanonicalAttribute';
import {
  normalizeConnectorDisplay,
  normalizeVoltageDisplay,
} from '@/domain/normalization/canonicalAttributeDisplay';

import {
  CENTER_CONDITION_LABEL_TR,
  CENTERING_LABEL_TR,
  isExactManufacturerFunctionMatch,
  isSameManufacturerSeries,
  POSITIONS_LABEL_TR,
  type HydraulicValveBehaviorProfile,
  UNRESOLVED_VOLTAGE_CODES,
} from './hydraulicValveBehaviorProfile';

export interface HydraulicValveBehaviorScoreImpact {
  criticalDifferent: number;
  normalDifferent: number;
  criticalCheck: number;
  normalCheck: number;
}

export interface HydraulicValveBehaviorComparisonResult {
  compatible: string[];
  different: string[];
  unknownOrCheck: string[];
  warnings: string[];
  comparisons: AttributeComparison[];
  scoreImpact: HydraulicValveBehaviorScoreImpact;
  requiresCatalogCheck: boolean;
  crossBrandSimilarBehavior: boolean;
  spoolDynamicCheck?: {
    source: string;
    target: string;
    status: CompatibilityStatus;
    reasonTr?: string;
  };
}

function displayOrUnknown(value: string | null | undefined): string {
  return value?.trim() ? value.trim() : 'Doğrulanamadı';
}

function positionsLabel(positions: HydraulicValveBehaviorProfile['positions']): string {
  if (positions === 'unknown' || positions === undefined) {
    return 'Bilinmiyor';
  }
  return POSITIONS_LABEL_TR[positions];
}

function pushComparison(
  result: HydraulicValveBehaviorComparisonResult,
  comparison: AttributeComparison
): void {
  result.comparisons.push(comparison);
  const message = `${comparison.label}: ${comparison.sourceDisplay} / ${comparison.targetDisplay}`;

  if (comparison.status === 'compatible') {
    result.compatible.push(comparison.label.includes('CETOP')
      ? `CETOP/NG ölçüsü aynı: ${comparison.sourceDisplay}`
      : comparison.label.includes('Konum')
        ? `Konum sayısı aynı: ${comparison.sourceDisplay}`
        : comparison.label.includes('Merkez tipi')
          ? `Merkez tipi aynı: ${comparison.sourceDisplay}`
          : comparison.label.includes('Yay')
            ? `Yay düzeni aynı: ${comparison.sourceDisplay}`
            : comparison.label.includes('voltaj')
              ? `Bobin voltajı aynı: ${comparison.sourceDisplay}`
              : message);
  } else if (comparison.status === 'different') {
    result.different.push(
      comparison.label.includes('Merkez')
        ? `Merkez tipi farklı: ${comparison.sourceDisplay} / ${comparison.targetDisplay}`
        : comparison.label.includes('Konum')
          ? `Konum sayısı farklı: ${comparison.sourceDisplay} / ${comparison.targetDisplay}`
          : comparison.label.includes('CETOP')
            ? `CETOP/NG ölçüsü farklı: ${comparison.sourceDisplay} / ${comparison.targetDisplay}`
            : comparison.label.includes('voltaj')
              ? `Bobin voltajı farklı: ${comparison.sourceDisplay} / ${comparison.targetDisplay}`
              : message
    );
    const isCritical =
      comparison.label.includes('CETOP') ||
      comparison.label.includes('Merkez') ||
      comparison.label.includes('Konum') ||
      comparison.label.includes('voltaj');
    if (isCritical) {
      result.scoreImpact.criticalDifferent += 1;
    } else {
      result.scoreImpact.normalDifferent += 1;
    }
  } else {
    result.unknownOrCheck.push(
      comparison.label.includes('Merkez')
        ? 'Merkez tipi katalog sembolünden doğrulanmalıdır.'
        : comparison.label.includes('Debi')
          ? 'Debi ve basınç değerleri katalogdan kontrol edilmelidir.'
          : comparison.label.includes('Konnektör')
            ? 'Konnektör tipi kontrol edilmelidir.'
            : message
    );
    const isCritical =
      comparison.label.includes('CETOP') ||
      comparison.label.includes('Merkez') ||
      comparison.label.includes('Konum') ||
      comparison.label.includes('voltaj');
    if (isCritical) {
      result.scoreImpact.criticalCheck += 1;
    } else {
      result.scoreImpact.normalCheck += 1;
    }
  }
}

function compareKnownEnumField(options: {
  label: string;
  sourceValue: string | undefined;
  targetValue: string | undefined;
  sourceDisplay: string;
  targetDisplay: string;
  crossBrand: boolean;
  requiresCatalogCheck: boolean;
  isCenterCondition?: boolean;
}): AttributeComparison {
  const sourceDisplay = options.sourceDisplay;
  const targetDisplay = options.targetDisplay;

  if (
    !options.sourceValue ||
    options.sourceValue === 'unknown' ||
    !options.targetValue ||
    options.targetValue === 'unknown'
  ) {
    return { label: options.label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' };
  }

  if (options.sourceValue === options.targetValue) {
    if (options.isCenterCondition && options.crossBrand) {
      return {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      };
    }
    return { label: options.label, sourceDisplay, targetDisplay, status: 'compatible' };
  }

  if (options.isCenterCondition) {
    return { label: options.label, sourceDisplay, targetDisplay, status: 'different' };
  }

  return { label: options.label, sourceDisplay, targetDisplay, status: 'different' };
}

function compareVoltage(
  source: HydraulicValveBehaviorProfile,
  target: HydraulicValveBehaviorProfile,
  _crossBrand: boolean
): AttributeComparison {
  const sourceCode = source.voltageCode ?? undefined;
  const targetCode = target.voltageCode ?? undefined;

  if (
    (sourceCode && UNRESOLVED_VOLTAGE_CODES.has(sourceCode)) ||
    (targetCode && UNRESOLVED_VOLTAGE_CODES.has(targetCode))
  ) {
    return {
      label: 'Bobin voltajı',
      sourceDisplay: displayOrUnknown(source.voltage ?? sourceCode),
      targetDisplay: displayOrUnknown(target.voltage ?? targetCode),
      status: 'unknownOrCheck',
    };
  }

  const sourceNorm = normalizeVoltageDisplay({
    rawValue: source.voltage,
    rawToken: sourceCode,
    sourceManufacturer: source.brand,
  });
  const targetNorm = normalizeVoltageDisplay({
    rawValue: target.voltage,
    rawToken: targetCode,
    sourceManufacturer: target.brand,
  });

  const sourceDisplay = sourceNorm?.displayValue ?? displayOrUnknown(source.voltage ?? sourceCode);
  const targetDisplay = targetNorm?.displayValue ?? displayOrUnknown(target.voltage ?? targetCode);

  if (!sourceNorm || !targetNorm) {
    return {
      label: 'Bobin voltajı',
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
    };
  }

  const sourceUnresolved =
    Boolean(sourceCode && UNRESOLVED_VOLTAGE_CODES.has(sourceCode)) ||
    Boolean(sourceNorm.requiresCatalogCheck);
  const targetUnresolved =
    Boolean(targetCode && UNRESOLVED_VOLTAGE_CODES.has(targetCode)) ||
    Boolean(targetNorm.requiresCatalogCheck);

  if (sourceNorm.canonicalValue === targetNorm.canonicalValue) {
    if (sourceUnresolved || targetUnresolved) {
      return {
        label: 'Bobin voltajı',
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      };
    }
    return {
      label: 'Bobin voltajı',
      sourceDisplay,
      targetDisplay,
      status: sourceNorm.requiresCatalogCheck || targetNorm.requiresCatalogCheck ? 'unknownOrCheck' : 'compatible',
    };
  }

  return {
    label: 'Bobin voltajı',
    sourceDisplay,
    targetDisplay,
    status: 'different',
  };
}

function compareConnector(
  source: HydraulicValveBehaviorProfile,
  target: HydraulicValveBehaviorProfile,
  _crossBrand: boolean
): AttributeComparison {
  const sourceResolved = source.connectorCode
    ? resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        manufacturer: source.brand,
        series: source.series,
        attributeKey: 'connector_type',
        rawToken: source.connectorCode,
      })
    : null;
  const targetResolved = target.connectorCode
    ? resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        manufacturer: target.brand,
        series: target.series,
        attributeKey: 'connector_type',
        rawToken: target.connectorCode,
      })
    : null;

  if (!sourceResolved || !targetResolved) {
    const sourceDisplay = displayOrUnknown(source.connector ?? source.connectorCode);
    const targetDisplay = displayOrUnknown(target.connector ?? target.connectorCode);
    return {
      label: 'Konnektör kodu',
      sourceDisplay,
      targetDisplay,
      status: 'unknownOrCheck',
    };
  }

  const result = compareConnectorCanonicalSnapshots(
    connectorSnapshotFromResolved(sourceResolved),
    connectorSnapshotFromResolved(targetResolved),
    'Konnektör kodu',
  );
  return result.comparison;
}

export function compareHydraulicValveBehaviorProfiles(
  source: HydraulicValveBehaviorProfile,
  target: HydraulicValveBehaviorProfile
): HydraulicValveBehaviorComparisonResult {
  const crossBrand = !isSameManufacturerSeries(source, target);
  const requiresCatalogCheck =
    source.requiresCatalogCheck || target.requiresCatalogCheck || crossBrand;

  const result: HydraulicValveBehaviorComparisonResult = {
    compatible: [],
    different: [],
    unknownOrCheck: [],
    warnings: [],
    comparisons: [],
    scoreImpact: {
      criticalDifferent: 0,
      normalDifferent: 0,
      criticalCheck: 0,
      normalCheck: 0,
    },
    requiresCatalogCheck,
    crossBrandSimilarBehavior: false,
  };

  if (requiresCatalogCheck) {
    result.warnings.push(
      'Sürgü davranışı ve bobin seçenekleri katalog sembolleriyle doğrulanmalıdır.'
    );
  }

  const sourceCetop = displayOrUnknown(source.cetopNg);
  const targetCetop = displayOrUnknown(target.cetopNg);
  if (!source.cetopNg || !target.cetopNg) {
    pushComparison(result, {
      label: 'CETOP / NG ölçüsü',
      sourceDisplay: sourceCetop,
      targetDisplay: targetCetop,
      status: 'unknownOrCheck',
    });
  } else if (source.cetopNg === target.cetopNg) {
    pushComparison(result, {
      label: 'CETOP / NG ölçüsü',
      sourceDisplay: sourceCetop,
      targetDisplay: targetCetop,
      status: 'compatible',
    });
  } else {
    pushComparison(result, {
      label: 'CETOP / NG ölçüsü',
      sourceDisplay: sourceCetop,
      targetDisplay: targetCetop,
      status: 'different',
    });
  }

  pushComparison(
    result,
    compareKnownEnumField({
      label: 'Konum sayısı',
      sourceValue: source.positions,
      targetValue: target.positions,
      sourceDisplay: positionsLabel(source.positions),
      targetDisplay: positionsLabel(target.positions),
      crossBrand,
      requiresCatalogCheck,
    })
  );

  const sourceCenter =
    source.centerCondition && source.centerCondition !== 'unknown'
      ? CENTER_CONDITION_LABEL_TR[source.centerCondition]
      : 'Bilinmiyor';
  const targetCenter =
    target.centerCondition && target.centerCondition !== 'unknown'
      ? CENTER_CONDITION_LABEL_TR[target.centerCondition]
      : 'Bilinmiyor';

  const centerComparison = compareKnownEnumField({
    label: 'Merkez tipi',
    sourceValue: source.centerCondition,
    targetValue: target.centerCondition,
    sourceDisplay: sourceCenter,
    targetDisplay: targetCenter,
    crossBrand,
    requiresCatalogCheck,
    isCenterCondition: true,
  });
  pushComparison(result, centerComparison);

  const sourceCentering =
    source.centering && source.centering !== 'unknown'
      ? CENTERING_LABEL_TR[source.centering]
      : 'Bilinmiyor';
  const targetCentering =
    target.centering && target.centering !== 'unknown'
      ? CENTERING_LABEL_TR[target.centering]
      : 'Bilinmiyor';

  pushComparison(
    result,
    compareKnownEnumField({
      label: 'Yay düzeni',
      sourceValue: source.centering,
      targetValue: target.centering,
      sourceDisplay: sourceCentering,
      targetDisplay: targetCentering,
      crossBrand,
      requiresCatalogCheck,
    })
  );

  pushComparison(result, compareVoltage(source, target, crossBrand));

  if (source.voltageCode || target.voltageCode) {
    const unresolved =
      (source.voltageCode && UNRESOLVED_VOLTAGE_CODES.has(source.voltageCode)) ||
      (target.voltageCode && UNRESOLVED_VOLTAGE_CODES.has(target.voltageCode));

    if (unresolved) {
      pushComparison(result, {
        label: 'Bobin kodu',
        sourceDisplay: displayOrUnknown(source.voltageCode),
        targetDisplay: displayOrUnknown(target.voltageCode),
        status: 'unknownOrCheck',
      });
    }
  }

  pushComparison(result, compareConnector(source, target, crossBrand));

  if (isExactManufacturerFunctionMatch(source, target)) {
    pushComparison(result, {
      label: 'Sürgü / fonksiyon kodu',
      sourceDisplay: displayOrUnknown(source.manufacturerFunctionCode),
      targetDisplay: displayOrUnknown(target.manufacturerFunctionCode),
      status: 'compatible',
    });
  } else if (crossBrand) {
    const sameCenter =
      source.centerCondition !== 'unknown' &&
      target.centerCondition !== 'unknown' &&
      source.centerCondition === target.centerCondition;
    const samePositions =
      source.positions !== 'unknown' &&
      target.positions !== 'unknown' &&
      source.positions === target.positions;
    const sameCentering =
      source.centering !== 'unknown' &&
      target.centering !== 'unknown' &&
      source.centering === target.centering;

    if (sameCenter && samePositions && sameCentering) {
      result.crossBrandSimilarBehavior = true;
      result.warnings.push(
        'Sürgü davranışı benzer olabilir. Katalog sembolüyle doğrulanmalıdır.'
      );
    }

    pushComparison(result, {
      label: 'Sürgü / fonksiyon kodu',
      sourceDisplay: displayOrUnknown(source.manufacturerFunctionCode),
      targetDisplay: displayOrUnknown(target.manufacturerFunctionCode),
      status: 'unknownOrCheck',
    });
  } else if (
    source.manufacturerFunctionCode &&
    target.manufacturerFunctionCode &&
    source.manufacturerFunctionCode !== target.manufacturerFunctionCode
  ) {
    pushComparison(result, {
      label: 'Sürgü / fonksiyon kodu',
      sourceDisplay: source.manufacturerFunctionCode,
      targetDisplay: target.manufacturerFunctionCode,
      status: 'different',
    });
  } else {
    pushComparison(result, {
      label: 'Sürgü / fonksiyon kodu',
      sourceDisplay: displayOrUnknown(source.manufacturerFunctionCode),
      targetDisplay: displayOrUnknown(target.manufacturerFunctionCode),
      status: 'unknownOrCheck',
    });
  }

  const manualSource = displayOrUnknown(source.manualOverride);
  const manualTarget = displayOrUnknown(target.manualOverride);
  pushComparison(result, {
    label: 'Manuel kumanda',
    sourceDisplay: manualSource,
    targetDisplay: manualTarget,
    status:
      !source.manualOverride || !target.manualOverride
        ? 'unknownOrCheck'
        : source.manualOverride === target.manualOverride
          ? 'compatible'
          : 'different',
  });

  const flowSource =
    source.maxFlowLpm !== null && source.maxFlowLpm !== undefined
      ? `${source.maxFlowLpm} l/min`
      : 'Doğrulanamadı';
  const flowTarget =
    target.maxFlowLpm !== null && target.maxFlowLpm !== undefined
      ? `${target.maxFlowLpm} l/min`
      : 'Doğrulanamadı';
  pushComparison(result, {
    label: 'Maks. debi',
    sourceDisplay: flowSource,
    targetDisplay: flowTarget,
    status:
      source.maxFlowLpm == null || target.maxFlowLpm == null
        ? 'unknownOrCheck'
        : source.maxFlowLpm === target.maxFlowLpm
          ? 'compatible'
          : 'different',
  });

  const pressureSource =
    source.maxPressureBar != null ? `${source.maxPressureBar} bar` : 'Doğrulanamadı';
  const pressureTarget =
    target.maxPressureBar != null ? `${target.maxPressureBar} bar` : 'Doğrulanamadı';
  pushComparison(result, {
    label: 'Maks. basınç (A/B/P)',
    sourceDisplay: pressureSource,
    targetDisplay: pressureTarget,
    status:
      source.maxPressureBar == null || target.maxPressureBar == null
        ? 'unknownOrCheck'
        : source.maxPressureBar === target.maxPressureBar
          ? 'compatible'
          : 'different',
  });

  const spoolComparison = result.comparisons.find((c) => c.label === 'Sürgü / fonksiyon kodu');
  if (spoolComparison) {
    result.spoolDynamicCheck = {
      source: spoolComparison.sourceDisplay,
      target: spoolComparison.targetDisplay,
      status: spoolComparison.status,
      reasonTr: result.crossBrandSimilarBehavior
        ? 'Sürgü/fonksiyon davranışı benzer olabilir. Katalog sembolüyle doğrulanmalıdır.'
        : spoolComparison.status === 'unknownOrCheck'
          ? 'Sürgü/fonksiyon sembolü katalogdan kontrol edilmelidir.'
          : undefined,
    };
  }

  return result;
}
