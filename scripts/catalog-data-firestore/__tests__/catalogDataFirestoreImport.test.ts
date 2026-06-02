import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildImportPlan,
  catalogDocumentFirestorePath,
  importPlanHasErrors,
  releaseManifestFirestorePath,
} from '../buildImportPlan';
import { buildDryRunReport, formatDryRunReport } from '../printDryRunReport';
import {
  decodeCatalogDocumentId,
  documentKeyFromRelativePath,
  encodeCatalogDocumentId,
} from '../encodeCatalogDocumentId';
import {
  assertValidFirestoreDocumentPath,
  isValidFirestoreDocumentPath,
} from '../firestoreDocumentPath';
import { inferDocumentMeta, inferDocumentTypeFromFileName } from '../inferDocumentMeta';
import { loadImportCliEnv } from '../loadImportCliEnv';
import { buildBearingsImportPlan } from '../buildBearingsImportPlan';
import { BEARINGS_CATALOG_RELATIVE_PATHS } from '../bearingsDocuments';
import { inferBearingDocumentMeta } from '../inferBearingDocumentMeta';
import { MVP_CATALOG_RELATIVE_PATHS, RUNTIME_USED_RELATIVE_PATHS } from '../mvpDocuments';
import {
  assertNoUndefinedFirestoreValues,
  findUndefinedFirestorePaths,
  sanitizeForFirestore,
} from '../sanitizeForFirestore';
import { sha256Checksum } from '../stableChecksum';
import {
  prepareActivePointerFirestorePayload,
  prepareCatalogDocumentFirestorePayload,
  prepareReleaseManifestFirestorePayload,
} from '../writeFirestore';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const CATALOG_ROOT = join(REPO_ROOT, 'data', 'catalog-data');

describe('encodeCatalogDocumentId', () => {
  it('encodes slashes to double underscore', () => {
    const key = 'rexroth/directional-controls/shared/spool-symbol-candidates';
    expect(encodeCatalogDocumentId(key)).toBe(
      'rexroth__directional-controls__shared__spool-symbol-candidates'
    );
  });

  it('round-trips family and index paths', () => {
    const samples = [
      'yuken/directional-controls/dsg/connector-voltage-candidates',
      'yuken/directional-controls/family-index',
      'rexroth/directional-controls/we/technical-data-candidates',
    ];
    for (const key of samples) {
      expect(decodeCatalogDocumentId(encodeCatalogDocumentId(key))).toBe(key);
    }
  });

  it('rejects documentKey containing __', () => {
    expect(() => encodeCatalogDocumentId('bad__segment/key')).toThrow(/must not contain/);
  });

  it('rejects encoded id containing slash on decode', () => {
    expect(() => decodeCatalogDocumentId('has/slash')).toThrow(/must not contain/);
  });

  it('maps relativePath to documentKey', () => {
    expect(
      documentKeyFromRelativePath(
        'rexroth/directional-controls/shared/spool-symbol-candidates.json'
      )
    ).toBe('rexroth/directional-controls/shared/spool-symbol-candidates');
  });
});

describe('inferDocumentMeta', () => {
  it('infers shared spool document type and scope', () => {
    const meta = inferDocumentMeta(
      'rexroth/directional-controls/shared/spool-symbol-candidates.json'
    );
    expect(meta.documentType).toBe('spool_symbol_candidates');
    expect(meta.scope).toBe('shared');
    expect(meta.manufacturer).toBe('rexroth');
    expect(meta.familyId).toBeUndefined();
  });

  it('infers family WE document', () => {
    const meta = inferDocumentMeta(
      'rexroth/directional-controls/we/connector-voltage-candidates.json'
    );
    expect(meta.documentType).toBe('connector_voltage_candidates');
    expect(meta.scope).toBe('family');
    expect(meta.familyId).toBe('we');
  });

  it('maps file names to document types', () => {
    expect(inferDocumentTypeFromFileName('family-index.json')).toBe('family_index');
    expect(inferDocumentTypeFromFileName('unknown-or-review.json')).toBe('unknown_or_review');
  });
});

describe('inferBearingDocumentMeta', () => {
  it('infers shared bore-code document', () => {
    const meta = inferBearingDocumentMeta(
      'bearings/rolling-bearings/shared/bore-code-candidates.json'
    );
    expect(meta.documentType).toBe('bore_code_candidates');
    expect(meta.scope).toBe('shared');
    expect(meta.sourceGroup).toBe('rolling-bearings');
  });

  it('infers standard-series parser spec', () => {
    const meta = inferBearingDocumentMeta(
      'bearings/rolling-bearings/standard-series/parser-spec-candidate.json'
    );
    expect(meta.documentType).toBe('parser_spec_candidate');
    expect(meta.scope).toBe('family');
    expect(meta.familyId).toBe('standard-series');
  });
});

describe('buildBearingsImportPlan', () => {
  it('builds envelopes for all bearings documents without errors', () => {
    const plan = buildBearingsImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: 'bearings.test',
      importedAt: '2026-06-01T00:00:00.000Z',
    });

    expect(plan.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(plan.envelopes).toHaveLength(BEARINGS_CATALOG_RELATIVE_PATHS.length);
    expect(plan.release.runtimeUsedCount).toBe(0);
  });

  it('dimension payload stays under Firestore size limit', () => {
    const plan = buildBearingsImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: 'bearings.size.test',
    });
    const dimension = plan.envelopes.find((e) =>
      e.relativePath.endsWith('dimension-candidates.json')
    );
    expect(dimension).toBeDefined();
    expect(dimension!.payloadByteSize).toBeLessThan(900 * 1024);
  });
});

describe('buildImportPlan dry-run', () => {
  it('builds envelopes for all MVP documents without errors', () => {
    const plan = buildImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: 'test.version',
      importedAt: '2026-05-29T00:00:00.000Z',
    });

    expect(importPlanHasErrors(plan)).toBe(false);
    expect(plan.envelopes).toHaveLength(MVP_CATALOG_RELATIVE_PATHS.length);
    expect(plan.release.runtimeUsedCount).toBe(RUNTIME_USED_RELATIVE_PATHS.size);
  });

  it('manifest checksum matches payload checksum per document', () => {
    const plan = buildImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: 'test.version',
    });

    for (const envelope of plan.envelopes) {
      expect(envelope.checksumSha256).toBe(sha256Checksum(envelope.payload));
      const manifestEntry = plan.release.checksumManifest.find(
        (e) => e.documentKey === envelope.documentKey
      );
      expect(manifestEntry?.checksumSha256).toBe(envelope.checksumSha256);
      expect(manifestEntry?.encodedDocumentId).toBe(envelope.encodedDocumentId);
    }
  });

  it('encoded document ids contain no slashes', () => {
    const plan = buildImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: 'test.version',
    });

    for (const envelope of plan.envelopes) {
      expect(envelope.encodedDocumentId).not.toContain('/');
      expect(catalogDocumentFirestorePath('test.version', envelope.encodedDocumentId)).toMatch(
        /^catalogData\/test\.version\/docs\/[^/]+$/
      );
    }
  });

  it('does not mutate data/catalog-data source files', () => {
    const hashesBefore = MVP_CATALOG_RELATIVE_PATHS.map((relativePath) => {
      const content = readFileSync(join(CATALOG_ROOT, relativePath));
      return createHash('sha256').update(content).digest('hex');
    });

    buildImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: 'mutation.test',
    });

    const hashesAfter = MVP_CATALOG_RELATIVE_PATHS.map((relativePath) => {
      const content = readFileSync(join(CATALOG_ROOT, relativePath));
      return createHash('sha256').update(content).digest('hex');
    });

    expect(hashesAfter).toEqual(hashesBefore);
  });

  it('uses catalogDataReleases for release metadata path', () => {
    expect(releaseManifestFirestorePath('2026.05.30')).toBe('catalogDataReleases/2026.05.30');
  });

  it('dry-run output lists catalogDataReleases release path', () => {
    const plan = buildImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: '2026.05.30',
    });
    const report = buildDryRunReport(plan);
    const formatted = formatDryRunReport(report);

    expect(report.firestorePaths[0]).toBe('catalogDataReleases/2026.05.30');
    expect(formatted).toContain('catalogDataReleases/2026.05.30');
    expect(formatted).not.toContain('catalogDataMeta/releases/');
  });

  it('all generated Firestore paths have even segment count', () => {
    const plan = buildImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: '2026.05.30',
    });
    const report = buildDryRunReport(plan);

    for (const path of report.firestorePaths) {
      expect(isValidFirestoreDocumentPath(path)).toBe(true);
    }
  });
});

describe('firestoreDocumentPath', () => {
  it('accepts valid document paths', () => {
    expect(() => assertValidFirestoreDocumentPath('catalogDataMeta/active')).not.toThrow();
    expect(() => assertValidFirestoreDocumentPath('catalogDataReleases/2026.05.30')).not.toThrow();
    expect(() =>
      assertValidFirestoreDocumentPath(
        'catalogData/2026.05.30/docs/rexroth__directional-controls__family-index'
      )
    ).not.toThrow();
  });

  it('rejects invalid odd-segment paths', () => {
    expect(isValidFirestoreDocumentPath('catalogDataMeta/releases/2026.05.30')).toBe(false);
    expect(() => assertValidFirestoreDocumentPath('catalogDataMeta/releases/2026.05.30')).toThrow(
      /even number of segments/
    );
  });
});

describe('import CLI env loading', () => {
  it('loads .env from cwd without printing values', () => {
    const { mkdtempSync, writeFileSync, rmSync } = require('node:fs') as typeof import('node:fs');
    const { tmpdir } = require('node:os') as typeof import('node:os');
    const { join: joinPath } = require('node:path') as typeof import('node:path');

    const dir = mkdtempSync(joinPath(tmpdir(), 'c2p-import-env-'));
    const envKey = 'CATALOG_IMPORT_DOTENV_TEST_KEY';
    const prior = process.env[envKey];

    try {
      writeFileSync(joinPath(dir, '.env'), `${envKey}=loaded-from-dotenv-file\n`);
      delete process.env[envKey];

      loadImportCliEnv(dir);

      expect(process.env[envKey]).toBe('loaded-from-dotenv-file');
    } finally {
      if (prior === undefined) {
        delete process.env[envKey];
      } else {
        process.env[envKey] = prior;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not override env vars already set in the shell', () => {
    const { mkdtempSync, writeFileSync, rmSync } = require('node:fs') as typeof import('node:fs');
    const { tmpdir } = require('node:os') as typeof import('node:os');
    const { join: joinPath } = require('node:path') as typeof import('node:path');

    const dir = mkdtempSync(joinPath(tmpdir(), 'c2p-import-env-'));
    const envKey = 'CATALOG_IMPORT_DOTENV_OVERRIDE_TEST';
    const prior = process.env[envKey];

    try {
      process.env[envKey] = 'shell-value';
      writeFileSync(joinPath(dir, '.env'), `${envKey}=file-value\n`);

      loadImportCliEnv(dir);

      expect(process.env[envKey]).toBe('shell-value');
    } finally {
      if (prior === undefined) {
        delete process.env[envKey];
      } else {
        process.env[envKey] = prior;
      }
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('is wired only in CLI entry, not import library modules or app runtime', () => {
    const cliSource = readFileSync(
      join(__dirname, '..', 'cli.ts'),
      'utf8'
    );
    const writeFirestoreSource = readFileSync(
      join(__dirname, '..', 'writeFirestore.ts'),
      'utf8'
    );
    const appEntrySource = readFileSync(join(REPO_ROOT, 'package.json'), 'utf8');

    expect(cliSource).toContain('loadImportCliEnv');
    expect(writeFirestoreSource).not.toContain('dotenv');
    expect(appEntrySource).toContain('expo-router/entry');
    expect(appEntrySource).not.toContain('loadImportCliEnv');
  });
});

describe('sanitizeForFirestore', () => {
  it('removes undefined object properties without mutating input', () => {
    const input = {
      scope: 'shared',
      familyId: undefined,
      runtimeUsed: false,
      count: 0,
      label: '',
      tags: [],
      note: null,
    };

    const output = sanitizeForFirestore(input);

    expect(output).toEqual({
      scope: 'shared',
      runtimeUsed: false,
      count: 0,
      label: '',
      tags: [],
      note: null,
    });
    expect(output).not.toBe(input);
    expect('familyId' in input).toBe(true);
    expect('familyId' in output).toBe(false);
  });

  it('removes undefined array elements recursively', () => {
    const input = {
      items: [1, undefined, { keep: false, drop: undefined }],
      nested: { a: undefined, b: 'ok' },
    };

    expect(sanitizeForFirestore(input)).toEqual({
      items: [1, { keep: false }],
      nested: { b: 'ok' },
    });
  });

  it('assertNoUndefinedFirestoreValues fails with field path', () => {
    expect(() =>
      assertNoUndefinedFirestoreValues({ familyId: undefined }, 'shared-doc')
    ).toThrow(/shared-doc: .*familyId/);
  });
});

describe('Firestore write payloads', () => {
  const mockTimestamps = {
    importedAt: '2026-05-30T00:00:00.000Z',
    sourceUpdatedAt: '2026-05-30T00:00:00.000Z',
  };

  it('removes familyId from shared and index document envelopes', () => {
    const plan = buildImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: '2026.05.30',
      importedAt: mockTimestamps.importedAt,
    });

    const sharedOrIndex = plan.envelopes.filter(
      (envelope) => envelope.scope === 'shared' || envelope.scope === 'index'
    );
    expect(sharedOrIndex.length).toBeGreaterThan(0);

    for (const envelope of sharedOrIndex) {
      expect(envelope.familyId).toBeUndefined();
      const payload = prepareCatalogDocumentFirestorePayload(envelope, mockTimestamps);
      expect(payload).not.toHaveProperty('familyId');
      expect(findUndefinedFirestorePaths(payload)).toEqual([]);
    }
  });

  it('preserves familyId for family documents', () => {
    const plan = buildImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: '2026.05.30',
      importedAt: mockTimestamps.importedAt,
    });

    const familySamples = [
      plan.envelopes.find((e) => e.documentKey.includes('/we/')),
      plan.envelopes.find((e) => e.documentKey.includes('/dsg/')),
      plan.envelopes.find((e) => e.documentKey.includes('/dshg/')),
    ].filter((envelope): envelope is NonNullable<typeof envelope> => envelope !== undefined);

    expect(familySamples).toHaveLength(3);

    for (const envelope of familySamples) {
      const payload = prepareCatalogDocumentFirestorePayload(envelope, mockTimestamps);
      expect(payload.familyId).toBe(envelope.familyId);
      expect(findUndefinedFirestorePaths(payload)).toEqual([]);
    }
  });

  it('generates write payloads with no undefined values recursively', () => {
    const plan = buildImportPlan({
      sourceRoot: CATALOG_ROOT,
      catalogVersion: '2026.05.30',
      importedAt: mockTimestamps.importedAt,
    });

    const releasePayload = prepareReleaseManifestFirestorePayload(plan.release, mockTimestamps);
    expect(findUndefinedFirestorePaths(releasePayload)).toEqual([]);

    const activePayload = prepareActivePointerFirestorePayload({
      catalogVersion: plan.catalogVersion,
      schemaVersion: plan.release.schemaVersion,
      publishedAt: mockTimestamps.importedAt,
    });
    expect(findUndefinedFirestorePaths(activePayload)).toEqual([]);

    for (const envelope of plan.envelopes) {
      const payload = prepareCatalogDocumentFirestorePayload(envelope, mockTimestamps);
      expect(findUndefinedFirestorePaths(payload)).toEqual([]);
    }
  });
});
