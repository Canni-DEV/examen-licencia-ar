/** Helpers simples y tipados para localStorage */
export function getLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage lleno o bloqueado */
  }
}

/** Hook controlado */
import { useEffect, useState } from 'react';
export function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => getLS<T>(key, initial));
  useEffect(() => setLS<T>(key, state), [key, state]);
  return [state, setState] as const;
}
