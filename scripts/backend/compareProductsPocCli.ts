#!/usr/bin/env node
import { existsSync } from 'fs';
import { resolve } from 'path';

import { FirestoreCatalogProvider } from '../../src/backend/catalog/FirestoreCatalogProvider';
import { compareProductsService } from '../../src/backend/services/compareProductsService';
import { loadImportCliEnv } from '../catalog-data-firestore/loadImportCliEnv';

loadImportCliEnv();

const SOURCE_CODE = '4WE6E-6X/EG24N9K4';
const CANDIDATE_CODE = 'DSG-01-3C2-D24-N1-70';

async function main(): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

  if (!projectId || !serviceAccountPath) {
    console.error('FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_PATH are required.');
    process.exit(1);
  }

  const resolvedPath = resolve(serviceAccountPath);
  if (!existsSync(resolvedPath)) {
    console.error(`Service account file not found: ${resolvedPath}`);
    process.exit(1);
  }

  const provider = new FirestoreCatalogProvider({
    projectId,
    serviceAccountPath: resolvedPath,
  });

  const result = await compareProductsService({
    sourceCode: SOURCE_CODE,
    candidateCode: CANDIDATE_CODE,
    catalogProvider: provider,
  });

  console.log('Backend compareProducts PoC');
  console.log('===========================');
  console.log(`catalogVersion: ${provider.catalogVersion ?? '(unknown)'}`);
  console.log(`sourceCode: ${result.sourceCode}`);
  console.log(`candidateCode: ${result.candidateCode}`);
  console.log(`metadata: ${JSON.stringify(result.metadata)}`);
  console.log(`summary: ${JSON.stringify(result.summary)}`);
  console.log(`compatibleCount: ${result.compatible.length}`);
  console.log(`differentCount: ${result.different.length}`);
  console.log(`unknownOrCheckCount: ${result.unknownOrCheck.length}`);
  console.log(`warningsCount: ${result.warnings.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
