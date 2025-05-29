
import React from 'react';
import type { ViewName } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavbarProps {
  navigateTo: (view: ViewName) => void;
  currentView: ViewName;
}

interface NavItemConfig {
  id: ViewName;
  translationKey: string; // Key for useLanguage hook
  icon: string; // FontAwesome class
}

const navItemConfigs: NavItemConfig[] = [
  { id: 'dashboard', translationKey: 'navbar.dashboard', icon: 'fa-home' },
  { id: 'cropAdvice', translationKey: 'navbar.cropGuide', icon: 'fa-seedling' },
  { id: 'diseaseDetection', translationKey: 'navbar.leafDoctor', icon: 'fa-leaf' },
  { id: 'irrigationFertilizer', translationKey: 'navbar.waterFeed', icon: 'fa-tint' },
  { id: 'marketYield', translationKey: 'navbar.marketYield', icon: 'fa-chart-line' },
  { id: 'groundingDemo', translationKey: 'navbar.newsSearch', icon: 'fa-search' },
];

export const Navbar: React.FC<NavbarProps> = ({ navigateTo, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { t } = useLanguage();

  return (
    <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <i className="fas fa-tractor text-3xl mr-3 text-green-300"></i>
            <span className="font-bold text-xl cursor-pointer" onClick={() => navigateTo('dashboard')}>{t('appName')}</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItemConfigs.map(item => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
                  ${currentView === item.id 
                    ? 'bg-green-800 text-white' 
                    : 'text-green-200 hover:bg-green-600 hover:text-white'}`}
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                <i className={`fas ${item.icon} mr-2`}></i>
                {t(item.translationKey)}
              </button>
            ))}
            <LanguageSwitcher />
          </div>

          <div className="md:hidden flex items-center">
            <LanguageSwitcher />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-green-200 hover:text-white focus:outline-none p-2 ml-2"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-green-700" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItemConfigs.map(item => (
              <button
                key={item.id}
                onClick={() => { navigateTo(item.id); setIsMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-150
                  ${currentView === item.id 
                    ? 'bg-green-800 text-white' 
                    : 'text-green-200 hover:bg-green-600 hover:text-white'}`}
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                <i className={`fas ${item.icon} mr-3 w-5 text-center`}></i>
                {t(item.translationKey)}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
