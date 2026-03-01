
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  Phone, 
  CreditCard, 
  Building2, 
  Key, 
  ShieldAlert, 
  ChevronRight,
  UserCheck,
  History,
  Loader2
} from 'lucide-react';
import { User } from '../types';
import { apiRequest } from '../services/apiService';

interface ProfileProps {
  onBack: () => void;
  user: User | null;
}

const Profile: React.FC<ProfileProps> = ({ onBack, user: initialUser }) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const identifier = localStorage.getItem('kite_current_user_id') || localStorage.getItem('kite_saved_userid');

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      if (!identifier) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest<User>('/api/auth/profile', {
          method: 'POST',
          body: JSON.stringify({ identifier })
        });
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [identifier]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-black">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  const displayName = user?.fullName || 'User Account';
  const displayEmail = user?.email || 'user@kite.pro';
  const displayPhone = user?.phone || 'Not provided';
  const displayId = user?.id || identifier || 'Unknown';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black transition-colors screen-fade-in">
      <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900 px-6 py-6 flex items-center gap-4 z-40 transition-colors">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 active:scale-90 transition-all">
          <ChevronLeft size={20} className="text-gray-900 dark:text-white" />
        </button>
        <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">User Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32 px-6 pt-8">
        {/* User Card */}
        <div className="bg-white dark:bg-gray-900 rounded-[32px] p-10 flex flex-col items-center mb-8 border border-gray-100 dark:border-gray-800 shadow-soft relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-emerald-500" />
          <div className="w-24 h-24 bg-brand-500 rounded-[28px] flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl shadow-brand-500/20 border-4 border-white dark:border-gray-800">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic text-center">{displayName}</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{displayId} • {displayEmail}</p>
          
          <div className={`flex items-center gap-2 mt-6 px-4 py-2 rounded-2xl border ${
            user?.kycStatus === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
            user?.kycStatus === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
            'bg-gray-500/10 border-gray-500/20 text-gray-500'
          }`}>
            {user?.kycStatus === 'VERIFIED' ? <UserCheck size={16} /> : <ShieldAlert size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              KYC {user?.kycStatus || 'NOT SUBMITTED'}
            </span>
          </div>
        </div>

        {/* Security Section */}
        <ProfileSection title="Security & Access" icon={<ShieldCheck size={16} className="text-brand-500"/>}>
          <ProfileRow label="Two-factor auth (2FA)" value="Enabled" isLink />
          <ProfileRow label="Password & Security" value="Manage" isLink />
          <ProfileRow label="Demat authorization (eDIS)" value="Active" isLink />
        </ProfileSection>

        {/* Identity Section */}
        <ProfileSection title="Identity Details" icon={<Smartphone size={16} className="text-brand-500"/>}>
          <ProfileRow label="Email" value={displayEmail} />
          <ProfileRow label="Phone" value={displayPhone} />
          <ProfileRow label="Registration" value={user?.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'N/A'} />
          {user?.kycDocuments?.find(d => d.type === 'PAN') && (
            <ProfileRow label="PAN" value={user.kycDocuments.find(d => d.type === 'PAN')?.number || 'N/A'} />
          )}
          <ProfileRow label="Support Code" value={displayId.slice(-4)} isCopyable />
        </ProfileSection>

        {/* Trade History Section */}
        <ProfileSection title="Activity Logs" icon={<History size={16} className="text-brand-500"/>}>
          <ProfileRow label="Last Login" value="Today, 10:45 AM" />
          <ProfileRow label="Login Device" value="Web Terminal" />
          <ProfileRow label="IP Address" value="103.45.21.***" />
        </ProfileSection>

      </div>
    </div>
  );
};

const ProfileSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-900 mb-6 p-6 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-soft transition-colors">
    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
      {icon} {title}
    </h3>
    <div className="space-y-5">
      {children}
    </div>
  </div>
);

const ProfileRow = ({ label, value, isLink, isCopyable }: { label: string, value: string, isLink?: boolean, isCopyable?: boolean }) => (
  <div className="flex justify-between items-center py-1 group">
    <span className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">{label}</span>
    <div className="flex items-center gap-2 cursor-pointer">
      <span className={`text-sm ${isLink ? 'text-brand-500 font-black uppercase tracking-widest hover:underline' : 'text-gray-900 dark:text-gray-100 font-black uppercase tracking-tight'}`}>{value}</span>
      {isLink && <ChevronRight size={14} className="text-brand-500" />}
      {isCopyable && <Key size={14} className="text-gray-400 group-hover:text-brand-500 transition-colors" />}
    </div>
  </div>
);

const SessionRow = ({ device, location, time }: { device: string, location: string, time: string }) => (
  <div className="flex justify-between items-center">
    <div>
      <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{device}</p>
      <p className="text-[10px] text-gray-400">{location}</p>
    </div>
    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">{time}</span>
  </div>
);

const CheckCircle = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Profile;
