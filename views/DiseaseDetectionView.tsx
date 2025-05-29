
import React, { useState, useCallback, useRef } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { AdviceCard } from '../components/AdviceCard';
import { Card } from '../components/Card';
import { analyzeImageWithText } from '../services/geminiService';
import { Button } from '../components/Button';
import type { PestDiseaseReport, Advice } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { startListening, stopListening as stopSpeechRecognition } from '../services/speechService';

const DiseaseDetectionView: React.FC = () => {
  const { t, language } = useLanguage();
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [isListeningNotes, setIsListeningNotes] = useState(false);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSpeechInput = useCallback((setter: React.Dispatch<React.SetStateAction<string>>, setIsListeningState: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsListeningState(true);
    startListening(
      language,
      (transcript) => {
        setter(transcript);
        if (notesTextareaRef.current) notesTextareaRef.current.focus();
      },
      (err) => {
        setError(err);
        console.error("Speech recognition error:", err);
      },
      () => setIsListeningState(false)
    );
  }, [language]);

  const toggleListeningNotes = () => {
    if (isListeningNotes) {
      stopSpeechRecognition();
      setIsListeningNotes(false);
    } else {
      handleSpeechInput(setAdditionalNotes, setIsListeningNotes);
    }
  };

  const handleImageUpload = useCallback((base64: string, mimeType: string) => {
    if (base64 && mimeType) {
      setImageData({ base64, mimeType });
    } else {
      setImageData(null); 
    }
    setAdvice(null); 
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!imageData) {
      setError(t('diseaseDetection.pleaseUpload'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setAdvice(null);

    const prompt = `
      Analyze this image of a crop leaf or plant part. 
      Identify potential diseases or pests visible.
      If a disease or pest is identified, provide:
      1. A common name for the issue.
      2. A brief description of the issue (1-2 sentences).
      3. 2-3 simple, actionable, and preferably organic control or prevention tips for a farmer.
      If the image is unclear, or if no disease/pest is confidently detected, state that clearly.
      ${additionalNotes ? `Farmer's notes: "${additionalNotes}" Consider these notes in your analysis.` : ''}
      Keep the language simple and direct for a farmer with basic agricultural knowledge.
      Format the response as plain text, not JSON.
      Example response if issue found:
      Issue: Powdery Mildew
      Description: A fungal disease appearing as white powdery spots on leaves and stems.
      Control Tips: 
      - Ensure good air circulation around plants.
      - Spray with a solution of milk and water (1:9 ratio).
      - Remove and destroy infected plant parts.
      
      Example response if no issue found or unclear:
      No clear disease or pest detected in the image. The image might be blurry or the plant appears healthy. For a more accurate diagnosis, ensure the image is clear and shows the affected area well.
    `;
    
    try {
      const result = await analyzeImageWithText(imageData.base64, imageData.mimeType, prompt);
      const lines = result.text.split('\n');
      let title = t('diseaseDetection.analysisResult');
      let description = result.text; 
      const details: string[] = [];

      const titleMatch = result.text.match(/Issue:\s*(.*)/i);
      if (titleMatch) title = titleMatch[1].trim();

      const descMatch = result.text.match(/Description:\s*([\s\S]*?)(Control Tips:|Prevention Tips:|Tips:|SOLUTION:|RECOMMENDATIONS:|$)/i);
      if (descMatch) description = descMatch[1].trim();
      
      const tipsSectionMatch = result.text.match(/(Control Tips:|Prevention Tips:|Tips:|SOLUTION:|RECOMMENDATIONS:)([\s\S]*)/i);
      if (tipsSectionMatch && tipsSectionMatch[2]) {
          const tipsText = tipsSectionMatch[2].trim();
          tipsText.split(/(\s*-\s*|\s*\*\s*|\s*\d+\.\s*)/).forEach(tip => {
              const cleanedTip = tip.trim();
              if (cleanedTip && !cleanedTip.match(/^(\s*-\s*|\s*\*\s*|\s*\d+\.\s*)$/) && cleanedTip.length > 5) { 
                  details.push(cleanedTip);
              }
          });
      }
      
      if (lines.length < 5 && (result.text.toLowerCase().includes("no clear disease") || result.text.toLowerCase().includes("appears healthy"))){
        title = t('diseaseDetection.plantHealthStatus');
        description = result.text;
      }

      const newAdvice: PestDiseaseReport = {
        title: title,
        description: description,
        details: details.length > 0 ? details : undefined,
      };
      setAdvice(newAdvice);

    } catch (e) {
      console.error(e);
      setError(t('diseaseDetection.errorAnalyzing') + ` ${(e as Error).message}`);
       setAdvice({
        title: t('general.error'),
        description: t('diseaseDetection.errorAnalyzing') + ` ${(e as Error).message}`,
        details: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [imageData, additionalNotes, t]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card title={t('diseaseDetection.title')} titleIcon={<i className="fas fa-leaf"></i>}>
        <div className="p-2">
          <p className="text-sm text-gray-600 mb-4">{t('diseaseDetection.description')}</p>
          <ImageUploader onImageUpload={handleImageUpload} labelKey="diseaseDetection.uploadLabel" />
          
          {imageData && (
            <div className="mt-4 relative">
              <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">{t('diseaseDetection.additionalNotesLabel')}</label>
              <textarea 
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                ref={notesTextareaRef}
                rows={2}
                className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder={isListeningNotes ? t('general.micPlaceholder') : t('diseaseDetection.additionalNotesPlaceholder')}
              />
              <Button type="button" variant='outline' size='sm' onClick={toggleListeningNotes} className="absolute right-1 top-8 p-2" aria-label="Speak additional notes">
                 <i className={`fas ${isListeningNotes ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button onClick={handleSubmit} isLoading={isLoading} disabled={!imageData || isLoading} className="w-full md:w-auto" icon={<i className="fas fa-search-plus"></i>}>
              {t('diseaseDetection.submitButton')}
            </Button>
          </div>
        </div>
      </Card>
      
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm" role="alert">{error}</p>}

      {(advice || isLoading) && <AdviceCard advice={advice} isLoading={isLoading} titleIcon={<i className="fas fa-microscope text-blue-300"></i>} />}
    </div>
  );
};

export default DiseaseDetectionView;
