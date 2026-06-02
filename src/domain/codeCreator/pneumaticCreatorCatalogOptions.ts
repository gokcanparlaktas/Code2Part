import { getCatalogEquivalenceGroups, getCatalogSeriesById } from '@/domain/catalog/adapters/catalogV2Adapter';
import type { CatalogKnownToken } from '@/types/catalog';
import type { CodeCreatorFieldOption } from '@/types/productCodeCreator';

const PNEUMATIC_ISO_GROUP_ID = 'pneumatic_iso_15552_cylinder';

const FALLBACK_VARIANTS: CodeCreatorFieldOption[] = [
  { value: 'N3', labelTr: 'Var (N3 — sensör yuvası)' },
  { value: 'D', labelTr: 'Var (D — strok sonu)' },
  { value: 'A', labelTr: 'Var (A — strok sonu)' },
];

const PREFERRED_CUSHIONING_ORDER = ['PPVA', 'PPSA'];

function aggregateKnownTokens(role: CatalogKnownToken['role']): CodeCreatorFieldOption[] {
  const group = getCatalogEquivalenceGroups().find((entry) => entry.id === PNEUMATIC_ISO_GROUP_ID);
  if (!group) {
    return [];
  }

  const byToken = new Map<string, CodeCreatorFieldOption>();

  for (const seriesId of group.seriesIds) {
    const series = getCatalogSeriesById(seriesId);
    for (const known of series?.knownTokens ?? []) {
      if (known.role !== role) {
        continue;
      }
      if (!byToken.has(known.token)) {
        byToken.set(known.token, {
          value: known.token,
          labelTr: `Var (${known.token} — ${known.meaningTr})`,
        });
      }
    }
  }

  return [...byToken.values()].sort((a, b) => a.labelTr.localeCompare(b.labelTr, 'tr'));
}

/** UI: yalnızca Var / Yok — sipariş kodu seri kataloğundan seçilir. */
export function buildPneumaticCushioningOptions(): CodeCreatorFieldOption[] {
  return [
    { value: 'none', labelTr: 'Yok' },
    { value: 'with', labelTr: 'Var' },
  ];
}

export function buildPneumaticVariantOptions(): CodeCreatorFieldOption[] {
  const sensor = aggregateKnownTokens('sensor');
  const options = aggregateKnownTokens('options');
  const merged = new Map<string, CodeCreatorFieldOption>();
  for (const entry of [...sensor, ...options, ...FALLBACK_VARIANTS]) {
    merged.set(entry.value, entry);
  }

  return [{ value: 'none', labelTr: 'Yok' }, ...merged.values()];
}

function cushioningTokensForSeries(seriesId: string): CatalogKnownToken[] {
  const series = getCatalogSeriesById(seriesId);
  return (series?.knownTokens ?? []).filter((known) => known.role === 'cushioning');
}

/**
 * Kullanıcı "Var" seçtiğinde o serinin katalog sönümleme kodunu döner (ör. Festo PPVA, SMC PPVA).
 * Eski doğrudan token seçimi (PPVA) yalnızca seri o kodu destekliyorsa kabul edilir.
 */
export function resolveSeriesCushioningToken(
  seriesId: string,
  cushioningSelection: string | null | undefined
): string | null {
  if (!cushioningSelection || cushioningSelection === 'none') {
    return null;
  }

  const seriesTokens = cushioningTokensForSeries(seriesId);

  if (cushioningSelection !== 'with') {
    const explicit = seriesTokens.find((known) => known.token === cushioningSelection);
    return explicit?.token ?? null;
  }

  if (seriesTokens.length === 0) {
    return PREFERRED_CUSHIONING_ORDER[0] ?? null;
  }

  for (const preferred of PREFERRED_CUSHIONING_ORDER) {
    const match = seriesTokens.find((known) => known.token === preferred);
    if (match) {
      return match.token;
    }
  }

  return seriesTokens[0]?.token ?? null;
}
