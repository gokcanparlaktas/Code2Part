/**
 * Demo-focused catalog v1 enrichment (local only).
 * Merged into productSeries.v2.json by build-catalog-v2.mjs.
 */

const DEMO_RELIABILITY_NOTE =
  'Demo v1 genişletmesi: örnek kodlar ve arama takma adları test amaçlıdır; sipariş öncesi üretici kataloğu ile doğrulanmalıdır.';

export const DEMO_EXTRA_CHECK_RULES = [
  {
    id: 'pneumatic_seal_material',
    fieldTr: 'Conta / sızdırmazlık',
    reasonTr: 'Conta malzemesi ve sızdırmazlık detayları seri ve uygulamaya göre değişir; katalogdan doğrulanmalıdır.',
    severity: 'medium',
    resolverCategories: ['pneumatic_cylinder'],
  },
  {
    id: 'hydraulic_mounting_cetop',
    fieldTr: 'Montaj / CETOP NG',
    reasonTr: 'CETOP/NG montaj ölçüsü ve bağlantı yüzeyi katalogdan doğrulanmalıdır.',
    severity: 'medium',
    resolverCategories: ['hydraulic_valve'],
  },
];

export const DEMO_PNEUMATIC_EXTRA_CHECK_REFS = [
  { ruleId: 'pneumatic_seal_material' },
];

export const DEMO_HYDRAULIC_EXTRA_CHECK_REFS = [
  { ruleId: 'hydraulic_mounting_cetop' },
];

/** @type {Record<string, { exampleCodes?: string[], searchAliases?: string[], knownTokens?: object[], parsingRules?: object[], notesTr?: string }>} */
export const DEMO_SERIES_ENRICHMENT = {
  rexroth_4we6: {
    exampleCodes: [
      '4WE6E-6X/EG24N9K4',
      '4WE6J-6X/EG24N9K4',
      '4WE6G-6X/EG24N9K4',
      '4WE6H-6X/EG24N9K4',
    ],
    searchAliases: [
      '4WE6',
      '4WE 6',
      '4WE6E',
      'rexroth ng6',
      'rexroth cetop 3',
      'rexroth cetop03',
      'ng6 valve',
    ],
  },
  rexroth_4we10: {
    exampleCodes: ['4WE10E-3X/CG24N9K4', '4WE10J-3X/CG24N9K4', '4WE10G-3X/CG24N9K4'],
    searchAliases: [
      '4WE10',
      '4WE 10',
      'rexroth ng10',
      'rexroth cetop 5',
      'cetop05 valve',
      'ng10 valve',
    ],
  },
  yuken_dsg01: {
    exampleCodes: [
      'DSG-01-3C2-D24-N1-50',
      'DSG-01-3C2-D24-N1-22',
      'DSG-01-3C2-D24-N1-70',
    ],
    searchAliases: [
      'DSG-01',
      'DSG01',
      'dsg01',
      'dsg 01',
      'yuken ng6',
      'yuken cetop 3',
      'yuken directional valve',
    ],
  },
  yuken_dsg03: {
    exampleCodes: [
      'DSG-03-3C2-D24-N1-50',
      'DSG-03-3C12-D24-N1-50',
      'DSG-03-3C2-D24-N1-22',
    ],
    searchAliases: [
      'DSG-03',
      'DSG03',
      'dsg03',
      'yuken ng10',
      'yuken cetop 5',
    ],
  },
  vickers_dg4v3: {
    exampleCodes: [
      'DG4V-3-2A-M-U-H7-60',
      'DG4V-3-2A-M-U-D24-60',
      'DG4V-3-6B-M-U-D24-60',
    ],
    searchAliases: [
      'DG4V-3',
      'DG4V3',
      'dg4v3',
      'dg4v 3',
      'vickers ng6',
      'vickers cetop 3',
      'eaton dg4v',
    ],
  },
  vickers_dg4v5: {
    exampleCodes: [
      'DG4V-5-2A-M-U-H7-60',
      'DG4V-5-2A-M-U-D24-60',
      'DG4V-5-6B-M-U-H7-60',
    ],
    searchAliases: [
      'DG4V-5',
      'DG4V5',
      'dg4v5',
      'vickers ng10',
      'vickers cetop 5',
    ],
  },
  atos_dhi: {
    exampleCodes: ['DHI-0711-X 24DC', 'DHI-0713-X 24DC', 'DHI-0711/EG24'],
    searchAliases: ['DHI', 'dhi', 'atos ng6', 'atos cetop 3', 'atos directional'],
  },
  atos_dhu: {
    exampleCodes: ['DHU-0711-X 24DC', 'DHU-0714-X 24DC'],
    searchAliases: ['DHU', 'dhu', 'atos ng10', 'atos cetop 5'],
  },
  parker_d1vw: {
    exampleCodes: ['D1VW001CNJW', 'D1VW020BNJW', 'D1VW001BNJW'],
    searchAliases: [
      'D1VW',
      'd1vw',
      'parker ng6',
      'parker cetop 3',
      'parker directional valve',
    ],
  },
  parker_d3w: {
    exampleCodes: ['D3W001CNJW', 'D3W020BNJW'],
    searchAliases: ['D3W', 'd3w', 'parker ng10', 'parker cetop 5'],
  },
  festo_dsbc: {
    exampleCodes: [
      'DSBC-50-100-PPVA-N3',
      'DSBC-32-25-PPSA-N3',
      'DSBC-63-200-PPVA',
      'DSBC-40-160',
      'DSBC-80-320',
    ],
    searchAliases: [
      'dsbc',
      'festo dsbc',
      'festo iso 15552',
      'iso 15552 cylinder',
      'festo pneumatic cylinder',
    ],
  },
  festo_adn: {
    exampleCodes: ['ADN-32-50', 'ADN-40-100', 'ADN-25-40', 'ADN-50-80'],
    searchAliases: ['adn', 'festo adn', 'festo compact cylinder', 'iso 21287 cylinder'],
  },
  festo_dsnu: {
    exampleCodes: ['DSNU-25-80-P-A', 'DSNU-16-50-P-A', 'DSNU-32-100-P-A'],
    searchAliases: [
      'dsnu',
      'festo dsnu',
      'festo round cylinder',
      'iso 6432 cylinder',
      'mini cylinder festo',
    ],
  },
  smc_cp96: {
    exampleCodes: [
      'CP96-50-100',
      'CP96SDB50-100',
      'CP96-63-200',
      'CP96SDB32-80',
      'CP96-40-160',
    ],
    searchAliases: [
      'cp96',
      'smc cp96',
      'smc iso cylinder',
      'smc iso 15552',
      'CP96SDB',
    ],
    knownTokens: [
      {
        token: 'SDB',
        meaningTr: 'Montaj / sensör yuvası varyantı (SDB)',
        confidence: 'low',
        requiresCatalogCheck: true,
        role: 'options',
      },
    ],
  },
  smc_c96: {
    exampleCodes: ['C96SDB50-100', 'C96-40-80', 'C96SDB63-200'],
    searchAliases: ['c96', 'smc c96', 'smc c96sdb', 'C96SDB'],
    parsingRules: [
      {
        id: 'smc_c96-dash',
        pattern: '^C96-(\\d+)-(\\d+)',
        boreGroup: 1,
        strokeGroup: 2,
      },
    ],
    knownTokens: [
      {
        token: 'SDB',
        meaningTr: 'Montaj / sensör yuvası varyantı (SDB)',
        confidence: 'low',
        requiresCatalogCheck: true,
        role: 'options',
      },
    ],
  },
  smc_cq2: {
    exampleCodes: ['CQ2B32-50D', 'CQ2B40-75D', 'CQ2B25-30D'],
    searchAliases: ['cq2', 'smc cq2', 'smc compact cylinder', 'cq2b', 'iso 21287 smc'],
  },
  smc_c85: {
    exampleCodes: ['C85N25-80', 'C85N20-50', 'C85N32-100'],
    searchAliases: ['c85', 'smc c85', 'smc round cylinder', 'c85n', 'iso 6432 smc'],
  },
  parker_p1d: {
    exampleCodes: ['P1D-S050MS-0100', 'P1D-S063MS-0200', 'P1D-50-100'],
    searchAliases: [
      'p1d',
      'parker p1d',
      'parker iso cylinder',
      'parker iso 15552',
      'P1D-S',
    ],
  },
  aventics_pra: {
    exampleCodes: ['PRA-50-100', 'PRA-63-150', 'PRA-40-80'],
    searchAliases: [
      'pra',
      'aventics pra',
      'aventics iso 15552',
      'emerson aventics cylinder',
    ],
  },
  airtac_si: {
    exampleCodes: ['SI50X100', 'SI-63-150', 'SI63X150', 'SI-40-80'],
    searchAliases: [
      'si',
      'airtac si',
      'airtac iso cylinder',
      'airtac iso 15552',
    ],
  },
};
