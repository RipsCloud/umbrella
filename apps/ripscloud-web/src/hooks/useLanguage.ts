import { useTranslation } from 'react-i18next'

export function useLanguage() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('i18n_language', lng)
  }

  const currentLanguage = i18n.language

  return {
    changeLanguage,
    currentLanguage,
  }
}
