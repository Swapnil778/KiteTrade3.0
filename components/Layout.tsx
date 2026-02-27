
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
    <div className="flex h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-200">
      
      {/* Desktop Sidebar */}
      {!hideNav && (
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-black border-r border-gray-100 dark:border-gray-900 z-50">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <svg viewBox="0 0 100 100" className="w-6 h-6">
                  <path d="M50 10 L85 45 L50 90 L15 45 Z" fill="white" />
                </svg>
              </div>
              <span className="text-lg font-black tracking-tighter italic uppercase dark:text-white">KiteTrade</span>
            </div>

            <nav className="space-y-2">
              <SidebarItem 
                icon={<BarChart2 size={20} />} 
                label="Watchlist" 
                isActive={activeScreen === AppScreen.WATCHLIST} 
                onClick={() => onNavigate(AppScreen.WATCHLIST)} 
              />
              <SidebarItem 
                icon={<FileText size={20} />} 
                label="Orders" 
                isActive={activeScreen === AppScreen.ORDERS} 
                onClick={() => onNavigate(AppScreen.ORDERS)} 
              />
              <SidebarItem 
                icon={<Briefcase size={20} />} 
                label="Portfolio" 
                isActive={activeScreen === AppScreen.PORTFOLIO} 
                onClick={() => onNavigate(AppScreen.PORTFOLIO)} 
              />
              <SidebarItem 
                icon={<GanttChart size={20} />} 
                label="Bids" 
                isActive={activeScreen === AppScreen.BIDS} 
                onClick={() => onNavigate(AppScreen.BIDS)} 
              />
              <SidebarItem 
                icon={<User size={20} />} 
                label="Account" 
                isActive={isAccountActive} 
                onClick={() => onNavigate(AppScreen.ACCOUNT)} 
              />
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-gray-50 dark:border-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 font-bold">
                {userId.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black dark:text-white">{userId}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Session</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="flex flex-col h-full w-full max-w-md md:max-w-none mx-auto bg-white dark:bg-black overflow-hidden relative transition-colors duration-200 md:shadow-none shadow-2xl border-x md:border-x-0 border-gray-100 dark:border-gray-900">
          
          {/* Header */}
          {!hideNav && (
            <header className="sticky top-0 w-full glass border-b border-gray-100/50 dark:border-gray-900/50 px-5 py-4 flex items-center justify-between z-50 transition-colors">
              <div className="flex items-center gap-4">
                {isSubScreen && (
                  <button 
                    onClick={() => onNavigate(AppScreen.ACCOUNT)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-90"
                  >
                    <ChevronLeft size={22} className="text-gray-900 dark:text-gray-100" />
                  </button>
                )}
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">{getTitle()}</h1>
              </div>
              <div className="flex items-center gap-2">
                {activeScreen === AppScreen.WATCHLIST && (
                  <div className="flex gap-4 mr-2 text-gray-400 dark:text-gray-500">
                    <Search size={20} className="hover:text-brand-500 transition-colors cursor-pointer" />
                    <Menu size={20} className="hover:text-brand-500 transition-colors cursor-pointer" />
                  </div>
                )}
                {activeScreen === AppScreen.ORDERS && (
                  <div className="flex gap-4 mr-2 text-gray-400 dark:text-gray-500">
                    <Search size={20} className="hover:text-brand-500 transition-colors cursor-pointer" />
                    <Download size={20} className="hover:text-brand-500 transition-colors cursor-pointer" />
                    <Filter size={20} className="hover:text-brand-500 transition-colors cursor-pointer" />
                  </div>
                )}
                {activeScreen === AppScreen.NOTIFICATIONS && notifications.length > 0 && (
                  <div className="flex gap-1 mr-2">
                    <button 
                      onClick={markAllAsRead}
                      className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
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
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-90 relative"
                >
                  <Bell size={22} className={`transition-colors ${activeScreen === AppScreen.NOTIFICATIONS ? 'text-brand-500' : 'text-gray-700 dark:text-gray-300'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-black">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </header>
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto hide-scrollbar pb-20 md:pb-0">
            {children}
          </main>

          {/* Bottom Navigation (Mobile Only) */}
          {!hideNav && (
            <nav className="md:hidden fixed bottom-0 w-full max-w-md glass border-t border-gray-100/50 dark:border-gray-900/50 flex items-center justify-between px-2 z-50 transition-colors pb-safe">
              <NavItem 
                icon={<BarChart2 size={22} />} 
                label="Watchlist" 
                isActive={activeScreen === AppScreen.WATCHLIST} 
                onClick={() => onNavigate(AppScreen.WATCHLIST)} 
              />
              <NavItem 
                icon={<FileText size={22} />} 
                label="Orders" 
                isActive={activeScreen === AppScreen.ORDERS} 
                onClick={() => onNavigate(AppScreen.ORDERS)} 
              />
              <NavItem 
                icon={<Briefcase size={22} />} 
                label="Portfolio" 
                isActive={activeScreen === AppScreen.PORTFOLIO} 
                onClick={() => onNavigate(AppScreen.PORTFOLIO)} 
              />
              <NavItem 
                icon={<GanttChart size={22} />} 
                label="Bids" 
                isActive={activeScreen === AppScreen.BIDS} 
                onClick={() => onNavigate(AppScreen.BIDS)} 
              />
              <NavItem 
                icon={<User size={22} />} 
                label={userId} 
                isActive={isAccountActive} 
                onClick={() => onNavigate(AppScreen.ACCOUNT)} 
              />
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
  >
    <div className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand-500'} transition-colors`}>{icon}</div>
    <span className="text-sm font-black uppercase tracking-widest">{label}</span>
  </button>
);

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
