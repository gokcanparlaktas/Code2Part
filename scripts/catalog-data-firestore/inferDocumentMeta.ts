import type {
  CatalogCategory,
  CatalogDocumentType,
  CatalogFamilyId,
  CatalogManufacturer,
  CatalogScope,
} from './types';
import { documentKeyFromRelativePath } from './encodeCatalogDocumentId';

const FILENAME_TO_DOCUMENT_TYPE: Record<string, CatalogDocumentType> = {
  'family-index.json': 'family_index',
  'spool-symbol-candidates.json': 'spool_symbol_candidates',
  'mounting-surface-candidates.json': 'mounting_surface_candidates',
  'technical-data-candidates.json': 'technical_data_candidates',
  'connector-voltage-candidates.json': 'connector_voltage_candidates',
  'parser-spec-candidate.json': 'parser_spec_candidate',
  'mapping-candidates.json': 'mapping_candidates',
  'catalog-source.json': 'catalog_source',
  'unknown-or-review.json': 'unknown_or_review',
};

export interface InferredDocumentMeta {
  manufacturer: CatalogManufacturer;
  category: CatalogCategory;
  scope: CatalogScope;
  familyId?: CatalogFamilyId;
  documentType: CatalogDocumentType;
  documentKey: string;
  relativePath: string;
  fileName: string;
}

export function inferDocumentMeta(relativePath: string): InferredDocumentMeta {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/');
  const fileName = segments[segments.length - 1] ?? '';

  const documentType = FILENAME_TO_DOCUMENT_TYPE[fileName];
  if (!documentType) {
    throw new Error(`Unknown catalog document file name: ${fileName}`);
  }

  const manufacturer = segments[0];
  if (manufacturer !== 'rexroth' && manufacturer !== 'yuken') {
    throw new Error(`Unsupported manufacturer segment: ${manufacturer}`);
  }

  const category = segments[1];
  if (category !== 'directional-controls') {
    throw new Error(`Unsupported category segment: ${category}`);
  }

  let scope: CatalogScope;
  let familyId: CatalogFamilyId | undefined;

  if (fileName === 'family-index.json') {
    scope = 'index';
  } else if (segments[2] === 'shared') {
    scope = 'shared';
  } else {
    scope = 'family';
    const familySegment = segments[2];
    if (familySegment !== 'we' && familySegment !== 'dsg' && familySegment !== 'dshg') {
      throw new Error(`Unsupported family segment: ${familySegment}`);
    }
    familyId = familySegment;
  }

  return {
    manufacturer,
    category,
    scope,
    familyId,
    documentType,
    documentKey: documentKeyFromRelativePath(normalized),
    relativePath: normalized,
    fileName,
  };
}

export function inferDocumentTypeFromFileName(fileName: string): CatalogDocumentType | null {
  return FILENAME_TO_DOCUMENT_TYPE[fileName] ?? null;
}
