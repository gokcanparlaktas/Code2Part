import { readFileSync, statSync } from 'fs';
import { join } from 'path';

import {
  documentKeyFromRelativePath,
  encodeCatalogDocumentId,
} from './encodeCatalogDocumentId';
import { buildValidatedFirestoreDocumentPath } from './firestoreDocumentPath';
import { inferDocumentMeta } from './inferDocumentMeta';
import {
  isRuntimeUsedCatalogPath,
  MVP_CATALOG_RELATIVE_PATHS,
  mvpFamiliesByManufacturer,
} from './mvpDocuments';
import { payloadByteSize, sha256Checksum } from './stableChecksum';
import {
  CATALOG_DATA_SCHEMA_VERSION,
  MAX_PAYLOAD_BYTES,
  type CatalogDocumentEnvelope,
  type CatalogReleaseManifest,
  type ImportPlan,
  type ValidationIssue,
} from './types';

export function catalogDocumentFirestorePath(
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

export function releaseManifestFirestorePath(catalogVersion: string): string {
  return buildValidatedFirestoreDocumentPath(['catalogDataReleases', catalogVersion]);
}

export function activePointerFirestorePath(): string {
  return buildValidatedFirestoreDocumentPath(['catalogDataMeta', 'active']);
}

export interface BuildImportPlanOptions {
  sourceRoot: string;
  catalogVersion: string;
  importedAt?: string;
}

function readJsonFile(absolutePath: string): unknown {
  const raw = readFileSync(absolutePath, 'utf8');
  return JSON.parse(raw) as unknown;
}

function validateEnvelopeEncoding(envelope: CatalogDocumentEnvelope): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (envelope.encodedDocumentId.includes('/')) {
    issues.push({
      level: 'error',
      message: `encodedDocumentId must not contain slash: ${envelope.encodedDocumentId}`,
      relativePath: envelope.relativePath,
    });
  }
  if (envelope.documentKey.includes('__')) {
    issues.push({
      level: 'error',
      message: `documentKey must not contain "__": ${envelope.documentKey}`,
      relativePath: envelope.relativePath,
    });
  }
  if (envelope.payloadByteSize > MAX_PAYLOAD_BYTES) {
    issues.push({
      level: 'error',
      message: `payload exceeds ${MAX_PAYLOAD_BYTES} bytes (${envelope.payloadByteSize})`,
      relativePath: envelope.relativePath,
    });
  }
  return issues;
}

export function buildImportPlan(options: BuildImportPlanOptions): ImportPlan {
  const importedAt = options.importedAt ?? new Date().toISOString();
  const issues: ValidationIssue[] = [];
  const envelopes: CatalogDocumentEnvelope[] = [];
  let latestSourceUpdatedAt = new Date(0).toISOString();

  for (const relativePath of MVP_CATALOG_RELATIVE_PATHS) {
    const absolutePath = join(options.sourceRoot, relativePath);

    let meta;
    try {
      meta = inferDocumentMeta(relativePath);
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
      payload = readJsonFile(absolutePath);
    } catch (error) {
      issues.push({
        level: 'error',
        message: `JSON parse/read failed: ${error instanceof Error ? error.message : String(error)}`,
        relativePath,
      });
      continue;
    }

    const sourceStat = statSync(absolutePath);
    const sourceUpdatedAt = sourceStat.mtime.toISOString();
    if (sourceUpdatedAt > latestSourceUpdatedAt) {
      latestSourceUpdatedAt = sourceUpdatedAt;
    }

    const encodedDocumentId = encodeCatalogDocumentId(meta.documentKey);
    const byteSize = payloadByteSize(payload);
    const envelope: CatalogDocumentEnvelope = {
      catalogVersion: options.catalogVersion,
      schemaVersion: CATALOG_DATA_SCHEMA_VERSION,
      manufacturer: meta.manufacturer,
      category: meta.category,
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
      runtimeUsed: isRuntimeUsedCatalogPath(relativePath),
      payloadByteSize: byteSize,
    };

    issues.push(...validateEnvelopeEncoding(envelope));
    envelopes.push(envelope);
  }

  const expectedCount = MVP_CATALOG_RELATIVE_PATHS.length;
  if (envelopes.length < expectedCount) {
    const found = new Set(envelopes.map((e) => e.relativePath));
    for (const required of MVP_CATALOG_RELATIVE_PATHS) {
      if (!found.has(required)) {
        issues.push({
          level: 'error',
          message: 'Required MVP document missing',
          relativePath: required,
        });
      }
    }
  }

  const checksumManifest = envelopes.map((envelope) => ({
    documentKey: envelope.documentKey,
    encodedDocumentId: envelope.encodedDocumentId,
    relativePath: envelope.relativePath,
    checksumSha256: envelope.checksumSha256,
    runtimeUsed: envelope.runtimeUsed,
  }));

  const runtimeUsedCount = envelopes.filter((e) => e.runtimeUsed).length;

  const release: CatalogReleaseManifest = {
    catalogVersion: options.catalogVersion,
    schemaVersion: CATALOG_DATA_SCHEMA_VERSION,
    importedAt,
    sourceUpdatedAt: latestSourceUpdatedAt,
    manufacturers: ['rexroth', 'yuken'],
    categories: ['directional-controls'],
    families: {
      rexroth: [...mvpFamiliesByManufacturer().rexroth],
      yuken: [...mvpFamiliesByManufacturer().yuken],
    },
    documentCount: envelopes.length,
    checksumManifest,
    status: issues.some((i) => i.level === 'error') ? 'draft' : 'validated',
    runtimeUsedCount,
  };

  return {
    catalogVersion: options.catalogVersion,
    envelopes,
    release,
    issues,
  };
}

export function importPlanHasErrors(plan: ImportPlan): boolean {
  return plan.issues.some((issue) => issue.level === 'error');
}
