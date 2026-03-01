
import React, { useState } from 'react';
import { ChevronLeft, Loader2, CheckCircle2, ShieldQuestion, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { apiRequest } from '../services/apiService';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setError(null);
    
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all security fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call for password reset
    const performReset = async () => {
      try {
        // In a real app, we'd call an endpoint like /api/auth/reset-password
        // For now, we'll simulate it but use apiRequest for consistency if we had an endpoint
        // await apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, password }) });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsSubmitting(false);
        setIsSuccess(true);
        
        // Auto-return to login after 3 seconds of showing success
        setTimeout(() => {
          onBack();
        }, 3000);
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || "Failed to reset password. Please try again.");
      }
    };

    performReset();
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-gray-900 transition-colors screen-fade-in">
        <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-[#4caf50]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Security Updated</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
          Your credentials have been successfully reset. You can now log in with your new password.
        </p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-8">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 h-full flex flex-col bg-white dark:bg-gray-900 transition-colors screen-fade-in">
      <div className="flex items-center mb-8">
        <button onClick={onBack} disabled={isSubmitting} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full mr-3 transition-colors">
          <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Reset Security</h1>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto hide-scrollbar">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter your registered email and your new password to regain access.
        </p>

        <div className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Registered Email</label>
            <div className="relative flex items-center border-b border-gray-200 dark:border-gray-800 focus-within:border-[#387ed1] transition-all">
              <Mail size={18} className="text-gray-400 absolute left-0" />
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className="w-full bg-transparent outline-none py-3 pl-8 text-lg dark:text-white transition-colors"
              />
            </div>
          </div>

          {/* New Password Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">New Password</label>
            <div className="relative flex items-center border-b border-gray-200 dark:border-gray-800 focus-within:border-[#387ed1] transition-all">
              <Lock size={18} className="text-gray-400 absolute left-0" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="w-full bg-transparent outline-none py-3 pl-8 pr-10 text-lg dark:text-white transition-colors"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 text-gray-400 hover:text-[#387ed1]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Confirm Password</label>
            <div className="relative flex items-center border-b border-gray-200 dark:border-gray-800 focus-within:border-[#387ed1] transition-all">
              <Lock size={18} className="text-gray-400 absolute left-0" />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                className="w-full bg-transparent outline-none py-3 pl-8 pr-10 text-lg dark:text-white transition-colors"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 text-gray-400 hover:text-[#387ed1]"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[#df514c] text-sm font-bold bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button 
          onClick={handleReset}
          disabled={isSubmitting || !email || !password || !confirmPassword}
          className={`
            w-full py-4 rounded-xl font-bold text-lg mt-8 mb-12 flex items-center justify-center gap-2 transition-all
            ${isSubmitting || !email || !password || !confirmPassword
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-[#387ed1] text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-500/20'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={22} />
              RESETTING SECURITY...
            </>
          ) : (
            'UPDATE PASSWORD'
          )}
        </button>

        <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/30 mb-8">
           <ShieldQuestion size={20} className="text-[#387ed1] shrink-0" />
           <p className="text-[11px] text-[#387ed1] leading-relaxed">
             Security reset will log out all other active sessions and notify you via your registered contact details.
           </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
