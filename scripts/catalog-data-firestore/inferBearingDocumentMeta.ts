import type {
  BearingCatalogCategory,
  BearingCatalogDocumentType,
  BearingCatalogScope,
  BearingCatalogSourceGroup,
} from './bearingFirestoreTypes';
import { documentKeyFromRelativePath } from './encodeCatalogDocumentId';

const FILENAME_TO_DOCUMENT_TYPE: Record<string, BearingCatalogDocumentType> = {
  'family-index.json': 'bearing_family_index',
  'manufacturer-index.json': 'bearing_manufacturer_index',
  'brand-detection-candidates.json': 'brand_detection_candidates',
  'bore-code-candidates.json': 'bore_code_candidates',
  'dimension-candidates.json': 'dimension_candidates',
  'series-candidates.json': 'series_candidates',
  'suffix-candidates.json': 'suffix_candidates',
  'parser-spec-candidate.json': 'parser_spec_candidate',
  'generation-spec-candidate.json': 'generation_spec_candidate',
  'mapping-candidates.json': 'mapping_candidates',
  'unknown-or-review.json': 'unknown_or_review',
};

export interface InferredBearingDocumentMeta {
  sourceGroup: BearingCatalogSourceGroup;
  category: BearingCatalogCategory;
  scope: BearingCatalogScope;
  familyId?: 'standard-series';
  documentType: BearingCatalogDocumentType;
  documentKey: string;
  relativePath: string;
  fileName: string;
}

export function inferBearingDocumentMeta(relativePath: string): InferredBearingDocumentMeta {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/');
  const fileName = segments[segments.length - 1] ?? '';

  const documentType = FILENAME_TO_DOCUMENT_TYPE[fileName];
  if (!documentType) {
    throw new Error(`Unknown bearing catalog document file name: ${fileName}`);
  }

  if (segments[0] !== 'bearings' || segments[1] !== 'rolling-bearings') {
    throw new Error(`Unsupported bearings catalog path: ${normalized}`);
  }

  let scope: BearingCatalogScope;
  let familyId: 'standard-series' | undefined;

  if (fileName === 'family-index.json') {
    scope = 'index';
  } else if (segments[2] === 'manufacturers') {
    scope = 'index';
  } else if (segments[2] === 'shared') {
    scope = 'shared';
  } else if (segments[2] === 'standard-series') {
    scope = 'family';
    familyId = 'standard-series';
  } else {
    throw new Error(`Unsupported bearings path segment layout: ${normalized}`);
  }

  return {
    sourceGroup: 'rolling-bearings',
    category: 'bearing',
    scope,
    familyId,
    documentType,
    documentKey: documentKeyFromRelativePath(normalized),
    relativePath: normalized,
    fileName,
  };
}
