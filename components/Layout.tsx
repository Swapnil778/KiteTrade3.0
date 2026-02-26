
import React, { useState, useEffect } from 'react';
import { AppScreen } from '../types';
import { 
  BarChart2, 
  Briefcase, 
  FileText, 
  GanttChart, 
  User,
  Bell,
  ChevronLeft,
  Search,
  Menu,
  Download,
  Filter,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useNotifications } from './NotificationProvider';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  hideNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onNavigate, hideNav = false }) => {
  const userId = localStorage.getItem('kite_saved_userid') || 'IH6978';
  const { unreadCount, markAllAsRead, clearNotifications, notifications } = useNotifications();

  const isAccountActive = [AppScreen.ACCOUNT, AppScreen.PROFILE, AppScreen.SETTINGS, AppScreen.FUNDS, AppScreen.NOTIFICATIONS].includes(activeScreen);

  const getTitle = () => {
    switch (activeScreen) {
      case AppScreen.WATCHLIST: return 'Watchlist';
      case AppScreen.ORDERS: return 'Orders';
      case AppScreen.PORTFOLIO: return 'Portfolio';
      case AppScreen.BIDS: return 'Bids';
      case AppScreen.ACCOUNT: return 'Account';
      case AppScreen.PROFILE: return 'Profile';
      case AppScreen.SETTINGS: return 'Settings';
      case AppScreen.FUNDS: return 'Funds';
      case AppScreen.NOTIFICATIONS: return 'Notifications';
      default: return 'KiteTrade Pro';
    }
  };

  const isSubScreen = [AppScreen.PROFILE, AppScreen.SETTINGS, AppScreen.FUNDS, AppScreen.NOTIFICATIONS].includes(activeScreen);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white dark:bg-black overflow-hidden relative transition-colors duration-200 shadow-2xl border-x border-gray-100 dark:border-gray-900">
      
      {/* Header */}
      {!hideNav && (
        <header className="sticky top-0 w-full bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 px-4 py-4 flex items-center justify-between z-50 transition-colors">
          <div className="flex items-center gap-3">
            {isSubScreen && (
              <button 
                onClick={() => onNavigate(AppScreen.ACCOUNT)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{getTitle()}</h1>
          </div>
          <div className="flex items-center gap-1">
            {activeScreen === AppScreen.WATCHLIST && (
              <div className="flex gap-3 mr-2 text-gray-400">
                <Search size={18} />
                <Menu size={18} />
              </div>
            )}
            {activeScreen === AppScreen.ORDERS && (
              <div className="flex gap-3 mr-2 text-gray-400">
                <Search size={18} />
                <Download size={18} />
                <Filter size={18} />
              </div>
            )}
            {activeScreen === AppScreen.NOTIFICATIONS && notifications.length > 0 && (
              <div className="flex gap-1 mr-2">
                <button 
                  onClick={markAllAsRead}
                  className="p-2 text-gray-400 hover:text-[#387ed1] transition-colors"
                  title="Mark all as read"
                >
                  <CheckCircle2 size={20} />
                </button>
                <button 
                  onClick={clearNotifications}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
            <button 
              onClick={() => onNavigate(AppScreen.NOTIFICATIONS)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative"
            >
              <Bell size={22} className={`transition-colors ${activeScreen === AppScreen.NOTIFICATIONS ? 'text-[#387ed1]' : 'text-gray-600 dark:text-gray-400'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-black">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto hide-scrollbar pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-black border-t border-gray-100 dark:border-gray-900 flex items-center justify-between px-1 z-50 transition-colors">
          <NavItem 
            icon={<BarChart2 size={20} />} 
            label="Watchlist" 
            isActive={activeScreen === AppScreen.WATCHLIST} 
            onClick={() => onNavigate(AppScreen.WATCHLIST)} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Orders" 
            isActive={activeScreen === AppScreen.ORDERS} 
            onClick={() => onNavigate(AppScreen.ORDERS)} 
          />
          <NavItem 
            icon={<Briefcase size={20} />} 
            label="Portfolio" 
            isActive={activeScreen === AppScreen.PORTFOLIO} 
            onClick={() => onNavigate(AppScreen.PORTFOLIO)} 
          />
          <NavItem 
            icon={<GanttChart size={20} />} 
            label="Bids" 
            isActive={activeScreen === AppScreen.BIDS} 
            onClick={() => onNavigate(AppScreen.BIDS)} 
          />
          <NavItem 
            icon={<User size={20} />} 
            label={userId} 
            isActive={isAccountActive} 
            onClick={() => onNavigate(AppScreen.ACCOUNT)} 
          />
        </nav>
      )}
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 py-3 gap-0.5 transition-all duration-100 ${isActive ? 'text-[#387ed1]' : 'text-gray-400 dark:text-gray-600'}`}
  >
    <div className="mb-0.5">{icon}</div>
    <span className={`text-[9px] font-bold tracking-tight uppercase`}>{label}</span>
  </button>
);

export default Layout;
