import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../Button'

type Phase = 'idle' | 'waiting' | 'go'
type Summary = {
  trials: number
  valid: number
  tooSoon: number
  meanRt: number | null
  percentGood: number // 0..1
  pass: boolean
}

type Props = {
  trialsCount?: number              // default 5
  delayRangeMs?: [number, number]   // default [800, 2000]
  goodThresholdMs?: number          // default 600 -> "buena" reacción
  passRatio?: number                // default 0.6  -> 60%
  compact?: boolean
  onComplete?: (summary: Summary) => void
}

export default function ReactionTest({
  trialsCount = 3,
  delayRangeMs = [800, 2000],
  goodThresholdMs = 600,
  passRatio = 0.6,
  compact = false,
  onComplete,
}: Props) {
  const { t } = useTranslation()

  // Fase del intento actual
  const [phase, setPhase] = useState<Phase>('idle')
  const [trialIdx, setTrialIdx] = useState(0) // 0..trialsCount-1
  const [finished, setFinished] = useState(false)

  // Métricas
  const rtsRef = useRef<number[]>([])     // RTs válidos
  const tooSoonRef = useRef(0)            // se adelantó

  // Temporización
  const startRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)

  // Helpers
  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Inicia un intento
  function startTrial() {
    clearTimer()
    setPhase('waiting')
    const [min, max] = delayRangeMs
    const delay = Math.floor(min + Math.random() * (max - min))
    timerRef.current = window.setTimeout(() => {
      startRef.current = performance.now()
      setPhase('go')
    }, delay)
  }

  // Manejo del “clic” (botón o teclado)
  function press() {
    if (finished) return
    if (phase === 'waiting') {
      // Se adelantó
      clearTimer()
      tooSoonRef.current++
      nextOrFinish()
      return
    }
    if (phase === 'go') {
      const rt = Math.round(performance.now() - startRef.current)
      rtsRef.current.push(rt)
      nextOrFinish()
      return
    }
    // phase === 'idle' -> ignorar (o podrías iniciar)
  }

  // Avanza al siguiente intento o termina
  function nextOrFinish() {
    clearTimer()
    if (trialIdx + 1 >= trialsCount) {
      finish()
    } else {
      setTrialIdx((i) => i + 1)
      setPhase('idle')
    }
  }

  // Calcula resumen y finaliza
  function finish() {
    clearTimer()
    setFinished(true)
    setPhase('idle')

    const valid = rtsRef.current.length
    const trials = trialsCount
    const meanRt = valid ? Math.round(rtsRef.current.reduce((a, b) => a + b, 0) / valid) : null
    const good = rtsRef.current.filter((rt) => rt <= goodThresholdMs).length
    const percentGood = valid ? good / trials : 0 // sobre el total de intentos (incluye adelantamientos)
    const pass = percentGood >= passRatio

    const summary: Summary = {
      trials,
      valid,
      tooSoon: tooSoonRef.current,
      meanRt,
      percentGood,
      pass,
    }
    onComplete?.(summary)
  }

  // Reiniciar todo (solo práctica)
  function restart() {
    clearTimer()
    rtsRef.current = []
    tooSoonRef.current = 0
    setTrialIdx(0)
    setPhase('idle')
    setFinished(false)
  }

  // Limpieza al desmontar
  useEffect(() => clearTimer, [])

  // Teclado: Espacio/Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        press()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, phase])

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-background shadow-sm">
      {!compact && <h2 className="text-lg font-semibold mb-2">{t('psycho.reaction.title')}</h2>}
      {!compact && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('psycho.reaction.desc')}</p>}

      {/* Progreso */}
      {!finished && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Intento {trialIdx + 1} de {trialsCount}
        </p>
      )}

      {/* UI del intento */}
      {!finished && (
        <div className="flex flex-col items-center gap-4">
          {phase === 'idle' && (
            <Button onClick={startTrial}>{t('psycho.reaction.start') /* Comenzar intento */}</Button>
          )}

          {phase === 'waiting' && (
            <Button
              onClick={press}
              style={{ background: '#ff3b30' }}
              className="text-white"
              aria-live="polite"
            >
              {t('psycho.reaction.wait') /* Esperá la señal... */}
            </Button>
          )}

          {phase === 'go' && (
            <Button
              onClick={press}
              style={{ background: '#34c759' }}
              className="text-white animate-pulse"
              aria-live="assertive"
            >
              {t('psycho.reaction.click') /* ¡Ahora! */}
            </Button>
          )}
        </div>
      )}

      {/* Resumen final (práctica) */}
      {finished && !compact && (
        <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-background p-3 text-sm">
          <p className="font-semibold mb-2">Resumen</p>
          <ul className="ml-5 list-disc">
            <li>Intentos: {trialsCount}</li>
            <li>Válidos: {rtsRef.current.length}</li>
            <li>Se adelantó: {tooSoonRef.current}</li>
            <li>
              RT medio:{' '}
              {rtsRef.current.length ? `${Math.round(rtsRef.current.reduce((a,b)=>a+b,0)/rtsRef.current.length)} ms` : '—'}
            </li>
            <li>
              Buenos (≤ {goodThresholdMs} ms):{' '}
              {rtsRef.current.length
                ? `${Math.round((rtsRef.current.filter(rt => rt <= goodThresholdMs).length / trialsCount) * 100)}%`
                : '0%'}
            </li>
            <li>
              Resultado:{' '}
              {(() => {
                const pct = rtsRef.current.length
                  ? rtsRef.current.filter(rt => rt <= goodThresholdMs).length / trialsCount
                  : 0
                return pct >= passRatio ? 'Aprobado' : 'No aprobado'
              })()}
            </li>
          </ul>

          <div className="mt-3 flex gap-2">
            <Button onClick={restart}>Reiniciar</Button>
          </div>
        </div>
      )}

      {/* Acción para flujo de examen (compact) */}
      {finished && compact && (
        <div className="mt-3">
          <Button onClick={() => {
            const valid = rtsRef.current.length
            const good = rtsRef.current.filter(rt => rt <= goodThresholdMs).length
            const percentGood = valid ? good / trialsCount : 0
            const meanRt = valid ? Math.round(rtsRef.current.reduce((a,b)=>a+b,0)/valid) : null
            onComplete?.({
              trials: trialsCount,
              valid,
              tooSoon: tooSoonRef.current,
              meanRt,
              percentGood,
              pass: percentGood >= passRatio
            })
          }}>
            Continuar
          </Button>
        </div>
      )}
    </div>
  )
}
