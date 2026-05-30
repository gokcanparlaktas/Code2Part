import { readFileSync } from 'fs';
import { join } from 'path';

import {
  activePointerFirestorePath,
  catalogDocumentFirestorePath,
} from './buildImportPlan';
import {
  documentKeyFromRelativePath,
  encodeCatalogDocumentId,
} from './encodeCatalogDocumentId';
import { RUNTIME_USED_RELATIVE_PATHS } from './mvpDocuments';
import { payloadByteSize, sha256Checksum } from './stableChecksum';
import type { FirestoreWriteConfig } from './writeFirestore';

export interface RuntimeReadbackTarget {
  relativePath: string;
  documentKey: string;
  encodedDocumentId: string;
  firestorePath: string;
}

export interface CatalogDocumentReadbackResult {
  relativePath: string;
  firestorePath: string;
  encodedDocumentId: string;
  found: boolean;
  payload: unknown | null;
  payloadByteSize: number;
  storedChecksumSha256: string | null;
  payloadChecksumValid: boolean;
  matchesLocalSource: boolean | null;
  error?: string;
}

export interface CatalogReadbackReport {
  success: boolean;
  activeCatalogVersion: string | null;
  documentsRequested: number;
  documentsRead: number;
  missingDocuments: string[];
  checksumResults: CatalogDocumentReadbackResult[];
  largestPayload: {
    relativePath: string;
    payloadByteSize: number;
  } | null;
  errors: string[];
}

export interface VerifyFirestoreCatalogReadbackOptions {
  config: FirestoreWriteConfig;
  sourceRoot?: string;
  catalogVersion?: string;
  readDocument?: (
    firestorePath: string
  ) => Promise<Record<string, unknown> | null>;
  readActiveCatalogVersion?: () => Promise<string | null>;
}

export function buildRuntimeReadbackTargets(
  catalogVersion: string
): RuntimeReadbackTarget[] {
  return [...RUNTIME_USED_RELATIVE_PATHS]
    .sort()
    .map((relativePath) => {
      const documentKey = documentKeyFromRelativePath(relativePath);
      const encodedDocumentId = encodeCatalogDocumentId(documentKey);
      return {
        relativePath,
        documentKey,
        encodedDocumentId,
        firestorePath: catalogDocumentFirestorePath(catalogVersion, encodedDocumentId),
      };
    });
}

export function extractCatalogPayloadFromFirestoreDoc(
  data: Record<string, unknown>
): {
  payload: unknown;
  checksumSha256: string;
  relativePath: string;
  encodedDocumentId: string;
} {
  const payload = data.payload;
  if (payload === undefined) {
    throw new Error('Firestore catalog document missing payload field');
  }

  const checksumSha256 = data.checksumSha256;
  if (typeof checksumSha256 !== 'string' || !checksumSha256.trim()) {
    throw new Error('Firestore catalog document missing checksumSha256 field');
  }

  const relativePath = data.relativePath;
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    throw new Error('Firestore catalog document missing relativePath field');
  }

  const encodedDocumentId = data.encodedDocumentId;
  if (typeof encodedDocumentId !== 'string' || !encodedDocumentId.trim()) {
    throw new Error('Firestore catalog document missing encodedDocumentId field');
  }

  return {
    payload,
    checksumSha256,
    relativePath,
    encodedDocumentId,
  };
}

export function validatePayloadChecksum(
  payload: unknown,
  expectedChecksumSha256: string
): boolean {
  return sha256Checksum(payload) === expectedChecksumSha256;
}

export function readLocalCatalogPayload(
  sourceRoot: string,
  relativePath: string
): unknown {
  const absolutePath = join(sourceRoot, relativePath);
  return JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
}

export function evaluateCatalogDocumentReadback(options: {
  target: RuntimeReadbackTarget;
  firestoreData: Record<string, unknown> | null;
  sourceRoot?: string;
}): CatalogDocumentReadbackResult {
  const base: CatalogDocumentReadbackResult = {
    relativePath: options.target.relativePath,
    firestorePath: options.target.firestorePath,
    encodedDocumentId: options.target.encodedDocumentId,
    found: false,
    payload: null,
    payloadByteSize: 0,
    storedChecksumSha256: null,
    payloadChecksumValid: false,
    matchesLocalSource: null,
  };

  if (!options.firestoreData) {
    return base;
  }

  try {
    const extracted = extractCatalogPayloadFromFirestoreDoc(options.firestoreData);
    const byteSize = payloadByteSize(extracted.payload);
    const payloadChecksumValid = validatePayloadChecksum(
      extracted.payload,
      extracted.checksumSha256
    );

    let matchesLocalSource: boolean | null = null;
    if (options.sourceRoot) {
      const localPayload = readLocalCatalogPayload(
        options.sourceRoot,
        options.target.relativePath
      );
      matchesLocalSource =
        sha256Checksum(localPayload) === extracted.checksumSha256 &&
        sha256Checksum(extracted.payload) === sha256Checksum(localPayload);
    }

    return {
      ...base,
      found: true,
      payload: extracted.payload,
      payloadByteSize: byteSize,
      storedChecksumSha256: extracted.checksumSha256,
      payloadChecksumValid,
      matchesLocalSource,
    };
  } catch (error) {
    return {
      ...base,
      found: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function buildCatalogReadbackReport(options: {
  activeCatalogVersion: string | null;
  results: CatalogDocumentReadbackResult[];
  errors?: string[];
}): CatalogReadbackReport {
  const missingDocuments = options.results
    .filter((result) => !result.found)
    .map((result) => result.relativePath);

  const checksumFailures = options.results.filter(
    (result) =>
      result.found &&
      !result.error &&
      (!result.payloadChecksumValid || result.matchesLocalSource === false)
  );

  const invalidDocuments = options.results.filter((result) => result.error);

  const largestPayload = options.results.reduce<CatalogReadbackReport['largestPayload']>(
    (best, result) => {
      if (!result.found || result.payloadByteSize <= 0) {
        return best;
      }
      if (!best || result.payloadByteSize > best.payloadByteSize) {
        return {
          relativePath: result.relativePath,
          payloadByteSize: result.payloadByteSize,
        };
      }
      return best;
    },
    null
  );

  const errors = [...(options.errors ?? [])];
  for (const relativePath of missingDocuments) {
    errors.push(`Missing Firestore document for ${relativePath}`);
  }
  for (const result of invalidDocuments) {
    errors.push(`${result.relativePath}: ${result.error}`);
  }
  for (const result of checksumFailures) {
    if (!result.payloadChecksumValid) {
      errors.push(`${result.relativePath}: payload checksum mismatch`);
    }
    if (result.matchesLocalSource === false) {
      errors.push(`${result.relativePath}: payload differs from local source`);
    }
  }

  const documentsRead = options.results.filter((result) => result.found).length;

  return {
    success:
      Boolean(options.activeCatalogVersion) &&
      missingDocuments.length === 0 &&
      invalidDocuments.length === 0 &&
      checksumFailures.length === 0,
    activeCatalogVersion: options.activeCatalogVersion,
    documentsRequested: options.results.length,
    documentsRead,
    missingDocuments,
    checksumResults: options.results,
    largestPayload,
    errors,
  };
}

export function formatVerifyReport(report: CatalogReadbackReport): string {
  const lines: string[] = [
    'Catalog-data Firestore readback verification',
    '===========================================',
    `activeCatalogVersion: ${report.activeCatalogVersion ?? '(not found)'}`,
    `documentsRequested: ${report.documentsRequested}`,
    `documentsRead: ${report.documentsRead}`,
    `missingDocuments: ${report.missingDocuments.length}`,
    `result: ${report.success ? 'SUCCESS' : 'FAILURE'}`,
  ];

  if (report.missingDocuments.length > 0) {
    lines.push('');
    lines.push('missing:');
    for (const relativePath of report.missingDocuments) {
      lines.push(`  - ${relativePath}`);
    }
  }

  lines.push('');
  lines.push('checksum validation:');
  for (const result of report.checksumResults) {
    if (!result.found) {
      lines.push(`  ${result.relativePath} missing`);
      continue;
    }
    if (result.error) {
      lines.push(`  ${result.relativePath} error=${result.error}`);
      continue;
    }

    const localMatch =
      result.matchesLocalSource === null
        ? 'local=n/a'
        : result.matchesLocalSource
          ? 'local=match'
          : 'local=mismatch';

    lines.push(
      `  ${result.relativePath} checksum=${result.payloadChecksumValid ? 'ok' : 'fail'} ${localMatch} bytes=${result.payloadByteSize}`
    );
  }

  if (report.largestPayload) {
    lines.push('');
    lines.push(
      `largestPayload: ${report.largestPayload.relativePath} (${report.largestPayload.payloadByteSize} bytes)`
    );
  }

  if (report.errors.length > 0) {
    lines.push('');
    lines.push('errors:');
    for (const error of report.errors) {
      lines.push(`  - ${error}`);
    }
  }

  return lines.join('\n');
}

async function createFirestoreDb(config: FirestoreWriteConfig) {
  const serviceAccount = JSON.parse(
    readFileSync(config.serviceAccountPath, 'utf8')
  ) as { project_id?: string };

  const { initializeApp, cert, getApps, deleteApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  for (const app of getApps()) {
    await deleteApp(app);
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: config.projectId,
  });

  return getFirestore();
}

export async function verifyFirestoreCatalogReadback(
  options: VerifyFirestoreCatalogReadbackOptions
): Promise<CatalogReadbackReport> {
  const errors: string[] = [];
  let activeCatalogVersion = options.catalogVersion ?? null;

  let db: Awaited<ReturnType<typeof createFirestoreDb>> | null = null;
  const ensureDb = async () => {
    if (!db) {
      db = await createFirestoreDb(options.config);
    }
    return db;
  };

  const readDocument =
    options.readDocument ??
    (async (firestorePath: string) => {
      const firestore = await ensureDb();
      const snapshot = await firestore.doc(firestorePath).get();
      if (!snapshot.exists) {
        return null;
      }
      return snapshot.data() as Record<string, unknown>;
    });

  if (!activeCatalogVersion) {
    if (options.readActiveCatalogVersion) {
      activeCatalogVersion = await options.readActiveCatalogVersion();
    } else {
      const firestore = await ensureDb();
      const activePath = activePointerFirestorePath();
      const snapshot = await firestore.doc(activePath).get();
      if (!snapshot.exists) {
        errors.push(`Active catalog pointer not found at ${activePath}`);
        return buildCatalogReadbackReport({
          activeCatalogVersion: null,
          results: [],
          errors,
        });
      }
      const data = snapshot.data() as Record<string, unknown> | undefined;
      const version = data?.catalogVersion;
      activeCatalogVersion =
        typeof version === 'string' && version.trim() ? version : null;
    }

    if (!activeCatalogVersion) {
      errors.push(`Active catalog pointer not found at ${activePointerFirestorePath()}`);
      return buildCatalogReadbackReport({
        activeCatalogVersion: null,
        results: [],
        errors,
      });
    }
  }

  const targets = buildRuntimeReadbackTargets(activeCatalogVersion);
  const results: CatalogDocumentReadbackResult[] = [];

  for (const target of targets) {
    const firestoreData = await readDocument(target.firestorePath);
    results.push(
      evaluateCatalogDocumentReadback({
        target,
        firestoreData,
        sourceRoot: options.sourceRoot,
      })
    );
  }

  return buildCatalogReadbackReport({
    activeCatalogVersion,
    results,
    errors,
  });
}
