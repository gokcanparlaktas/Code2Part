export type BearingCatalogSourceGroup = 'rolling-bearings';

export type BearingCatalogCategory = 'bearing';

export type BearingCatalogScope = 'shared' | 'family' | 'index';

export type BearingCatalogDocumentType =
  | 'bearing_family_index'
  | 'bearing_manufacturer_index'
  | 'brand_detection_candidates'
  | 'bore_code_candidates'
  | 'dimension_candidates'
  | 'series_candidates'
  | 'suffix_candidates'
  | 'parser_spec_candidate'
  | 'generation_spec_candidate'
  | 'mapping_candidates'
  | 'unknown_or_review';
