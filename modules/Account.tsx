
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
  User,
  QrCode,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppScreen } from '../types';

interface AccountProps {
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

const Account: React.FC<AccountProps> = ({ onNavigate, onLogout }) => {
  const userId = localStorage.getItem('kite_saved_userid') || 'IH6978';
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-black transition-colors relative screen-fade-in pb-20">
      
      {/* Profile Header */}
      <div className="px-5 py-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#387ed1] rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/10">
            U
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">User</h1>
            <p className="text-sm text-gray-500 font-medium">{userId} • user@kite.pro</p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
          <Bell className="text-gray-800 dark:text-gray-100" size={22} />
        </button>
      </div>

      {/* Main List */}
      <div className="border-t border-gray-100 dark:border-gray-900">
        <AccountListItem 
          icon={<TrendingUp size={18} className="text-gray-500" />} 
          label="Funds" 
          onClick={() => onNavigate(AppScreen.FUNDS)} 
        />
        <AccountListItem 
          icon={<QrCode size={18} className="text-gray-500" />} 
          label="App Code" 
          onClick={() => {}} 
        />
        <AccountListItem 
          icon={<User size={18} className="text-gray-500" />} 
          label="Profile" 
          onClick={() => onNavigate(AppScreen.PROFILE)} 
        />
        <AccountListItem 
          icon={<SettingsIcon size={18} className="text-gray-500" />} 
          label="Settings" 
          onClick={() => onNavigate(AppScreen.SETTINGS)} 
        />
        
        {/* Privacy Toggle */}
        <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-900 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Privacy mode</span>
            <span className="text-[10px] text-gray-400">Mask balances and sensitive info</span>
          </div>
          <div 
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`kite-switch cursor-pointer ${privacyMode ? 'active' : ''}`}
          />
        </div>

        <AccountListItem 
          icon={<Box size={18} className="text-gray-500" />} 
          label="Connected apps" 
          onClick={() => {}} 
        />
        <AccountListItem 
          icon={<LogOut size={18} className="text-red-500" />} 
          label="Logout" 
          onClick={onLogout} 
        />
      </div>

      {/* Console Section */}
      <div className="px-5 pt-10 pb-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Console</h2>
          <div className="w-6 h-6 bg-[#387ed1] rounded-sm flex items-center justify-center p-0.5">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 10 L85 45 L50 90 L15 45 Z" fill="white" />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-5">
          <ConsoleLink label="Portfolio" />
          <ConsoleLink label="Tradebook" />
          <ConsoleLink label="P&L" />
          <ConsoleLink label="Tax P&L" />
          <ConsoleLink label="Gift stocks" />
          <ConsoleLink label="Family" />
          <ConsoleLink label="Downloads" />
        </div>
      </div>

      {/* Support Section */}
      <div className="px-5 pt-8 pb-4">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-6">Support</h2>
        <div className="space-y-6">
          <SupportItem icon={<LifeBuoy size={18} className="text-gray-400" />} label="Support portal" />
          <SupportItem icon={<HelpCircle size={18} className="text-gray-400" />} label="User manual" />
          <SupportItem icon={<Phone size={18} className="text-gray-400" />} label="Contact" />
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed right-6 bottom-24 w-12 h-12 bg-[#387ed1] shadow-xl rounded-full flex items-center justify-center text-white active:scale-90 transition-all z-40">
        <TrendingUp size={24} strokeWidth={3} />
      </button>
    </div>
  );
};

const AccountListItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <div 
    onClick={onClick} 
    className="px-5 py-4 border-b border-gray-50 dark:border-gray-900 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
  >
    <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{label}</span>
    <div className="text-gray-400">{icon}</div>
  </div>
);

const ConsoleLink: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-[#387ed1] text-sm font-bold hover:underline cursor-pointer">
    {label}
  </div>
);

const SupportItem: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300 hover:text-[#387ed1] cursor-pointer transition-colors">
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default Account;
