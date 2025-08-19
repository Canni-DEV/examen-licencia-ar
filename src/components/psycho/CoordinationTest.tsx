import { useEffect, useRef, useState } from 'react'

type Props = {
    durationSec?: number
    laneWidthPx?: number
    safetyMarginPx?: number
    squareSizePx?: number
    scrollSpeed?: number
    maxOutsideSec?: number
    widthShrinkTo?: number
    onComplete?: (summary: {
        completed: boolean
        left: { outsideSec: number; exits: number }
        right: { outsideSec: number; exits: number }
    }) => void
    compact?: boolean
}

// ---------- Utilidades ----------
function mulberry32(seed: number) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function clamp(x: number, a: number, b: number) {
    return Math.max(a, Math.min(b, x))
}

// Catmull–Rom (centrípeta simple)
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number) {
    const t2 = t * t, t3 = t2 * t
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}

type CP = { y: number; x: number }

class PathGen {
    cps: CP[] = []
    segLen: number
    rand: () => number
    baseX: number
    dxMax: number
    getBounds: () => { minX: number; maxX: number } // dinámico (depende de W y ancho min)

    constructor(baseX: number, segLen: number, seed: number, getBounds: () => { minX: number; maxX: number }) {
        this.baseX = baseX
        this.segLen = segLen
        this.rand = mulberry32(Math.floor(seed))
        this.dxMax = 55 // desplazamiento máximo por segmento (suaviza curvas)
        this.getBounds = getBounds
    }

    reset(y0: number) {
        this.cps.length = 0
        const { minX, maxX } = this.getBounds()
        const x0 = clamp(this.baseX, minX, maxX)
        this.cps.push({ y: y0 - this.segLen * 2, x: x0 })
        this.cps.push({ y: y0 - this.segLen, x: x0 })
        this.cps.push({ y: y0, x: x0 })
        this.cps.push({ y: y0 + this.segLen, x: x0 })
    }

    ensure(topWorldY: number, bottomWorldY: number) {
        // Agregar arriba
        while (this.cps[this.cps.length - 1]!.y < topWorldY + this.segLen * 3) {
            const last = this.cps[this.cps.length - 1]!
            const prev = this.cps[this.cps.length - 2]!
            const { minX, maxX } = this.getBounds()
            const dx = (this.rand() * 2 - 1) * this.dxMax
            // limitar tendencia acumulada
            let x = clamp(last.x + dx * 0.8 + (last.x - prev.x) * 0.35, minX, maxX)
            // leve recentrado hacia base (evita ir a extremos)
            x = clamp(x * 0.9 + this.baseX * 0.1, minX, maxX)
            this.cps.push({ y: last.y + this.segLen, x })
        }
        // Quitar abajo (no borrar demasiados para no romper CR)
        while (this.cps.length > 6 && this.cps[2]!.y < bottomWorldY - this.segLen * 3) {
            this.cps.shift()
        }
    }

    xAt(yWorld: number) {
        // si por algún motivo aún no hay 4 CP, devolver base
        if (this.cps.length < 4) {
            const last = this.cps[this.cps.length - 1]
            return last ? last.x : this.baseX
        }

        // localizar segmento [p1,p2] que contiene yWorld
        let i = 1
        while (
            i + 2 < this.cps.length &&
            !(this.cps[i]!.y <= yWorld && yWorld <= this.cps[i + 1]!.y)
        ) {
            i++
        }

        // usar el último segmento válido si nos pasamos
        if (i + 2 >= this.cps.length) i = Math.max(1, this.cps.length - 3)

        const p0 = this.cps[i - 1]!
        const p1 = this.cps[i]!
        const p2 = this.cps[i + 1]!
        const p3 = this.cps[i + 2]!

        const denom = (p2.y - p1.y)
        const t = denom === 0 ? 0 : clamp((yWorld - p1.y) / denom, 0, 1)

        return catmullRom(p0.x, p1.x, p2.x, p3.x, t)
    }
}

export default function CoordinationTest({
    durationSec = 30,
    laneWidthPx = 150,
    safetyMarginPx = 5,
    squareSizePx = 20,
    scrollSpeed = 140,
    maxOutsideSec = 3,
    widthShrinkTo = 0.7,
    onComplete,
    compact = false
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const rafRef = useRef<number | null>(null)

    const [running, setRunning] = useState(false)
    const [completed, setCompleted] = useState(false)

    // input holds
    const keyHoldRef = useRef({ a: false, d: false, j: false, l: false })
    const touchHoldRef = useRef({ leftL: false, rightL: false, leftR: false, rightR: false })
    const inputSpeed = 240 // px/s

    // posiciones X
    const pxLeftRef = useRef(0)
    const pxRightRef = useRef(0)

    // métricas
    const leftOutsideRef = useRef(0)
    const rightOutsideRef = useRef(0)
    const leftExitsRef = useRef(0)
    const rightExitsRef = useRef(0)
    const lastInsideLeftRef = useRef(true)
    const lastInsideRightRef = useRef(true)

    // tiempo
    const startedAtRef = useRef(0)
    const lastTsRef = useRef(0)

    // generadores (compartido + propio por carril)
    const leftSharedRef = useRef<PathGen | null>(null)
    const rightSharedRef = useRef<PathGen | null>(null)
    const leftOwnRef = useRef<PathGen | null>(null)
    const rightOwnRef = useRef<PathGen | null>(null)

    // responsive
    useEffect(() => {
        const cvs = canvasRef.current
        if (!cvs) return
        const resize = () => {
            const parent = cvs.parentElement
            if (!parent) return
            const w = Math.max(360, parent.clientWidth)
            const h = Math.max(320, Math.min(760, Math.round(window.innerHeight * 0.65)))
            cvs.width = w
            cvs.height = h
        }
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [])

    // ancho que decrece en el tiempo
    function laneWidthAt(t: number) {
        const f = Math.min(1, Math.max(0, t / durationSec))
        const k = 1 - (1 - widthShrinkTo) * f
        return laneWidthPx * k
    }

    // crear/actualizar generadores con límites coherentes (no salir de pantalla ni cruzarse)
    function setupGenerators(W: number, H: number) {
        const pad = 40
        const halfMin = (laneWidthPx * widthShrinkTo) / 2 + safetyMarginPx
        const gapMin = 80

        // zonas válidas por carril (constantes durante la sesión)
        const leftMin = pad + halfMin
        const leftMax = W / 2 - gapMin - halfMin
        const rightMin = W / 2 + gapMin + halfMin
        const rightMax = W - pad - halfMin

        const getLeftBounds = () => ({ minX: leftMin, maxX: leftMax })
        const getRightBounds = () => ({ minX: rightMin, maxX: rightMax })

        // bases en el centro de su zona
        const baseLeft = (leftMin + leftMax) / 2
        const baseRight = (rightMin + rightMax) / 2

        // segmentación vertical del mundo
        const seg = 120

        // seeds nuevas cada inicio
        const r = mulberry32(Math.floor(Math.random() * 1e9))
        const seedShared = Math.floor(r() * 1e9)
        const seedLeft = Math.floor(r() * 1e9)
        const seedRight = Math.floor(r() * 1e9)

        leftSharedRef.current = new PathGen(baseLeft, seg, seedShared, getLeftBounds)
        rightSharedRef.current = new PathGen(baseRight, seg, seedShared, getRightBounds) // mismo patrón al inicio

        leftOwnRef.current = new PathGen(baseLeft, seg, seedLeft, getLeftBounds)
        rightOwnRef.current = new PathGen(baseRight, seg, seedRight, getRightBounds)

        const y0 = 0 // mundo
        leftSharedRef.current.reset(y0)
        rightSharedRef.current.reset(y0)
        leftOwnRef.current.reset(y0)
        rightOwnRef.current.reset(y0)
    }

    // loop
    useEffect(() => {
        let localRunning = true

        const draw = (ts: number) => {
            if (!localRunning) return
            const cvs = canvasRef.current
            if (!cvs) return
            const ctx = cvs.getContext('2d')
            if (!ctx) return

            const W = cvs.width, H = cvs.height
            if (!lastTsRef.current) lastTsRef.current = ts
            const dt = (ts - lastTsRef.current) / 1000
            lastTsRef.current = ts

            const t = (performance.now() - startedAtRef.current) / 1000
            const scrollY = t * scrollSpeed

            // asegurar generadores y rangos
            if (!leftSharedRef.current) setupGenerators(W, H)
            const ls = leftSharedRef.current!, rs = rightSharedRef.current!
            const lo = leftOwnRef.current!, ro = rightOwnRef.current!

            const topWorld = scrollY + H + 200
            const bottomWorld = scrollY - 200
            ls.ensure(topWorld, bottomWorld)
            rs.ensure(topWorld, bottomWorld)
            lo.ensure(topWorld, bottomWorld)
            ro.ensure(topWorld, bottomWorld)

            // fondo
            ctx.clearRect(0, 0, W, H)
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, W, H)

            const stepY = 6
            const widthNow = laneWidthAt(t)
            const midY = H / 2
            const diverge = Math.min(1, Math.max(0, (t - 10) / 5))

            type LaneEval = { leftX: number; rightX: number }
            const evalAtMid: Record<'left' | 'right', LaneEval> = {
                left: { leftX: 0, rightX: 0 },
                right: { leftX: 0, rightX: 0 }
            }

            const lanes: ReadonlyArray<'left' | 'right'> = ['left', 'right'] as const
            for (const side of lanes) {
                const leftPts: { x: number; y: number }[] = []
                const rightPts: { x: number; y: number }[] = []

                for (let y = 0; y <= H + stepY; y += stepY) {
                    const yWorld = scrollY + y
                    const sharedX = (side === 'left' ? ls : rs).xAt(yWorld)
                    const ownX = (side === 'left' ? lo : ro).xAt(yWorld)
                    const cx = sharedX * (1 - diverge) + ownX * diverge

                    const half = widthNow / 2
                    const lx = cx - half
                    const rx = cx + half

                    leftPts.push({ x: lx, y })
                    rightPts.push({ x: rx, y })

                    if (Math.abs(y - midY) < stepY) {
                        evalAtMid[side] = { leftX: lx, rightX: rx }
                    }
                }

                // --- Fallback si no hay puntos (o no se seteó evalAtMid) ---
                if (leftPts.length === 0 || rightPts.length === 0) {
                    const yWorldMid = scrollY + midY
                    const sharedX = (side === 'left' ? ls : rs).xAt(yWorldMid)
                    const ownX = (side === 'left' ? lo : ro).xAt(yWorldMid)
                    const cx = sharedX * (1 - diverge) + ownX * diverge
                    const half = widthNow / 2
                    evalAtMid[side] = { leftX: cx - half, rightX: cx + half }
                    // no dibujamos este carril en este frame
                    continue
                }

                // --- Relleno del carril ---
                const firstLeft = leftPts[0]
                if (!firstLeft) continue // guard extra para TS
                ctx.fillStyle = '#F1F5F9'
                ctx.beginPath()
                ctx.moveTo(firstLeft.x, firstLeft.y)
                for (let i = 1; i < leftPts.length; i++) {
                    const p = leftPts[i]
                    if (!p) continue
                    ctx.lineTo(p.x, p.y)
                }
                for (let i = rightPts.length - 1; i >= 0; i--) {
                    const p = rightPts[i]
                    if (!p) continue
                    ctx.lineTo(p.x, p.y)
                }
                ctx.closePath()
                ctx.fill()

                // --- Bordes ---
                ctx.strokeStyle = '#CBD5E1'
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let i = 0; i < leftPts.length; i++) {
                    const p = leftPts[i]
                    if (!p) continue
                    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y)
                }
                ctx.stroke()
                ctx.beginPath()
                for (let i = 0; i < rightPts.length; i++) {
                    const p = rightPts[i]
                    if (!p) continue
                    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y)
                }
                ctx.stroke()

                // --- Rayitas transversales (sensación de carretera) ---
                ctx.strokeStyle = '#E2E8F0'
                ctx.lineWidth = 1
                const stripeEvery = 42
                for (let y = H - (scrollY % stripeEvery); y > -stripeEvery; y -= stripeEvery) {
                    const idx = Math.max(0, Math.min(Math.floor(y / stepY), leftPts.length - 1))
                    const p1 = leftPts[idx]
                    const p2 = rightPts[Math.min(idx, rightPts.length - 1)]
                    if (!p1 || !p2) continue
                    const yOn = Math.floor(y)
                    ctx.beginPath()
                    ctx.moveTo(p1.x + 2, yOn)
                    ctx.lineTo(p2.x - 2, yOn)
                    ctx.stroke()
                }
            }

            // input hold
            const holdLL = keyHoldRef.current.a || touchHoldRef.current.leftL
            const holdLR = keyHoldRef.current.d || touchHoldRef.current.rightL
            const holdRL = keyHoldRef.current.j || touchHoldRef.current.leftR
            const holdRR = keyHoldRef.current.l || touchHoldRef.current.rightR
            if (holdLL) pxLeftRef.current -= inputSpeed * dt
            if (holdLR) pxLeftRef.current += inputSpeed * dt
            if (holdRL) pxRightRef.current -= inputSpeed * dt
            if (holdRR) pxRightRef.current += inputSpeed * dt

            const margin = 8
            pxLeftRef.current = clamp(pxLeftRef.current, margin, W - margin)
            pxRightRef.current = clamp(pxRightRef.current, margin, W - margin)

            // jugadores
            const py = H / 2
            ctx.fillStyle = '#0A84FF'
            ctx.fillRect(pxLeftRef.current - squareSizePx / 2, py - squareSizePx / 2, squareSizePx, squareSizePx)
            ctx.fillStyle = '#34C759'
            ctx.fillRect(pxRightRef.current - squareSizePx / 2, py - squareSizePx / 2, squareSizePx, squareSizePx)

            // safety en altura jugador
            const LB = evalAtMid.left, RB = evalAtMid.right
            ctx.fillStyle = 'rgba(255,59,48,0.08)'
            ctx.fillRect(LB.leftX, 0, safetyMarginPx, H)
            ctx.fillRect(LB.rightX - safetyMarginPx, 0, safetyMarginPx, H)
            ctx.fillRect(RB.leftX, 0, safetyMarginPx, H)
            ctx.fillRect(RB.rightX - safetyMarginPx, 0, safetyMarginPx, H)

            const insideLeft = pxLeftRef.current >= LB.leftX + safetyMarginPx && pxLeftRef.current <= LB.rightX - safetyMarginPx
            const insideRight = pxRightRef.current >= RB.leftX + safetyMarginPx && pxRightRef.current <= RB.rightX - safetyMarginPx

            if (!insideLeft) {
                ctx.fillStyle = 'rgba(255,59,48,0.12)'
                ctx.fillRect(LB.leftX, 0, LB.rightX - LB.leftX, H)
            }
            if (!insideRight) {
                ctx.fillStyle = 'rgba(255,59,48,0.12)'
                ctx.fillRect(RB.leftX, 0, RB.rightX - RB.leftX, H)
            }

            if (running) {
                if (!insideLeft) {
                    leftOutsideRef.current += dt
                    if (lastInsideLeftRef.current) leftExitsRef.current++
                }
                if (!insideRight) {
                    rightOutsideRef.current += dt
                    if (lastInsideRightRef.current) rightExitsRef.current++
                }
                lastInsideLeftRef.current = insideLeft
                lastInsideRightRef.current = insideRight
            }

            // fin
            if (running && t >= durationSec) { stop(true); return }
            if (running && (leftOutsideRef.current >= maxOutsideSec || rightOutsideRef.current >= maxOutsideSec)) { stop(false); return }

            rafRef.current = requestAnimationFrame(draw)
        }


        if (running) rafRef.current = requestAnimationFrame(draw)
        return () => { localRunning = false; if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [running, laneWidthPx, safetyMarginPx, squareSizePx, scrollSpeed, durationSec, widthShrinkTo])

    function start() {
        const cvs = canvasRef.current
        if (cvs) {
            setupGenerators(cvs.width, cvs.height)

            const W = cvs.width, H = cvs.height
            const ls = leftSharedRef.current!
            const rs = rightSharedRef.current!
            const lo = leftOwnRef.current!
            const ro = rightOwnRef.current!

            // Poblar suficientes CPs por arriba/abajo del viewport
            const topWorld = H / 2 + ls.segLen * 4
            const bottomWorld = -ls.segLen * 4
            ls.ensure(topWorld, bottomWorld)
            rs.ensure(topWorld, bottomWorld)
            lo.ensure(topWorld, bottomWorld)
            ro.ensure(topWorld, bottomWorld)

            // Posicionar jugadores en el centro de sus carriles (y = H/2 en mundo 0)
            const cxL = ls.xAt(H / 2)
            const cxR = rs.xAt(H / 2)
            pxLeftRef.current = cxL
            pxRightRef.current = cxR
        }

        leftOutsideRef.current = 0; rightOutsideRef.current = 0
        leftExitsRef.current = 0; rightExitsRef.current = 0
        lastInsideLeftRef.current = true
        lastInsideRightRef.current = true

        startedAtRef.current = performance.now()
        lastTsRef.current = 0
        setCompleted(false)
        setRunning(true)
    }


    function stop(completedByDuration: boolean) {
        setRunning(false)
        setCompleted(true)
        onComplete?.({
            completed: completedByDuration,
            left: { outsideSec: leftOutsideRef.current, exits: leftExitsRef.current },
            right: { outsideSec: rightOutsideRef.current, exits: rightExitsRef.current }
        })
    }

    // teclado
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (!running) return
            if (e.key === 'a' || e.key === 'A') keyHoldRef.current.a = true
            if (e.key === 'd' || e.key === 'D') keyHoldRef.current.d = true
            if (e.key === 'j' || e.key === 'J') keyHoldRef.current.j = true
            if (e.key === 'l' || e.key === 'L') keyHoldRef.current.l = true
        }
        const up = (e: KeyboardEvent) => {
            if (e.key === 'a' || e.key === 'A') keyHoldRef.current.a = false
            if (e.key === 'd' || e.key === 'D') keyHoldRef.current.d = false
            if (e.key === 'j' || e.key === 'J') keyHoldRef.current.j = false
            if (e.key === 'l' || e.key === 'L') keyHoldRef.current.l = false
        }
        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)
        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [running])

    // touch hold helper
    function TouchHoldBtn({ label, onHoldChange }: { label: string; onHoldChange: (down: boolean) => void }) {
        return (
            <button
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-background text-foreground select-none"
                onMouseDown={() => onHoldChange(true)}
                onMouseUp={() => onHoldChange(false)}
                onMouseLeave={() => onHoldChange(false)}
                onTouchStart={(e) => { e.preventDefault(); onHoldChange(true) }}
                onTouchEnd={() => onHoldChange(false)}
            >
                {label}
            </button>
        )
    }

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-background shadow-sm">
            {!compact && <h2 className="text-lg font-semibold mb-2">Coordinación bimanual</h2>}

            <canvas
                ref={canvasRef}
                className="w-full block border border-gray-300 dark:border-gray-600 rounded bg-background"
                tabIndex={0}
                aria-label="Mantén los cuadrados dentro de sus carriles. A/D para izquierdo, J/L para derecho."
            />

            {!compact && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    A/D (izq) · J/L (der). Dura {durationSec}s. Descalifica si permanecés fuera {maxOutsideSec}s acumulados.
                </p>
            )}

            {/* Controles táctiles */}
            <div className="mt-3 grid grid-cols-2 gap-4 sm:hidden">
                <div className="flex justify-between">
                    <TouchHoldBtn label="⬅︎ Izq" onHoldChange={(v) => (touchHoldRef.current.leftL = v)} />
                    <TouchHoldBtn label="Der ➡︎" onHoldChange={(v) => (touchHoldRef.current.rightL = v)} />
                </div>
                <div className="flex justify-between">
                    <TouchHoldBtn label="⬅︎ Izq" onHoldChange={(v) => (touchHoldRef.current.leftR = v)} />
                    <TouchHoldBtn label="Der ➡︎" onHoldChange={(v) => (touchHoldRef.current.rightR = v)} />
                </div>
            </div>

            <div className="mt-3 flex gap-2">
                {!running && <button className="px-4 py-2 rounded-xl bg-blue-600 text-white" onClick={start}>Iniciar</button>}
                {running && <button className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600" onClick={() => stop(false)}>Interrumpir</button>}
            </div>

            {completed && !compact && (
                <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-background p-3 text-sm">
                    <p className="font-semibold">Resumen</p>
                    <ul className="ml-5 list-disc">
                        <li>Izq: fuera {leftOutsideRef.current.toFixed(2)}s · salidas {leftExitsRef.current}</li>
                        <li>Der: fuera {rightOutsideRef.current.toFixed(2)}s · salidas {rightExitsRef.current}</li>
                        <li>{(leftOutsideRef.current < maxOutsideSec && rightOutsideRef.current < maxOutsideSec) ? 'Aprobado (completado)' : 'No aprobado (descalificado)'}</li>
                    </ul>
                    <div className="mt-2">
                        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white" onClick={() => { setCompleted(false); start() }}>
                            Reiniciar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
