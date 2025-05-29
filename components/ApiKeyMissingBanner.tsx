
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const ApiKeyMissingBanner: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 fixed top-16 left-0 right-0 z-40 shadow-md" role="alert"> {/* Ensure z-index is below navbar if navbar is sticky */}
      <div className="flex items-center container mx-auto">
        <div className="py-1">
          <i className="fas fa-exclamation-triangle text-2xl mr-3"></i>
        </div>
        <div>
          <p className="font-bold">{t('apiKeyMissing.title')}</p>
          <p className="text-sm">{t('apiKeyMissing.description')}</p>
        </div>
      </div>
    </div>
  );
};
