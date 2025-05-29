
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { LanguageCode } from '../types';

const availableLanguages: { code: LanguageCode; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
];

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLanguageChange = (langCode: LanguageCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const currentLangName = availableLanguages.find(l => l.code === language)?.name || language;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-md text-sm font-medium text-green-200 hover:bg-green-600 hover:text-white flex items-center"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('navbar.language')}
      >
        <i className="fas fa-globe mr-2"></i>
        <span className="hidden sm:inline">{currentLangName}</span>
        <i className="fas fa-caret-down ml-1 sm:ml-2"></i>
      </button>
      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 py-1"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors duration-150
                ${language === lang.code 
                  ? 'bg-green-100 text-green-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
              role="menuitem"
            >
              <span className="mr-2">{lang.flag}</span>{lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
