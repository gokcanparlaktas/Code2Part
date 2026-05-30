import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import type { CatalogDocumentEnvelope, CatalogReleaseManifest } from './types';
import {
  activePointerFirestorePath,
  catalogDocumentFirestorePath,
  releaseManifestFirestorePath,
} from './buildImportPlan';
import { assertValidFirestoreDocumentPath } from './firestoreDocumentPath';
import {
  assertNoUndefinedFirestoreValues,
  sanitizeForFirestore,
} from './sanitizeForFirestore';

export interface FirestoreWriteConfig {
  projectId: string;
  serviceAccountPath: string;
  useEmulator: boolean;
}

export function loadFirestoreWriteConfigFromEnv(): FirestoreWriteConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required for Firestore write');
  }
  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is required for Firestore write');
  }

  const resolvedPath = resolve(serviceAccountPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`Service account file not found: ${resolvedPath}`);
  }

  return {
    projectId,
    serviceAccountPath: resolvedPath,
    useEmulator: Boolean(process.env.FIRESTORE_EMULATOR_HOST?.trim()),
  };
}

function envelopeToFirestoreDoc(envelope: CatalogDocumentEnvelope): Record<string, unknown> {
  const { payloadByteSize: _payloadByteSize, ...rest } = envelope;
  return rest;
}

export function prepareCatalogDocumentFirestorePayload(
  envelope: CatalogDocumentEnvelope,
  timestamps: {
    importedAt: unknown;
    sourceUpdatedAt: unknown;
  }
): Record<string, unknown> {
  const payload = sanitizeForFirestore({
    ...envelopeToFirestoreDoc(envelope),
    importedAt: timestamps.importedAt,
    sourceUpdatedAt: timestamps.sourceUpdatedAt,
  });
  assertNoUndefinedFirestoreValues(payload, envelope.encodedDocumentId);
  return payload;
}

export function prepareReleaseManifestFirestorePayload(
  release: CatalogReleaseManifest,
  timestamps: {
    importedAt: unknown;
    sourceUpdatedAt: unknown;
  }
): Record<string, unknown> {
  const payload = sanitizeForFirestore({
    ...release,
    importedAt: timestamps.importedAt,
    sourceUpdatedAt: timestamps.sourceUpdatedAt,
  });
  assertNoUndefinedFirestoreValues(payload, 'release');
  return payload;
}

export function prepareActivePointerFirestorePayload(options: {
  catalogVersion: string;
  schemaVersion: string;
  publishedAt: unknown;
}): Record<string, unknown> {
  const payload = sanitizeForFirestore(options);
  assertNoUndefinedFirestoreValues(payload, 'active');
  return payload;
}

export async function writeImportPlanToFirestore(options: {
  config: FirestoreWriteConfig;
  catalogVersion: string;
  envelopes: CatalogDocumentEnvelope[];
  release: CatalogReleaseManifest;
  publishActive: boolean;
}): Promise<void> {
  const serviceAccount = JSON.parse(
    readFileSync(options.config.serviceAccountPath, 'utf8')
  ) as { project_id?: string };

  const { initializeApp, cert, getApps, deleteApp } = await import('firebase-admin/app');
  const { getFirestore, Timestamp } = await import('firebase-admin/firestore');

  for (const app of getApps()) {
    await deleteApp(app);
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: options.config.projectId,
  });

  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  const releasePath = releaseManifestFirestorePath(options.catalogVersion);
  assertValidFirestoreDocumentPath(releasePath);

  const releaseDoc = prepareReleaseManifestFirestorePayload(options.release, {
    importedAt: Timestamp.fromDate(new Date(options.release.importedAt)),
    sourceUpdatedAt: Timestamp.fromDate(new Date(options.release.sourceUpdatedAt)),
  });

  await db.doc(releasePath).set(releaseDoc);

  for (const envelope of options.envelopes) {
    const docPath = catalogDocumentFirestorePath(
      options.catalogVersion,
      envelope.encodedDocumentId
    );
    assertValidFirestoreDocumentPath(docPath);
    const doc = prepareCatalogDocumentFirestorePayload(envelope, {
      importedAt: Timestamp.fromDate(new Date(envelope.importedAt)),
      sourceUpdatedAt: Timestamp.fromDate(new Date(envelope.sourceUpdatedAt)),
    });
    await db.doc(docPath).set(doc);
  }

  if (options.publishActive) {
    const activePath = activePointerFirestorePath();
    assertValidFirestoreDocumentPath(activePath);
    const activeDoc = prepareActivePointerFirestorePayload({
      catalogVersion: options.catalogVersion,
      schemaVersion: options.release.schemaVersion,
      publishedAt: Timestamp.now(),
    });
    await db.doc(activePath).set(activeDoc);
  }
}
