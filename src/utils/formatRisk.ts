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
      return 'Düşük öncelik';
    case 'medium':
      return 'Orta öncelik';
    case 'high':
      return 'Yüksek öncelik';
  }
}
