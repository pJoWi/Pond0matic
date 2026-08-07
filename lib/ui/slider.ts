export function clampToStep(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  const snapped = min + Math.round((clamped - min) / step) * step;
  return Math.min(max, Math.max(min, snapped));
}

export function bpsToPct(bps: number): string {
  return (bps / 100).toFixed(2);
}
