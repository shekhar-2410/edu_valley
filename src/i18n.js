import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const loadLocale = async (lng) => {
    const language = lng?.startsWith('hi') ? 'hi' : 'en'
    const module = language === 'hi'
        ? await import('./locales/hi')
        : await import('./locales/en')
    return module.default
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {},
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        react: {
            useSuspense: false
        }
    })

const ensureLocale = async (lng) => {
    const language = lng?.startsWith('hi') ? 'hi' : 'en'
    if (!i18n.hasResourceBundle(language, 'translation')) {
        const resources = await loadLocale(language)
        i18n.addResourceBundle(language, 'translation', resources, true, true)
    }
}

const originalChangeLanguage = i18n.changeLanguage.bind(i18n)
i18n.changeLanguage = async (lng, callback) => {
    await ensureLocale(lng)
    return originalChangeLanguage(lng, callback)
}

ensureLocale(i18n.language || 'en').then(() => {
    originalChangeLanguage(i18n.language || 'en')
})

export default i18n
