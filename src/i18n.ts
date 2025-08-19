import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import { getLS, setLS } from './utils/localStorage';

const saved = getLS('lang', 'es');

void i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: saved,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    backend: { loadPath: publicUrl('/i18n/{{lng}}.json') }
  });

function publicUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/'; // p.ej. "/" o "/tu-repo/"
  return `${base}${path.replace(/^\//, '')}`;   // => "/i18n/es.json" o "/tu-repo/i18n/es.json"
}

i18n.on('languageChanged', (lng) => setLS('lang', lng));

export default i18n;
