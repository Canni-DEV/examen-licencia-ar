import { useEffect, useRef, useState } from 'react'

type AttemptResult = {
  overlapped: boolean
  errorPercent: number // 0% si hay solape; si no, % proporcional a distancia del centro al target
  speed: number // px/s
  clickedX: number
  targetCenterX: number
  timeout: boolean
}

type Props = {
  width?: number // default 640
  height?: number // default 300
  squareSize?: number // default 25
  attempts?: number // default 5
  timeoutSec?: number // default 10
  speedMin?: number // default 100
  speedMax?: number // default 200
  onComplete?: (summary: { attempts: AttemptResult[]; avgError: number; pass: boolean }) => void
  compact?: boolean // si true, oculta títulos/botones secundarios (para examen)
}

export default function ConstantVelocityOcclusionTest({
  width = 640,
  height = 300,
  squareSize = 25,
  attempts = 3,
  timeoutSec = 10,
  speedMin = 100,
  speedMax = 200,
  onComplete,
  compact = false
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [running, setRunning] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [results, setResults] = useState<AttemptResult[]>([])
  const [speed, setSpeed] = useState(0)
  const [x, setX] = useState(0)
  const startTimeRef = useRef<number>(0)
  const lastTsRef = useRef<number>(0)
  const clickedRef = useRef<boolean>(false)

  // Config geométrico (según especificación)
  const occStartX = Math.floor(width * 0.75)
  const occWidth = width - occStartX
  const targetWidth = 30
  const targetX = Math.min(occStartX + Math.floor(occWidth * 0.75) + Math.floor((occWidth * 0.25 - targetWidth) / 2), width - targetWidth)
  const targetCenter = targetX + targetWidth / 2

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    let runningLocal = true

    function draw(t: number) {
      if (!runningLocal) return
      if (!lastTsRef.current) lastTsRef.current = t
      const dt = (t - lastTsRef.current) / 1000
      lastTsRef.current = t

      if (running) {
        const newX = x + speed * dt
        setX(newX)
        // timeout
        if ((performance.now() - startTimeRef.current) / 1000 >= timeoutSec) {
          finishAttempt(true)
          return
        }
      }

      // Render
      ctx.clearRect(0, 0, width, height)

    
      // cuadrado móvil
      ctx.fillStyle = '#0A84FF'
      const squareY = (height - squareSize) / 2
      ctx.fillRect(x, squareY, squareSize, squareSize)

      // ocultador
      ctx.fillStyle = '#111111'
      
      ctx.fillRect(occStartX, 0, width - occStartX, height)

        // guía target (opcional, semitransparente)
      ctx.fillStyle = 'rgba(52,199,89,0.15)'
      ctx.globalAlpha = 0.8
      ctx.fillRect(targetX, 0, targetWidth, height)
      ctx.globalAlpha = 1

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      runningLocal = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, x, speed, attempt])

  function resetAttempt() {
    // arranca en el borde izquierdo del canvas (ligero margen)
    setX(0)
    clickedRef.current = false
    lastTsRef.current = 0
  }

  function startAttempt() {
    const sp = speedMin + Math.random() * (speedMax - speedMin)
    setSpeed(sp)
    resetAttempt()
    setRunning(true)
    startTimeRef.current = performance.now()
  }

  function stopAttempt() {
    // segundo click: registra resultado
    finishAttempt(false)
  }

  function finishAttempt(timeout: boolean) {
    setRunning(false)
    // calcular solape/errores
    const squareCenter = x + squareSize / 2
    const overlapped = !(squareCenter + squareSize / 2 < targetX || squareCenter - squareSize / 2 > targetX + targetWidth)
    let errorPercent = 0
    if (!overlapped) {
      // distancia relativa del centro al centro del target
      const delta = Math.abs(squareCenter - targetCenter)
      const targetHalf = targetWidth / 2
      errorPercent = Math.min(100, (delta / targetHalf) * 100)
    }
    const attemptRes: AttemptResult = {
      overlapped,
      errorPercent,
      speed,
      clickedX: squareCenter,
      targetCenterX: targetCenter,
      timeout
    }
    setResults((arr) => {
      const next = [...arr, attemptRes]
      if (next.length >= attempts) {
        const avg = next.reduce((a, r) => a + r.errorPercent, 0) / next.length
        const pass = avg <= 50 // umbral solicitado
        onComplete?.({ attempts: next, avgError: avg, pass })
      }
      return next
    })
    // preparar siguiente intento si quedan
    setAttempt((a) => a + 1)
    resetAttempt()
  }

  const finished = results.length >= attempts

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-background shadow-sm">
      {!compact && <h2 className="text-lg font-semibold mb-2">Velocidad constante (ocultamiento)</h2>}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="mx-auto block border border-gray-300 dark:border-gray-600 rounded bg-background"
        onClick={() => {
          if (finished) return
          if (!running) startAttempt()
          else stopAttempt()
        }}
        onKeyDown={(e) => {
          if (finished) return
          if (e.code === 'Space') {
            e.preventDefault()
            if (!running) startAttempt()
            else stopAttempt()
          }
        }}
        tabIndex={0}
        aria-label="Test de velocidad constante: click/espacio para iniciar y detener."
      />

      {!compact && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <p>Intento {Math.min(results.length + 1, attempts)} / {attempts}</p>
          <p>Click/Space para iniciar y detener. Timeout: {timeoutSec}s. Tamaño: {squareSize}px. Target 30px.</p>
        </div>
      )}

      {finished && !compact && (
        <ResultsPanel results={results} />
      )}
    </div>
  )
}

function ResultsPanel({ results }: { results: AttemptResult[] }) {
  const avg = results.reduce((a, r) => a + r.errorPercent, 0) / results.length
  const pass = avg <= 50
  return (
    <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-background p-3">
      <p className="font-semibold">Resumen</p>
      <ul className="list-disc ml-5 text-sm">
        {results.map((r, i) => (
          <li key={i}>
            #{i + 1}: {r.timeout ? 'Timeout' : (r.overlapped ? 'Solapó target' : 'Sin solape')} · error {r.errorPercent.toFixed(1)}% · v={Math.round(r.speed)}px/s
          </li>
        ))}
      </ul>
      <p className="mt-2 font-medium">Error promedio: {avg.toFixed(1)}% · {pass ? 'Aprobado' : 'No aprobado'} (≤ 50%)</p>
    </div>
  )
}
