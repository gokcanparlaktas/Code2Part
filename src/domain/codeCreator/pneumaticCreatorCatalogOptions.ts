import { getCatalogEquivalenceGroups, getCatalogSeriesById } from '@/domain/catalog/adapters/catalogV2Adapter';
import type { CatalogKnownToken } from '@/types/catalog';
import type { CodeCreatorFieldOption } from '@/types/productCodeCreator';

const PNEUMATIC_ISO_GROUP_ID = 'pneumatic_iso_15552_cylinder';

/** Festo sipariş kodu sönümleme tokenları; diğer markalara uygulanmaz. */
const FESTO_CUSHIONING_TOKENS = new Set(['PPVA', 'PPSA', 'PPV', 'PPS', 'P']);

/** Tek harfli strok sonu tokenları; ayrı alanlarda marka kodu ile çözülür. */
const AMBIGUOUS_EXTRA_TOKENS = new Set(['D', 'A']);

/**
 * Kod üreticide "Sönümleme: Var" seçildiğinde seriye özgü varsayılan suffix.
 * Tanımsız serilerde basit suffix yoktur; katalog sipariş anahtarı ayrıca doğrulanmalıdır.
 */
const SERIES_CUSHIONING_SUFFIX_TOKEN: Record<string, string> = {
  festo_dsbc: 'PPVA',
  festo_adn: 'P',
  festo_dsnu: 'P',
  smc_cp96: 'C',
};

/** Sensör yuvası / konum algılama — yalnızca basit tire-suffix şablonunda. */
const SERIES_SENSOR_SUFFIX_TOKEN: Record<string, string> = {
  festo_dsbc: 'N3',
  festo_adn: 'A',
  festo_dsnu: 'A',
};

/** Kod üreticide seçilen mil ucu tipi. */
export type PneumaticRodEndCreatorKey = 'none' | 'male_external' | 'female_internal';

/** Seri + mil ucu tipi → sipariş kodu token (yalnızca basit tire-suffix şablonunda). */
const SERIES_ROD_END_TOKEN_BY_TYPE: Record<
  string,
  Partial<Record<Exclude<PneumaticRodEndCreatorKey, 'none'>, string>>
> = {
  festo_adn: { female_internal: 'I' },
  parker_p1d: { male_external: 'N' },
};

function aggregateKnownTokens(role: CatalogKnownToken['role']): CatalogKnownToken[] {
  const group = getCatalogEquivalenceGroups().find((entry) => entry.id === PNEUMATIC_ISO_GROUP_ID);
  if (!group) {
    return [];
  }

  const byToken = new Map<string, CatalogKnownToken>();

  for (const seriesId of group.seriesIds) {
    const series = getCatalogSeriesById(seriesId);
    for (const known of series?.knownTokens ?? []) {
      if (known.role !== role) {
        continue;
      }
      if (!byToken.has(known.token)) {
        byToken.set(known.token, known);
      }
    }
  }

  return [...byToken.values()].sort((a, b) => a.token.localeCompare(b.token, 'tr'));
}

function yesNoOptions(): CodeCreatorFieldOption[] {
  return [
    { value: 'none', labelTr: 'Yok' },
    { value: 'with', labelTr: 'Var' },
  ];
}

/** UI: yalnızca Var / Yok — sipariş kodu seri kataloğundan seçilir. */
export function buildPneumaticCushioningOptions(): CodeCreatorFieldOption[] {
  return yesNoOptions();
}

/** Sensör yuvası veya konum algılama (manyetik piston dahil). */
export function buildPneumaticSensorOptions(): CodeCreatorFieldOption[] {
  return yesNoOptions();
}

/** Mil ucu / diş tipi — Var/Yok değil, bağlantı tipi seçilir. */
export function buildPneumaticRodEndOptions(): CodeCreatorFieldOption[] {
  return [
    { value: 'none', labelTr: 'Belirtilmedi' },
    { value: 'male_external', labelTr: 'Dış diş (erkek)' },
    { value: 'female_internal', labelTr: 'İç diş (dişi)' },
  ];
}

/** Montaj ve diğer net adlandırılmış ek seçenekler (SDB vb.). */
export function buildPneumaticExtraOptions(): CodeCreatorFieldOption[] {
  const extras = aggregateKnownTokens('options')
    .filter((known) => !AMBIGUOUS_EXTRA_TOKENS.has(known.token))
    .map((known) => ({
      value: known.token,
      labelTr: `${known.token} — ${known.meaningTr ?? 'Ek seçenek'}`,
    }))
    .sort((a, b) => a.labelTr.localeCompare(b.labelTr, 'tr'));

  return [{ value: 'none', labelTr: 'Yok' }, ...extras];
}

function cushioningTokensForSeries(seriesId: string): CatalogKnownToken[] {
  const series = getCatalogSeriesById(seriesId);
  return (series?.knownTokens ?? []).filter((known) => known.role === 'cushioning');
}

function seriesHasKnownToken(seriesId: string, token: string, role: CatalogKnownToken['role']): boolean {
  const series = getCatalogSeriesById(seriesId);
  return (series?.knownTokens ?? []).some((known) => known.role === role && known.token === token);
}

/**
 * Kullanıcı "Var" seçildiğinde o serinin katalog sönümleme kodunu döner (ör. Festo PPVA, SMC C).
 * Eski doğrudan token seçimi yalnızca seri o kodu destekliyorsa kabul edilir.
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

  const mapped = SERIES_CUSHIONING_SUFFIX_TOKEN[seriesId];
  if (mapped) {
    return mapped;
  }

  const brandSpecific = seriesTokens.find((known) => !FESTO_CUSHIONING_TOKENS.has(known.token));
  return brandSpecific?.token ?? null;
}

export function resolveSeriesSensorToken(
  seriesId: string,
  sensorSelection: string | null | undefined
): string | null {
  if (!sensorSelection || sensorSelection === 'none') {
    return null;
  }

  if (sensorSelection !== 'with') {
    return seriesHasKnownToken(seriesId, sensorSelection, 'sensor') ? sensorSelection : null;
  }

  return SERIES_SENSOR_SUFFIX_TOKEN[seriesId] ?? null;
}

export function resolveSeriesRodEndToken(
  seriesId: string,
  rodEndSelection: string | null | undefined
): string | null {
  if (!rodEndSelection || rodEndSelection === 'none') {
    return null;
  }

  if (
    rodEndSelection !== 'male_external' &&
    rodEndSelection !== 'female_internal'
  ) {
    return null;
  }

  return SERIES_ROD_END_TOKEN_BY_TYPE[seriesId]?.[rodEndSelection] ?? null;
}

export function resolveSeriesExtraToken(
  seriesId: string,
  extraSelection: string | null | undefined
): string | null {
  if (!extraSelection || extraSelection === 'none') {
    return null;
  }

  return seriesHasKnownToken(seriesId, extraSelection, 'options') ? extraSelection : null;
}
