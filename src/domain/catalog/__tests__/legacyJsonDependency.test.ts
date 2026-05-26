import fs from 'node:fs';
import path from 'node:path';

const LEGACY_RUNTIME_IMPORTS = [
  '@/data/productSeries.json',
  '@/data/hydraulicValveSeries.json',
  '@/data/equivalentSeries.json',
  '@/data/parsingRules.json',
  '@/data/exampleProductCodes.json',
  '@/data/hydraulicValveExampleCodes.json',
];

/** Paths under src/domain that may still import v1 JSON (diagnostics only). */
const ALLOWED_LEGACY_PREFIXES = ['validation/'];

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') {
        continue;
      }
      collectSourceFiles(fullPath, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function isAllowedLegacyFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  return ALLOWED_LEGACY_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

describe('legacy JSON dependency safety', () => {
  it('runtime domain logic does not import flat v1 catalog JSON', () => {
    const domainRoot = path.join(__dirname, '..', '..');
    const files = collectSourceFiles(domainRoot);
    const offenders: string[] = [];

    for (const file of files) {
      const relativeFile = path.relative(domainRoot, file);
      if (isAllowedLegacyFile(relativeFile)) {
        continue;
      }
      const content = fs.readFileSync(file, 'utf8');
      for (const legacyImport of LEGACY_RUNTIME_IMPORTS) {
        if (content.includes(legacyImport)) {
          offenders.push(`${relativeFile} -> ${legacyImport}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('catalog adapter loads v2 JSON only', () => {
    const adapterPath = path.join(
      __dirname,
      '..',
      'adapters',
      'catalogV2Adapter.ts'
    );
    const content = fs.readFileSync(adapterPath, 'utf8');
    expect(content).toContain('@/data/catalog/productSeries.v2.json');
    expect(content).not.toContain('@/data/productSeries.json');
  });
});
