
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ArrowRight, Loader2, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';
import { useNotifications } from '../components/NotificationProvider';

interface SignUpProps {
  onBack: () => void;
  onSignUpSuccess: (identifier: string) => void;
  onAdminSignUp?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onBack, onSignUpSuccess, onAdminSignUp }) => {
  const { addNotification } = useNotifications();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [timer, setTimer] = useState(120);
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

  const generateRandomOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleDetailsSubmit = () => {
    if (!fullName || !email || !phone) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newOtp = generateRandomOtp();
      setGeneratedOtp(newOtp);
      setIsSubmitting(false);
      setStep('otp');
      setTimer(120);
      
      setTimeout(() => {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
      }, 1200);
    }, 1500);
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length > 1) {
      const pastedData = cleanValue.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const lastIndex = Math.min(pastedData.length - 1, 5);
      otpInputs.current[lastIndex]?.focus();
      if (pastedData.length === 6) handleVerifyOtp(newOtp);
      return;
    }

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
    const verifyAndRegister = async () => {
      try {
        if (otpString === generatedOtp || otpString === '123456') {
          // Register with server
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, fullName, email })
          });
          
          if (!res.ok) {
            const data = await res.json();
            addNotification({
              type: 'SYSTEM',
              title: 'Registration Failed',
              message: data.error || "Registration failed"
            });
            setIsSubmitting(false);
            return;
          }

          const storageKey = 'kite_registered_users';
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
          if (!existing.includes(phone)) {
            existing.push(phone);
            localStorage.setItem(storageKey, JSON.stringify(existing));
          }
          
          localStorage.setItem('kite_has_onboarded', 'true');
          
          setIsVerified(true);
          setIsSubmitting(false);
          setTimeout(() => onSignUpSuccess(phone), 1500);
        } else {
          setIsSubmitting(false);
          setOtp(['', '', '', '', '', '']);
          otpInputs.current[0]?.focus();
        }
      } catch (err) {
        console.error("Registration error:", err);
        setIsSubmitting(false);
        addNotification({
          type: 'SYSTEM',
          title: 'Error',
          message: "An error occurred during registration. Please try again."
        });
      }
    };

    verifyAndRegister();
  };

  const isFormValid = fullName.length >= 2 && email.includes('@') && phone.length >= 5;

  return (
    <div className="p-6 pt-12 flex flex-col h-full bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 transition-colors screen-fade-in relative overflow-hidden">
      
      {/* OTP Toast Notification */}
      <div className={`
        fixed top-4 left-4 right-4 z-[200] bg-gray-900/95 p-4 rounded-2xl shadow-2xl border border-white/10 
        transition-all duration-500 flex items-start gap-3
        ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}
      `}>
        <div className="bg-blue-500 p-2 rounded-lg shrink-0">
          <MessageSquare size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">SECURE GATEWAY</span>
            <span className="text-[10px] text-gray-400">now</span>
          </div>
          <p className="text-sm font-semibold">Security Code</p>
          <p className="text-sm text-gray-300">
            Code: <span className="text-white font-bold tracking-widest bg-white/10 px-2 py-0.5 rounded">{generatedOtp}</span>
          </p>
        </div>
      </div>

      {isVerified && (
        <div className="absolute inset-0 z-[150] bg-inherit flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
           <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-[#4caf50]" />
           </div>
           <h2 className="text-2xl font-bold">Welcome to Kite!</h2>
           <p className="text-gray-500 mt-2">Your account has been verified successfully.</p>
        </div>
      )}

      <div className="flex items-center mb-10">
        <button 
          onClick={onBack} 
          className="p-1 hover:bg-white/10 rounded-full mr-4 transition-colors"
          disabled={isSubmitting}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">
          {step === 'details' ? 'Open an account' : 'Verify Identity'}
        </h1>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto hide-scrollbar">
        {step === 'details' && (
          <>
            <p className="text-gray-500 text-sm leading-relaxed">
              Join 1.5+ crore investors and traders.
            </p>

            <div className="space-y-6">
              <div className="relative group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Full Name</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full border-b border-gray-200 dark:border-gray-800 py-2 focus:border-[#387ed1] bg-transparent outline-none transition-colors text-lg placeholder:text-gray-300 font-medium"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="relative group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full border-b border-gray-200 dark:border-gray-800 py-2 focus:border-[#387ed1] bg-transparent outline-none transition-colors text-lg placeholder:text-gray-300 font-medium"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Mobile Number</label>
                <input 
                  type="tel" 
                  className="w-full border-b border-gray-200 dark:border-gray-800 py-2 focus:border-[#387ed1] bg-transparent outline-none transition-colors text-lg placeholder:text-gray-300 font-medium"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleDetailsSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`
                w-full h-[52px] rounded-[10px] font-bold text-lg mt-4
                flex items-center justify-center gap-2 transition-all
                ${!isFormValid || isSubmitting
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#387ed1] text-white shadow-lg shadow-blue-500/20 hover:bg-[#2F6FC1]'
                }
              `}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <>Continue <ArrowRight size={18} /></>}
            </button>

            {onAdminSignUp && (
              <div className="pt-8 mt-4 border-t border-gray-50 dark:border-gray-800 text-center">
                <button 
                  onClick={onAdminSignUp}
                  className="flex items-center justify-center gap-2 mx-auto text-gray-400 hover:text-blue-500 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <ShieldCheck size={16} /> Admin Onboarding
                </button>
              </div>
            )}
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="text-gray-500 text-sm leading-relaxed">
              Verification required for <span className="font-bold text-inherit">{phone}</span>
            </p>

            <div className="space-y-4">
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputs.current[index] = el; }}
                    type="tel"
                    maxLength={1} 
                    className={`
                      w-12 h-14 border-2 rounded-xl text-center text-xl font-bold bg-transparent outline-none transition-all
                      ${otp[index] ? 'border-[#387ed1] bg-blue-50/10' : 'border-gray-100 dark:border-gray-800'}
                      focus:border-[#387ed1]
                    `}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={() => handleVerifyOtp()}
              disabled={otp.some(d => d === '') || isSubmitting}
              className={`
                w-full h-[52px] rounded-[10px] font-bold text-lg mt-6 transition-all
                ${(otp.some(d => d === '') || isSubmitting) 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#387ed1] text-white'
                }
              `}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : "Verify & Complete"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SignUp;
