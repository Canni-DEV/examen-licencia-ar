import { useEffect, useRef, useState } from 'react'

type TrialType = 'circle' | 'triangle' | 'distractor'
type Trial = { type: TrialType; isiMs: number }

type Props = {
  trialsCount?: number
  circleProb?: number
  distractorProb?: number
  isiRangeMs?: [number, number]
  respWindowMs?: number
  stimSizePx?: number
  onComplete?: (summary: {
    acc: number
    meanRt: number | null
    hits: number
    misses: number
    falseAlarms: number
    correctInhibitions: number
    pass: boolean
  }) => void
  compact?: boolean
}

export default function AttentionReactionTest({
  trialsCount = 1,
  circleProb = 0.4,
  distractorProb = 0.2,
  isiRangeMs = [800, 2000],
  respWindowMs = 1200,
  stimSizePx = 300,
  onComplete,
  compact = false
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Estado principal
  const [phase, setPhase] = useState<'idle' | 'isi' | 'stim' | 'finished'>('idle')
  const [trialIdx, setTrialIdx] = useState(0)
  const [trials, setTrials] = useState<Trial[]>([])
  const [awaitingResponse, setAwaitingResponse] = useState(false)

  // Refs para cortar callbacks "viejos"
  const phaseRef = useRef(phase)
  const runIdRef = useRef(0) // aumenta en cada start/finish
  useEffect(() => { phaseRef.current = phase }, [phase])

  // Timings y métricas
  const onsetRef = useRef<number>(0)
  const isiTimerRef = useRef<number | null>(null)
  const respTimerRef = useRef<number | null>(null)

  const rtsRef = useRef<number[]>([])
  const hitsRef = useRef(0)
  const missesRef = useRef(0)
  const falseAlarmsRef = useRef(0)
  const correctInhibRef = useRef(0)

  // Utils
  function clearAllTimers() {
    if (isiTimerRef.current) { window.clearTimeout(isiTimerRef.current); isiTimerRef.current = null }
    if (respTimerRef.current) { window.clearTimeout(respTimerRef.current); respTimerRef.current = null }
  }

  function clearCanvas() {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cvs.width, cvs.height)
  }

  function drawStim(type: TrialType) {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return
    const w = cvs.width, h = cvs.height
    ctx.clearRect(0, 0, w, h)

    const size = Math.min(stimSizePx, Math.floor(Math.min(w, h) * 0.8))
    const cx = w / 2, cy = h / 2

    if (type === 'circle') {
      ctx.fillStyle = '#FFD60A'
      ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, Math.PI * 2); ctx.fill()
    } else if (type === 'triangle') {
      ctx.fillStyle = '#0A84FF'
      ctx.beginPath()
      ctx.moveTo(cx, cy - size / 2)
      ctx.lineTo(cx - size / 2, cy + size / 2)
      ctx.lineTo(cx + size / 2, cy + size / 2)
      ctx.closePath(); ctx.fill()
    } else {
      ctx.fillStyle = '#FF3B30'
      const s = size * 0.8
      ctx.fillRect(cx - s / 2, cy - s / 2, s, s)
    }
  }

  // Responsive
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const resize = () => {
      const parent = cvs.parentElement
      if (!parent) return
      const w = Math.max(320, parent.clientWidth)
      const h = Math.max(280, 380)
      cvs.width = w; cvs.height = h
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Ensayos
  function genTrials() {
    const out: Trial[] = []
    for (let i = 0; i < trialsCount; i++) {
      const r = Math.random()
      let type: TrialType
      if (r < circleProb) type = 'circle'
      else if (r < circleProb + distractorProb) type = 'distractor'
      else type = 'triangle'
      const isi = Math.floor(isiRangeMs[0] + Math.random() * (isiRangeMs[1] - isiRangeMs[0]))
      out.push({ type, isiMs: isi })
    }
    setTrials(out)
  }

  // === Flujo con guards robustos ===
  function scheduleNext(nextIdx = trialIdx) {
    const localRunId = runIdRef.current

    // Si ya no hay más, finalizar
    if (nextIdx >= trials.length) { finish(); return }

    // Si ya terminamos, no continúes
    if (phaseRef.current === 'finished') return

    setAwaitingResponse(false)
    setPhase('isi')
    clearCanvas()
    clearAllTimers()

    const trial = trials[nextIdx]
    if (!trial) { finish(); return }
    const isiDelay = trial.isiMs

    isiTimerRef.current = window.setTimeout(() => {
      // Guardas contra callbacks viejos
      if (runIdRef.current !== localRunId || phaseRef.current === 'finished') return

      setPhase('stim')
      drawStim(trial.type)
      onsetRef.current = performance.now()
      setAwaitingResponse(true)

      respTimerRef.current = window.setTimeout(() => {
        if (runIdRef.current !== localRunId || phaseRef.current === 'finished') return

        if (trial.type === 'distractor') correctInhibRef.current++
        else missesRef.current++

        setTrialIdx(nextIdx + 1)
        scheduleNext(nextIdx + 1)
      }, respWindowMs)
    }, isiDelay)
  }

  function start() {
    // reset métricas
    hitsRef.current = 0; missesRef.current = 0
    falseAlarmsRef.current = 0; correctInhibRef.current = 0
    rtsRef.current = []
    setTrialIdx(0)
    genTrials()
    clearAllTimers()
    runIdRef.current += 1 // invalida cualquier callback previo
    setPhase('isi')
  }

  // Arranque del primer schedule cuando trials está listo
  useEffect(() => {
    if (phase === 'isi' && trials.length > 0 && trialIdx === 0) {
      scheduleNext(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trials])

  useEffect(() => () => clearAllTimers(), [])

  function handleResponse(which: 'circle' | 'triangle') {
    // solo durante el estímulo activo
    if (phaseRef.current !== 'stim' || !awaitingResponse) return

    const currIdx = trialIdx
    const trial = trials[currIdx]
    if (!trial) return

    if (respTimerRef.current) { window.clearTimeout(respTimerRef.current); respTimerRef.current = null }
    setAwaitingResponse(false)

    if (trial.type === 'distractor') {
      falseAlarmsRef.current++
    } else {
      const rt = performance.now() - onsetRef.current
      if (trial.type === which) { hitsRef.current++; rtsRef.current.push(rt) }
      else { falseAlarmsRef.current++ }
    }

    const nextIdx = currIdx + 1
    setTrialIdx(nextIdx)
    scheduleNext(nextIdx)
  }

  function finish() {
    clearAllTimers()
    setAwaitingResponse(false)
    setPhase('finished')
    runIdRef.current += 1 // invalida callbacks en vuelo
    clearCanvas()

    const totalTargets = trials.filter(t => t.type !== 'distractor').length
    const acc = totalTargets ? (hitsRef.current / totalTargets) : 0
    const meanRt = rtsRef.current.length
      ? (rtsRef.current.reduce((a, b) => a + b, 0) / rtsRef.current.length)
      : null
    const pass = acc >= 0.85 && (meanRt === null || meanRt <= 600)

    onComplete?.({
      acc, meanRt,
      hits: hitsRef.current,
      misses: missesRef.current,
      falseAlarms: falseAlarmsRef.current,
      correctInhibitions: correctInhibRef.current,
      pass
    })
  }

  function restart() {
    clearAllTimers()
    runIdRef.current += 1 // invalida cualquier callback aún pendiente
    setTrials([])
    setTrialIdx(0)
    setPhase('idle')
    clearCanvas()
  }

  // Teclado solo en fase de estímulo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'stim') return
      if (e.key === 'f' || e.key === 'F') handleResponse('circle')
      if (e.key === 'j' || e.key === 'J') handleResponse('triangle')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="rounded-2xl border p-4 sm:p-6 bg-white shadow-sm">
      {!compact && <h2 className="text-lg font-semibold mb-2">Atención + Reacción</h2>}

      <canvas ref={canvasRef} className="w-full block border rounded" aria-label="Responde al estímulo." />

      {!compact && (
        <p className="mt-2 text-sm text-gray-600">
          Círculo amarillo → “Círculo” (F). Triángulo azul → “Triángulo” (J). Cuadrado rojo → no presionar.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {phase === 'idle' && (
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white" onClick={start}>Iniciar</button>
        )}

        {phase === 'stim' && (
          <>
            <button className="px-4 py-2 rounded-xl border" onClick={() => handleResponse('circle')}>Círculo</button>
            <button className="px-4 py-2 rounded-xl border" onClick={() => handleResponse('triangle')}>Triángulo</button>
          </>
        )}

        {phase === 'finished' && !compact && (
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white" onClick={restart}>Reiniciar</button>
        )}
      </div>

      {phase === 'finished' && !compact && (
        <div className="mt-4 rounded-xl border p-3 text-sm">
          <p className="font-semibold mb-1">Test finalizado</p>
          <ul className="ml-5 list-disc">
            <li>Aciertos: {hitsRef.current}</li>
            <li>Omisiones: {missesRef.current}</li>
            <li>Falsas alarmas: {falseAlarmsRef.current}</li>
            <li>Inhibiciones correctas: {correctInhibRef.current}</li>
            <li>
              Precisión:{' '}
              {(() => {
                const totalTargets = trials.filter(t => t.type !== 'distractor').length || 1
                const acc = hitsRef.current / totalTargets
                return `${Math.round(acc * 100)}%`
              })()}
            </li>
            <li>
              RT medio:{' '}
              {rtsRef.current.length
                ? `${Math.round(rtsRef.current.reduce((a, b) => a + b, 0) / rtsRef.current.length)} ms`
                : '—'}
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
