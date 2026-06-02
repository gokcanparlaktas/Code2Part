import { readFileSync } from 'fs';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  LocalCatalogDataProvider,
  type CatalogDataProvider,
} from '@/domain/catalogData/CatalogDataProvider';
import type {
  RexrothConnectorVoltageCatalog,
  RexrothMountingCatalog,
  RexrothSpoolCatalog,
  RexrothTechnicalDataCatalog,
  YukenDsgConnectorVoltageCatalog,
  YukenDsgTechnicalDataCatalog,
  YukenDshgConnectorVoltageCatalog,
  YukenDshgParserSpecCatalog,
  YukenMountingCatalog,
  YukenSpoolCatalog,
  EatonDg4vConnectorVoltageCatalog,
  EatonDg4vTechnicalDataCatalog,
  EatonMountingCatalog,
  EatonSpoolCatalog,
} from '@/domain/catalogData/loadCatalogData';

import { activePointerFirestorePath } from '../../../scripts/catalog-data-firestore/buildImportPlan';
import {
  buildRuntimeReadbackTargets,
  extractCatalogPayloadFromFirestoreDoc,
  validatePayloadChecksum,
} from '../../../scripts/catalog-data-firestore/verifyFirestoreCatalogReadback';

import { logResolverCatalogProvider } from '@/backend/http/logResolverInternalError';

export interface FirestoreCatalogProviderConfig {
  projectId?: string;
  serviceAccountPath?: string;
  catalogVersion?: string;
}

async function ensureFirebaseApp(config: FirestoreCatalogProviderConfig): Promise<void> {
  if (getApps().length > 0) {
    return;
  }

  if (config.serviceAccountPath) {
    const serviceAccount = JSON.parse(
      readFileSync(config.serviceAccountPath, 'utf8')
    ) as { project_id?: string };

    initializeApp({
      credential: cert(serviceAccount),
      projectId: config.projectId ?? serviceAccount.project_id,
    });
    return;
  }

  const projectId =
    config.projectId ?? process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID;

  initializeApp(projectId ? { projectId } : undefined);
}

export async function ensureBackendFirebaseInitialized(
  config: FirestoreCatalogProviderConfig = {}
): Promise<void> {
  await ensureFirebaseApp(config);
}

async function createFirestoreDb(config: FirestoreCatalogProviderConfig) {
  await ensureFirebaseApp(config);
  return getFirestore();
}

const RUNTIME_PAYLOAD_KEYS: Record<string, PayloadCacheKey> = {
  'rexroth/directional-controls/shared/spool-symbol-candidates.json': 'rexrothSpool',
  'rexroth/directional-controls/shared/mounting-surface-candidates.json': 'rexrothMounting',
  'rexroth/directional-controls/we/connector-voltage-candidates.json': 'rexrothConnectorVoltage',
  'rexroth/directional-controls/we/technical-data-candidates.json': 'rexrothTechnicalData',
  'yuken/directional-controls/shared/spool-symbol-candidates.json': 'yukenSpool',
  'yuken/directional-controls/shared/mounting-surface-candidates.json': 'yukenMounting',
  'yuken/directional-controls/dsg/connector-voltage-candidates.json': 'yukenDsgConnectorVoltage',
  'yuken/directional-controls/dsg/technical-data-candidates.json': 'yukenDsgTechnicalData',
  'yuken/directional-controls/dshg/parser-spec-candidate.json': 'yukenDshgParserSpec',
  'yuken/directional-controls/dshg/connector-voltage-candidates.json': 'yukenDshgConnectorVoltage',
};

type PayloadCacheKey =
  | 'rexrothSpool'
  | 'rexrothMounting'
  | 'rexrothConnectorVoltage'
  | 'rexrothTechnicalData'
  | 'yukenSpool'
  | 'yukenMounting'
  | 'yukenDsgConnectorVoltage'
  | 'yukenDsgTechnicalData'
  | 'yukenDshgParserSpec'
  | 'yukenDshgConnectorVoltage';

export class FirestoreCatalogProvider implements CatalogDataProvider {
  catalogVersion?: string;

  private readonly cache = new Map<PayloadCacheKey, unknown>();
  private readonly localEatonFallback = new LocalCatalogDataProvider();
  private initialized = false;

  constructor(private readonly config: FirestoreCatalogProviderConfig) {}

  isInitialized(): boolean {
    return this.initialized;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const db = await createFirestoreDb(this.config);
    let catalogVersion = this.config.catalogVersion;

    if (!catalogVersion) {
      const activeSnapshot = await db.doc(activePointerFirestorePath()).get();
      if (!activeSnapshot.exists) {
        throw new Error(`Active catalog pointer not found at ${activePointerFirestorePath()}`);
      }
      const activeData = activeSnapshot.data() as Record<string, unknown> | undefined;
      const version = activeData?.catalogVersion;
      if (typeof version !== 'string' || !version.trim()) {
        throw new Error('Active catalog pointer is missing catalogVersion');
      }
      catalogVersion = version;
    }

    this.catalogVersion = catalogVersion;
    const targets = buildRuntimeReadbackTargets(catalogVersion);

    logResolverCatalogProvider('Loading runtime catalog documents', {
      catalogVersion,
      runtimeDocCount: targets.length,
    });

    let readCount = 0;

    for (const target of targets) {
      const snapshot = await db.doc(target.firestorePath).get();
      if (!snapshot.exists) {
        logResolverCatalogProvider('Missing runtime catalog document', {
          catalogVersion,
          relativePath: target.relativePath,
          encodedDocumentId: target.encodedDocumentId,
          firestorePath: target.firestorePath,
        });
        throw new Error(`Missing Firestore catalog document: ${target.relativePath}`);
      }

      const data = snapshot.data() as Record<string, unknown>;
      const extracted = extractCatalogPayloadFromFirestoreDoc(data);
      if (!validatePayloadChecksum(extracted.payload, extracted.checksumSha256)) {
        logResolverCatalogProvider('Checksum mismatch for runtime catalog document', {
          catalogVersion,
          relativePath: target.relativePath,
          encodedDocumentId: target.encodedDocumentId,
        });
        throw new Error(`Checksum mismatch for ${target.relativePath}`);
      }

      const cacheKey = RUNTIME_PAYLOAD_KEYS[target.relativePath];
      if (!cacheKey) {
        throw new Error(`Unhandled runtime catalog path: ${target.relativePath}`);
      }
      this.cache.set(cacheKey, extracted.payload);
      readCount += 1;
    }

    logResolverCatalogProvider('Runtime catalog documents loaded', {
      catalogVersion,
      runtimeDocCount: targets.length,
      readCount,
    });

    this.initialized = true;
  }

  private getCached<T>(key: PayloadCacheKey): T {
    if (!this.initialized) {
      throw new Error('FirestoreCatalogProvider.initialize() must be called before reads');
    }
    const value = this.cache.get(key);
    if (value === undefined) {
      throw new Error(`Catalog payload not loaded: ${key}`);
    }
    return value as T;
  }

  getRexrothSpoolCatalog(): RexrothSpoolCatalog {
    return this.getCached('rexrothSpool');
  }

  getYukenSpoolCatalog(): YukenSpoolCatalog {
    return this.getCached('yukenSpool');
  }

  getRexrothMountingCatalog(): RexrothMountingCatalog {
    return this.getCached('rexrothMounting');
  }

  getYukenMountingCatalog(): YukenMountingCatalog {
    return this.getCached('yukenMounting');
  }

  getRexrothConnectorVoltageCatalog(): RexrothConnectorVoltageCatalog {
    return this.getCached('rexrothConnectorVoltage');
  }

  getYukenDsgConnectorVoltageCatalog(): YukenDsgConnectorVoltageCatalog {
    return this.getCached('yukenDsgConnectorVoltage');
  }

  getYukenDshgConnectorVoltageCatalog(): YukenDshgConnectorVoltageCatalog {
    return this.getCached('yukenDshgConnectorVoltage');
  }

  getYukenDshgParserSpecCatalog(): YukenDshgParserSpecCatalog {
    return this.getCached('yukenDshgParserSpec');
  }

  getRexrothTechnicalDataCatalog(): RexrothTechnicalDataCatalog {
    return this.getCached('rexrothTechnicalData');
  }

  getYukenDsgTechnicalDataCatalog(): YukenDsgTechnicalDataCatalog {
    return this.getCached('yukenDsgTechnicalData');
  }

  /** Eaton catalog-data is local JSON until Firestore import includes eaton/ paths. */
  getEatonSpoolCatalog(): EatonSpoolCatalog {
    return this.localEatonFallback.getEatonSpoolCatalog();
  }

  getEatonMountingCatalog(): EatonMountingCatalog {
    return this.localEatonFallback.getEatonMountingCatalog();
  }

  getEatonDg4vConnectorVoltageCatalog(): EatonDg4vConnectorVoltageCatalog {
    return this.localEatonFallback.getEatonDg4vConnectorVoltageCatalog();
  }

  getEatonDg4vTechnicalDataCatalog(): EatonDg4vTechnicalDataCatalog {
    return this.localEatonFallback.getEatonDg4vTechnicalDataCatalog();
  }

  /** Bearings catalog-data is local JSON until a dedicated Firestore release is published. */
  getRollingBearingFamilyIndexCatalog() {
    return this.localEatonFallback.getRollingBearingFamilyIndexCatalog();
  }

  getRollingBearingManufacturerIndexCatalog() {
    return this.localEatonFallback.getRollingBearingManufacturerIndexCatalog();
  }

  getRollingBearingBrandDetectionCatalog() {
    return this.localEatonFallback.getRollingBearingBrandDetectionCatalog();
  }

  getRollingBearingBoreCodeCatalog() {
    return this.localEatonFallback.getRollingBearingBoreCodeCatalog();
  }

  getRollingBearingDimensionCatalog() {
    return this.localEatonFallback.getRollingBearingDimensionCatalog();
  }

  getRollingBearingSeriesCatalog() {
    return this.localEatonFallback.getRollingBearingSeriesCatalog();
  }

  getRollingBearingSuffixCatalog() {
    return this.localEatonFallback.getRollingBearingSuffixCatalog();
  }

  getRollingBearingParserSpecCatalog() {
    return this.localEatonFallback.getRollingBearingParserSpecCatalog();
  }

  getRollingBearingGenerationSpecCatalog() {
    return this.localEatonFallback.getRollingBearingGenerationSpecCatalog();
  }

  getRollingBearingMappingCatalog() {
    return this.localEatonFallback.getRollingBearingMappingCatalog();
  }

  getRollingBearingUnknownOrReviewCatalog() {
    return this.localEatonFallback.getRollingBearingUnknownOrReviewCatalog();
  }
}

/** Test helper: same payloads as local JSON, tagged as mock Firestore. */
export class MockFirestoreCatalogDataProvider extends LocalCatalogDataProvider {
  catalogVersion = 'mock.firestore';

  async initialize(): Promise<void> {
    return;
  }
}
