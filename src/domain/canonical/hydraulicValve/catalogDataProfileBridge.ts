import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import {
  buildProductResolverContext,
  portStatesMatch,
  resolveConnectorCandidate,
  resolveMountingCandidate,
  resolveSpoolCandidate,
  resolveTechnicalDataCandidate,
  resolveVoltageCandidate,
  toCatalogResolverContext,
} from '@/domain/catalogData';
import type { TechnicalDataResolved } from '@/domain/catalogData/resolvers/resolveTechnicalDataCandidate';
import type { CatalogFieldEvidence, CatalogResolvedCandidate } from '@/domain/catalogData/types';
import type { ProductIdentification } from '@/types/product';

import type {
  CanonicalCoilVoltage,
  CanonicalField,
  HydraulicCenterCondition,
  HydraulicMountingStandard,
  HydraulicValveCanonicalProfile,
} from './hydraulicValveCanonicalTypes';
import { FIELD_LABELS } from './hydraulicValveCanonicalDictionary';
import {
  getCenterConditionDisplay,
  getCoilVoltageDisplay,
  getMountingStandardDisplay,
  normalizeCenterCondition,
  normalizeCoilVoltage,
  normalizeMountingStandard,
} from './normalizeHydraulicValveAttribute';

const CATALOG_NOTE_PREFIX = 'Katalog adayı';

function catalogFieldEvidence(candidate: CatalogResolvedCandidate): CatalogFieldEvidence {
  return {
    source: 'catalog_data',
    displayCandidate: candidate.displayCandidate ?? candidate.isoCode,
    isoCode: candidate.isoCode,
    portState: candidate.portState,
    centerCondition: candidate.centerCondition,
    centerFlowDescription: candidate.centerFlowDescription,
    needsReview: candidate.needsReview,
    confidence: candidate.confidence,
    reviewReason: candidate.reviewReason,
  };
}

function appendCatalogNote(profile: HydraulicValveCanonicalProfile, message: string): void {
  if (!profile.notes.includes(message)) {
    profile.notes.push(message);
  }
}

function attachEvidence<T>(
  field: CanonicalField<T>,
  candidate: CatalogResolvedCandidate,
  profile: HydraulicValveCanonicalProfile
): void {
  if (!candidate.found) {
    return;
  }
  field.catalogEvidence = catalogFieldEvidence(candidate);
  if (candidate.needsReview) {
    field.requiresCatalogCheck = true;
  }
  const label = candidate.displayCandidate ?? candidate.isoCode ?? candidate.rawToken;
  appendCatalogNote(
    profile,
    `${CATALOG_NOTE_PREFIX} (${field.label}): ${label}${candidate.needsReview ? ' — katalog incelemesi gerekli' : ''}`
  );
}

function isoToMountingStandard(isoCode: string): HydraulicMountingStandard | null {
  const upper = isoCode.toUpperCase();
  if (upper.includes('ISO 4401-03') || upper.includes('4401-03')) {
    return normalizeMountingStandard({ rawValue: 'ISO4401-03' });
  }
  if (upper.includes('ISO 4401-05') || upper.includes('4401-05')) {
    return normalizeMountingStandard({ rawValue: 'ISO4401-05' });
  }
  return null;
}

function catalogCenterCondition(candidate: CatalogResolvedCandidate): HydraulicCenterCondition | null {
  const raw = candidate.centerCondition ?? '';
  const allBlocked =
    candidate.portState?.P === 'blocked' &&
    candidate.portState?.T === 'blocked' &&
    candidate.portState?.A === 'blocked' &&
    candidate.portState?.B === 'blocked';
  if (raw.includes('closed_center') || allBlocked) {
    return normalizeCenterCondition('closed_center');
  }
  if (raw.includes('open_center')) {
    return normalizeCenterCondition('open_center');
  }
  return null;
}

function catalogCoilVoltage(candidate: CatalogResolvedCandidate): CanonicalCoilVoltage | null {
  if (candidate.voltageKind === 'DC' && candidate.voltageValue === 24) {
    return 'DC_24V';
  }
  if (candidate.displayCandidate) {
    return normalizeCoilVoltage({ rawValue: candidate.displayCandidate });
  }
  return null;
}

function applyVoltage(
  profile: HydraulicValveCanonicalProfile,
  candidate: CatalogResolvedCandidate
): void {
  attachEvidence(profile.coilVoltage, candidate, profile);
  const fromCatalog = catalogCoilVoltage(candidate);
  if (fromCatalog && profile.coilVoltage.value === 'unknown') {
    profile.coilVoltage.value = fromCatalog;
    profile.coilVoltage.displayValue = getCoilVoltageDisplay(fromCatalog);
  } else if (candidate.displayCandidate && profile.coilVoltage.value === 'unknown') {
    profile.coilVoltage.displayValue = candidate.displayCandidate;
  }
}

function applyMounting(
  profile: HydraulicValveCanonicalProfile,
  candidate: CatalogResolvedCandidate
): void {
  attachEvidence(profile.mountingStandard, candidate, profile);
  if (!candidate.isoCode) {
    return;
  }
  const fromIso = isoToMountingStandard(candidate.isoCode);
  if (fromIso && profile.mountingStandard.value === 'unknown') {
    profile.mountingStandard.value = fromIso;
    profile.mountingStandard.displayValue = getMountingStandardDisplay(fromIso);
    profile.mountingStandard.rawValue = candidate.isoCode;
  } else if (profile.mountingStandard.value === 'unknown') {
    profile.mountingStandard.displayValue = candidate.isoCode;
    profile.mountingStandard.rawValue = candidate.isoCode;
  }
}

function applySpool(
  profile: HydraulicValveCanonicalProfile,
  candidate: CatalogResolvedCandidate
): void {
  attachEvidence(profile.centerCondition, candidate, profile);
  const center = catalogCenterCondition(candidate);
  if (center && profile.centerCondition.value === 'unknown') {
    profile.centerCondition.value = center;
    profile.centerCondition.displayValue = getCenterConditionDisplay(center);
  } else if (candidate.centerFlowDescription && profile.centerCondition.value === 'unknown') {
    profile.centerCondition.displayValue = candidate.centerFlowDescription;
  }
}

function applyConnector(
  profile: HydraulicValveCanonicalProfile,
  candidate: CatalogResolvedCandidate
): void {
  attachEvidence(profile.connectorType, candidate, profile);
  if (candidate.displayCandidate) {
    profile.connectorType.displayValue = candidate.displayCandidate;
    profile.connectorType.displayDetail = candidate.displayCandidate;
  }
}

function applyTechnicalQuantityField(
  field: CanonicalField<number | null>,
  profile: HydraulicValveCanonicalProfile,
  technical: TechnicalDataResolved,
  options: {
    label: string;
    display?: string;
    bar?: number;
    lpm?: number;
    notes?: string;
  }
): void {
  if (options.bar == null && options.lpm == null) {
    return;
  }

  field.catalogEvidence = {
    source: 'catalog_data',
    displayCandidate: options.display,
    numericValueBar: options.bar,
    numericValueLpm: options.lpm,
    technicalNotes: options.notes,
    needsReview: technical.needsReview,
    confidence: technical.confidence,
  };
  field.requiresCatalogCheck = true;

  if (field.value == null) {
    field.value = options.bar ?? options.lpm ?? null;
  }
  if (options.display) {
    field.displayValue = options.display;
  }

  appendCatalogNote(
    profile,
    `${CATALOG_NOTE_PREFIX} (${options.label}): ${options.display ?? ''}${technical.needsReview ? ' — katalog incelemesi gerekli' : ''}`
  );
}

function applyTechnicalData(
  profile: HydraulicValveCanonicalProfile,
  technical: TechnicalDataResolved
): void {
  if (!technical.found) {
    return;
  }

  if (profile.maxPressureBar && technical.maxOperatingPressureBar != null) {
    applyTechnicalQuantityField(profile.maxPressureBar, profile, technical, {
      label: FIELD_LABELS.maxPressureBar,
      display: technical.maxOperatingPressureDisplay,
      bar: technical.maxOperatingPressureBar,
    });
  }

  if (profile.maxFlowLpm && technical.maxFlowLpm != null) {
    applyTechnicalQuantityField(profile.maxFlowLpm, profile, technical, {
      label: FIELD_LABELS.maxFlowLpm,
      display: technical.maxFlowDisplay,
      lpm: technical.maxFlowLpm,
      notes: technical.maxFlowNotes,
    });
  }

  if (profile.tankPortMaxPressureBar && technical.tankPortMaxPressureBar != null) {
    applyTechnicalQuantityField(profile.tankPortMaxPressureBar, profile, technical, {
      label: 'Maks. basınç (T)',
      display: technical.tankPortMaxPressureDisplay,
      bar: technical.tankPortMaxPressureBar,
    });
  }
}

/**
 * Enriches a legacy-built canonical profile with read-only catalog-data resolver evidence.
 * Does not override known legacy canonical values; fills unknowns and attaches review metadata.
 */
export function enrichHydraulicProfileFromCatalogData(
  profile: HydraulicValveCanonicalProfile,
  identification: ProductIdentification,
  catalogProvider?: CatalogDataProvider
): HydraulicValveCanonicalProfile {
  const productContext = buildProductResolverContext(identification.normalizedCode);
  if (!productContext) {
    return profile;
  }

  if (profile.rawVoltageCode) {
    applyVoltage(
      profile,
      resolveVoltageCandidate(
        toCatalogResolverContext(productContext, 'coil_rating', profile.rawVoltageCode),
        catalogProvider
      )
    );
  }

  applyMounting(profile, resolveMountingCandidate(productContext, catalogProvider));

  const spoolToken = profile.rawSpoolSymbol ?? profile.rawFunctionCode;
  if (spoolToken) {
    applySpool(
      profile,
      resolveSpoolCandidate(
        toCatalogResolverContext(productContext, 'spool_symbol', spoolToken),
        catalogProvider
      )
    );
  }

  if (profile.rawConnectorCode) {
    applyConnector(
      profile,
      resolveConnectorCandidate(
        toCatalogResolverContext(productContext, 'connector_type', profile.rawConnectorCode),
        catalogProvider
      )
    );
  }

  applyTechnicalData(profile, resolveTechnicalDataCandidate(productContext, catalogProvider));

  profile.notes = [...new Set(profile.notes)];
  return profile;
}

/** Test helper: compare catalog portState evidence on two profiles. */
export function catalogSpoolPortStatesMatch(
  source: HydraulicValveCanonicalProfile,
  target: HydraulicValveCanonicalProfile
): boolean {
  return portStatesMatch(
    source.centerCondition.catalogEvidence?.portState,
    target.centerCondition.catalogEvidence?.portState
  );
}
