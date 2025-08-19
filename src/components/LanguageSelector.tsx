import { useTranslation } from 'react-i18next'

const langs = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' }
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  return (
    <label className="inline-flex items-center">
      <span className="sr-only">Idioma</span>
      <select
        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 text-sm transition-colors"
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label="Idioma"
      >
        {langs.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}
