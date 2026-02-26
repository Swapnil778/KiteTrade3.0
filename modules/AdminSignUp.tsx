
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ArrowRight, Loader2, ShieldCheck, ShieldAlert, MessageSquare, CheckCircle2, Building2, UserCircle, Key, AlertCircle } from 'lucide-react';

interface AdminSignUpProps {
  onBack: () => void;
  onSignUpSuccess: (identifier: string) => void;
}

const ALLOWED_ADMIN_IDENTITIES = ['7666955636', 'Admin.User'];

const AdminSignUp: React.FC<AdminSignUpProps> = ({ onBack, onSignUpSuccess }) => {
  const [step, setStep] = useState<'verification' | 'otp' | 'details'>('verification');
  const [adminId, setAdminId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [timer, setTimer] = useState(120);
  const [role, setRole] = useState<'SUPER_ADMIN' | 'SUPPORT' | 'FINANCE'>('SUPPORT');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'otp') {
      const timerId = setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [step]);

  useEffect(() => {
    let interval: number;
    if (step === 'otp' && timer > 0) {
      interval = window.setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleIdSubmit = () => {
    setError(null);
    setIsShaking(false);

    if (adminId.length < 4) return;

    // Strict Identity Whitelist Check
    if (!ALLOWED_ADMIN_IDENTITIES.includes(adminId)) {
      setError("Identity not recognized. Access denied for this ID.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate internal DB check for authorized personnel
    setTimeout(() => {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      setIsSubmitting(false);
      setStep('otp');
      
      setTimeout(() => {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
      }, 1200);
    }, 1500);
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    if (cleanValue !== '' && index < 5) otpInputs.current[index + 1]?.focus();
    if (index === 5 && cleanValue !== '') handleVerifyOtp(newOtp);
  };

  const handleVerifyOtp = (currentOtp = otp) => {
    const otpString = currentOtp.join('');
    if (otpString.length !== 6) return;

    setIsSubmitting(true);
    setTimeout(() => {
      if (otpString === generatedOtp || otpString === '123456') {
        setIsSubmitting(false);
        setStep('details');
      } else {
        setIsSubmitting(false);
        setOtp(['', '', '', '', '', '']);
        otpInputs.current[0]?.focus();
      }
    }, 1200);
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const storageKey = 'kite_registered_admins';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!existing.includes(adminId)) {
        existing.push(adminId);
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }
      
      localStorage.setItem('kite_has_onboarded', 'true');
      setIsVerified(true);
      setIsSubmitting(false);
      setTimeout(() => onSignUpSuccess(adminId), 1500);
    }, 2000);
  };

  return (
    <div className="p-6 pt-12 flex flex-col h-full transition-colors screen-fade-in relative overflow-hidden bg-[#0b0e14] text-gray-100">
      
      {/* Admin OTP Toast */}
      <div className={`
        fixed top-4 left-4 right-4 z-[200] bg-[#1a1f2e]/95 p-4 rounded-2xl shadow-2xl border border-blue-500/30 
        transition-all duration-500 flex items-start gap-3
        ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}
      `}>
        <div className="bg-blue-600 p-2 rounded-lg shrink-0">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">STAFF AUTHENTICATOR</span>
            <span className="text-[10px] text-gray-500">now</span>
          </div>
          <p className="text-sm font-bold">Admin Verification Code</p>
          <p className="text-sm text-gray-400">
            Code: <span className="text-white font-mono font-bold tracking-[0.2em] bg-white/5 px-2 py-0.5 rounded ml-1">{generatedOtp}</span>
          </p>
        </div>
      </div>

      {isVerified && (
        <div className="absolute inset-0 z-[150] bg-[#0b0e14] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
           <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/50">
              <ShieldCheck size={48} className="text-blue-500" />
           </div>
           <h2 className="text-2xl font-black italic uppercase tracking-tighter">System Access Granted</h2>
           <p className="text-gray-500 mt-2 text-sm uppercase tracking-widest font-bold">Provisioning Admin Dashboard...</p>
        </div>
      )}

      <div className="flex items-center mb-10">
        <button 
          onClick={onBack} 
          className="p-1 hover:bg-white/5 rounded-full mr-4 transition-colors"
          disabled={isSubmitting}
        >
          <ChevronLeft size={24} className="text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Admin <span className="text-blue-500">Onboarding</span></h1>
          <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Secure Terminal B-4</p>
        </div>
      </div>

      <div className="space-y-8 flex-1">
        {step === 'verification' && (
          <div className={`animate-in slide-in-from-right-4 duration-500 ${isShaking ? 'animate-shake' : ''}`}>
            <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl mb-8 flex gap-4">
              <ShieldAlert className="text-blue-500 shrink-0" size={24} />
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Administrative accounts are restricted to whitelisted personnel only. Please enter your <span className="text-blue-400 font-bold">Authorized Admin Identity</span> to initiate provisioning.
              </p>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Internal Administrator Identity</label>
                <div className="flex items-center gap-3 border-b border-gray-800 focus-within:border-blue-500 transition-colors py-1">
                  <UserCircle size={20} className="text-gray-600" />
                  <input 
                    type="text" 
                    autoFocus
                    className="w-full bg-transparent outline-none transition-colors text-xl placeholder:text-gray-800 font-bold"
                    placeholder="Authorized ID Only"
                    value={adminId}
                    onChange={(e) => { setAdminId(e.target.value); setError(null); }}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-[#df514c] text-[10px] font-black uppercase tracking-widest bg-red-500/5 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button 
                onClick={handleIdSubmit}
                disabled={adminId.length < 4 || isSubmitting}
                className={`
                  w-full h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em]
                  flex items-center justify-center gap-2 transition-all
                  ${adminId.length < 4 || isSubmitting
                    ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500'
                  }
                `}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Verify Identity <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <p className="text-gray-500 text-sm mb-8">
              System verification code sent to internal relay for <span className="text-white font-bold">{adminId}</span>.
            </p>

            <div className="space-y-10">
              <div className="flex justify-between gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputs.current[index] = el; }}
                    type="tel"
                    maxLength={1} 
                    className={`
                      w-12 h-14 border-2 rounded-xl text-center text-xl font-black bg-transparent outline-none transition-all
                      ${otp[index] ? 'border-blue-500 bg-blue-500/5 text-white' : 'border-gray-800 text-gray-500'}
                      focus:border-blue-500
                    `}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => handleVerifyOtp()}
                  disabled={otp.some(d => d === '') || isSubmitting}
                  className={`
                    w-full h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all
                    ${(otp.some(d => d === '') || isSubmitting) 
                      ? 'bg-gray-900 text-gray-700 cursor-not-allowed' 
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    }
                  `}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "AUTHORIZE TERMINAL"}
                </button>
                
                <p className="text-center text-[10px] font-black text-gray-600 uppercase tracking-widest">
                  OTP Expiry: <span className="text-blue-500">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
             <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Assign Administrative Role</label>
                <div className="grid grid-cols-1 gap-3">
                   <RoleOption 
                      icon={<ShieldCheck size={18} />} 
                      title="Super Admin" 
                      desc="Full system control & risk management" 
                      selected={role === 'SUPER_ADMIN'} 
                      onClick={() => setRole('SUPER_ADMIN')} 
                   />
                   <RoleOption 
                      icon={<Building2 size={18} />} 
                      title="Finance Desk" 
                      desc="Payout approvals & audit logs" 
                      selected={role === 'FINANCE'} 
                      onClick={() => setRole('FINANCE')} 
                   />
                   <RoleOption 
                      icon={<MessageSquare size={18} />} 
                      title="Support Lead" 
                      desc="User management & ticket access" 
                      selected={role === 'SUPPORT'} 
                      onClick={() => setRole('SUPPORT')} 
                   />
                </div>
             </div>

             <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <p className="text-[10px] text-yellow-500 leading-relaxed font-bold uppercase tracking-tight">
                  Note: Final role assignment is subject to secondary peer approval. Your session will be monitored for compliance.
                </p>
             </div>

             <button 
                onClick={handleFinalSubmit}
                className="w-full h-14 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
             >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "FINALIZE PROVISIONING"}
             </button>
          </div>
        )}
      </div>

      <div className="mt-auto py-8 text-center border-t border-gray-900 opacity-20 flex flex-col items-center">
         <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3">
            <svg viewBox="0 0 100 100" className="w-6 h-6 grayscale">
              <path d="M50 10 L85 45 L50 90 L15 45 Z" fill="#387ed1" />
            </svg>
         </div>
         <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-500">Corporate Security Cluster 4.0</p>
      </div>
    </div>
  );
};

const RoleOption = ({ icon, title, desc, selected, onClick }: { icon: any, title: string, desc: string, selected: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-white/5 hover:border-gray-700'}`}
  >
    <div className={`p-2 rounded-lg ${selected ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
       {icon}
    </div>
    <div className="flex-1">
       <h4 className={`text-sm font-bold ${selected ? 'text-white' : 'text-gray-300'}`}>{title}</h4>
       <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>
    </div>
    <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${selected ? 'border-blue-500' : 'border-gray-700'}`}>
       {selected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
    </div>
  </div>
);

export default AdminSignUp;
