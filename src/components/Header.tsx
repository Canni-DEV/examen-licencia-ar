import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './LanguageSelector'
import NavTabs from './NavTabs'

export default function Header() {
  const { t } = useTranslation()
  const loc = useLocation()
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg" aria-label={t('appTitle')}>
          {t('appTitle')}
        </Link>
        <div className="hidden sm:flex items-center gap-4">
          <Link className="hover:underline" to="/estudio">{t('nav.study')}</Link>
          <Link className="hover:underline" to="/simulador">{t('nav.exam')}</Link>
          <LanguageSelector />
        </div>
      </div>
      {/* tabs móviles */}
      <div className="sm:hidden border-t border-gray-200">
        <NavTabs currentPath={loc.pathname} />
      </div>
    </header>
  )
}
