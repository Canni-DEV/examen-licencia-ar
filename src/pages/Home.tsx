import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function Home() {
  const { t } = useTranslation()
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('home.title')}</h1>
      <p className="text-gray-600">{t('home.subtitle')}</p>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <CardLink to="/estudio" title={t('nav.study')} />
        <CardLink to="/simulador" title={t('nav.exam')} />
      </div>
    </section>
  )
}

function CardLink({ to, title }: { to: string; title: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border p-6 hover:shadow-md transition-shadow focus-visible:outline-2"
    >
      <span className="text-lg font-semibold">{title}</span>
    </Link>
  )
}
