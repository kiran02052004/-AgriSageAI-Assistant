
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AdviceCard } from '../components/AdviceCard';
import { generateText } from '../services/geminiService';
import type { Advice } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { startListening, stopListening as stopSpeechRecognition } from '../services/speechService';

const IrrigationFertilizerView: React.FC = () => {
  const { t, language } = useLanguage();
  const [cropType, setCropType] = useState<string>('Tomato');
  const [growthStage, setGrowthStage] = useState<string>('Fruiting');
  const [soilMoisture, setSoilMoisture] = useState<string>('Medium');
  const [weather, setWeather] = useState<string>('Sunny and Warm');
  
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isListeningCrop, setIsListeningCrop] = useState(false);
  const [isListeningStage, setIsListeningStage] = useState(false);
  const [isListeningWeather, setIsListeningWeather] = useState(false);
  
  const cropInputRef = useRef<HTMLInputElement>(null);
  const stageInputRef = useRef<HTMLInputElement>(null);
  const weatherInputRef = useRef<HTMLInputElement>(null);

  const handleSpeechInput = useCallback((
      setter: React.Dispatch<React.SetStateAction<string>>, 
      setIsListeningState: React.Dispatch<React.SetStateAction<boolean>>,
      inputRef?: React.RefObject<HTMLInputElement>
    ) => {
    setIsListeningState(true);
    startListening(
      language,
      (transcript) => {
        setter(transcript);
        if (inputRef?.current) inputRef.current.focus();
      },
      (err) => {
        setError(err);
        console.error("Speech recognition error:", err);
      },
      () => setIsListeningState(false)
    );
  }, [language]);

  const toggleListening = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    isListening: boolean,
    setIsListeningState: React.Dispatch<React.SetStateAction<boolean>>,
    inputRef?: React.RefObject<HTMLInputElement>
  ) => {
    if (isListening) {
      stopSpeechRecognition();
      setIsListeningState(false);
    } else {
      handleSpeechInput(setter, setIsListeningState, inputRef);
    }
  };


  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setAdvice(null);

    const prompt = `
      My crop is ${cropType} at the ${growthStage} stage. 
      Current soil moisture is observed to be ${soilMoisture}. 
      The weather forecast is ${weather}.
      Please provide:
      1. Simple, actionable irrigation advice (how much, how often, best time).
      2. Recommendations for organic fertilizers suitable for this stage and crop. Include type and general application tips.
      Keep the advice concise, practical, and easy for a farmer to understand. Format as plain text.
      Example response structure:
      Irrigation Advice:
      - [Tip 1]
      - [Tip 2]
      Fertilizer Recommendations:
      - Fertilizer Type 1: [Application Tip]
      - Fertilizer Type 2: [Application Tip]
    `;

    try {
      const result = await generateText(prompt);
      const lines = result.text.split('\n').filter(line => line.trim() !== '');
      let parsedTitle = t('irrigationFertilizer.adviceTitle');
      let parsedDescription = t('irrigationFertilizer.adviceDescription', { cropType, growthStage, soilMoisture, weather });
      const details: string[] = [];
      
      let currentSection = "";
      lines.forEach(line => {
        if (line.toLowerCase().includes("irrigation advice")) {
          currentSection = "Irrigation";
          details.push(`**${line.trim()}**`); 
        } else if (line.toLowerCase().includes("fertilizer recommendation")) {
          currentSection = "Fertilizer";
          details.push(`**${line.trim()}**`);
        } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
          details.push(line.trim());
        } else if (currentSection === "" && !line.toLowerCase().includes("irrigation advice") && !line.toLowerCase().includes("fertilizer recommendation")) {
            // Append to description if it's part of an intro before specific sections
            // This check prevents adding the main description line itself into details.
            if (line.trim() !== parsedDescription.split('\n').pop()?.trim()) {
                 parsedDescription += `\n${line.trim()}`;
            }
        } else if (currentSection !== "") { 
            details.push(`  ${line.trim()}`);
        }
      });
      
      if (details.length === 0 && result.text.length > 0 && !result.text.startsWith(parsedDescription)) {
        parsedDescription = result.text; // Fallback if parsing fails but text exists
      } else if (details.length === 0 && !result.text) {
        parsedDescription = t('adviceCard.noAdviceDesc');
      }

      const newAdvice: Advice = {
        title: parsedTitle,
        description: parsedDescription,
        details: details.length > 0 ? details : undefined,
      };
      setAdvice(newAdvice);

    } catch (e) {
      console.error(e);
      setError(t('marketYield.errorFetching') + ` ${(e as Error).message}`);
      setAdvice({
        title: t('general.error'),
        description: t('marketYield.errorFetching') + ` ${(e as Error).message}`,
        details: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [cropType, growthStage, soilMoisture, weather, t]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card title={t('irrigationFertilizer.title')} titleIcon={<i className="fas fa-tint"></i>}>
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div className="relative">
            <label htmlFor="cropType" className="block text-sm font-medium text-gray-700 mb-1">{t('irrigationFertilizer.cropTypeLabel')}</label>
            <input type="text" id="cropType" value={cropType} onChange={(e) => setCropType(e.target.value)} ref={cropInputRef} className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" placeholder={isListeningCrop ? t('general.micPlaceholder') : t('irrigationFertilizer.cropTypePlaceholder')} />
             <Button type="button" variant='outline' size='sm' onClick={() => toggleListening(setCropType, isListeningCrop, setIsListeningCrop, cropInputRef)} className="absolute right-1 top-7 p-2" aria-label="Speak crop type">
                <i className={`fas ${isListeningCrop ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="growthStage" className="block text-sm font-medium text-gray-700 mb-1">{t('irrigationFertilizer.growthStageLabel')}</label>
              <input type="text" id="growthStage" value={growthStage} onChange={(e) => setGrowthStage(e.target.value)} ref={stageInputRef} className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" placeholder={isListeningStage ? t('general.micPlaceholder') : t('irrigationFertilizer.growthStagePlaceholder')} />
              <Button type="button" variant='outline' size='sm' onClick={() => toggleListening(setGrowthStage, isListeningStage, setIsListeningStage, stageInputRef)} className="absolute right-1 top-7 p-2" aria-label="Speak growth stage">
                  <i className={`fas ${isListeningStage ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
              </Button>
            </div>
            <div>
              <label htmlFor="soilMoisture" className="block text-sm font-medium text-gray-700 mb-1">{t('irrigationFertilizer.soilMoistureLabel')}</label>
              <select id="soilMoisture" value={soilMoisture} onChange={(e) => setSoilMoisture(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                <option value="Dry">{t('irrigationFertilizer.soilMoistureOptions.dry')}</option>
                <option value="Slightly Dry">{t('irrigationFertilizer.soilMoistureOptions.slightlyDry')}</option>
                <option value="Medium">{t('irrigationFertilizer.soilMoistureOptions.medium')}</option>
                <option value="Wet">{t('irrigationFertilizer.soilMoistureOptions.wet')}</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-1">{t('irrigationFertilizer.weatherLabel')}</label>
            <input type="text" id="weather" value={weather} onChange={(e) => setWeather(e.target.value)} ref={weatherInputRef} className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" placeholder={isListeningWeather ? t('general.micPlaceholder') : t('irrigationFertilizer.weatherPlaceholder')} />
             <Button type="button" variant='outline' size='sm' onClick={() => toggleListening(setWeather, isListeningWeather, setIsListeningWeather, weatherInputRef)} className="absolute right-1 top-7 p-2" aria-label="Speak weather conditions">
                <i className={`fas ${isListeningWeather ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
            </Button>
          </div>

          <Button type="submit" isLoading={isLoading} disabled={isLoading} className="w-full" icon={<i className="fas fa-water"></i>}>
            {t('irrigationFertilizer.submitButton')}
          </Button>
        </form>
      </Card>

      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm" role="alert">{error}</p>}

      {(advice || isLoading) && <AdviceCard advice={advice} isLoading={isLoading} titleIcon={<i className="fas fa-hand-holding-water text-blue-300"></i>} />}
    </div>
  );
};

export default IrrigationFertilizerView;
