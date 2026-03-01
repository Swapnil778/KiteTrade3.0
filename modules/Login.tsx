
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, AlertCircle, Check, ArrowRight, User, X, ShieldCheck, Lock, Loader2, MessageSquare, Clock, RefreshCcw } from 'lucide-react';
import { apiRequest } from '../services/apiService';

interface LoginProps {
  onLogin: (isAdmin?: boolean, identifier?: string) => void;
  onForgot: () => void;
  onSignUp: () => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onForgot, onSignUp, isAdmin, onToggleAdmin }) => {
  const [userId, setUserId] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [recentAccounts, setRecentAccounts] = useState<string[]>([]);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storageKey = isAdmin ? 'kite_registered_admins' : 'kite_registered_users';
    let saved = [];
    try {
      const savedStr = localStorage.getItem(storageKey);
      if (savedStr) {
        saved = JSON.parse(savedStr);
        if (!Array.isArray(saved)) saved = [];
      }
    } catch (e) {
      saved = [];
    }
    setRecentAccounts(saved);

    const onboarded = localStorage.getItem('kite_has_onboarded') === 'true';
    setHasOnboarded(onboarded);

    const savedUserId = localStorage.getItem(isAdmin ? 'kite_saved_adminid' : 'kite_saved_userid');
    if (savedUserId) {
      setUserId(savedUserId);
      setRememberMe(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e?: React.FormEvent, directId?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setIsShaking(false);
    
    const inputId = (directId || userId).trim();

    if (!inputId) {
      setError(`Please enter ${isAdmin ? 'Admin ID' : 'Email or Mobile'}`);
      return;
    }

    // Basic format validation
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputId);
    const isPhone = /^\d{10}$/.test(inputId) || inputId === 'demo';
    
    if (!isEmail && !isPhone) {
      setError("Please enter a valid email or 10-digit mobile number");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiRequest<any>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier: inputId })
      });
      
      setGeneratedOtp(data.code || null);
      setStep('otp');
      setTimer(60);
      if (data.code) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
      }
    } catch (err: any) {
      console.error("OTP send error:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) return;

    setError(null);
    setIsVerifying(true);
    try {
      const data = await apiRequest<any>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier: userId, code: otpString, isAdmin })
      });
      
      if (data.status === 'success') {
        if (!data.userExists) {
          setError("Account not found. Please sign up first.");
          setStep('identifier');
          return;
        }

        localStorage.setItem('kite_has_onboarded', 'true');
        
        // Update local storage to remember this user
        const storageKey = isAdmin ? 'kite_registered_admins' : 'kite_registered_users';
        let registeredUsers = [];
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            registeredUsers = JSON.parse(saved);
            if (!Array.isArray(registeredUsers)) registeredUsers = [];
          }
        } catch (e) {
          registeredUsers = [];
        }

        if (!registeredUsers.includes(userId)) {
          registeredUsers.push(userId);
          localStorage.setItem(storageKey, JSON.stringify(registeredUsers));
        }

        if (rememberMe) {
          localStorage.setItem(isAdmin ? 'kite_saved_adminid' : 'kite_saved_userid', userId);
        } else {
          localStorage.removeItem(isAdmin ? 'kite_saved_adminid' : 'kite_saved_userid');
        }
        
        localStorage.setItem('kite_is_logged_in', 'true');
        onLogin(isAdmin, userId);
      }
    } catch (err: any) {
      console.error("OTP verify error:", err);
      setError(err.message || "Invalid OTP. Please try again.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      // Auto submit if needed or wait for button
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    <div className={`p-8 pt-16 flex flex-col h-full transition-colors relative screen-fade-in overflow-y-auto hide-scrollbar ${isAdmin ? 'bg-[#0b0e14] text-gray-100' : 'bg-white text-gray-800 dark:bg-black dark:text-gray-100'}`}>
      
      {/* Dev Notification for OTP */}
      {showNotification && generatedOtp && (
        <div className="fixed top-6 left-6 right-6 z-[100] animate-in slide-in-from-top-4 duration-500">
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <MessageSquare size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Security Alert (Dev Mode)</p>
              <p className="text-sm font-bold">Your login OTP is: <span className="text-lg font-black tracking-[0.2em] ml-1">{generatedOtp}</span></p>
            </div>
            <button onClick={() => setShowNotification(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-16">
        <button 
          onClick={step === 'otp' ? () => setStep('identifier') : (isAdmin ? onToggleAdmin : onForgot)}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 active:scale-90 transition-all"
        >
          <ChevronLeft size={22} className="text-gray-600 dark:text-gray-400" />
        </button>
        
        {/* Logo */}
        <div className={`relative w-16 h-16 rounded-[22px] p-0.5 shadow-2xl flex items-center justify-center overflow-hidden bg-gradient-to-tr ${isAdmin ? 'from-blue-600 to-blue-400' : 'from-brand-600 to-brand-400'}`}>
          <div className={`w-full h-full rounded-[20px] flex items-center justify-center border-2 border-white/20 shadow-inner bg-gradient-to-b ${isAdmin ? 'from-gray-800 to-black' : 'from-gray-100 to-gray-300 dark:from-gray-800 dark:to-black'}`}>
            <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-lg">
              <path d="M50 10 L85 45 L50 90 L15 45 Z" fill={isAdmin ? '#2563eb' : '#387ed1'} />
              <path d="M50 10 L65 30 L50 45 L35 30 Z" fill={isAdmin ? '#3b82f6' : '#10b981'} />
            </svg>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          {isAdmin && <ShieldCheck className="text-blue-500" size={24} />}
          <h1 className={`text-4xl font-black tracking-tighter italic uppercase ${isAdmin ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {step === 'identifier' ? (isAdmin ? 'Staff' : 'Kitetrade') : 'Verify'} <span className={isAdmin ? 'text-blue-500' : 'text-brand-500'}>{step === 'identifier' ? (isAdmin ? 'Terminal' : 'PRO') : 'Identity'}</span>
          </h1>
        </div>
        <p className="text-base font-bold text-gray-400 dark:text-gray-500 tracking-tight">
          {step === 'identifier' 
            ? (isAdmin ? 'Accessing Secure Administrative Layer' : 'Enter your Email or Mobile to continue')
            : `We've sent a 6-digit code to ${userId.includes('@') ? userId : `+91 ${userId}`}`}
        </p>
      </div>

      {step === 'identifier' ? (
        <form onSubmit={handleSendOtp} className={`space-y-8 ${isShaking ? 'animate-shake' : ''}`}>
          <div className="relative group">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">
              {isAdmin ? 'Administrator ID' : 'Email or Mobile Number'}
            </label>
            <input 
              type="text" 
              autoComplete="username"
              autoFocus
              className={`w-full border-b-2 py-4 bg-transparent outline-none transition-all text-2xl font-bold placeholder:text-gray-200 dark:placeholder:text-gray-800 ${
                error ? 'border-kiteRed focus:border-kiteRed' : `border-gray-100 dark:border-gray-900 focus:border-${isAdmin ? 'blue-500' : 'brand-500'}`
              }`}
              placeholder={isAdmin ? "Staff ID" : "Email or Mobile Number"}
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setError(null); }}
            />
          </div>

          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
              <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${
                rememberMe ? (isAdmin ? 'bg-blue-600 border-blue-600' : 'bg-brand-500 border-brand-500') : 'border-gray-200 dark:border-gray-800 group-hover:border-brand-500'
              }`}>
                {rememberMe && <Check size={14} className="text-white" strokeWidth={3} />}
              </div>
              <span className="text-xs text-gray-500 font-black uppercase tracking-widest">Remember Me</span>
            </div>
            <button type="button" onClick={onForgot} className={`${isAdmin ? 'text-blue-500' : 'text-brand-500'} text-xs font-black uppercase tracking-widest hover:underline`}>
              Forgot Details?
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-kiteRed text-sm font-black uppercase tracking-tight animate-in fade-in slide-in-from-top-1 duration-200 bg-kiteRed/5 p-4 rounded-2xl border border-kiteRed/10">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={!userId || isSubmitting}
            className={`w-full py-5 rounded-2xl font-black text-lg mt-4 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${
              (!userId || isSubmitting) 
                ? (isAdmin ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed') 
                : (isAdmin ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/25' : 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/25')
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (isAdmin ? 'ACCESS TERMINAL' : 'CONTINUE')} <ArrowRight size={20} strokeWidth={3} />
          </button>
        </form>
      ) : (
        <div className={`space-y-10 ${isShaking ? 'animate-shake' : ''}`}>
          <div className="flex justify-between gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { otpInputs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className={`w-12 h-16 text-center text-3xl font-black rounded-2xl border-2 bg-transparent outline-none transition-all ${
                  error ? 'border-kiteRed text-kiteRed' : `border-gray-100 dark:border-gray-900 focus:border-${isAdmin ? 'blue-500' : 'brand-500'} text-${isAdmin ? 'white' : 'gray-900 dark:text-white'}`
                }`}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-6">
            {timer > 0 ? (
              <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <Clock size={14} />
                Resend available in {formatTime(timer)}
              </div>
            ) : (
              <button 
                onClick={handleSendOtp}
                disabled={isSubmitting}
                className={`text-xs font-black uppercase tracking-widest ${isAdmin ? 'text-blue-500' : 'text-brand-500'} hover:underline flex items-center gap-2`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} />}
                Resend OTP
              </button>
            )}

            {error && (
              <div className="w-full flex items-center gap-2 text-kiteRed text-sm font-black uppercase tracking-tight animate-in fade-in slide-in-from-top-1 duration-200 bg-kiteRed/5 p-4 rounded-2xl border border-kiteRed/10">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button 
              onClick={handleVerifyOtp}
              disabled={otp.some(d => !d) || isVerifying}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${
                (otp.some(d => !d) || isVerifying) 
                  ? (isAdmin ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed') 
                  : (isAdmin ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/25' : 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/25')
              }`}
            >
              {isVerifying ? <Loader2 className="animate-spin" size={20} /> : 'VERIFY & LOGIN'} <ArrowRight size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Quick Access Section */}
      {recentAccounts.length > 0 && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex justify-between items-center mb-5">
             <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Recent {isAdmin ? 'Staff' : 'Accounts'}</h3>
             <button onClick={() => { setUserId(''); setStep('identifier'); }} className={`text-[11px] ${isAdmin ? 'text-blue-500' : 'text-brand-500'} font-black uppercase tracking-widest`}>Switch Account</button>
          </div>
          <div className="space-y-4">
             {recentAccounts.map((acc, idx) => (
               <div 
                 key={acc + idx}
                 onClick={() => { setUserId(acc); handleSendOtp(undefined, acc); }}
                 className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group shadow-soft ${isAdmin ? 'hover:border-blue-500 bg-white/5 border-gray-800 hover:bg-white/10' : 'hover:border-brand-500 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
               >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isAdmin ? 'bg-blue-500/10 text-blue-500' : 'bg-brand-500/10 text-brand-500'}`}>
                      {isAdmin ? <ShieldCheck size={24} /> : <User size={24} />}
                    </div>
                    <div>
                      <p className={`text-base font-black truncate max-w-[150px] tracking-tight ${isAdmin ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{acc}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">{isAdmin ? 'Administrator' : 'Standard User'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <button className="w-9 h-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-400 hover:text-kiteRed hover:bg-kiteRed/5 transition-all" onClick={(e) => removeRecent(acc, e)}>
                     <X size={18} />
                   </button>
                   <ArrowRight size={18} className={isAdmin ? 'text-blue-500' : 'text-brand-500'} strokeWidth={3} />
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-12 pb-8 flex flex-col items-center gap-8">
        {!isAdmin && (
          <div className="w-full pt-8 border-t flex flex-col items-center border-gray-50 dark:border-gray-900/50 space-y-6">
             <div className="w-full">
               <p className="text-gray-400 text-center text-[11px] mb-5 uppercase font-black tracking-widest">New to Kitetrade?</p>
               <button 
                  type="button"
                  onClick={onSignUp}
                  className="w-full h-[56px] bg-white dark:bg-black border-2 border-brand-500 text-brand-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-500 hover:text-white active:scale-95 transition-all flex items-center justify-center"
                >
                  Create Account
                </button>
             </div>
             
             {onToggleAdmin && (
               <div className="w-full">
                 <button 
                    type="button"
                    onClick={onToggleAdmin}
                    className="w-full flex items-center justify-center gap-2 py-4 text-gray-300 dark:text-gray-700 hover:text-blue-500 transition-colors text-[10px] font-black uppercase tracking-[0.25em]"
                  >
                    <Lock size={12} strokeWidth={3} /> Admin Login
                  </button>
               </div>
             )}
          </div>
        )}
        
        {isAdmin && !hasRegistered && (
          <div className="w-full pt-8 border-t flex flex-col items-center border-gray-800">
             <p className="text-gray-500 text-[11px] mb-5 uppercase font-black tracking-widest">Employee onboarding</p>
             <button 
                type="button"
                onClick={onSignUp}
                className="w-full h-[56px] bg-transparent border-2 border-blue-500 text-blue-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 hover:text-white active:scale-95 transition-all flex items-center justify-center"
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
