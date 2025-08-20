import { Link } from 'react-router-dom'
import clsx from 'classnames'

export interface TabItem {
  id: string
  label: string
  to?: string
}

interface Props {
  items: TabItem[]
  current: string
  onChange?: (id: string) => void
  className?: string
}

export default function TabNav({ items, current, onChange, className }: Props) {
  return (
    <nav className={clsx('flex gap-2 overflow-auto', className)} role="tablist">
      {items.map((it) => {
        const active = current === it.id
        const itemCls = clsx(
          'block px-3 py-2 rounded-base border text-sm',
          active
            ? 'border-primary text-primary bg-primary/10'
            : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
        )
        return it.to ? (
          <Link key={it.id} to={it.to} className={itemCls}>
            {it.label}
          </Link>
        ) : (
          <button
            key={it.id}
            onClick={() => onChange?.(it.id)}
            className={itemCls}
            role="tab"
            aria-selected={active}
          >
            {it.label}
          </button>
        )
      })}
    </nav>
  )
}
