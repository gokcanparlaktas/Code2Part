import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEMO_EXTRA_CHECK_RULES,
  DEMO_HYDRAULIC_EXTRA_CHECK_REFS,
  DEMO_PNEUMATIC_EXTRA_CHECK_REFS,
  DEMO_SERIES_ENRICHMENT,
} from './demo-catalog-enrichment-v1.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'src', 'data');
const catalogDir = path.join(dataDir, 'catalog');

const productSeries = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'productSeries.json'), 'utf8')
);
const hydraulicSeries = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'hydraulicValveSeries.json'), 'utf8')
);
const equivalenceGroups = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'equivalentSeries.json'), 'utf8')
);
const parsingRules = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'parsingRules.json'), 'utf8')
);
const exampleCodes = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'exampleProductCodes.json'), 'utf8')
);
const hydraulicExampleCodes = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'hydraulicValveExampleCodes.json'), 'utf8')
);

const PNEUMATIC_KNOWN_TOKENS = [
  { token: 'PPVA', meaningTr: 'Sönümleme seçeneği', confidence: 'medium', requiresCatalogCheck: true, role: 'cushioning' },
  { token: 'PPSA', meaningTr: 'Sönümleme seçeneği', confidence: 'medium', requiresCatalogCheck: true, role: 'cushioning' },
  { token: 'N3', meaningTr: 'Sensör yuvası / seçenek', confidence: 'low', requiresCatalogCheck: true, role: 'sensor' },
  { token: 'D', meaningTr: 'Strok sonu seçeneği', confidence: 'low', requiresCatalogCheck: true, role: 'options' },
  { token: 'A', meaningTr: 'Strok sonu seçeneği', confidence: 'low', requiresCatalogCheck: true, role: 'options' },
];

const PNEUMATIC_CHECK_REFS = [
  { ruleId: 'pneumatic_bore' },
  { ruleId: 'pneumatic_stroke' },
  { ruleId: 'pneumatic_cushioning' },
  { ruleId: 'pneumatic_port_thread' },
  { ruleId: 'pneumatic_mounting' },
  { ruleId: 'pneumatic_sensor' },
  { ruleId: 'pneumatic_rod_end' },
  { ruleId: 'pneumatic_manufacturer_series' },
];

const HYDRAULIC_VOLTAGE_COMMON = [
  {
    code: 'EG24',
    labelTr: '24 V DC',
    confidence: 'high',
    requiresCatalogCheck: false,
    matchPattern: '\\bEG24\\b|EG24N',
  },
  {
    code: 'CG24',
    labelTr: '24 V DC',
    confidence: 'high',
    requiresCatalogCheck: false,
    matchPattern: '\\bCG24\\b|CG24N',
  },
  {
    code: 'D24',
    labelTr: '24 V DC',
    confidence: 'high',
    requiresCatalogCheck: false,
    matchPattern: '\\bD24\\b|-D24-',
  },
  {
    code: '24DC',
    labelTr: '24 V DC',
    confidence: 'high',
    requiresCatalogCheck: false,
    matchPattern: '24DC',
  },
];

const HYDRAULIC_VOLTAGE_H7 = {
  code: 'H7',
  confidence: 'low',
  requiresCatalogCheck: true,
  matchPattern: '(?:^|[^A-Z0-9])H7(?:[^A-Z0-9]|$)',
};

const HYDRAULIC_CODE_PATTERNS_SHARED = {
  connector: [
    {
      id: 'connector-kn',
      kind: 'connector',
      pattern: '([KN]\\d{1,2})',
      captureGroup: 1,
      confidence: 'low',
      requiresCatalogCheck: true,
    },
  ],
  revision: [
    {
      id: 'revision-x-suffix',
      kind: 'revision',
      pattern: '-(\\d{1,2}X)\\b',
      captureGroup: 1,
      confidence: 'medium',
    },
    {
      id: 'revision-end-two-digit',
      kind: 'revision',
      pattern: '-(\\d{2})$',
      captureGroup: 1,
      confidence: 'medium',
    },
  ],
  inferredVoltage: [
    {
      id: 'inferred-d-voltage',
      kind: 'inferred_voltage',
      pattern: '-D(\\d{2,3})-',
      captureGroup: 1,
      confidence: 'medium',
      requiresCatalogCheck: true,
      noteTr: 'Voltaj koddan tahmin edildi; katalogdan doğrulanmalıdır.',
    },
  ],
};

const PNEUMATIC_BORE_STROKE_FALLBACK = [
  {
    id: 'fallback-bore-stroke-x',
    kind: 'bore_stroke',
    pattern: '(\\d{1,3})X(\\d{1,4})',
    boreGroup: 1,
    strokeGroup: 2,
  },
  {
    id: 'fallback-bore-stroke-dash',
    kind: 'bore_stroke',
    pattern: '-(\\d{1,3})-(\\d{1,4})(?:-|$)',
    boreGroup: 1,
    strokeGroup: 2,
  },
  {
    id: 'fallback-bore-stroke-compact',
    kind: 'bore_stroke',
    pattern: '^[A-Z]+(\\d{1,3})-(\\d{1,4})[A-Z]*$',
    boreGroup: 1,
    strokeGroup: 2,
  },
  {
    id: 'fallback-bore-stroke-sms',
    kind: 'bore_stroke',
    pattern: 'S(\\d{2,3})MS-(\\d{2,4})',
    boreGroup: 1,
    strokeGroup: 2,
  },
  {
    id: 'fallback-bore-stroke-tail',
    kind: 'bore_stroke',
    pattern: '(\\d{1,3})-(\\d{1,4})$',
    boreGroup: 1,
    strokeGroup: 2,
  },
];

function hydraulicFunctionTokenPatterns(legacy) {
  const prefix = legacy.codePrefix;
  const series = legacy.series;
  const patterns = [];

  if (prefix.startsWith('4WE6')) {
    patterns.push({
      id: `${legacy.id}-fn-4we6`,
      kind: 'function_token',
      pattern: '^4WE6([A-Z])',
      captureGroup: 1,
    });
  }
  if (prefix.startsWith('4WE10')) {
    patterns.push({
      id: `${legacy.id}-fn-4we10`,
      kind: 'function_token',
      pattern: '^4WE10([A-Z])',
      captureGroup: 1,
    });
  }
  if (series.startsWith('DSG')) {
    patterns.push({
      id: `${legacy.id}-fn-dsg-3c`,
      kind: 'function_token',
      pattern: '\\b(3C\\d{1,2})\\b',
      captureGroup: 1,
    });
  }
  if (series.startsWith('DG4V')) {
    patterns.push({
      id: `${legacy.id}-fn-dg4v`,
      kind: 'function_token',
      pattern: '-(\\d[A-Z])-',
      captureGroup: 1,
    });
  }
  if (prefix === 'DHI' || prefix === 'DHU') {
    patterns.push({
      id: `${legacy.id}-fn-atos-config`,
      kind: 'function_token',
      pattern: `${prefix}-(\\d{4})`,
      captureGroup: 1,
    });
  }
  if (prefix.startsWith('D1VW') || prefix.startsWith('D3VW')) {
    patterns.push({
      id: `${legacy.id}-fn-parker-dvw`,
      kind: 'function_token',
      pattern: `^${prefix.replace(/-/g, '')}(\\d{3})`,
      captureGroup: 1,
    });
  }

  return patterns;
}

function hydraulicCodePatterns(legacy) {
  return {
    ...HYDRAULIC_CODE_PATTERNS_SHARED,
    functionToken: hydraulicFunctionTokenPatterns(legacy),
  };
}

const HYDRAULIC_CHECK_REFS = [
  { ruleId: 'hydraulic_spool_function' },
  { ruleId: 'hydraulic_coil_voltage' },
  { ruleId: 'hydraulic_connector' },
  { ruleId: 'hydraulic_pressure_rating' },
  { ruleId: 'hydraulic_flow_rating' },
  { ruleId: 'hydraulic_seal_material' },
  { ruleId: 'hydraulic_manual_override' },
];

const FUNCTION_MAPPING_REFS_BY_PREFIX = {
  '4WE6': ['rexroth_e_closed_center', 'yuken_3c2_closed_center', 'vickers_2a_closed_center', 'atos_0711_closed_center'],
  '4WE10': ['rexroth_e_closed_center', 'yuken_3c2_closed_center', 'vickers_2a_closed_center', 'atos_0711_closed_center'],
  'DSG-01': ['yuken_3c2_closed_center', 'rexroth_e_closed_center', 'vickers_2a_closed_center', 'atos_0711_closed_center'],
  'DSG-03': ['yuken_3c2_closed_center', 'yuken_3c12_tandem', 'rexroth_e_closed_center'],
  'DG4V-3': ['vickers_2a_closed_center', 'rexroth_e_closed_center', 'yuken_3c2_closed_center'],
  'DG4V-5': ['vickers_2a_closed_center', 'rexroth_e_closed_center'],
  DHI: ['atos_0711_closed_center', 'rexroth_e_closed_center'],
  DHU: ['atos_0711_closed_center', 'rexroth_e_closed_center'],
  D1VW: ['rexroth_e_closed_center'],
  D3W: ['rexroth_e_closed_center'],
};

function pneumaticAttributes(standardFamily) {
  return [
    { key: 'bore', labelTr: 'Çap', valueType: 'number', source: 'code' },
    { key: 'stroke', labelTr: 'Strok', valueType: 'number', source: 'code' },
    { key: 'standard_family', labelTr: 'Standart ailesi', valueType: 'string', source: 'standard', defaultValue: standardFamily },
  ];
}

function hydraulicAttributes(cetopNgLabel) {
  return [
    { key: 'cetop_ng', labelTr: 'CETOP / NG', valueType: 'string', source: 'series_table', defaultValue: cetopNgLabel },
    { key: 'function_token', labelTr: 'Sürgü / fonksiyon', valueType: 'string', source: 'code' },
    { key: 'voltage', labelTr: 'Bobin voltajı', valueType: 'string', source: 'code' },
    { key: 'connector_token', labelTr: 'Konnektör', valueType: 'string', source: 'code' },
  ];
}

function searchAliasesFromSeries(s) {
  const aliases = new Set([s.brand, s.series, s.codePrefix, ...(s.matchPrefixes ?? [])]);
  if (s.brand === 'SMC' && s.series === 'CP96') {
    aliases.add('CP96SDB');
  }
  return [...aliases];
}

function toCatalogSeries(legacy) {
  const isHydraulic = legacy.resolverCategory === 'hydraulic_valve';
  const seriesParsing = parsingRules.filter((r) => r.seriesId === legacy.id);
  const examples = [
    ...(legacy.exampleProductCodes ?? []),
    ...exampleCodes.filter((code) => code.startsWith(legacy.codePrefix)),
  ];
  const uniqueExamples = [...new Set(examples)];

  if (isHydraulic) {
    const vickers = legacy.series.startsWith('DG4V');
    return {
      ...pickReliability(legacy),
      id: legacy.id,
      brand: legacy.brand,
      series: legacy.series,
      category: legacy.category,
      resolverCategory: legacy.resolverCategory,
      productTypeLabel: legacy.productType,
      productCategoryLabel: legacy.productCategory,
      standardFamily: legacy.standardFamily,
      technology: legacy.technology,
      equivalenceGroupId: legacy.equivalenceGroupId ?? legacy.equivalenceGroup,
      codePrefix: legacy.codePrefix,
      matchPrefixes: legacy.matchPrefixes ?? [legacy.codePrefix],
      confidenceWhenMatched: legacy.confidenceWhenMatched,
      cetopNgLabel: legacy.cetopNgLabel,
      defaultCoilVoltageTr: legacy.defaultCoilVoltageTr,
      searchAliases: searchAliasesFromSeries(legacy),
      exampleCodes: uniqueExamples.length > 0 ? uniqueExamples : hydraulicExampleCodes.filter((c) => c.includes(legacy.codePrefix.replace(/-/g, ''))),
      attributes: hydraulicAttributes(legacy.cetopNgLabel ?? legacy.standardFamily),
      knownTokens: [],
      voltageCodes: vickers
        ? [...HYDRAULIC_VOLTAGE_COMMON, HYDRAULIC_VOLTAGE_H7]
        : HYDRAULIC_VOLTAGE_COMMON,
      functionMappingRefs: (FUNCTION_MAPPING_REFS_BY_PREFIX[legacy.codePrefix] ?? FUNCTION_MAPPING_REFS_BY_PREFIX[legacy.series] ?? []).map(
        (mappingId) => ({ mappingId })
      ),
      checkRuleRefs: HYDRAULIC_CHECK_REFS,
      parsingRules: [],
      codePatterns: hydraulicCodePatterns(legacy),
    };
  }

  return {
    ...pickReliability(legacy),
    id: legacy.id,
    brand: legacy.brand,
    series: legacy.series,
    category: legacy.category,
    resolverCategory: legacy.resolverCategory,
    productTypeLabel: legacy.productType,
    productCategoryLabel: legacy.productCategory,
    standardFamily: legacy.standardFamily,
    technology: legacy.technology,
    equivalenceGroupId: legacy.equivalenceGroupId ?? legacy.equivalenceGroup,
    codePrefix: legacy.codePrefix,
    matchPrefixes: legacy.matchPrefixes ?? [legacy.codePrefix],
    suggestedCodeTemplate: legacy.suggestedCodeTemplate,
    confidenceWhenMatched: legacy.confidenceWhenMatched,
    searchAliases: searchAliasesFromSeries(legacy),
    exampleCodes: uniqueExamples,
    attributes: pneumaticAttributes(legacy.standardFamily),
    knownTokens: PNEUMATIC_KNOWN_TOKENS,
    checkRuleRefs: PNEUMATIC_CHECK_REFS,
    parsingRules: seriesParsing.map((r) => ({
      id: r.id ?? `${legacy.id}-${r.pattern}`,
      pattern: r.pattern,
      boreGroup: r.boreGroup,
      strokeGroup: r.strokeGroup,
    })),
    comparisonProfileRef: 'legacy:equivalenceProfiles',
    codePatterns: {
      boreStrokeFallback: PNEUMATIC_BORE_STROKE_FALLBACK,
    },
  };
}

function pickReliability(record) {
  return {
    verificationStatus: record.verificationStatus,
    sourceType: record.sourceType,
    sourceUrl: record.sourceUrl,
    lastReviewedAt: record.lastReviewedAt,
    notesTr: record.notesTr,
  };
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function mergeCheckRuleRefs(existing, extra) {
  const seen = new Set(existing.map((ref) => ref.ruleId));
  const merged = [...existing];
  for (const ref of extra) {
    if (seen.has(ref.ruleId)) {
      continue;
    }
    seen.add(ref.ruleId);
    merged.push(ref);
  }
  return merged;
}

function mergeKnownTokens(base, extra) {
  if (!extra || extra.length === 0) {
    return base;
  }
  const byToken = new Map((base ?? []).map((token) => [token.token, token]));
  for (const token of extra) {
    byToken.set(token.token, token);
  }
  return [...byToken.values()];
}

function mergeParsingRules(base, extra) {
  if (!extra || extra.length === 0) {
    return base;
  }
  const byId = new Map((base ?? []).map((rule) => [rule.id, rule]));
  for (const rule of extra) {
    byId.set(rule.id, rule);
  }
  return [...byId.values()];
}

function applyDemoEnrichment(series) {
  const patch = DEMO_SERIES_ENRICHMENT[series.id];
  const isHydraulic = series.resolverCategory === 'hydraulic_valve';
  const isPneumatic = series.resolverCategory === 'pneumatic_cylinder';

  let enriched = { ...series };

  if (isHydraulic) {
    enriched.checkRuleRefs = mergeCheckRuleRefs(
      enriched.checkRuleRefs ?? [],
      DEMO_HYDRAULIC_EXTRA_CHECK_REFS
    );
  }

  if (isPneumatic) {
    enriched.checkRuleRefs = mergeCheckRuleRefs(
      enriched.checkRuleRefs ?? [],
      DEMO_PNEUMATIC_EXTRA_CHECK_REFS
    );
  }

  if (patch) {
    enriched.exampleCodes = uniqueStrings([
      ...(enriched.exampleCodes ?? []),
      ...(patch.exampleCodes ?? []),
    ]);
    enriched.searchAliases = uniqueStrings([
      ...(enriched.searchAliases ?? []),
      ...(patch.searchAliases ?? []),
    ]);
    enriched.knownTokens = mergeKnownTokens(enriched.knownTokens ?? [], patch.knownTokens ?? []);
    enriched.parsingRules = mergeParsingRules(enriched.parsingRules ?? [], patch.parsingRules ?? []);
  }

  if (isHydraulic || isPneumatic) {
    const demoNote =
      'Demo v1 genişletmesi: örnek kodlar ve arama takma adları test amaçlıdır; sipariş öncesi üretici kataloğu ile doğrulanmalıdır.';
    enriched.notesTr = enriched.notesTr?.includes('Demo v1')
      ? enriched.notesTr
      : [enriched.notesTr, demoNote].filter(Boolean).join(' ');
    enriched.lastReviewedAt = enriched.lastReviewedAt ?? '2026-05-26';
  }

  return enriched;
}

const catalogSeries = [...productSeries, ...hydraulicSeries]
  .map(toCatalogSeries)
  .map(applyDemoEnrichment);

const functionMappings = [
  {
    ...pickReliability({ verificationStatus: 'manual_unverified', sourceType: 'manual', sourceUrl: null, lastReviewedAt: null, notesTr: 'Dikkatli eşleştirme; katalog sembolü gerekir.' }),
    id: 'rexroth_e_closed_center',
    manufacturer: 'Rexroth',
    seriesFamily: '4WE',
    token: 'E',
    canonicalFunctionId: 'closed_center_4_3',
    confidence: 'medium',
    requiresCatalogCheck: true,
    noteTr: 'Rexroth WE serisi sembol harfleri üreticiye göre değişebilir.',
  },
  {
    ...pickReliability({ verificationStatus: 'manual_unverified', sourceType: 'manual', sourceUrl: null, lastReviewedAt: null, notesTr: null }),
    id: 'yuken_3c2_closed_center',
    manufacturer: 'Yuken',
    seriesFamily: 'DSG',
    token: '3C2',
    canonicalFunctionId: 'closed_center_4_3',
    confidence: 'medium',
    requiresCatalogCheck: true,
    noteTr: 'Yuken DSG spool type kodları katalogdan doğrulanmalıdır.',
  },
  {
    ...pickReliability({ verificationStatus: 'manual_unverified', sourceType: 'manual', sourceUrl: null, lastReviewedAt: null, notesTr: null }),
    id: 'vickers_2a_closed_center',
    manufacturer: 'Vickers',
    seriesFamily: 'DG4V',
    token: '2A',
    canonicalFunctionId: 'closed_center_4_3',
    confidence: 'low',
    requiresCatalogCheck: true,
    noteTr: 'Vickers sembol kodları model yapısına göre değişebilir.',
  },
  {
    ...pickReliability({ verificationStatus: 'manual_unverified', sourceType: 'manual', sourceUrl: null, lastReviewedAt: null, notesTr: null }),
    id: 'atos_0711_closed_center',
    manufacturer: 'Atos',
    seriesFamily: 'DHI',
    token: '0711',
    canonicalFunctionId: 'closed_center_4_3',
    confidence: 'low',
    requiresCatalogCheck: true,
    noteTr: 'Atos konfigurasyon kodları katalogdan doğrulanmalıdır.',
  },
  {
    ...pickReliability({ verificationStatus: 'manual_unverified', sourceType: 'manual', sourceUrl: null, lastReviewedAt: null, notesTr: null }),
    id: 'yuken_3c12_tandem',
    manufacturer: 'Yuken',
    seriesFamily: 'DSG',
    token: '3C12',
    canonicalFunctionId: 'tandem_center_4_3',
    confidence: 'medium',
    requiresCatalogCheck: true,
    noteTr: 'Yuken DSG spool type kodları katalogdan doğrulanmalıdır.',
  },
];

const checkRules = [
  { id: 'pneumatic_bore', fieldTr: 'Çap', reasonTr: 'Çap değeri kodda net okunamadı veya doğrulanmalıdır.', severity: 'high', resolverCategories: ['pneumatic_cylinder'] },
  { id: 'pneumatic_stroke', fieldTr: 'Strok', reasonTr: 'Strok değeri kodda net okunamadı veya doğrulanmalıdır.', severity: 'high', resolverCategories: ['pneumatic_cylinder'] },
  { id: 'pneumatic_cushioning', fieldTr: 'Sönümleme', reasonTr: 'Sönümleme seçeneği üreticiye göre değişebilir.', severity: 'medium', resolverCategories: ['pneumatic_cylinder'] },
  { id: 'pneumatic_port_thread', fieldTr: 'Port / diş', reasonTr: 'Port ve diş tipi katalogdan doğrulanmalıdır.', severity: 'medium', resolverCategories: ['pneumatic_cylinder'] },
  { id: 'pneumatic_mounting', fieldTr: 'Montaj', reasonTr: 'Montaj arayüzü seri ve üreticiye göre değişebilir.', severity: 'medium', resolverCategories: ['pneumatic_cylinder'] },
  { id: 'pneumatic_sensor', fieldTr: 'Sensör uyumu', reasonTr: 'Sensör yuvası ve kablo seçenekleri kontrol edilmelidir.', severity: 'medium', resolverCategories: ['pneumatic_cylinder'] },
  { id: 'pneumatic_rod_end', fieldTr: 'Mil ucu', reasonTr: 'Mil ucu ve bağlantı detayları doğrulanmalıdır.', severity: 'medium', resolverCategories: ['pneumatic_cylinder'] },
  { id: 'pneumatic_manufacturer_series', fieldTr: 'Üretici / seri farkı', reasonTr: 'Farklı üretici serileri birebir aynı olmayabilir.', severity: 'medium', resolverCategories: ['pneumatic_cylinder'] },
  { id: 'hydraulic_spool_function', fieldTr: 'Sürgü / fonksiyon', reasonTr: 'Sürgü tipi ve sembolü katalogdan doğrulanmalıdır.', severity: 'high', resolverCategories: ['hydraulic_valve'] },
  { id: 'hydraulic_coil_voltage', fieldTr: 'Bobin voltajı', reasonTr: 'Bobin voltajı ve bağlantı tipi sipariş öncesi kontrol edilmelidir.', severity: 'high', resolverCategories: ['hydraulic_valve'] },
  { id: 'hydraulic_connector', fieldTr: 'Konnektör', reasonTr: 'Konnektör ve bobin bağlantısı seri ve üreticiye göre değişebilir.', severity: 'medium', resolverCategories: ['hydraulic_valve'] },
  { id: 'hydraulic_pressure_rating', fieldTr: 'Basınç değeri', reasonTr: 'Maksimum çalışma basıncı uygulama koşullarına göre doğrulanmalıdır.', severity: 'high', resolverCategories: ['hydraulic_valve'] },
  { id: 'hydraulic_flow_rating', fieldTr: 'Debi değeri', reasonTr: 'Nominal debi çalışma basıncına göre değişir; katalog değeri kontrol edilmelidir.', severity: 'medium', resolverCategories: ['hydraulic_valve'] },
  { id: 'hydraulic_seal_material', fieldTr: 'Conta malzemesi', reasonTr: 'Conta malzemesi ve sıvı uyumu katalogdan doğrulanmalıdır.', severity: 'medium', resolverCategories: ['hydraulic_valve'] },
  { id: 'hydraulic_manual_override', fieldTr: 'Manuel kumanda', reasonTr: 'Manuel kumanda veya mekanik kilit seçeneği kodda farklı ifade edilebilir.', severity: 'medium', resolverCategories: ['hydraulic_valve'] },
  ...DEMO_EXTRA_CHECK_RULES,
].map((r) => ({
  ...pickReliability({ verificationStatus: 'manual_unverified', sourceType: 'manual', sourceUrl: null, lastReviewedAt: null, notesTr: null }),
  ...r,
}));

fs.mkdirSync(catalogDir, { recursive: true });
fs.writeFileSync(path.join(catalogDir, 'productSeries.v2.json'), JSON.stringify(catalogSeries, null, 2));
fs.writeFileSync(path.join(catalogDir, 'equivalenceGroups.v2.json'), JSON.stringify(equivalenceGroups, null, 2));
fs.writeFileSync(path.join(catalogDir, 'hydraulicFunctionMappings.v2.json'), JSON.stringify(functionMappings, null, 2));
fs.writeFileSync(path.join(catalogDir, 'checkRules.v2.json'), JSON.stringify(checkRules, null, 2));
console.log('Wrote catalog v2:', catalogSeries.length, 'series');
