import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NavTabs({ currentPath }: { currentPath: string }) {
  const { t } = useTranslation()
  const items = [
    { to: '/estudio', label: t('nav.study') },
    { to: '/simulador', label: t('nav.exam') }
  ]
  return (
    <nav aria-label="Secciones" className="grid grid-cols-2 text-center">
      {items.map((it) => {
        const active = currentPath.includes(it.to)
        return (
          <Link
            key={it.to}
            to={it.to}
            className={
              'py-2 ' +
              (active ? 'text-brand-primary font-medium border-b-2 border-brand-primary' : 'text-gray-700')
            }
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
