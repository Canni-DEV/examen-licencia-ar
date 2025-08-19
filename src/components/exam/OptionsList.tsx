import { KeyboardEvent } from 'react'

type Props = {
  options: string[]
  selected: number | null
  onSelect: (idx: number) => void
}

export default function OptionsList({ options, selected, onSelect }: Props) {
  const handleKey = (idx: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(idx)
    }
  }

  return (
    <ul role="radiogroup" aria-label="Opciones" className="space-y-2">
      {options.map((op, idx) => {
        const isSel = selected === idx
        return (
          <li key={idx}>
            <button
              role="radio"
              aria-checked={isSel}
              onKeyDown={handleKey(idx)}
              onClick={() => onSelect(idx)}
              className={
                'w-full text-left border rounded-xl px-4 py-3 transition-colors ' +
                (isSel ? 'border-brand-primary bg-blue-50' : 'hover:bg-gray-50')
              }
            >
              {op}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
