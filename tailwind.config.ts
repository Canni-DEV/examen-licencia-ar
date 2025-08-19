import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        background: 'var(--color-bg)',
        foreground: 'var(--color-fg)'
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        base: 'var(--radius-base)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
} satisfies Config
