
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AdviceCard } from '../components/AdviceCard';
import { generateJson, JsonParsingError } from '../services/geminiService'; // Import JsonParsingError
import { SoilType, Season, WaterAvailability, CropRecommendation } from '../types';
import type { Advice } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { startListening, stopListening as stopSpeechRecognition } from '../services/speechService';


const CropAdviceView: React.FC = () => {
  const { t, language } = useLanguage();
  const [region, setRegion] = useState<string>('Central India');
  const [soilType, setSoilType] = useState<SoilType>(SoilType.LOAMY);
  const [season, setSeason] = useState<Season>(Season.KHARIF);
  const [water, setWater] = useState<WaterAvailability>(WaterAvailability.GOOD_IRRIGATION);
  const [resources, setResources] = useState<string>('Moderate budget');
  
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isListeningRegion, setIsListeningRegion] = useState(false);
  const [isListeningResources, setIsListeningResources] = useState(false);
  const regionInputRef = useRef<HTMLInputElement>(null);
  const resourcesTextareaRef = useRef<HTMLTextAreaElement>(null);


  const handleSpeechInput = useCallback((setter: React.Dispatch<React.SetStateAction<string>>, setIsListeningState: React.Dispatch<React.SetStateAction<boolean>>, inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
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
    field: 'region' | 'resources',
    currentValue: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    isListening: boolean,
    setIsListeningState: React.Dispatch<React.SetStateAction<boolean>>,
    inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
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
      I am a farmer in ${region}. 
      My soil type is ${soilType}. 
      The current season is ${season}. 
      I have access to ${water}. 
      My resources are: ${resources}.
      Please recommend 2-3 suitable crops. 
      For each crop, provide: 
      1. cropName: (string) Crop Name. 
      2. suitabilityReason: (string) Brief reason why it's suitable (1-2 sentences). Ensure this string is a valid JSON string (e.g., newlines escaped as \\\\n if any).
      3. keyBenefit: (string) Key benefit (e.g., market demand, drought resistance). Ensure this string is a valid JSON string.
      4. plantingTip: (string) A simple planting tip. Ensure this string is a valid JSON string.
      Return the response as a JSON array of objects, where each object has these four fields: "cropName", "suitabilityReason", "keyBenefit", "plantingTip".
      All string values must be valid JSON strings (e.g., special characters like quotes and newlines properly escaped).
      Example: [{"cropName": "Tomato", "suitabilityReason": "Well-suited for loamy soil and monsoon season. It is relatively easy to manage.", "keyBenefit": "High market demand.", "plantingTip": "Ensure good drainage and stake plants early."}]
    `;

    try {
      const systemInstruction = "You are an agricultural expert providing crop recommendations in JSON format. Ensure all string values in the JSON are properly escaped.";
      const recommendations = await generateJson<CropRecommendation[]>(prompt, systemInstruction);
      
      if (recommendations && recommendations.length > 0) {
        const formattedAdvice: Advice = {
          title: t('cropAdvice.adviceTitle'),
          description: t('cropAdvice.adviceDescription', { region, soilType, season, water, resources }),
          details: recommendations.flatMap(rec => [
            `${t('marketYield.cropNameLabel') || 'Crop'}: ${rec.cropName}`, 
            `  - ${t('cropAdvice.suitabilityReasonLabel') || 'Why Suitable'}: ${rec.suitabilityReason}`,
            `  - ${t('cropAdvice.keyBenefitLabel') || 'Key Benefit'}: ${rec.keyBenefit}`,
            `  - ${t('cropAdvice.plantingTipLabel') || 'Planting Tip'}: ${rec.plantingTip}`,
            ` ` 
          ]).slice(0, -1) 
        };
        setAdvice(formattedAdvice);
      } else {
        // This case might be less likely if generateJson throws on empty/invalid response
        setError(t('cropAdvice.noRecommendationsDesc'));
        setAdvice({
            title: t('cropAdvice.noRecommendations'),
            description: t('cropAdvice.noRecommendationsDesc'),
            details: []
        });
      }
    } catch (e) {
      console.error("Error fetching crop advice:", e);
      let displayError: string;
      if (e instanceof JsonParsingError) {
        displayError = t('cropAdvice.errorParsingJson', { details: e.message });
      } else if (e instanceof Error) {
        displayError = t('cropAdvice.errorFetchingGeneral', { message: e.message });
      } else {
        displayError = t('cropAdvice.errorFetching');
      }
      setError(displayError);
      setAdvice({ // Still provide a generic error advice structure
        title: t('general.error'),
        description: displayError,
        details: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [region, soilType, season, water, resources, t]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card title={t('cropAdvice.title')} titleIcon={<i className="fas fa-seedling"></i>}>
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div className="relative">
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">{t('cropAdvice.regionLabel')}</label>
            <input type="text" id="region" value={region} onChange={(e) => setRegion(e.target.value)} ref={regionInputRef} className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" placeholder={isListeningRegion ? t('general.micPlaceholder') : t('cropAdvice.regionPlaceholder')} />
            <Button type="button" variant='outline' size='sm' onClick={() => toggleListening('region', region, setRegion, isListeningRegion, setIsListeningRegion, regionInputRef)} className="absolute right-1 top-7 p-2" aria-label="Speak region">
                <i className={`fas ${isListeningRegion ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 mb-1">{t('cropAdvice.soilTypeLabel')}</label>
              <select id="soilType" value={soilType} onChange={(e) => setSoilType(e.target.value as SoilType)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                {Object.values(SoilType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">{t('cropAdvice.seasonLabel')}</label>
              <select id="season" value={season} onChange={(e) => setSeason(e.target.value as Season)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="water" className="block text-sm font-medium text-gray-700 mb-1">{t('cropAdvice.waterAvailabilityLabel')}</label>
            <select id="water" value={water} onChange={(e) => setWater(e.target.value as WaterAvailability)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
              {Object.values(WaterAvailability).map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div className="relative">
            <label htmlFor="resources" className="block text-sm font-medium text-gray-700 mb-1">{t('cropAdvice.resourcesLabel')}</label>
            <textarea id="resources" value={resources} onChange={(e) => setResources(e.target.value)} ref={resourcesTextareaRef} rows={3} className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" placeholder={isListeningResources ? t('general.micPlaceholder') : t('cropAdvice.resourcesPlaceholder')}></textarea>
             <Button type="button" variant='outline' size='sm' onClick={() => toggleListening('resources', resources, setResources, isListeningResources, setIsListeningResources, resourcesTextareaRef)} className="absolute right-1 top-7 p-2" aria-label="Speak resources">
                <i className={`fas ${isListeningResources ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
            </Button>
          </div>

          <Button type="submit" isLoading={isLoading} disabled={isLoading} className="w-full" icon={<i className="fas fa-paper-plane"></i>}>
            {t('cropAdvice.submitButton')}
          </Button>
        </form>
      </Card>

      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm" role="alert">{error}</p>}
      
      {(advice || isLoading) && <AdviceCard advice={advice} isLoading={isLoading} titleIcon={<i className="fas fa-seedling text-green-300"></i>} />}
    </div>
  );
};

export default CropAdviceView;
