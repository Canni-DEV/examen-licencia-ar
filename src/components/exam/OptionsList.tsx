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
                'w-full text-left border rounded-base px-4 py-3 transition-colors text-foreground ' +
                (isSel
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700')
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
