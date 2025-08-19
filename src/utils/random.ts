export function fyShuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

export function pickRandom<T>(arr: T[], n: number): T[] {
  const m = Math.max(0, Math.min(n, arr.length));
  return fyShuffle(arr).slice(0, m);
}
