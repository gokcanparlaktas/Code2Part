#!/usr/bin/env node
import { existsSync } from 'fs';
import { resolve } from 'path';

import { FirestoreCatalogProvider } from '../../src/backend/catalog/FirestoreCatalogProvider';
import { LocalCatalogDataProvider } from '../../src/domain/catalogData/CatalogDataProvider';
import { findEquivalentsService } from '../../src/backend/services/findEquivalentsService';
import { loadImportCliEnv } from '../catalog-data-firestore/loadImportCliEnv';

loadImportCliEnv();

function parseArgs(argv: string[]) {
  let code = '4WE6E-6X/EG24N9K4';
  let useFirestore = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--code') {
      code = argv[++i] ?? code;
    } else if (arg === '--firestore') {
      useFirestore = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: catalog-data-backend-equivalents-poc [options]

Options:
  --code <productCode>   Source product code
  --firestore            Use Firestore catalog provider (requires .env credentials)
  --help                 Show this help
`);
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      code = arg;
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  return { code, useFirestore };
}

async function resolveProvider(useFirestore: boolean) {
  if (!useFirestore) {
    return new LocalCatalogDataProvider();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!projectId || !serviceAccountPath) {
    throw new Error('FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_PATH are required for --firestore');
  }

  const resolvedPath = resolve(serviceAccountPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`Service account file not found: ${resolvedPath}`);
  }

  return new FirestoreCatalogProvider({
    projectId,
    serviceAccountPath: resolvedPath,
  });
}

async function main(): Promise<void> {
  const { code, useFirestore } = parseArgs(process.argv.slice(2));
  const provider = await resolveProvider(useFirestore);

  const result = await findEquivalentsService({
    code,
    catalogProvider: provider,
  });

  console.log('Backend findEquivalents PoC');
  console.log('===========================');
  console.log(`provider: ${useFirestore ? 'firestore' : 'local'}`);
  if ('catalogVersion' in provider && provider.catalogVersion) {
    console.log(`catalogVersion: ${provider.catalogVersion}`);
  }
  console.log(`sourceCode: ${result.source.code}`);
  console.log(`sourceSeries: ${result.source.series ?? '(unknown)'}`);
  console.log(`candidateCount: ${result.candidates.length}`);

  const top = result.candidates.slice(0, 8);
  for (const candidate of top) {
    console.log(
      `  - ${candidate.code} (${candidate.manufacturer} ${candidate.series}) match=${candidate.matchPercentage}% metadata=${JSON.stringify(candidate.metadata)}`
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
