import { ReactNode } from 'react'
import clsx from 'classnames'

interface CardProps {
  children?: ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-base border border-gray-200 dark:border-gray-700 bg-background text-foreground p-4 shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {children}
    </div>
  )
}
