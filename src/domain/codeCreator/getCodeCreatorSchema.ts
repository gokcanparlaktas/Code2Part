import { hydraulicCenterTypeOptionsForCreator } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import { WAYS_POSITIONS_DICTIONARY } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import { buildHydraulicCoilVoltageOptions } from '@/domain/codeCreator/hydraulicCoilVoltageCatalogOptions';
import {
  buildPneumaticCushioningOptions,
  buildPneumaticExtraOptions,
  buildPneumaticRodEndOptions,
  buildPneumaticSensorOptions,
} from '@/domain/codeCreator/pneumaticCreatorCatalogOptions';
import { buildRexrothDesignSeriesOptions } from '@/domain/codeCreator/rexrothDesignSeriesOptions';
import type {
  CodeCreatorBrandKey,
  CodeCreatorCategoryDefinition,
  CodeCreatorCategoryKey,
  CodeCreatorFieldDefinition,
  CodeCreatorFieldKey,
  HydraulicValveMountingGroupKey,
} from '@/types/productCodeCreator';

const UNCERTAIN_OPTION = {
  value: '__uncertain__',
  labelTr: 'Kararsızım / Bilmiyorum',
  isUncertain: true,
};

export const CODE_CREATOR_CATEGORIES: CodeCreatorCategoryDefinition[] = [
  {
    key: 'hydraulic_valve',
    labelTr: 'Hidrolik yön kontrol valfi',
    descriptionTr:
      'CETOP montaj ölçüsüne göre yol/konum, merkez tipi, bobin ve konnektör seçerek sipariş kodu oluşturun.',
    mountingGroups: [
      { key: 'cetop_03_ng6', labelTr: 'CETOP 03 / NG6' },
      { key: 'cetop_05_ng10', labelTr: 'CETOP 05 / NG10' },
    ],
    brands: [
      { key: null, labelTr: 'Tüm markalar' },
      { key: 'rexroth', labelTr: 'Rexroth' },
      { key: 'yuken', labelTr: 'Yuken' },
      { key: 'vickers', labelTr: 'Vickers' },
      { key: 'atos', labelTr: 'Atos' },
      { key: 'parker', labelTr: 'Parker' },
    ],
  },
  {
    key: 'pneumatic_cylinder',
    labelTr: 'Pnömatik silindir (ISO 15552)',
    descriptionTr:
      'Çap, strok, yastıklama, sensör, mil ucu ve ek seçenekleri girerek marka kodlarını oluşturun.',
    brands: [
      { key: null, labelTr: 'Tüm markalar' },
      { key: 'festo', labelTr: 'Festo' },
      { key: 'smc', labelTr: 'SMC' },
      { key: 'parker', labelTr: 'Parker' },
      { key: 'aventics', labelTr: 'Aventics' },
      { key: 'airtac', labelTr: 'Airtac' },
    ],
  },
];

const MOUNTING_TO_EQUIVALENCE_GROUP: Record<HydraulicValveMountingGroupKey, string> = {
  cetop_03_ng6: 'hydraulic_cetop_03_ng6_valve',
  cetop_05_ng10: 'hydraulic_cetop_05_ng10_valve',
};

const BRAND_TO_SERIES_BRAND: Record<CodeCreatorBrandKey, string> = {
  rexroth: 'Rexroth',
  yuken: 'Yuken',
  vickers: 'Vickers',
  atos: 'Atos',
  parker: 'Parker',
  festo: 'Festo',
  smc: 'SMC',
  aventics: 'Aventics',
  airtac: 'Airtac',
};

export function getEquivalenceGroupIdForMounting(
  mounting: HydraulicValveMountingGroupKey
): string {
  return MOUNTING_TO_EQUIVALENCE_GROUP[mounting];
}

export function seriesMatchesBrandFilter(
  seriesBrand: string,
  brandFilter: CodeCreatorBrandKey | null
): boolean {
  if (!brandFilter) {
    return true;
  }
  return seriesBrand.toLowerCase() === BRAND_TO_SERIES_BRAND[brandFilter].toLowerCase();
}

function buildWaysPositionsField(): CodeCreatorFieldDefinition {
  const options = Object.entries(WAYS_POSITIONS_DICTIONARY).map(([value, entry]) => ({
    value,
    labelTr: entry.labelTr,
  }));

  return {
    key: 'ways_positions',
    labelTr: 'Yol / konum sayısı',
    hintTr: 'Örn. 4/3 — valfin yol ve konum sayısı.',
    required: true,
    control: 'select',
    options,
  };
}

function buildCenterConditionField(): CodeCreatorFieldDefinition {
  return {
    key: 'center_condition',
    labelTr: 'Merkez tipi',
    hintTr: 'P, T, A, B port durumuna göre listelenir (katalog PTAB özeti).',
    required: true,
    control: 'select',
    options: hydraulicCenterTypeOptionsForCreator(),
  };
}

function buildHydraulicValveFields(
  brandFilter: CodeCreatorBrandKey | null,
  mountingGroup: HydraulicValveMountingGroupKey
): CodeCreatorFieldDefinition[] {
  const fields: CodeCreatorFieldDefinition[] = [
    buildWaysPositionsField(),
    buildCenterConditionField(),
  ];

  fields.push({
    key: 'coil_voltage',
    labelTr: 'Bobin voltajı',
    hintTr: 'DC bobin gerilimi; üretici kodu otomatik eşlenir.',
    control: 'select',
    options: [...buildHydraulicCoilVoltageOptions(), UNCERTAIN_OPTION],
  });

  fields.push({
    key: 'manual_override',
    labelTr: 'Manuel kumanda',
    options: [
      { value: 'with', labelTr: 'Var' },
      { value: 'without', labelTr: 'Yok' },
      UNCERTAIN_OPTION,
    ],
  });

  fields.push({
    key: 'connector_type',
    labelTr: 'Konnektör',
    options: [
      { value: 'standard', labelTr: 'Standart' },
      { value: 'alternate', labelTr: 'Alternatif' },
      UNCERTAIN_OPTION,
    ],
  });

  if (brandFilter === 'rexroth') {
    fields.push({
      key: 'design_series',
      labelTr: 'Tasarım serisi (Rexroth)',
      hintTr:
        mountingGroup === 'cetop_05_ng10'
          ? 'WE10 için iki haneli tasarım kodu (31, 35, 51, 52).'
          : 'WE6 için 60–69 veya 70–79 aralığından iki haneli kod (6X/7X yazılmaz).',
      required: true,
      control: 'select',
      options: buildRexrothDesignSeriesOptions(mountingGroup),
    });
  }

  if (brandFilter === 'yuken') {
    fields.push({
      key: 'design_number',
      labelTr: 'Tasarım numarası (Yuken)',
      options: [
        { value: '70', labelTr: '70 (güncel)' },
        { value: '50', labelTr: '50 (eski)' },
        UNCERTAIN_OPTION,
      ],
    });
  }

  return fields;
}

function buildPneumaticCylinderFields(): CodeCreatorFieldDefinition[] {
  const commonBores = ['32', '40', '50', '63', '80', '100', '125'];
  const commonStrokes = ['25', '50', '80', '100', '125', '160', '200', '250', '320'];

  return [
    {
      key: 'bore',
      labelTr: 'Çap (mm)',
      required: true,
      control: 'select',
      options: commonBores.map((value) => ({ value, labelTr: `${value} mm` })),
    },
    {
      key: 'stroke',
      labelTr: 'Strok (mm)',
      required: true,
      control: 'select',
      options: commonStrokes.map((value) => ({ value, labelTr: `${value} mm` })),
    },
    {
      key: 'cushioning_type',
      labelTr: 'Yastıklama (sönümleme)',
      hintTr: 'Var seçildiğinde her markanın katalog sönümleme kodu otomatik eklenir.',
      control: 'select',
      options: buildPneumaticCushioningOptions(),
    },
    {
      key: 'sensor_option',
      labelTr: 'Sensör / konum algılama',
      hintTr:
        'Sensör yuvası veya yakınlık anahtarı. Var seçildiğinde markanın katalog kodu eklenir (ör. Festo N3).',
      control: 'select',
      options: buildPneumaticSensorOptions(),
    },
    {
      key: 'rod_end_option',
      labelTr: 'Mil ucu / diş tipi',
      hintTr:
        'Dış diş (erkek) veya iç diş (dişi). Seçilen tipe göre markanın katalog kodu eklenir.',
      control: 'select',
      options: buildPneumaticRodEndOptions(),
    },
    {
      key: 'extra_option',
      labelTr: 'Ek seçenek',
      hintTr: 'Montaj veya seriye özel ek kodlar (ör. SMC SDB).',
      control: 'select',
      options: buildPneumaticExtraOptions(),
    },
  ];
}

export function getCodeCreatorFields(options: {
  category: CodeCreatorCategoryKey;
  brandFilter?: CodeCreatorBrandKey | null;
  mountingGroup?: HydraulicValveMountingGroupKey;
}): CodeCreatorFieldDefinition[] {
  if (options.category === 'hydraulic_valve') {
    return buildHydraulicValveFields(
      options.brandFilter ?? null,
      options.mountingGroup ?? 'cetop_03_ng6'
    );
  }
  return buildPneumaticCylinderFields();
}

export function getCodeCreatorCategory(
  key: CodeCreatorCategoryKey
): CodeCreatorCategoryDefinition | undefined {
  return CODE_CREATOR_CATEGORIES.find((category) => category.key === key);
}

export function isUncertainSelection(value: string | null | undefined): boolean {
  return value === '__uncertain__' || value === null || value === undefined;
}

export function collectUncertainFieldKeys(
  fields: CodeCreatorFieldDefinition[],
  selections: Partial<Record<CodeCreatorFieldKey, string | null>>
): CodeCreatorFieldKey[] {
  return fields
    .filter((field) => isUncertainSelection(selections[field.key]))
    .map((field) => field.key);
}
