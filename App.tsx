
import React, { useState, Suspense, useEffect, useCallback } from 'react';
import { APP_TITLE, IS_API_KEY_CONFIGURED } from './constants'; // APP_TITLE will be managed by LanguageContext now
import { LoadingSpinner } from './components/LoadingSpinner';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ApiKeyMissingBanner } from './components/ApiKeyMissingBanner';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// Dynamic imports for views
import DashboardView from './views/DashboardView';
import CropAdviceView from './views/CropAdviceView';
import DiseaseDetectionView from './views/DiseaseDetectionView';
import IrrigationFertilizerView from './views/IrrigationFertilizerView';
import MarketYieldView from './views/MarketYieldView';
import GroundingDemoView from './views/GroundingDemoView';


export type ViewName = 'dashboard' | 'cropAdvice' | 'diseaseDetection' | 'irrigationFertilizer' | 'marketYield' | 'groundingDemo';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewName>('dashboard');
  const [apiKeyOk, setApiKeyOk] = useState<boolean>(false);
  const { t } = useLanguage(); // For app title, if needed here, though Navbar handles its title

  useEffect(() => {
    setApiKeyOk(IS_API_KEY_CONFIGURED);
  }, []);

  const navigateTo = useCallback((view: ViewName) => {
    setCurrentView(view);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'cropAdvice':
        return <CropAdviceView />;
      case 'diseaseDetection':
        return <DiseaseDetectionView />;
      case 'irrigationFertilizer':
        return <IrrigationFertilizerView />;
      case 'marketYield':
        return <MarketYieldView />;
      case 'groundingDemo':
        return <GroundingDemoView />;
      case 'dashboard':
      default:
        return <DashboardView navigateTo={navigateTo} />;
    }
  };
  
  // Update document title when language or app name changes
  useEffect(() => {
    document.title = t('appName');
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-100 via-emerald-50 to-lime-100">
      <Navbar navigateTo={navigateTo} currentView={currentView} />
      
      {!apiKeyOk && <ApiKeyMissingBanner />}

      <main className={`flex-grow container mx-auto px-4 py-8 ${!apiKeyOk ? 'pt-28 sm:pt-24' : 'pt-8'}`}> {/* Adjust padding if banner is shown */}
        <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>}>
          {renderView()}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
