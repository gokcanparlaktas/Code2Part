export type ProductCodeScanTarget = 'home' | 'compare-source' | 'compare-target';

interface PendingScanResult {
  target: ProductCodeScanTarget;
  text: string;
}

let pendingScanResult: PendingScanResult | null = null;

export function setPendingScanResult(target: ProductCodeScanTarget, text: string): void {
  pendingScanResult = { target, text: text.trim() };
}

export function takePendingScanResult(target: ProductCodeScanTarget): string | null {
  if (pendingScanResult?.target !== target) {
    return null;
  }

  const text = pendingScanResult.text;
  pendingScanResult = null;
  return text;
}
