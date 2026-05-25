export type VerificationStatus =
  | 'mock'
  | 'manual_unverified'
  | 'manual_verified'
  | 'source_verified';

export type SourceType =
  | 'mock'
  | 'catalog'
  | 'manufacturer_page'
  | 'standard'
  | 'manual';

export interface DataReliabilityMetadata {
  verificationStatus: VerificationStatus;
  sourceType: SourceType;
  sourceUrl: string | null;
  lastReviewedAt: string | null;
  notesTr: string | null;
}

export interface ReliabilitySummary {
  totalRecords: number;
  sourceVerifiedCount: number;
  manualVerifiedCount: number;
  manualUnverifiedCount: number;
  mockCount: number;
}

export const PRODUCT_SERIES_DEFAULT_METADATA: DataReliabilityMetadata = {
  verificationStatus: 'manual_unverified',
  sourceType: 'manual',
  sourceUrl: null,
  lastReviewedAt: null,
  notesTr:
    'MVP veri seti için manuel eklenmiştir. Gerçek katalog kaynağıyla doğrulanmalıdır.',
};

export const PARSER_RULE_DEFAULT_METADATA: DataReliabilityMetadata = {
  verificationStatus: 'manual_unverified',
  sourceType: 'manual',
  sourceUrl: null,
  lastReviewedAt: null,
  notesTr:
    'MVP veri seti için manuel eklenmiştir. Gerçek katalog kaynağıyla doğrulanmalıdır.',
};

export const EQUIVALENCE_GROUP_DEFAULT_METADATA: DataReliabilityMetadata = {
  verificationStatus: 'manual_unverified',
  sourceType: 'manual',
  sourceUrl: null,
  lastReviewedAt: null,
  notesTr:
    'Muadil eşleştirme MVP için manuel eklenmiştir. Gerçek uygulamada teknik katalog ve saha doğrulaması gerekir.',
};
