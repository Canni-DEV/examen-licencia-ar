import { useEffect, useMemo, useState } from 'react'
import { Question } from '../../types'
import QuestionCard from '../../components/exam/QuestionCard'
import ProgressBar from '../../components/ProgressBar'
import Button from '../../components/Button'
import { useTranslation } from 'react-i18next'
import { publicPath } from '../../utils/paths'

export default function SignsExamPage() {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch(publicPath(`/data/${i18n.language}/preguntas_senales.json`))
      .then((r) => r.json())
      .then((q: Question[]) => { setData(q); setAnswers(new Array(q.length).fill(null)) })
  }, [i18n.language])

  const q = data[idx]
  const selected = (answers[idx] ?? null)
  const feedback = submitted && q && selected  != null
    ? (selected === q.correcta ? 'correct' : 'incorrect')
    : null

  const score = useMemo(() => {
    return data.reduce((acc, q, i) => acc + (answers[i] === q.correcta ? 1 : 0), 0)
  }, [data, answers])

  const finish = () => {
    setSubmitted(true)
    // podríamos redirigir a /resultado con state; para demo mantenemos inline
  }

  if (!q) return <p>Cargando...</p>

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">{t('exam.theory')}</h1>
      <ProgressBar value={idx + 1} max={data.length} />
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('exam.progress', { current: idx + 1, total: data.length })}</p>

      <QuestionCard
        q={q}
        selected={selected}
        onSelect={(sel) => {
          const next = answers.slice()
          next[idx] = sel
          setAnswers(next)
        }}
        feedback={feedback as any}
      />

      <div className="flex gap-2 justify-between">
        <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          {t('actions.prev')}
        </Button>
        {idx < data.length - 1 ? (
          <Button onClick={() => setIdx((i) => Math.min(data.length - 1, i + 1))}>
            {t('actions.next')}
          </Button>
        ) : (
          <Button onClick={finish}>{t('actions.finish')}</Button>
        )}
      </div>

      {submitted && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-background p-4">
          <p className="font-semibold">{t('result.score', { score, total: data.length })}</p>
        </div>
      )}
    </section>
  )
}
