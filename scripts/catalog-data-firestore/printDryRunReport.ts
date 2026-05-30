import type { DryRunReport, ImportPlan, ValidationIssue } from './types';
import {
  catalogDocumentFirestorePath,
  releaseManifestFirestorePath,
} from './buildImportPlan';

export function partitionValidationIssues(issues: ValidationIssue[]): {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  return {
    errors: issues.filter((i) => i.level === 'error'),
    warnings: issues.filter((i) => i.level === 'warning'),
  };
}

export function buildDryRunReport(plan: ImportPlan): DryRunReport {
  const { errors, warnings } = partitionValidationIssues(plan.issues);
  const largest = plan.envelopes.reduce(
    (best, envelope) =>
      envelope.payloadByteSize > best.payloadByteSize ? envelope : best,
    plan.envelopes[0] ?? {
      relativePath: '(none)',
      payloadByteSize: 0,
    }
  );

  const firestorePaths = [
    releaseManifestFirestorePath(plan.catalogVersion),
    ...plan.envelopes.map((envelope) =>
      catalogDocumentFirestorePath(plan.catalogVersion, envelope.encodedDocumentId)
    ),
  ];

  return {
    catalogVersion: plan.catalogVersion,
    documentCount: plan.envelopes.length,
    manufacturers: plan.release.manufacturers,
    families: plan.release.families,
    runtimeUsedCount: plan.release.runtimeUsedCount,
    validationErrors: errors,
    validationWarnings: warnings,
    largestDocument: {
      relativePath: largest.relativePath,
      payloadByteSize: largest.payloadByteSize,
    },
    firestorePaths,
    checksumSummary: plan.release.checksumManifest,
  };
}

export function formatDryRunReport(report: DryRunReport): string {
  const lines: string[] = [
    'Catalog-data Firestore import (dry-run)',
    '========================================',
    `catalogVersion: ${report.catalogVersion}`,
    `documentCount: ${report.documentCount}`,
    `manufacturers: ${report.manufacturers.join(', ')}`,
    `families: rexroth=[${(report.families.rexroth ?? []).join(', ')}], yuken=[${(report.families.yuken ?? []).join(', ')}]`,
    `runtimeUsedCount: ${report.runtimeUsedCount}`,
    `largestDocument: ${report.largestDocument.relativePath} (${report.largestDocument.payloadByteSize} bytes)`,
    '',
    `validationErrors: ${report.validationErrors.length}`,
  ];

  for (const issue of report.validationErrors) {
    lines.push(`  ERROR ${issue.relativePath ?? ''}: ${issue.message}`);
  }

  lines.push('', `validationWarnings: ${report.validationWarnings.length}`);
  for (const issue of report.validationWarnings) {
    lines.push(`  WARN ${issue.relativePath ?? ''}: ${issue.message}`);
  }

  lines.push('', 'target Firestore paths:');
  for (const path of report.firestorePaths) {
    lines.push(`  ${path}`);
  }

  lines.push('', 'checksum summary:');
  for (const entry of report.checksumSummary) {
    lines.push(
      `  ${entry.encodedDocumentId} runtimeUsed=${entry.runtimeUsed} sha256=${entry.checksumSha256.slice(0, 12)}…`
    );
  }

  return lines.join('\n');
}
