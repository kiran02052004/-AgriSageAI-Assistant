
import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { speak } from '../services/speechService';
import type { Advice, GroundingChunk } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { SimpleBarChart } from './SimpleBarChart'; // Import the new chart component

interface AdviceCardProps {
  advice: Advice | null;
  isLoading: boolean;
  titleIcon?: React.ReactNode;
  groundingChunks?: GroundingChunk[];
}

export const AdviceCard: React.FC<AdviceCardProps> = ({ advice, isLoading, titleIcon, groundingChunks }) => {
  const { language, t } = useLanguage();

  if (isLoading) {
    return (
      <Card title={t('adviceCard.generatingAdvice')} titleIcon={titleIcon || <i className="fas fa-brain text-yellow-300"></i>}>
        <div className="flex flex-col items-center justify-center h-40">
          <i className="fas fa-spinner fa-spin text-4xl text-green-500 mb-4"></i>
          <p className="text-gray-600">{t('adviceCard.aiThinking')}</p>
        </div>
      </Card>
    );
  }

  if (!advice) {
    return (
      <Card title={t('adviceCard.noAdvice')} titleIcon={titleIcon || <i className="fas fa-info-circle text-blue-300"></i>}>
        <p className="text-gray-600">{t('adviceCard.noAdviceDesc')}</p>
      </Card>
    );
  }

  const handleSpeak = () => {
    let textToSpeak = `${advice.title}. ${advice.description}.`;
    if (advice.details && advice.details.length > 0) {
      textToSpeak += ` ${t('adviceCard.keyDetails')} ${advice.details.join('. ')}.`;
    }
    // Add chart data to speech if available and makes sense
    if (advice.chartData && advice.chartData.dataLabel) {
        textToSpeak += ` ${advice.chartData.dataLabel}. `;
        advice.chartData.labels.forEach((label, index) => {
            textToSpeak += `${label}: ${advice.chartData?.values[index]}. `;
        });
    }
    speak(textToSpeak, language);
  };

  return (
    <Card 
        title={advice.title} 
        titleIcon={titleIcon || <i className="fas fa-lightbulb text-yellow-300"></i>}
        className="bg-white shadow-lg rounded-lg animate-fadeIn"
    >
      <div className="p-2">
        {advice.imageUrl && (
          <img src={advice.imageUrl} alt={advice.title} className="w-full h-48 object-cover rounded-md mb-4 shadow" />
        )}
        <p className="text-gray-700 mb-3 text-sm sm:text-base whitespace-pre-wrap">{advice.description}</p>
        
        {advice.chartData && <SimpleBarChart data={advice.chartData} />}

        {advice.details && advice.details.length > 0 && (
          <div className="mb-3 mt-3">
            <h4 className="font-semibold text-green-700 mb-1 text-sm">{t('adviceCard.keyDetails')}</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 text-xs sm:text-sm">
              {advice.details.map((detail, index) => (
                <li key={index} className="whitespace-pre-wrap">{detail}</li>
              ))}
            </ul>
          </div>
        )}
        {groundingChunks && groundingChunks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="font-semibold text-green-700 mb-2 text-sm">{t('adviceCard.sources')}</h4>
            <ul className="list-none space-y-1 text-xs sm:text-sm">
              {groundingChunks.map((chunk, index) => (
                chunk.web && chunk.web.uri && (
                  <li key={index} className="truncate">
                    <a 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 hover:text-blue-700 hover:underline"
                      title={chunk.web.uri}
                    >
                      <i className="fas fa-link mr-1 text-xs"></i> 
                      {chunk.web.title || t('adviceCard.untitledSource')}
                    </a>
                  </li>
                )
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="px-4 py-3 bg-green-50 border-t border-green-200 flex justify-end">
        <Button onClick={handleSpeak} variant="primary" size="sm" icon={<i className="fas fa-volume-up"></i>}>
          {t('adviceCard.readAloud')}
        </Button>
      </div>
    </Card>
  );
};
