
// Fix: Removed duplicate and erroneous React imports
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  AlertCircle, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../services/apiService';

interface AdminLoginProps {
  onLogin: (identifier: string) => void;
  onForgot: () => void;
  onSignUp: () => void;
  onBackToUserLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onForgot, onSignUp, onBackToUserLogin }) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    const savedAdminId = localStorage.getItem('kite_saved_adminid');
    if (savedAdminId) {
      setAdminId(savedAdminId);
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsShaking(false);

    if (!adminId || !password) {
      setError('Please enter both Admin ID and Password');
      setIsShaking(true);
      return;
    }

    setIsLoggingIn(true);

    // Login with server
    const performLogin = async () => {
      try {
        const data = await apiRequest<any>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: adminId, password, isAdmin: true })
        });
        
        if (data.status === 'ok') {
          localStorage.setItem('kite_saved_adminid', adminId);
          localStorage.setItem('kite_is_logged_in', 'true');
          localStorage.setItem('kite_current_screen', 'ADMIN_PANEL');
          
          // Update local storage to remember this admin
          const storageKey = 'kite_registered_admins';
          let registeredAdmins = [];
          try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
              registeredAdmins = JSON.parse(saved);
              if (!Array.isArray(registeredAdmins)) registeredAdmins = [];
            }
          } catch (e) {
            registeredAdmins = [];
          }

          if (!registeredAdmins.includes(adminId)) {
            registeredAdmins.push(adminId);
            localStorage.setItem(storageKey, JSON.stringify(registeredAdmins));
          }

          onLogin(adminId);
        }
      } catch (err: any) {
        console.error("Admin login network error:", err);
        setError(err.message || "Network connection failed. Please check your internet.");
        setIsLoggingIn(false);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    };

    performLogin();
  };

  return (
    <div className="p-6 pt-12 flex flex-col h-full transition-colors relative screen-fade-in overflow-y-auto hide-scrollbar bg-[#0b0e14] text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <button 
          onClick={onBackToUserLogin}
          className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        
        {/* Admin Logo */}
        <div className="relative w-14 h-14 rounded-full p-0.5 shadow-xl flex items-center justify-center overflow-hidden bg-gradient-to-tr from-blue-600 to-blue-400">
          <div className="w-full h-full rounded-full flex items-center justify-center border-2 border-white/20 shadow-inner bg-gradient-to-b from-gray-800 to-black">
            <svg viewBox="0 0 100 100" className="w-8 h-8 drop-shadow-md">
              <path d="M50 10 L85 45 L50 90 L15 45 Z" fill="#2563eb" />
              <path d="M50 10 L65 30 L50 45 L35 30 Z" fill="#3b82f6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="text-blue-500" size={24} />
          <h1 className="text-3xl font-black tracking-tighter italic uppercase text-white">
            Staff <span className="text-blue-500">Terminal</span>
          </h1>
        </div>
        <p className="text-sm font-medium text-gray-500">
          Accessing Secure Administrative Layer
        </p>
      </div>

      <form onSubmit={handleAdminLogin} className={`space-y-6 ${isShaking ? 'animate-shake' : ''}`}>
        {/* Admin ID Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Administrator ID / Identity</label>
          <div className="relative flex items-center border-b border-gray-800 focus-within:border-blue-500 transition-all">
            <Mail size={18} className="text-gray-600 absolute left-0" />
            <input 
              type="text" 
              autoFocus
              disabled={isLoggingIn}
              className="w-full bg-transparent outline-none py-3 pl-8 text-xl font-bold placeholder:text-gray-800"
              placeholder="Enter Authorized Identity"
              value={adminId}
              onChange={(e) => { setAdminId(e.target.value); setError(null); }}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Password</label>
          <div className="relative flex items-center border-b border-gray-800 focus-within:border-blue-500 transition-all">
            <Lock size={18} className="text-gray-600 absolute left-0" />
            <input 
              type={showPassword ? "text" : "password"}
              disabled={isLoggingIn}
              className="w-full bg-transparent outline-none py-3 pl-8 pr-10 text-xl font-bold placeholder:text-gray-800"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 p-2 text-gray-600 hover:text-blue-400 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="button" onClick={onForgot} className="text-blue-500 text-[11px] font-black uppercase tracking-widest hover:underline">
            Forgot Security Credentials?
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[#df514c] text-sm font-bold bg-red-500/5 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={isLoggingIn || !adminId || !password}
          className={`w-full py-4 rounded-xl font-bold text-lg mt-4 transition-all shadow-sm flex items-center justify-center gap-3 ${
            (!adminId || !password || isLoggingIn) 
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700' 
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-[0.98]'
          }`}
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="animate-spin" size={22} />
              AUTHENTICATING...
            </>
          ) : (
            <>ACCESS TERMINAL <ArrowRight size={18} /></>
          )}
        </button>
      </form>

      {/* Footer Info */}
      <div className="mt-auto pt-10 pb-6 flex flex-col items-center gap-8">
        <div className="w-full pt-8 border-t border-gray-900 flex flex-col items-center">
           <p className="text-gray-600 text-[10px] mb-4 uppercase font-black tracking-widest">Employee Onboarding</p>
           <button 
              type="button"
              onClick={onSignUp}
              className="w-full h-14 bg-transparent border border-blue-500/30 text-blue-500 hover:bg-blue-500/5 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center"
            >
              Request Access
            </button>
        </div>

        <div className="opacity-20 flex flex-col items-center">
           <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-500">Corporate Security Cluster 4.0</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
