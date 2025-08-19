import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card } from '../ui'

export default function Home() {
  const { t } = useTranslation()
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('home.title')}</h1>
      <p className="text-gray-600 dark:text-gray-300">{t('home.subtitle')}</p>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Link to="/estudio" className="block">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <span className="text-lg font-semibold">{t('nav.study')}</span>
          </Card>
        </Link>
        <Link to="/simulador" className="block">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <span className="text-lg font-semibold">{t('nav.exam')}</span>
          </Card>
        </Link>
      </div>
    </section>
  )
}
