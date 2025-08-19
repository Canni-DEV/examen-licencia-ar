import { ButtonHTMLAttributes } from 'react'
import cn from 'classnames'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export default function Button({ className, variant = 'primary', ...rest }: Props) {
  const styles =
    variant === 'primary'
      ? 'bg-primary text-white hover:opacity-90 focus:ring-2 focus:ring-primary/50'
      : 'bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-2 focus:ring-primary/50'
  return (
    <button
      {...rest}
      className={cn(
        'px-4 py-2 rounded-base transition-all duration-200 active:scale-[0.98]',
        styles,
        className
      )}
    />
  )
}
