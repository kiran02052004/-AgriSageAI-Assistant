
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AdviceCard } from '../components/AdviceCard';
import { generateJson, JsonParsingError } from '../services/geminiService'; // Import JsonParsingError
import { SoilType, WaterAvailability } from '../types';
import type { Advice, MarketInfo, YieldPrediction, ChartData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { startListening, stopListening as stopSpeechRecognition } from '../services/speechService';

const MarketYieldView: React.FC = () => {
  const { t, language } = useLanguage();
  const [cropName, setCropName] = useState<string>('Wheat');
  const [region, setRegion] = useState<string>('Punjab, India');
  
  const [soilType, setSoilType] = useState<SoilType>(SoilType.LOAMY);
  const [irrigation, setIrrigation] = useState<WaterAvailability>(WaterAvailability.GOOD_IRRIGATION);
  const [expectedWeather, setExpectedWeather] = useState<string>('Normal monsoon');

  const [marketAdvice, setMarketAdvice] = useState<Advice | null>(null);
  const [yieldAdvice, setYieldAdvice] = useState<Advice | null>(null);
  const [isMarketLoading, setIsMarketLoading] = useState<boolean>(false);
  const [isYieldLoading, setIsYieldLoading] = useState<boolean>(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [yieldError, setYieldError] = useState<string | null>(null);

  const [isListeningMarketCrop, setIsListeningMarketCrop] = useState(false);
  const [isListeningMarketRegion, setIsListeningMarketRegion] = useState(false);
  const [isListeningYieldCrop, setIsListeningYieldCrop] = useState(false);
  const [isListeningYieldWeather, setIsListeningYieldWeather] = useState(false);

  const marketCropRef = useRef<HTMLInputElement>(null);
  const marketRegionRef = useRef<HTMLInputElement>(null);
  const yieldCropRef = useRef<HTMLInputElement>(null);
  const yieldWeatherRef = useRef<HTMLInputElement>(null);
  
  const handleSpeechInput = useCallback((
      setter: React.Dispatch<React.SetStateAction<string>>, 
      setIsListeningState: React.Dispatch<React.SetStateAction<boolean>>,
      inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement> | undefined,
      errorScope: 'market' | 'yield'
    ) => {
    setIsListeningState(true);
    startListening(
      language,
      (transcript) => {
        setter(transcript);
        if (inputRef?.current) inputRef.current.focus();
      },
      (err) => { 
        const errorString = typeof err === 'string' ? err : (err as Error).message;
        if (errorScope === 'market') {
          setMarketError(errorString);
        } else {
          setYieldError(errorString);
        }
        console.error("Speech recognition error:", errorString);
      },
      () => setIsListeningState(false)
    );
  }, [language, setMarketError, setYieldError]); 

 const toggleListening = (
    fieldIdentifier: 'marketCrop' | 'marketRegion' | 'yieldCrop' | 'yieldWeather',
    setter: React.Dispatch<React.SetStateAction<string>>,
    isListening: boolean,
    setIsListeningState: React.Dispatch<React.SetStateAction<boolean>>,
    inputRef?: React.RefObject<HTMLInputElement>
  ) => {
    if (isListening) {
      stopSpeechRecognition();
      setIsListeningState(false);
    } else {
      const errorScope = fieldIdentifier.startsWith('market') ? 'market' : 'yield';
      handleSpeechInput(setter, setIsListeningState, inputRef, errorScope);
    }
  };


  const handleMarketQuery = useCallback(async () => {
    setIsMarketLoading(true);
    setMarketError(null);
    setMarketAdvice(null);

    const prompt = `
      Provide a brief market overview for ${cropName} in the ${region} region. 
      Include:
      1. cropName: (string) The name of the crop.
      2. overview: (string) A general summary of the current market situation (e.g., demand, supply, price trends). Ensure this string is a valid JSON string (e.g., newlines escaped as \\\\n if any).
      3. priceFactors: (string[]) A list of 2-3 key factors currently influencing its price in that region. Each string in the array must be a valid JSON string.
      4. trend: (number[] optional) An array of 3-5 numbers representing a simplified recent price trend (e.g. arbitrary units like [70, 72, 75, 73]). If not applicable, omit this field.
      Return the response as a single JSON object. All string values must be valid JSON strings (e.g., special characters like quotes and newlines properly escaped).
      Example: {"cropName": "Wheat", "overview": "Market prices for wheat are currently stable with good demand.", "priceFactors": ["Monsoon quality", "MSP announcements"], "trend": [100, 102, 101]}
    `;
    const systemInstruction = "You are an agricultural market analyst providing concise market information in JSON format. Ensure all string values in the JSON are properly escaped.";

    try {
      const result = await generateJson<MarketInfo>(prompt, systemInstruction);
      if (result) { // Should always be true if generateJson doesn't throw for valid data
        let chartData: ChartData | undefined = undefined;
        if (result.trend && result.trend.length > 0) {
            chartData = {
                labels: result.trend.map((_, i) => `${t('general.period') || 'Period'} ${i+1}`),
                values: result.trend,
                dataLabel: t('marketYield.priceTrendLabel', { cropName: result.cropName }) 
            }
        }
        const formattedAdvice: Advice = {
          title: t('marketYield.marketOverviewTitle', { cropName: result.cropName, region }),
          description: result.overview,
          details: result.priceFactors.map(factor => `${t('general.factor') || 'Factor'}: ${factor}`),
          chartData: chartData
        };
        setMarketAdvice(formattedAdvice);
      } else {
         // This case should ideally not be reached if generateJson throws on error.
        setMarketError(t('marketYield.marketInfoUnavailable'));
        setMarketAdvice({title: t('marketYield.marketInfoUnavailable'), description: t('marketYield.errorFetching')});
      }
    } catch (e) {
      console.error("Error fetching market info:", e);
      let displayError: string;
      if (e instanceof JsonParsingError) {
        displayError = t('marketYield.errorParsingJson', { details: e.message });
      } else if (e instanceof Error) {
        displayError = t('marketYield.errorFetchingGeneral', { message: e.message });
      } else {
        displayError = t('marketYield.errorFetching');
      }
      setMarketError(displayError);
      setMarketAdvice({title: t('general.error'), description: displayError});
    } finally {
      setIsMarketLoading(false);
    }
  }, [cropName, region, t]);

  const handleYieldQuery = useCallback(async () => {
    setIsYieldLoading(true);
    setYieldError(null);
    setYieldAdvice(null);

    const prompt = `
      For ${cropName} grown in ${soilType} soil with ${irrigation} and expected weather like "${expectedWeather}", provide:
      1. cropName: (string) The crop name.
      2. prediction: (string) A simple yield prediction. Ensure this string is a valid JSON string (e.g., newlines escaped as \\\\n if any).
      3. affectingFactors: (string[]) A list of 2-3 key factors. Each string in the array must be a valid JSON string.
      4. estimatedYieldRange: (number[] optional) A pair of numbers representing a typical yield range in quintals per acre e.g. [10, 12]. If not applicable, omit.
      Keep the language very simple. Return JSON. All string values must be valid JSON strings (e.g., special characters like quotes and newlines properly escaped).
      Example: {"cropName": "Rice", "prediction": "Yield expected to be above average, provided timely care.", "affectingFactors": ["Timely rainfall", "Pest management"], "estimatedYieldRange": [22, 25]}
    `;
    const systemInstruction = "You are an agricultural expert providing simple yield predictions in JSON format. Ensure all string values in the JSON are properly escaped.";
    
    try {
      const result = await generateJson<YieldPrediction>(prompt, systemInstruction);
      if (result) { // Should always be true if generateJson doesn't throw for valid data
         let chartData: ChartData | undefined = undefined;
         if (result.estimatedYieldRange && result.estimatedYieldRange.length === 2) {
             chartData = {
                 labels: [t('marketYield.minYieldLabel') || 'Min Yield', t('marketYield.maxYieldLabel') || 'Max Yield'],
                 values: result.estimatedYieldRange,
                 dataLabel: t('marketYield.estimatedYieldRangeLabel', { unit: 'quintals/acre', cropName: result.cropName })
             }
         }
        const formattedAdvice: Advice = {
          title: t('marketYield.yieldPredictionTitle', { cropName: result.cropName }),
          description: `${t('general.prediction') || 'Prediction'}: ${result.prediction}`,
          details: result.affectingFactors.map(factor => `${t('general.factor') || 'Factor'}: ${factor}`),
          chartData: chartData,
        };
        setYieldAdvice(formattedAdvice);
      } else {
        // This case should ideally not be reached.
        setYieldError(t('marketYield.yieldPredictionUnavailable'));
        setYieldAdvice({title: t('marketYield.yieldPredictionUnavailable'), description: t('marketYield.errorFetching')});
      }
    } catch (e) {
      console.error("Error fetching yield prediction:", e);
      let displayError: string;
      if (e instanceof JsonParsingError) {
        displayError = t('marketYield.errorParsingJson', { details: e.message });
      } else if (e instanceof Error) {
        displayError = t('marketYield.errorFetchingGeneral', { message: e.message });
      } else {
        displayError = t('marketYield.errorFetching');
      }
      setYieldError(displayError);
      setYieldAdvice({title: t('general.error'), description: displayError});
    } finally {
      setIsYieldLoading(false);
    }
  }, [cropName, soilType, irrigation, expectedWeather, t]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <Card title={t('marketYield.marketTitle')} titleIcon={<i className="fas fa-store-alt"></i>}>
        <div className="space-y-4 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="marketCropName" className="block text-sm font-medium text-gray-700 mb-1">{t('marketYield.cropNameLabel')}</label>
              <input type="text" id="marketCropName" value={cropName} onChange={(e) => setCropName(e.target.value)} ref={marketCropRef} className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" placeholder={isListeningMarketCrop ? t('general.micPlaceholder') : t('marketYield.cropNamePlaceholder')} />
               <Button type="button" variant='outline' size='sm' onClick={() => toggleListening('marketCrop', setCropName, isListeningMarketCrop, setIsListeningMarketCrop, marketCropRef)} className="absolute right-1 top-7 p-2" aria-label="Speak crop name for market">
                  <i className={`fas ${isListeningMarketCrop ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
              </Button>
            </div>
            <div className="relative">
              <label htmlFor="marketRegion" className="block text-sm font-medium text-gray-700 mb-1">{t('marketYield.regionLabel')}</label>
              <input type="text" id="marketRegion" value={region} onChange={(e) => setRegion(e.target.value)} ref={marketRegionRef} className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" placeholder={isListeningMarketRegion ? t('general.micPlaceholder') : t('marketYield.regionPlaceholder')} />
              <Button type="button" variant='outline' size='sm' onClick={() => toggleListening('marketRegion', setRegion, isListeningMarketRegion, setIsListeningMarketRegion, marketRegionRef)} className="absolute right-1 top-7 p-2" aria-label="Speak region for market">
                  <i className={`fas ${isListeningMarketRegion ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
              </Button>
            </div>
          </div>
          <Button onClick={handleMarketQuery} isLoading={isMarketLoading} disabled={isMarketLoading} className="w-full" icon={<i className="fas fa-dollar-sign"></i>}>
            {t('marketYield.marketSubmitButton')}
          </Button>
        </div>
        {marketError && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm mt-2" role="alert">{marketError}</p>}
        {(marketAdvice || isMarketLoading) && <div className="mt-4"><AdviceCard advice={marketAdvice} isLoading={isMarketLoading} titleIcon={<i className="fas fa-chart-pie text-amber-300"></i>} /></div>}
      </Card>

      <Card title={t('marketYield.yieldTitle')} titleIcon={<i className="fas fa-tractor"></i>}>
        <div className="space-y-4 p-2">
           <div className="relative">
              <label htmlFor="yieldCropName" className="block text-sm font-medium text-gray-700 mb-1">{t('marketYield.yieldCropNameLabel')}</label>
              <input type="text" id="yieldCropName" value={cropName} onChange={(e) => setCropName(e.target.value)} ref={yieldCropRef} className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" placeholder={isListeningYieldCrop ? t('general.micPlaceholder') : t('marketYield.cropNamePlaceholder')} />
              <Button type="button" variant='outline' size='sm' onClick={() => toggleListening('yieldCrop', setCropName, isListeningYieldCrop, setIsListeningYieldCrop, yieldCropRef)} className="absolute right-1 top-7 p-2" aria-label="Speak crop name for yield">
                  <i className={`fas ${isListeningYieldCrop ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
              </Button>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="yieldSoilType" className="block text-sm font-medium text-gray-700 mb-1">{t('marketYield.soilTypeLabel')}</label>
              <select id="yieldSoilType" value={soilType} onChange={(e) => setSoilType(e.target.value as SoilType)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                {Object.values(SoilType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="yieldIrrigation" className="block text-sm font-medium text-gray-700 mb-1">{t('marketYield.irrigationLabel')}</label>
              <select id="yieldIrrigation" value={irrigation} onChange={(e) => setIrrigation(e.target.value as WaterAvailability)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                {Object.values(WaterAvailability).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
             <div className="relative">
              <label htmlFor="yieldWeather" className="block text-sm font-medium text-gray-700 mb-1">{t('marketYield.expectedWeatherLabel')}</label>
              <input type="text" id="yieldWeather" value={expectedWeather} onChange={(e) => setExpectedWeather(e.target.value)} ref={yieldWeatherRef} className="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" placeholder={isListeningYieldWeather ? t('general.micPlaceholder') : t('marketYield.expectedWeatherPlaceholder')} />
              <Button type="button" variant='outline' size='sm' onClick={() => toggleListening('yieldWeather', setExpectedWeather, isListeningYieldWeather, setIsListeningYieldWeather, yieldWeatherRef)} className="absolute right-1 top-7 p-2" aria-label="Speak expected weather for yield">
                  <i className={`fas ${isListeningYieldWeather ? 'fa-stop-circle text-red-500' : 'fa-microphone'}`}></i>
              </Button>
            </div>
          </div>
          <Button onClick={handleYieldQuery} isLoading={isYieldLoading} disabled={isYieldLoading} className="w-full" icon={<i className="fas fa-chart-bar"></i>}>
            {t('marketYield.yieldSubmitButton')}
          </Button>
        </div>
        {yieldError && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm mt-2" role="alert">{yieldError}</p>}
        {(yieldAdvice || isYieldLoading) && <div className="mt-4"><AdviceCard advice={yieldAdvice} isLoading={isYieldLoading} titleIcon={<i className="fas fa-seedling text-lime-300"></i>} /></div>}
      </Card>
    </div>
  );
};

export default MarketYieldView;
