import type {
    CanonicalCoilVoltage,
    CanonicalConnectorType,
    CanonicalImportance,
    CanonicalManualOverride,
    CanonicalSealMaterial,
    HydraulicCenterCondition,
    HydraulicCentering,
    HydraulicMountingStandard,
    HydraulicValveWaysPositions,
} from "./hydraulicValveCanonicalTypes";

export type CanonicalDictionaryEntry = {
  key: string;
  labelTr: string;
  descriptionTr?: string;
  aliases?: string[];
  importance: CanonicalImportance;
};

function entry(
  key: string,
  labelTr: string,
  importance: CanonicalImportance,
  options?: { descriptionTr?: string; aliases?: string[] },
): CanonicalDictionaryEntry {
  return {
    key,
    labelTr,
    importance,
    descriptionTr: options?.descriptionTr,
    aliases: options?.aliases,
  };
}

export const MOUNTING_STANDARD_DICTIONARY: Record<
  Exclude<HydraulicMountingStandard, "unknown">,
  CanonicalDictionaryEntry
> = {
  ISO_4401_03_CETOP_03_NG6_NFPA_D03: entry(
    "ISO_4401_03_CETOP_03_NG6_NFPA_D03",
    "ISO 4401-03 / CETOP 03 / NG6 / NFPA D03",
    "critical",
    {
      aliases: [
        "NG6",
        "CETOP03",
        "CETOP 03",
        "CETOP3",
        "D03",
        "NFPA D03",
        "ISO4401-03",
        "ISO 4401-03",
        "SIZE6",
        "SIZE 6",
      ],
    },
  ),
  ISO_4401_05_CETOP_05_NG10_NFPA_D05: entry(
    "ISO_4401_05_CETOP_05_NG10_NFPA_D05",
    "ISO 4401-05 / CETOP 05 / NG10 / NFPA D05",
    "critical",
    {
      aliases: [
        "NG10",
        "CETOP05",
        "CETOP 05",
        "CETOP5",
        "D05",
        "NFPA D05",
        "ISO4401-05",
        "ISO 4401-05",
        "SIZE10",
        "SIZE 10",
      ],
    },
  ),
  ISO_4401_07_NG16_NFPA_D07: entry(
    "ISO_4401_07_NG16_NFPA_D07",
    "ISO 4401-07 / NG16 / NFPA D07",
    "critical",
    { aliases: ["NG16", "D07", "ISO4401-07", "ISO 4401-07"] },
  ),
  ISO_4401_08_NG25_NFPA_D08: entry(
    "ISO_4401_08_NG25_NFPA_D08",
    "ISO 4401-08 / NG25 / NFPA D08",
    "critical",
    { aliases: ["NG25", "D08", "ISO4401-08", "ISO 4401-08"] },
  ),
  ISO_4401_10_NG32_NFPA_D10: entry(
    "ISO_4401_10_NG32_NFPA_D10",
    "ISO 4401-10 / NG32 / NFPA D10",
    "critical",
    { aliases: ["NG32", "D10", "ISO4401-10", "ISO 4401-10"] },
  ),
};

export const WAYS_POSITIONS_DICTIONARY: Record<
  Exclude<HydraulicValveWaysPositions, "unknown">,
  CanonicalDictionaryEntry
> = {
  "2_2": entry("2_2", "2/2", "critical", {
    aliases: ["2/2", "2-2", "2WAY2POS"],
  }),
  "3_2": entry("3_2", "3/2", "critical", {
    aliases: ["3/2", "3-2", "3WAY2POS"],
  }),
  "4_2": entry("4_2", "4/2", "critical", {
    aliases: ["4/2", "4-2", "4WAY2POS"],
  }),
  "4_3": entry("4_3", "4/3", "critical", {
    aliases: ["4/3", "4-3", "4WAY3POS"],
  }),
  "5_2": entry("5_2", "5/2", "critical", {
    aliases: ["5/2", "5-2", "5WAY2POS"],
  }),
  "5_3": entry("5_3", "5/3", "critical", {
    aliases: ["5/3", "5-3", "5WAY3POS"],
  }),
};

export const CENTER_CONDITION_DICTIONARY: Record<
  Exclude<HydraulicCenterCondition, "unknown">,
  CanonicalDictionaryEntry
> = {
  closed_center: entry("closed_center", "Kapalı merkez", "critical", {
    descriptionTr: "Merkez konumda ana hatlar kapalıdır.",
  }),
  open_center: entry("open_center", "Açık merkez", "critical"),
  tandem_center: entry("tandem_center", "Tandem merkez", "critical"),
  float_center: entry("float_center", "Yüzer merkez", "critical"),
  partially_open: entry("partially_open", "Kısmen açık merkez", "critical"),
  not_applicable: entry("not_applicable", "Uygulanamaz", "critical"),
};

export const CENTERING_DICTIONARY: Record<
  Exclude<HydraulicCentering, "unknown">,
  CanonicalDictionaryEntry
> = {
  spring_centered: entry("spring_centered", "Yay merkezlemeli", "critical"),
  spring_offset: entry("spring_offset", "Yay ofsetli", "critical"),
  detented: entry("detented", "Kilitlemeli / detent", "critical"),
  manual_return: entry("manual_return", "Manuel geri dönüş", "critical"),
};

export const COIL_VOLTAGE_DICTIONARY: Record<
  Exclude<CanonicalCoilVoltage, "unknown">,
  CanonicalDictionaryEntry
> = {
  DC_12V: entry("DC_12V", "12V DC", "critical", {
    aliases: ["G12", "EG12", "CG12", "D12", "12DC", "DC12"],
  }),
  DC_24V: entry("DC_24V", "24V DC", "critical", {
    aliases: ["G24", "EG24", "CG24", "HG24", "D24", "24DC", "DC24"],
  }),
  DC_48V: entry("DC_48V", "48V DC", "critical", {
    aliases: ["D48", "48DC", "DC48"],
  }),
  DC_110V: entry("DC_110V", "110V DC", "critical", {
    aliases: ["110DC", "DC110", "D110"],
  }),
  DC_220V: entry("DC_220V", "220V DC", "critical", {
    aliases: ["220DC", "DC220"],
  }),
  AC_24V: entry("AC_24V", "24V AC", "critical", {
    aliases: ["A24", "24AC", "AC24"],
  }),
  AC_48V: entry("AC_48V", "48V AC", "critical", {
    aliases: ["A48", "48AC", "AC48"],
  }),
  AC_110V: entry("AC_110V", "110V AC", "critical", {
    aliases: ["A110", "110AC", "AC110"],
  }),
  AC_115V: entry("AC_115V", "115V AC", "critical", {
    aliases: ["A115", "115AC", "AC115"],
  }),
  AC_120V: entry("AC_120V", "120V AC", "critical", {
    aliases: ["A120", "120AC", "AC120"],
  }),
  AC_220V: entry("AC_220V", "220V AC", "critical", {
    aliases: ["A220", "220AC", "AC220"],
  }),
  AC_230V: entry("AC_230V", "230V AC", "critical", {
    aliases: ["A230", "230AC", "AC230"],
  }),
  AC_240V: entry("AC_240V", "240V AC", "critical", {
    aliases: ["A240", "240AC", "AC240"],
  }),
};

export const CONNECTOR_TYPE_DICTIONARY: Record<
  Exclude<CanonicalConnectorType, "unknown">,
  CanonicalDictionaryEntry
> = {
  DIN_VALVE_CONNECTOR: entry(
    "DIN_VALVE_CONNECTOR",
    "DIN 43650, EN 175301-803",
    "important",
    {
      aliases: [
        "K4",
        "U",
        "U1",
        "U6",
        "DIN",
        "DIN43650",
        "ISO4400",
        "EN175301803",
        "DIN_43650_FORM_A_EN_175301_803",
      ],
    },
  ),
  PLUG_IN_CONNECTOR: entry("PLUG_IN_CONNECTOR", "Fişli konnektör", "important", {
    aliases: ["N", "N1"],
  }),
  AMP_JUNIOR_TIMER: entry("AMP_JUNIOR_TIMER", "AMP / Junior Timer konnektör", "important", {
    aliases: ["C4Z", "KUP4", "AMP", "JUNIOR_TIMER"],
  }),
  DEUTSCH_CONNECTOR: entry("DEUTSCH_CONNECTOR", "Deutsch konnektör", "important", {
    aliases: ["KUP5"],
  }),
  M12_4_PIN: entry("M12_4_PIN", "M12 4-pin konnektör", "important", {
    aliases: ["KUPM4L", "M12"],
  }),
  FLYING_LEAD: entry("FLYING_LEAD", "Kablo çıkışlı bağlantı", "important", {
    aliases: ["LEADWIRE", "LEAD_WIRE"],
  }),
  TERMINAL_BOX: entry("TERMINAL_BOX", "Terminal kutulu bağlantı", "important", {
    aliases: ["CONDUIT", "CONDUIT_BOX"],
  }),
};

export const MANUAL_OVERRIDE_DICTIONARY: Record<
  Exclude<CanonicalManualOverride, "unknown">,
  CanonicalDictionaryEntry
> = {
  none: entry("none", "Yok", "important"),
  manual_override: entry("manual_override", "Manuel kumanda", "important", {
    aliases: ["DEFAULT", "BLANK", "C"],
  }),
  protected_manual_override: entry(
    "protected_manual_override",
    "Korumalı manuel kumanda",
    "important",
  ),
  concealed_manual_override: entry(
    "concealed_manual_override",
    "Gizli manuel kumanda",
    "important",
  ),
  detent_manual_override: entry(
    "detent_manual_override",
    "Detent manuel kumanda",
    "important",
    {
      aliases: ["N9"],
    },
  ),
};

export const SEAL_MATERIAL_DICTIONARY: Record<
  Exclude<CanonicalSealMaterial, "unknown">,
  CanonicalDictionaryEntry
> = {
  NBR: entry("NBR", "NBR", "optional"),
  FKM: entry("FKM", "FKM / Viton", "optional"),
  EPDM: entry("EPDM", "EPDM", "optional"),
};

export const FIELD_LABELS = {
  mountingStandard: "Montaj standardı",
  waysPositions: "Yol/konum yapısı",
  centerCondition: "Merkez tipi",
  centering: "Merkezleme",
  coilVoltage: "Bobin voltajı",
  connectorType: "Konnektör tipi",
  manualOverride: "Manuel kumanda",
  maxPressureBar: "Maks. basınç (A/B/P)",
  maxFlowLpm: "Maks. debi",
  sealMaterial: "Keçe / sızdırmazlık malzemesi",
  spoolFunctionCode: "Merkez tipi",
} as const;

function buildAliasIndex<T extends string>(
  dictionary: Record<T, CanonicalDictionaryEntry>,
): Map<string, T> {
  const index = new Map<string, T>();
  for (const [canonicalKey, dictEntry] of Object.entries(dictionary) as [
    T,
    CanonicalDictionaryEntry,
  ][]) {
    index.set(compactToken(canonicalKey), canonicalKey);
    index.set(compactToken(dictEntry.labelTr), canonicalKey);
    for (const alias of dictEntry.aliases ?? []) {
      index.set(compactToken(alias), canonicalKey);
    }
  }
  return index;
}

export function compactToken(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s\-_/]+/g, "");
}

export function getDictionaryLabelTr(
  dictionary: Record<string, CanonicalDictionaryEntry>,
  key: string | null | undefined,
): string {
  if (!key || key === "unknown") {
    return "Bilinmiyor";
  }
  return dictionary[key]?.labelTr ?? key;
}

export function getWaysPositionsDisplay(
  key: HydraulicValveWaysPositions | null,
): string {
  if (!key || key === "unknown") {
    return "Bilinmiyor";
  }
  return WAYS_POSITIONS_DICTIONARY[key]?.labelTr ?? key.replace("_", "/");
}

const MOUNTING_ALIAS_INDEX = buildAliasIndex(MOUNTING_STANDARD_DICTIONARY);
const WAYS_POSITIONS_ALIAS_INDEX = buildAliasIndex(WAYS_POSITIONS_DICTIONARY);
const CENTER_CONDITION_ALIAS_INDEX = buildAliasIndex(
  CENTER_CONDITION_DICTIONARY,
);
const CENTERING_ALIAS_INDEX = buildAliasIndex(CENTERING_DICTIONARY);
const COIL_VOLTAGE_ALIAS_INDEX = buildAliasIndex(COIL_VOLTAGE_DICTIONARY);
const CONNECTOR_ALIAS_INDEX = buildAliasIndex(CONNECTOR_TYPE_DICTIONARY);
const MANUAL_OVERRIDE_ALIAS_INDEX = buildAliasIndex(MANUAL_OVERRIDE_DICTIONARY);
const SEAL_MATERIAL_ALIAS_INDEX = buildAliasIndex(SEAL_MATERIAL_DICTIONARY);

export function lookupMountingStandardAlias(
  token: string,
): HydraulicMountingStandard | null {
  return (
    (MOUNTING_ALIAS_INDEX.get(compactToken(token)) as
      | HydraulicMountingStandard
      | undefined) ?? null
  );
}

export function lookupWaysPositionsAlias(
  token: string,
): HydraulicValveWaysPositions | null {
  return (
    (WAYS_POSITIONS_ALIAS_INDEX.get(compactToken(token)) as
      | HydraulicValveWaysPositions
      | undefined) ?? null
  );
}

export function lookupCenterConditionAlias(
  token: string,
): HydraulicCenterCondition | null {
  return (
    (CENTER_CONDITION_ALIAS_INDEX.get(compactToken(token)) as
      | HydraulicCenterCondition
      | undefined) ?? null
  );
}

export function lookupCenteringAlias(token: string): HydraulicCentering | null {
  return (
    (CENTERING_ALIAS_INDEX.get(compactToken(token)) as
      | HydraulicCentering
      | undefined) ?? null
  );
}

export function lookupCoilVoltageAlias(
  token: string,
): CanonicalCoilVoltage | null {
  return (
    (COIL_VOLTAGE_ALIAS_INDEX.get(compactToken(token)) as
      | CanonicalCoilVoltage
      | undefined) ?? null
  );
}

export function lookupConnectorTypeAlias(
  token: string,
): CanonicalConnectorType | null {
  return (
    (CONNECTOR_ALIAS_INDEX.get(compactToken(token)) as
      | CanonicalConnectorType
      | undefined) ?? null
  );
}

export function lookupManualOverrideAlias(
  token: string,
): CanonicalManualOverride | null {
  return (
    (MANUAL_OVERRIDE_ALIAS_INDEX.get(compactToken(token)) as
      | CanonicalManualOverride
      | undefined) ?? null
  );
}

export function lookupSealMaterialAlias(
  token: string,
): CanonicalSealMaterial | null {
  return (
    (SEAL_MATERIAL_ALIAS_INDEX.get(compactToken(token)) as
      | CanonicalSealMaterial
      | undefined) ?? null
  );
}
