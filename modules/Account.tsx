
import React, { useState } from 'react';
import { 
  Bell, 
  Settings as SettingsIcon, 
  LogOut, 
  TrendingUp,
  Box,
  LifeBuoy,
  HelpCircle,
  Phone,
  UserPlus,
  FileText,
  User as UserIcon,
  QrCode,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { AppScreen, User } from '../types';

interface AccountProps {
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
  user: User | null;
}

const Account: React.FC<AccountProps> = ({ onNavigate, onLogout, user }) => {
  const userId = user?.id || localStorage.getItem('kite_current_user_id') || localStorage.getItem('kite_saved_userid') || 'IH6978';
  const displayName = user?.fullName || 'User Profile';
  const displayEmail = user?.email || 'user@kite.pro';
  const isAdmin = localStorage.getItem('kite_saved_adminid') !== null;
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-black transition-colors relative screen-fade-in pb-32">
      
      {/* Profile Header */}
      <div className="px-8 py-10 flex items-start justify-between">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-brand-500 rounded-[28px] flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-brand-500/20 border-4 border-white dark:border-gray-900">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tighter italic uppercase">{displayName}</h1>
            <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-widest">{userId} • {displayEmail}</p>
          </div>
        </div>
        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 active:scale-90 transition-all">
          <Bell className="text-gray-900 dark:text-white" size={22} />
        </button>
      </div>

      {/* Main List */}
      <div className="px-5">
        <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-900 shadow-soft overflow-hidden">
          <AccountListItem 
            icon={<TrendingUp size={20} className="text-brand-500" />} 
            label="Funds & Margins" 
            onClick={() => onNavigate(AppScreen.FUNDS)} 
          />
          <AccountListItem 
            icon={<QrCode size={20} className="text-gray-400" />} 
            label="App Code" 
            onClick={() => {}} 
          />
          <AccountListItem 
            icon={<UserIcon size={20} className="text-gray-400" />} 
            label="Profile Details" 
            onClick={() => onNavigate(AppScreen.PROFILE)} 
          />
          <AccountListItem 
            icon={<SettingsIcon size={20} className="text-gray-400" />} 
            label="Settings" 
            onClick={() => onNavigate(AppScreen.SETTINGS)} 
          />
          
          {isAdmin && (
            <AccountListItem 
              icon={<ShieldCheck size={20} className="text-blue-500" />} 
              label="Admin Terminal" 
              onClick={() => onNavigate(AppScreen.ADMIN_PANEL)} 
            />
          )}
          
          {/* Privacy Toggle */}
          <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800/50 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer" onClick={() => setPrivacyMode(!privacyMode)}>
            <div className="flex flex-col">
              <span className="text-gray-900 dark:text-gray-100 font-black text-sm uppercase tracking-tight">Privacy Mode</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Mask sensitive info</span>
            </div>
            <div 
              className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${privacyMode ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-800'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${privacyMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          <AccountListItem 
            icon={<Box size={20} className="text-gray-400" />} 
            label="Connected Apps" 
            onClick={() => {}} 
          />
          <AccountListItem 
            icon={<LogOut size={20} className="text-kiteRed" />} 
            label="Logout" 
            onClick={onLogout} 
            isLast
          />
        </div>
      </div>

      {/* Console Section */}
      <div className="px-8 pt-12 pb-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Console</h2>
          <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-brand-500/20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 10 L85 45 L50 90 L15 45 Z" fill="white" />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <ConsoleLink label="Portfolio" />
          <ConsoleLink label="Tradebook" />
          <ConsoleLink label="P&L Reports" />
          <ConsoleLink label="Tax P&L" />
          <ConsoleLink label="Gift Stocks" />
          <ConsoleLink label="Family" />
          <ConsoleLink label="Downloads" />
        </div>
      </div>

      {/* Support Section */}
      <div className="px-8 pt-10 pb-6">
        <h2 className="text-base font-black text-gray-900 dark:text-white mb-8 uppercase tracking-tighter italic">Support</h2>
        <div className="grid grid-cols-1 gap-6">
          <SupportItem icon={<LifeBuoy size={20} className="text-gray-400" />} label="Support Portal" />
          <SupportItem icon={<HelpCircle size={20} className="text-gray-400" />} label="User Manual" />
          <SupportItem icon={<Phone size={20} className="text-gray-400" />} label="Contact Support" />
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed right-8 bottom-28 w-14 h-14 bg-brand-500 shadow-2xl shadow-brand-500/40 rounded-[22px] flex items-center justify-center text-white active:scale-90 transition-all z-40 border-4 border-white dark:border-black">
        <TrendingUp size={28} strokeWidth={3} />
      </button>
    </div>
  );
};

const AccountListItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isLast?: boolean }> = ({ icon, label, onClick, isLast }) => (
  <div 
    onClick={onClick} 
    className={`px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-all ${!isLast ? 'border-b border-gray-50 dark:border-gray-800/50' : ''}`}
  >
    <span className="text-gray-900 dark:text-gray-100 font-black text-sm uppercase tracking-tight">{label}</span>
    <div className="text-gray-400 group-hover:text-brand-500 transition-colors">{icon}</div>
  </div>
);

const ConsoleLink: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-brand-500 text-sm font-black uppercase tracking-widest hover:text-brand-600 cursor-pointer transition-colors bg-brand-500/5 px-4 py-3 rounded-2xl border border-brand-500/10 text-center">
    {label}
  </div>
);

const SupportItem: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-5 text-gray-900 dark:text-gray-100 hover:text-brand-500 cursor-pointer transition-all group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-brand-500/10 group-hover:text-brand-500 transition-all">
      {icon}
    </div>
    <span className="text-sm font-black uppercase tracking-widest">{label}</span>
  </div>
);

export default Account;
