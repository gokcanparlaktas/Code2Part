import { existsSync } from 'fs';
import { config } from 'dotenv';
import { join } from 'path';

/**
 * Loads repo-root `.env` for the catalog-data import CLI only.
 * Missing `.env` is ignored. Existing shell env vars take precedence.
 * Does not log variable values.
 */
export function loadImportCliEnv(cwd = process.cwd()): void {
  const envPath = join(cwd, '.env');
  if (!existsSync(envPath)) {
    return;
  }

  config({ path: envPath, override: false, quiet: true });
}
