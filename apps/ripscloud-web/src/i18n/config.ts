import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'

const storedLanguage = localStorage.getItem('i18n_language') || 'es'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: storedLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
