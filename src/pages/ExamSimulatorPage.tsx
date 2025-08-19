import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card } from '../ui'

export default function ExamSimulatorPage() {
  const { t } = useTranslation()
  const items = [
    { to: '/simulador/completo', title: t('exam.full') },
    { to: '/simulador/teorico', title: t('exam.theory') },
    { to: '/simulador/senales', title: t('exam.signs') },
    { to: '/simulador/psicofisico', title: t('exam.psycho') }
  ]
  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">{t('nav.exam')}</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <Link key={it.to} to={it.to} className="block">
            <Card className="p-6 hover:shadow-md transition-shadow">
              <span className="text-lg font-semibold">{it.title}</span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
