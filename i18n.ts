import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ptBRTranslations } from './locales/pt-BR.ts';
import { enTranslations } from './locales/en.ts';
import { esTranslations } from './locales/es.ts';

interface Translations {
  // FIX: Allow string arrays in translation objects to support lists of strings.
  [key: string]: string | string[] | Translations;
}

const resources: { [key: string]: Translations } = {
  'pt-BR': ptBRTranslations,
  'en': enTranslations,
  'es': esTranslations,
};

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  // FIX: Return type changed to `any` to support both string and string[] return values
  // without causing type errors across the application. The `t` function implementation
  // has also been updated to handle returning arrays correctly.
  t: (key: string, options?: { [key: string]: string | number }) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'ai-agent-language';

const getInitialLanguage = (): string => {
    const savedLang = localStorage.getItem(LANGUAGE_KEY);
    if (savedLang && resources[savedLang]) {
        return savedLang;
    }
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') return 'es';
    if (browserLang === 'en') return 'en';
    return 'pt-BR';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(getInitialLanguage);

  const changeLanguage = useCallback((lang: string) => {
    if (resources[lang]) {
      localStorage.setItem(LANGUAGE_KEY, lang);
      setLanguage(lang);
    }
  }, []);

  const t = useCallback((key: string, options?: { [key: string]: string | number }): any => {
    const keys = key.split('.');
    let result: any = resources[language];

    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if key not found in current language
        let fallbackResult: any = resources['en'];
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
            if(fallbackResult === undefined) return key;
        }
        result = fallbackResult;
        break;
      }
    }

    if (typeof result === 'string' && options) {
      return Object.entries(options).reduce((acc, [optKey, optValue]) => {
        return acc.replace(`{{${optKey}}}`, String(optValue));
      }, result);
    }

    // FIX: The original implementation returned the `key` for non-string values, which is incorrect for string arrays.
    // This now returns the array if found, otherwise falls back to the key.
    if (typeof result === 'string' || Array.isArray(result)) {
      return result;
    }

    return key;
  }, [language]);
  
  // Set html lang attribute
  useEffect(() => {
    document.documentElement.lang = language.split('-')[0];
  }, [language]);

  return React.createElement(LanguageContext.Provider, { value: { language, changeLanguage, t } }, children);
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
