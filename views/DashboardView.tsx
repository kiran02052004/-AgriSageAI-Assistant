
import React from 'react';
import { Card } from '../components/Card'; // Card itself doesn't need translation, its content does.
import type { ViewName } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardViewProps {
  navigateTo: (view: ViewName) => void;
}

interface DashboardItemConfig {
  id: ViewName;
  titleKey: string; // Translation key for title
  descriptionKey: string; // Translation key for description
  icon: React.ReactNode; 
  color: string; 
}

const itemConfigs: DashboardItemConfig[] = [
  { 
    id: 'cropAdvice', 
    titleKey: 'navbar.cropGuide', 
    descriptionKey: 'dashboard.cropGuideDesc', 
    icon: <i className="fas fa-seedling"></i>,
    color: 'bg-green-500'
  },
  { 
    id: 'diseaseDetection', 
    titleKey: 'navbar.leafDoctor', 
    descriptionKey: 'dashboard.leafDoctorDesc', 
    icon: <i className="fas fa-leaf"></i>,
    color: 'bg-lime-500'
  },
  { 
    id: 'irrigationFertilizer', 
    titleKey: 'navbar.waterFeed', 
    descriptionKey: 'dashboard.waterFeedDesc', 
    icon: <i className="fas fa-tint"></i>,
    color: 'bg-sky-500'
  },
  { 
    id: 'marketYield', 
    titleKey: 'navbar.marketYield', 
    descriptionKey: 'dashboard.marketYieldDesc', 
    icon: <i className="fas fa-chart-line"></i>,
    color: 'bg-amber-500'
  },
  { 
    id: 'groundingDemo', 
    titleKey: 'navbar.newsSearch', 
    descriptionKey: 'dashboard.newsSearchDesc', 
    icon: <i className="fas fa-search"></i>,
    color: 'bg-indigo-500'
  },
];

const DashboardView: React.FC<DashboardViewProps> = ({ navigateTo }) => {
  const { t } = useLanguage();

  return (
    <div className="animate-fadeIn">
      <header className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-green-700 mb-3">{t('dashboard.welcomeTitle')}</h1>
        <p className="text-lg text-gray-600">{t('tagline')}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {itemConfigs.map((item) => (
          <div
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`
              ${item.color} text-white p-6 rounded-xl shadow-lg 
              hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 
              cursor-pointer flex flex-col items-center text-center
            `}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && navigateTo(item.id)}
          >
            <div className="text-5xl mb-4 p-3 bg-black bg-opacity-10 rounded-full">
              {item.icon}
            </div>
            <h2 className="text-2xl font-semibold mb-2">{t(item.titleKey)}</h2>
            <p className="text-sm opacity-90">{t(item.descriptionKey)}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold text-green-700 mb-4 text-center">{t('dashboard.howItHelpsTitle')}</h3>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-4xl text-green-600 mb-2"><i className="fas fa-brain"></i></div>
            <h4 className="font-semibold text-lg mb-1">{t('dashboard.smartDecisions')}</h4>
            <p className="text-sm text-gray-600">{t('dashboard.smartDecisionsDesc')}</p>
          </div>
          <div className="p-4">
            <div className="text-4xl text-green-600 mb-2"><i className="fas fa-camera-retro"></i></div>
            <h4 className="font-semibold text-lg mb-1">{t('dashboard.earlyDetection')}</h4>
            <p className="text-sm text-gray-600">{t('dashboard.earlyDetectionDesc')}</p>
          </div>
          <div className="p-4">
            <div className="text-4xl text-green-600 mb-2"><i className="fas fa-microphone-alt"></i></div>
            <h4 className="font-semibold text-lg mb-1">{t('dashboard.easyToUse')}</h4>
            <p className="text-sm text-gray-600">{t('dashboard.easyToUseDesc')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
