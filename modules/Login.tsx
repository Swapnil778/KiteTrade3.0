
import React, { useState, useEffect } from 'react';
import { ChevronLeft, AlertCircle, Check, ArrowRight, User, X, ShieldCheck, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (isAdmin?: boolean, identifier?: string) => void;
  onForgot: () => void;
  onSignUp: () => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onForgot, onSignUp, isAdmin, onToggleAdmin }) => {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [recentAccounts, setRecentAccounts] = useState<string[]>([]);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    const storageKey = isAdmin ? 'kite_registered_admins' : 'kite_registered_users';
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setRecentAccounts(saved);

    const onboarded = localStorage.getItem('kite_has_onboarded') === 'true';
    setHasOnboarded(onboarded);

    const savedUserId = localStorage.getItem(isAdmin ? 'kite_saved_adminid' : 'kite_saved_userid');
    if (savedUserId) {
      setUserId(savedUserId);
      setRememberMe(true);
    }
  }, [isAdmin]);

  const handleLoginAttempt = (e?: React.FormEvent, directId?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setIsShaking(false);
    
    const inputId = (directId || userId).trim();

    if (!inputId) {
      setError(`Please enter ${isAdmin ? 'Admin ID' : 'Email or Mobile'}`);
      return;
    }

    // Check status with server
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/auth/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: inputId })
        });
        const data = await res.json();
        
        if (data.status === 'blocked') {
          setError(`Your account has been blocked. Reason: ${data.blockReason || 'Violation of terms'}. Please contact support.`);
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 400);
          return false;
        }
        return true;
      } catch (err) {
        console.error("Status check failed:", err);
        return true; // Fallback to local logic if server fails
      }
    };

    const proceedWithLogin = async () => {
      const isAllowed = await checkStatus();
      if (!isAllowed) return;

      const isDemo = inputId.toLowerCase() === 'demo';
      const storageKey = isAdmin ? 'kite_registered_admins' : 'kite_registered_users';
      const registeredUsers = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const isRegistered = registeredUsers.includes(inputId);

      if (isDemo || isRegistered) {
        localStorage.setItem('kite_has_onboarded', 'true');
        
        if (rememberMe) {
          localStorage.setItem(isAdmin ? 'kite_saved_adminid' : 'kite_saved_userid', inputId);
          localStorage.setItem('kite_is_logged_in', 'true');
        } else {
          localStorage.removeItem(isAdmin ? 'kite_saved_adminid' : 'kite_saved_userid');
          localStorage.setItem('kite_is_logged_in', 'true');
        }
        onLogin(isAdmin, inputId);
      } else {
        setError(isAdmin ? 'Staff ID not recognized.' : 'Account not found. Please sign up first.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
      }
    };

    proceedWithLogin();
  };

  const removeRecent = (acc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const storageKey = isAdmin ? 'kite_registered_admins' : 'kite_registered_users';
    const updated = recentAccounts.filter(a => a !== acc);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setRecentAccounts(updated);
  };

  const hasRegistered = recentAccounts.length > 0 || hasOnboarded;

  return (
    <div className={`p-6 pt-12 flex flex-col h-full transition-colors relative screen-fade-in overflow-y-auto hide-scrollbar ${isAdmin ? 'bg-[#0b0e14] text-gray-100' : 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100'}`}>
      <div className="flex justify-between items-center mb-12">
        <ChevronLeft 
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-1 rounded-full transition-colors" 
          size={24} 
          onClick={isAdmin ? onToggleAdmin : onForgot} 
        />
        
        {/* Logo */}
        <div className={`relative w-14 h-14 rounded-full p-0.5 shadow-xl flex items-center justify-center overflow-hidden bg-gradient-to-tr ${isAdmin ? 'from-blue-600 to-blue-400' : 'from-[#387ed1] to-[#64b5f6]'}`}>
          <div className={`w-full h-full rounded-full flex items-center justify-center border-2 border-white/50 shadow-inner bg-gradient-to-b ${isAdmin ? 'from-gray-800 to-black' : 'from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900'}`}>
            <svg viewBox="0 0 100 100" className="w-8 h-8 drop-shadow-md">
              <path d="M50 10 L85 45 L50 90 L15 45 Z" fill={isAdmin ? '#2563eb' : '#387ed1'} />
              <path d="M50 10 L65 30 L50 45 L35 30 Z" fill={isAdmin ? '#3b82f6' : '#4caf50'} />
            </svg>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {isAdmin && <ShieldCheck className="text-blue-500" size={20} />}
          <h1 className={`text-3xl font-black tracking-tighter italic uppercase ${isAdmin ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
            {isAdmin ? 'Staff' : 'Kitetrade'} <span className={isAdmin ? 'text-blue-500' : 'text-[#387ed1]'}>{isAdmin ? 'Terminal' : 'PRO'}</span>
          </h1>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {isAdmin ? 'Accessing Secure Administrative Layer' : 'Enter your Email or Mobile to continue'}
        </p>
      </div>

      <form onSubmit={handleLoginAttempt} className={`space-y-6 ${isShaking ? 'animate-shake' : ''}`}>
        <div className="relative group">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
            {isAdmin ? 'Administrator ID' : 'Email or Mobile Number'}
          </label>
          <input 
            type="text" 
            autoComplete="username"
            autoFocus
            className={`w-full border-b py-3 bg-transparent outline-none transition-all text-xl placeholder:text-gray-300 dark:placeholder:text-gray-700 ${
              error ? 'border-red-500 focus:border-red-600' : `border-gray-200 dark:border-gray-800 focus:border-${isAdmin ? 'blue-500' : '[#387ed1]'}`
            }`}
            placeholder={isAdmin ? "Staff ID" : "Email or Mobile Number"}
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setError(null); }}
          />
        </div>

        <div className="flex justify-between items-center py-2">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
            <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
              rememberMe ? (isAdmin ? 'bg-blue-600 border-blue-600' : 'bg-[#387ed1] border-[#387ed1]') : 'border-gray-300 dark:border-gray-700 group-hover:border-[#387ed1]'
            }`}>
              {rememberMe && <Check size={12} className="text-white" />}
            </div>
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">Remember Me</span>
          </div>
          <button type="button" onClick={onForgot} className={`${isAdmin ? 'text-blue-500' : 'text-[#387ed1]'} text-[11px] font-bold uppercase tracking-wide hover:underline`}>
            Forgot Details?
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[#df514c] text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={!userId}
          className={`w-full py-4 rounded-xl font-bold text-lg mt-2 transition-all shadow-sm flex items-center justify-center gap-2 ${
            (!userId) 
              ? (isAdmin ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed') 
              : (isAdmin ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-[#387ed1] text-white hover:bg-[#2F6FC1] shadow-lg shadow-blue-500/20')
          }`}
        >
          {isAdmin ? 'ACCESS TERMINAL' : 'CONTINUE'} <ArrowRight size={18} />
        </button>
      </form>

      {/* Quick Access Section */}
      {recentAccounts.length > 0 && (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Recent {isAdmin ? 'Staff' : 'Accounts'}</h3>
             <button onClick={() => { setUserId(''); }} className={`text-[10px] ${isAdmin ? 'text-blue-500' : 'text-[#387ed1]'} font-black uppercase tracking-widest`}>Switch Account</button>
          </div>
          <div className="space-y-3">
             {recentAccounts.map((acc, idx) => (
               <div 
                 key={acc + idx}
                 onClick={() => { setUserId(acc); handleLoginAttempt(undefined, acc); }}
                 className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${isAdmin ? 'hover:border-blue-500 bg-white/5 border-gray-800 hover:bg-white/10' : 'hover:border-[#387ed1] bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
               >
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAdmin ? 'bg-blue-500/10 text-blue-500' : 'bg-[#387ed1]/10 text-[#387ed1]'}`}>
                      {isAdmin ? <ShieldCheck size={20} /> : <User size={20} />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold truncate max-w-[150px] ${isAdmin ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{acc}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-medium">{isAdmin ? 'Administrator' : 'Standard User'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all" onClick={(e) => removeRecent(acc, e)}>
                     <X size={16} />
                   </div>
                   <ArrowRight size={16} className={isAdmin ? 'text-blue-500' : 'text-[#387ed1]'} />
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-10 pb-6 flex flex-col items-center gap-6">
        {!isAdmin && (
          <div className="w-full pt-6 border-t flex flex-col items-center border-gray-50 dark:border-gray-800 space-y-4">
             <div className="w-full">
               <p className="text-gray-500 text-center text-[11px] mb-4 uppercase font-bold tracking-widest">New to Kitetrade?</p>
               <button 
                  type="button"
                  onClick={onSignUp}
                  className="w-full h-[52px] bg-white dark:bg-gray-900 border border-[#387ed1] text-[#387ed1] rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center"
                >
                  Sign up
                </button>
             </div>
             
             {onToggleAdmin && (
               <div className="w-full">
                 <button 
                    type="button"
                    onClick={onToggleAdmin}
                    className="w-full flex items-center justify-center gap-2 py-3 text-gray-300 dark:text-gray-700 hover:text-blue-500 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    <Lock size={12} /> Admin Login
                  </button>
               </div>
             )}
          </div>
        )}
        
        {isAdmin && !hasRegistered && (
          <div className="w-full pt-6 border-t flex flex-col items-center border-gray-800">
             <p className="text-gray-500 text-[11px] mb-4 uppercase font-bold tracking-widest">Employee onboarding</p>
             <button 
                type="button"
                onClick={onSignUp}
                className="w-full h-[52px] bg-transparent border border-blue-500 text-blue-500 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-blue-500/10 transition-all flex items-center justify-center"
              >
                Request Access
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
