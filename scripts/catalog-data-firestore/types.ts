export const CATALOG_DATA_SCHEMA_VERSION = 'catalog-data-v1';

export const MAX_PAYLOAD_BYTES = 900 * 1024;

export type CatalogManufacturer = 'rexroth' | 'yuken' | 'bearings';

export type CatalogCategory = 'directional-controls' | 'rolling-bearings';

export type CatalogScope = 'shared' | 'family' | 'index';

export type CatalogFamilyId = 'we' | 'dsg' | 'dshg' | 'standard-series';

export type CatalogDocumentType =
  | 'family_index'
  | 'spool_symbol_candidates'
  | 'mounting_surface_candidates'
  | 'connector_voltage_candidates'
  | 'technical_data_candidates'
  | 'parser_spec_candidate'
  | 'mapping_candidates'
  | 'catalog_source'
  | 'unknown_or_review'
  | 'bearing_family_index'
  | 'bearing_manufacturer_index'
  | 'brand_detection_candidates'
  | 'bore_code_candidates'
  | 'dimension_candidates'
  | 'series_candidates'
  | 'suffix_candidates'
  | 'generation_spec_candidate';

export interface ChecksumManifestEntry {
  documentKey: string;
  encodedDocumentId: string;
  relativePath: string;
  checksumSha256: string;
  runtimeUsed: boolean;
}

export interface CatalogDocumentEnvelope {
  catalogVersion: string;
  schemaVersion: string;
  manufacturer: CatalogManufacturer;
  category: CatalogCategory;
  scope: CatalogScope;
  familyId?: CatalogFamilyId;
  documentType: CatalogDocumentType;
  documentKey: string;
  encodedDocumentId: string;
  relativePath: string;
  payload: unknown;
  payloadFormat: 'json';
  checksumSha256: string;
  sourceUpdatedAt: string;
  importedAt: string;
  runtimeUsed: boolean;
  payloadByteSize: number;
}

export interface CatalogReleaseManifest {
  catalogVersion: string;
  schemaVersion: string;
  importedAt: string;
  sourceUpdatedAt: string;
  manufacturers: CatalogManufacturer[];
  categories: CatalogCategory[];
  families: Record<CatalogManufacturer, CatalogFamilyId[]>;
  documentCount: number;
  checksumManifest: ChecksumManifestEntry[];
  status: 'draft' | 'validated' | 'published';
  runtimeUsedCount: number;
}

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
  relativePath?: string;
}

export interface ImportPlan {
  catalogVersion: string;
  envelopes: CatalogDocumentEnvelope[];
  release: CatalogReleaseManifest;
  issues: ValidationIssue[];
}

export interface DryRunReport {
  catalogVersion: string;
  documentCount: number;
  manufacturers: CatalogManufacturer[];
  families: Partial<Record<CatalogManufacturer, CatalogFamilyId[]>>;
  runtimeUsedCount: number;
  validationErrors: ValidationIssue[];
  validationWarnings: ValidationIssue[];
  largestDocument: {
    relativePath: string;
    payloadByteSize: number;
  };
  firestorePaths: string[];
  checksumSummary: ChecksumManifestEntry[];
}
