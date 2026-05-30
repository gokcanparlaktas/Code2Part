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

import { portStatesMatch } from '@/domain/catalogData';
import {
  dedupeCheckItemsByField,
  filterBaseCheckItemsCoveredByCanonical,
  normalizeCheckFieldKey,
  profileHasCatalogFlowEvidence,
  profileHasCatalogPressureEvidence,
} from '@/domain/presentation/dedupeCheckItems';
import { deriveSummaryRiskLevelFromMetadata } from '@/domain/presentation/formatCompatibilityMetadata';
import { consolidateCatalogWarningsForUi } from '@/domain/presentation/formatUserFacingCatalogDisplay';
import { portStateBehaviorSummary } from '@/domain/presentation/formatCatalogFieldDisplay';

import {
  CATALOG_PORT_STATE_CANDIDATE_WARNING_TR,
  compareSpoolBehaviorByCatalogPortState,
  hasCatalogPortStateEvidence,
} from './compareCatalogPortState';
import { deriveHydraulicCompatibilityMetadata } from './deriveHydraulicCompatibilityMetadata';
import { FIELD_LABELS } from './hydraulicValveCanonicalDictionary';
import {
  normalizeHydraulicManualOverrideDisplay,
  normalizeHydraulicVoltageDisplay,
} from './hydraulicValveAttributeDisplay';
import {
  compareCatalogFlowFields,
  compareCatalogPressureFields,
} from './compareCatalogTechnicalNumeric';
import {
  summarizeCenterPortStateBehavior,
  summarizeSpoolBehaviorForComparison,
} from './hydraulicValveBehaviorDescriptions';
import type {
  CanonicalField,
  CanonicalManualOverride,
  HydraulicValveCanonicalProfile,
} from './hydraulicValveCanonicalTypes';
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
  connectorDynamicCheck?: {
    source: string;
    target: string;
    status: CompatibilityStatus;
    reasonTr?: string;
  };
  manualDynamicCheck?: {
    source: string;
    target: string;
    status: CompatibilityStatus;
    reasonTr?: string;
  };
  /** Both sides resolved center via matching catalog portState (no unknown Merkez tipi check). */
  portStateCenterResolved?: boolean;
  mountingIsoClassMatched?: boolean;
  catalogPressureEvidencePresent?: boolean;
  catalogFlowEvidencePresent?: boolean;
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

const MANUAL_OVERRIDE_PRESENT_VALUES: ReadonlySet<CanonicalManualOverride> = new Set([
  'manual_override',
  'protected_manual_override',
  'concealed_manual_override',
  'detent_manual_override',
]);

function manualOverrideDisplayForProfile(profile: HydraulicValveCanonicalProfile): string {
  if (profile.manualOverride.displayValue) {
    return profile.manualOverride.displayValue;
  }
  return (
    normalizeHydraulicManualOverrideDisplay({
      rawValue: profile.manualOverride.rawValue
        ? String(profile.manualOverride.rawValue)
        : null,
      rawToken: profile.manualOverride.rawToken,
    })?.displayValue ?? 'Belirsiz'
  );
}

function manualOverridePresenceFromProfile(
  profile: HydraulicValveCanonicalProfile
): 'present' | 'absent' | 'unknown' {
  const primary = manualOverrideDisplayForProfile(profile);
  if (primary === 'Var') {
    return 'present';
  }
  if (primary === 'Yok') {
    return 'absent';
  }
  const value = profile.manualOverride.value;
  if (!value || value === 'unknown') {
    return 'unknown';
  }
  if (value === 'none') {
    return 'absent';
  }
  if (MANUAL_OVERRIDE_PRESENT_VALUES.has(value)) {
    return 'present';
  }
  return 'unknown';
}

function manualOverrideTypeDetail(profile: HydraulicValveCanonicalProfile): string | undefined {
  return normalizeHydraulicManualOverrideDisplay({
    rawValue: profile.manualOverride.rawValue
      ? String(profile.manualOverride.rawValue)
      : null,
    rawToken: profile.manualOverride.rawToken,
  })?.rawTokenLabel;
}

function compareManualOverrideFields(
  source: HydraulicValveCanonicalProfile,
  target: HydraulicValveCanonicalProfile,
  crossBrand: boolean
): { comparison: AttributeComparison; sentence: string | null } {
  const label = FIELD_LABELS.manualOverride;
  const sourceDisplay = manualOverrideDisplayForProfile(source);
  const targetDisplay = manualOverrideDisplayForProfile(target);
  const sourcePresence = manualOverridePresenceFromProfile(source);
  const targetPresence = manualOverridePresenceFromProfile(target);

  if (sourcePresence === 'unknown' || targetPresence === 'unknown') {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'unknownOrCheck',
      },
      sentence: 'Manuel kumanda katalogdan doğrulanmalıdır.',
    };
  }

  if (sourcePresence === 'absent' && targetPresence === 'absent') {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      sentence: 'Manuel kumanda yok (her iki tarafta).',
    };
  }

  if (sourcePresence === 'absent' || targetPresence === 'absent') {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'different',
        checkReasonTr:
          'Bir üründe manuel kumanda varken diğerinde yok; sipariş kodu kontrol edilmelidir.',
      },
      sentence: `Manuel kumanda uyumsuz: ${sourceDisplay} / ${targetDisplay}`,
    };
  }

  const sourceType = manualOverrideTypeDetail(source);
  const targetType = manualOverrideTypeDetail(target);
  const typeMismatch =
    !crossBrand && Boolean(sourceType && targetType && sourceType !== targetType);

  return {
    comparison: {
      label,
      sourceDisplay,
      targetDisplay,
      status: typeMismatch ? 'unknownOrCheck' : 'compatible',
      checkReasonTr: typeMismatch
        ? `Manuel kumanda tipi farklı olabilir: ${sourceType} / ${targetType}`
        : undefined,
    },
    sentence: typeMismatch ? null : `Manuel kumanda mevcut: ${sourceDisplay}`,
  };
}

function connectorSnapshotFromProfileField(
  field: HydraulicValveCanonicalProfile['connectorType'],
  brand?: string,
  series?: string,
): ConnectorCanonicalSnapshot {
  if (field.catalogEvidence?.displayCandidate?.trim()) {
    return {
      canonicalKey: field.value ?? 'unknown',
      displayValue: field.catalogEvidence.displayCandidate.trim(),
      connectorFamilyKey: field.connectorFamilyKey,
      connectorStandardKey: field.connectorStandardKey,
      connectorOptions: field.connectorOptions,
      isGenericConnector: field.isGenericConnector,
      requiresCatalogCheck: Boolean(
        field.catalogEvidence.needsReview || field.requiresCatalogCheck
      ),
      resolved: true,
    };
  }

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
): {
  comparison: AttributeComparison;
  sentence: string | null;
  warning?: string;
  checkReasonTr?: string;
} {
  const sourceSnapshot = connectorSnapshotFromProfileField(
    source.connectorType,
    source.brand,
    source.series
  );
  const targetSnapshot = connectorSnapshotFromProfileField(
    target.connectorType,
    target.brand,
    target.series
  );
  const result = compareConnectorCanonicalSnapshots(
    sourceSnapshot,
    targetSnapshot,
    FIELD_LABELS.connectorType
  );

  const sourceCatalog = source.connectorType.catalogEvidence?.displayCandidate?.trim();
  const targetCatalog = target.connectorType.catalogEvidence?.displayCandidate?.trim();

  if (sourceCatalog && targetCatalog) {
    const sourceLabel = source.brand?.trim() || 'Kaynak';
    const targetLabel = target.brand?.trim() || 'Hedef';
    const evidenceDisplays = {
      sourceDisplay: sourceCatalog,
      targetDisplay: targetCatalog,
    };
    const physicalCheckReason =
      `${sourceLabel}: ${sourceCatalog}. ` +
      `${targetLabel}: ${targetCatalog}. ` +
      'Fiziksel soket eşdeğerliği kontrol edilmelidir.';

    if (
      result.comparison.status === 'different' ||
      (result.comparison.status === 'unknownOrCheck' &&
        sourceSnapshot.connectorFamilyKey !== targetSnapshot.connectorFamilyKey)
    ) {
      return {
        ...result,
        comparison: {
          ...result.comparison,
          ...evidenceDisplays,
          status: 'unknownOrCheck',
          checkReasonTr: physicalCheckReason,
        },
        sentence:
          'Konnektör tipleri katalog adayı olarak farklı ailelerde; fiziksel uyum doğrulanmalıdır.',
        checkReasonTr: physicalCheckReason,
      };
    }

    if (result.comparison.status === 'unknownOrCheck') {
      return {
        ...result,
        comparison: {
          ...result.comparison,
          ...evidenceDisplays,
          checkReasonTr: physicalCheckReason,
        },
        checkReasonTr: physicalCheckReason,
      };
    }
  }

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

  if (
    mounting.comparison.status === 'compatible' &&
    source.mountingStandard.catalogEvidence?.isoCode?.includes('ISO 4401-03') &&
    target.mountingStandard.catalogEvidence?.isoCode?.includes('ISO 4401-03')
  ) {
    result.mountingIsoClassMatched = true;
  }

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

  const sourceCenterPortDisplay = summarizeCenterPortStateBehavior(source);
  const targetCenterPortDisplay = summarizeCenterPortStateBehavior(target);
  const bothPortStateCenter =
    hasCatalogPortStateEvidence(source.centerCondition) &&
    hasCatalogPortStateEvidence(target.centerCondition);

  let center: { comparison: AttributeComparison; sentence: string | null };

  if (bothPortStateCenter) {
    const sourcePs = source.centerCondition.catalogEvidence!.portState!;
    const targetPs = target.centerCondition.catalogEvidence!.portState!;
    const portMatch = portStatesMatch(sourcePs, targetPs);
    const display =
      sourceCenterPortDisplay ??
      targetCenterPortDisplay ??
      portStateBehaviorSummary(sourcePs) ??
      'Port durumu katalog adayından çözümlendi';
    const catalogReview =
      Boolean(source.centerCondition.catalogEvidence?.needsReview) ||
      Boolean(target.centerCondition.catalogEvidence?.needsReview);

    center = {
      comparison: {
        label: FIELD_LABELS.centerCondition,
        sourceDisplay: sourceCenterPortDisplay ?? display,
        targetDisplay: targetCenterPortDisplay ?? display,
        status: portMatch ? 'compatible' : 'different',
      },
      sentence: portMatch
        ? catalogReview
          ? 'Merkez tipi (port durumu) uyumlu görünüyor; katalog adayı doğrulanmalıdır.'
          : `Merkez tipi aynı: ${display}`
        : `Merkez tipi farklı: ${sourceCenterPortDisplay ?? display} / ${targetCenterPortDisplay ?? display}`,
    };

    if (portMatch) {
      result.portStateCenterResolved = true;
    }
  } else {
    const centerRequiresCheck =
      source.centerCondition.requiresCatalogCheck ||
      target.centerCondition.requiresCatalogCheck ||
      source.centerCondition.confidence === 'low' ||
      target.centerCondition.confidence === 'low';

    center = compareCanonicalEnumField({
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
  }

  const hideCenterInEquivalenceUi =
    bothPortStateCenter &&
    center.comparison.status === 'compatible' &&
    result.portStateCenterResolved;

  if (!hideCenterInEquivalenceUi) {
    pushResult(result, center.comparison, center.sentence, 'critical');
  }

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
  const bothVoltagesKnown =
    !isUnknownCanonicalValue(source.coilVoltage.value) &&
    !isUnknownCanonicalValue(target.coilVoltage.value);

  if (source.coilVoltage.requiresCatalogCheck || target.coilVoltage.requiresCatalogCheck) {
    // Known canonical mismatch stays "different"; catalog check only downgrades uncertain cases.
    if (voltage.comparison.status === 'compatible') {
      pushResult(result, voltage.comparison, voltage.sentence, 'critical');
      result.warnings.push('Bobin voltajı kodu katalogdan doğrulanmalıdır.');
    } else if (voltage.comparison.status === 'different' && bothVoltagesKnown) {
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
  pushResult(
    result,
    {
      ...connector.comparison,
      checkReasonTr: connector.checkReasonTr ?? connector.comparison.checkReasonTr,
    },
    connector.sentence,
    'important'
  );
  if (connector.warning) {
    result.warnings.push(connector.warning);
  }
  if (connector.comparison.status === 'unknownOrCheck') {
    result.connectorDynamicCheck = {
      source: connector.comparison.sourceDisplay,
      target: connector.comparison.targetDisplay,
      status: connector.comparison.status,
      reasonTr:
        connector.checkReasonTr ??
        'Konnektör ve bobin bağlantısı seri ve üreticiye göre değişebilir.',
    };
  }

  const manual = compareManualOverrideFields(source, target, crossBrand);
  if (manual.comparison.status === 'unknownOrCheck') {
    result.manualDynamicCheck = {
      source: manual.comparison.sourceDisplay,
      target: manual.comparison.targetDisplay,
      status: manual.comparison.status,
      reasonTr: manual.comparison.checkReasonTr,
    };
  }
  pushResult(result, manual.comparison, manual.sentence, 'important');

  const pressure = compareCatalogPressureFields({
    sourceField: source.maxPressureBar,
    targetField: target.maxPressureBar,
    label: FIELD_LABELS.maxPressureBar,
  });
  pushResult(
    result,
    { ...pressure.comparison, checkReasonTr: pressure.checkReasonTr },
    pressure.sentence,
    'important'
  );

  const flow = compareCatalogFlowFields({
    sourceField: source.maxFlowLpm,
    targetField: target.maxFlowLpm,
    label: FIELD_LABELS.maxFlowLpm,
  });
  pushResult(
    result,
    { ...flow.comparison, checkReasonTr: flow.checkReasonTr },
    flow.sentence,
    'important'
  );

  result.catalogPressureEvidencePresent =
    profileHasCatalogPressureEvidence(source.maxPressureBar) ||
    profileHasCatalogPressureEvidence(target.maxPressureBar);
  result.catalogFlowEvidencePresent =
    profileHasCatalogFlowEvidence(source.maxFlowLpm) ||
    profileHasCatalogFlowEvidence(target.maxFlowLpm);

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

  const sourceSpoolDisplay =
    sourceCenterPortDisplay ?? summarizeSpoolBehaviorForComparison(source);
  const targetSpoolDisplay =
    targetCenterPortDisplay ?? summarizeSpoolBehaviorForComparison(target);

  const mountingMismatch =
    !isUnknownCanonicalValue(source.mountingStandard.value) &&
    !isUnknownCanonicalValue(target.mountingStandard.value) &&
    source.mountingStandard.value !== target.mountingStandard.value;

  const portStateSpool = compareSpoolBehaviorByCatalogPortState({
    label: FIELD_LABELS.spoolFunctionCode,
    sourceField: source.centerCondition,
    targetField: target.centerCondition,
    sourceDisplay: sourceSpoolDisplay,
    targetDisplay: targetSpoolDisplay,
  });

  let spoolComparison: AttributeComparison;
  let usedPortStateComparison = false;
  let functionMatch: ReturnType<typeof compareValveFunctionBehavior> | null = null;

  const resolveFunctionMatch = () =>
    compareValveFunctionBehavior({
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

  const preferFunctionCheckOverPortState = (
    match: ReturnType<typeof compareValveFunctionBehavior>
  ): boolean => {
    if (!crossBrand || !match.requiresCatalogCheck) {
      return false;
    }
    if (match.comparison.status === 'different') {
      return true;
    }
    return match.matchType === 'unknown';
  };

  if (portStateSpool.usedPortState) {
    if (crossBrand) {
      functionMatch = resolveFunctionMatch();
    }
    if (functionMatch && preferFunctionCheckOverPortState(functionMatch)) {
      spoolComparison = {
        ...functionMatch.comparison,
        label: FIELD_LABELS.spoolFunctionCode,
        sourceDisplay: sourceSpoolDisplay,
        targetDisplay: targetSpoolDisplay,
        status:
          functionMatch.comparison.status === 'different'
            ? 'unknownOrCheck'
            : functionMatch.comparison.status,
        checkReasonTr: functionMatch.statusMessageTr,
      };
      usedPortStateComparison = false;
    } else {
      spoolComparison = portStateSpool.comparison;
      usedPortStateComparison = true;
      if (portStateSpool.catalogReviewRequired) {
        result.warnings.push(CATALOG_PORT_STATE_CANDIDATE_WARNING_TR);
      }
    }
  } else {
    functionMatch = resolveFunctionMatch();

    spoolComparison = {
      ...functionMatch.comparison,
      label: FIELD_LABELS.spoolFunctionCode,
      sourceDisplay: sourceSpoolDisplay,
      targetDisplay: targetSpoolDisplay,
    };

    const sameBrandSeries = isSameBrandSeries(source, target);
    const sourceToken = source.rawFunctionCode?.trim().toUpperCase();
    const targetToken = target.rawFunctionCode?.trim().toUpperCase();

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
    (functionMatch?.requiresCatalogCheck ?? false);

  let spoolSentence: string | null = null;
  if (spoolComparison.status === 'compatible') {
    if (usedPortStateComparison && portStateSpool.catalogReviewRequired) {
      spoolSentence =
        'Sürgü merkez davranışı (port durumları) uyumlu görünüyor; katalog adayı inceleme gerektirir.';
    } else if (spoolRequiresCatalogCheck) {
      spoolSentence =
        'Sürgü davranışı aynı görünebilir, fakat katalog sembolüyle doğrulanmalıdır.';
    } else {
      spoolSentence = `Sürgü davranışı aynı: ${sourceSpoolDisplay}`;
    }
  } else if (spoolComparison.status === 'different') {
    if (usedPortStateComparison) {
      spoolSentence = `Sürgü merkez davranışı (port durumları) farklı: ${sourceSpoolDisplay} / ${targetSpoolDisplay}`;
    } else if (
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

  if (
    crossBrand &&
    functionMatch?.requiresCatalogCheck &&
    spoolComparison.status === 'different'
  ) {
    spoolComparison = {
      ...spoolComparison,
      status: 'unknownOrCheck',
      checkReasonTr: functionMatch.statusMessageTr,
    };
  }

  pushResult(result, spoolComparison, spoolSentence, 'optional');

  if (crossBrand && !usedPortStateComparison) {
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
    functionMatch?.requiresCatalogCheck &&
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
      reasonTr:
        spoolComparisonEntry.checkReasonTr ??
        functionMatch?.statusMessageTr ??
        (usedPortStateComparison && portStateSpool.catalogReviewRequired
          ? CATALOG_PORT_STATE_CANDIDATE_WARNING_TR
          : result.crossBrandSimilarBehavior
            ? 'Sürgü/fonksiyon davranışı benzer olabilir. Katalog sembolüyle doğrulanmalıdır.'
            : spoolComparisonEntry.status === 'unknownOrCheck'
              ? 'Sürgü/fonksiyon sembolü katalogdan kontrol edilmelidir.'
              : undefined),
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
    reasonTr:
      comparison.checkReasonTr ??
      `${comparison.label} için yeterli kesin bilgi yok. Katalog veya şema ile doğrulanmalıdır.`,
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
  const manualComparison = comparisons.find((c) => c.label === FIELD_LABELS.manualOverride);
  const spoolComparison = comparisons.find((c) => c.label === FIELD_LABELS.spoolFunctionCode);

  const dynamicCheckFields = [
    FIELD_LABELS.coilVoltage,
    FIELD_LABELS.connectorType,
    FIELD_LABELS.spoolFunctionCode,
    FIELD_LABELS.manualOverride,
    FIELD_LABELS.maxPressureBar,
    FIELD_LABELS.maxFlowLpm,
    'Sürgü sembolü / fonksiyon',
  ] as const;

  const attributeChecks = comparisons
    .map((c) => comparisonToCheckItem(c))
    .filter((item): item is CheckItem => item !== null);

  const attributeChecksForMerge = attributeChecks.filter((item) => {
    if (dynamicCheckFields.includes(item.field as (typeof dynamicCheckFields)[number])) {
      return false;
    }
    if (
      options.canonical.portStateCenterResolved &&
      (item.field === FIELD_LABELS.centerCondition ||
        normalizeCheckFieldKey(item.field) === 'spool_center_behavior')
    ) {
      return false;
    }
    if (
      options.canonical.catalogPressureEvidencePresent &&
      normalizeCheckFieldKey(item.field) === 'basınç'
    ) {
      return false;
    }
    if (
      options.canonical.catalogFlowEvidencePresent &&
      normalizeCheckFieldKey(item.field) === 'debi'
    ) {
      return false;
    }
    return true;
  });

  const attributeChecksForBaseCoverage = attributeChecks.filter((item) => {
    if (dynamicCheckFields.includes(item.field as (typeof dynamicCheckFields)[number])) {
      return false;
    }
    if (
      options.canonical.portStateCenterResolved &&
      (item.field === FIELD_LABELS.centerCondition ||
        normalizeCheckFieldKey(item.field) === 'spool_center_behavior')
    ) {
      return false;
    }
    if (
      options.canonical.catalogPressureEvidencePresent &&
      normalizeCheckFieldKey(item.field) === 'basınç'
    ) {
      return false;
    }
    if (
      options.canonical.catalogFlowEvidencePresent &&
      normalizeCheckFieldKey(item.field) === 'debi'
    ) {
      return false;
    }
    return true;
  });

  const baseChecks = filterBaseCheckItemsCoveredByCanonical(
    getHydraulicValveCheckItems(options.source, options.candidate, {
      spool: options.canonical.spoolDynamicCheck,
      voltage: voltageComparison
        ? {
            source: voltageComparison.sourceDisplay,
            target: voltageComparison.targetDisplay,
            status: voltageComparison.status,
          }
        : undefined,
      connector:
        options.canonical.connectorDynamicCheck ??
        (connectorComparison
          ? {
              source: connectorComparison.sourceDisplay,
              target: connectorComparison.targetDisplay,
              status: connectorComparison.status,
            }
          : undefined),
      manual:
        options.canonical.manualDynamicCheck ??
        (manualComparison?.status === 'unknownOrCheck'
          ? {
              source: manualComparison.sourceDisplay,
              target: manualComparison.targetDisplay,
              status: manualComparison.status,
              reasonTr: manualComparison.checkReasonTr,
            }
          : undefined),
    }),
    attributeChecksForBaseCoverage
  ).filter((item) => {
    if (
      options.canonical.mountingIsoClassMatched &&
      normalizeCheckFieldKey(item.field) === 'montaj arayüzü'
    ) {
      return false;
    }
    if (
      options.canonical.catalogPressureEvidencePresent &&
      normalizeCheckFieldKey(item.field) === 'basınç'
    ) {
      return false;
    }
    if (
      options.canonical.catalogFlowEvidencePresent &&
      normalizeCheckFieldKey(item.field) === 'debi'
    ) {
      return false;
    }
    return true;
  });

  const checkItems = dedupeCheckItemsByField([...baseChecks, ...attributeChecksForMerge]);

  const warningSet = new Set<string>([...HYDRAULIC_VALVE_WARNINGS, ...options.canonical.warnings]);

  if (!options.candidate.suggestedCode) {
    warningSet.add(
      'Örnek muadil kodu gösterilemedi. Sürgü, voltaj ve konnektör bilgileri doğrulanmalıdır.'
    );
  }

  const warnings = consolidateCatalogWarningsForUi([...warningSet]);

  const metadata = deriveHydraulicCompatibilityMetadata({
    comparisons,
    scoredComparisons: options.canonical.scoredComparisons,
    warnings,
    requiresCatalogCheck: options.canonical.requiresCatalogCheck,
  });

  const summary = lookupEquivalenceSummary(
    compatible.length,
    different.length,
    options.canonical
  );
  summary.riskLevel = deriveSummaryRiskLevelFromMetadata(metadata);

  return {
    candidate: options.candidate,
    summary,
    compatible,
    different,
    checkItems,
    warnings,
    profileScoring: {
      scoredComparisons: options.canonical.scoredComparisons,
    },
    metadata,
  };
}
