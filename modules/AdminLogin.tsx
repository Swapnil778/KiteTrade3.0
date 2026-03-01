
// Fix: Removed duplicate and erroneous React imports
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  AlertCircle, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Mail,
  Loader2,
  MessageSquare,
  Clock,
  RefreshCcw,
  X
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
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const savedAdminId = localStorage.getItem('kite_saved_adminid');
    if (savedAdminId) {
      setAdminId(savedAdminId);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsShaking(false);

    if (!adminId) {
      setError('Please enter your Admin ID');
      setIsShaking(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiRequest<any>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier: adminId })
      });
      
      setGeneratedOtp(data.code || null);
      setStep('otp');
      setTimer(60);
      if (data.code) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
      }
    } catch (err: any) {
      console.error("Admin OTP send error:", err);
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
        body: JSON.stringify({ identifier: adminId, code: otpString, isAdmin: true })
      });
      
      if (data.status === 'success') {
        if (!data.userExists) {
          setError("Admin account not found.");
          setStep('identifier');
          return;
        }

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
      console.error("Admin OTP verify error:", err);
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

  return (
    <div className="p-6 pt-12 flex flex-col h-full transition-colors relative screen-fade-in overflow-y-auto hide-scrollbar bg-[#0b0e14] text-gray-100">
      
      {/* Dev Notification for OTP */}
      {showNotification && generatedOtp && (
        <div className="fixed top-6 left-6 right-6 z-[100] animate-in slide-in-from-top-4 duration-500">
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <MessageSquare size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Security Alert (Dev Mode)</p>
              <p className="text-sm font-bold">Your admin OTP is: <span className="text-lg font-black tracking-[0.2em] ml-1">{generatedOtp}</span></p>
            </div>
            <button onClick={() => setShowNotification(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <button 
          onClick={step === 'otp' ? () => setStep('identifier') : onBackToUserLogin}
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
            {step === 'identifier' ? 'Staff' : 'Verify'} <span className="text-blue-500">{step === 'identifier' ? 'Terminal' : 'Identity'}</span>
          </h1>
        </div>
        <p className="text-sm font-medium text-gray-500">
          {step === 'identifier' 
            ? 'Accessing Secure Administrative Layer' 
            : `System verification code sent to internal relay for ${adminId}`}
        </p>
      </div>

      {step === 'identifier' ? (
        <form onSubmit={handleSendOtp} className={`space-y-6 ${isShaking ? 'animate-shake' : ''}`}>
          {/* Admin ID Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Administrator ID / Identity</label>
            <div className="relative flex items-center border-b border-gray-800 focus-within:border-blue-500 transition-all">
              <Mail size={18} className="text-gray-600 absolute left-0" />
              <input 
                type="text" 
                autoFocus
                disabled={isSubmitting}
                className="w-full bg-transparent outline-none py-3 pl-8 text-xl font-bold placeholder:text-gray-800"
                placeholder="Enter Authorized Identity"
                value={adminId}
                onChange={(e) => { setAdminId(e.target.value); setError(null); }}
              />
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
            disabled={isSubmitting || !adminId}
            className={`w-full py-4 rounded-xl font-bold text-lg mt-4 transition-all shadow-sm flex items-center justify-center gap-3 ${
              (!adminId || isSubmitting) 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                SENDING OTP...
              </>
            ) : (
              <>CONTINUE <ArrowRight size={18} /></>
            )}
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
                  error ? 'border-kiteRed text-kiteRed' : 'border-gray-800 focus:border-blue-500 text-white'
                }`}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-6">
            {timer > 0 ? (
              <div className="flex items-center gap-2 text-gray-600 font-bold uppercase tracking-widest text-[10px]">
                <Clock size={14} />
                Resend available in {formatTime(timer)}
              </div>
            ) : (
              <button 
                onClick={handleSendOtp}
                disabled={isSubmitting}
                className="text-xs font-black uppercase tracking-widest text-blue-500 hover:underline flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} />}
                Resend OTP
              </button>
            )}

            {error && (
              <div className="w-full flex items-center gap-2 text-[#df514c] text-sm font-bold bg-red-500/5 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              onClick={handleVerifyOtp}
              disabled={otp.some(d => !d) || isVerifying}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex items-center justify-center gap-3 ${
                (otp.some(d => !d) || isVerifying) 
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-[0.98]'
              }`}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  VERIFYING...
                </>
              ) : (
                <>VERIFY & LOGIN <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      )}

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
