import type { EvidenceLevel } from '@/types/product';
import type { ConnectorFamilyKey, ConnectorOptionKey } from '@/types/canonicalAttribute';

export type HydraulicMountingStandard =
  | 'ISO_4401_03_CETOP_03_NG6_NFPA_D03'
  | 'ISO_4401_05_CETOP_05_NG10_NFPA_D05'
  | 'ISO_4401_07_NG16_NFPA_D07'
  | 'ISO_4401_08_NG25_NFPA_D08'
  | 'ISO_4401_10_NG32_NFPA_D10'
  | 'unknown';

export type HydraulicValveWaysPositions =
  | '2_2'
  | '3_2'
  | '4_2'
  | '4_3'
  | '5_2'
  | '5_3'
  | 'unknown';

export type HydraulicCenterCondition =
  | 'closed_center'
  | 'open_center'
  | 'tandem_center'
  | 'float_center'
  | 'partially_open'
  | 'not_applicable'
  | 'unknown';

export type HydraulicCentering =
  | 'spring_centered'
  | 'spring_offset'
  | 'detented'
  | 'manual_return'
  | 'unknown';

export type CanonicalCoilVoltage =
  | 'DC_12V'
  | 'DC_24V'
  | 'DC_48V'
  | 'DC_110V'
  | 'DC_220V'
  | 'AC_24V'
  | 'AC_48V'
  | 'AC_110V'
  | 'AC_115V'
  | 'AC_120V'
  | 'AC_220V'
  | 'AC_230V'
  | 'AC_240V'
  | 'unknown';

export type CanonicalConnectorType =
  | 'DIN_VALVE_CONNECTOR'
  | 'PLUG_IN_CONNECTOR'
  | 'AMP_JUNIOR_TIMER'
  | 'DEUTSCH_CONNECTOR'
  | 'M12_4_PIN'
  | 'FLYING_LEAD'
  | 'TERMINAL_BOX'
  | 'unknown';

export type CanonicalManualOverride =
  | 'none'
  | 'manual_override'
  | 'protected_manual_override'
  | 'concealed_manual_override'
  | 'detent_manual_override'
  | 'unknown';

export type CanonicalSealMaterial = 'NBR' | 'FKM' | 'EPDM' | 'unknown';

export type CanonicalImportance = 'critical' | 'important' | 'optional';

export type CanonicalConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type CanonicalField<T> = {
  key: string;
  label: string;
  value: T | null;
  displayValue: string;
  rawValue?: string | number | boolean | null;
  rawToken?: string;
  evidence: EvidenceLevel;
  confidence: CanonicalConfidence;
  requiresCatalogCheck?: boolean;
  importance: CanonicalImportance;
  notes?: string[];
  connectorFamilyKey?: ConnectorFamilyKey;
  connectorStandardKey?: string;
  connectorOptions?: ConnectorOptionKey[];
  displayDetail?: string;
  isGenericConnector?: boolean;
};

export type HydraulicValveCanonicalProfile = {
  productCategory: 'hydraulic_valve';

  brand?: string;
  series?: string;

  mountingStandard: CanonicalField<HydraulicMountingStandard>;
  waysPositions: CanonicalField<HydraulicValveWaysPositions>;
  centerCondition: CanonicalField<HydraulicCenterCondition>;
  centering: CanonicalField<HydraulicCentering>;

  coilVoltage: CanonicalField<CanonicalCoilVoltage>;
  connectorType: CanonicalField<CanonicalConnectorType>;
  manualOverride: CanonicalField<CanonicalManualOverride>;

  maxPressureBar?: CanonicalField<number | null>;
  tankPortMaxPressureBar?: CanonicalField<number | null>;
  maxFlowLpm?: CanonicalField<number | null>;

  sealMaterial?: CanonicalField<CanonicalSealMaterial>;

  rawFunctionCode?: string;
  rawSpoolSymbol?: string;
  rawVoltageCode?: string;
  rawConnectorCode?: string;

  notes: string[];
};
