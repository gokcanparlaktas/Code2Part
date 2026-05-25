import type { CheckSeverity, RiskLevel } from '@/types/compatibility';

export function formatRiskLevel(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return 'Düşük risk';
    case 'medium':
      return 'Orta risk';
    case 'high':
      return 'Yüksek risk';
  }
}

export function formatCheckSeverity(severity: CheckSeverity): string {
  switch (severity) {
    case 'low':
      return 'Düşük risk';
    case 'medium':
      return 'Kontrol gerekli';
    case 'high':
      return 'Kritik kontrol';
  }
}

export function formatCollapsedRiskHint(
  risk: RiskLevel,
  hasCheckItems: boolean
): string {
  const riskLabel = formatRiskLevel(risk);
  if (hasCheckItems) {
    return `${riskLabel} · Kontrol gerekli`;
  }
  return riskLabel;
}
