type Props = { value: number; max: number }
export default function ProgressBar({ value, max }: Props) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full bg-gray-200 rounded-full h-2" aria-label="Progreso">
      <div
        className="h-2 bg-brand-primary rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%` }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        role="progressbar"
      />
    </div>
  )
}
