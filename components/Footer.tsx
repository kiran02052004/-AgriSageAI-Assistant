
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-green-700 text-green-200 text-center p-4 shadow-inner mt-auto">
      <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      <p className="text-xs mt-1">{t('footer.disclaimer')}</p>
    </footer>
  );
};
