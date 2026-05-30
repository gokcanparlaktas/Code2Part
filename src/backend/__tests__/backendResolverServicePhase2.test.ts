import { existsSync } from 'node:fs';

import { FirestoreCatalogProvider, MockFirestoreCatalogDataProvider } from '@/backend/catalog/FirestoreCatalogProvider';
import {
  assertNoForbiddenBackendResponseKeys,
  findForbiddenBackendResponseKeys,
} from '@/backend/dto/backendResponseSecurity';
import { compareProductsService } from '@/backend/services/compareProductsService';
import { findEquivalentsService } from '@/backend/services/findEquivalentsService';
import { identifyProductService } from '@/backend/services/identifyProductService';
import { LocalCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';

const REXROTH_CODE = '4WE6E-6X/EG24N9K4';
const YUKEN_CODE = 'DSG-01-3C2-D24-N1-70';

describe('backend identifyProductService', () => {
  it('identifies Rexroth 4WE6E with display-ready fields', async () => {
    const result = await identifyProductService({
      code: REXROTH_CODE,
      catalogProvider: new LocalCatalogDataProvider(),
    });

    expect(result.normalizedCode).toBeTruthy();
    expect(result.manufacturer).toBe('Rexroth');
    expect(result.series).toBe('4WE6');
    expect(result.outcome).toBe('full');
    expect(result.confidence).toBe('high');
    expect(result.technicalAttributes.length).toBeGreaterThan(0);
    expect(result.productDetailRows.some((row) => row.label === 'Marka')).toBe(true);
    expect(findForbiddenBackendResponseKeys(result)).toEqual([]);
  });

  it('identifies Yuken DSG-01 with display-ready fields', async () => {
    const result = await identifyProductService({
      code: YUKEN_CODE,
      catalogProvider: new LocalCatalogDataProvider(),
    });

    expect(result.manufacturer).toBe('Yuken');
    expect(result.series).toBe('DSG-01');
    expect(result.outcome).toBe('full');
    expect(result.productDetailRows.length).toBeGreaterThan(0);
    expect(findForbiddenBackendResponseKeys(result)).toEqual([]);
  });

  it('mock Firestore provider matches local identify output', async () => {
    const local = await identifyProductService({
      code: REXROTH_CODE,
      catalogProvider: new LocalCatalogDataProvider(),
    });
    const mockFirestore = await identifyProductService({
      code: REXROTH_CODE,
      catalogProvider: new MockFirestoreCatalogDataProvider(),
    });

    expect(mockFirestore).toEqual(local);
  });
});

describe('backend findEquivalentsService', () => {
  it('returns DSG-01 candidate for Rexroth 4WE6E source', async () => {
    const result = await findEquivalentsService({
      code: REXROTH_CODE,
      catalogProvider: new LocalCatalogDataProvider(),
    });

    expect(result.source.code).toBe(REXROTH_CODE);
    expect(result.source.manufacturer).toBe('Rexroth');
    expect(result.candidates.length).toBeGreaterThan(0);

    const dsgCandidate = result.candidates.find(
      (candidate) =>
        candidate.series === 'DSG-01' ||
        candidate.code.startsWith('DSG-01') ||
        candidate.code === YUKEN_CODE
    );
    expect(dsgCandidate).toBeDefined();
    expect(dsgCandidate?.matchPercentage).toBeGreaterThan(0);
    expect(dsgCandidate?.metadata.compatibilityLevel).toBeTruthy();
    expect(dsgCandidate?.compatibleHighlights.length).toBeGreaterThan(0);
  });

  it('serialized findEquivalents DTO contains none of the forbidden keys', async () => {
    const result = await findEquivalentsService({
      code: REXROTH_CODE,
      catalogProvider: new LocalCatalogDataProvider(),
    });

    expect(findForbiddenBackendResponseKeys(result)).toEqual([]);
    expect(() => assertNoForbiddenBackendResponseKeys(JSON.parse(JSON.stringify(result)))).not.toThrow();
  });

  it('mock Firestore provider matches local findEquivalents output', async () => {
    const local = await findEquivalentsService({
      code: REXROTH_CODE,
      catalogProvider: new LocalCatalogDataProvider(),
    });
    const mockFirestore = await findEquivalentsService({
      code: REXROTH_CODE,
      catalogProvider: new MockFirestoreCatalogDataProvider(),
    });

    expect(mockFirestore).toEqual(local);
  });
});

const liveFirestoreEnabled =
  process.env.CATALOG_BACKEND_LIVE_FIRESTORE === '1' &&
  Boolean(process.env.FIREBASE_PROJECT_ID?.trim()) &&
  Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()) &&
  existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? '');

(liveFirestoreEnabled ? describe : describe.skip)(
  'backend services live Firestore provider',
  () => {
    it('identify and findEquivalents match local provider when Firestore env is configured', async () => {
      const firestoreProvider = new FirestoreCatalogProvider({
        projectId: process.env.FIREBASE_PROJECT_ID!.trim(),
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH!.trim(),
      });

      const localIdentify = await identifyProductService({
        code: REXROTH_CODE,
        catalogProvider: new LocalCatalogDataProvider(),
      });
      const firestoreIdentify = await identifyProductService({
        code: REXROTH_CODE,
        catalogProvider: firestoreProvider,
      });
      expect(firestoreIdentify).toEqual(localIdentify);

      const localEquivalents = await findEquivalentsService({
        code: REXROTH_CODE,
        catalogProvider: new LocalCatalogDataProvider(),
      });
      const firestoreEquivalents = await findEquivalentsService({
        code: REXROTH_CODE,
        catalogProvider: firestoreProvider,
      });
      expect(firestoreEquivalents).toEqual(localEquivalents);

      const localCompare = await compareProductsService({
        sourceCode: REXROTH_CODE,
        candidateCode: YUKEN_CODE,
        catalogProvider: new LocalCatalogDataProvider(),
      });
      const firestoreCompare = await compareProductsService({
        sourceCode: REXROTH_CODE,
        candidateCode: YUKEN_CODE,
        catalogProvider: firestoreProvider,
      });
      expect(firestoreCompare).toEqual(localCompare);
    });
  }
);
