import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
} from '@/types/category';
import type { CanonicalMappingEntry } from '@/types/canonicalAttribute';

function coilRatingEntry(options: {
  id: string;
  rawToken: string;
  manufacturer?: string;
  series?: string;
  confidence?: CanonicalMappingEntry['confidence'];
  requiresCatalogCheck?: boolean;
  notes?: string[];
}): CanonicalMappingEntry {
  return {
    id: options.id,
    category: HYDRAULIC_VALVE_CATEGORY,
    manufacturer: options.manufacturer,
    series: options.series,
    attributeKey: 'coil_rating',
    rawToken: options.rawToken,
    canonicalKey: 'DC_24V',
    canonicalValue: 'DC_24V',
    displayValue: '24V DC',
    evidence: 'code',
    confidence: options.confidence ?? 'high',
    requiresCatalogCheck: options.requiresCatalogCheck ?? false,
    resolvedAttributeKey: 'coil_voltage',
    notes: options.notes,
  };
}

function coilRating12VEntry(id: string, rawToken: string): CanonicalMappingEntry {
  return {
    id,
    category: HYDRAULIC_VALVE_CATEGORY,
    attributeKey: 'coil_rating',
    rawToken,
    canonicalKey: 'DC_12V',
    canonicalValue: 'DC_12V',
    displayValue: '12V DC',
    evidence: 'code',
    confidence: 'high',
    requiresCatalogCheck: false,
    resolvedAttributeKey: 'coil_voltage',
  };
}

function cushioningEntry(
  id: string,
  rawToken: string,
  canonicalKey: string,
  displayValue: string,
): CanonicalMappingEntry {
  return {
    id,
    category: PNEUMATIC_CYLINDER_CATEGORY,
    attributeKey: 'cushioning_type',
    rawToken,
    canonicalKey,
    canonicalValue: canonicalKey,
    displayValue,
    evidence: 'code',
    confidence: 'high',
    requiresCatalogCheck: false,
  };
}

/** Local canonical mappings (Firestore-ready shape). */
export const CANONICAL_MAPPING_ENTRIES: CanonicalMappingEntry[] = [
  // coil_rating → coil_voltage (24V DC)
  coilRatingEntry({ id: 'coil_rating_g24', rawToken: 'G24' }),
  coilRatingEntry({ id: 'coil_rating_eg24', rawToken: 'EG24' }),
  coilRatingEntry({ id: 'coil_rating_cg24', rawToken: 'CG24' }),
  coilRatingEntry({ id: 'coil_rating_hg24', rawToken: 'HG24' }),
  coilRatingEntry({ id: 'coil_rating_d24', rawToken: 'D24' }),
  coilRatingEntry({ id: 'coil_rating_24dc', rawToken: '24DC' }),
  coilRatingEntry({ id: 'coil_rating_dc24', rawToken: 'DC24' }),
  coilRatingEntry({
    id: 'coil_rating_vickers_h',
    rawToken: 'H',
    manufacturer: 'Vickers',
    confidence: 'medium',
    requiresCatalogCheck: true,
    notes: ['Vickers DG4V coil rating segment; catalog verification required.'],
  }),

  coilRating12VEntry('coil_rating_g12', 'G12'),
  coilRating12VEntry('coil_rating_d12', 'D12'),

  // pneumatic cushioning
  cushioningEntry(
    'cushioning_ppva',
    'PPVA',
    'ADJUSTABLE_PNEUMATIC_CUSHIONING',
    'Ayarlanabilir pnömatik sönümleme',
  ),
  cushioningEntry(
    'cushioning_ppv',
    'PPV',
    'ADJUSTABLE_PNEUMATIC_CUSHIONING',
    'Ayarlanabilir pnömatik sönümleme',
  ),
  cushioningEntry(
    'cushioning_ppsa',
    'PPSA',
    'SELF_ADJUSTING_PNEUMATIC_CUSHIONING',
    'Kendinden ayarlı pnömatik sönümleme',
  ),
  cushioningEntry(
    'cushioning_pps',
    'PPS',
    'SELF_ADJUSTING_PNEUMATIC_CUSHIONING',
    'Kendinden ayarlı pnömatik sönümleme',
  ),

  // Festo DSBC variant_code N3 supports ISO 15552 (code evidence; primary standard from series table)
  {
    id: 'festo_dsbc_variant_n3',
    category: PNEUMATIC_CYLINDER_CATEGORY,
    manufacturer: 'Festo',
    series: 'DSBC',
    attributeKey: 'variant_code',
    rawToken: 'N3',
    canonicalKey: 'ISO_15552',
    canonicalValue: 'ISO_15552',
    displayValue: 'ISO 15552',
    evidence: 'code',
    confidence: 'high',
    requiresCatalogCheck: false,
    sourceDocument: 'Festo DSBC type code',
    notes: ['Variant token supporting ISO 15552; primary standard_family comes from series catalog.'],
  },
];
