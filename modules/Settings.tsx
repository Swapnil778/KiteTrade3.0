
import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [theme, setTheme] = useState<'default' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'default' | 'dark') || 'default';
  });
  const [toggles, setToggles] = useState({
    notifications: false,
    stickyOrder: false,
    accessibility: false,
    fullscreen: false,
    stickyPins: false,
    watchlistNotes: true,
    rememberQuantity: false
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleItem = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black text-gray-800 dark:text-gray-100 screen-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-black border-b border-gray-50 dark:border-gray-900 px-4 py-4 flex items-center gap-4 z-40">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full">
          <ChevronLeft size={24} className="text-gray-800 dark:text-gray-100" />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Theme Section */}
        <div className="p-5 border-b border-gray-50 dark:border-gray-900">
          <h2 className="text-sm font-bold text-gray-400 mb-5">Theme</h2>
          <div className="space-y-6">
            <label className="flex items-center justify-between cursor-pointer" onClick={() => setTheme('default')}>
              <span className="text-gray-700 dark:text-gray-300 font-medium text-[15px]">Default</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${theme === 'default' ? 'border-[#387ed1]' : 'border-gray-300 dark:border-gray-700'}`}>
                {theme === 'default' && <div className="w-2.5 h-2.5 rounded-full bg-[#387ed1]" />}
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer" onClick={() => setTheme('dark')}>
              <span className="text-gray-700 dark:text-gray-300 font-medium text-[15px]">Dark</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${theme === 'dark' ? 'border-[#387ed1]' : 'border-gray-300 dark:border-gray-700'}`}>
                {theme === 'dark' && <div className="w-2.5 h-2.5 rounded-full bg-[#387ed1]" />}
              </div>
            </label>
          </div>
        </div>

        {/* Options Section */}
        <div className="p-5 space-y-8 pb-32">
          <SettingToggle 
            title="Order notifications" 
            isActive={toggles.notifications} 
            onChange={() => toggleItem('notifications')} 
          />
          <SettingToggle 
            title="Sticky order window" 
            subtitle="Don't automatically hide order window after order placement."
            isActive={toggles.stickyOrder} 
            onChange={() => toggleItem('stickyOrder')} 
          />
          <SettingToggle 
            title="Accessibility mode" 
            subtitle="Disables transitions and simplifies UI."
            isActive={toggles.accessibility} 
            onChange={() => toggleItem('accessibility')} 
          />
          <SettingToggle 
            title="Fullscreen" 
            subtitle="May not work on certain devices."
            isActive={toggles.fullscreen} 
            onChange={() => toggleItem('fullscreen')} 
          />
          <SettingToggle 
            title="Sticky pins" 
            subtitle="Show pinned stock tickers on the top on all screens."
            isActive={toggles.stickyPins} 
            onChange={() => toggleItem('stickyPins')} 
          />
          <SettingToggle 
            title="Show watchlist notes" 
            isActive={toggles.watchlistNotes} 
            onChange={() => toggleItem('watchlistNotes')} 
          />
          <SettingToggle 
            title="Remember F&O order quantity" 
            isActive={toggles.rememberQuantity} 
            onChange={() => toggleItem('rememberQuantity')} 
          />
        </div>
      </div>
    </div>
  );
};

const SettingToggle: React.FC<{ title: string; subtitle?: string; isActive: boolean; onChange: () => void }> = ({ title, subtitle, isActive, onChange }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1">
      <h3 className="text-gray-800 dark:text-gray-200 font-medium text-[15px]">{title}</h3>
      {subtitle && <p className="text-[12px] text-gray-400 mt-1 leading-tight">{subtitle}</p>}
    </div>
    <div 
      onClick={onChange}
      className={`kite-switch mt-1 shrink-0 cursor-pointer ${isActive ? 'active' : ''}`}
    />
  </div>
);

export default Settings;
