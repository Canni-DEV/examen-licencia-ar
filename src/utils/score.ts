export type ResultLike = { ok: boolean };

export function theoryOk(items: ResultLike[]): number {
  return items.filter(r => r.ok).length;
}

export function pct(ok: number, total: number): number {
  const t = total || 1;
  return Math.round((ok / t) * 100);
}
