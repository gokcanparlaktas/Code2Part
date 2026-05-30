#!/usr/bin/env node
import { existsSync } from 'fs';
import { join, resolve } from 'path';

import { loadImportCliEnv } from './loadImportCliEnv';
import { loadFirestoreWriteConfigFromEnv } from './writeFirestore';
import {
  formatVerifyReport,
  verifyFirestoreCatalogReadback,
} from './verifyFirestoreCatalogReadback';

loadImportCliEnv();

function parseArgs(argv: string[]) {
  let sourceRoot = join(process.cwd(), 'data', 'catalog-data');
  let catalogVersion: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--source':
        sourceRoot = resolve(argv[++i] ?? '');
        break;
      case '--catalog-version':
        catalogVersion = argv[++i];
        break;
      case '--help':
      case '-h':
        console.log(`Usage: catalog-data-firestore-verify [options]

Options:
  --source <path>         Local catalog root for checksum comparison (default: data/catalog-data)
  --catalog-version <id>  Override active pointer catalog version
  --help                  Show this help
`);
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  return { sourceRoot, catalogVersion };
}

async function main(): Promise<void> {
  const { sourceRoot, catalogVersion } = parseArgs(process.argv.slice(2));

  if (!existsSync(sourceRoot)) {
    console.error(`Source root not found: ${sourceRoot}`);
    process.exit(1);
  }

  const config = loadFirestoreWriteConfigFromEnv();
  const report = await verifyFirestoreCatalogReadback({
    config,
    sourceRoot,
    catalogVersion,
  });

  console.log(formatVerifyReport(report));
  process.exit(report.success ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
