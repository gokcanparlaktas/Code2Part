import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FirestoreCatalogProvider } from '@/backend/catalog/FirestoreCatalogProvider';
import { MockFirestoreCatalogDataProvider } from '@/backend/catalog/FirestoreCatalogProvider';
import {
  assertNoForbiddenBackendResponseKeys,
  findForbiddenBackendResponseKeys,
} from '@/backend/dto/backendResponseSecurity';
import { mapCompareProductsResponse } from '@/backend/dto/mapCompareProductsResponse';
import { compareProductsService } from '@/backend/services/compareProductsService';
import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import { compareHydraulicValves } from '@/domain/categories/hydraulicValve/hydraulicValveComparison';
import {
  getDefaultCatalogDataProvider,
  LocalCatalogDataProvider,
} from '@/domain/catalogData/CatalogDataProvider';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';

const REXROTH_CODE = '4WE6E-6X/EG24N9K4';
const YUKEN_CODE = 'DSG-01-3C2-D24-N1-70';

function buildGoldenCandidate() {
  const targetSeries = getProductSeriesById('yuken_dsg01')!;
  return {
    seriesId: targetSeries.id,
    brand: targetSeries.brand,
    series: targetSeries.series,
    productType: targetSeries.productType,
    productCategory: targetSeries.productCategory,
    standardFamily: targetSeries.standardFamily,
    suggestedCode: YUKEN_CODE,
    targetIdentification: identifyProduct(YUKEN_CODE, normalizeCode(YUKEN_CODE)),
  };
}

function compareGoldenPairWithProvider(provider = getDefaultCatalogDataProvider()) {
  const source = identifyProduct(REXROTH_CODE, normalizeCode(REXROTH_CODE));
  return compareHydraulicValves(source, buildGoldenCandidate(), { catalogProvider: provider });
}

describe('backend compareProductsService PoC', () => {
  it('local provider golden pair matches existing hydraulic metadata expectations', async () => {
    const dto = await compareProductsService({
      sourceCode: REXROTH_CODE,
      candidateCode: YUKEN_CODE,
      catalogProvider: new LocalCatalogDataProvider(),
    });

    expect(dto.metadata).toEqual({
      compatibilityLevel: 'high',
      confidenceLevel: 'high',
      dataCompleteness: 'high',
    });
    expect(dto.summary.riskLevel).toBe('low');
    expect(dto.different).toHaveLength(0);
    expect(dto.compatible.some((row) => row.label === FIELD_LABELS.mountingStandard)).toBe(true);
    expect(dto.compatible.some((row) => row.label === FIELD_LABELS.coilVoltage)).toBe(true);
    expect(dto.compatible.some((row) => row.label === FIELD_LABELS.spoolFunctionCode)).toBe(true);
    expect(dto.compatible.some((row) => row.label === FIELD_LABELS.manualOverride)).toBe(true);
    expect(dto.summary.matchPercentage).toBeGreaterThan(0);
  });

  it('mock Firestore provider returns the same comparison DTO as local provider', async () => {
    const localDto = await compareProductsService({
      sourceCode: REXROTH_CODE,
      candidateCode: YUKEN_CODE,
      catalogProvider: new LocalCatalogDataProvider(),
    });
    const mockFirestoreDto = await compareProductsService({
      sourceCode: REXROTH_CODE,
      candidateCode: YUKEN_CODE,
      catalogProvider: new MockFirestoreCatalogDataProvider(),
    });

    expect(mockFirestoreDto).toEqual(localDto);
  });

  it('marks different bore and stroke for mismatched pneumatic cylinder sizes', async () => {
    const dto = await compareProductsService({
      sourceCode: 'DSBC-63-200-PPVA',
      candidateCode: 'C96-40-80',
      catalogProvider: new LocalCatalogDataProvider(),
    });

    expect(dto.different.some((row) => row.label === 'Çap (bore)')).toBe(true);
    expect(dto.different.some((row) => row.label === 'Strok')).toBe(true);
    expect(dto.unknownOrCheck.some((item) => item.field === 'Çap (bore)')).toBe(false);
    expect(dto.unknownOrCheck.some((item) => item.field === 'Strok')).toBe(false);
  });

  it('same Rexroth E spool code appears in uyumlu via compareProductsService', async () => {
    const dto = await compareProductsService({
      sourceCode: '4WE6E-6X/EG24N9K4',
      candidateCode: '4WE6E-6X/EG24K4',
      catalogProvider: new LocalCatalogDataProvider(),
    });

    expect(dto.compatible.some((row) => row.label === FIELD_LABELS.spoolFunctionCode)).toBe(
      true
    );
    expect(dto.unknownOrCheck.filter((item) => item.field === FIELD_LABELS.spoolFunctionCode)).toHaveLength(
      0
    );
  });

  it('serialized compareProducts DTO contains none of the forbidden keys', async () => {
    const dto = await compareProductsService({
      sourceCode: REXROTH_CODE,
      candidateCode: YUKEN_CODE,
    });

    expect(findForbiddenBackendResponseKeys(dto)).toEqual([]);
    expect(() => assertNoForbiddenBackendResponseKeys(JSON.parse(JSON.stringify(dto)))).not.toThrow();
  });

  it('DTO mapper strips internal compatibility candidate payload fields', () => {
    const rawResult = compareGoldenPairWithProvider();
    const dto = mapCompareProductsResponse({
      sourceCode: REXROTH_CODE,
      candidateCode: YUKEN_CODE,
      result: rawResult,
    });

    const serialized = JSON.stringify(dto);
    expect(serialized).not.toContain('catalogEvidence');
    expect(serialized).not.toContain('spoolSymbolMeanings');
    expect(serialized).not.toContain('payload');
    expect(findForbiddenBackendResponseKeys(dto)).toEqual([]);
  });

  it('does not wire backend Firestore provider into app runtime loaders', () => {
    const loadCatalogDataSource = readFileSync(
      join(process.cwd(), 'src/domain/catalogData/loadCatalogData.ts'),
      'utf8'
    );

    expect(loadCatalogDataSource).toContain('@catalog-data/');
    expect(loadCatalogDataSource).not.toContain('firebase-admin');
    expect(loadCatalogDataSource).not.toContain('FirestoreCatalogProvider');
  });
});

const liveFirestoreEnabled =
  process.env.CATALOG_BACKEND_LIVE_FIRESTORE === '1' &&
  Boolean(process.env.FIREBASE_PROJECT_ID?.trim()) &&
  Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()) &&
  existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? '');

(liveFirestoreEnabled ? describe : describe.skip)(
  'backend compareProductsService live Firestore provider',
  () => {
    it('matches local provider for golden pair when Firestore env is configured', async () => {
      const localDto = await compareProductsService({
        sourceCode: REXROTH_CODE,
        candidateCode: YUKEN_CODE,
        catalogProvider: new LocalCatalogDataProvider(),
      });

      const firestoreProvider = new FirestoreCatalogProvider({
        projectId: process.env.FIREBASE_PROJECT_ID!.trim(),
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH!.trim(),
      });
      const firestoreDto = await compareProductsService({
        sourceCode: REXROTH_CODE,
        candidateCode: YUKEN_CODE,
        catalogProvider: firestoreProvider,
      });

      expect(firestoreProvider.catalogVersion).toBeTruthy();
      expect(firestoreDto).toEqual(localDto);
    });
  }
);
