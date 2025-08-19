import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../../components/Button'
import ProgressBar from '../../components/ProgressBar'
import { TheoryStep, SignsStep, ReactionStep, VelocityStep, CoordStep, AttentionStep } from './steps'
import { publicPath } from '../../utils/paths'
import type { Question } from '../../types'
import { pickRandom } from '../../utils/random'
import {
  normalizeReactionSummary,
  normalizeOcclusionSummary,
  normalizeCoordSummary,
  normalizeAttentionSummary,
  type ReactionSummary,
  type OcclusionSummary,
  type CoordSummary,
  type AttentionSummary,
} from '../../utils/normalizers'
import { theoryOk, pct } from '../../utils/score'
import useExamSteps from './useExamSteps'

// ===================== Configuración fija =====================
const DATA_LANG = 'es'         
const THEORY_COUNT = 1
const SIGNS_COUNT  = 1  
const THEORY_PASS_RATIO = 0.70
const SIGNS_PASS_RATIO  = 0.80

// ===================== Tipos internos =====================
type Step =
  | { type: 'theory'; q: Question }
  | { type: 'sign';   q: Question }
  | { type: 'psy_react' }
  | { type: 'psy_vel' }
  | { type: 'psy_coord' }
  | { type: 'psy_attn' }
  | { type: 'summary' }

type TheoryResult = {
  id: string
  texto: string
  opciones: string[]
  correcta: number
  elegida: number | null
  ok: boolean
  tipo: 'theory' | 'sign'
}

// ===================== Página =====================
export default function FullExamPage() {
  const { t } = useTranslation()

  const [steps, setSteps] = useState<Step[]>([])
  const { idx, step, total, goNext, goPrev, advanceOnceFrom, restart } = useExamSteps(steps)

  const [answers, setAnswers] = useState<Record<string, number | null>>({})

  const [reactSum, setReactSum] = useState<ReactionSummary | null>(null)
  const [velSum,   setVelSum]   = useState<OcclusionSummary | null>(null)
  const [coordSum, setCoordSum] = useState<CoordSummary | null>(null)
  const [attnSum,  setAttnSum]  = useState<AttentionSummary | null>(null)

  const [pickedTheory, setPickedTheory] = useState<Question[]>([])
  const [pickedSigns,  setPickedSigns]  = useState<Question[]>([])

  const load = async () => {
    const [theory, signs]: [Question[], Question[]] = await Promise.all([
      fetch(publicPath(`/data/${DATA_LANG}/preguntas_teoricas.json`)).then(r => r.json()),
      fetch(publicPath(`/data/${DATA_LANG}/preguntas_senales.json`)).then(r => r.json())
    ])

    const tPick = pickRandom<Question>(theory, THEORY_COUNT)
    const sPick = pickRandom<Question>(signs,  SIGNS_COUNT)

    setPickedTheory(tPick)
    setPickedSigns(sPick)

    // map tipado para no ampliar el discriminante a 'string'
    const theorySteps: Step[] = tPick.map((q): Step => ({ type: 'theory', q }))
    const signSteps:   Step[] = sPick.map((q): Step => ({ type: 'sign', q }))

    const seq: Step[] = [
      ...theorySteps,
      ...signSteps,
      { type: 'psy_react' },
      { type: 'psy_vel' },
      { type: 'psy_coord' },
      { type: 'psy_attn' },
      { type: 'summary' }
    ]
    setSteps(seq)
    setAnswers({})
    setReactSum(null); setVelSum(null); setCoordSum(null); setAttnSum(null)
    restart()
  }

  useEffect(() => {
    load()
  }, [])

  const canPrev = idx > 0
  const canNext = useMemo(() => {
    if (!step) return false
    if (step.type === 'theory' || step.type === 'sign') {
      const a = answers[step.q.id]
      return a !== undefined && a !== null
    }
    if (step.type === 'summary') return false
    return true
  }, [step, answers])

  const handleRestart = () => {
    load()
  }

  // ===== resumen =====
  const theoryResults: TheoryResult[] = useMemo(() => {
    return pickedTheory.map(q => {
      const elegida = answers[q.id] ?? null
      const ok = elegida !== null && elegida === q.correcta
      return { id: q.id, texto: q.texto, opciones: q.opciones, correcta: q.correcta, elegida, ok, tipo: 'theory' }
    })
  }, [pickedTheory, answers])

  const signsResults: TheoryResult[] = useMemo(() => {
    return pickedSigns.map(q => {
      const elegida = answers[q.id] ?? null
      const ok = elegida !== null && elegida === q.correcta
      return { id: q.id, texto: q.texto, opciones: q.opciones, correcta: q.correcta, elegida, ok, tipo: 'sign' }
    })
  }, [pickedSigns, answers])

  const theoryScore = useMemo(() => {
    const ok = theoryResults.filter(r => r.ok).length
    const tot = theoryResults.length || 1
    return { ok, total: tot, ratio: ok / tot }
  }, [theoryResults])

  const signsScore = useMemo(() => {
    const ok = signsResults.filter(r => r.ok).length
    const tot = signsResults.length || 1
    return { ok, total: tot, ratio: ok / tot }
  }, [signsResults])

  const theoryPass = theoryScore.ratio >= THEORY_PASS_RATIO
  const signsPass  = signsScore.ratio  >= SIGNS_PASS_RATIO

  const psychPass =
    (reactSum?.pass ?? false) &&
    (velSum?.pass ?? false) &&
    ((coordSum?.pass !== undefined ? coordSum.pass : (coordSum?.completed ?? false))) &&
    (attnSum?.pass ?? false)

  const overallPass = theoryPass && signsPass && psychPass

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('exam.full')}</h1>
      <ProgressBar value={Math.min(idx + 1, total)} max={total} />

      {/* Preguntas */}
      {step?.type === 'theory' && (
        <TheoryStep
          question={step.q}
          selected={answers[step.q.id] ?? null}
          onSelect={(sel) => setAnswers(a => ({ ...a, [step.q.id]: sel }))}
        />
      )}
      {step?.type === 'sign' && (
        <SignsStep
          question={step.q}
          selected={answers[step.q.id] ?? null}
          onSelect={(sel) => setAnswers(a => ({ ...a, [step.q.id]: sel }))}
        />
      )}

      {/* Psico — nota: key={idx} para forzar remount y evitar efectos/timers viejos */}
      {step?.type === 'psy_react' && (
        <ReactionStep
          key={idx}
          onComplete={(sum) => {
            const from = idx
            advanceOnceFrom(from, () => setReactSum(normalizeReactionSummary(sum)))
          }}
        />
      )}

      {step?.type === 'psy_vel' && (
        <VelocityStep
          key={idx}
          onComplete={(sum) => {
            const from = idx
            advanceOnceFrom(from, () => setVelSum(normalizeOcclusionSummary(sum)))
          }}
        />
      )}

      {step?.type === 'psy_coord' && (
        <CoordStep
          key={idx}
          onComplete={(sum) => {
            const from = idx
            advanceOnceFrom(from, () => setCoordSum(normalizeCoordSummary(sum)))
          }}
        />
      )}

      {step?.type === 'psy_attn' && (
        <AttentionStep
          key={idx}
          onComplete={(sum) => {
            const from = idx
            advanceOnceFrom(from, () => setAttnSum(normalizeAttentionSummary(sum)))
          }}
        />
      )}

      {/* Resumen */}
      {step?.type === 'summary' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-background shadow-sm space-y-6">
          <h2 className="text-xl font-semibold">Resumen del examen</h2>

          <div>
            <h3 className="font-semibold mb-2">Preguntas teóricas</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Correctas: {theoryOk(theoryResults)}/{theoryResults.length} ({pct(theoryOk(theoryResults), theoryResults.length)}%) ·
              Umbral: {Math.round(THEORY_PASS_RATIO*100)}% · {theoryPass ? 'Aprobado' : 'No aprobado'}
            </p>
            <ol className="space-y-2 list-decimal ml-5">
              {theoryResults.map(r => (
                <li key={r.id}>
                  <div className="text-sm">
                    <span className="font-medium">{r.texto}</span><br/>
                    <span className={r.ok ? 'text-green-700' : 'text-red-700'}>
                      Tu respuesta: {r.elegida !== null ? r.opciones[r.elegida] : '—'} {r.ok ? '✓' : '✗'}
                    </span>
                    {!r.ok && <span className="text-gray-700 dark:text-gray-300"> • Correcta: {r.opciones[r.correcta]}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Preguntas sobre señales</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Correctas: {theoryOk(signsResults)}/{signsResults.length} ({pct(theoryOk(signsResults), signsResults.length)}%) ·
              Umbral: {Math.round(SIGNS_PASS_RATIO*100)}% · {signsPass ? 'Aprobado' : 'No aprobado'}
            </p>
            <ol className="space-y-2 list-decimal ml-5">
              {signsResults.map(r => (
                <li key={r.id}>
                  <div className="text-sm">
                    <span className="font-medium">{r.texto}</span><br/>
                    <span className={r.ok ? 'text-green-700' : 'text-red-700'}>
                      Tu respuesta: {r.elegida !== null ? r.opciones[r.elegida] : '—'} {r.ok ? '✓' : '✗'}
                    </span>
                    {!r.ok && <span className="text-gray-700 dark:text-gray-300"> • Correcta: {r.opciones[r.correcta]}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Evaluación psicofísica</h3>

            <div className="text-sm">
              <p className="font-medium">Reacción simple</p>
              {reactSum ? (
                <ul className="ml-5 list-disc">
                  <li>Intentos: {reactSum.attempts.length}</li>
                  <li>RT medio: {reactSum.meanRt !== null ? `${Math.round(reactSum.meanRt)} ms` : '—'}</li>
                  <li>Resultado: {reactSum.pass ? 'Aprobado' : 'No aprobado'}</li>
                </ul>
              ) : <p className="text-gray-600 dark:text-gray-400">Sin datos.</p>}
            </div>

            <div className="text-sm">
              <p className="font-medium">Velocidad constante con ocultamiento</p>
              {velSum ? (
                <ul className="ml-5 list-disc">
                  <li>Intentos: {velSum.attempts.length}</li>
                  <li>Aciertos: {velSum.attempts.filter(a => a.hit).length}</li>
                  <li>Error espacial medio: {
                    (() => {
                      const nums = velSum.attempts.map(a => a.spatialErrorPct).filter(n => Number.isFinite(n))
                      if (!nums.length) return '—'
                      const m = nums.reduce((x,y)=>x+y,0)/nums.length
                      return `${m.toFixed(1)}%`
                    })()
                  }</li>
                  <li>Umbral de aprobación: ≤ {velSum.thresholdPct}%</li>
                  <li>Resultado: {velSum.pass ? 'Aprobado' : 'No aprobado'}</li>
                </ul>
              ) : <p className="text-gray-600 dark:text-gray-400">Sin datos.</p>}
            </div>

            <div className="text-sm">
              <p className="font-medium">Coordinación bimanual</p>
              {coordSum ? (
                <ul className="ml-5 list-disc">
                  <li>Completado por duración: {coordSum.completed ? 'Sí' : 'No (descalificado por fuera de carril)'}</li>
                  <li>Izq: fuera {coordSum.left.outsideSec.toFixed(2)} s · salidas {coordSum.left.exits}</li>
                  <li>Der: fuera {coordSum.right.outsideSec.toFixed(2)} s · salidas {coordSum.right.exits}</li>
                  <li>Resultado: {(coordSum.pass ?? coordSum.completed) ? 'Aprobado' : 'No aprobado'}</li>
                </ul>
              ) : <p className="text-gray-600 dark:text-gray-400">Sin datos.</p>}
            </div>

            <div className="text-sm">
              <p className="font-medium">Atención + Reacción</p>
              {attnSum ? (
                <ul className="ml-5 list-disc">
                  <li>Precisión: {Math.round(attnSum.acc * 100)}%</li>
                  <li>RT medio: {attnSum.meanRt !== null ? `${Math.round(attnSum.meanRt)} ms` : '—'}</li>
                  <li>Hits: {attnSum.hits} · Omisiones: {attnSum.misses}</li>
                  <li>Falsas alarmas: {attnSum.falseAlarms} · Inhibiciones correctas: {attnSum.correctInhibitions}</li>
                  <li>Resultado: {attnSum.pass ? 'Aprobado' : 'No aprobado'}</li>
                </ul>
              ) : <p className="text-gray-600 dark:text-gray-400">Sin datos.</p>}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl ${
              overallPass
                ? 'bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700'
                : 'bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-700'
            }`}
          >
            <p className="font-semibold">Resultado final: {overallPass ? 'APROBADO' : 'NO APROBADO'}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Criterio: aprobar Teórico ({Math.round(THEORY_PASS_RATIO*100)}%), Señales ({Math.round(SIGNS_PASS_RATIO*100)}%) y todos los módulos psicofísicos.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRestart}>Reiniciar examen</Button>
          </div>
        </div>
      )}

      {/* Navegación (oculta en resumen) */}
      {step?.type !== 'summary' && (
        <div className="flex justify-between">
          <Button variant="ghost" disabled={!canPrev} onClick={goPrev}>
            {t('actions.prev')}
          </Button>
          <Button disabled={!canNext} onClick={goNext}>
            {idx === total - 1 ? t('actions.finish') : t('actions.next')}
          </Button>
        </div>
      )}
    </section>
  )
}
