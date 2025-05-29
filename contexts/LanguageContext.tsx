
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { locales } from '../locales';
import type { LanguageCode, TranslationSet } from '../types';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  tf: (key: string, count: number, replacements?: Record<string, string | number>) => string; // For pluralization (future use)
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  const getNestedValue = (obj: TranslationSet, path: string): string | TranslationSet | undefined => {
    return path.split('.').reduce((acc, part) => acc && (acc as TranslationSet)[part], obj);
  };

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const translations = locales[language];
    let translatedString = getNestedValue(translations, key) as string | undefined;

    if (translatedString === undefined) {
      console.warn(`Translation key "${key}" not found for language "${language}". Falling back to English.`);
      const fallbackTranslations = locales.en;
      translatedString = getNestedValue(fallbackTranslations, key) as string | undefined;
      if (translatedString === undefined) {
        console.error(`Translation key "${key}" not found in English fallback either.`);
        return key; // Return the key itself if not found anywhere
      }
    }
    
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        const regex = new RegExp(`{${placeholder}}`, 'g');
        translatedString = (translatedString as string).replace(regex, String(replacements[placeholder]));
      });
    }
    return translatedString as string;
  }, [language]);

  // Basic pluralization (can be expanded)
  const tf = useCallback((key: string, count: number, replacements?: Record<string, string | number>): string => {
    // For simplicity, this example doesn't implement complex pluralization rules.
    // It would typically involve keys like "item_one", "item_other" or similar.
    // We'll just use 't' for now and this can be a future enhancement.
    return t(key, { ...replacements, count });
  }, [t]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tf }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
