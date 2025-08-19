export type ReactionSummary = {
  attempts: { rt: number | null; tooSoon: boolean }[];
  meanRt: number | null;
  pass: boolean;
};
export type OcclusionSummary = {
  attempts: { hit: boolean; spatialErrorPct: number; timeout: boolean }[];
  pass: boolean;
  thresholdPct: number;
};
export type CoordSummary = {
  completed: boolean;
  left: { outsideSec: number; exits: number };
  right: { outsideSec: number; exits: number };
  pass?: boolean;
};
export type AttentionSummary = {
  acc: number;
  meanRt: number | null;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctInhibitions: number;
  pass: boolean;
};

export function normalizeReactionSummary(payload: unknown): ReactionSummary {
  const PASS_RT_MS = 600;
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).attempts)) {
    const p: any = payload;
    const attempts = p.attempts.map((a: any) => ({
      rt: typeof a?.rt === 'number' ? a.rt : null,
      tooSoon: !!a?.tooSoon
    }));
    const meanRt =
      typeof p.meanRt === 'number'
        ? p.meanRt
        : (attempts.filter((a: any) => a.rt != null).length
            ? attempts.reduce((acc: number, a: any) => acc + (a.rt ?? 0), 0) /
              attempts.filter((a: any) => a.rt != null).length
            : null);
    const pass = typeof p.pass === 'boolean' ? p.pass : (meanRt !== null && meanRt <= PASS_RT_MS);
    return { attempts, meanRt, pass };
  }
  if (typeof payload === 'number' || payload === null) {
    const rt = payload === null ? null : payload;
    const pass = rt !== null && rt <= PASS_RT_MS;
    return { attempts: [{ rt, tooSoon: false }], meanRt: rt, pass };
  }
  if (payload && typeof payload === 'object') {
    const p: any = payload;
    const rt = typeof p.ms === 'number' ? p.ms : (typeof p.meanRt === 'number' ? p.meanRt : null);
    const pass = typeof p.pass === 'boolean' ? p.pass : (rt !== null && rt <= PASS_RT_MS);
    return { attempts: [{ rt, tooSoon: false }], meanRt: rt, pass };
  }
  return { attempts: [], meanRt: null, pass: false };
}

export function normalizeOcclusionSummary(payload: unknown): OcclusionSummary {
  const DEFAULT_THRESHOLD = 50;
  if (payload && typeof payload === 'object') {
    const p: any = payload;
    if (Array.isArray(p.attempts)) {
      return {
        attempts: p.attempts.map((a: any) => ({
          hit: !!a?.hit,
          spatialErrorPct: typeof a?.spatialErrorPct === 'number' ? a.spatialErrorPct : (a?.errorPct ?? 0),
          timeout: !!a?.timeout
        })),
        pass: !!p.pass,
        thresholdPct: typeof p.thresholdPct === 'number' ? p.thresholdPct : DEFAULT_THRESHOLD
      };
    }
    if (typeof p.avgError === 'number') {
      const thr = typeof p.thresholdPct === 'number' ? p.thresholdPct : DEFAULT_THRESHOLD;
      return {
        attempts: [{ hit: p.avgError <= thr, spatialErrorPct: p.avgError, timeout: false }],
        pass: !!p.pass,
        thresholdPct: thr
      };
    }
  }
  return { attempts: [], pass: false, thresholdPct: DEFAULT_THRESHOLD };
}

export function normalizeCoordSummary(payload: unknown): CoordSummary {
  if (payload && typeof payload === 'object') {
    const p: any = payload;
    return {
      completed: !!p.completed,
      left: { outsideSec: Number(p?.left?.outsideSec ?? 0), exits: Number(p?.left?.exits ?? 0) },
      right:{ outsideSec: Number(p?.right?.outsideSec ?? 0), exits: Number(p?.right?.exits ?? 0) },
      pass: typeof p.pass === 'boolean' ? p.pass : !!p.completed
    };
  }
  return { completed: false, left: { outsideSec: 0, exits: 0 }, right: { outsideSec: 0, exits: 0 }, pass: false };
}

export function normalizeAttentionSummary(payload: unknown): AttentionSummary {
  if (payload && typeof payload === 'object') {
    const p: any = payload;
    return {
      acc: Number(p.acc ?? 0),
      meanRt: typeof p.meanRt === 'number' ? p.meanRt : null,
      hits: Number(p.hits ?? 0),
      misses: Number(p.misses ?? 0),
      falseAlarms: Number(p.falseAlarms ?? 0),
      correctInhibitions: Number(p.correctInhibitions ?? 0),
      pass: !!p.pass
    };
  }
  return { acc: 0, meanRt: null, hits: 0, misses: 0, falseAlarms: 0, correctInhibitions: 0, pass: false };
}
