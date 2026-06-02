import { readFileSync, statSync } from 'fs';
import { join } from 'path';

import { BEARINGS_CATALOG_RELATIVE_PATHS } from './bearingsDocuments';
import {
  documentKeyFromRelativePath,
  encodeCatalogDocumentId,
} from './encodeCatalogDocumentId';
import { buildValidatedFirestoreDocumentPath } from './firestoreDocumentPath';
import { inferBearingDocumentMeta } from './inferBearingDocumentMeta';
import { payloadByteSize, sha256Checksum } from './stableChecksum';
import {
  CATALOG_DATA_SCHEMA_VERSION,
  MAX_PAYLOAD_BYTES,
  type CatalogDocumentEnvelope,
  type ImportPlan,
  type ValidationIssue,
} from './types';

export function buildBearingsImportPlan(options: {
  sourceRoot: string;
  catalogVersion: string;
  importedAt?: string;
}): ImportPlan {
  const importedAt = options.importedAt ?? new Date().toISOString();
  const issues: ValidationIssue[] = [];
  const envelopes: CatalogDocumentEnvelope[] = [];
  let latestSourceUpdatedAt = new Date(0).toISOString();

  for (const relativePath of BEARINGS_CATALOG_RELATIVE_PATHS) {
    const absolutePath = join(options.sourceRoot, relativePath);

    let meta;
    try {
      meta = inferBearingDocumentMeta(relativePath);
    } catch (error) {
      issues.push({
        level: 'error',
        message: error instanceof Error ? error.message : String(error),
        relativePath,
      });
      continue;
    }

    if (meta.documentKey !== documentKeyFromRelativePath(relativePath)) {
      issues.push({
        level: 'error',
        message: `documentKey mismatch for ${relativePath}`,
        relativePath,
      });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
    } catch (error) {
      issues.push({
        level: 'error',
        message: `JSON parse/read failed: ${error instanceof Error ? error.message : String(error)}`,
        relativePath,
      });
      continue;
    }

    const sourceUpdatedAt = statSync(absolutePath).mtime.toISOString();
    if (sourceUpdatedAt > latestSourceUpdatedAt) {
      latestSourceUpdatedAt = sourceUpdatedAt;
    }

    const encodedDocumentId = encodeCatalogDocumentId(meta.documentKey);
    const byteSize = payloadByteSize(payload);

    if (byteSize > MAX_PAYLOAD_BYTES) {
      issues.push({
        level: 'error',
        message: `payload exceeds ${MAX_PAYLOAD_BYTES} bytes (${byteSize})`,
        relativePath,
      });
    }

    if (encodedDocumentId.includes('/')) {
      issues.push({
        level: 'error',
        message: `encodedDocumentId must not contain slash: ${encodedDocumentId}`,
        relativePath,
      });
    }

    envelopes.push({
      catalogVersion: options.catalogVersion,
      schemaVersion: CATALOG_DATA_SCHEMA_VERSION,
      manufacturer: 'bearings',
      category: 'rolling-bearings',
      scope: meta.scope,
      familyId: meta.familyId,
      documentType: meta.documentType,
      documentKey: meta.documentKey,
      encodedDocumentId,
      relativePath: meta.relativePath,
      payload,
      payloadFormat: 'json',
      checksumSha256: sha256Checksum(payload),
      sourceUpdatedAt,
      importedAt,
      runtimeUsed: false,
      payloadByteSize: byteSize,
    });
  }

  return {
    catalogVersion: options.catalogVersion,
    envelopes,
    release: {
      catalogVersion: options.catalogVersion,
      schemaVersion: CATALOG_DATA_SCHEMA_VERSION,
      importedAt,
      sourceUpdatedAt: latestSourceUpdatedAt,
      manufacturers: ['bearings'],
      categories: ['rolling-bearings'],
      families: { bearings: ['standard-series'] },
      documentCount: envelopes.length,
      checksumManifest: envelopes.map((envelope) => ({
        documentKey: envelope.documentKey,
        encodedDocumentId: envelope.encodedDocumentId,
        relativePath: envelope.relativePath,
        checksumSha256: envelope.checksumSha256,
        runtimeUsed: false,
      })),
      status: issues.some((i) => i.level === 'error') ? 'draft' : 'validated',
      runtimeUsedCount: 0,
    },
    issues,
  };
}

export function bearingsCatalogDocumentFirestorePath(
  catalogVersion: string,
  encodedDocumentId: string
): string {
  return buildValidatedFirestoreDocumentPath([
    'catalogData',
    catalogVersion,
    'docs',
    encodedDocumentId,
  ]);
}
