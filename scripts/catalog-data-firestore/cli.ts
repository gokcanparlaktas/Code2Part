#!/usr/bin/env node
import { existsSync } from 'fs';
import { join, resolve } from 'path';

import {
  buildImportPlan,
  importPlanHasErrors,
} from './buildImportPlan';
import { loadImportCliEnv } from './loadImportCliEnv';
import {
  buildDryRunReport,
  formatDryRunReport,
} from './printDryRunReport';
import {
  loadFirestoreWriteConfigFromEnv,
  writeImportPlanToFirestore,
} from './writeFirestore';

loadImportCliEnv();

function printUsage(): void {
  console.log(`Usage: catalog-data-import [options]

Options:
  --source <path>         Catalog root (default: data/catalog-data)
  --catalog-version <id>  Release id (default: YYYY.MM.DD)
  --dry-run               Validate and print plan only (default)
  --write                 Write to Firestore (requires env credentials)
  --validate-only         Alias for --dry-run
  --emulator              Use Firestore emulator (sets host if unset)
  --publish               Also update catalogDataMeta/active (requires --write)
  --help                  Show this help
`);
}

function defaultCatalogVersion(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function parseArgs(argv: string[]) {
  let sourceRoot = join(process.cwd(), 'data', 'catalog-data');
  let catalogVersion = defaultCatalogVersion();
  let dryRun = true;
  let useEmulator = false;
  let publish = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      case '--source':
        sourceRoot = resolve(argv[++i] ?? '');
        break;
      case '--catalog-version':
        catalogVersion = argv[++i] ?? catalogVersion;
        break;
      case '--dry-run':
      case '--validate-only':
        dryRun = true;
        break;
      case '--write':
        dryRun = false;
        break;
      case '--emulator':
        useEmulator = true;
        break;
      case '--publish':
        publish = true;
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  return { sourceRoot, catalogVersion, dryRun, useEmulator, publish };
}

async function main(): Promise<void> {
  const { sourceRoot, catalogVersion, dryRun, useEmulator, publish } = parseArgs(
    process.argv.slice(2)
  );

  if (!existsSync(sourceRoot)) {
    console.error(`Source root not found: ${sourceRoot}`);
    process.exit(1);
  }

  if (useEmulator && !process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    console.log(`Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }

  const plan = buildImportPlan({ sourceRoot, catalogVersion });
  const report = buildDryRunReport(plan);
  console.log(formatDryRunReport(report));

  if (importPlanHasErrors(plan)) {
    console.error('\nImport plan has validation errors. Aborting.');
    process.exit(1);
  }

  if (dryRun) {
    console.log('\nDry-run complete. No Firestore writes performed.');
    process.exit(0);
  }

  const config = loadFirestoreWriteConfigFromEnv();
  await writeImportPlanToFirestore({
    config,
    catalogVersion,
    envelopes: plan.envelopes,
    release: plan.release,
    publishActive: publish,
  });

  console.log(`\nWrote ${plan.envelopes.length} documents to Firestore (${catalogVersion}).`);
  if (publish) {
    console.log('Updated catalogDataMeta/active.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
