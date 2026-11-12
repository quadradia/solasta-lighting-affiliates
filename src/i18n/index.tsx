import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, es, type MessageKey } from './messages'

export type Language = 'en' | 'es'
export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

const STORAGE_KEY = 'solasta-affiliates-language'
const dictionaries: Record<Language, Record<MessageKey, string>> = { en, es }

/** Saved choice, else the browser's language, else English. Storage may be blocked; that is fine. */
export function detectLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'es') return saved
  } catch {
    /* private mode */
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

// Module-level copy so code outside React (apiFetch) speaks the same language.
let current: Language = typeof window === 'undefined' ? 'en' : detectLanguage()

export function translate(key: MessageKey, vars?: Record<string, string | number>, language: Language = current): string {
  const text: string = dictionaries[language][key] ?? en[key] ?? key
  return vars ? text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match)) : text
}

export function currentLanguage(): Language {
  return current
}

/** Locale for dates and numbers. */
export function locale(language: Language = current) {
  return language === 'es' ? 'es-US' : 'en-US'
}

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children, initial }: { children: ReactNode; initial?: Language }) {
  const [language, setState] = useState<Language>(initial ?? current)

  useEffect(() => {
    current = language
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    current = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode */
    }
    setState(next)
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t: (key, vars) => translate(key, vars, language) }),
    [language, setLanguage],
  )
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useI18n must be used inside LanguageProvider')
  return value
}

export type { MessageKey }
