
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AdviceCard } from '../components/AdviceCard';
import { generateTextWithGoogleSearch } from '../services/geminiService';
import type { Advice, GroundingChunk } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { startListening, stopListening as stopSpeechRecognition } from '../services/speechService';

const GroundingDemoView: React.FC = () => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState<string>('Latest government schemes for farmers in India 2024');
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isListeningQuery, setIsListeningQuery] = useState(false);
  const queryTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSpeechInput = useCallback((setter: React.Dispatch<React.SetStateAction<string>>, setIsListeningState: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsListeningState(true);
    startListening(
      language,
      (transcript) => {
        setter(transcript);
        if (queryTextareaRef.current) queryTextareaRef.current.focus();
      },
      (err) => {
        setError(err);
        console.error("Speech recognition error:", err);
      },
      () => setIsListeningState(false)
    );
  }, [language]);

  const toggleListeningQuery = () => {
    if (isListeningQuery) {
      stopSpeechRecognition();
      setIsListeningQuery(false);
    } else {
      handleSpeechInput(setQuery, setIsListeningQuery);
    }
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      setError(t('groundingDemo.enterQuery'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setAdvice(null);
    setGroundingChunks(undefined);

    try {
      const result = await generateTextWithGoogleSearch(query);
      
      if (result.text) {
        const formattedAdvice: Advice = {
          title: t('groundingDemo.searchResultsTitle', { query }),
          description: result.text,
        };
        setAdvice(formattedAdvice);
        setGroundingChunks(result.groundingChunks);
      } else {
        setError(t('groundingDemo.noInformation'));
        setAdvice({
            title: t('groundingDemo.noInformation'),
            description: t('adviceCard.noAdviceDesc'),
            details: []
        });
      }
    } catch (e) {
      console.error(e);
      setError(t('groundingDemo.errorFetching') + ` ${(e as Error).message}`);
      setAdvice({
        title: t('general.error'),
        description: t('groundingDemo.errorFetching') + ` ${(e as Error).message}`,
        details: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [query, t]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card title={t('groundingDemo.title')} titleIcon={<i className="fas fa-search"></i>}>
        <p className="text-sm text-gray-600 mb-4 p-2">
          {t('groundingDemo.description')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div className="relative">
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">{t('groundingDemo.queryLabel')}</label>
            <textarea 
              id="searchQuery" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              ref={queryTextareaRef}
              rows={3}
              className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" 
              placeholder={isListeningQuery ? t('general.micPlaceholder') : t('groundingDemo.queryPlaceholder')} 
            />
            <Button type="button" variant='outline' size='sm' onClick={toggleListeningQuery} className="absolute right-1 top-8 p-2" aria-label="Speak search query">
                <i className={`fas ${isListeningQuery ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
            </Button>
          </div>
          
          <Button type="submit" isLoading={isLoading} disabled={isLoading || !query.trim()} className="w-full" icon={<i className="fas fa-paper-plane"></i>}>
            {t('groundingDemo.submitButton')}
          </Button>
        </form>
      </Card>

      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm" role="alert">{error}</p>}
      
      {(advice || isLoading) && 
        <AdviceCard 
          advice={advice} 
          isLoading={isLoading} 
          titleIcon={<i className="fas fa-newspaper text-indigo-300"></i>}
          groundingChunks={groundingChunks}
        />
      }
    </div>
  );
};

export default GroundingDemoView;
