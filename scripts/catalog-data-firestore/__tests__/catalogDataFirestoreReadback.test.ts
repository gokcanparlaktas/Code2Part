import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { RUNTIME_USED_RELATIVE_PATHS } from '../mvpDocuments';
import { sha256Checksum } from '../stableChecksum';
import {
  buildCatalogReadbackReport,
  buildRuntimeReadbackTargets,
  evaluateCatalogDocumentReadback,
  extractCatalogPayloadFromFirestoreDoc,
  formatVerifyReport,
  validatePayloadChecksum,
  verifyFirestoreCatalogReadback,
} from '../verifyFirestoreCatalogReadback';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const CATALOG_ROOT = join(REPO_ROOT, 'data', 'catalog-data');

describe('verifyFirestoreCatalogReadback helpers', () => {
  it('builds runtime readback targets for all runtimeUsed docs', () => {
    const targets = buildRuntimeReadbackTargets('2026.05.30');

    expect(targets).toHaveLength(RUNTIME_USED_RELATIVE_PATHS.size);
    expect(targets.map((target) => target.relativePath)).toEqual(
      [...RUNTIME_USED_RELATIVE_PATHS].sort()
    );
    expect(targets[0]?.firestorePath).toMatch(/^catalogData\/2026\.05\.30\/docs\//);
    expect(targets.every((target) => !target.encodedDocumentId.includes('/'))).toBe(true);
  });

  it('extracts resolver payload shape from Firestore envelope document', () => {
    const payload = { candidates: [{ id: 'A' }] };
    const checksumSha256 = sha256Checksum(payload);

    const extracted = extractCatalogPayloadFromFirestoreDoc({
      payload,
      checksumSha256,
      relativePath: 'rexroth/directional-controls/shared/spool-symbol-candidates.json',
      encodedDocumentId: 'rexroth__directional-controls__shared__spool-symbol-candidates',
    });

    expect(extracted.payload).toEqual(payload);
    expect(extracted.checksumSha256).toBe(checksumSha256);
  });

  it('evaluates readback against local source without mutating catalog-data', () => {
    const relativePath =
      'rexroth/directional-controls/shared/spool-symbol-candidates.json';
    const localPayload = JSON.parse(
      readFileSync(join(CATALOG_ROOT, relativePath), 'utf8')
    ) as unknown;
    const checksumSha256 = sha256Checksum(localPayload);
    const [target] = buildRuntimeReadbackTargets('2026.05.30').filter(
      (entry) => entry.relativePath === relativePath
    );

    expect(target).toBeDefined();

    const result = evaluateCatalogDocumentReadback({
      target: target!,
      firestoreData: {
        payload: localPayload,
        checksumSha256,
        relativePath,
        encodedDocumentId: target!.encodedDocumentId,
      },
      sourceRoot: CATALOG_ROOT,
    });

    expect(result.found).toBe(true);
    expect(result.payloadChecksumValid).toBe(true);
    expect(result.matchesLocalSource).toBe(true);
    expect(validatePayloadChecksum(localPayload, checksumSha256)).toBe(true);
  });

  it('marks missing documents and checksum failures in report', () => {
    const targets = buildRuntimeReadbackTargets('2026.05.30');
    const [first, second] = targets;

    const failureReport = buildCatalogReadbackReport({
      activeCatalogVersion: '2026.05.30',
      results: [
        evaluateCatalogDocumentReadback({
          target: first!,
          firestoreData: null,
        }),
        evaluateCatalogDocumentReadback({
          target: second!,
          firestoreData: {
            payload: { broken: true },
            checksumSha256: 'deadbeef',
            relativePath: second!.relativePath,
            encodedDocumentId: second!.encodedDocumentId,
          },
        }),
      ],
    });

    expect(failureReport.success).toBe(false);
    expect(failureReport.missingDocuments).toContain(first!.relativePath);
    expect(failureReport.errors.some((error) => error.includes('checksum mismatch'))).toBe(true);
  });

  it('verifies readback with injected Firestore readers (no network)', async () => {
    const localPayloadByPath = Object.fromEntries(
      [...RUNTIME_USED_RELATIVE_PATHS].map((relativePath) => {
        const payload = JSON.parse(
          readFileSync(join(CATALOG_ROOT, relativePath), 'utf8')
        ) as unknown;
        return [relativePath, payload];
      })
    );

    const report = await verifyFirestoreCatalogReadback({
      config: {
        projectId: 'test-project',
        serviceAccountPath: 'unused',
        useEmulator: false,
      },
      sourceRoot: CATALOG_ROOT,
      catalogVersion: '2026.05.30',
      readDocument: async (firestorePath) => {
        const target = buildRuntimeReadbackTargets('2026.05.30').find(
          (entry) => entry.firestorePath === firestorePath
        );
        if (!target) {
          return null;
        }
        const payload = localPayloadByPath[target.relativePath];
        return {
          payload,
          checksumSha256: sha256Checksum(payload),
          relativePath: target.relativePath,
          encodedDocumentId: target.encodedDocumentId,
        };
      },
    });

    expect(report.success).toBe(true);
    expect(report.activeCatalogVersion).toBe('2026.05.30');
    expect(report.documentsRead).toBe(RUNTIME_USED_RELATIVE_PATHS.size);
    expect(report.missingDocuments).toEqual([]);
    expect(
      report.checksumResults.every(
        (result) => result.payloadChecksumValid && result.matchesLocalSource
      )
    ).toBe(true);

    const formatted = formatVerifyReport(report);
    expect(formatted).toContain('result: SUCCESS');
    expect(formatted).toContain('activeCatalogVersion: 2026.05.30');
  });

  it('does not wire Firestore readback into app runtime loaders', () => {
    const loadCatalogDataSource = readFileSync(
      join(REPO_ROOT, 'src/domain/catalogData/loadCatalogData.ts'),
      'utf8'
    );
    const verifyCliSource = readFileSync(
      join(__dirname, '..', 'verifyCli.ts'),
      'utf8'
    );

    expect(loadCatalogDataSource).toContain('@catalog-data/');
    expect(loadCatalogDataSource).not.toContain('firebase-admin');
    expect(loadCatalogDataSource).not.toContain('verifyFirestoreCatalogReadback');
    expect(verifyCliSource).toContain('loadImportCliEnv');
  });
});
