import { Question } from '../../types'
import OptionsList from './OptionsList'

type Props = {
  q: Question
  selected: number | null
  onSelect: (idx: number) => void
  feedback?: 'correct' | 'incorrect' | null
}

export default function QuestionCard({ q, selected, onSelect, feedback }: Props) {
  return (
    <article className="rounded-2xl border border-gray-200 p-4 sm:p-6 bg-white shadow-sm">
      <header className="mb-3">
        <h2 className="text-lg font-semibold">{q.texto}</h2>
      </header>

      {q.imagen && (
        <div className="mb-4">
          <img
            src={q.imagen}
            alt="Ilustración de la pregunta"
            className="max-h-48 mx-auto"
          />
        </div>
      )}

      <OptionsList options={q.opciones} selected={selected} onSelect={onSelect} />

      {feedback && (
        <p
          className={
            'mt-3 font-medium ' +
            (feedback === 'correct' ? 'text-green-600' : 'text-red-600')
          }
          aria-live="polite"
        >
          {feedback === 'correct' ? '✔ ' : '✘ '}
          {feedback === 'correct' ? 'Correcto' : 'Incorrecto'}
        </p>
      )}
    </article>
  )
}
