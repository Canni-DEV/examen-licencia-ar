import { ButtonHTMLAttributes } from 'react'
import cn from 'classnames'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export default function Button({ className, variant = 'primary', ...rest }: Props) {
  const styles =
    variant === 'primary'
      ? 'bg-brand-primary text-white hover:opacity-90 focus:ring-2 focus:ring-blue-400'
      : 'bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-blue-400'
  return (
    <button
      {...rest}
      className={cn(
        'px-4 py-2 rounded-xl transition-all duration-200 active:scale-[0.98]',
        styles,
        className
      )}
    />
  )
}
