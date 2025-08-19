import { useEffect, useRef, useState } from 'react';

export default function useExamSteps<T>(steps: T[]) {
  const [idx, setIdx] = useState(0);
  const completedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setIdx(0);
    completedRef.current.clear();
  }, [steps]);

  const total = steps.length || 1;
  const step = steps[idx];

  const goNext = () => setIdx(i => Math.min(total - 1, i + 1));
  const goPrev = () => setIdx(i => Math.max(0, i - 1));

  const advanceOnceFrom = (fromIndex: number, after?: () => void) => {
    if (completedRef.current.has(fromIndex)) return;
    completedRef.current.add(fromIndex);
    after?.();
    setIdx(i => Math.min(total - 1, i + 1));
  };

  const restart = () => {
    setIdx(0);
    completedRef.current.clear();
  };

  return { idx, step, total, goNext, goPrev, advanceOnceFrom, restart };
}
